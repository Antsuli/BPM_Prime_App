package com.example.bpmapp; // Ensure this matches your actual package name at the top

import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Create the WebView
        WebView myWebView = new WebView(this);
        setContentView(myWebView);

        // Configure settings
        WebSettings webSettings = myWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true); // Required for your History feature
        webSettings.setDatabaseEnabled(true);
        webSettings.setAllowFileAccess(true);

        // Allow audio to play without user clicking first (for your beep)
        webSettings.setMediaPlaybackRequiresUserGesture(false);

        // Force links to open inside the app, not in Chrome
        myWebView.setWebViewClient(new WebViewClient());
        myWebView.setWebChromeClient(new WebChromeClient());

        // Load your fabulous local file
        myWebView.loadUrl("file:///android_asset/index.html");
    }
}