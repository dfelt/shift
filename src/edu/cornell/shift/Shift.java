/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
 */

package edu.cornell.shift;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;

import org.apache.cordova.*;
import org.json.JSONObject;

public class Shift extends DroidGap {
	
	public static final String ACTION_GENERIC_OCR = "edu.cornell.shift.GENERIC_OCR";
	public static final String ACTION_SCALE_OCR = "edu.cornell.shift.SCALE_OCR";
	
	private boolean isService;
	
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		
		// Initialize this.appView
		this.init();

        this.appView.clearCache(true);
        this.appView.clearHistory();
        
		Log.d("Shift", "Got intent: " + getIntent());
		String act = getIntent().getAction();
        if (act.equals(ACTION_GENERIC_OCR)) {
        	runOcr("generic");
        } else if (act.equals(ACTION_SCALE_OCR)) {
        	runOcr("scale");
        } else {
    		// Set by <content src="index.html" /> in config.xml
    		//loadUrl(Config.getStartUrl());
    		loadUrl(Config.getStartUrl());
        }
	}
	
	private void runOcr(String ocrType) {
		appView.setWebViewClient(new CordovaWebViewClient(this, appView) {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                Log.d("Shift", "shouldOverrideUrlLoading " + url);
                if(url.startsWith("app://ocr")) {
                	Uri uri = Uri.parse(url);
                	String success = uri.getQueryParameter("success");
                	String message = uri.getQueryParameter("message");
                	if ("true".equals(success)) {
                    	Log.d("Shift", "OCR success! " + message);
                    	
                    	Intent result = new Intent();
                    	result.putExtra("score", 5.0);
                    	setResult(Activity.RESULT_OK, result);
                    	finish();
                	} else {
                    	Log.d("Shift", "OCR error! " + message);

                    	Intent result = new Intent();
                    	result.putExtra("score", 0.0);
                    	setResult(Activity.RESULT_CANCELED, result);
                    	finish();
                	}
                	return true;
                } else {
                	return super.shouldOverrideUrlLoading(view, url);
                }
            }
		});
		loadUrl(Config.getStartUrl() + "#ocr-options?service=true&ocrtype=" + ocrType);
	}
}
