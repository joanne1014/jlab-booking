import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronUp, MessageCircle, Clock } from 'lucide-react';

const P = '#b0a08a', PD = '#90806a', PL = '#c8b8a0', PBG = '#eae0d0';
const BTN = '#8a7c68', BTNL = '#a09484';
const BG = '#f4ede4', CD = '#faf6f0', CB = '#d8ccba', DV = '#dcd4c8';
const IB = '#f0e8dc', IBB = '#e4dacb';
const TX = '#3a3430', TM = '#6e6050', TL = '#a09484', TLL = '#c0b8aa';
const DV_BG = '#e6e2dc', DV_BD = '#c8c2b8', DV_TX = '#74706a';
const DA_BG = '#ece4d0', DA_BD = '#ccc0a4', DA_TX = '#7a7258';
const DR_BG = '#e6d4cc', DR_BD = '#c4aea4', DR_TX = '#785a50';
const DS_BG = P, DS_BD = PD;

const SVCS = [
  { id:0, name:'首次試做優惠', tag:'新客限定',
    dz:'首次體驗角蛋白睫毛護理，享受限定優惠價。體驗自然捲翹及滋潤效果。',
    de:'First-time trial offer for keratin lash treatment at a special price.',
    price:280, dur:'約 60 分鐘', durE:'Approx. 60 min',
  },
  { id:1, name:'Italy My Lamination 義大利增粗角蛋白', tag:'店主推薦',
    dz:'使用義大利頂級產品，增粗睫毛厚度及彈性，修護與捲翹並重。',
    de:'Using premium Italian products to increase lash thickness and elasticity, balancing repair and lift.',
    vars:[{l:'單次 $538',p:538},{l:'套票 ($1500)',p:1500}],
    dur:'約 70 分鐘', durE:'Approx. 70 min',
  },
  { id:2, name:'滋潤濃黑角蛋白 (Basic Lash Lift)', price:398,
    dz:'基礎滋潤濃黑護理，讓睫毛自然捲翹、深邃濃黑，呈現健康亮澤。',
    de:'Basic nourishing treatment for natural lift, deep black tint, and healthy shine.',
    dur:'約 60 分鐘', durE:'Approx. 60 min',
  },
  { id:3, name:'日式嫁接 (Lash Extension)', price:450, pl:'$450起',
    dz:'專業嫁接技術，打造自然濃密效果，根據款式及數量另議。',
    de:'Professional extension technique for natural and dense look. Price varies by style and quantity.',
    dur:'約 90 分鐘', durE:'Approx. 90 min',
  },
];

const ADS = [
  { id:'a1',z:'下睫毛角蛋白',e:'Lower Lash Lift',p:250 },
  { id:'a2',z:'受損睫毛修復程序',e:'Lash Repair Treatment',p:150 },
  { id:'a3',z:'卸睫毛服務',e:'Lash Removal',p:100 },
];

const TCS = [
  { id:'t1',l:'1. 店主',e:'Designated Owner',p:50 },
  { id:'t2',l:'2. 隨機分配 (包含店主在內)',e:'Random Assignment (incl. Owner)',p:0 },
];

