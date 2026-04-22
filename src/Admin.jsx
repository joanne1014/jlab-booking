import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, LogOut, Filter, X, RefreshCw, MessageCircle, Trash2, Check, AlertTriangle } from 'lucide-react';

const SB='https://vqyfbwnkdpncwvdonbcz.supabase.co';
const SK='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeWZid25rZHBuY3d2ZG9uYmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MDk1MTksImV4cCI6MjA5MjE4NTUxOX0.hMHq_HcpnjiF-4zwSznyMpMx5Ooao5hDhaMi4aXME3M';
const H={apikey:SK,Authorization:`Bearer ${SK}`,'Content-Type':'application/json'};

const sbGet=async(p)=>{const r=await fetch(`${SB}/rest/v1/${p}`,{headers:H});if(!r.ok)throw new Error(`${r.status}`);return r.json();};
const sbPatch=async(t,id,d)=>{const r=await fetch(`${SB}/rest/v1/${t}?id=eq.${id}`,{method:'PATCH',headers:{...H,Prefer:'return=representation'},body:JSON.stringify(d)});if(!r.ok)throw new Error(`${r.status}`);return r.json();};
const sbDel=async(t,id)=>{const r=await fetch(`${SB}/rest/v1/${t}?id=eq.${id}`,{method:'DELETE',headers:H});if(!r.ok)throw new Error(`${r.status}`);};

const ADMIN_PW='jlab2024';
const P='#b0a08a',PD='#90806a',BTN='#8a7c68';
const BG='#f4ede4',CD='#faf6f0',CB='#d8ccba',DV='#dcd4c8',IB='#f0e8dc';
const TX='#3a3430',TM='#6e6050',TL='#a09484',TLL='#c0b8aa';
const WDN=['日','一','二','三','四','五','六'];

