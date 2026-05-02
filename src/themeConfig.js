// src/themeConfig.js — 共用主題資料
export const R = (a, o) => `rgba(${a[0]},${a[1]},${a[2]},${o})`;

export const PG = [
  { id:'floral', n:'🌸 花卉系', items:[
    {id:'rosemorn',n:'玫瑰晨霧',l:{bg:'#F5EEF0',card:[255,251,252],pri:'#C4849A',sec:'#DDB8C4',ter:'#EDD8E0',t:'#38242e',t2:'#6a4a56',t3:'#9e7e88',brd:[200,180,188],sh:[164,130,144]},d:{bg:'#1e1418',card:[40,26,30],pri:'#a87088',sec:'#7c5266',ter:'#584050',t:'#ecdae0',t2:'#ae9aa0',t3:'#6e5a62',brd:[76,56,64],sh:[118,84,98]}},
    {id:'peony',n:'牡丹暮色',l:{bg:'#F4ECF0',card:[255,250,252],pri:'#B0607A',sec:'#CC9AAE',ter:'#E6D0D8',t:'#361824',t2:'#663050',t3:'#9a7082',brd:[196,170,180],sh:[156,120,136]},d:{bg:'#1e1014',card:[38,22,26],pri:'#9a5068',sec:'#7a4460',ter:'#56384a',t:'#ecdade',t2:'#ae90a0',t3:'#6c5464',brd:[74,50,58],sh:[114,78,92]}},
    {id:'lavender',n:'薰衣草田',l:{bg:'#F0EEF6',card:[252,250,255],pri:'#9078B4',sec:'#B4A8CC',ter:'#D4CCE4',t:'#2c2440',t2:'#564874',t3:'#8878A4',brd:[184,172,208],sh:[140,126,170]},d:{bg:'#181420',card:[30,26,40],pri:'#8870a8',sec:'#5e5078',ter:'#42385a',t:'#e8e0f0',t2:'#a89ec0',t3:'#5e5474',brd:[56,50,74],sh:[90,80,120]}},
    {id:'gardenia',n:'梔子花白',l:{bg:'#F8F4EC',card:[255,254,248],pri:'#B8A880',sec:'#D4C8A4',ter:'#E8E0CA',t:'#302c1c',t2:'#60584a',t3:'#948c78',brd:[196,186,162],sh:[158,144,112]},d:{bg:'#1c1c14',card:[36,34,24],pri:'#a09070',sec:'#78705a',ter:'#52503e',t:'#ece8d8',t2:'#aaa490',t3:'#686252',brd:[72,68,50],sh:[112,106,76]}},
    {id:'peachred',n:'桃花嫣紅',l:{bg:'#F6EEE8',card:[255,252,250],pri:'#D0907C',sec:'#E4B8A8',ter:'#EFDDD6',t:'#3a2420',t2:'#6c4844',t3:'#9e7870',brd:[202,180,172],sh:[166,134,124]},d:{bg:'#1e1612',card:[40,28,24],pri:'#b47c6a',sec:'#886058',ter:'#5c4440',t:'#ecdce0',t2:'#b09a94',t3:'#6e5e5a',brd:[76,58,52],sh:[118,88,80]}},
    {id:'paeonia',n:'芍藥軟粉',l:{bg:'#F6EFF2',card:[255,252,254],pri:'#CC98AE',sec:'#E0BCC8',ter:'#EEDCDC',t:'#3a2630',t2:'#6a4e5c',t3:'#9e8490',brd:[202,182,190],sh:[166,136,150]},d:{bg:'#1e1418',card:[40,26,30],pri:'#b08098',sec:'#80606e',ter:'#584650',t:'#ecdae0',t2:'#ae9aa0',t3:'#6e5c64',brd:[76,56,64],sh:[118,84,98]}},
    {id:'hydrangea',n:'繡球紫藍',l:{bg:'#EEF0F6',card:[250,252,255],pri:'#7898C4',sec:'#A8B8D8',ter:'#CCDAEA',t:'#24283e',t2:'#4a5268',t3:'#7a8098',brd:[168,182,208],sh:[118,136,170]},d:{bg:'#141828',card:[24,30,44],pri:'#6484b0',sec:'#4e6488',ter:'#384868',t:'#d8dff0',t2:'#8ea0b8',t3:'#546474',brd:[44,60,82],sh:[64,92,130]}},
    {id:'jasmine',n:'茉莉白茶',l:{bg:'#F4F0E8',card:[255,254,248],pri:'#A8B890',sec:'#C8D4B4',ter:'#DFE8D2',t:'#28301c',t2:'#545e44',t3:'#8a9478',brd:[182,194,168],sh:[138,150,120]},d:{bg:'#181e12',card:[28,36,22],pri:'#8a9a74',sec:'#606e50',ter:'#444e38',t:'#e0e8d8',t2:'#9aaa88',t3:'#5c6850',brd:[54,64,46],sh:[80,98,66]}},
  ]},
  { id:'west', n:'🌹 西洋系', items:[
    {id:'rosyblush',n:'玫瑰粉灰',l:{bg:'#F4EAE8',card:[255,250,248],pri:'#BE8480',sec:'#D6B49C',ter:'#E8DFCD',t:'#382428',t2:'#684c50',t3:'#9c8084',brd:[198,174,170],sh:[162,128,124]},d:{bg:'#1e1416',card:[40,26,26],pri:'#a47070',sec:'#865e4e',ter:'#5c4842',t:'#ece0dc',t2:'#ae9898',t3:'#6e5e5c',brd:[76,54,52],sh:[120,88,84]}},
    {id:'antique',n:'古董蕾絲',l:{bg:'#F2EDE4',card:[255,252,244],pri:'#A89878',sec:'#C4B498',ter:'#E0D8C0',t:'#2e2818',t2:'#5e5240',t3:'#948a74',brd:[190,178,150],sh:[148,134,104]},d:{bg:'#1c1810',card:[36,30,20],pri:'#907e60',sec:'#6e6048',ter:'#4e4836',t:'#ece6d8',t2:'#aca090',t3:'#6c6452',brd:[72,64,46],sh:[110,98,70]}},
    {id:'celeste',n:'蔚藍薄霧',l:{bg:'#EEF2F6',card:[248,252,255],pri:'#88A8C2',sec:'#AECAD8',ter:'#CCDBE8',t:'#202c36',t2:'#485a68',t3:'#7c8e9e',brd:[164,188,208],sh:[114,146,170]},d:{bg:'#121c24',card:[22,32,44],pri:'#6e94ae',sec:'#4e667e',ter:'#384e60',t:'#d8e4ee',t2:'#90a6b8',t3:'#546476',brd:[44,64,80],sh:[62,96,128]}},
    {id:'silverpink',n:'銀粉煙羅',l:{bg:'#F2EEF0',card:[254,250,252],pri:'#B098A0',sec:'#C8B4BC',ter:'#DCCECE',t:'#34282c',t2:'#645258',t3:'#988890',brd:[192,178,184],sh:[152,132,138]},d:{bg:'#1c1618',card:[36,26,28],pri:'#9a8488',sec:'#7a6470',ter:'#545054',t:'#ece4e8',t2:'#ae9ea4',t3:'#6e6268',brd:[72,56,60],sh:[112,88,94]}},
    {id:'dustyslate',n:'霧藍石板',l:{bg:'#ECF0F4',card:[250,252,255],pri:'#7E90A2',sec:'#9EB0C2',ter:'#C4D0DC',t:'#222a34',t2:'#4a5462',t3:'#7a8692',brd:[162,174,190],sh:[112,128,148]},d:{bg:'#141a20',card:[24,30,38],pri:'#6a7e92',sec:'#4e5e72',ter:'#384858',t:'#d8e0e8',t2:'#92a0ae',t3:'#56646e',brd:[44,56,70],sh:[64,88,112]}},
    {id:'lavmist',n:'薰霧銀紫',l:{bg:'#EEECF4',card:[252,250,255],pri:'#8880A0',sec:'#AEA8BF',ter:'#CEC8D6',t:'#2c2836',t2:'#565062',t3:'#8c869a',brd:[178,172,196],sh:[136,128,160]},d:{bg:'#181620',card:[30,28,40],pri:'#9e98b8',sec:'#665e7e',ter:'#444058',t:'#e8e4ec',t2:'#9e98ae',t3:'#5e5870',brd:[56,52,72],sh:[94,88,116]}},
    {id:'oyster',n:'蠔殼粉霧',l:{bg:'#F4EEEC',card:[255,252,250],pri:'#B6908E',sec:'#D2B6B2',ter:'#E6D4D0',t:'#342828',t2:'#645050',t3:'#9a8484',brd:[198,178,176],sh:[160,134,132]},d:{bg:'#1c1414',card:[38,26,26],pri:'#9a7a78',sec:'#786062',ter:'#524848',t:'#ece0e0',t2:'#ae9e9e',t3:'#6c5e5e',brd:[74,54,54],sh:[116,88,86]}},
    {id:'lilac',n:'丁香紫灰',l:{bg:'#F2EEF6',card:[252,250,255],pri:'#9C88B0',sec:'#BEB0CE',ter:'#D8D0E4',t:'#2e2838',t2:'#58506a',t3:'#8e859c',brd:[186,176,202],sh:[144,132,164]},d:{bg:'#1a1620',card:[32,28,40],pri:'#9080a8',sec:'#665a7a',ter:'#46405c',t:'#e8e2f0',t2:'#a29aae',t3:'#605870',brd:[58,52,72],sh:[94,84,118]}},
  ]},
  { id:'earth', n:'🪵 大地系', items:[
    {id:'terra',n:'柔陶暮色',l:{bg:'#f2ece8',card:[255,250,246],pri:'#a07a68',sec:'#c4a898',ter:'#dac8bc',t:'#3a302a',t2:'#6e5e54',t3:'#a09488',brd:[196,176,162],sh:[160,134,118]},d:{bg:'#1e1816',card:[40,32,28],pri:'#b89480',sec:'#8a6e5e',ter:'#5e4a3e',t:'#ece2da',t2:'#b4a498',t3:'#746660',brd:[78,62,52],sh:[120,96,82]}},
    {id:'caramel',n:'焦糖杏仁',l:{bg:'#f4f0ea',card:[255,252,246],pri:'#a89070',sec:'#c8b89c',ter:'#ddd4c4',t:'#342e24',t2:'#6a5e4c',t3:'#9c9280',brd:[192,178,154],sh:[156,140,112]},d:{bg:'#1c1a16',card:[38,34,26],pri:'#bea880',sec:'#887660',ter:'#5c5040',t:'#ece4d6',t2:'#b0a48e',t3:'#706650',brd:[72,64,48],sh:[118,104,78]}},
    {id:'moss',n:'苔褐暖木',l:{bg:'#f0ece6',card:[252,250,244],pri:'#7a7460',sec:'#a09878',ter:'#c4bca4',t:'#302e26',t2:'#5e5a4c',t3:'#908a78',brd:[180,174,154],sh:[138,130,108]},d:{bg:'#1a1a16',card:[36,34,28],pri:'#9c9478',sec:'#6a6450',ter:'#484438',t:'#e8e4da',t2:'#a8a290',t3:'#646052',brd:[64,60,48],sh:[104,98,78]}},
    {id:'amberw',n:'琥珀麥穗',l:{bg:'#F2EAE0',card:[254,248,240],pri:'#9E7040',sec:'#BC9860',ter:'#D6BC94',t:'#2c2010',t2:'#5a4030',t3:'#967856',brd:[190,168,132],sh:[152,120,84]},d:{bg:'#1a1610',card:[34,26,16],pri:'#886030',sec:'#6a4e34',ter:'#4c3c28',t:'#eadecb',t2:'#ac9c7e',t3:'#6c5a3c',brd:[70,56,36],sh:[108,84,52]}},
    {id:'dove',n:'鴿灰鼠尾',l:{bg:'#f0ede8',card:[255,252,248],pri:'#9b9c9c',sec:'#a5b8a0',ter:'#c0c4b8',t:'#3a3a38',t2:'#6e6e6a',t3:'#9e9e98',brd:[170,170,164],sh:[140,140,136]},d:{bg:'#1c1e1c',card:[38,42,38],pri:'#b0b2a8',sec:'#7a8a74',ter:'#5a6456',t:'#e4e4e0',t2:'#a8a8a4',t3:'#6e706c',brd:[68,72,66],sh:[90,94,86]}},
    {id:'sand',n:'砂岩暖粉',l:{bg:'#f4eeec',card:[255,252,250],pri:'#b09090',sec:'#ceb8b4',ter:'#dfd4d0',t:'#362e2c',t2:'#685854',t3:'#9c8e8a',brd:[198,180,176],sh:[164,142,138]},d:{bg:'#1e1818',card:[38,30,30],pri:'#bea0a0',sec:'#7e6666',ter:'#564848',t:'#ece4e2',t2:'#b4a6a4',t3:'#6e6060',brd:[74,58,58],sh:[122,100,100]}},
    {id:'slate',n:'青石靛藍',l:{bg:'#E8ECF0',card:[248,250,254],pri:'#607098',sec:'#8898B4',ter:'#B8C4D0',t:'#1a2030',t2:'#3e4a60',t3:'#708090',brd:[158,172,194],sh:[100,120,154]},d:{bg:'#141820',card:[24,28,38],pri:'#8090b4',sec:'#4e5e7a',ter:'#384460',t:'#d4dae8',t2:'#8898ac',t3:'#50606e',brd:[44,54,72],sh:[68,90,126]}},
    {id:'olive',n:'橄欖深褐',l:{bg:'#EAE8E0',card:[252,250,244],pri:'#6a7050',sec:'#909678',ter:'#b8bc9a',t:'#222014',t2:'#4a4c38',t3:'#787a5e',brd:[174,178,154],sh:[122,128,96]},d:{bg:'#1a1a12',card:[32,32,22],pri:'#8a9070',sec:'#5a6048',ter:'#404638',t:'#e4e6d8',t2:'#a2a890',t3:'#62685a',brd:[60,64,48],sh:[94,100,70]}},
  ]},
  { id:'bw', n:'⚫ 黑白系', items:[
    {id:'purewhite',n:'純白極簡',l:{bg:'#FAFAFA',card:[255,255,255],pri:'#888888',sec:'#AAAAAA',ter:'#CCCCCC',t:'#1a1a1a',t2:'#444444',t3:'#888888',brd:[200,200,200],sh:[160,160,160]},d:{bg:'#1a1a1a',card:[32,32,32],pri:'#999999',sec:'#666666',ter:'#444444',t:'#f0f0f0',t2:'#aaaaaa',t3:'#666666',brd:[60,60,60],sh:[90,90,90]}},
    {id:'ivory',n:'象牙暖白',l:{bg:'#F8F4EC',card:[255,253,246],pri:'#9C9488',sec:'#BCB4A8',ter:'#D8D0C4',t:'#282420',t2:'#504c46',t3:'#888480',brd:[196,190,180],sh:[154,148,136]},d:{bg:'#201e1a',card:[38,36,30],pri:'#a09690',sec:'#706c64',ter:'#4e4c44',t:'#eceae4',t2:'#aeaaa2',t3:'#6c6860',brd:[72,68,60],sh:[110,106,96]}},
    {id:'pearl',n:'珍珠銀白',l:{bg:'#F4F4F6',card:[255,255,255],pri:'#9898A8',sec:'#B8B8C4',ter:'#D4D4DC',t:'#24242e',t2:'#4e4e5a',t3:'#888890',brd:[190,190,200],sh:[148,148,160]},d:{bg:'#181820',card:[30,30,38],pri:'#a0a0b2',sec:'#686878',ter:'#484858',t:'#e8e8ee',t2:'#a8a8b4',t3:'#686874',brd:[56,56,68],sh:[86,86,100]}},
    {id:'pencilgray',n:'鉛筆細灰',l:{bg:'#EEEEEE',card:[250,250,250],pri:'#707070',sec:'#989898',ter:'#C0C0C0',t:'#1e1e1e',t2:'#484848',t3:'#808080',brd:[180,180,180],sh:[128,128,128]},d:{bg:'#1e1e1e',card:[34,34,34],pri:'#909090',sec:'#606060',ter:'#404040',t:'#eeeeee',t2:'#aaaaaa',t3:'#686868',brd:[60,60,60],sh:[88,88,88]}},
    {id:'steelgray',n:'鋼鐵質感',l:{bg:'#EAEAEC',card:[248,250,252],pri:'#606870',sec:'#9098A0',ter:'#BEC4C8',t:'#1e2228',t2:'#464e56',t3:'#7a8088',brd:[176,184,192],sh:[122,130,140]},d:{bg:'#181c20',card:[28,32,36],pri:'#7888a0',sec:'#505c68',ter:'#384048',t:'#dce0e4',t2:'#90a0a8',t3:'#566068',brd:[50,58,66],sh:[78,90,102]}},
    {id:'charcoal',n:'木炭霧灰',l:{bg:'#E8E6E4',card:[248,246,244],pri:'#585654',sec:'#807e7a',ter:'#ACACAA',t:'#1e1c1a',t2:'#484644',t3:'#787674',brd:[176,174,170],sh:[120,118,114]},d:{bg:'#1e1c1a',card:[32,30,28],pri:'#8a8886',sec:'#606060',ter:'#404040',t:'#eeecec',t2:'#aaaa9e',t3:'#686866',brd:[58,56,54],sh:[88,86,84]}},
    {id:'inkblack',n:'墨黑奢華',l:{bg:'#E8E6E8',card:[250,248,252],pri:'#383838',sec:'#606064',ter:'#909094',t:'#141418',t2:'#3a3a3e',t3:'#747478',brd:[168,168,174],sh:[104,104,110]},d:{bg:'#141416',card:[24,24,26],pri:'#c8c8cc',sec:'#848488',ter:'#505054',t:'#f0f0f2',t2:'#a8a8ac',t3:'#686868',brd:[48,48,52],sh:[80,80,86]}},
    {id:'midnight',n:'暗夜深藍',l:{bg:'#ECEEEE',card:[250,252,254],pri:'#283848',sec:'#506070',ter:'#8898A4',t:'#141c24',t2:'#384048',t3:'#6a7880',brd:[164,180,192],sh:[110,130,146]},d:{bg:'#0e1218',card:[18,22,30],pri:'#9aacb8',sec:'#506070',ter:'#2e3840',t:'#d6dee6',t2:'#8898a4',t3:'#4e5e68',brd:[38,50,64],sh:[58,80,100]}},
  ]},
];

