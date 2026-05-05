import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sun, Moon, Sparkles, Eye, Upload, X, ChevronDown, Shuffle, Download, Printer, ArrowLeft, Save } from 'lucide-react';
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

/* ═══ DIVIDER STYLES ═══ */
const DIVS = [
  {id:'line',n:'直線'},{id:'dashed',n:'虛線'},{id:'dotted',n:'圓點線'},
  {id:'ornament',n:'花飾線'},{id:'wave',n:'波浪線'},{id:'double',n:'雙線'},
];

/* ═══ TEXTURE SVG GENERATOR ═══ */
function getTextureSVG(id, color, opacity) {
  const c = color || '128,128,128';
  const o = opacity || 0.5;
  const patterns = {
    linen: `<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect width="4" height="4" fill="none"/><path d="M0 0h1v1H0zM2 2h1v1H2z" fill="rgba(${c},${o*0.3})"/></svg>`,
    paper: `<svg xmlns="http://www.w3.org/2000/svg" width="6" height="6"><rect width="6" height="6" fill="none"/><circle cx="1" cy="1" r="0.5" fill="rgba(${c},${o*0.15})"/><circle cx="4" cy="3" r="0.3" fill="rgba(${c},${o*0.1})"/></svg>`,
    silk: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="none"/><path d="M0 4 Q2 2 4 4 Q6 6 8 4" stroke="rgba(${c},${o*0.12})" fill="none" stroke-width="0.5"/></svg>`,
    weave: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="none"/><path d="M0 0h4v4H0zM4 4h4v4H4z" fill="rgba(${c},${o*0.08})"/></svg>`,
    marble: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="none"/><path d="M0 10 Q5 8 10 10 Q15 12 20 10" stroke="rgba(${c},${o*0.1})" fill="none" stroke-width="1"/><path d="M0 15 Q5 13 10 15 Q15 17 20 15" stroke="rgba(${c},${o*0.06})" fill="none" stroke-width="0.5"/></svg>`,
    grain: `<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect width="4" height="4" fill="none"/><rect x="0" y="0" width="1" height="1" fill="rgba(${c},${o*0.06})"/><rect x="2" y="1" width="1" height="1" fill="rgba(${c},${o*0.04})"/><rect x="1" y="3" width="1" height="1" fill="rgba(${c},${o*0.05})"/></svg>`,
    dots: `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="none"/><circle cx="5" cy="5" r="1" fill="rgba(${c},${o*0.15})"/></svg>`,
    diamond: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"><rect width="12" height="12" fill="none"/><path d="M6 0L12 6L6 12L0 6Z" stroke="rgba(${c},${o*0.1})" fill="none" stroke-width="0.5"/></svg>`,
    herring: `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="none"/><path d="M0 5L5 0L10 5M0 10L5 5L10 10" stroke="rgba(${c},${o*0.1})" fill="none" stroke-width="0.5"/></svg>`,
  };
  return patterns[id] || '';
}

/* ═══ DIVIDER RENDERER ═══ */
function DividerLine({ style, color, opacity = 0.4 }) {
  const c = color || '#888';
  const s = { width: '100%', margin: '8px 0', opacity };
  if (style === 'line') return <div style={{...s, height: 1, background: c}} />;
  if (style === 'dashed') return <div style={{...s, height: 0, borderTop: `1px dashed ${c}`}} />;
  if (style === 'dotted') return <div style={{...s, height: 0, borderTop: `2px dotted ${c}`}} />;
  if (style === 'double') return <div style={{...s, height: 0, borderTop: `3px double ${c}`}} />;
  if (style === 'wave') return <svg style={s} height="6" viewBox="0 0 100 6"><path d="M0 3 Q5 0 10 3 Q15 6 20 3 Q25 0 30 3 Q35 6 40 3 Q45 0 50 3 Q55 6 60 3 Q65 0 70 3 Q75 6 80 3 Q85 0 90 3 Q95 6 100 3" stroke={c} fill="none" strokeWidth="0.8"/></svg>;
  if (style === 'ornament') return <div style={{...s, textAlign:'center', fontSize:10, color: c, letterSpacing:4}}>✦ ─── ✦ ─── ✦</div>;
  return <div style={{...s, height: 1, background: c}} />;
}