const WDN = ['日','一','二','三','四','五','六'];
const MEN = ['','JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

function genD(){
  const r=[], b=new Date(2026,4,1);
  const st=['a','a','a','x','a','a','a','a','w','w','x','a','a','a','a','a','f','a','a','a','a','a','w','a','a','x','a','a','a','a'];
  for(let i=0;i<30;i++){
    const d=new Date(b); d.setDate(b.getDate()+i);
    if(st[i]==='x') continue;
    r.push({id:i,day:d.getDate(),mo:d.getMonth()+1,me:MEN[d.getMonth()+1],
      wd:d.getDay(),s:st[i]==='w'?'warn':st[i]==='f'?'full':'ok',
      full: `2026-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`});
  }
  return r;
}

const TS_AM = ['10:00','10:30','11:00','11:30','12:00','12:30'];
const TS_PM = ['13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30'];
const TS_EV = ['17:00','17:30','18:00','18:30','19:00','19:30','20:00'];
const DIS_T = new Set(['12:30','13:00','20:00']);

export default function BookingPage(){
  const [sid,setSid]=useState(null);
  const [vi,setVi]=useState({});
  const [ao,setAo]=useState([]);
  const [did,setDid]=useState(null);
  const [tm,setTm]=useState(null);
  const [nm,setNm]=useState('');
  const [ph,setPh]=useState('');
  const [rk,setRk]=useState('');
  const [tid,setTid]=useState('t2');
  const [done,setDone]=useState(false);
  const [step,setStep]=useState(1);
  const dates=useMemo(genD,[]);

  const r2=useRef(null),r3=useRef(null),r4=useRef(null),r5=useRef(null),r6=useRef(null),rS=useRef(null);
  const refs={2:r2,3:r3,4:r4,5:r5,6:r6,7:rS};

  useEffect(()=>{
    if(!document.getElementById('p3f')){
      const l=document.createElement('link');l.id='p3f';l.rel='stylesheet';
      l.href='https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Noto+Serif+TC:wght@200;300;400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap';
      document.head.appendChild(l);
    }
  },[]);

  const ff="'Noto Serif TC',serif";
  const fp="'Playfair Display',serif";
  const fc="'Cormorant Garamond',serif";

  const sv=SVCS.find(s=>s.id===sid);
  const sp=sv?(sv.vars?sv.vars[vi[sid]||0].p:(sv.price||0)):0;
  const selAddons=ADS.filter(a=>ao.includes(a.id));
  const ap=selAddons.reduce((s,a)=>s+a.p,0);
  const tp=TCS.find(t=>t.id===tid)?.p||0;
  const total=sp+ap+tp;
  const ad=dates.find(d=>d.id===did);
  const tc=TCS.find(t=>t.id===tid);

  const canGo=sid!==null&&did!==null&&tm&&nm.trim()&&ph.trim();

  const scrollTo=(n)=>{
    setTimeout(()=>refs[n]?.current?.scrollIntoView({behavior:'smooth',block:'start'}),280);
  };

  const tao=id=>setAo(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);

  const pick=id=>{
    setSid(id);setDid(null);setTm(null);
    if(step<2) setStep(2);
    scrollTo(2);
  };

  const pickDate=id=>{
    setDid(id);setTm(null);
    if(step<3) setStep(3);
    scrollTo(3);
  };

  const pickTime=t=>{
    setTm(t);
    if(step<4) setStep(4);
    scrollTo(4);
  };

  const goTech=()=>{
    if(!nm.trim()||!ph.trim()) return;
    if(step<5) setStep(5);
    scrollTo(5);
  };

  const crd=(vis=true)=>({
    background:CD,borderRadius:3,padding:'28px 22px',marginBottom:18,
    border:`1px solid ${CB}`,boxShadow:'0 2px 16px rgba(0,0,0,0.03)',
    opacity:vis?1:0.4,pointerEvents:vis?'auto':'none',
    transition:'opacity 0.3s'
  });

  const getDC=s=>{
    if(s==='warn') return {bg:DA_BG,bd:DA_BD,tx:DA_TX};
    if(s==='full') return {bg:'#e8e4dc',bd:CB,tx:TLL};
    return {bg:DV_BG,bd:DV_BD,tx:DV_TX};
  };

  const renderTimeGroup=(label,slots)=>(
    <div style={{marginBottom:16}}>
      <div style={{fontSize:'0.52rem',color:TL,letterSpacing:'0.1em',marginBottom:8,fontWeight:400}}>
        {label}</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7}}>
        {slots.map(t=>{
          const sel=tm===t;
          const dis=DIS_T.has(t);
          return(
            <motion.div key={t} whileTap={dis?{}:{scale:0.96}}
              onClick={()=>{if(!dis)pickTime(t);}}
              style={{textAlign:'center',padding:'13px 6px',borderRadius:3,
                fontFamily:fc,fontSize:'0.88rem',letterSpacing:'0.06em',fontWeight:sel?500:400,
                border:`1px solid ${sel?PD:CB}`,cursor:dis?'not-allowed':'pointer',
                background:sel?P:dis?'#ebe4da':'#fff',color:sel?'#fff':dis?TLL:TX,
                opacity:dis?0.3:1,textDecoration:dis?'line-through':'none',
                transition:'all 0.2s'}}>
              {t}
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  return(
    <div style={{background:BG,minHeight:'100vh',fontFamily:ff,color:TX,maxWidth:480,margin:'0 auto',
      position:'relative',fontWeight:300}}>
      {/* Header */}
{/* Header */}
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 22px',
        position:'sticky',top:0,background:BG,zIndex:10,borderBottom:`1px solid ${DV}`}}>
        <div style={{fontFamily:fp,fontSize:'1.1rem',fontWeight:500,color:TM,letterSpacing:'0.04em',
          fontStyle:'italic'}}>J.LAB</div>
        <button onClick={() => window.location.href = '/admin'}
          style={{padding:'5px 16px',borderRadius:2,border:`1px solid ${CB}`,background:CD,
            fontSize:'0.6rem',color:TL,cursor:'pointer',fontFamily:ff,fontWeight:300,letterSpacing:'0.06em'}}>
          店主入口</button>
      </header>

      <div style={{padding:'0 16px 60px'}}>
        {/* Title */}
        <div style={{textAlign:'center',padding:'36px 0 28px'}}>
          <div style={{fontFamily:fc,fontSize:'0.58rem',letterSpacing:'0.3em',color:P,fontWeight:400}}>
            BOOKING</div>
          <div style={{fontSize:'1.3rem',fontWeight:500,margin:'10px 0 6px',letterSpacing:'0.08em'}}>
            線上預約系統</div>
          <div style={{fontFamily:fc,fontSize:'0.56rem',letterSpacing:'0.22em',color:TL,fontStyle:'italic'}}>
            ONLINE BOOKING SYSTEM</div>
        </div>

        {/* Progress indicator */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:0,marginBottom:28,padding:'0 10px'}}>
          {[1,2,3,4,5,6].map((n,i)=>{
            const active=step>=n;
            return(
              <React.Fragment key={n}>
                <div style={{width:22,height:22,borderRadius:'50%',
                  background:active?P:'transparent',border:`1.5px solid ${active?P:CB}`,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:'0.48rem',fontFamily:fp,fontWeight:500,
                  color:active?'#fff':TLL,transition:'all 0.3s'}}>
                  {active&&step>n?<Check size={10} strokeWidth={3}/>:n}
                </div>
                {i<5&&<div style={{flex:1,height:1,background:step>n?PL:DV,transition:'all 0.3s'}}/>}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step 1: Service */}
        <div style={crd()}>
          <SH n="1" z="選擇預約項目" e="SELECT SERVICE" fp={fp} fc={fc}/>
          {SVCS.map(s=>{
            const sel=sid===s.id;
            return(
              <div key={s.id} onClick={()=>pick(s.id)}
                style={{border:`1px solid ${sel?P:s.tag?PL:CB}`,
                  borderRadius:3,padding:'18px 16px',marginBottom:12,
                  cursor:'pointer',position:'relative',overflow:'hidden',
                  background:sel?PBG:'#fff',transition:'all 0.25s'}}>
                {s.tag&&(
                  <div style={{position:'absolute',top:0,right:0,background:s.id===0?'#c4886c':P,color:'#fff',
                    fontSize:'0.42rem',padding:'3px 10px',letterSpacing:'0.08em',fontWeight:400,
                    borderRadius:'0 2px 0 3px'}}>{s.tag}</div>
                )}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',
                  gap:10,paddingRight:s.tag?50:0}}>
                  <div style={{fontWeight:500,fontSize:'0.8rem',lineHeight:1.5,flex:1}}>{s.name}</div>
                  <div style={{fontFamily:fp,fontWeight:500,color:TM,fontSize:'0.88rem',flexShrink:0}}>
                    {s.pl||(s.vars?`$${s.vars[0].p}`:`$${s.price}`)}
                  </div>
                </div>
                <div style={{fontSize:'0.66rem',color:TM,margin:'8px 0 4px',lineHeight:1.7,fontWeight:300}}>
                  {s.dz}</div>
                <div style={{fontFamily:fc,fontSize:'0.62rem',color:TL,lineHeight:1.6,fontStyle:'italic'}}>
                  {s.de}</div>
                <div style={{display:'flex',alignItems:'center',gap:5,marginTop:10}}>
                  <Clock size={11} color={TL} strokeWidth={1.5}/>
                  <span style={{fontSize:'0.56rem',color:TL,fontWeight:300}}>
                    {s.dur} / <span style={{fontFamily:fc,fontStyle:'italic'}}>{s.durE}</span>
                  </span>
                </div>
                {s.vars&&sel&&(
                  <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:14}}>
                    {s.vars.map((v,idx)=>{
                      const vs=(vi[s.id]||0)===idx;
                      return(
                        <button key={idx} onClick={e=>{e.stopPropagation();setVi(p=>({...p,[s.id]:idx}))}}
                          style={{padding:'8px 18px',borderRadius:2,fontSize:'0.62rem',fontFamily:ff,
                            fontWeight:vs?500:300,letterSpacing:'0.04em',
                            border:`1px solid ${vs?PD:CB}`,background:vs?P:'#fff',
                            color:vs?'#fff':TX,cursor:'pointer',transition:'all 0.2s'}}>
                          {v.l}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Step 2: Add-ons */}
        <div ref={r2} style={crd(step>=2)}>
          <SH n="2" z="可選加購項目" e="OPTIONAL ADD-ONS" fp={fp} fc={fc}/>
          <div style={{fontSize:'0.6rem',color:TL,marginBottom:16,fontWeight:300,lineHeight:1.7}}>
            可根據需要加選以下附加服務，非必選項目。</div>
          {ADS.map(a=>{
            const on=ao.includes(a.id);
            return(
              <div key={a.id} onClick={()=>tao(a.id)}
                style={{display:'flex',alignItems:'center',gap:12,padding:'14px 14px',
                  border:`1px solid ${on?PL:CB}`,borderRadius:3,marginBottom:10,
                  cursor:'pointer',background:on?PBG:'#fff',transition:'all 0.2s'}}>
                <div style={{width:20,height:20,borderRadius:'50%',border:`1.5px solid ${on?P:CB}`,
                  display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,
                  background:on?P:'transparent',transition:'all 0.2s'}}>
                  {on&&<Check size={11} color="#fff" strokeWidth={2.5}/>}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:'0.72rem',fontWeight:on?500:300}}>{a.z}</div>
                  <div style={{fontFamily:fc,fontSize:'0.58rem',fontStyle:'italic',color:TL}}>{a.e}</div>
                </div>
                <div style={{fontFamily:fp,fontWeight:500,color:TM,fontSize:'0.72rem'}}>+${a.p}</div>
              </div>
            );
          })}
          <div style={{textAlign:'right',marginTop:8}}>
            <span style={{fontSize:'0.56rem',color:TL,fontWeight:300}}>
              已選 {ao.length} 項 {ao.length>0&&<span style={{fontFamily:fp}}>+${ap}</span>}
            </span>
          </div>
        </div>

        {/* Step 3: Date */}
        <div ref={r3} style={crd(step>=2)}>
          <SH n="3" z="選擇日期" e="SELECT DATE" fp={fp} fc={fc}/>
          {sid!==null&&<div style={{fontSize:'0.58rem',color:P,marginBottom:16,fontWeight:400,
            background:PBG,padding:'10px 14px',borderRadius:3,border:`1px solid ${PL}`}}>
            已選服務：{sv?.name} {sv?.vars&&<span style={{fontFamily:fp}}>({sv.vars[vi[sid]||0].l})</span>}
          </div>}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7}}>
            {dates.map(d=>{
              const sel=did===d.id;
              const full=d.s==='full';
              const c=getDC(d.s);
              return(
                <motion.div key={d.id} whileTap={full?{}:{scale:0.94}}
                  onClick={()=>{if(!full)pickDate(d.id);}}
                  style={{textAlign:'center',padding:'9px 4px',borderRadius:3,
                    cursor:full?'not-allowed':'pointer',
                    background:sel?DS_BG:c.bg,border:`1px solid ${sel?DS_BD:c.bd}`,
                    opacity:full?0.25:1,transition:'all 0.2s'}}>
                  <div style={{fontSize:'0.42rem',color:sel?'rgba(255,255,255,0.65)':c.tx,
                    letterSpacing:'0.03em'}}>
                    {d.mo}月 / {d.me}</div>
                  <div style={{fontFamily:fp,fontSize:'1.05rem',fontWeight:500,
                    color:sel?'#fff':TX,lineHeight:1.4}}>{d.day}</div>
                  <div style={{fontSize:'0.38rem',color:sel?'rgba(255,255,255,0.65)':c.tx,
                    letterSpacing:'0.03em'}}>週{WDN[d.wd]}</div>
                </motion.div>
              );
            })}
          </div>
          <div style={{display:'flex',gap:14,marginTop:14,justifyContent:'center',flexWrap:'wrap'}}>
            {[['充裕 Available',DV_BG,DV_BD],['尚餘少量 Limited',DA_BG,DA_BD],['已滿 Full',DR_BG,DR_BD]].map(([l,bg,bd])=>(
              <span key={l} style={{fontSize:'0.42rem',color:TL,display:'flex',alignItems:'center',gap:4}}>
                <span style={{width:10,height:10,borderRadius:2,background:bg,border:`1px solid ${bd}`,
                  display:'inline-block'}}/>
                {l}
              </span>
            ))}
          </div>
        </div>

        {/* Step 4: Time */}
        <div ref={r4} style={crd(step>=3)}>
          <SH n="4" z="選擇時段" e="SELECT TIME" fp={fp} fc={fc}/>
          {ad&&<div style={{fontSize:'0.58rem',color:P,marginBottom:16,fontWeight:400,
            background:PBG,padding:'10px 14px',borderRadius:3,border:`1px solid ${PL}`}}>
            已選日期：<span style={{fontFamily:fp}}>{ad.full}</span>（週{WDN[ad.wd]}）
          </div>}
          <div style={{fontSize:'0.52rem',color:TL,marginBottom:14,fontWeight:300,
            display:'flex',alignItems:'center',gap:5}}>
            <Clock size={11} color={TL} strokeWidth={1.5}/>
            營業時間 10:00–20:00 / <span style={{fontFamily:fc,fontStyle:'italic'}}>Operating hours 10:00–20:00</span>
          </div>
          {renderTimeGroup('上午 / MORNING',TS_AM)}
          {renderTimeGroup('下午 / AFTERNOON',TS_PM)}
          {renderTimeGroup('晚間 / EVENING',TS_EV)}
          <div style={{fontSize:'0.5rem',color:TL,textAlign:'center',marginTop:4,fontWeight:300}}>
            劃線時段已被預約 / Crossed-out slots are taken</div>
        </div>

        {/* Step 5: Contact */}
        <div ref={r5} style={crd(step>=4)}>
          <SH n="5" z="聯絡資料" e="CONTACT INFORMATION" fp={fp} fc={fc}/>
          <div style={{marginBottom:18}}>
            <div style={{fontSize:'0.6rem',color:TL,marginBottom:8,letterSpacing:'0.04em',fontWeight:300}}>
              您的姓名 / <span style={{fontFamily:fc,fontStyle:'italic'}}>YOUR NAME</span>
              <span style={{color:DR_TX,marginLeft:4}}>*</span>
            </div>
            <input value={nm} onChange={e=>setNm(e.target.value)} placeholder="e.g. Miss Chan"
              style={{width:'100%',padding:'13px 16px',borderRadius:3,border:`1px solid ${CB}`,
                background:IB,fontSize:'0.76rem',fontFamily:ff,fontWeight:300,outline:'none',
                boxSizing:'border-box',color:TX}}/>
          </div>
          <div style={{marginBottom:18}}>
            <div style={{fontSize:'0.6rem',color:TL,marginBottom:8,letterSpacing:'0.04em',fontWeight:300}}>
              WhatsApp 電話 / <span style={{fontFamily:fc,fontStyle:'italic'}}>PHONE NUMBER</span>
              <span style={{color:DR_TX,marginLeft:4}}>*</span>
            </div>
            <input value={ph} onChange={e=>setPh(e.target.value)} placeholder="e.g. 6000 0000" type="tel"
              style={{width:'100%',padding:'13px 16px',borderRadius:3,border:`1px solid ${CB}`,
                background:IB,fontSize:'0.76rem',fontFamily:ff,fontWeight:300,outline:'none',
                boxSizing:'border-box',color:TX}}/>
          </div>
          <div style={{marginBottom:4}}>
            <div style={{fontSize:'0.6rem',color:TL,marginBottom:8,letterSpacing:'0.04em',fontWeight:300}}>
              備註 / <span style={{fontFamily:fc,fontStyle:'italic'}}>REMARKS (OPTIONAL)</span>
            </div>
            <textarea value={rk} onChange={e=>setRk(e.target.value)}
              placeholder="如有特別需要，請在此處註明 / Any special requests..."
              rows={3}
              style={{width:'100%',padding:'13px 16px',borderRadius:3,border:`1px solid ${CB}`,
                background:IB,fontSize:'0.72rem',fontFamily:ff,fontWeight:300,outline:'none',
                boxSizing:'border-box',color:TX,resize:'vertical',lineHeight:1.6}}/>
          </div>
          {nm.trim()&&ph.trim()&&step<5&&(
            <motion.button whileTap={{scale:0.97}} onClick={goTech}
              style={{width:'100%',padding:'14px',marginTop:14,borderRadius:3,border:'none',
                background:BTN,color:'#fff',fontFamily:ff,fontSize:'0.72rem',cursor:'pointer',
                fontWeight:400,letterSpacing:'0.08em'}}>
              下一步 / NEXT →
            </motion.button>
          )}
        </div>

        {/* Step 6: Technician */}
        <div ref={r6} style={crd(step>=5)}>
          <SH n="6" z="指定技師" e="SELECT TECHNICIAN" fp={fp} fc={fc}/>
          <div style={{fontSize:'0.6rem',color:TL,marginBottom:16,fontWeight:300,lineHeight:1.7}}>
            可選擇指定店主或隨機分配技師，指定店主需另加 $50 附加費。</div>
          {TCS.map(t=>{
            const sel=tid===t.id;
            return(
              <motion.div key={t.id} whileTap={{scale:0.98}} onClick={()=>{setTid(t.id);if(step<6)setStep(6);}}
                style={{display:'flex',justifyContent:'space-between',alignItems:'center',
                  padding:'16px 18px',borderRadius:3,marginBottom:8,cursor:'pointer',
                  background:sel?P:'#fff',border:`1px solid ${sel?PD:CB}`,transition:'all 0.25s'}}>
                <div>
                  <div style={{fontSize:'0.76rem',fontWeight:sel?500:300,color:sel?'#fff':TX}}>{t.l}</div>
                  <div style={{fontFamily:fc,fontSize:'0.58rem',fontStyle:'italic',
                    color:sel?'rgba(255,255,255,0.7)':TL,marginTop:2}}>{t.e}</div>
                </div>
                <div style={{fontFamily:fp,fontWeight:500,color:sel?'#fff':TM,fontSize:'0.76rem'}}>
                  {t.p?`+$${t.p}`:'免費 / Free'}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Summary */}
        <div ref={rS} style={crd(step>=5)}>
          <div style={{textAlign:'center',marginBottom:22}}>
            <div style={{fontFamily:fc,fontSize:'0.54rem',letterSpacing:'0.24em',color:P,fontWeight:400}}>
              ORDER SUMMARY</div>
            <div style={{fontSize:'1.05rem',fontWeight:500,marginTop:6,letterSpacing:'0.06em'}}>
              預約摘要</div>
          </div>

          <div style={{background:IB,borderRadius:3,padding:'18px 16px',border:`1px solid ${DV}`,
            marginBottom:18}}>
            {/* Service */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
              <div>
                <div style={{fontSize:'0.56rem',color:TL,fontWeight:300,marginBottom:4}}>服務項目 / Service</div>
                <div style={{fontSize:'0.72rem',fontWeight:500,lineHeight:1.5}}>
                  {sv?sv.name:'尚未選擇'}</div>
                {sv?.vars&&<div style={{fontSize:'0.58rem',color:TM,marginTop:2}}>
                  {sv.vars[vi[sid]||0].l}</div>}
              </div>
              <div style={{fontFamily:fp,fontWeight:500,fontSize:'0.82rem',flexShrink:0,marginLeft:10}}>
                {sv?`$${sp}`:'—'}
              </div>
            </div>

            {/* Add-ons */}
            {selAddons.length>0&&(
              <div style={{borderTop:`1px solid ${DV}`,paddingTop:12,marginBottom:12}}>
                <div style={{fontSize:'0.56rem',color:TL,fontWeight:300,marginBottom:8}}>加購項目 / Add-ons</div>
                {selAddons.map(a=>(
                  <div key={a.id} style={{display:'flex',justifyContent:'space-between',
                    fontSize:'0.68rem',marginBottom:6,fontWeight:300}}>
                    <span>{a.z} / <span style={{fontFamily:fc,fontStyle:'italic',fontSize:'0.62rem'}}>{a.e}</span></span>
                    <span style={{fontFamily:fp,fontWeight:500}}>+${a.p}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Duration */}
            {sv&&(
              <div style={{borderTop:`1px solid ${DV}`,paddingTop:12,marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'0.68rem'}}>
                  <span style={{color:TL,fontWeight:300,display:'flex',alignItems:'center',gap:5}}>
                    <Clock size={12} color={TL} strokeWidth={1.5}/>
                    預計操作時間
                  </span>
                  <span style={{fontWeight:400,color:TM}}>{sv.dur}</span>
                </div>
              </div>
            )}

            {/* Date & Time */}
            <div style={{borderTop:`1px solid ${DV}`,paddingTop:12,marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.68rem',marginBottom:8}}>
                <span style={{color:TL,fontWeight:300}}>日期 / Date</span>
                <span style={{fontFamily:fp,fontWeight:500,color:ad?TX:P}}>
                  {ad?`${ad.full}（週${WDN[ad.wd]}）`:'尚未選擇'}
                </span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.68rem'}}>
                <span style={{color:TL,fontWeight:300}}>時段 / Time</span>
                <span style={{fontFamily:fp,fontWeight:500,color:tm?TX:P}}>
                  {tm||'尚未選擇'}
                </span>
              </div>
            </div>

            {/* Technician */}
            <div style={{borderTop:`1px solid ${DV}`,paddingTop:12,marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.68rem'}}>
                <span style={{color:TL,fontWeight:300}}>技師 / Technician</span>
                <span style={{fontSize:'0.66rem'}}>
                  {tc?.l} <span style={{fontFamily:fp,fontWeight:500,color:TM}}>
                    {tp?`+$${tp}`:'免費'}
                  </span>
                </span>
              </div>
            </div>

            {/* Contact */}
            <div style={{borderTop:`1px solid ${DV}`,paddingTop:12}}>
              <div style={{fontSize:'0.56rem',color:TL,fontWeight:300,marginBottom:8}}>聯絡資料 / Contact</div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.68rem',marginBottom:6}}>
                <span style={{color:TL,fontWeight:300}}>姓名</span>
                <span style={{fontWeight:400}}>{nm||'—'}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.68rem',marginBottom:6}}>
                <span style={{color:TL,fontWeight:300}}>電話</span>
                <span style={{fontWeight:400}}>{ph||'—'}</span>
              </div>
              {rk&&<div style={{display:'flex',justifyContent:'space-between',fontSize:'0.68rem'}}>
                <span style={{color:TL,fontWeight:300}}>備註</span>
                <span style={{fontWeight:300,maxWidth:'60%',textAlign:'right',fontSize:'0.64rem'}}>{rk}</span>
              </div>}
            </div>
          </div>

          {/* Total */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',
            padding:'16px 0 6px',borderTop:`1.5px solid ${P}`}}>
            <div>
              <div style={{fontSize:'1.05rem',fontWeight:500,letterSpacing:'0.06em'}}>預計總額</div>
              <div style={{fontFamily:fc,fontSize:'0.52rem',letterSpacing:'0.16em',color:TL,
                marginTop:3,fontStyle:'italic'}}>ESTIMATED TOTAL</div>
            </div>
            <div style={{fontFamily:fp,fontSize:'1.7rem',fontWeight:500,color:TX}}>${total}</div>
          </div>
          {sv?.pl&&<div style={{fontSize:'0.52rem',color:DA_TX,marginTop:6,textAlign:'right',fontWeight:300}}>
            * 實際價格可能因款式而異</div>}
        </div>

        {/* Missing fields hint */}
        {!canGo&&step>=5&&(
          <div style={{textAlign:'center',fontSize:'0.58rem',color:DA_TX,marginBottom:14,fontWeight:300}}>
            請確保已填寫所有必填項目（*）
          </div>
        )}

        {/* Confirm */}
        <motion.button whileTap={canGo?{scale:0.97}:{}} onClick={()=>{if(canGo)setDone(true);}}
          style={{width:'100%',padding:'20px',borderRadius:3,border:'none',
            background:canGo?BTN:DV,
            fontSize:'0.82rem',fontWeight:400,fontFamily:ff,cursor:canGo?'pointer':'not-allowed',
            color:canGo?'#fff':TLL,letterSpacing:'0.14em',marginBottom:10,lineHeight:2}}>
          確認並發送預約<br/>
          <span style={{fontFamily:fc,fontSize:'0.54rem',fontWeight:300,letterSpacing:'0.2em',
            fontStyle:'italic',color:canGo?'rgba(255,255,255,0.7)':TLL}}>
            CONFIRM & SEND BOOKING REQUEST</span>
        </motion.button>

        <div style={{textAlign:'center',fontSize:'0.48rem',color:TLL,lineHeight:1.8,marginTop:8,fontWeight:300}}>
          提交後我們將透過 WhatsApp 與您確認預約<br/>
          <span style={{fontFamily:fc,fontStyle:'italic'}}>
            We will confirm your booking via WhatsApp after submission</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{background:'#1a1814',padding:'28px 22px',textAlign:'center'}}>
        <div style={{fontFamily:fp,fontSize:'0.9rem',fontWeight:500,color:P,letterSpacing:'0.06em',
          fontStyle:'italic'}}>J.LAB</div>
        <div style={{fontFamily:fc,fontSize:'0.5rem',letterSpacing:'0.2em',color:'#665e52',
          marginTop:8,fontStyle:'italic'}}>LASH & BEAUTY STUDIO</div>
      </div>

      {/* Done Modal */}
      <AnimatePresence>
        {done&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{position:'fixed',inset:0,background:'rgba(26,24,20,0.6)',backdropFilter:'blur(6px)',
              zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}
            onClick={()=>setDone(false)}>
            <motion.div initial={{scale:0.92,y:16}} animate={{scale:1,y:0}}
              transition={{type:'spring',damping:24,stiffness:240}}
              onClick={e=>e.stopPropagation()}
              style={{background:CD,borderRadius:4,padding:'32px 24px',maxWidth:360,width:'100%',
                textAlign:'center',border:`1px solid ${CB}`,maxHeight:'90vh',overflowY:'auto'}}>
              <div style={{width:50,height:50,borderRadius:'50%',background:P,
                display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px'}}>
                <Check size={22} color="#fff" strokeWidth={2}/>
              </div>
              <div style={{fontSize:'1.05rem',fontWeight:500,marginBottom:5,letterSpacing:'0.06em'}}>
                預約已送出！</div>
              <div style={{fontFamily:fc,fontSize:'0.66rem',color:TL,marginBottom:22,fontStyle:'italic'}}>
                Booking request submitted successfully</div>

              <div style={{background:IB,borderRadius:3,padding:'16px',textAlign:'left',
                fontSize:'0.66rem',color:TM,lineHeight:2.2,marginBottom:22,fontWeight:300,
                border:`1px solid ${DV}`}}>
                <div><span style={{fontWeight:500}}>服務：</span>{sv?.name}</div>
                {sv?.vars&&<div><span style={{fontWeight:500}}>類型：</span>{sv.vars[vi[sid]||0].l}</div>}
                {selAddons.length>0&&<div><span style={{fontWeight:500}}>加購：</span>{selAddons.map(a=>a.z).join('、')}</div>}
                <div><span style={{fontWeight:500}}>日期：</span>{ad?.full}（週{WDN[ad?.wd||0]}）</div>
                <div><span style={{fontWeight:500}}>時段：</span>{tm}</div>
                <div><span style={{fontWeight:500}}>技師：</span>{tc?.l}</div>
                <div><span style={{fontWeight:500}}>操作時間：</span>{sv?.dur}</div>
                <div style={{borderTop:`1px solid ${DV}`,marginTop:6,paddingTop:6}}/>
                <div><span style={{fontWeight:500}}>姓名：</span>{nm}</div>
                <div><span style={{fontWeight:500}}>電話：</span>{ph}</div>
                {rk&&<div><span style={{fontWeight:500}}>備註：</span>{rk}</div>}
                <div style={{borderTop:`1px solid ${DV}`,marginTop:6,paddingTop:6}}>
                  <span style={{fontWeight:500}}>總額：</span>
                  <span style={{fontFamily:fp,fontSize:'1rem',fontWeight:500}}>${total}</span>
                </div>
              </div>

              <div style={{fontSize:'0.56rem',color:TL,marginBottom:20,lineHeight:1.7,fontWeight:300}}>
                我們將透過 WhatsApp 確認您的預約<br/>
                <span style={{fontFamily:fc,fontStyle:'italic'}}>
                  We will confirm your booking via WhatsApp</span>
              </div>

              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>setDone(false)}
                  style={{flex:1,padding:'12px',borderRadius:3,border:`1px solid ${CB}`,background:'#fff',
                    fontSize:'0.68rem',fontFamily:ff,cursor:'pointer',color:TM,fontWeight:300}}>
                  返回修改</button>
                <button onClick={()=>{
                  let msg=`Hi J.Lab 🌙\n\n我想預約：\n服務：${sv?.name}`;
                  if(sv?.vars) msg+=`\n類型：${sv.vars[vi[sid]||0].l}`;
                  if(selAddons.length) msg+=`\n加購：${selAddons.map(a=>a.z).join('、')}`;
                  msg+=`\n日期：${ad?.full}（週${WDN[ad?.wd||0]}）\n時段：${tm}\n技師：${tc?.l}`;
                  msg+=`\n操作時間：${sv?.dur}`;
                  msg+=`\n姓名：${nm}\n電話：${ph}`;
                  if(rk) msg+=`\n備註：${rk}`;
                  msg+=`\n\n總額：$${total}\n\n請確認，謝謝！`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,'_blank');
                }}
                  style={{flex:1,padding:'12px',borderRadius:3,border:'none',background:BTN,
                    fontSize:'0.68rem',fontFamily:ff,cursor:'pointer',color:'#fff',fontWeight:400,
                    display:'flex',alignItems:'center',justifyContent:'center',gap:6,
                    letterSpacing:'0.04em'}}>
                  <MessageCircle size={13} strokeWidth={1.5}/>WhatsApp 確認
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll to top */}
      <motion.div whileTap={{scale:0.9}}
        onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}
        style={{position:'fixed',bottom:24,right:20,width:38,height:38,borderRadius:'50%',
          background:CD,border:`1px solid ${CB}`,display:'flex',alignItems:'center',
          justifyContent:'center',cursor:'pointer',boxShadow:'0 2px 12px rgba(0,0,0,0.08)',zIndex:20}}>
        <ChevronUp size={16} color={TM} strokeWidth={1.5}/>
      </motion.div>
    </div>
  );
}

function SH({n,z,e,fp,fc}){
  return(
    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
      <div style={{width:3,height:20,background:P,borderRadius:1}}/>
      <span style={{fontWeight:500,fontSize:'0.92rem'}}>
        <span style={{fontFamily:fp}}>{n}.</span> {z}</span>
      <span style={{fontFamily:fc,fontSize:'0.58rem',letterSpacing:'0.12em',color:TL,
        fontStyle:'italic'}}>{e}</span>
    </div>
  );
}