export const PS = PG.flatMap(g => g.items);

export const FGRP = [
  { id:'black', n:'一 · 黑體', desc:'現代易讀', items:[
    {id:'notosan',n:'思源黑體',e:'Noto Sans TC',v:'"Noto Sans TC",sans-serif',cat:'現代',demo:'美睫預約'},
    {id:'sys',n:'系統黑體',e:'System',v:'-apple-system,"Noto Sans TC",sans-serif',cat:'簡潔',demo:'J.LAB'},
  ]},
  { id:'ming', n:'二 · 明體宋體', desc:'典雅端莊', items:[
    {id:'notoser',n:'思源宋體',e:'Noto Serif TC',v:'"Noto Serif TC",serif',cat:'端莊',demo:'美睫預約'},
    {id:'shippori',n:'Shippori明朝',e:'Shippori Mincho',v:'"Shippori Mincho","Noto Serif TC",serif',cat:'日式',demo:'美睫預約'},
    {id:'hina',n:'雛明朝纖細',e:'Hina Mincho',v:'"Hina Mincho","Noto Serif TC",serif',cat:'纖細',demo:'美睫'},
    {id:'kaisei',n:'開星展示明朝',e:'Kaisei Decol',v:'"Kaisei Decol","Noto Serif TC",serif',cat:'展示',demo:'美睫預約'},
    {id:'biz',n:'BIZ商業明朝',e:'BIZ UDPMincho',v:'"BIZ UDPMincho","Noto Serif TC",serif',cat:'商務',demo:'美睫預約'},
    {id:'lxgw',n:'霞鶩文楷',e:'LXGW WenKai TC',v:'"LXGW WenKai TC","Noto Serif TC",serif',cat:'文藝',demo:'美睫預約'},
  ]},
  { id:'round', n:'三 · 圓體', desc:'活潑親切', items:[
    {id:'zcoolkl',n:'快樂圓體',e:'ZCOOL KuaiLe',v:'"ZCOOL KuaiLe","Noto Sans TC",sans-serif',cat:'活潑',demo:'美睫預約'},
    {id:'nunito',n:'Nunito圓體',e:'Nunito',v:'"Nunito","Noto Sans TC",sans-serif',cat:'溫潤',demo:'J.LAB 美'},
  ]},
  { id:'hand', n:'四 · 手寫楷書', desc:'溫度人文', items:[
    {id:'mashan',n:'馬善政楷書',e:'Ma Shan Zheng',v:'"Ma Shan Zheng","Noto Serif TC",cursive',cat:'楷書',demo:'美睫'},
    {id:'zhimang',n:'知芒星草書',e:'Zhi Mang Xing',v:'"Zhi Mang Xing","Noto Serif TC",cursive',cat:'草書',demo:'美睫'},
  ]},
  { id:'serif', n:'五 · 西式襯線', desc:'奢華精緻', items:[
    {id:'corm',n:'Cormorant古典',e:'Cormorant',v:'"Cormorant Garamond",serif',cat:'精緻',demo:'J · LAB'},
    {id:'play',n:'Playfair華麗',e:'Playfair',v:'"Playfair Display",serif',cat:'華麗',demo:'J · LAB'},
    {id:'lora',n:'Lora溫潤',e:'Lora',v:'"Lora",serif',cat:'書寫',demo:'J · LAB'},
    {id:'cinzel',n:'Cinzel刻碑',e:'Cinzel',v:'"Cinzel",serif',cat:'莊嚴',demo:'JLAB'},
  ]},
  { id:'sans', n:'六 · 西式無襯', desc:'俐落現代', items:[
    {id:'raleway',n:'Raleway纖細',e:'Raleway',v:'"Raleway",sans-serif',cat:'飄逸',demo:'J.LAB'},
    {id:'jose',n:'Josefin極簡',e:'Josefin Sans',v:'"Josefin Sans",sans-serif',cat:'時尚',demo:'J.LAB'},
    {id:'mont',n:'Montserrat幾何',e:'Montserrat',v:'"Montserrat",sans-serif',cat:'現代',demo:'J.LAB'},
    {id:'dm',n:'DM Sans圓潤',e:'DM Sans',v:'"DM Sans",sans-serif',cat:'友善',demo:'J.LAB'},
  ]},
];