/* ═══ MAIN COMPONENT ═══ */
export default function InvoiceStyleEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [styleId, setStyleId] = useState(null);
  const [activeTab, setActiveTab] = useState('palette');
  const [toast, setToast] = useState(null);

  // Style states
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
  const [shopSub, sShopSub] = useState('專業美髮沙龍');
  const [shopPhone, sShopPhone] = useState('9123 4567');
  const [footerText, sFooterText] = useState('多謝惠顧 Thank You!');
  const [showQR, sShowQR] = useState(true);
  const [showLogo, sShowLogo] = useState(true);
  const [logoImg, sLogoImg] = useState(null);
  const [divStyle, sDivStyle] = useState('ornament');
  const [headerDeco, sHeaderDeco] = useState(true);

  const fileRef = useRef(null);
  const logoRef = useRef(null);

  // Derived
  const pal = useMemo(() => PS.find(p => p.id === pid) || PS[0], [pid]);
  const fnt = useMemo(() => FS.find(f => f.id === fid) || FS[0], [fid]);
  const rad = useMemo(() => RS.find(r => r.id === rid) || RS[0], [rid]);
  const colors = useMemo(() => dk ? pal.d : pal.l, [pal, dk]);

  // Show toast
  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  // ═══ Load from Supabase ═══
  useEffect(() => { loadStyle(); }, []);

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
        sOp(data.card_opacity ?? 0.94);
        sBgTex(data.bg_texture || 'linen');
        sBgTexOp(data.bg_texture_opacity ?? 0.5);
        sBgImg(data.bg_image_url || null);
        sBgImgOp(data.bg_image_opacity ?? 0.08);
        sBgImgBlur(data.bg_image_blur ?? 4);
        sGlassCard(data.glass_card || false);
        sLayout(data.layout || 'classic');
        sShopName(data.shop_name || 'J.LAB HAIR STUDIO');
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
      console.error('Load style error:', err);
    } finally {
      setLoading(false);
    }
  }

  // ═══ Save to Supabase ═══
  async function saveStyle() {
    setSaving(true);
    try {
      const payload = {
        palette_id: pid, font_id: fid, radius_id: rid,
        dark_mode: dk, card_opacity: op,
        bg_texture: bgTex, bg_texture_opacity: bgTexOp,
        bg_image_url: bgImg, bg_image_opacity: bgImgOp, bg_image_blur: bgImgBlur,
        glass_card: glassCard, layout,
        shop_name: shopName, shop_sub: shopSub, shop_phone: shopPhone,
        footer_text: footerText, show_qr: showQR, show_logo: showLogo,
        logo_url: logoImg, div_style: divStyle, header_deco: headerDeco,
        updated_at: new Date().toISOString(),
      };
      if (styleId) {
        const { error } = await supabase.from('invoice_styles').update(payload).eq('id', styleId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('invoice_styles').insert({ ...payload, is_active: true }).select().single();
        if (error) throw error;
        if (data) setStyleId(data.id);
      }
      showToast('✅ 風格已儲存！');
    } catch (err) {
      console.error('Save error:', err);
      showToast('❌ 儲存失敗：' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  // ═══ Upload ═══
  async function uploadImage(file, folder) {
    const fileName = `${folder}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('invoice-assets').upload(fileName, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('invoice-assets').getPublicUrl(fileName);
    return urlData.publicUrl;
  }

  async function handleBgUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImage(file, 'backgrounds');
      sBgImg(url);
    } catch {
      const reader = new FileReader();
      reader.onload = ev => sBgImg(ev.target.result);
      reader.readAsDataURL(file);
    }
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImage(file, 'logos');
      sLogoImg(url);
    } catch {
      const reader = new FileReader();
      reader.onload = ev => sLogoImg(ev.target.result);
      reader.readAsDataURL(file);
    }
  }

  // ═══ Random ═══
  function randomize() {
    const rp = PS[Math.floor(Math.random() * PS.length)];
    const rf = FS[Math.floor(Math.random() * FS.length)];
    const rr = RS[Math.floor(Math.random() * RS.length)];
    const rl = LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)];
    const rt = TX[Math.floor(Math.random() * TX.length)];
    const rd = DIVS[Math.floor(Math.random() * DIVS.length)];
    sPid(rp.id); sFid(rf.id); sRid(rr.id); sLayout(rl.id); sBgTex(rt.id); sDivStyle(rd.id);
    sDk(Math.random() > 0.7);
    sGlassCard(Math.random() > 0.6);
    sHeaderDeco(Math.random() > 0.3);
  }

  // ═══ Texture background ═══
  const texBg = useMemo(() => {
    if (bgTex === 'none') return 'none';
    const svg = getTextureSVG(bgTex, colors.brd.join(','), bgTexOp);
    if (!svg) return 'none';
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [bgTex, bgTexOp, colors]);

  // ═══ TABS ═══
  const tabs = [
    { id: 'palette', n: '🎨 配色' },
    { id: 'font', n: '✒️ 字體' },
    { id: 'layout', n: '📐 版型' },
    { id: 'bg', n: '🖼️ 背景' },
    { id: 'info', n: '🏪 店鋪' },
    { id: 'detail', n: '✨ 細節' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8f6f4' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🎨</div>
        <div style={{ color: '#888', fontSize: 14 }}>載入風格設定中...</div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: '"Noto Sans TC", sans-serif', background: '#f5f3f0', overflow: 'hidden' }}>
      {/* ═══ LEFT PANEL - Controls ═══ */}
      <div style={{ width: 380, minWidth: 380, background: '#fff', borderRight: '1px solid #e8e4e0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0ece8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => window.history.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <ArrowLeft size={18} color="#666" />
            </button>
            <h1 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>單據風格編輯器</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={randomize} style={{ background: '#f8f6f4', border: '1px solid #e8e4e0', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Shuffle size={13} /> 隨機
            </button>
            <button onClick={saveStyle} disabled={saving} style={{ background: colors.pri, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 500, opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Save size={13} /> {saving ? '儲存中...' : '儲存'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', padding: '0 12px', borderBottom: '1px solid #f0ece8', overflowX: 'auto', gap: 0 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: '10px 12px', fontSize: 12, border: 'none', background: 'none', cursor: 'pointer',
              borderBottom: activeTab === t.id ? `2px solid ${colors.pri}` : '2px solid transparent',
              color: activeTab === t.id ? colors.pri : '#888', fontWeight: activeTab === t.id ? 600 : 400,
              whiteSpace: 'nowrap',
            }}>{t.n}</button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {/* ── Palette Tab ── */}
          {activeTab === 'palette' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>明暗模式</span>
                <button onClick={() => sDk(!dk)} style={{ background: dk ? '#333' : '#f8f6f4', border: '1px solid #ddd', borderRadius: 20, padding: '4px 12px', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, color: dk ? '#fff' : '#333' }}>
                  {dk ? <Moon size={12} /> : <Sun size={12} />} {dk ? '深色' : '淺色'}
                </button>
              </div>
              {PG.map(g => (
                <div key={g.id} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{g.n}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                    {g.items.map(p => {
                      const c = dk ? p.d : p.l;
                      const active = pid === p.id;
                      return (
                        <button key={p.id} onClick={() => sPid(p.id)} style={{
                          padding: '8px 10px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                          border: active ? `2px solid ${c.pri}` : '1px solid #eee',
                          background: active ? c.bg : '#fafafa',
                        }}>
                          <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                            <div style={{ width: 12, height: 12, borderRadius: 3, background: c.pri }} />
                            <div style={{ width: 12, height: 12, borderRadius: 3, background: c.sec }} />
                            <div style={{ width: 12, height: 12, borderRadius: 3, background: c.ter }} />
                          </div>
                          <div style={{ fontSize: 11, color: c.t, fontWeight: active ? 600 : 400 }}>{p.n}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Font Tab ── */}
          {activeTab === 'font' && (
            <div>
              {FGRP.map(g => (
                <div key={g.id} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{g.n}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {g.items.map(f => {
                      const active = fid === f.id;
                      return (
                        <button key={f.id} onClick={() => sFid(f.id)} style={{
                          padding: '10px 12px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                          border: active ? `2px solid ${colors.pri}` : '1px solid #eee',
                          background: active ? colors.bg : '#fafafa',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                          <span style={{ fontSize: 12, fontWeight: active ? 600 : 400 }}>{f.n}</span>
                          <span style={{ fontFamily: f.v, fontSize: 14, color: colors.pri }}>{f.demo}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>圓角程度</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {RS.map(r => (
                    <button key={r.id} onClick={() => sRid(r.id)} style={{
                      flex: 1, padding: '8px 0', borderRadius: r.v, cursor: 'pointer', fontSize: 11, textAlign: 'center',
                      border: rid === r.id ? `2px solid ${colors.pri}` : '1px solid #ddd',
                      background: rid === r.id ? colors.bg : '#fafafa',
                    }}>{r.n}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Layout Tab ── */}
          {activeTab === 'layout' && (
            <div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>版面佈局</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {LAYOUTS.map(l => {
                  const active = layout === l.id;
                  return (
                    <button key={l.id} onClick={() => sLayout(l.id)} style={{
                      padding: '12px 10px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                      border: active ? `2px solid ${colors.pri}` : '1px solid #eee',
                      background: active ? colors.bg : '#fafafa',
                    }}>
                      <div style={{ fontSize: 13, fontWeight: active ? 600 : 400, marginBottom: 2 }}>{l.n}</div>
                      <div style={{ fontSize: 10, color: '#999' }}>{l.desc}</div>
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>分隔線風格</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {DIVS.map(d => (
                    <button key={d.id} onClick={() => sDivStyle(d.id)} style={{
                      padding: '8px 6px', borderRadius: 6, cursor: 'pointer', fontSize: 11, textAlign: 'center',
                      border: divStyle === d.id ? `2px solid ${colors.pri}` : '1px solid #eee',
                      background: divStyle === d.id ? colors.bg : '#fafafa',
                    }}>{d.n}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Background Tab ── */}
          {activeTab === 'bg' && (
            <div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>底紋材質</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginBottom: 12 }}>
                {TX.map(t => (
                  <button key={t.id} onClick={() => sBgTex(t.id)} style={{
                    padding: '6px 2px', borderRadius: 6, cursor: 'pointer', fontSize: 10, textAlign: 'center',
                    border: bgTex === t.id ? `2px solid ${colors.pri}` : '1px solid #eee',
                    background: bgTex === t.id ? colors.bg : '#fafafa',
                  }}>{t.n}</button>
                ))}
              </div>
              {bgTex !== 'none' && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>材質透明度: {Math.round(bgTexOp * 100)}%</div>
                  <input type="range" min="0" max="100" value={bgTexOp * 100} onChange={e => sBgTexOp(e.target.value / 100)} style={{ width: '100%' }} />
                </div>
              )}

              <div style={{ fontSize: 12, color: '#888', marginBottom: 6, marginTop: 8 }}>背景圖片</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <button onClick={() => fileRef.current?.click()} style={{ flex: 1, padding: '10px', borderRadius: 6, border: '1px dashed #ccc', background: '#fafafa', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <Upload size={12} /> 上傳背景圖
                </button>
                {bgImg && <button onClick={() => sBgImg(null)} style={{ padding: '10px 14px', borderRadius: 6, border: '1px solid #eee', background: '#fff', cursor: 'pointer', fontSize: 11 }}><X size={12} /></button>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleBgUpload} style={{ display: 'none' }} />
              {bgImg && (
                <>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>圖片透明度: {Math.round(bgImgOp * 100)}%</div>
                    <input type="range" min="0" max="50" value={bgImgOp * 100} onChange={e => sBgImgOp(e.target.value / 100)} style={{ width: '100%' }} />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>模糊程度: {bgImgBlur}px</div>
                    <input type="range" min="0" max="20" value={bgImgBlur} onChange={e => sBgImgBlur(+e.target.value)} style={{ width: '100%' }} />
                  </div>
                </>
              )}

              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>卡片效果</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer' }}>
                    <input type="checkbox" checked={glassCard} onChange={e => sGlassCard(e.target.checked)} /> 毛玻璃效果
                  </label>
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>卡片透明度: {Math.round(op * 100)}%</div>
                  <input type="range" min="50" max="100" value={op * 100} onChange={e => sOp(e.target.value / 100)} style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          )}

          {/* ── Info Tab ── */}
          {activeTab === 'info' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>店舖名稱</label>
                  <input value={shopName} onChange={e => sShopName(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>副標題</label>
                  <input value={shopSub} onChange={e => sShopSub(e.target.value)} placeholder="例如：專業美髮沙龍" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>聯絡電話</label>
                  <input value={shopPhone} onChange={e => sShopPhone(e.target.value)} placeholder="9123 4567" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>頁尾文字</label>
                  <input value={footerText} onChange={e => sFooterText(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>Logo</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button onClick={() => logoRef.current?.click()} style={{ padding: '8px 14px', borderRadius: 6, border: '1px dashed #ccc', background: '#fafafa', cursor: 'pointer', fontSize: 11 }}>
                      <Upload size={12} /> 上傳 Logo
                    </button>
                    <label style={{ fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input type="checkbox" checked={showLogo} onChange={e => sShowLogo(e.target.checked)} /> 顯示
                    </label>
                    {logoImg && <button onClick={() => sLogoImg(null)} style={{ fontSize: 11, color: '#c44', background: 'none', border: 'none', cursor: 'pointer' }}>移除</button>}
                  </div>
                  <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                  {logoImg && <img src={logoImg} alt="logo" style={{ marginTop: 8, maxHeight: 50, borderRadius: 4 }} />}
                </div>
              </div>
            </div>
          )}

          {/* ── Detail Tab ── */}
          {activeTab === 'detail' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" checked={headerDeco} onChange={e => sHeaderDeco(e.target.checked)} />
                  頂部裝飾花紋
                </label>
                <label style={{ fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" checked={showQR} onChange={e => sShowQR(e.target.checked)} />
                  顯示 QR Code 區域
                </label>
                <label style={{ fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" checked={glassCard} onChange={e => sGlassCard(e.target.checked)} />
                  毛玻璃卡片
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ RIGHT PANEL - Preview ═══ */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflow: 'auto', background: '#eae8e4' }}>
        <div style={{ width: 340, position: 'relative' }}>
          {/* Receipt Card */}
          <div style={{
            position: 'relative',
            background: colors.bg,
            borderRadius: rad.v + 4,
            overflow: 'hidden',
            boxShadow: `0 8px 32px ${R(colors.sh, 0.2)}, 0 2px 8px ${R(colors.sh, 0.1)}`,
          }}>
            {/* Background image layer */}
            {bgImg && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 0,
                backgroundImage: `url(${bgImg})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                opacity: bgImgOp, filter: `blur(${bgImgBlur}px)`,
              }} />
            )}
            {/* Texture layer */}
            {bgTex !== 'none' && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 1, backgroundImage: texBg, backgroundRepeat: 'repeat' }} />
            )}

            {/* Card content */}
            <div style={{
              position: 'relative', zIndex: 2,
              background: glassCard ? R(colors.card, op * 0.85) : R(colors.card, op),
              backdropFilter: glassCard ? 'blur(12px)' : 'none',
              margin: 12, borderRadius: rad.v, padding: '24px 20px',
              border: `1px solid ${R(colors.brd, 0.3)}`,
              fontFamily: fnt.v,
            }}>
              {/* Header Decoration */}
              {headerDeco && layout !== 'minimal' && (
                <div style={{ textAlign: 'center', marginBottom: 8, color: colors.pri, fontSize: 10, letterSpacing: 3, opacity: 0.6 }}>
                  ✿ ─────── ✿ ─────── ✿
                </div>
              )}

              {/* Elegant layout top banner */}
              {layout === 'elegant' && (
                <div style={{ margin: '-24px -20px 16px', padding: '16px 20px', background: `linear-gradient(135deg, ${colors.pri}, ${colors.sec})`, textAlign: 'center' }}>
                  <div style={{ color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: 2 }}>{shopName}</div>
                  {shopSub && <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, marginTop: 4 }}>{shopSub}</div>}
                </div>
              )}

              {/* Logo */}
              {showLogo && layout !== 'elegant' && (
                <div style={{ textAlign: layout === 'modern' ? 'left' : 'center', marginBottom: 8 }}>
                  {logoImg ? (
                    <img src={logoImg} alt="logo" style={{ height: 36, objectFit: 'contain' }} />
                  ) : (
                    layout === 'stamp' ? (
                      <div style={{ width: 56, height: 56, borderRadius: '50%', border: `2px solid ${colors.pri}`, margin: layout === 'modern' ? '0' : '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: colors.pri, fontWeight: 700 }}>
                        LOGO
                      </div>
                    ) : (
                      <div style={{ fontSize: 18, color: colors.pri, fontWeight: 700 }}>✦</div>
                    )
                  )}
                </div>
              )}

              {/* Shop name (non-elegant) */}
              {layout !== 'elegant' && (
                <div style={{ textAlign: layout === 'modern' ? 'left' : 'center', marginBottom: 4 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: colors.t, letterSpacing: 1 }}>{shopName}</div>
                  {shopSub && <div style={{ fontSize: 10, color: colors.t3, marginTop: 2 }}>{shopSub}</div>}
                </div>
              )}

              {/* Receipt title */}
              <div style={{ textAlign: layout === 'modern' ? 'left' : 'center', margin: '8px 0' }}>
                <div style={{ fontSize: 11, color: colors.pri, fontWeight: 500, letterSpacing: 2 }}>收 據 RECEIPT</div>
              </div>

              <DividerLine style={divStyle} color={colors.pri} opacity={0.3} />

              {/* Receipt info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: colors.t3, margin: '8px 0' }}>
                <span>單號: INV-20250505-001</span>
                <span>2025-05-05</span>
              </div>
              <div style={{ fontSize: 10, color: colors.t3, marginBottom: 8 }}>
                客戶: Emily Chan　|　美容師: Mia
              </div>

              <DividerLine style={divStyle} color={R(colors.brd, 1)} opacity={0.3} />

              {/* Items */}
              <div style={{ margin: '10px 0' }}>
                {[
                  { name: '日式美甲', price: 480 },
                  { name: '手部護理 SPA', price: 280 },
                  { name: '卸甲', price: 100 },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: colors.t2, padding: '4px 0' }}>
                    <span>{item.name}</span>
                    <span>${item.price}</span>
                  </div>
                ))}
              </div>

              <DividerLine style={divStyle} color={R(colors.brd, 1)} opacity={0.3} />

              {/* Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: colors.t3, padding: '4px 0' }}>
                <span>小計</span><span>$860</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: colors.pri, padding: '4px 0' }}>
                <span>折扣 (VIP 9折)</span><span>-$86</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, color: colors.t, padding: '8px 0 4px', borderTop: `1px solid ${R(colors.brd, 0.3)}`, marginTop: 4 }}>
                <span>合計</span><span>$774</span>
              </div>
              <div style={{ fontSize: 10, color: colors.t3, textAlign: 'right' }}>付款方式: PayMe</div>

              <DividerLine style={divStyle} color={colors.pri} opacity={0.3} />

              {/* QR */}
              {showQR && (
                <div style={{ textAlign: 'center', margin: '10px 0' }}>
                  <div style={{ width: 48, height: 48, margin: '0 auto', border: `1px solid ${R(colors.brd, 0.4)}`, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: colors.t3 }}>
                    QR
                  </div>
                  <div style={{ fontSize: 9, color: colors.t3, marginTop: 4 }}>掃碼查看電子收據</div>
                </div>
              )}

              {/* Footer */}
              <div style={{ textAlign: 'center', marginTop: 10 }}>
                <div style={{ fontSize: 11, color: colors.pri, fontWeight: 500 }}>{footerText}</div>
                {shopPhone && <div style={{ fontSize: 9, color: colors.t3, marginTop: 4 }}>📞 {shopPhone}</div>}
              </div>

              {/* Bottom decoration */}
              {headerDeco && layout !== 'minimal' && (
                <div style={{ textAlign: 'center', marginTop: 10, color: colors.pri, fontSize: 10, letterSpacing: 3, opacity: 0.6 }}>
                  ✿ ─────── ✿ ─────── ✿
                </div>
              )}
            </div>
          </div>

          {/* Preview label */}
          <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: '#999' }}>
            即時預覽 · {pal.n} · {fnt.n}
          </div>
        </div>
      </div>

      {/* ═══ Toast ═══ */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
              background: toast.type === 'error' ? '#c44' : '#333', color: '#fff',
              padding: '10px 20px', borderRadius: 8, fontSize: 13, zIndex: 9999,
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
