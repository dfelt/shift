package edu.cornell.cordovaocr;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Arrays;
import java.util.List;

import org.apache.cordova.api.CallbackContext;
import org.apache.cordova.api.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.ContentResolver;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Bitmap.Config;
import android.graphics.BitmapFactory;
import android.graphics.Rect;
import android.net.Uri;
import android.util.Log;

import com.googlecode.tesseract.android.ResultIterator;
import com.googlecode.tesseract.android.TessBaseAPI;

public class Ocr extends CordovaPlugin {
	private static final String TAG = "Tesseract";
	
    private static final String DEFAULT_LANG = "eng";
    
    private static final String TESSDATA_PATH = "tessdata";

    private static final String GET_TEXT = "getText";
    private static final String GET_WORDS = "getWords";
    private static final String GET_WORD_BOXES = "getWordBoxes";
    
    private static final int BYTES_PER_PIXEL = 4;
    private static final int BITMAP_MEM_LIMIT = 5000000;
    
    String action;
    JSONArray args;
    CallbackContext callbackContext;
    
	TessBaseAPI tess;
	Bitmap image;
	Uri imageUri;
	int imageScale;
	
	public Ocr() {
	}
	
	@Override
	public boolean execute(String action, JSONArray args, CallbackContext callbackContext) {
		if (!Arrays.asList(GET_TEXT, GET_WORDS, GET_WORD_BOXES).contains(action)) {
			return false;
		}
		
		this.action = action;
		this.args = args;
		this.callbackContext = callbackContext;
		
		cordova.getThreadPool().execute(new Runnable() {
			public void run() {
				try {
					executeAsync();
				} catch (Exception e) {
					e.printStackTrace();
					Ocr.this.callbackContext.error(e.toString());
				}
			}
		});
		
		return true;
	}
	
	public void executeAsync() throws JSONException, FileNotFoundException, IOException {
		if (tess == null) {
			tess = new TessBaseAPI();
	        tess.init(getTessPath(), DEFAULT_LANG);
		}
		
		Log.d(TAG, "Image URI: " + args.getString(0));
		
		setOptions(args.optJSONObject(1));
		setImage(args.getString(0));
		
		Log.d(TAG, "Executing action: " + action);

		
		if (GET_TEXT.equals(action)) {
	        callbackContext.success(tess.getUTF8Text());
		}
		else if (GET_WORDS.equals(action)) {
			// We need to force recognition before we can iterate over the words
			tess.getUTF8Text();

			JSONArray result = getWordBoxes(tess.getWords().getBoxRects(), imageScale);
			
			final int rilWord = TessBaseAPI.PageIteratorLevel.RIL_WORD;
			ResultIterator it = tess.getResultIterator();
			it.begin();
			for (int i = 0; i < result.length(); i++, it.next(rilWord)) {
				JSONObject word = result.getJSONObject(i);
				word.put("text", it.getUTF8Text(rilWord));
				word.put("confidence", it.confidence(rilWord));
			}
			
			callbackContext.success(result);
		}
		else if (GET_WORD_BOXES.equals(action)) {
			JSONArray result = getWordBoxes(tess.getWords().getBoxRects(), imageScale);
			callbackContext.success(result);
		}
	}

	/** Apply configuration options */
	private void setOptions(JSONObject options) throws JSONException {
		if (options == null) { return; }
		
		int pageSegMode = options.optInt("pageSegMode", -1);
		if (pageSegMode != -1) {
			tess.setPageSegMode(pageSegMode);
		}
		
		String whiteList = options.optString("whiteList");
		if (whiteList != null) {
			tess.setVariable(TessBaseAPI.VAR_CHAR_WHITELIST, whiteList);
		}
		
		String blackList = options.optString("blackList");
		if (blackList != null) {
			tess.setVariable(TessBaseAPI.VAR_CHAR_BLACKLIST, blackList);
		}
		
		JSONObject r = options.optJSONObject("rectangle");
		if (r != null) {
			tess.setRectangle(r.getInt("x"), r.getInt("y"), r.getInt("width"), r.getInt("height"));
		}
	}
	
	// Attempts to set the image for Tesseract.
	private void setImage(String uriString) throws FileNotFoundException {
		// Get image URI
		Uri uri = Uri.parse(uriString);
		
		// If Tesseract not already using this image, we set it now
		if (!uri.equals(imageUri)) {
			Log.d(TAG, "Setting new image in Tesseract");
			// Remove old bitmap to make space for the new
			if (image != null) {
				tess.clear();
				image.recycle();
				// Set nulls so we aren't in undefined state if tess.setImage fails
				image = null;
				imageUri = null;
			}
			// Get bitmap
			Bitmap bmp = getBitmap(uri);
			if (bmp == null) {
				throw new IllegalArgumentException("Invalid image format");
			}
			// Set bitmap
	        tess.setImage(bmp);
	        image = bmp;
			imageUri = uri;
		}
	}
	
	private Bitmap getBitmap(Uri imageUri) throws FileNotFoundException {
		// Get bitmap size without loading bitmap
		BitmapFactory.Options opts = new BitmapFactory.Options();
		opts.inJustDecodeBounds = true;
		ContentResolver cr = this.webView.getContext().getContentResolver();
		BitmapFactory.decodeStream(cr.openInputStream(imageUri), null, opts);
		double bitmapMem = (double) opts.outWidth * opts.outHeight * BYTES_PER_PIXEL;
		
		// Determine scaling factor; need to round up to nearest power of 2
		// using formula 2^ceil(log_2(scale))
		double scale = Math.sqrt(Math.max(1, bitmapMem / BITMAP_MEM_LIMIT));
		imageScale = 1 << (int) Math.ceil(Math.log(scale)/Math.log(2));
		Log.d(TAG, String.format("bitmapMem = %d; scale = %d\n", (int) bitmapMem, imageScale));
		
		opts.inSampleSize = imageScale;
		opts.inJustDecodeBounds = false;
		opts.inPreferredConfig = Config.ARGB_8888;
		return BitmapFactory.decodeStream(cr.openInputStream(imageUri), null, opts);
	}
	
	private String getTessPath() throws IOException {
		
		Context ctx = this.webView.getContext();
		String[] files = ctx.getAssets().list(TESSDATA_PATH);
		File dir = ctx.getFilesDir();
		File tessdata = new File(dir, TESSDATA_PATH);
		tessdata.mkdirs();

		// Move data files from assets to filesystem
		for (String fileName : files) {
			File file = new File(tessdata, fileName);
			Log.d(TAG, "Moving file: " + file);
			if (file.exists()) { continue; }
			
			Log.d(TAG, "Doesn't exist");
			InputStream in = ctx.getAssets().open(TESSDATA_PATH + File.separator + fileName);
			OutputStream out = new FileOutputStream(file);
			
			byte[] buffer = new byte[1024];
			int len = 0;
			while ((len = in.read(buffer)) != -1) {
			    out.write(buffer, 0, len);
			}
			in.close();
			out.close();
		}
		
		return ctx.getFilesDir().getAbsolutePath();
	}
	
	private static JSONArray getWordBoxes(List<Rect> rects, int scale) throws JSONException {
		JSONArray result = new JSONArray();
		for (int i = 0; i < rects.size(); i++) {
			Rect r = rects.get(i);
			JSONObject box = new JSONObject();
			box.put("x", scale * r.left);
			box.put("y", scale * r.top);
			box.put("w", scale * r.width());
			box.put("h", scale * r.height());
			Log.d(TAG, box.toString());
			result.put(box);
		}
		return result;
	}
}