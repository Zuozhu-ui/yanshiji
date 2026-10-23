package com.yanshiji.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * 系统文件选择器（SAF）插件：
 * - saveFile：把备份 JSON 保存成用户自己选位置的「真文件」（下载/网盘/手机存储）
 * - openFile：从系统文件选择器读取备份 JSON
 *
 * 用 SAF 而不是分享面板，是为了避开微信把文件当纯文本接收的问题。
 */
@CapacitorPlugin(name = "BackupFile")
public class BackupFilePlugin extends Plugin {

    private String pendingData;
    private String pendingName = "backup.json";

    @PluginMethod
    public void saveFile(PluginCall call) {
        String data = call.getString("data");
        if (data == null) {
            call.reject("没有可保存的备份内容");
            return;
        }
        pendingData = data;
        pendingName = call.getString("fileName", "backup.json");
        String mimeType = call.getString("mimeType", "application/json");

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(mimeType);
        intent.putExtra(Intent.EXTRA_TITLE, pendingName);

        startActivityForResult(call, intent, "saveFileResult");
    }

    @ActivityCallback
    private void saveFileResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }

        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            pendingData = null;
            JSObject cancelled = new JSObject();
            cancelled.put("cancelled", true);
            call.resolve(cancelled);
            return;
        }

        Uri uri = data.getData();
        String content = pendingData;
        pendingData = null;

        if (content == null) {
            call.reject("备份内容已丢失，请重试");
            return;
        }

        OutputStream os = null;
        try {
            try {
                os = getContext().getContentResolver().openOutputStream(uri, "w");
            } catch (Exception first) {
                os = getContext().getContentResolver().openOutputStream(uri, "rwt");
            }
            if (os == null) {
                throw new Exception("无法打开目标文件");
            }
            os.write(content.getBytes(StandardCharsets.UTF_8));
            os.flush();
        } catch (Exception e) {
            call.reject("写入失败：" + e.getMessage());
            return;
        } finally {
            if (os != null) {
                try {
                    os.close();
                } catch (Exception ignored) {
                }
            }
        }

        JSObject ret = new JSObject();
        ret.put("uri", uri.toString());
        ret.put("name", pendingName);
        call.resolve(ret);
    }

    @PluginMethod
    public void openFile(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        intent.putExtra(
            Intent.EXTRA_MIME_TYPES,
            new String[] { "application/json", "text/plain", "application/octet-stream" }
        );

        startActivityForResult(call, intent, "openFileResult");
    }

    @ActivityCallback
    private void openFileResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }

        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            JSObject cancelled = new JSObject();
            cancelled.put("cancelled", true);
            call.resolve(cancelled);
            return;
        }

        Uri uri = data.getData();
        try (InputStream is = getContext().getContentResolver().openInputStream(uri)) {
            if (is == null) {
                throw new Exception("无法读取文件");
            }
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192];
            int len;
            while ((len = is.read(buffer)) != -1) {
                bos.write(buffer, 0, len);
            }
            JSObject ret = new JSObject();
            ret.put("data", new String(bos.toByteArray(), StandardCharsets.UTF_8));
            ret.put("uri", uri.toString());
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("读取失败：" + e.getMessage());
        }
    }
}
