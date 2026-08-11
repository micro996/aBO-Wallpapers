package com.wallpaper.gallery;

import android.app.WallpaperManager;
import android.content.ContentValues;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Environment;
import android.provider.MediaStore;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.File;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WallpaperPlugin")
public class WallpaperPlugin extends Plugin {

    @PluginMethod
    public void setWallpaper(PluginCall call) {
        String uriString = call.getString("uri");
        String location = call.getString("location"); // "HOME", "LOCK", "BOTH"

        if (uriString == null) {
            call.reject("Must provide an image URI");
            return;
        }

        try {
            Uri uri = Uri.parse(uriString);
            InputStream inputStream = getContext().getContentResolver().openInputStream(uri);
            if (inputStream == null) {
                call.reject("Could not read image file");
                return;
            }
            Bitmap bitmap = BitmapFactory.decodeStream(inputStream);
            inputStream.close();

            WallpaperManager wallpaperManager = WallpaperManager.getInstance(getContext());
            
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
                int flag = WallpaperManager.FLAG_SYSTEM;
                if ("LOCK".equals(location)) {
                    flag = WallpaperManager.FLAG_LOCK;
                } else if ("BOTH".equals(location)) {
                    flag = WallpaperManager.FLAG_SYSTEM | WallpaperManager.FLAG_LOCK;
                }
                wallpaperManager.setBitmap(bitmap, null, true, flag);
            } else {
                // Fallback for older Android (sets both)
                wallpaperManager.setBitmap(bitmap);
            }

            // Cleanup bitmap
            bitmap.recycle();

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);

        } catch (Exception e) {
            e.printStackTrace();
            call.reject("Failed to set wallpaper: " + e.getMessage());
        }
    }

    @PluginMethod
    public void saveToGallery(PluginCall call) {
        String uriString = call.getString("uri");
        String filename = call.getString("filename");

        if (uriString == null || filename == null) {
            call.reject("Must provide uri and filename");
            return;
        }

        try {
            Uri sourceUri = Uri.parse(uriString);
            InputStream inputStream = getContext().getContentResolver().openInputStream(sourceUri);
            if (inputStream == null) {
                call.reject("Could not read source file");
                return;
            }

            ContentValues values = new ContentValues();
            values.put(MediaStore.Images.Media.DISPLAY_NAME, filename);
            values.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/ABO Wallpapers");
                values.put(MediaStore.Images.Media.IS_PENDING, 1);
            }

            Uri collection = android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q 
                ? MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                : MediaStore.Images.Media.EXTERNAL_CONTENT_URI;

            Uri itemUri = getContext().getContentResolver().insert(collection, values);
            if (itemUri == null) {
                inputStream.close();
                call.reject("Failed to create MediaStore entry");
                return;
            }

            OutputStream outputStream = getContext().getContentResolver().openOutputStream(itemUri);
            if (outputStream == null) {
                inputStream.close();
                call.reject("Failed to open MediaStore output stream");
                return;
            }

            byte[] buffer = new byte[8192];
            int length;
            while ((length = inputStream.read(buffer)) > 0) {
                outputStream.write(buffer, 0, length);
            }

            outputStream.flush();
            outputStream.close();
            inputStream.close();

            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                values.clear();
                values.put(MediaStore.Images.Media.IS_PENDING, 0);
                getContext().getContentResolver().update(itemUri, values, null, null);
            }

            // Attempt to delete the temporary cache file since it's no longer needed
            try {
                if (sourceUri.getScheme() != null && sourceUri.getScheme().equals("file")) {
                    File tempFile = new File(sourceUri.getPath());
                    if (tempFile.exists()) {
                        tempFile.delete();
                    }
                }
            } catch (Exception ignored) {}

            JSObject ret = new JSObject();
            ret.put("uri", itemUri.toString());
            call.resolve(ret);

        } catch (Exception e) {
            e.printStackTrace();
            call.reject("Failed to save to gallery: " + e.getMessage());
        }
    }

    @PluginMethod
    public void deleteFromGallery(PluginCall call) {
        String uriString = call.getString("uri");
        if (uriString == null) {
            call.reject("Must provide uri");
            return;
        }

        try {
            Uri uri = Uri.parse(uriString);
            int rowsDeleted = getContext().getContentResolver().delete(uri, null, null);
            
            JSObject ret = new JSObject();
            ret.put("success", rowsDeleted > 0);
            call.resolve(ret);
        } catch (Exception e) {
            e.printStackTrace();
            call.reject("Failed to delete from gallery: " + e.getMessage());
        }
    }
}
