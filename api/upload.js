import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  
  const form = formidable({ maxFileSize: 5 * 1024 * 1024 }); // 5MB
  const [fields, files] = await form.parse(req);
  const file = files.file?.[0];
  if (!file) return res.status(400).json({ error: 'No file' });

  const ext = file.originalFilename?.split('.').pop() || 'jpg';
  const fileName = `bg-${Date.now()}.${ext}`;
  const fileBuffer = fs.readFileSync(file.filepath);

  const { data, error } = await supabase.storage
    .from('theme-assets')
    .upload(fileName, fileBuffer, { contentType: file.mimetype, upsert: true });

  if (error) return res.status(500).json({ error: error.message });

  const { data: urlData } = supabase.storage.from('theme-assets').getPublicUrl(fileName);
  return res.status(200).json({ url: urlData.publicUrl });
}
