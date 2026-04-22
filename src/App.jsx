import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronUp, MessageCircle, Clock, Loader, AlertTriangle, RefreshCw } from 'lucide-react';

const SB='https://vqyfbwnkdpncwvdonbcz.supabase.co';
const SK='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeWZid25rZHBuY3d2ZG9uYmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MDk1MTksImV4cCI6MjA5MjE4NTUxOX0.hMHq_HcpnjiF-4zwSznyMpMx5Ooao5hDhaMi4aXME3M';
const H={apikey:SK,Authorization:`Bearer ${SK}`,'Content-Type':'application/json'};

const sbGet=async p=>{const r=await fetch(`${SB}/rest/v1/${p}`,{headers:H});if(!r.ok){const t=await r.text();throw new Error(`${r.status}: ${t}`);}return r.json();};
const sbPost=async(t,d)=>{const r=await fetch(`${SB}/rest/v1/${t}`,{method:'POST',headers:{...H,Prefer:'return=representation'},body:JSON.stringify(d)});if(!r.ok){const t2=await r.text();throw new Error(`${r.status}: ${t2}`);}return r.json();};

const P='#b0a08a',PD='#90806a',PL='#c8b8a0',PBG='#eae0d0',BTN='#8a7c68';
const BG='#f4ede4',CD='#faf6f0',CB='#d8ccba',DV='#dcd4c8',IB='#f0e8dc';
const TX='#3a3430',TM='#6e6050',TL='#a09484',TLL='#c0b8aa';
const DV_BG='#e6e2dc',DV_BD='#c8c2b8',DV_TX='#74706a';
const DA_BG='#ece4d0',DA_BD='#ccc0a4',DA_TX='#7a7258';
const DR_BG='#e6d4cc',DR_BD='#c4aea4',DR_TX='#785a50';
const WDN=['日','一','二','三','四','五','六'];
const MEN=['','JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

/* ═══════════════════════════════════════════════════════
   🔥 移除咗舊嘅 ALL_TIMES
   前台唔再寫死時段，全部由 admin 後台 enabled_timeslots 決定
   ═══════════════════════════════════════════════════════ */

const parseD=s=>{const[y,m,d]=s.split('-').map(Number);const dt=new Date(y,m-1,d);return{day:d,mo:m,me:MEN[m],wd:dt.getDay()};};
const getDC=s=>{if(s==='limited')return{bg:DA_BG,bd:DA_BD,tx:DA_TX};if(s==='full')return{bg:DR_BG,bd:DR_BD,tx:DR_TX};return{bg:DV_BG,bd:DV_BD,tx:DV_TX};};
const crd=(vis=true)=>({background:CD,borderRadius:3,padding:'28px 22px',marginBottom:18,border:`1px solid ${CB}`,boxShadow:'0 2px 16px rgba(0,0,0,0.03)',opacity:vis?1:0.4,pointerEvents:vis?'auto':'none',transition:'opacity 0.3s'});

function SH({n,z,e,fp,fc}){return(<div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}><div style={{width:3,height:20,background:P,borderRadius:1}}/><span style={{fontWeight:500,fontSize:'0.92rem'}}><span style={{fontFamily:fp}}>{n}.</span> {z}</span><span style={{fontFamily:fc,fontSize:'0.58rem',letterSpacing:'0.12em',color:TL,fontStyle:'italic'}}>{e}</span></div>);}

