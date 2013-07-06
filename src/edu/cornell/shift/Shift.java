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

import org.apache.cordova.Config;
import org.apache.cordova.CordovaWebViewClient;
import org.apache.cordova.DroidGap;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.webkit.WebView;

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
        	runOcr("eng");
        } else if (act.equals(ACTION_SCALE_OCR)) {
        	runOcr("7seg");
        } else {
    		// Set by <content src="index.html" /> in config.xml
    		//loadUrl(Config.getStartUrl());
    		loadUrl(Config.getStartUrl());
        }
	}
	
	private void runOcr(String lang) {
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
                    	generateResult(message);
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
		loadUrl(Config.getStartUrl() + "#ocr-options?service=true&lang=" + lang);
	}
	
	private void generateResult(String message) {
    	Intent result = new Intent();
		String act = getIntent().getAction();
		if (act.equals(ACTION_GENERIC_OCR)) {
			result.putExtra("text", message);
		} else if (act.equals(ACTION_SCALE_OCR)) {
			// Ohmage requires that we send back "score" variable, so we put
			// the weight in this value
			double score;
			try {
				score = Integer.parseInt(message);
			} catch (NumberFormatException e) {
				score = 0;
			}
	    	result.putExtra("score", score);
	    	setResult(Activity.RESULT_OK, result);
		}
	}
}
