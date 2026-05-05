import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, Sun, Moon, Sparkles, Eye, Upload, X, ChevronDown, Shuffle, Download, Printer } from 'lucide-react';

// ═══ 你嘅 Supabase client ═══
// 改成你自己嘅 import path
import { supabase } from '../lib/supabase';

const R = (a, o) => `rgba(${a[0]},${a[1]},${a[2]},${o})`;

/* ═══ PALETTES ═══ */
const PG = [
  { id:'floral', n:'🌸 花卉系', items:[
    {id:'rosemorn',n:'玫瑰晨霧',l:{bg:'#F5EEF0',card:[255,251,252],pri:'#C4849A',sec:'#DDB8C4',ter:'#EDD8E0',t:'#38242e',t2:'#6a4a56',t3:'#9e7e88',brd:[200,180,188],sh:[164,130,144]},d:{bg:'#1e1418',card:[40,26,30],pri:'#a87088',sec:'#7c5266',ter:'#584050',t:'#ecdae0',t2:'#ae9aa0',t3:'#6e5a62',brd:[76,56,64],sh:[118,84,98]}},
    {id:'lavender',n:'薰衣草田',l:{bg:'#F0EEF6',card:[252,250,255],pri:'#9078B4',sec:'#B4A8CC',ter:'#D4CCE4',t:'#2c2440',t2:'#564874',t3:'#8878A4',brd:[184,172,208],sh:[140,126,170]},d:{bg:'#181420',card:[30,26,40],pri:'#8870a8',sec:'#5e5078',ter:'#42385a',t:'#e8e0f0',t2:'#a89ec0',t3:'#5e5474',brd:[56,50,74],sh:[90,80,120]}},
    {id:'gardenia',n:'梔子花白',l:{bg:'#F8F4EC',card:[255,254,248],pri:'#B8A880',sec:'#D4C8A4',ter:'#E8E0CA',t:'#302c1c',t2:'#60584a',t3:'#948c78',brd:[196,186,162],sh:[158,144,112]},d:{bg:'#1c1c14',card:[36,34,24],pri:'#a09070',sec:'#78705a',ter:'#52503e',t:'#ece8d8',t2:'#aaa490',t3:'#686252',brd:[72,68,50],sh:[112,106,76]}},
    {id:'peachred',n:'桃花嫣紅',l:{bg:'#F6EEE8',card:[255,252,250],pri:'#D0907C',sec:'#E4B8A8',ter:'#EFDDD6',t:'#3a2420',t2:'#6c4844',t3:'#9e7870',brd:[202,180,172],sh:[166,134,124]},d:{bg:'#1e1612',card:[40,28,24],pri:'#b47c6a',sec:'#886058',ter:'#5c4440',t:'#ecdce0',t2:'#b09a94',t3:'#6e5e5a',brd:[76,58,52],sh:[118,88,80]}},
  ]},
  { id:'earth', n:'🪵 大地系', items:[
    {id:'terra',n:'柔陶暮色',l:{bg:'#f2ece8',card:[255,250,246],pri:'#a07a68',sec:'#c4a898',ter:'#dac8bc',t:'#3a302a',t2:'#6e5e54',t3:'#a09488',brd:[196,176,162],sh:[160,134,118]},d:{bg:'#1e1816',card:[40,32,28],pri:'#b89480',sec:'#8a6e5e',ter:'#5e4a3e',t:'#ece2da',t2:'#b4a498',t3:'#746660',brd:[78,62,52],sh:[120,96,82]}},
    {id:'caramel',n:'焦糖杏仁',l:{bg:'#f4f0ea',card:[255,252,246],pri:'#a89070',sec:'#c8b89c',ter:'#ddd4c4',t:'#342e24',t2:'#6a5e4c',t3:'#9c9280',brd:[192,178,154],sh:[156,140,112]},d:{bg:'#1c1a16',card:[38,34,26],pri:'#bea880',sec:'#887660',ter:'#5c5040',t:'#ece4d6',t2:'#b0a48e',t3:'#706650',brd:[72,64,48],sh:[118,104,78]}},
    {id:'moss',n:'苔褐暖木',l:{bg:'#f0ece6',card:[252,250,244],pri:'#7a7460',sec:'#a09878',ter:'#c4bca4',t:'#302e26',t2:'#5e5a4c',t3:'#908a78',brd:[180,174,154],sh:[138,130,108]},d:{bg:'#1a1a16',card:[36,34,28],pri:'#9c9478',sec:'#6a6450',ter:'#484438',t:'#e8e4da',t2:'#a8a290',t3:'#646052',brd:[64,60,48],sh:[104,98,78]}},
    {id:'olive',n:'橄欖深褐',l:{bg:'#EAE8E0',card:[252,250,244],pri:'#6a7050',sec:'#909678',ter:'#b8bc9a',t:'#222014',t2:'#4a4c38',t3:'#787a5e',brd:[174,178,154],sh:[122,128,96]},d:{bg:'#1a1a12',card:[32,32,22],pri:'#8a9070',sec:'#5a6048',ter:'#404638',t:'#e4e6d8',t2:'#a2a890',t3:'#62685a',brd:[60,64,48],sh:[94,100,70]}},
  ]},
  { id:'bw', n:'⚫ 黑白系', items:[
    {id:'purewhite',n:'純白極簡',l:{bg:'#FAFAFA',card:[255,255,255],pri:'#888888',sec:'#AAAAAA',ter:'#CCCCCC',t:'#1a1a1a',t2:'#444444',t3:'#888888',brd:[200,200,200],sh:[160,160,160]},d:{bg:'#1a1a1a',card:[32,32,32],pri:'#999999',sec:'#666666',ter:'#444444',t:'#f0f0f0',t2:'#aaaaaa',t3:'#666666',brd:[60,60,60],sh:[90,90,90]}},
    {id:'ivory',n:'象牙暖白',l:{bg:'#F8F4EC',card:[255,253,246],pri:'#9C9488',sec:'#BCB4A8',ter:'#D8D0C4',t:'#282420',t2:'#504c46',t3:'#888480',brd:[196,190,180],sh:[154,148,136]},d:{bg:'#201e1a',card:[38,36,30],pri:'#a09690',sec:'#706c64',ter:'#4e4c44',t:'#eceae4',t2:'#aeaaa2',t3:'#6c6860',brd:[72,68,60],sh:[110,106,96]}},
    {id:'inkblack',n:'墨黑奢華',l:{bg:'#E8E6E8',card:[250,248,252],pri:'#383838',sec:'#606064',ter:'#909094',t:'#141418',t2:'#3a3a3e',t3:'#747478',brd:[168,168,174],sh:[104,104,110]},d:{bg:'#141416',card:[24,24,26],pri:'#c8c8cc',sec:'#848488',ter:'#505054',t:'#f0f0f2',t2:'#a8a8ac',t3:'#686868',brd:[48,48,52],sh:[80,80,86]}},
    {id:'midnight',n:'暗夜深藍',l:{bg:'#ECEEEE',card:[250,252,254],pri:'#283848',sec:'#506070',ter:'#8898A4',t:'#141c24',t2:'#384048',t3:'#6a7880',brd:[164,180,192],sh:[110,130,146]},d:{bg:'#0e1218',card:[18,22,30],pri:'#9aacb8',sec:'#506070',ter:'#2e3840',t:'#d6dee6',t2:'#8898a4',t3:'#4e5e68',brd:[38,50,64],sh:[58,80,100]}},
  ]},
  { id:'west', n:'🌹 西洋系', items:[
    {id:'rosyblush',n:'玫瑰粉灰',l:{bg:'#F4EAE8',card:[255,250,248],pri:'#BE8480',sec:'#D6B49C',ter:'#E8DFCD',t:'#382428',t2:'#684c50',t3:'#9c8084',brd:[198,174,170],sh:[162,128,124]},d:{bg:'#1e1416',card:[40,26,26],pri:'#a47070',sec:'#865e4e',ter:'#5c4842',t:'#ece0dc',t2:'#ae9898',t3:'#6e5e5c',brd:[76,54,52],sh:[120,88,84]}},
    {id:'celeste',n:'蔚藍薄霧',l:{bg:'#EEF2F6',card:[248,252,255],pri:'#88A8C2',sec:'#AECAD8',ter:'#CCDBE8',t:'#202c36',t2:'#485a68',t3:'#7c8e9e',brd:[164,188,208],sh:[114,146,170]},d:{bg:'#121c24',card:[22,32,44],pri:'#6e94ae',sec:'#4e667e',ter:'#384e60',t:'#d8e4ee',t2:'#90a6b8',t3:'#546476',brd:[44,64,80],sh:[62,96,128]}},
    {id:'lilac',n:'丁香紫灰',l:{bg:'#F2EEF6',card:[252,250,255],pri:'#9C88B0',sec:'#BEB0CE',ter:'#D8D0E4',t:'#2e2838',t2:'#58506a',t3:'#8e859c',brd:[186,176,202],sh:[144,132,164]},d:{bg:'#1a1620',card:[32,28,40],pri:'#9080a8',sec:'#665a7a',ter:'#46405c',t:'#e8e2f0',t2:'#a29aae',t3:'#605870',brd:[58,52,72],sh:[94,84,118]}},
    {id:'oyster',n:'蠔殼粉霧',l:{bg:'#F4EEEC',card:[255,252,250],pri:'#B6908E',sec:'#D2B6B2',ter:'#E6D4D0',t:'#342828',t2:'#645050',t3:'#9a8484',brd:[198,178,176],sh:[160,134,132]},d:{bg:'#1c1414',card:[38,26,26],pri:'#9a7a78',sec:'#786062',ter:'#524848',t:'#ece0e0',t2:'#ae9e9e',t3:'#6c5e5e',brd:[74,54,54],sh:[116,88,86]}},
  ]},
];
const PS = PG.flatMap(g => g.items);

