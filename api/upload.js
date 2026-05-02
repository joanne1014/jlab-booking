// api/upload.js
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';

// 關閉 Next.js 內建 bodyParser（formidable 需要原始 request）
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  // ═══ 只接受 POST ═══
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  // ═══ 初始化 Supabase ═══
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  // ═══ 允許嘅檔案類型 ═══
  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/svg+xml',
    'image/webp',
  ];

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  try {
    // ═══ 解析 FormData ═══
    const form = formidable({ 
      maxFileSize: MAX_SIZE,
      maxFiles: 1,
    });

    const [fields, files] = await form.parse(req);
    
    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ error: '未收到檔案' });
    }

    // ═══ 驗證檔案類型 ═══
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      // 清理臨時檔案
      try { fs.unlinkSync(file.filepath); } catch(e) {}
      return res.status(400).json({ 
        error: `不支援嘅檔案類型: ${file.mimetype}。只接受 JPG、PNG、GIF、SVG、WebP` 
      });
    }

    // ═══ 驗證檔案大小 ═══
    if (file.size > MAX_SIZE) {
      try { fs.unlinkSync(file.filepath); } catch(e) {}
      return res.status(400).json({ 
        error: `檔案太大 (${(file.size / 1024 / 1024).toFixed(1)}MB)，最大 5MB` 
      });
    }

    // ═══ 決定存放路徑 ═══
    // 前端可傳 folder 參數：logos / backgrounds / general
    const folder = fields.folder?.[0] || 'general';
    const allowedFolders = ['logos', 'backgrounds', 'general', 'gallery'];
    const safeFolder = allowedFolders.includes(folder) ? folder : 'general';

    // ═══ 產生檔案名 ═══
    const ext = file.originalFilename?.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExt = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext) ? ext : 'jpg';
    const fileName = `${safeFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

    // ═══ 讀取檔案 ═══
    const fileBuffer = fs.readFileSync(file.filepath);

    // ═══ 上傳到 Supabase Storage ═══
    const { data, error } = await supabase.storage
      .from('theme-assets')
      .upload(fileName, fileBuffer, {
        contentType: file.mimetype,
        upsert: true,
        cacheControl: '3600', // 快取 1 小時
      });

    // 清理臨時檔案
    try { fs.unlinkSync(file.filepath); } catch(e) {}

    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({ error: '上傳失敗: ' + error.message });
    }

    // ═══ 取得 Public URL ═══
    const { data: urlData } = supabase.storage
      .from('theme-assets')
      .getPublicUrl(fileName);

    // ═══ 如果係 logo，順便更新 frontend_settings ═══
    if (safeFolder === 'logos' && fields.auto_save?.[0] === 'true') {
      await supabase
        .from('frontend_settings')
        .update({ logo_url: urlData.publicUrl })
        .eq('id', 1);
    }

    // ═══ 如果係背景圖，順便更新 frontend_settings ═══
    if (safeFolder === 'backgrounds' && fields.auto_save?.[0] === 'true') {
      await supabase
        .from('frontend_settings')
        .update({ bg_image: urlData.publicUrl })
        .eq('id', 1);
    }

    // ═══ 刪除舊檔案（如有傳入） ═══
    const oldUrl = fields.old_url?.[0];
    if (oldUrl) {
      try {
        // 從 URL 提取 storage path
        // URL 格式: https://xxx.supabase.co/storage/v1/object/public/theme-assets/logos/123.jpg
        const urlParts = oldUrl.split('/theme-assets/');
        if (urlParts[1]) {
          await supabase.storage
            .from('theme-assets')
            .remove([urlParts[1]]);
        }
      } catch (e) {
        // 刪除舊檔失敗唔係嚴重錯誤，繼續
        console.warn('Failed to delete old file:', e.message);
      }
    }

    return res.status(200).json({ 
      url: urlData.publicUrl,
      path: fileName,
      size: file.size,
      type: file.mimetype,
    });

  } catch (err) {
    console.error('Upload handler error:', err);
    
    // formidable 嘅檔案過大錯誤
    if (err.code === 'LIMIT_FILE_SIZE' || err.httpCode === 413) {
      return res.status(413).json({ error: '檔案太大，最大 5MB' });
    }

    return res.status(500).json({ error: '伺服器錯誤: ' + err.message });
  }
}