export const FS = FGRP.flatMap(g => g.items);

export const RS = [
  {id:'none',n:'無',v:0},
  {id:'sm',n:'微圓',v:6},
  {id:'md',n:'中圓',v:12},
  {id:'lg',n:'大圓',v:20},
];

export const TX = [
  {id:'none',n:'無'},{id:'linen',n:'亞麻'},{id:'paper',n:'宣紙'},{id:'silk',n:'絲綢'},
  {id:'weave',n:'編織'},{id:'marble',n:'大理石'},{id:'grain',n:'磨砂'},{id:'bamboo',n:'竹節'},
  {id:'diamond',n:'菱格'},{id:'herring',n:'人字'},{id:'honey',n:'蜂巢'},{id:'dots',n:'圓點'},
];

export function texCss(id, op) {
  const o = op;
  switch(id) {
    case 'linen': return {backgroundImage:`repeating-linear-gradient(0deg,rgba(0,0,0,${o*.06}) 0,rgba(0,0,0,${o*.06}) 1px,transparent 1px,transparent 4px),repeating-linear-gradient(90deg,rgba(0,0,0,${o*.04}) 0,rgba(0,0,0,${o*.04}) 1px,transparent 1px,transparent 4px)`};
    case 'paper': return {backgroundImage:`radial-gradient(rgba(0,0,0,${o*.09}) 1px,transparent 0)`,backgroundSize:'5px 5px'};
    case 'silk': return {backgroundImage:`repeating-linear-gradient(135deg,rgba(255,255,255,${o*.2}) 0,rgba(255,255,255,${o*.2}) 1px,transparent 1px,transparent 12px),repeating-linear-gradient(45deg,rgba(255,255,255,${o*.12}) 0,rgba(255,255,255,${o*.12}) 1px,transparent 1px,transparent 12px)`};
    case 'weave': return {backgroundImage:`repeating-linear-gradient(0deg,rgba(0,0,0,${o*.05}) 0,rgba(0,0,0,${o*.05}) 1px,transparent 1px,transparent 6px),repeating-linear-gradient(90deg,rgba(0,0,0,${o*.05}) 0,rgba(0,0,0,${o*.05}) 1px,transparent 1px,transparent 6px)`};
    case 'marble': return {backgroundImage:`radial-gradient(ellipse at 20% 20%,rgba(255,255,255,${o*.28}) 0%,transparent 50%),radial-gradient(ellipse at 80% 80%,rgba(255,255,255,${o*.2}) 0%,transparent 45%)`};
    case 'grain': return {backgroundImage:`repeating-linear-gradient(30deg,rgba(0,0,0,${o*.03}) 0,transparent 1px,transparent 3px),repeating-linear-gradient(150deg,rgba(0,0,0,${o*.03}) 0,transparent 1px,transparent 3px)`};
    case 'bamboo': return {backgroundImage:`repeating-linear-gradient(90deg,rgba(0,0,0,${o*.05}) 0,rgba(0,0,0,${o*.05}) 1px,transparent 1px,transparent 14px),repeating-linear-gradient(90deg,rgba(0,0,0,${o*.025}) 7px,rgba(0,0,0,${o*.025}) 8px,transparent 8px,transparent 14px)`};
    case 'diamond': return {backgroundImage:`repeating-linear-gradient(45deg,rgba(0,0,0,${o*.05}) 0,rgba(0,0,0,${o*.05}) 1px,transparent 1px,transparent 8px),repeating-linear-gradient(-45deg,rgba(0,0,0,${o*.05}) 0,rgba(0,0,0,${o*.05}) 1px,transparent 1px,transparent 8px)`};
    case 'herring': return {backgroundImage:`repeating-linear-gradient(45deg,rgba(0,0,0,${o*.055}) 0,rgba(0,0,0,${o*.055}) 1px,transparent 1px,transparent 6px),repeating-linear-gradient(-45deg,rgba(0,0,0,${o*.055}) 0,rgba(0,0,0,${o*.055}) 1px,transparent 1px,transparent 6px)`,backgroundSize:'12px 12px'};
    case 'honey': return {backgroundImage:`radial-gradient(circle,rgba(0,0,0,${o*.08}) 2px,transparent 2px)`,backgroundSize:'12px 10px'};
    case 'dots': return {backgroundImage:`radial-gradient(circle,rgba(0,0,0,${o*.1}) 1.5px,transparent 1.5px)`,backgroundSize:'14px 14px'};
    default: return {};
  }
}