export default function App(){
  const ff="'Noto Serif TC',serif",fp="'Playfair Display',serif",fc="'Cormorant Garamond',serif";
  const [services,setSvcs]=useState([]);
  const [variants,setVars]=useState([]);
  const [addonsList,setAddons]=useState([]);
  const [techList,setTechs]=useState([]);
  const [dateList,setDates]=useState([]);

  /* ═══════════════════════════════════════════════════════
     🔥 新：用 enabledTimes 取代舊嘅 disabledTimes
     enabledTimes = admin 後台開放嘅時段（從 enabled_timeslots 讀取）
     ═══════════════════════════════════════════════════════ */
  const [enabledTimes,setEnabledTimes]=useState([]);
  const [dateBookings,setDateBookings]=useState([]);

  const [loading,setLoading]=useState(true);
  const [loadErr,setLoadErr]=useState(null);
  const [slotsLoading,setSlotsLoading]=useState(false);
  const [sid,setSid]=useState(null);
  const [vi,setVi]=useState({});
  const [ao,setAo]=useState([]);
  const [selDate,setSelDate]=useState(null);
  const [tm,setTm]=useState(null);
  const [nm,setNm]=useState('');
  const [ph,setPh]=useState('');
  const [rk,setRk]=useState('');
  const [tid,setTid]=useState(null);
  const [step,setStep]=useState(1);
  const [done,setDone]=useState(false);
  const [submitting,setSubmitting]=useState(false);
  const [submitErr,setSubmitErr]=useState(null);
  const [techConflict,setTechConflict]=useState(false);
  const r2=useRef(null),r3=useRef(null),r4=useRef(null),r5=useRef(null),r6=useRef(null),rS=useRef(null);
  const refs={2:r2,3:r3,4:r4,5:r5,6:r6,7:rS};
  const scrollTo=n=>setTimeout(()=>refs[n]?.current?.scrollIntoView({behavior:'smooth',block:'start'}),280);

  useEffect(()=>{if(!document.getElementById('p3f')){const l=document.createElement('link');l.id='p3f';l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Noto+Serif+TC:wght@200;300;400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap';document.head.appendChild(l);}},[]);

  const loadAll=useCallback(async()=>{
    setLoading(true);setLoadErr(null);
    try{
      const today=new Date().toISOString().split('T')[0];
      const [svcs,vars,adds,techs,dts,blocked]=await Promise.all([
        sbGet('services?is_active=eq.true&order=sort_order'),
        sbGet('service_variants?order=service_id,sort_order'),
        sbGet('addons?is_active=eq.true&order=sort_order'),
        sbGet('technicians?is_active=eq.true&order=sort_order'),
        sbGet(`date_availability?available_date=gte.${today}&status=eq.available&order=available_date`),
        sbGet(`blocked_dates?date=gte.${today}`),
      ]);
      setSvcs(svcs);setVars(vars);setAddons(adds);setTechs(techs);

      const blockedSet=new Set((blocked||[]).map(b=>b.date));
      const availDates=(dts||[]).filter(d=>!blockedSet.has(d.available_date));

      setDates(availDates.map(d=>({...d,...parseD(d.available_date)})));
      if(techs.length>0)setTid(techs[techs.length-1].id);
    }catch(e){setLoadErr(e.message);}
    setLoading(false);
  },[]);

  useEffect(()=>{loadAll();},[loadAll]);

  /* ═══════════════════════════════════════════════════════
     🔥 新：載入時段 — 讀 enabled_timeslots 而唔係 disabled_timeslots
     
     舊邏輯：讀 disabled → 從 ALL_TIMES 扣除 → 剩低嘅係可用
     新邏輯：讀 enabled → 呢啲就係可用時段（admin 開咗咩就顯示咩）
     ═══════════════════════════════════════════════════════ */
  useEffect(()=>{
    if(!selDate){setEnabledTimes([]);setDateBookings([]);return;}
    let c=false;
    const fetchSlots=async(showLoading)=>{
      if(showLoading)setSlotsLoading(true);
      try{
        const [enabled,bks]=await Promise.all([
          sbGet(`enabled_timeslots?slot_date=eq.${selDate}&order=slot_time`),
          sbGet(`bookings?select=booking_time,technician_id&booking_date=eq.${selDate}&status=neq.cancelled`)
        ]);
        if(!c){
          // ✅ 直接用 admin 開放嘅時段，.slice(0,5) 統一格式
          setEnabledTimes((enabled||[]).map(s=>(s.slot_time||'').slice(0,5)));
          setDateBookings((bks||[]).map(b=>({...b,booking_time:(b.booking_time||'').slice(0,5)})));
        }
      }catch(e){
        if(!c){setEnabledTimes([]);setDateBookings([]);}
      }
      if(!c&&showLoading)setSlotsLoading(false);
    };
    fetchSlots(true);
    const interval=setInterval(()=>fetchSlots(false),30000);
    const onFocus=()=>fetchSlots(false);
    window.addEventListener('focus',onFocus);
    return()=>{c=true;clearInterval(interval);window.removeEventListener('focus',onFocus);};
  },[selDate]);

  const randomTechId=useMemo(()=>{
    const rt=techList.find(t=>t.label.includes('隨機'));
    return rt?rt.id:null;
  },[techList]);

  const maxPerSlot=useMemo(()=>{
    const real=techList.filter(t=>!t.label.includes('隨機'));
    return Math.max(real.length,1);
  },[techList]);

  /* ═══════════════════════════════════════════════════════
     🔥 新：slots 計算邏輯
     
     舊：ALL_TIMES.map → 檢查 disabledTimes → 檢查 bookings
     新：enabledTimes.map → 檢查 bookings（已經只有 admin 開放嘅時段）
     
     額外：過濾今日已過嘅時段
     ═══════════════════════════════════════════════════════ */
  const slots=useMemo(()=>{
    const now=new Date();
    const todayStr=now.toISOString().split('T')[0];
    const currentMins=now.getHours()*60+now.getMinutes();

    return enabledTimes.map(t=>{
      // 今日已過嘅時段
      if(selDate===todayStr){
        const [h,m]=t.split(':').map(Number);
        if(h*60+m<=currentMins)return{slot_time:t,is_available:false,booked:false,passed:true};
      }

      const bks=dateBookings.filter(b=>b.booking_time===t);
      if(bks.length>=maxPerSlot)return{slot_time:t,is_available:false,booked:true};
      if(tid&&tid!==randomTechId){
        if(bks.some(b=>b.technician_id===tid))return{slot_time:t,is_available:false,booked:true};
      }
      return{slot_time:t,is_available:true,booked:false};
    });
  },[enabledTimes,dateBookings,tid,randomTechId,maxPerSlot,selDate]);

  useEffect(()=>{
    if(!tm||!selDate)return;
    const slot=slots.find(s=>s.slot_time===tm);
    if(slot&&!slot.is_available){
      setTm(null);
      setTechConflict(true);
      setTimeout(()=>setTechConflict(false),3500);
      scrollTo(5);
    }
  },[slots,tm,selDate]);

  const sv=services.find(s=>s.id===sid);
  const svcVars=variants.filter(v=>v.service_id===sid);
  const hasV=svcVars.length>0;
  const sp=sv?(hasV?(svcVars[vi[sid]||0]?.price||0):sv.price):0;
  const selAddons=addonsList.filter(a=>ao.includes(a.id));
  const ap=selAddons.reduce((s,a)=>s+a.price,0);
  const tc=techList.find(t=>t.id===tid);
  const tp=tc?.surcharge||0;
  const total=sp+ap+tp;
  const ad=dateList.find(d=>d.available_date===selDate);
  const canGo=sid!==null&&selDate!==null&&tm&&nm.trim()&&ph.trim()&&tid!==null;

  /* ═══════════════════════════════════════════════════════
     🔥 時段分組：上午 / 下午 / 晚間
     用 slots（來自 enabledTimes）而唔係 ALL_TIMES
     ═══════════════════════════════════════════════════════ */
  const amSlots=slots.filter(s=>{const h=parseInt(s.slot_time);return h<13;});
  const pmSlots=slots.filter(s=>{const h=parseInt(s.slot_time);return h>=13&&h<17;});
  const evSlots=slots.filter(s=>{const h=parseInt(s.slot_time);return h>=17;});

  const tao=id=>setAo(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const pick=id=>{setSid(id);setSelDate(null);setTm(null);setEnabledTimes([]);setDateBookings([]);if(step<2)setStep(2);scrollTo(2);};
  const pickDate=ds=>{setSelDate(ds);setTm(null);if(step<3)setStep(3);scrollTo(5);};
  const pickTime=t=>{setTm(t);if(step<4)setStep(4);scrollTo(6);};

  const submitBooking=async()=>{
    if(!canGo||submitting)return;
    setSubmitting(true);setSubmitErr(null);
    try{
      await sbPost('bookings',{service_id:sv.id,service_name:sv.name,variant_label:hasV?(svcVars[vi[sid]||0]?.label||''):'',variant_price:sp,addon_ids:selAddons.map(a=>String(a.id)),addon_names:selAddons.map(a=>a.name_zh),addon_total:ap,booking_date:selDate,booking_time:tm,technician_id:tc.id,technician_label:tc.label,technician_surcharge:tp,customer_name:nm.trim(),customer_phone:ph.trim(),remarks:rk.trim(),total_price:total});
      setDone(true);
    }catch(e){setSubmitErr(e.message);}
    setSubmitting(false);
  };

  const renderTG=(label,arr)=>{
    if(!arr.length)return null;
    return(<div style={{marginBottom:16}}>
      <div style={{fontSize:'0.52rem',color:TL,letterSpacing:'0.1em',marginBottom:8,fontWeight:400}}>{label}</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7}}>
        {arr.map(s=>{const sel=tm===s.slot_time;const dis=!s.is_available;return(
          <motion.div key={s.slot_time} whileTap={dis?{}:{scale:0.96}} onClick={()=>{if(!dis)pickTime(s.slot_time);}}
            style={{textAlign:'center',padding:s.booked?'9px 6px':s.passed?'9px 6px':'13px 6px',borderRadius:3,fontFamily:fc,fontSize:'0.88rem',letterSpacing:'0.06em',fontWeight:sel?500:400,border:`1px solid ${sel?PD:dis&&s.booked?DR_BD:CB}`,cursor:dis?'not-allowed':'pointer',background:sel?P:dis&&s.booked?'#f5ece8':dis?'#ebe4da':'#fff',color:sel?'#fff':dis?TLL:TX,opacity:dis?0.35:1,textDecoration:dis?'line-through':'none',transition:'all 0.2s'}}>
            {s.slot_time}
            {dis&&s.booked&&<div style={{fontSize:'0.34rem',color:DR_TX,marginTop:1,textDecoration:'none',opacity:1}}>已約滿</div>}
            {dis&&s.passed&&<div style={{fontSize:'0.34rem',color:TLL,marginTop:1,textDecoration:'none',opacity:1}}>已過</div>}
          </motion.div>);})}
      </div></div>);};

  if(loading)return(
    <div style={{background:BG,minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:ff}}>
      <motion.div animate={{rotate:360}} transition={{repeat:Infinity,duration:1.5,ease:'linear'}}><Loader size={28} color={P} strokeWidth={1.5}/></motion.div>
      <div style={{marginTop:16,fontSize:'0.72rem',color:TL,fontWeight:300}}>正在載入預約系統...</div>
    </div>);

  if(loadErr)return(
    <div style={{background:BG,minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:ff,color:TX,padding:30,textAlign:'center'}}>
      <div style={{background:CD,borderRadius:4,padding:'36px 28px',maxWidth:420,width:'100%',border:`1px solid ${CB}`}}>
        <div style={{fontFamily:fp,fontSize:'1.2rem',fontWeight:500,color:TM,fontStyle:'italic',marginBottom:20}}>J.LAB</div>
        <AlertTriangle size={36} color={DA_TX} strokeWidth={1.5} style={{marginBottom:16}}/>
        <div style={{fontSize:'0.92rem',fontWeight:500,marginBottom:12}}>無法載入預約系統</div>
        <div style={{fontSize:'0.44rem',color:DR_TX,background:DR_BG,padding:'12px',borderRadius:3,border:`1px solid ${DR_BD}`,wordBreak:'break-all',textAlign:'left',marginBottom:20,maxHeight:120,overflow:'auto',lineHeight:1.6}}>{loadErr}</div>
        <button onClick={loadAll} style={{padding:'12px 28px',borderRadius:3,border:'none',background:BTN,color:'#fff',fontFamily:ff,fontSize:'0.72rem',cursor:'pointer',fontWeight:400,display:'flex',alignItems:'center',gap:8,margin:'0 auto'}}><RefreshCw size={14} strokeWidth={1.5}/>重新載入</button>
      </div>
    </div>);

  return(
    <div style={{background:BG,minHeight:'100vh',fontFamily:ff,color:TX,maxWidth:480,margin:'0 auto',position:'relative',fontWeight:300}}>
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 22px',position:'sticky',top:0,background:BG,zIndex:10,borderBottom:`1px solid ${DV}`}}>
        <div style={{fontFamily:fp,fontSize:'1.1rem',fontWeight:500,color:TM,letterSpacing:'0.04em',fontStyle:'italic'}}>J.LAB</div>
        <div style={{fontFamily:fc,fontSize:'0.52rem',color:TL,fontStyle:'italic',letterSpacing:'0.1em'}}>LASH & BEAUTY</div>
      </header>

      <div style={{padding:'0 16px 60px'}}>
        <div style={{textAlign:'center',padding:'36px 0 28px'}}>
          <div style={{fontFamily:fc,fontSize:'0.58rem',letterSpacing:'0.3em',color:P,fontWeight:400}}>BOOKING</div>
          <div style={{fontSize:'1.3rem',fontWeight:500,margin:'10px 0 6px',letterSpacing:'0.08em'}}>線上預約系統</div>
          <div style={{fontFamily:fc,fontSize:'0.56rem',letterSpacing:'0.22em',color:TL,fontStyle:'italic'}}>ONLINE BOOKING SYSTEM</div>
        </div>

        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:0,marginBottom:28,padding:'0 10px'}}>
          {[1,2,3,4,5,6].map((n,i)=>{const a=n<=5?step>=n:canGo;const dn=n<=5?step>n:canGo;return(<React.Fragment key={n}>
            <div style={{width:22,height:22,borderRadius:'50%',background:a?P:'transparent',border:`1.5px solid ${a?P:CB}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.48rem',fontFamily:fp,fontWeight:500,color:a?'#fff':TLL,transition:'all 0.3s'}}>{dn?<Check size={10} strokeWidth={3}/>:n}</div>
            {i<5&&<div style={{flex:1,height:1,background:n<5?(step>n?PL:DV):(canGo?PL:DV),transition:'all 0.3s'}}/>}
          </React.Fragment>);})}</div>

        {/* STEP 1: SERVICE */}
        <div style={crd()}>
          <SH n="1" z="選擇預約項目" e="SELECT SERVICE" fp={fp} fc={fc}/>
          {services.map(s=>{const sel=sid===s.id;const sv_=variants.filter(v=>v.service_id===s.id);const hv=sv_.length>0;return(
            <div key={s.id} onClick={()=>pick(s.id)} style={{border:`1px solid ${sel?P:s.tag?PL:CB}`,borderRadius:3,padding:'18px 16px',marginBottom:12,cursor:'pointer',position:'relative',overflow:'hidden',background:sel?PBG:'#fff',transition:'all 0.25s'}}>
              {s.tag&&<div style={{position:'absolute',top:0,right:0,background:s.sort_order===1?'#c4886c':P,color:'#fff',fontSize:'0.42rem',padding:'3px 10px',letterSpacing:'0.08em',fontWeight:400,borderRadius:'0 2px 0 3px'}}>{s.tag}</div>}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10,paddingRight:s.tag?50:0}}>
                <div style={{fontWeight:500,fontSize:'0.8rem',lineHeight:1.5,flex:1}}>{s.name}</div>
                <div style={{fontFamily:fp,fontWeight:500,color:TM,fontSize:'0.88rem',flexShrink:0}}>{s.price_label||(hv?`$${sv_[0].price}`:`$${s.price}`)}</div>
              </div>
              <div style={{fontSize:'0.66rem',color:TM,margin:'8px 0 4px',lineHeight:1.7,fontWeight:300}}>{s.description_zh}</div>
              <div style={{fontFamily:fc,fontSize:'0.62rem',color:TL,lineHeight:1.6,fontStyle:'italic'}}>{s.description_en}</div>
              {(s.duration_zh || s.duration) ? (
                <div style={{display:'flex',alignItems:'center',gap:5,marginTop:10}}>
                  <Clock size={11} color={TL} strokeWidth={1.5}/>
                  <span style={{fontSize:'0.56rem',color:TL,fontWeight:300}}>
                    {s.duration_zh || `約 ${s.duration} 分鐘`}
                  </span>
                </div>
              ) : null}
              {hv&&sel&&(<div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:14}}>
                {sv_.map((v,idx)=>{const vs=(vi[s.id]||0)===idx;return(
                  <button key={v.id} onClick={e=>{e.stopPropagation();setVi(p=>({...p,[s.id]:idx}));}}
                    style={{padding:'8px 18px',borderRadius:2,fontSize:'0.62rem',fontFamily:ff,fontWeight:vs?500:300,border:`1px solid ${vs?PD:CB}`,background:vs?P:'#fff',color:vs?'#fff':TX,cursor:'pointer',transition:'all 0.2s'}}>{v.label}</button>);})}
              </div>)}
            </div>);})}
        </div>

        {/* STEP 2: ADD-ONS */}
        <div ref={r2} style={crd(step>=2)}>
          <SH n="2" z="可選加購項目" e="ADD-ONS" fp={fp} fc={fc}/>
          <div style={{fontSize:'0.6rem',color:TL,marginBottom:16,fontWeight:300}}>非必選項目，可根據需要加選。</div>
          {addonsList.map(a=>{const on=ao.includes(a.id);return(
            <div key={a.id} onClick={()=>tao(a.id)} style={{display:'flex',alignItems:'center',gap:12,padding:'14px',border:`1px solid ${on?PL:CB}`,borderRadius:3,marginBottom:10,cursor:'pointer',background:on?PBG:'#fff',transition:'all 0.2s'}}>
              <div style={{width:20,height:20,borderRadius:'50%',border:`1.5px solid ${on?P:CB}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,background:on?P:'transparent',transition:'all 0.2s'}}>{on&&<Check size={11} color="#fff" strokeWidth={2.5}/>}</div>
              <div style={{flex:1}}><div style={{fontSize:'0.72rem',fontWeight:on?500:300}}>{a.name_zh}</div><div style={{fontFamily:fc,fontSize:'0.58rem',fontStyle:'italic',color:TL}}>{a.name_en}</div></div>
              <div style={{fontFamily:fp,fontWeight:500,color:TM,fontSize:'0.72rem'}}>+${a.price}</div>
            </div>);})}
        </div>

        {/* STEP 3: TECHNICIAN */}
        <div ref={r3} style={crd(step>=2)}>
          <SH n="3" z="指定技師" e="TECHNICIAN" fp={fp} fc={fc}/>
          <div style={{fontSize:'0.56rem',color:TL,marginBottom:14,fontWeight:300,lineHeight:1.7}}>
            選擇技師後，系統會根據該技師的預約情況顯示可用時段。
          </div>
          {techList.map(t=>{const sel=tid===t.id;return(
            <motion.div key={t.id} whileTap={{scale:0.98}} onClick={()=>{setTid(t.id);if(!selDate)scrollTo(4);}}
              style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 18px',borderRadius:3,marginBottom:8,cursor:'pointer',background:sel?P:'#fff',border:`1px solid ${sel?PD:CB}`,transition:'all 0.25s'}}>
              <div><div style={{fontSize:'0.76rem',fontWeight:sel?500:300,color:sel?'#fff':TX}}>{t.label}</div><div style={{fontFamily:fc,fontSize:'0.58rem',fontStyle:'italic',color:sel?'rgba(255,255,255,0.7)':TL,marginTop:2}}>{t.label_en}</div></div>
              <div style={{fontFamily:fp,fontWeight:500,color:sel?'#fff':TM,fontSize:'0.76rem'}}>{t.surcharge?`+$${t.surcharge}`:'免費'}</div>
            </motion.div>);})}
        </div>

        {/* STEP 4: DATE */}
        <div ref={r4} style={crd(step>=2)}>
          <SH n="4" z="選擇日期" e="SELECT DATE" fp={fp} fc={fc}/>
          {dateList.length===0?(<div style={{textAlign:'center',padding:20,fontSize:'0.68rem',color:TL}}>暫無可預約日期，請稍後再試</div>):(
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7}}>
              {dateList.map(d=>{const sel=selDate===d.available_date;const full=d.status==='full';const c=getDC(d.status);return(
                <motion.div key={d.available_date} whileTap={full?{}:{scale:0.94}} onClick={()=>{if(!full)pickDate(d.available_date);}}
                  style={{textAlign:'center',padding:'9px 4px',borderRadius:3,cursor:full?'not-allowed':'pointer',background:sel?P:c.bg,border:`1px solid ${sel?PD:c.bd}`,opacity:full?0.25:1,transition:'all 0.2s'}}>
                  <div style={{fontSize:'0.42rem',color:sel?'rgba(255,255,255,0.65)':c.tx}}>{d.mo}月</div>
                  <div style={{fontFamily:fp,fontSize:'1.05rem',fontWeight:500,color:sel?'#fff':TX,lineHeight:1.4}}>{d.day}</div>
                  <div style={{fontSize:'0.38rem',color:sel?'rgba(255,255,255,0.65)':c.tx}}>週{WDN[d.wd]}</div>
                </motion.div>);})}
            </div>)}
          <div style={{display:'flex',gap:14,marginTop:14,justifyContent:'center'}}>
            {[['充裕',DV_BG,DV_BD],['少量',DA_BG,DA_BD],['已滿',DR_BG,DR_BD]].map(([l,bg,bd])=>(
              <span key={l} style={{fontSize:'0.42rem',color:TL,display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:2,background:bg,border:`1px solid ${bd}`,display:'inline-block'}}/>{l}</span>))}
          </div>
        </div>

        {/* STEP 5: TIME */}
        <div ref={r5} style={crd(step>=3)}>
          <SH n="5" z="選擇時段" e="SELECT TIME" fp={fp} fc={fc}/>
          <AnimatePresence>
            {techConflict&&(
              <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
                style={{background:DA_BG,border:`1px solid ${DA_BD}`,color:DA_TX,padding:'10px 14px',borderRadius:3,fontSize:'0.6rem',marginBottom:14,lineHeight:1.6,overflow:'hidden'}}>
                ⚠️ 所選時段已被此技師預約，請重新選擇時段
              </motion.div>
            )}
          </AnimatePresence>
          {tc&&selDate&&(
            <div style={{fontSize:'0.52rem',color:TL,marginBottom:14,fontWeight:300,background:IB,padding:'8px 12px',borderRadius:3,border:`1px solid ${DV}`}}>
              顯示「<span style={{color:TX,fontWeight:500}}>{tc.label}</span>」於 <span style={{fontFamily:fp,fontWeight:500,color:TX}}>{selDate}</span> 的可預約時段
            </div>
          )}
          {slotsLoading?(<div style={{textAlign:'center',padding:'24px 0'}}><motion.div animate={{rotate:360}} transition={{repeat:Infinity,duration:1,ease:'linear'}} style={{display:'inline-block'}}><Loader size={20} color={P} strokeWidth={1.5}/></motion.div></div>):(<>
            {/* 🔥 新：如果 admin 無開放任何時段 */}
            {enabledTimes.length===0&&selDate&&!slotsLoading&&(
              <div style={{textAlign:'center',padding:'24px 0',fontSize:'0.68rem',color:TL}}>
                此日期暫無可預約時段
              </div>
            )}
            {renderTG('上午 MORNING',amSlots)}
            {renderTG('下午 AFTERNOON',pmSlots)}
            {renderTG('晚間 EVENING',evSlots)}
          </>)}
        </div>

        {/* STEP 6: CONTACT */}
        <div ref={r6} style={crd(step>=4)}>
          <SH n="6" z="聯絡資料" e="CONTACT" fp={fp} fc={fc}/>
          <div style={{marginBottom:18}}>
            <div style={{fontSize:'0.6rem',color:TL,marginBottom:8,fontWeight:300}}>您的姓名 <span style={{color:DR_TX}}>*</span></div>
            <input value={nm} onChange={e=>setNm(e.target.value)} placeholder="e.g. Miss Chan" style={{width:'100%',padding:'13px 16px',borderRadius:3,border:`1px solid ${CB}`,background:IB,fontSize:'0.76rem',fontFamily:ff,fontWeight:300,outline:'none',boxSizing:'border-box',color:TX}}/>
          </div>
          <div style={{marginBottom:18}}>
            <div style={{fontSize:'0.6rem',color:TL,marginBottom:8,fontWeight:300}}>WhatsApp 電話 <span style={{color:DR_TX}}>*</span></div>
            <input value={ph} onChange={e=>setPh(e.target.value)} placeholder="e.g. 6000 0000" type="tel" style={{width:'100%',padding:'13px 16px',borderRadius:3,border:`1px solid ${CB}`,background:IB,fontSize:'0.76rem',fontFamily:ff,fontWeight:300,outline:'none',boxSizing:'border-box',color:TX}}/>
          </div>
          <div style={{marginBottom:4}}>
            <div style={{fontSize:'0.6rem',color:TL,marginBottom:8,fontWeight:300}}>備註（選填）</div>
            <textarea value={rk} onChange={e=>setRk(e.target.value)} placeholder="如有特別需要..." rows={3} style={{width:'100%',padding:'13px 16px',borderRadius:3,border:`1px solid ${CB}`,background:IB,fontSize:'0.72rem',fontFamily:ff,fontWeight:300,outline:'none',boxSizing:'border-box',color:TX,resize:'vertical',lineHeight:1.6}}/>
          </div>
          {nm.trim()&&ph.trim()&&step<5&&(
            <motion.button whileTap={{scale:0.97}} onClick={()=>{if(step<5)setStep(5);scrollTo(7);}}
              style={{width:'100%',padding:'14px',marginTop:14,borderRadius:3,border:'none',background:BTN,color:'#fff',fontFamily:ff,fontSize:'0.72rem',cursor:'pointer',fontWeight:400}}>下一步 →</motion.button>)}
        </div>

        {/* SUMMARY */}
        <div ref={rS} style={crd(step>=4)}>
          <div style={{textAlign:'center',marginBottom:22}}>
            <div style={{fontFamily:fc,fontSize:'0.54rem',letterSpacing:'0.24em',color:P}}>ORDER SUMMARY</div>
            <div style={{fontSize:'1.05rem',fontWeight:500,marginTop:6}}>預約摘要</div>
          </div>
          <div style={{background:IB,borderRadius:3,padding:'18px 16px',border:`1px solid ${DV}`,marginBottom:18}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
              <div><div style={{fontSize:'0.56rem',color:TL,marginBottom:4}}>服務項目</div><div style={{fontSize:'0.72rem',fontWeight:500}}>{sv?sv.name:'尚未選擇'}</div>{hasV&&<div style={{fontSize:'0.58rem',color:TM,marginTop:2}}>{svcVars[vi[sid]||0]?.label}</div>}</div>
              <div style={{fontFamily:fp,fontWeight:500,fontSize:'0.82rem'}}>{sv?`$${sp}`:'—'}</div>
            </div>
            {selAddons.length>0&&(<div style={{borderTop:`1px solid ${DV}`,paddingTop:12,marginBottom:12}}>
              <div style={{fontSize:'0.56rem',color:TL,marginBottom:8}}>加購項目</div>
              {selAddons.map(a=>(<div key={a.id} style={{display:'flex',justifyContent:'space-between',fontSize:'0.68rem',marginBottom:6}}><span>{a.name_zh}</span><span style={{fontFamily:fp,fontWeight:500}}>+${a.price}</span></div>))}</div>)}
            <div style={{borderTop:`1px solid ${DV}`,paddingTop:12,marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.68rem',marginBottom:8}}><span style={{color:TL}}>技師</span><span>{tc?.label} {tp?`+$${tp}`:'免費'}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.68rem',marginBottom:8}}><span style={{color:TL}}>日期</span><span style={{fontFamily:fp,fontWeight:500}}>{ad?`${ad.available_date}（週${WDN[ad.wd]}）`:'—'}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.68rem'}}><span style={{color:TL}}>時段</span><span style={{fontFamily:fp,fontWeight:500}}>{tm||'—'}</span></div>
            </div>
            <div style={{borderTop:`1px solid ${DV}`,paddingTop:12}}>
              <div style={{fontSize:'0.56rem',color:TL,marginBottom:8}}>聯絡資料</div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.68rem',marginBottom:6}}><span style={{color:TL}}>姓名</span><span>{nm||'—'}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.68rem'}}><span style={{color:TL}}>電話</span><span>{ph||'—'}</span></div>
              {rk&&<div style={{display:'flex',justifyContent:'space-between',fontSize:'0.68rem',marginTop:6}}><span style={{color:TL}}>備註</span><span style={{maxWidth:'60%',textAlign:'right',fontSize:'0.64rem'}}>{rk}</span></div>}
            </div>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',padding:'16px 0 6px',borderTop:`1.5px solid ${P}`}}>
            <div><div style={{fontSize:'1.05rem',fontWeight:500}}>預計總額</div><div style={{fontFamily:fc,fontSize:'0.52rem',color:TL,marginTop:3,fontStyle:'italic'}}>ESTIMATED TOTAL</div></div>
            <div style={{fontFamily:fp,fontSize:'1.7rem',fontWeight:500}}>${total}</div>
          </div>
        </div>

        {submitErr&&<div style={{textAlign:'center',fontSize:'0.54rem',color:DR_TX,marginBottom:14,background:DR_BG,padding:'10px 14px',borderRadius:3,border:`1px solid ${DR_BD}`,wordBreak:'break-all'}}>{submitErr}</div>}

        <motion.button whileTap={canGo&&!submitting?{scale:0.97}:{}} onClick={submitBooking}
          style={{width:'100%',padding:'20px',borderRadius:3,border:'none',background:canGo&&!submitting?BTN:DV,fontSize:'0.82rem',fontWeight:400,fontFamily:ff,cursor:canGo&&!submitting?'pointer':'not-allowed',color:canGo&&!submitting?'#fff':TLL,letterSpacing:'0.14em',marginBottom:10,lineHeight:2,display:'flex',flexDirection:'column',alignItems:'center'}}>
          {submitting?(<span style={{display:'flex',alignItems:'center',gap:8}}><motion.span animate={{rotate:360}} transition={{repeat:Infinity,duration:1,ease:'linear'}} style={{display:'inline-flex'}}><Loader size={16} strokeWidth={1.5}/></motion.span>提交中...</span>):(<>確認並發送預約<br/><span style={{fontFamily:fc,fontSize:'0.54rem',fontWeight:300,fontStyle:'italic',color:canGo?'rgba(255,255,255,0.7)':TLL}}>CONFIRM BOOKING</span></>)}
        </motion.button>
        <div style={{textAlign:'center',fontSize:'0.48rem',color:TLL,lineHeight:1.8,marginTop:8}}>提交後我們將透過 WhatsApp 與您確認預約</div>
      </div>

      <div style={{background:'#1a1814',padding:'28px 22px',textAlign:'center'}}>
        <div style={{fontFamily:fp,fontSize:'0.9rem',fontWeight:500,color:P,fontStyle:'italic'}}>J.LAB</div>
        <div style={{fontFamily:fc,fontSize:'0.5rem',letterSpacing:'0.2em',color:'#665e52',marginTop:8,fontStyle:'italic'}}>LASH & BEAUTY STUDIO</div>
        <a href="/admin" style={{display:'inline-block',marginTop:18,fontSize:'0.42rem',color:'#565248',textDecoration:'none',letterSpacing:'0.12em',fontFamily:fc,fontStyle:'italic',borderBottom:'1px solid #3a3632',paddingBottom:2,opacity:0.6,transition:'opacity 0.2s'}}
        onMouseEnter={e=>e.target.style.opacity='1'}
        onMouseLeave={e=>e.target.style.opacity='0.6'}
        >ADMIN</a>
      </div>

      <AnimatePresence>{done&&(
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:'fixed',inset:0,background:'rgba(26,24,20,0.6)',backdropFilter:'blur(6px)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={()=>setDone(false)}>
          <motion.div initial={{scale:0.92,y:16}} animate={{scale:1,y:0}} transition={{type:'spring',damping:24}} onClick={e=>e.stopPropagation()}
            style={{background:CD,borderRadius:4,padding:'32px 24px',maxWidth:360,width:'100%',textAlign:'center',border:`1px solid ${CB}`,maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{width:50,height:50,borderRadius:'50%',background:P,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px'}}><Check size={22} color="#fff" strokeWidth={2}/></div>
            <div style={{fontSize:'1.05rem',fontWeight:500,marginBottom:5}}>預約已送出！</div>
            <div style={{fontFamily:fc,fontSize:'0.66rem',color:TL,marginBottom:22,fontStyle:'italic'}}>Booking submitted successfully</div>
            <div style={{background:IB,borderRadius:3,padding:'16px',textAlign:'left',fontSize:'0.66rem',color:TM,lineHeight:2.2,marginBottom:22,border:`1px solid ${DV}`}}>
              <div><b>服務：</b>{sv?.name}</div>
              {hasV&&<div><b>類型：</b>{svcVars[vi[sid]||0]?.label}</div>}
              {selAddons.length>0&&<div><b>加購：</b>{selAddons.map(a=>a.name_zh).join('、')}</div>}
              <div><b>技師：</b>{tc?.label}</div>
              <div><b>日期：</b>{ad?.available_date}（週{WDN[ad?.wd||0]}）</div>
              <div><b>時段：</b>{tm}</div>
              <div><b>姓名：</b>{nm}</div>
              <div><b>電話：</b>{ph}</div>
              {rk&&<div><b>備註：</b>{rk}</div>}
              <div style={{borderTop:`1px solid ${DV}`,marginTop:6,paddingTop:6}}><b>總額：</b><span style={{fontFamily:fp,fontSize:'1rem',fontWeight:500}}>${total}</span></div>
            </div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setDone(false)} style={{flex:1,padding:'12px',borderRadius:3,border:`1px solid ${CB}`,background:'#fff',fontSize:'0.68rem',fontFamily:ff,cursor:'pointer',color:TM}}>關閉</button>
              <button onClick={()=>{let m=`Hi J.Lab\n\n服務：${sv?.name}\n技師：${tc?.label}\n日期：${ad?.available_date}\n時段：${tm}\n姓名：${nm}\n電話：${ph}\n總額：$${total}\n\n請確認，謝謝！`;window.open(`https://wa.me/?text=${encodeURIComponent(m)}`,'_blank');}}
                style={{flex:1,padding:'12px',borderRadius:3,border:'none',background:BTN,fontSize:'0.68rem',fontFamily:ff,cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                <MessageCircle size={13} strokeWidth={1.5}/>WhatsApp</button>
            </div>
          </motion.div>
        </motion.div>)}</AnimatePresence>

      <motion.div whileTap={{scale:0.9}} onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}
        style={{position:'fixed',bottom:24,right:20,width:38,height:38,borderRadius:'50%',background:CD,border:`1px solid ${CB}`,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:'0 2px 12px rgba(0,0,0,0.08)',zIndex:20}}>
        <ChevronUp size={16} color={TM} strokeWidth={1.5}/>
      </motion.div>
    </div>);
}