/* ═══ FONTS ═══ */
const FGRP = [
  { id:'ming', n:'明體宋體', items:[
    {id:'notoser',n:'思源宋體',v:'"Noto Serif TC",serif',demo:'美睫'},
    {id:'shippori',n:'Shippori明朝',v:'"Shippori Mincho","Noto Serif TC",serif',demo:'收據'},
    {id:'lxgw',n:'霞鶩文楷',v:'"LXGW WenKai TC","Noto Serif TC",serif',demo:'單據'},
  ]},
  { id:'sans', n:'黑體無襯', items:[
    {id:'notosan',n:'思源黑體',v:'"Noto Sans TC",sans-serif',demo:'收據'},
    {id:'mont',n:'Montserrat',v:'"Montserrat","Noto Sans TC",sans-serif',demo:'INV'},
    {id:'dm',n:'DM Sans',v:'"DM Sans","Noto Sans TC",sans-serif',demo:'INV'},
    {id:'raleway',n:'Raleway',v:'"Raleway","Noto Sans TC",sans-serif',demo:'INV'},
  ]},
  { id:'deco', n:'裝飾藝術', items:[
    {id:'cinzel',n:'Cinzel刻碑',v:'"Cinzel",serif',demo:'INV'},
    {id:'play',n:'Playfair華麗',v:'"Playfair Display",serif',demo:'INV'},
    {id:'corm',n:'Cormorant古典',v:'"Cormorant Garamond",serif',demo:'INV'},
    {id:'lora',n:'Lora溫潤',v:'"Lora",serif',demo:'J.LAB'},
  ]},
  { id:'hand', n:'手寫書法', items:[
    {id:'mashan',n:'馬善政楷書',v:'"Ma Shan Zheng","Noto Serif TC",cursive',demo:'收據'},
    {id:'zhimang',n:'知芒星草書',v:'"Zhi Mang Xing","Noto Serif TC",cursive',demo:'收據'},
    {id:'zcool',n:'快樂圓體',v:'"ZCOOL KuaiLe","Noto Sans TC",sans-serif',demo:'收據'},
  ]},
];
const FS = FGRP.flatMap(g => g.items);

