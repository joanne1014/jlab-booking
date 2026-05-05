import { supabase } from './supabase';

// 全部 palette / font / texture data 都 export 出嚟畀其他地方用
export { PG, PS, FGRP, FS, TX, LAYOUTS, RS } from '../pages/InvoiceStyleEditor';

let cachedStyle = null;

export async function getActiveInvoiceStyle() {
  if (cachedStyle) return cachedStyle;
  
  const { data, error } = await supabase
    .from('invoice_styles')
    .select('*')
    .eq('is_active', true)
    .single();
  
  if (error) {
    console.error('Failed to load invoice style:', error);
    return null;
  }
  
  cachedStyle = data;
  return data;
}

// 清 cache（當用戶儲存新風格後 call）
export function clearStyleCache() {
  cachedStyle = null;
}