export default function Admin(){
  const ff="'Noto Serif TC',serif",fp="'Playfair Display',serif",fc="'Cormorant Garamond',serif";
  const[loggedIn,setLoggedIn]=useState(false);
  const[pw,setPw]=useState('');
  const[pwErr,setPwErr]=useState(false);
  const[bookings,setBookings]=useState([]);
  const[loading,setLoading]=useState(false);
  const[fDate,setFDate]=useState('');
  const[fStatus,setFStatus]=useState('all');
  const[stats,setStats]=useState({today:0,week:0,month:0,total:0});
  const[updating,setUpdating]=useState(null);
  const[delId,setDelId]=useState(null);
  const[deleting,setDeleting]=useState(null);

  useEffect(()=>{if(!document.getElementById('p3f')){const l=document.createElement('link');l.id='p3f';l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Noto+Serif+TC:wght@200;300;400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap';document.head.appendChild(l);}},[]);

  const handleLogin=(e)=>{e.preventDefault();if(pw===ADMIN_PW){setLoggedIn(true);setPwErr(false);}else{setPwErr(true);}};

  const fetchBookings=useCallback(async()=>{
    setLoading(true);
    try{
      let q='bookings?order=booking_date.desc,booking_time.desc';
      if(fDate)q+=`&booking_date=eq.${fDate}`;
      if(fStatus!=='all')q+=`&status=eq.${fStatus}`;
      const data=await sbGet(q);
      setBookings(data||[]);
      const today=new Date().toISOString().split('T')[0];
      const weekAgo=new Date(Date.now()-7*86400000).toISOString().split('T')[0];
      const mo=today.slice(0,7);
      setStats({
        today:data.filter(b=>b.booking_date===today).length,
        week:data.filter(b=>b.booking_date>=weekAgo).length,
        month:data.filter(b=>b.booking_date?.startsWith(mo)).length,
        total:data.length,
      });
    }catch(e){console.error(e);}
    setLoading(false);
  },[fDate,fStatus]);

  useEffect(()=>{if(loggedIn)fetchBookings();},[loggedIn,fetchBookings]);

  const updateStatus=async(id,s)=>{setUpdating(id);try{await sbPatch('bookings',id,{status:s});await fetchBookings();}catch(e){console.error(e);}setUpdating(null);};
  const deleteBk=async(id)=>{setDeleting(id);try{await sbDel('bookings',id);setDelId(null);await fetchBookings();}catch(e){console.error(e);}setDeleting(null);};

  const stColor=(s)=>{
    if(s==='confirmed')return{bg:'#e8f5e9',tx:'#2e7d32',bd:'#c8e6c9'};
    if(s==='cancelled')return{bg:'#ffebee',tx:'#c62828',bd:'#ffcdd2'};
    if(s==='completed')return{bg:'#e3f2fd',tx:'#1565c0',bd:'#bbdefb'};
    return{bg:'#fff3e0',tx:'#e65100',bd:'#ffe0b2'};
  };
  const stText=(s)=>{
    if(s==='confirmed')return'已確認';
    if(s==='cancelled')return'已取消';
    if(s==='completed')return'已完成';
    return'待確認';
  };

  if(!loggedIn){
    return(
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:BG,fontFamily:ff,padding:20}}>
        <form onSubmit={handleLogin} style={{background:CD,padding:'50px 36px',borderRadius:4,border:`1px solid ${CB}`,boxShadow:'0 4px 24px rgba(0,0,0,0.06)',textAlign:'center',maxWidth:380,width:'100%'}}>
          <div style={{fontFamily:fp,fontSize:'1.4rem',fontWeight:500,color:TM,fontStyle:'italic',marginBottom:6}}>J.LAB</div>
          <div style={{fontFamily:fc,color:TL,fontSize:'0.6rem',letterSpacing:'0.2em',marginBottom:40,fontStyle:'italic'}}>ADMIN DASHBOARD</div>
          <input type="password" placeholder="請輸入管理密碼" value={pw} onChange={e=>{setPw(e.target.value);setPwErr(false);}}
            style={{width:'100%',padding:'14px 16px',border:`1px solid ${pwErr?'#e57373':CB}`,borderRadius:3,fontSize:'0.82rem',fontFamily:ff,fontWeight:300,marginBottom:pwErr?8:20,boxSizing:'border-box',textAlign:'center',background:IB,outline:'none',color:TX}}/>
          {pwErr&&<div style={{fontSize:'0.62rem',color:'#c62828',marginBottom:16}}>密碼錯誤，請重試</div>}
          <button type="submit" style={{width:'100%',padding:'14px',background:BTN,color:'#fff',border:'none',borderRadius:3,fontSize:'0.78rem',fontFamily:ff,fontWeight:400,cursor:'pointer',letterSpacing:'0.1em'}}>登入管理後台</button>
        </form>
      </div>
    );
  }

  return(
    <div style={{minHeight:'100vh',background:BG,fontFamily:ff,color:TX,fontWeight:300}}>
      <div style={{background:CD,padding:'16px 20px',borderBottom:`1px solid ${CB}`,display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:10}}>
        <div>
          <span style={{fontFamily:fp,fontSize:'1rem',fontWeight:500,color:TM,fontStyle:'italic'}}>J.LAB</span>
          <span style={{fontFamily:fc,fontSize:'0.5rem',color:TL,marginLeft:10,fontStyle:'italic',letterSpacing:'0.1em'}}>ADMIN</span>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <a href="/" style={{fontSize:'0.62rem',color:TL,textDecoration:'none'}}>← 返回前台</a>
          <button onClick={()=>setLoggedIn(false)} style={{padding:'6px 14px',background:'transparent',border:`1px solid ${CB}`,borderRadius:3,cursor:'pointer',color:TL,fontSize:'0.6rem',fontFamily:ff,display:'flex',alignItems:'center',gap:4}}>
            <LogOut size={12}/>登出
          </button>
        </div>
      </div>

      <div style={{maxWidth:960,margin:'0 auto',padding:'24px 16px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12,marginBottom:24}}>
          {[
            {label:'今日預約',en:'TODAY',value:stats.today,color:'#e65100'},
            {label:'本週預約',en:'THIS WEEK',value:stats.week,color:'#2e7d32'},
            {label:'本月預約',en:'THIS MONTH',value:stats.month,color:'#1565c0'},
            {label:'全部預約',en:'TOTAL',value:stats.total,color:TM},
          ].map((s,i)=>(
            <div key={i} style={{background:CD,padding:'20px 16px',borderRadius:3,textAlign:'center',border:`1px solid ${CB}`}}>
              <div style={{fontSize:'0.56rem',color:TL,marginBottom:4}}>{s.label}</div>
              <div style={{fontFamily:fp,fontSize:'1.8rem',fontWeight:500,color:s.color}}>{s.value}</div>
              <div style={{fontFamily:fc,fontSize:'0.44rem',color:TLL,fontStyle:'italic',letterSpacing:'0.1em'}}>{s.en}</div>
            </div>
          ))}
        </div>

        <div style={{background:CD,padding:'16px',borderRadius:3,marginBottom:16,border:`1px solid ${CB}`,display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
          <Filter size={14} color={TL}/>
          <input type="date" value={fDate} onChange={e=>setFDate(e.target.value)}
            style={{padding:'8px 12px',border:`1px solid ${CB}`,borderRadius:3,fontSize:'0.7rem',fontFamily:ff,background:IB,color:TX,outline:'none'}}/>
          <select value={fStatus} onChange={e=>setFStatus(e.target.value)}
            style={{padding:'8px 12px',border:`1px solid ${CB}`,borderRadius:3,fontSize:'0.7rem',fontFamily:ff,background:IB,color:TX,outline:'none'}}>
            <option value="all">全部狀態</option>
            <option value="pending">待確認</option>
            <option value="confirmed">已確認</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
          {(fDate||fStatus!=='all')&&(
            <button onClick={()=>{setFDate('');setFStatus('all');}} style={{padding:'8px 12px',background:'transparent',border:`1px solid ${CB}`,borderRadius:3,cursor:'pointer',color:TL,fontSize:'0.6rem',fontFamily:ff,display:'flex',alignItems:'center',gap:4}}>
              <X size={12}/>清除
            </button>
          )}
          <button onClick={fetchBookings} style={{padding:'8px 14px',background:BTN,color:'#fff',border:'none',borderRadius:3,cursor:'pointer',fontSize:'0.6rem',fontFamily:ff,marginLeft:'auto',display:'flex',alignItems:'center',gap:4}}>
            <RefreshCw size={12}/>重新整理
          </button>
        </div>

        <div style={{background:CD,borderRadius:3,border:`1px solid ${CB}`,overflow:'hidden'}}>
          <div style={{padding:'16px 20px',borderBottom:`1px solid ${DV}`}}>
            <span style={{fontSize:'0.88rem',fontWeight:500}}>預約列表</span>
            <span style={{fontSize:'0.62rem',color:TL,marginLeft:8}}>共 {bookings.length} 筆</span>
          </div>

          {loading?(
            <div style={{padding:40,textAlign:'center'}}>
              <motion.div animate={{rotate:360}} transition={{repeat:Infinity,duration:1.5,ease:'linear'}} style={{display:'inline-block'}}>
                <Loader size={24} color={P} strokeWidth={1.5}/>
              </motion.div>
              <div style={{marginTop:12,fontSize:'0.66rem',color:TL}}>載入中...</div>
            </div>
          ):bookings.length===0?(
            <div style={{padding:40,textAlign:'center',color:TL,fontSize:'0.72rem'}}>暫無預約紀錄</div>
          ):(
            <div>
              {bookings.map(b=>{
                const sc=stColor(b.status);
                const wd=b.booking_date?WDN[new Date(b.booking_date+'T00:00:00').getDay()]:'';
                return(
                  <div key={b.id} style={{padding:'18px 20px',borderBottom:`1px solid ${DV}`,background:b.status==='cancelled'?'#fdfcfb':'#fff',opacity:b.status==='cancelled'?0.55:1}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                      <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                        <span style={{fontFamily:fp,fontSize:'0.82rem',fontWeight:500}}>{b.booking_date}</span>
                        <span style={{fontSize:'0.58rem',color:TL}}>週{wd}</span>
                        <span style={{fontFamily:fc,fontSize:'0.82rem',color:P,fontWeight:500}}>{b.booking_time}</span>
                      </div>
                      <span style={{padding:'3px 10px',borderRadius:20,fontSize:'0.52rem',color:sc.tx,background:sc.bg,border:`1px solid ${sc.bd}`,fontWeight:500,whiteSpace:'nowrap'}}>
                        {stText(b.status)}
                      </span>
                    </div>

                    <div style={{fontSize:'0.76rem',fontWeight:500,marginBottom:4}}>
                      {b.service_name}
                      {b.variant_label&&<span style={{fontWeight:300,color:TM,marginLeft:6}}>({b.variant_label})</span>}
                    </div>

                    {b.addon_names&&b.addon_names.length>0&&(
                      <div style={{fontSize:'0.6rem',color:TM,marginBottom:4}}>+ {Array.isArray(b.addon_names)?b.addon_names.join('、'):b.addon_names}</div>
                    )}

                    <div style={{display:'flex',gap:12,fontSize:'0.64rem',color:TL,marginBottom:10,flexWrap:'wrap',alignItems:'center'}}>
                      <span>👤 {b.customer_name}</span>
                      <a href={`https://wa.me/852${b.customer_phone?.replace(/\s/g,'')}`} target="_blank" rel="noreferrer"
                        style={{color:TL,textDecoration:'none',display:'flex',alignItems:'center',gap:3}}>
                        📱 {b.customer_phone} <MessageCircle size={11} color="#25d366"/>
                      </a>
                      {b.technician_label&&<span>💆 {b.technician_label}</span>}
                      <span style={{fontFamily:fp,fontWeight:500,color:TM}}>💰 ${b.total_price}</span>
                    </div>

                    {b.remarks&&(
                      <div style={{fontSize:'0.58rem',color:TL,background:IB,padding:'6px 10px',borderRadius:3,marginBottom:10}}>📝 {b.remarks}</div>
                    )}

                    <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                      {b.status!=='confirmed'&&(
                        <button onClick={()=>updateStatus(b.id,'confirmed')} disabled={updating===b.id}
                          style={{padding:'5px 12px',borderRadius:3,border:'1px solid #c8e6c9',background:'#e8f5e9',color:'#2e7d32',fontSize:'0.54rem',fontFamily:ff,cursor:'pointer'}}>
                          ✅ 確認
                        </button>
                      )}
                      {b.status!=='completed'&&b.status!=='cancelled'&&(
                        <button onClick={()=>updateStatus(b.id,'completed')} disabled={updating===b.id}
                          style={{padding:'5px 12px',borderRadius:3,border:'1px solid #bbdefb',background:'#e3f2fd',color:'#1565c0',fontSize:'0.54rem',fontFamily:ff,cursor:'pointer'}}>
                          ✔️ 完成
                        </button>
                      )}
                      {b.status!=='cancelled'&&(
                        <button onClick={()=>updateStatus(b.id,'cancelled')} disabled={updating===b.id}
                          style={{padding:'5px 12px',borderRadius:3,border:'1px solid #ffe0b2',background:'#fff3e0',color:'#e65100',fontSize:'0.54rem',fontFamily:ff,cursor:'pointer'}}>
                          ❌ 取消
                        </button>
                      )}
                      {delId===b.id?(
                        <div style={{display:'flex',gap:4,alignItems:'center',marginLeft:'auto'}}>
                          <span style={{fontSize:'0.52rem',color:'#c62828'}}>確定？</span>
                          <button onClick={()=>deleteBk(b.id)} disabled={deleting===b.id}
                            style={{padding:'5px 10px',borderRadius:3,border:'1px solid #ffcdd2',background:'#ffebee',color:'#c62828',fontSize:'0.54rem',fontFamily:ff,cursor:'pointer'}}>
                            {deleting===b.id?'...':'確定刪除'}
                          </button>
                          <button onClick={()=>setDelId(null)}
                            style={{padding:'5px 10px',borderRadius:3,border:`1px solid ${CB}`,background:'#fff',color:TL,fontSize:'0.54rem',fontFamily:ff,cursor:'pointer'}}>
                            取消
                          </button>
                        </div>
                      ):(
                        <button onClick={()=>setDelId(b.id)}
                          style={{padding:'5px 12px',borderRadius:3,border:'1px solid #ffcdd2',background:'#ffebee',color:'#c62828',fontSize:'0.54rem',fontFamily:ff,cursor:'pointer',marginLeft:'auto'}}>
                          🗑️ 刪除
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{textAlign:'center',padding:'30px 20px',fontSize:'0.48rem',color:TLL}}>
        <div style={{fontFamily:fp,fontSize:'0.7rem',color:TL,fontStyle:'italic',marginBottom:6}}>J.LAB Admin</div>
        管理密碼：{ADMIN_PW}（建議定期更改）
      </div>
    </div>
  );
}