// 從設定建立完整 theme 物件
export function buildTheme(settings) {
  const {
    palette_id = 'rosemorn',
    font_id = 'corm',
    radius_id = 'sm',
    dark_mode = false,
    card_opacity = 0.9,
    custom_primary = '',
    custom_secondary = '',
    custom_tertiary = '',
    hue_shift = 0,
    saturation_adj = 100,
    brightness_adj = 0,
    bg_texture = 'none',
    bg_texture_opacity = 0.7,
    bg_image_url = '',
    bg_image_opacity = 0.12,
    bg_image_blur = 0,
    glass_card = false,
    btn_style = 'solid',
    shadow_depth = 'normal',
    density = 'normal',
    letter_spacing = 'normal',
    divider_style = 'line',
    brand_name = 'J.LAB',
    brand_subtitle = 'LASH & BEAUTY STUDIO',
  } = settings || {};

  const pal = PS.find(p => p.id === palette_id) || PS[0];
  const fnt = FS.find(f => f.id === font_id) || FS[0];
  const rad = RS.find(r => r.id === radius_id) || RS[1];
  const dk = dark_mode;
  const op = card_opacity;

  const c = dk ? pal.d : pal.l;
  const effOp = (bg_image_url || bg_texture !== 'none') ? Math.max(op, 0.82) : op;
  const cardBg = glass_card && bg_image_url
    ? `rgba(${c.card[0]},${c.card[1]},${c.card[2]},${Math.min(effOp, 0.72)})`
    : R(c.card, effOp);

  const shadowScale = {none:0, soft:0.5, normal:1, deep:2.2}[shadow_depth] || 1;
  const mkSh = (o1, r1, o2, r2) => shadowScale === 0 ? 'none'
    : `0 ${2*shadowScale}px ${r1*shadowScale}px ${R(c.sh, o1*shadowScale)},0 ${1*shadowScale}px ${r2*shadowScale}px ${R(c.sh, o2*shadowScale)}`;

  const padScale = {compact:0.72, normal:1, airy:1.34}[density] || 1;
  const lsMap = {tight:'0px', normal:'0.5px', wide:'2px'}[letter_spacing] || '0.5px';

  const colorFilter = (hue_shift || saturation_adj !== 100 || brightness_adj)
    ? `hue-rotate(${hue_shift}deg) saturate(${saturation_adj/100}) brightness(${1+brightness_adj/100})`
    : undefined;

  return {
    // Colors
    bg: c.bg,
    card: cardBg,
    cardInner: R(c.card, effOp * 0.6),
    pri: custom_primary || c.pri,
    sec: custom_secondary || c.sec,
    ter: custom_tertiary || c.ter,
    t: c.t, t2: c.t2, t3: c.t3,
    brd: R(c.brd, 0.35),
    brd2: R(c.brd, 0.2),
    sh: mkSh(0.08, 12, 0.04, 3),
    sh2: mkSh(0.14, 20, 0.07, 6),
    // Layout
    r: rad.v,
    f: fnt.v,
    dk,
    padScale,
    lsMap,
    colorFilter,
    // Background
    bgTex: bg_texture,
    bgTexOp: bg_texture_opacity,
    bgImg: bg_image_url,
    bgImgOp: bg_image_opacity,
    bgImgBlur: bg_image_blur,
    glassCard: glass_card,
    blur: glass_card && bg_image_url ? 'blur(12px)' : undefined,
    // Button
    btnStyle: btn_style,
    dividerStyle: divider_style,
    // Brand
    brandName: brand_name,
    brandSubtitle: brand_subtitle,
    // Raw refs
    pal, fnt, rad,
  };
}