/* ═══ TEXTURES ═══ */
const TX = [
  {id:'none',n:'無'},{id:'linen',n:'亞麻'},{id:'paper',n:'宣紙'},{id:'silk',n:'絲綢'},
  {id:'weave',n:'編織'},{id:'marble',n:'大理石'},{id:'grain',n:'磨砂'},{id:'dots',n:'圓點'},
  {id:'diamond',n:'菱格'},{id:'herring',n:'人字'},
];

/* ═══ LAYOUTS ═══ */
const LAYOUTS = [
  {id:'classic',n:'經典居中',desc:'傳統對稱排版'},
  {id:'minimal',n:'極簡留白',desc:'大量空白高端感'},
  {id:'elegant',n:'典雅頭圖',desc:'頂部色塊+漸變'},
  {id:'artsy',n:'藝術裝飾',desc:'邊框裝飾線條'},
  {id:'modern',n:'現代雜誌',desc:'左對齊雜誌風'},
  {id:'stamp',n:'復古印章',desc:'印章圓形 Logo'},
];

const RS = [{id:'none',n:'無',v:0},{id:'sm',n:'微圓',v:4},{id:'md',n:'中圓',v:10},{id:'lg',n:'大圓',v:18}];

export default function InvoiceStyleEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [styleId, setStyleId] = useState(null);
  
  // 所有 style state
  const [pid, sPid] = useState('rosemorn');
  const [fid, sFid] = useState('notoser');
  const [rid, sRid] = useState('sm');
  const [dk, sDk] = useState(false);
  const [op, sOp] = useState(0.94);
  const [bgTex, sBgTex] = useState('linen');
  const [bgTexOp, sBgTexOp] = useState(0.5);
  const [bgImg, sBgImg] = useState(null);
  const [bgImgOp, sBgImgOp] = useState(0.08);
  const [bgImgBlur, sBgImgBlur] = useState(4);
  const [glassCard, sGlassCard] = useState(false);
  const [layout, sLayout] = useState('classic');
  const [shopName, sShopName] = useState('J.LAB HAIR STUDIO');
  const [shopSub, sShopSub] = useState('');
  const [shopPhone, sShopPhone] = useState('');
  const [footerText, sFooterText] = useState('多謝惠顧 Thank You!');
  const [showQR, sShowQR] = useState(true);
  const [showLogo, sShowLogo] = useState(true);
  const [logoImg, sLogoImg] = useState(null);
  const [divStyle, sDivStyle] = useState('ornament');
  const [headerDeco, sHeaderDeco] = useState(true);
  // ... 其餘你喺上面 demo 嘅所有 state 同 UI code 照搬 ...

  // ═══ 載入已儲存嘅風格 ═══
  useEffect(() => {
    loadStyle();
  }, []);

  async function loadStyle() {
    try {
      const { data, error } = await supabase
        .from('invoice_styles')
        .select('*')
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      if (data) {
        setStyleId(data.id);
        sPid(data.palette_id || 'rosemorn');
        sFid(data.font_id || 'notoser');
        sRid(data.radius_id || 'sm');
        sDk(data.dark_mode || false);
        sOp(data.card_opacity || 0.94);
        sBgTex(data.bg_texture || 'linen');
        sBgTexOp(data.bg_texture_opacity || 0.5);
        sBgImg(data.bg_image_url || null);
        sBgImgOp(data.bg_image_opacity || 0.08);
        sBgImgBlur(data.bg_image_blur || 4);
        sGlassCard(data.glass_card || false);
        sLayout(data.layout || 'classic');
        sShopName(data.shop_name || '');
        sShopSub(data.shop_sub || '');
        sShopPhone(data.shop_phone || '');
        sFooterText(data.footer_text || '多謝惠顧 Thank You!');
        sShowQR(data.show_qr !== false);
        sShowLogo(data.show_logo !== false);
        sLogoImg(data.logo_url || null);
        sDivStyle(data.div_style || 'ornament');
        sHeaderDeco(data.header_deco !== false);
      }
    } catch (err) {
      console.error('Load invoice style error:', err);
    } finally {
      setLoading(false);
    }
  }

  // ═══ 儲存風格 ═══
  async function saveStyle() {
    setSaving(true);
    try {
      const payload = {
        palette_id: pid,
        font_id: fid,
        radius_id: rid,
        dark_mode: dk,
        card_opacity: op,
        bg_texture: bgTex,
        bg_texture_opacity: bgTexOp,
        bg_image_url: bgImg,
        bg_image_opacity: bgImgOp,
        bg_image_blur: bgImgBlur,
        glass_card: glassCard,
        layout,
        shop_name: shopName,
        shop_sub: shopSub,
        shop_phone: shopPhone,
        footer_text: footerText,
        show_qr: showQR,
        show_logo: showLogo,
        logo_url: logoImg,
        div_style: divStyle,
        header_deco: headerDeco,
        updated_at: new Date().toISOString(),
      };

      if (styleId) {
        await supabase
          .from('invoice_styles')
          .update(payload)
          .eq('id', styleId);
      } else {
        const { data } = await supabase
          .from('invoice_styles')
          .insert({ ...payload, is_active: true })
          .select()
          .single();
        if (data) setStyleId(data.id);
      }
      alert('✅ 風格已儲存！');
    } catch (err) {
      console.error('Save error:', err);
      alert('❌ 儲存失敗');
    } finally {
      setSaving(false);
    }
  }

  // ═══ 上傳圖片到 Storage ═══
  async function uploadImage(file, folder = 'backgrounds') {
    const fileName = `${folder}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('invoice-assets')
      .upload(fileName, file, { upsert: true });
    
    if (error) throw error;
    
    const { data: urlData } = supabase.storage
      .from('invoice-assets')
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  }

  async function handleBgUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const url = await uploadImage(file, 'backgrounds');
      sBgImg(url);
    } catch (err) {
      // fallback: 用 local DataURL
      const reader = new FileReader();
      reader.onload = ev => sBgImg(ev.target.result);
      reader.readAsDataURL(file);
    }
  }

  async function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const url = await uploadImage(file, 'logos');
      sLogoImg(url);
    } catch (err) {
      const reader = new FileReader();
      reader.onload = ev => sLogoImg(ev.target.result);
      reader.readAsDataURL(file);
    }
  }

  // ═══ 以下係你嘅完整 UI render ═══
  // 照搬我之前畀你嘅 demo code，唔使改
  // 只需要：
  // 1. 將 handleImg → handleBgUpload
  // 2. 將 handleLogo → handleLogoUpload
  // 3. 「儲存風格」button 嘅 onClick → saveStyle
  
  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}>載入中...</div>;

  return (
    <div>
      {/* ... 你嘅完整 UI code 照搬 ... */}
      {/* 「儲存風格」button 改成: */}
      {/* <button onClick={saveStyle} disabled={saving}>{saving ? '儲存中...' : '💾 儲存風格'}</button> */}
    </div>
  );
}
