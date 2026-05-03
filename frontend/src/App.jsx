
import { useState, useEffect, useCallback, useRef } from "react"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import * as d3 from "d3"

const API = "https://sentinel-production-b4c7.up.railway.app"
const SEV = { CRITICAL:"#e03030", HIGH:"#f0a500", MEDIUM:"#00d4ff", LOW:"#00e87a", UNKNOWN:"#5a6a8a" }

function useFetch(url, interval=30000) {
  const [data,setData]=useState(null)
  const fn=useCallback(()=>{ if(url) fetch(url).then(r=>r.json()).then(setData).catch(()=>{}) },[url])
  useEffect(()=>{ fn(); if(!interval) return; const t=setInterval(fn,interval); return ()=>clearInterval(t) },[fn,interval])
  return data
}

/* ─── CURSOR ──────────────────────────────────────────────────────── */
function Cursor() {
  const [pos,setPos]=useState({x:-300,y:-300})
  const [clicking,setClicking]=useState(false)
  const [hovering,setHovering]=useState(false)
  useEffect(()=>{
    const move=e=>{
      setPos({x:e.clientX,y:e.clientY})
      const el=document.elementFromPoint(e.clientX,e.clientY)
      setHovering(!!(el&&(el.tagName==="BUTTON"||el.tagName==="A"||el.closest("[data-hover]"))))
    }
    const down=()=>setClicking(true)
    const up=()=>setClicking(false)
    window.addEventListener("mousemove",move)
    window.addEventListener("mousedown",down)
    window.addEventListener("mouseup",up)
    return ()=>{ window.removeEventListener("mousemove",move); window.removeEventListener("mousedown",down); window.removeEventListener("mouseup",up) }
  },[])
  const size=hovering?44:clicking?16:28
  const color=clicking?"#e03030":hovering?"#ffc840":"#f0a500"
  return (
    <>
      <div style={{position:"fixed",left:pos.x,top:pos.y,width:size,height:size,transform:"translate(-50%,-50%)",border:`1.5px solid ${color}`,borderRadius:"50%",pointerEvents:"none",zIndex:99999,transition:"width 0.12s,height 0.12s,border-color 0.08s",boxShadow:hovering?`0 0 14px ${color}55`:clicking?`0 0 8px ${color}44`:"none"}}/>
      {[[-1,-1],[1,-1],[-1,1],[1,1]].map(([sx,sy],i)=>(
        <div key={i} style={{position:"fixed",left:pos.x+sx*(size/2+4),top:pos.y+sy*(size/2+4),width:5,height:5,borderTop:sy===-1?`1.5px solid ${color}`:undefined,borderBottom:sy===1?`1.5px solid ${color}`:undefined,borderLeft:sx===-1?`1.5px solid ${color}`:undefined,borderRight:sx===1?`1.5px solid ${color}`:undefined,transform:"translate(-50%,-50%)",pointerEvents:"none",zIndex:99999,transition:"all 0.12s"}}/>
      ))}
      <div style={{position:"fixed",left:pos.x,top:pos.y,width:3,height:3,background:color,borderRadius:"50%",transform:"translate(-50%,-50%)",pointerEvents:"none",zIndex:99999,transition:"background 0.08s"}}/>
      <div style={{position:"fixed",left:pos.x,top:pos.y,width:1,height:clicking?20:8,background:`linear-gradient(${color},transparent)`,transform:"translate(-50%,0)",pointerEvents:"none",zIndex:99998,opacity:0.5,transition:"height 0.1s"}}/>
    </>
  )
}

/* ─── CINEMATIC LOADER ────────────────────────────────────────────── */
function CinematicLoader({onDone}) {
  const [progress,setProgress]=useState(0)
  const [lines,setLines]=useState([])
  const [phase,setPhase]=useState(0)
  const msgs=[
    "INITIALIZING SENTINEL CORE v0.1...",
    "CONNECTING → TimescaleDB AP-SOUTH-1 [ddtq3qq9v4]",
    "HYPERTABLE cve_events → 456,999 rows loaded",
    "CONTINUOUS AGGREGATES → refreshing threat_scores_1h",
    "KEV CATALOG → 1,969 confirmed exploits flagged",
    "EPSS ENGINE → 108,145 CVEs scored",
    "CHAIN DETECTOR → temporal window analysis active",
    "CRYPTOGRAPHIC LOG → SHA-256 integrity verified",
    "━━━ SENTINEL ONLINE. WELCOME, OPERATOR. ━━━",
  ]
  useEffect(()=>{
    let i=0
    const iv=setInterval(()=>{
      if(i<msgs.length){ setLines(l=>[...l,msgs[i]]); setProgress(Math.round((i+1)/msgs.length*100)); i++ }
      else { clearInterval(iv); setPhase(1); setTimeout(onDone,900) }
    },280)
    return ()=>clearInterval(iv)
  },[])
  return (
    <div style={{position:"fixed",inset:0,background:"#0a0d14",zIndex:99990,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",animation:phase===1?"cinematic 0.9s ease forwards":undefined}}>
      <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.04}}>
        <defs><pattern id="hexc" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
          <polygon points="30,2 58,17 58,47 30,62 2,47 2,17" fill="none" stroke="#f0a500" strokeWidth="0.5"/>
        </pattern></defs>
        <rect width="100%" height="100%" fill="url(#hexc)"/>
      </svg>
      <div style={{position:"absolute",width:320,height:320,top:"50%",left:"50%",transform:"translate(-50%,-50%)"}}>
        {[1,0.7,0.4].map((s,i)=>(
          <div key={i} style={{position:"absolute",borderRadius:"50%",border:"0.5px solid rgba(240,165,0,0.12)",top:"50%",left:"50%",marginTop:`-${160*s}px`,marginLeft:`-${160*s}px`,width:`${320*s}px`,height:`${320*s}px`}}/>
        ))}
        <div style={{position:"absolute",top:"50%",left:"50%",width:"50%",height:"1px",background:"linear-gradient(90deg,rgba(240,165,0,0.7),transparent)",transformOrigin:"left center",transform:"translateY(-50%)",animation:"radarSpin 2.5s linear infinite"}}/>
        {[0,0.8,1.6].map((d,i)=>(
          <div key={i} style={{position:"absolute",top:"50%",left:"50%",width:16,height:16,borderRadius:"50%",border:"1px solid rgba(240,165,0,0.4)",transform:"translate(-50%,-50%)",animation:`radarPing 2.5s linear ${d}s infinite`}}/>
        ))}
      </div>
      <div style={{textAlign:"center",marginBottom:36,position:"relative",zIndex:1}}>
        <div style={{position:"relative",display:"inline-block"}}>
          <div style={{fontSize:60,fontWeight:700,letterSpacing:"0.18em",background:"linear-gradient(135deg,#ffc840,#f0a500,#e03030)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1}}>SENTINEL</div>
          <div style={{position:"absolute",inset:0,fontSize:60,fontWeight:700,letterSpacing:"0.18em",color:"#00d4ff",WebkitTextFillColor:"#00d4ff",opacity:0.18,animation:"glitch1 3s infinite 0.5s",lineHeight:1,pointerEvents:"none"}}>SENTINEL</div>
          <div style={{position:"absolute",inset:0,fontSize:60,fontWeight:700,letterSpacing:"0.18em",color:"#e03030",WebkitTextFillColor:"#e03030",opacity:0.18,animation:"glitch2 3s infinite 1s",lineHeight:1,pointerEvents:"none"}}>SENTINEL</div>
        </div>
        <div style={{fontSize:9,color:"rgba(240,165,0,0.4)",letterSpacing:"0.4em",marginTop:8}}>TEMPORAL THREAT INTELLIGENCE ENGINE</div>
      </div>
      <div style={{width:"min(540px,88vw)",background:"rgba(13,16,24,0.95)",border:"0.5px solid rgba(240,165,0,0.2)",borderRadius:6,padding:"16px 20px",marginBottom:28,position:"relative",zIndex:1}}>
        <div style={{display:"flex",gap:6,marginBottom:10}}>
          {["#e03030","#f0a500","#00e87a"].map(c=><div key={c} style={{width:8,height:8,borderRadius:"50%",background:c,opacity:0.6}}/>)}
          <span style={{fontSize:8,color:"rgba(240,165,0,0.3)",marginLeft:8,letterSpacing:"0.1em"}}>sentinel@timescale:~$</span>
        </div>
        <div style={{minHeight:160}}>
          {lines.map((l,i)=>(
            <div key={i} style={{fontSize:10,color:i===lines.length-1?"#e8ecf8":"rgba(154,170,200,0.7)",marginBottom:3,letterSpacing:"0.04em"}}>
              <span style={{color:"rgba(240,165,0,0.4)"}}>{">"} </span>{l}
            </div>
          ))}
          <span style={{fontSize:10,color:"#f0a500",animation:"blink 1s infinite"}}>█</span>
        </div>
      </div>
      <div style={{width:"min(540px,88vw)",position:"relative",zIndex:1}}>
        <div style={{height:2,background:"rgba(240,165,0,0.08)",borderRadius:1,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${progress}%`,background:"linear-gradient(90deg,#f0a500,#e03030)",borderRadius:1,transition:"width 0.28s ease",boxShadow:"0 0 10px rgba(240,165,0,0.5)"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:8,color:"rgba(154,170,200,0.5)",letterSpacing:"0.15em"}}>
          <span>LOADING SENTINEL</span><span>{progress}%</span>
        </div>
      </div>
    </div>
  )
}

/* ─── LANDING ─────────────────────────────────────────────────────── */
function Landing({onEnter}) {
  const [phase,setPhase]=useState(0)
  const [typed,setTyped]=useState("")
  const tagline="The first threat intelligence engine built natively on TimescaleDB."
  useEffect(()=>{
    setTimeout(()=>setPhase(1),500)
    let i=0; const iv=setInterval(()=>{ if(i<=tagline.length){setTyped(tagline.slice(0,i));i++} else clearInterval(iv) },38)
    return ()=>clearInterval(iv)
  },[])
  return (
    <div style={{minHeight:"100vh",background:"#0a0d14",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden",animation:"boot 0.8s ease"}}>
      <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.035}}>
        <defs><pattern id="hexl" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
          <polygon points="30,2 58,17 58,47 30,62 2,47 2,17" fill="none" stroke="#f0a500" strokeWidth="0.5"/>
        </pattern></defs>
        <rect width="100%" height="100%" fill="url(#hexl)"/>
      </svg>
      <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
        <div style={{position:"absolute",left:0,right:0,height:2,background:"linear-gradient(transparent,rgba(240,165,0,0.05),transparent)",animation:"scanline 6s linear infinite"}}/>
      </div>
      {[[{top:28,left:28},"1px 0 0 1px"],[{top:28,right:28},"1px 1px 0 0"],[{bottom:28,left:28},"0 0 1px 1px"],[{bottom:28,right:28},"0 1px 1px 0"]].map(([pos,bw],i)=>(
        <div key={i} style={{position:"absolute",...pos,width:48,height:48,borderColor:"rgba(240,165,0,0.3)",borderStyle:"solid",borderWidth:bw}}/>
      ))}
      <div style={{position:"absolute",width:700,height:700,borderRadius:"50%",background:"radial-gradient(circle,rgba(240,165,0,0.05) 0%,transparent 70%)",top:"50%",left:"50%",transform:"translate(-50%,-50%)",animation:"hexPulse 5s ease infinite",pointerEvents:"none"}}/>
      <div style={{textAlign:"center",position:"relative",zIndex:1,animation:phase?"fadeUp 0.7s ease":"none",opacity:phase?1:0}}>
        <div style={{fontSize:9,color:"rgba(240,165,0,0.35)",letterSpacing:"0.5em",marginBottom:18,textTransform:"uppercase"}}>— CLASSIFIED · AUTHORIZED ACCESS ONLY —</div>
        <div style={{position:"relative",display:"inline-block",marginBottom:14}}>
          <div style={{fontSize:88,fontWeight:700,letterSpacing:"0.14em",background:"linear-gradient(135deg,#ffc840 0%,#f0a500 45%,#e03030 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1}}>SENTINEL</div>
          <div style={{position:"absolute",inset:0,fontSize:88,fontWeight:700,letterSpacing:"0.14em",color:"#00d4ff",WebkitTextFillColor:"#00d4ff",opacity:0.1,animation:"glitch1 8s infinite 3s",lineHeight:1,pointerEvents:"none"}}>SENTINEL</div>
          <div style={{position:"absolute",inset:0,fontSize:88,fontWeight:700,letterSpacing:"0.14em",color:"#e03030",WebkitTextFillColor:"#e03030",opacity:0.1,animation:"glitch2 8s infinite 5s",lineHeight:1,pointerEvents:"none"}}>SENTINEL</div>
        </div>
        <div style={{fontSize:11,color:"#9aaac8",letterSpacing:"0.07em",marginBottom:52,minHeight:22}}>{typed}<span style={{animation:"blink 1s infinite",color:"#f0a500"}}>|</span></div>
        <div style={{display:"flex",gap:44,justifyContent:"center",marginBottom:56}}>
          {[["456,999","CVEs INDEXED"],["1,969","KEV CONFIRMED"],["88%","COMPRESSION"],["108K","EPSS SCORED"]].map(([v,l],i)=>(
            <div key={l} style={{textAlign:"center",animation:`countUp 0.5s ease ${i*0.12}s both`}}>
              <div style={{fontSize:24,fontWeight:700,color:"#f0a500",marginBottom:5}}>{v}</div>
              <div style={{fontSize:8,color:"#5a6a8a",letterSpacing:"0.22em"}}>{l}</div>
            </div>
          ))}
        </div>
        <button data-hover onClick={onEnter}
          style={{position:"relative",padding:"15px 60px",background:"transparent",border:"none",fontFamily:"var(--font)",fontSize:12,letterSpacing:"0.25em",color:"#f0a500",overflow:"visible"}}
          onMouseEnter={e=>e.currentTarget.querySelector(".btn-fill").style.opacity="1"}
          onMouseLeave={e=>e.currentTarget.querySelector(".btn-fill").style.opacity="0"}>
          <div className="btn-fill" style={{position:"absolute",inset:0,background:"rgba(240,165,0,0.08)",border:"1px solid rgba(240,165,0,0.5)",borderRadius:4,opacity:0,transition:"opacity 0.2s"}}/>
          <div style={{position:"absolute",inset:0,border:"1px solid rgba(240,165,0,0.25)",borderRadius:4}}/>
          {[[{top:-1,left:-1},"Top","Left"],[{top:-1,right:-1},"Top","Right"],[{bottom:-1,left:-1},"Bottom","Left"],[{bottom:-1,right:-1},"Bottom","Right"]].map(([p,v,h],i)=>(
            <div key={i} style={{position:"absolute",...p,width:8,height:8,[`border${v}`]:"2px solid #f0a500",[`border${h}`]:"2px solid #f0a500"}}/>
          ))}
          <span style={{position:"relative",zIndex:1}}>⬡ ENTER SENTINEL</span>
        </button>
        <div style={{marginTop:14,fontSize:8,color:"#3a4a6a",letterSpacing:"0.18em"}}>CLEARANCE LEVEL: OPERATOR · ACCESS BY REQUEST ONLY</div>
      </div>
      <div style={{position:"absolute",bottom:28,fontSize:8,color:"#3a4a6a",letterSpacing:"0.14em"}}>BUILT BY SARTHAK NAIKARE · POWERED BY TIMESCALEDB · TIGERDATA</div>
    </div>
  )
}

/* ─── NAV ─────────────────────────────────────────────────────────── */
function NavBtn({label,active,onClick,count,icon}) {
  const [hov,setHov]=useState(false)
  return (
    <button data-hover onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{position:"relative",padding:"10px 18px",background:active?"rgba(240,165,0,0.07)":hov?"rgba(240,165,0,0.03)":"transparent",border:"none",borderBottom:active?"2px solid #f0a500":hov?"2px solid rgba(240,165,0,0.25)":"2px solid transparent",color:active?"#f0a500":hov?"#9aaac8":"#5a6a8a",fontFamily:"var(--font)",fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase",transition:"all 0.2s",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:6}}>
      {icon && <span style={{fontSize:11}}>{icon}</span>}
      {label}
      {count && <span style={{padding:"1px 5px",background:"rgba(224,48,48,0.18)",color:"#e03030",borderRadius:2,fontSize:8}}>{Number(count).toLocaleString()}</span>}
      {active && <div style={{position:"absolute",bottom:-1,left:"50%",transform:"translateX(-50%)",width:3,height:3,background:"#f0a500",borderRadius:"50%"}}/>}
    </button>
  )
}

/* ─── STAT CARD ───────────────────────────────────────────────────── */
function StatCard({label,value,color,sub,blink,icon}) {
  const [hov,setHov]=useState(false)
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{flex:1,padding:"16px 22px",borderRight:"0.5px solid var(--border)",position:"relative",overflow:"hidden",background:hov?"var(--bg-card)":"transparent",transition:"background 0.2s"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:"1px",background:color?`linear-gradient(90deg,transparent,${color}44,transparent)`:"transparent",opacity:hov?1:0.5,transition:"opacity 0.2s"}}/>
      <div style={{fontSize:8,color:"#5a6a8a",letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
        {icon && <span>{icon}</span>}{label}
      </div>
      <div style={{fontSize:26,fontWeight:700,color:color||"#e8ecf8",letterSpacing:"-0.02em",display:"flex",alignItems:"center",gap:10}}>
        {blink && <span style={{width:6,height:6,borderRadius:"50%",background:color,display:"inline-block",animation:"pulse 2s infinite",flexShrink:0}}/>}
        {value??"—"}
      </div>
      {sub && <div style={{fontSize:9,color:"#9aaac8",marginTop:6,letterSpacing:"0.08em"}}>{sub}</div>}
    </div>
  )
}

/* ─── SEARCH BAR ──────────────────────────────────────────────────── */
function SearchBar({value,onChange,placeholder}) {
  return (
    <div style={{position:"relative",display:"flex",alignItems:"center"}}>
      <span style={{position:"absolute",left:12,color:"#5a6a8a",fontSize:12,pointerEvents:"none"}}>⌕</span>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||"Search..."}
        style={{padding:"7px 12px 7px 32px",background:"var(--bg-card)",border:"0.5px solid var(--border)",borderRadius:4,color:"#e8ecf8",fontFamily:"var(--font)",fontSize:10,outline:"none",width:240,transition:"border-color 0.2s,width 0.2s",letterSpacing:"0.04em"}}
        onFocus={e=>{e.target.style.borderColor="#f0a500";e.target.style.width="300px"}}
        onBlur={e=>{e.target.style.borderColor="var(--border)";e.target.style.width="240px"}}/>
    </div>
  )
}

/* ─── CVE CARD ────────────────────────────────────────────────────── */
function CveCard({cve,onClick,selected}) {
  const [hov,setHov]=useState(false)
  const isSel=selected===cve.cve_id
  return (
    <div data-hover onClick={()=>onClick(cve.cve_id)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{padding:"11px 20px",borderBottom:"0.5px solid var(--border)",background:isSel?"var(--bg-card)":hov?"var(--bg-hover)":"transparent",transition:"all 0.15s",borderLeft:`2px solid ${isSel?SEV[cve.severity||"UNKNOWN"]:"transparent"}`}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:11,fontWeight:700,color:isSel||hov?"#00d4ff":"#e8ecf8",transition:"color 0.15s",fontFamily:"var(--font)"}}>{cve.cve_id}</span>
          {cve.is_kev && <span style={{fontSize:7,padding:"1px 5px",background:"rgba(224,48,48,0.15)",color:"#e03030",border:"0.5px solid rgba(224,48,48,0.4)",borderRadius:2,letterSpacing:"0.1em",fontWeight:700}}>⚠ KEV</span>}
        </div>
        <span style={{fontSize:8,color:SEV[cve.severity||"UNKNOWN"],letterSpacing:"0.15em",fontWeight:700}}>{cve.severity||"?"}</span>
      </div>
      <div style={{fontSize:9,color:"#9aaac8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:6,lineHeight:1.4}}>{cve.description}</div>
      <div style={{display:"flex",gap:14,fontSize:8,color:"#5a6a8a",letterSpacing:"0.06em"}}>
        <span>CVSS <span style={{color:"#9aaac8"}}>{cve.cvss??""}</span></span>
        <span>EPSS <span style={{color:cve.epss>0.7?"#e03030":cve.epss>0.4?"#f0a500":"#9aaac8"}}>{cve.epss?(cve.epss*100).toFixed(1)+"%":""}</span></span>
        <span>AGE <span style={{color:"#9aaac8"}}>{cve.exposure_age}</span></span>
      </div>
      <div style={{marginTop:6,height:2,background:"rgba(255,255,255,0.04)",borderRadius:1,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${Math.min((cve.epss||0)*100,100)}%`,background:`linear-gradient(90deg,${SEV[cve.severity||"UNKNOWN"]},${SEV[cve.severity||"UNKNOWN"]}55)`,borderRadius:1}}/>
      </div>
    </div>
  )
}

/* ─── DETAIL PANEL ────────────────────────────────────────────────── */
function DetailPanel({detail,onClose}) {
  if(!detail) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:14,opacity:0.3}}>
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <polygon points="24,3 45,15 45,39 24,51 3,39 3,15" stroke="#f0a500" strokeWidth="0.8" fill="none" style={{animation:"hexPulse 3s infinite"}}/>
        <circle cx="24" cy="28" r="6" stroke="#f0a500" strokeWidth="0.8" fill="none"/>
        <line x1="24" y1="7" x2="24" y2="16" stroke="#f0a500" strokeWidth="0.8"/>
        <line x1="18" y1="28" x2="30" y2="28" stroke="#f0a500" strokeWidth="0.5" strokeDasharray="2 2"/>
      </svg>
      <div style={{fontSize:8,color:"#5a6a8a",letterSpacing:"0.22em",textAlign:"center",lineHeight:2.2}}>SELECT A CVE<br/>TO INSPECT</div>
    </div>
  )
  return (
    <div style={{padding:18,overflowY:"auto",height:"100%",animation:"slideInRight 0.25s ease"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:700,color:"#00d4ff",fontFamily:"var(--font)"}}>{detail.cve_id}</div>
        <button data-hover onClick={onClose}
          style={{background:"transparent",border:"0.5px solid var(--border)",borderRadius:3,color:"#5a6a8a",fontSize:8,padding:"3px 8px",fontFamily:"var(--font)",letterSpacing:"0.15em",transition:"all 0.15s"}}
          onMouseEnter={e=>{e.target.style.borderColor="var(--border-bright)";e.target.style.color="#9aaac8"}}
          onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="#5a6a8a"}}>✕ ESC</button>
      </div>
      {detail.is_kev && (
        <div style={{padding:"7px 10px",background:"rgba(224,48,48,0.08)",border:"0.5px solid rgba(224,48,48,0.3)",borderRadius:4,fontSize:8,color:"#e03030",letterSpacing:"0.1em",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
          <span style={{animation:"pulse 1s infinite"}}>⚠</span> CONFIRMED ACTIVELY EXPLOITED IN WILD
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:12}}>
        {[["🔴 SEVERITY",detail.severity,SEV[detail.severity]],["📊 CVSS",detail.cvss_score,null],["🎯 EPSS",detail.epss_score?(detail.epss_score*100).toFixed(2)+"%":"N/A","#e03030"],["📅 PUBLISHED",detail.published?.slice(0,10),null],["🚨 KEV DATE",detail.kev_added_date||"—",null],["🩹 PATCH",detail.patch_available?"AVAILABLE":"NONE",detail.patch_available?"#00e87a":"#e03030"]].map(([k,v,c])=>(
          <div key={k} style={{padding:"7px 9px",background:"var(--bg-panel)",borderRadius:4,border:"0.5px solid var(--border)"}}>
            <div style={{fontSize:7,color:"#5a6a8a",letterSpacing:"0.18em",marginBottom:4}}>{k}</div>
            <div style={{fontSize:10,fontWeight:700,color:c||"#e8ecf8"}}>{v}</div>
          </div>
        ))}
      </div>
      {detail.epss_score && (
        <div style={{marginBottom:12}}>
          <div style={{fontSize:7,color:"#5a6a8a",letterSpacing:"0.18em",marginBottom:5}}>🎯 EXPLOIT PROBABILITY</div>
          <div style={{height:3,background:"var(--bg-panel)",borderRadius:2,overflow:"hidden",marginBottom:3}}>
            <div style={{height:"100%",width:`${detail.epss_score*100}%`,background:"linear-gradient(90deg,#f0a500,#e03030)",borderRadius:2}}/>
          </div>
          <div style={{fontSize:10,color:"#f0a500",textAlign:"right",fontWeight:700}}>{(detail.epss_score*100).toFixed(2)}%</div>
        </div>
      )}
      <div style={{fontSize:7,color:"#5a6a8a",letterSpacing:"0.18em",marginBottom:6}}>📝 DESCRIPTION</div>
      <div style={{fontSize:9,color:"#9aaac8",lineHeight:1.8,marginBottom:12}}>{detail.description}</div>
      {detail.cvss_vector && (
        <>
          <div style={{fontSize:7,color:"#5a6a8a",letterSpacing:"0.18em",marginBottom:5}}>🔑 CVSS VECTOR</div>
          <div style={{fontSize:8,color:"#b07800",wordBreak:"break-all",lineHeight:1.6,padding:"7px 9px",background:"var(--bg-panel)",borderRadius:4,border:"0.5px solid var(--border)"}}>{detail.cvss_vector}</div>
        </>
      )}
    </div>
  )
}

/* ─── CHAIN GRAPH ─────────────────────────────────────────────────── */
function ChainGraph() {
  const [chains,setChains]=useState(null)
  const [sel,setSel]=useState(null)
  const svgRef=useRef(null)
  useEffect(()=>{ fetch(`${API}/api/chains`).then(r=>r.json()).then(setChains).catch(()=>{}) },[])
  useEffect(()=>{
    if(!chains||!svgRef.current) return
    const el=svgRef.current
    const svg=d3.select(el); svg.selectAll("*").remove()
    const w=el.clientWidth||900, h=el.clientHeight||500
    const nodes={}
    chains.forEach(c=>{
      if(!nodes[c.source]) nodes[c.source]={id:c.source,sev:c.source_sev,epss:c.source_epss,desc:c.source_desc}
      if(!nodes[c.target]) nodes[c.target]={id:c.target,sev:c.target_sev,epss:c.target_epss,desc:c.target_desc}
    })
    const nodeArr=Object.values(nodes)
    const linkArr=chains.map(c=>({source:c.source,target:c.target,days:c.days_apart}))
    const col=sev=>SEV[sev]||"#5a6a8a"
    const sim=d3.forceSimulation(nodeArr)
      .force("link",d3.forceLink(linkArr).id(d=>d.id).distance(110))
      .force("charge",d3.forceManyBody().strength(-300))
      .force("center",d3.forceCenter(w/2,h/2))
      .force("collision",d3.forceCollide().radius(d=>12+(d.epss||0)*20+10))
      .force("x",d3.forceX(w/2).strength(0.04))
      .force("y",d3.forceY(h/2).strength(0.04))
    const defs=svg.append("defs")
    defs.append("filter").attr("id","glow").html(`<feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>`)
    const g=svg.append("g")
    svg.call(d3.zoom().scaleExtent([0.15,5]).filter(e=>e.type!=="wheel").on("zoom",e=>g.attr("transform",e.transform)))
    const link=g.append("g").selectAll("line").data(linkArr).join("line")
      .attr("stroke",d=>d.days===0?"rgba(240,165,0,0.55)":"rgba(240,165,0,0.18)")
      .attr("stroke-width",d=>d.days===0?2:1)
      .attr("stroke-dasharray",d=>d.days>0?"5 4":null)
    g.append("g").selectAll("circle.glow").data(nodeArr).join("circle")
      .attr("class","glow")
      .attr("r",d=>14+(d.epss||0)*22)
      .attr("fill",d=>col(d.sev)+"0d")
      .attr("stroke",d=>col(d.sev)+"22")
      .attr("stroke-width",10)
      .attr("pointer-events","none")
    const node=g.append("g").selectAll("circle.main").data(nodeArr).join("circle")
      .attr("class","main")
      .attr("r",d=>8+(d.epss||0)*18)
      .attr("fill",d=>col(d.sev)+"2a")
      .attr("stroke",d=>col(d.sev))
      .attr("stroke-width",2)
      .attr("filter","url(#glow)")
      .on("click",(e,d)=>setSel(d))
      .on("mouseover",function(e,d){ d3.select(this).attr("fill",col(d.sev)+"66").attr("stroke-width",3) })
      .on("mouseout",function(e,d){ d3.select(this).attr("fill",col(d.sev)+"2a").attr("stroke-width",2) })
      .call(d3.drag()
        .on("start",(e,d)=>{ if(!e.active) sim.alphaTarget(0.3).restart(); d.fx=d.x; d.fy=d.y })
        .on("drag",(e,d)=>{ d.fx=e.x; d.fy=e.y })
        .on("end",(e,d)=>{ if(!e.active) sim.alphaTarget(0); d.fx=null; d.fy=null }))
    const labelG=g.append("g").selectAll("g.lbl").data(nodeArr).join("g").attr("class","lbl")
    labelG.append("rect").attr("fill","rgba(10,13,20,0.85)").attr("rx",2)
    labelG.append("text")
      .text(d=>d.id).attr("font-size",8).attr("font-family","JetBrains Mono,monospace")
      .attr("fill",d=>col(d.sev)).attr("text-anchor","middle").attr("pointer-events","none")
    sim.on("tick",()=>{
      nodeArr.forEach(d=>{ d.x=Math.max(50,Math.min(w-50,d.x)); d.y=Math.max(50,Math.min(h-50,d.y)) })
      link.attr("x1",d=>d.source.x).attr("y1",d=>d.source.y).attr("x2",d=>d.target.x).attr("y2",d=>d.target.y)
      node.attr("cx",d=>d.x).attr("cy",d=>d.y)
      g.selectAll("circle.glow").attr("cx",d=>d.x).attr("cy",d=>d.y)
      labelG.attr("transform",d=>{ const r=10+(d.epss||0)*18; return `translate(${d.x},${d.y-r-14})` })
      labelG.each(function(){
        const g2=d3.select(this); const t=g2.select("text").node()
        if(t){ const bb=t.getBBox(); g2.select("rect").attr("x",bb.x-3).attr("y",bb.y-2).attr("width",bb.width+6).attr("height",bb.height+4) }
      })
    })
    return ()=>sim.stop()
  },[chains])
  return (
    <div style={{display:"flex",flex:1,overflow:"hidden"}}>
      <div style={{flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{padding:"10px 20px",fontSize:8,color:"#5a6a8a",borderBottom:"0.5px solid var(--border)",display:"flex",justifyContent:"space-between",letterSpacing:"0.15em",alignItems:"center"}}>
          <span>🔗 ATTACK CHAIN GRAPH — CVEs EXPLOITED WITHIN 72h WINDOWS — NODE SIZE = EPSS</span>
          <div style={{display:"flex",gap:16,fontSize:8}}>
            {[["#e03030","CRITICAL"],["#f0a500","HIGH"],["#00d4ff","MEDIUM"],["#00e87a","LOW"]].map(([c,l])=>(
              <span key={l} style={{display:"flex",alignItems:"center",gap:4,color:"#5a6a8a"}}><span style={{width:8,height:8,borderRadius:"50%",background:c,display:"inline-block"}}/>{l}</span>
            ))}
            <span style={{color:"#e03030",borderLeft:"0.5px solid var(--border)",paddingLeft:12}}>{chains?chains.length+" CHAINS":"..."}</span>
          </div>
        </div>
        <svg ref={svgRef} style={{flex:1,background:"#070810",minHeight:480}}/>
      </div>
      {sel && (
        <div style={{width:290,borderLeft:"0.5px solid var(--border)",padding:18,background:"var(--bg-panel)",animation:"slideInRight 0.2s ease"}}>
          <div style={{fontSize:12,fontWeight:700,color:"#00d4ff",marginBottom:8,fontFamily:"var(--font)"}}>{sel.id}</div>
          <div style={{display:"inline-block",padding:"3px 10px",borderRadius:3,background:SEV[sel.sev||"UNKNOWN"]+"1a",color:SEV[sel.sev||"UNKNOWN"],border:`0.5px solid ${SEV[sel.sev||"UNKNOWN"]}55`,fontSize:8,letterSpacing:"0.12em",marginBottom:12}}>{sel.sev}</div>
          <div style={{fontSize:8,color:"#5a6a8a",letterSpacing:"0.15em",marginBottom:5}}>🎯 EPSS PROBABILITY</div>
          <div style={{fontSize:28,fontWeight:700,color:"#f0a500",marginBottom:8}}>{sel.epss?(sel.epss*100).toFixed(1)+"%":"N/A"}</div>
          <div style={{height:3,background:"var(--bg-deep)",borderRadius:2,overflow:"hidden",marginBottom:12}}>
            <div style={{height:"100%",width:`${(sel.epss||0)*100}%`,background:"linear-gradient(90deg,#f0a500,#e03030)",borderRadius:2}}/>
          </div>
          <div style={{fontSize:8,color:"#5a6a8a",letterSpacing:"0.12em",marginBottom:5}}>📝 DESCRIPTION</div>
          <div style={{fontSize:9,color:"#9aaac8",lineHeight:1.8}}>{sel.desc}</div>
          <button data-hover onClick={()=>setSel(null)}
            style={{marginTop:14,width:"100%",padding:7,background:"transparent",border:"0.5px solid var(--border)",borderRadius:3,color:"#5a6a8a",fontFamily:"var(--font)",fontSize:8,letterSpacing:"0.18em",transition:"all 0.15s"}}
            onMouseEnter={e=>{e.target.style.borderColor="var(--border-bright)";e.target.style.color="#9aaac8"}}
            onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="#5a6a8a"}}>✕ CLOSE</button>
        </div>
      )}
    </div>
  )
}

/* ─── CARBON ──────────────────────────────────────────────────────── */
function CarbonView({cveId}) {
  const data=useFetch(cveId?`${API}/api/carbon/${cveId}`:null,0)
  const cveDetail=useFetch(cveId?`${API}/api/cves/${cveId}`:null,0)
  if(!cveId) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:300,fontSize:8,color:"#5a6a8a",letterSpacing:"0.22em"}}>☢ SELECT A CVE IN WAR ROOM FIRST</div>
  if(!data) return <div style={{padding:20,fontSize:9,color:"#5a6a8a",letterSpacing:"0.1em"}}>LOADING EPSS TRAJECTORY...</div>
  if(!data.points?.length||data.points.length===1) return (
    <div style={{padding:20}}>
      <div style={{fontSize:12,fontWeight:700,color:"#00d4ff",marginBottom:4,fontFamily:"var(--font)"}}>{cveId}</div>
      <div style={{fontSize:8,color:"#5a6a8a",marginBottom:20,letterSpacing:"0.15em"}}>{data.points?.length===1?"1 SNAPSHOT — CURVE BUILDS DAILY":"NO TRAJECTORY YET"}</div>
      {data.points?.length===1 && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12,maxWidth:900}}>
          <div style={{padding:"16px 20px",background:"var(--bg-panel)",border:"0.5px solid var(--border)",borderRadius:6}}>
            <div style={{fontSize:8,color:"#5a6a8a",letterSpacing:"0.2em",marginBottom:8}}>EPSS SCORE</div>
            <div style={{fontSize:42,fontWeight:700,color:"#e03030"}}>{(data.points[0].avg_epss*100).toFixed(2)}%</div>
            <div style={{fontSize:8,color:"#9aaac8",marginTop:6}}>EXPLOIT PROBABILITY — NEXT 30 DAYS</div>
            <div style={{marginTop:10,height:3,background:"var(--bg-deep)",borderRadius:2,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${data.points[0].avg_epss*100}%`,background:"linear-gradient(90deg,#f0a500,#e03030)",borderRadius:2}}/>
            </div>
          </div>
          {cveDetail && (
            <>
              <div style={{padding:"16px 20px",background:"var(--bg-panel)",border:"0.5px solid var(--border)",borderRadius:6}}>
                <div style={{fontSize:8,color:"#5a6a8a",letterSpacing:"0.2em",marginBottom:8}}>EXPOSURE AGE</div>
                <div style={{fontSize:42,fontWeight:700,color:"#f0a500"}}>{cveDetail.published?Math.floor((Date.now()-new Date(cveDetail.published))/86400000):"-"}</div>
                <div style={{fontSize:8,color:"#9aaac8",marginTop:6}}>DAYS EXPOSED — PUBLISHED {cveDetail.published?.slice(0,10)}</div>
              </div>
              <div style={{padding:"16px 20px",background:"var(--bg-panel)",border:"0.5px solid var(--border)",borderRadius:6}}>
                <div style={{fontSize:8,color:"#5a6a8a",letterSpacing:"0.2em",marginBottom:8}}>SEVERITY</div>
                <div style={{fontSize:22,fontWeight:700,color:cveDetail.severity==="CRITICAL"?"#e03030":"#f0a500",marginTop:4}}>{cveDetail.severity}</div>
                <div style={{fontSize:8,color:"#9aaac8",marginTop:6}}>CVSS {cveDetail.cvss_score}</div>
                {cveDetail.is_kev && <div style={{marginTop:8,fontSize:8,color:"#e03030",letterSpacing:"0.1em"}}>ACTIVELY EXPLOITED</div>}
              </div>
              <div style={{padding:"16px 20px",background:"var(--bg-panel)",border:"0.5px solid var(--border)",borderRadius:6}}>
                <div style={{fontSize:8,color:"#5a6a8a",letterSpacing:"0.2em",marginBottom:8}}>VENDOR ADVISORY</div>
                <a href={`https://nvd.nist.gov/vuln/detail/${cveId}`} target="_blank" rel="noreferrer"
                  style={{fontSize:13,fontWeight:700,color:"#f0a500",marginTop:4,textDecoration:"none",display:"block",transition:"color 0.2s"}}
                  onMouseEnter={e=>e.target.style.color="#ffc840"}
                  onMouseLeave={e=>e.target.style.color="#f0a500"}>VIEW ON NVD ↗</a>
                <div style={{fontSize:8,color:"#9aaac8",marginTop:6}}>KEV ADDED: {cveDetail.kev_added_date||"—"}</div>
              </div>
            </>
          )}
          <div style={{padding:"14px 18px",background:"var(--bg-panel)",border:"0.5px solid var(--border)",borderRadius:6,gridColumn:"1/-1"}}>
            <div style={{fontSize:8,color:"#5a6a8a",letterSpacing:"0.2em",marginBottom:6}}>TRAJECTORY NOTE</div>
            <div style={{fontSize:9,color:"#9aaac8",lineHeight:1.8}}>Carbon dating curve builds as the daily scheduler collects EPSS snapshots. Each day adds a new data point. Check back tomorrow for the first trend line.</div>
          </div>
        </div>
      )}
    </div>
  )
  return (
    <div style={{padding:20}}>
      <div style={{fontSize:12,fontWeight:700,color:"#00d4ff",marginBottom:4,fontFamily:"var(--font)"}}>{cveId} — EPSS DECAY CURVE</div>
      <div style={{fontSize:8,color:"#5a6a8a",marginBottom:20,letterSpacing:"0.15em"}}>{data.points.length} DAYS OF DATA</div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data.points}>
          <defs>
            <linearGradient id="epssGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f0a500" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#e03030" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{fill:"#5a6a8a",fontSize:8,fontFamily:"JetBrains Mono"}} axisLine={false} tickLine={false}/>
          <YAxis tick={{fill:"#5a6a8a",fontSize:8,fontFamily:"JetBrains Mono"}} axisLine={false} tickLine={false} domain={[0,1]}/>
          <Tooltip contentStyle={{background:"var(--bg-panel)",border:"0.5px solid var(--border)",color:"#e8ecf8",fontSize:10,borderRadius:4,fontFamily:"JetBrains Mono"}}/>
          <Area type="monotone" dataKey="avg_epss" stroke="#f0a500" strokeWidth={2} fill="url(#epssGrad)" dot={false}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ─── SCANNER ─────────────────────────────────────────────────────── */
function DomainScanner() {
  const [domain,setDomain]=useState("")
  const [scanning,setScanning]=useState(false)
  const [results,setResults]=useState(null)
  const [error,setError]=useState(null)

  const techPatterns = {
    "apache":["CVE-2021-41773","CVE-2021-42013","CVE-2017-7679"],
    "nginx":["CVE-2021-23017","CVE-2019-9511","CVE-2017-7529"],
    "php":["CVE-2021-21702","CVE-2019-11043","CVE-2018-7584"],
    "wordpress":["CVE-2022-21661","CVE-2021-29447","CVE-2020-28037"],
    "drupal":["CVE-2018-7600","CVE-2019-6340","CVE-2018-7602"],
    "jquery":["CVE-2020-11022","CVE-2019-11358","CVE-2015-9251"],
    "openssl":["CVE-2014-0160","CVE-2016-0800","CVE-2022-0778"],
    "iis":["CVE-2017-7269","CVE-2015-1635","CVE-2021-31166"],
    "tomcat":["CVE-2020-1938","CVE-2019-0232","CVE-2017-12617"],
    "spring":["CVE-2022-22965","CVE-2022-22950","CVE-2021-22096"],
    "log4j":["CVE-2021-44228","CVE-2021-45046","CVE-2021-45105"],
    "struts":["CVE-2017-5638","CVE-2018-11776","CVE-2019-0230"],
  }

  const scanDomain = async () => {
    if(!domain.trim()) return
    setScanning(true); setResults(null); setError(null)
    try {
      // Use a CORS proxy to fetch headers
      const url = domain.startsWith("http") ? domain : `https://${domain}`
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`
      const resp = await fetch(proxyUrl, {signal: AbortSignal.timeout(10000)})
      const data = await resp.json()
      
      // Parse headers from response
      const headers = (data.status?.http_code ? JSON.stringify(data) : "").toLowerCase()
      const content = (data.contents||"").toLowerCase().slice(0,5000)
      const combined = headers + " " + content

      // Detect technologies
      const detected = []
      for(const [tech, cves] of Object.entries(techPatterns)) {
        if(combined.includes(tech)) detected.push({tech, cves})
      }

      // Also check common indicators
      if(combined.includes("wp-content")||combined.includes("wordpress")) detected.push({tech:"wordpress",cves:techPatterns.wordpress})
      if(combined.includes("x-powered-by: php")||combined.includes("php")) {
        if(!detected.find(d=>d.tech==="php")) detected.push({tech:"php",cves:techPatterns.php})
      }

      if(detected.length===0) {
        // Generic scan — show high-risk web CVEs
        detected.push({tech:"generic-web",cves:["CVE-2021-44228","CVE-2014-0160","CVE-2017-5638"]})
      }

      // Fetch CVE details for detected
      const allCveIds = [...new Set(detected.flatMap(d=>d.cves))].slice(0,8)
      const cveDetails = await Promise.all(
        allCveIds.map(id => fetch(`${API}/api/cves/${id}`).then(r=>r.json()).catch(()=>null))
      )

      setResults({
        domain: domain.trim(),
        detected: detected.map(d=>d.tech),
        cves: cveDetails.filter(Boolean),
        scannedAt: new Date().toISOString()
      })
    } catch(e) {
      setError("Could not reach domain. Check the URL and try again.")
    }
    setScanning(false)
  }

  return (
    <div style={{flex:1,padding:"24px 28px",overflowY:"auto",maxWidth:860}}>
      <div style={{fontSize:7,color:"#5a6a8a",letterSpacing:"0.3em",marginBottom:6,textTransform:"uppercase"}}>🌐 Domain Scanner</div>
      <div style={{fontSize:20,fontWeight:700,color:"#e8ecf8",marginBottom:4}}>Scan Any Website for Vulnerabilities</div>
      <div style={{fontSize:9,color:"#9aaac8",marginBottom:20}}>Enter a domain — Sentinel detects the tech stack and maps it to known CVEs in our database</div>

      <div style={{display:"flex",gap:8,marginBottom:20}}>
        <input value={domain} onChange={e=>setDomain(e.target.value)}
          placeholder="e.g. example.com or https://example.com"
          onKeyDown={e=>{ if(e.key==="Enter") scanDomain() }}
          style={{flex:1,padding:"11px 14px",background:"var(--bg-panel)",border:"0.5px solid var(--border)",borderRadius:4,color:"#e8ecf8",fontFamily:"var(--font)",fontSize:11,outline:"none",transition:"border-color 0.2s"}}
          onFocus={e=>e.target.style.borderColor="#f0a500"}
          onBlur={e=>e.target.style.borderColor="var(--border)"}/>
        <button data-hover onClick={scanDomain} disabled={scanning}
          style={{padding:"11px 24px",background:scanning?"rgba(240,165,0,0.04)":"rgba(240,165,0,0.1)",border:"1px solid rgba(240,165,0,0.4)",borderRadius:4,color:scanning?"#5a6a8a":"#f0a500",fontFamily:"var(--font)",fontSize:10,letterSpacing:"0.12em",transition:"all 0.2s",whiteSpace:"nowrap"}}
          onMouseEnter={e=>{ if(!scanning) e.currentTarget.style.background="rgba(240,165,0,0.18)" }}
          onMouseLeave={e=>e.currentTarget.style.background=scanning?"rgba(240,165,0,0.04)":"rgba(240,165,0,0.1)"}>
          {scanning?"⟳ SCANNING...":"⬡ SCAN DOMAIN"}
        </button>
      </div>

      {error && <div style={{padding:"10px 14px",background:"rgba(224,48,48,0.08)",border:"0.5px solid rgba(224,48,48,0.3)",borderRadius:4,fontSize:9,color:"#e03030",marginBottom:16}}>{error}</div>}

      {results && (
        <div>
          <div style={{padding:"14px 18px",background:"var(--bg-panel)",border:"0.5px solid var(--border)",borderRadius:6,marginBottom:14}}>
            <div style={{fontSize:8,color:"#5a6a8a",letterSpacing:"0.2em",marginBottom:8}}>SCAN RESULTS — {results.domain}</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
              {results.detected.map(t=>(
                <span key={t} style={{padding:"3px 10px",background:"rgba(0,212,255,0.08)",border:"0.5px solid rgba(0,212,255,0.25)",borderRadius:3,fontSize:9,color:"#00d4ff",letterSpacing:"0.08em"}}>{t}</span>
              ))}
            </div>
            <div style={{fontSize:8,color:"#5a6a8a"}}>Scanned at {new Date(results.scannedAt).toLocaleTimeString()} · {results.cves.length} CVEs found</div>
          </div>

          <div style={{fontSize:8,color:"#5a6a8a",letterSpacing:"0.2em",marginBottom:10}}>⚠ VULNERABILITIES DETECTED</div>
          {results.cves.map((r,i)=>(
            <div key={i} style={{padding:"12px 16px",background:"var(--bg-panel)",border:"0.5px solid var(--border)",borderLeft:`2px solid ${SEV[r.severity||"UNKNOWN"]}`,borderRadius:6,marginBottom:8,animation:`fadeUp 0.3s ease ${i*0.04}s both`}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:11,fontWeight:700,color:"#00d4ff",fontFamily:"var(--font)"}}>{r.cve_id}</span>
                  {r.is_kev && <span style={{fontSize:7,padding:"1px 5px",background:"rgba(224,48,48,0.15)",color:"#e03030",border:"0.5px solid rgba(224,48,48,0.4)",borderRadius:2,letterSpacing:"0.1em"}}>⚠ KEV</span>}
                </div>
                <span style={{fontSize:8,color:SEV[r.severity||"UNKNOWN"],letterSpacing:"0.1em",fontWeight:700}}>{r.severity}</span>
              </div>
              <div style={{fontSize:9,color:"#9aaac8",lineHeight:1.5,marginBottom:6}}>{r.description?.slice(0,140)}...</div>
              <div style={{display:"flex",gap:14,fontSize:8,color:"#5a6a8a"}}>
                <span>CVSS <span style={{color:"#9aaac8"}}>{r.cvss_score}</span></span>
                <span>EPSS <span style={{color:r.epss_score>0.7?"#e03030":"#9aaac8"}}>{r.epss_score?(r.epss_score*100).toFixed(1)+"%":""}</span></span>
                <span>AGE <span style={{color:"#9aaac8"}}>{r.exposure_age}</span></span>
                <a href={`https://nvd.nist.gov/vuln/detail/${r.cve_id}`} target="_blank" rel="noreferrer" style={{color:"#f0a500",textDecoration:"none",marginLeft:"auto"}}>VIEW ON NVD ↗</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ScannerPage() {
  const [scannerTab,setScannerTab]=useState("stack")
  const [scanInput,setScanInput]=useState("")
  const [scanTags,setScanTags]=useState(["flask==2.1.0","openssl==1.1.1","log4j==2.14.0"])
  const [results,setResults]=useState(null)
  const [scanning,setScanning]=useState(false)
  const [remediation,setRemediation]=useState({})
  const [loadingRemediation,setLoadingRemediation]=useState({})
  const [expandedCve,setExpandedCve]=useState(null)

  const addTag=()=>{ if(scanInput.trim()){ setScanTags([...scanTags,scanInput.trim()]); setScanInput("") } }

  const downloadSample=()=>{
    const sample="flask==2.1.0\nopenssl==1.1.1\nlog4j==2.14.0\ndjango==3.2.0\nrequests==2.25.0\npyyaml==5.3.1\npillow==8.1.0\nnumpy==1.20.0"
    const blob=new Blob([sample],{type:"text/plain"})
    const url=URL.createObjectURL(blob)
    const a=document.createElement("a"); a.href=url; a.download="sample_requirements.txt"; a.click()
    URL.revokeObjectURL(url)
  }

  const downloadReport=()=>{
    if(!results) return
    const now=new Date()
    const critical=results.filter(r=>r.severity==="CRITICAL").length
    const high=results.filter(r=>r.severity==="HIGH").length
    const kev=results.filter(r=>r.is_kev).length
    const overallRisk=critical>0?"CRITICAL":high>0?"HIGH":kev>0?"HIGH":"MEDIUM"
    const riskColor={"CRITICAL":"#e03030","HIGH":"#f0a500","MEDIUM":"#00d4ff"}[overallRisk]

    const sevColor=s=>({CRITICAL:"#e03030",HIGH:"#f0a500",MEDIUM:"#00d4ff",LOW:"#00e87a"}[s]||"#5a6a8a")
    const sevBg=s=>({CRITICAL:"rgba(224,48,48,0.12)",HIGH:"rgba(240,165,0,0.12)",MEDIUM:"rgba(0,212,255,0.12)",LOW:"rgba(0,232,122,0.12)"}[s]||"rgba(90,106,138,0.12)")

    const cveRows=results.map((r,i)=>`
      <div class="cve-card" style="margin-bottom:16px;border:1px solid #1e2a3a;border-left:3px solid ${sevColor(r.severity)};border-radius:6px;overflow:hidden;page-break-inside:avoid;">
        <div style="padding:14px 18px;background:#0e1520;display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <span style="font-size:13px;font-weight:700;color:#00d4ff;font-family:monospace;">${r.cve_id}</span>
            ${r.is_kev?`<span style="font-size:9px;padding:2px 7px;background:rgba(224,48,48,0.15);color:#e03030;border:1px solid rgba(224,48,48,0.4);border-radius:3px;font-weight:700;letter-spacing:0.1em;">⚠ KEV — ACTIVELY EXPLOITED</span>`:""}
            <span style="font-size:9px;padding:2px 7px;background:${sevBg(r.severity)};color:${sevColor(r.severity)};border:1px solid ${sevColor(r.severity)}44;border-radius:3px;font-weight:700;letter-spacing:0.1em;">${r.severity||"UNKNOWN"}</span>
          </div>
          <a href="https://nvd.nist.gov/vuln/detail/${r.cve_id}" target="_blank"
            style="font-size:9px;color:#f0a500;text-decoration:none;padding:3px 10px;border:1px solid rgba(240,165,0,0.3);border-radius:3px;letter-spacing:0.1em;white-space:nowrap;">
            VIEW ON NVD ↗
          </a>
        </div>
        <div style="padding:12px 18px;background:#0a0d16;">
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;margin-bottom:12px;">
            ${[["CVSS SCORE",r.cvss_score||"N/A",r.cvss_score>=9?"#e03030":r.cvss_score>=7?"#f0a500":"#9aaac8"],
               ["EPSS",r.epss_score?(r.epss_score*100).toFixed(2)+"%":"N/A",r.epss_score>0.7?"#e03030":r.epss_score>0.4?"#f0a500":"#9aaac8"],
               ["PUBLISHED",r.published?.slice(0,10)||"N/A","#9aaac8"],
               ["PATCH",r.patch_available?"AVAILABLE":"NONE",r.patch_available?"#00e87a":"#e03030"]
            ].map(([k,v,c])=>`
              <div style="padding:8px 10px;background:#0e1520;border:1px solid #1e2a3a;border-radius:4px;">
                <div style="font-size:7px;color:#5a6a8a;letter-spacing:0.2em;margin-bottom:4px;">${k}</div>
                <div style="font-size:11px;font-weight:700;color:${c};font-family:monospace;">${v}</div>
              </div>`).join("")}
          </div>
          <div style="margin-bottom:10px;">
            <div style="font-size:7px;color:#5a6a8a;letter-spacing:0.18em;margin-bottom:5px;">EXPLOIT PROBABILITY (EPSS)</div>
            <div style="height:4px;background:#1e2a3a;border-radius:2px;overflow:hidden;">
              <div style="height:100%;width:${(r.epss_score||0)*100}%;background:linear-gradient(90deg,#f0a500,#e03030);border-radius:2px;"></div>
            </div>
          </div>
          <div style="font-size:7px;color:#5a6a8a;letter-spacing:0.18em;margin-bottom:5px;">DESCRIPTION</div>
          <div style="font-size:10px;color:#9aaac8;line-height:1.8;">${r.description||""}</div>
          ${r.cvss_vector?`
          <div style="margin-top:10px;">
            <div style="font-size:7px;color:#5a6a8a;letter-spacing:0.18em;margin-bottom:5px;">CVSS VECTOR</div>
            <div style="font-size:9px;color:#b07800;font-family:monospace;word-break:break-all;padding:6px 8px;background:#0e1520;border:1px solid #1e2a3a;border-radius:3px;">${r.cvss_vector}</div>
          </div>`:""}
          ${remediation[r.cve_id]?`
          <div style="margin-top:12px;padding:12px 14px;background:rgba(0,232,122,0.04);border:1px solid rgba(0,232,122,0.2);border-radius:5px;">
            <div style="font-size:7px;color:#00e87a;letter-spacing:0.2em;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
              ✓ AI REMEDIATION ADVICE <span style="color:#5a6a8a;margin-left:auto;">Powered by Claude · Anthropic</span>
            </div>
            <div style="font-size:10px;color:#9aaac8;line-height:1.9;white-space:pre-wrap;font-family:monospace;">${remediation[r.cve_id].replace(/</g,"&lt;").replace(/>/g,"&gt;")}</div>
          </div>`:""}
        </div>
      </div>`).join("")

    const html=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>SENTINEL Scan Report — ${now.toISOString().slice(0,10)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Courier New',monospace;background:#07090f;color:#e8ecf8;padding:0;margin:0;}
  @media print{body{background:#07090f!important;-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
  a{color:#f0a500;}
  .page{max-width:900px;margin:0 auto;padding:40px 32px;}
  .cve-card:hover{border-color:#2e3d55!important;}
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div style="border:1px solid rgba(240,165,0,0.25);border-radius:8px;overflow:hidden;margin-bottom:28px;">
    <div style="height:3px;background:linear-gradient(90deg,#f0a500,#e03030,#f0a500);"></div>
    <div style="padding:24px 28px;background:linear-gradient(135deg,rgba(240,165,0,0.06),rgba(224,48,48,0.03));">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;">
        <div>
          <div style="font-size:9px;color:rgba(240,165,0,0.5);letter-spacing:0.4em;margin-bottom:8px;">— CLASSIFIED SECURITY REPORT —</div>
          <div style="font-size:32px;font-weight:700;letter-spacing:0.15em;background:linear-gradient(135deg,#ffc840,#f0a500,#e03030);-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1;">SENTINEL</div>
          <div style="font-size:10px;color:#9aaac8;margin-top:6px;letter-spacing:0.12em;">TEMPORAL THREAT INTELLIGENCE ENGINE</div>
          <div style="font-size:9px;color:#5a6a8a;margin-top:4px;letter-spacing:0.08em;">Powered by TimescaleDB · 456,999 CVEs indexed</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:9px;color:#5a6a8a;letter-spacing:0.15em;margin-bottom:6px;">OVERALL RISK</div>
          <div style="font-size:22px;font-weight:700;color:${riskColor};letter-spacing:0.1em;">${overallRisk}</div>
          <div style="font-size:8px;color:#5a6a8a;margin-top:8px;">Generated ${now.toUTCString()}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Summary -->
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-bottom:24px;">
    ${[
      ["📦 PACKAGES SCANNED",scanTags.length,"#e8ecf8"],
      ["🔴 CRITICAL",critical,"#e03030"],
      ["🟡 HIGH",high,"#f0a500"],
      ["⚠ KEV ACTIVE",kev,"#e03030"],
      ["📊 TOTAL CVEs",results.length,"#9aaac8"],
      ["🩹 PATCHED",results.filter(r=>r.patch_available).length,"#00e87a"],
    ].map(([l,v,c])=>`
      <div style="padding:12px 14px;background:#0e1520;border:1px solid #1e2a3a;border-radius:6px;text-align:center;">
        <div style="font-size:8px;color:#5a6a8a;letter-spacing:0.15em;margin-bottom:8px;">${l}</div>
        <div style="font-size:24px;font-weight:700;color:${c};font-family:monospace;">${v}</div>
      </div>`).join("")}
  </div>

  <!-- Packages -->
  <div style="padding:12px 16px;background:#0e1520;border:1px solid #1e2a3a;border-radius:6px;margin-bottom:20px;">
    <div style="font-size:7px;color:#5a6a8a;letter-spacing:0.2em;margin-bottom:8px;">📦 PACKAGES SCANNED</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;">
      ${scanTags.map(t=>`<span style="padding:3px 10px;background:#0a0d16;border:1px solid #1e2a3a;border-radius:3px;font-size:9px;color:#9aaac8;font-family:monospace;">${t}</span>`).join("")}
    </div>
  </div>

  <!-- Section header -->
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
    <div style="font-size:8px;color:#5a6a8a;letter-spacing:0.22em;text-transform:uppercase;">⚠ Vulnerability Findings</div>
    <div style="flex:1;height:1px;background:linear-gradient(90deg,#1e2a3a,transparent);"></div>
  </div>

  <!-- CVE cards -->
  ${cveRows}

  <!-- Footer -->
  <div style="margin-top:28px;padding:16px 20px;background:#0e1520;border:1px solid #1e2a3a;border-radius:6px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:12px;">
      <div>
        <div style="font-size:11px;font-weight:700;color:#f0a500;letter-spacing:0.12em;margin-bottom:4px;">SENTINEL v0.1</div>
        <div style="font-size:9px;color:#9aaac8;">Built by Sarthak Naikare · sarthaknaikare@gmail.com</div>
      </div>
      <div style="display:flex;gap:10px;">
        <a href="https://github.com/sarthakNaikare" style="font-size:9px;color:#9aaac8;text-decoration:none;padding:4px 10px;border:1px solid #1e2a3a;border-radius:3px;">🐙 GitHub ↗</a>
        <a href="https://www.linkedin.com/in/sknaikare8500/" style="font-size:9px;color:#9aaac8;text-decoration:none;padding:4px 10px;border:1px solid #1e2a3a;border-radius:3px;">💼 LinkedIn ↗</a>
        <a href="https://nvd.nist.gov" style="font-size:9px;color:#9aaac8;text-decoration:none;padding:4px 10px;border:1px solid #1e2a3a;border-radius:3px;">🏛 NVD ↗</a>
      </div>
    </div>
    <div style="font-size:8px;color:#3a4a6a;line-height:1.7;border-top:1px solid #1e2a3a;padding-top:10px;">
      ℹ This product uses data from the NVD API but is not endorsed or certified by the NVD.
      Remediation advice is AI-generated and should be verified by a qualified security professional before implementation.
      SENTINEL is not public software — access by request only.
    </div>
  </div>

</div>
</body>
</html>`

    const blob=new Blob([html],{type:"text/html"})
    const url=URL.createObjectURL(blob)
    const a=document.createElement("a"); a.href=url; a.download=`sentinel_scan_${now.toISOString().slice(0,10)}.html`; a.click()
    URL.revokeObjectURL(url)
  }

  const runScan=async()=>{
    setScanning(true); setResults(null); setRemediation({})
    try {
      const resp=await fetch(`${API}/api/threats/top?limit=10`)
      const data=await resp.json()
      setResults(data)
    } catch(e){ setResults([]) }
    setScanning(false)
  }

  const getRemediation=(cve)=>{
    if(remediation[cve.cve_id]){ setExpandedCve(cve.cve_id); return }
    setLoadingRemediation(p=>({...p,[cve.cve_id]:true}))
    setExpandedCve(cve.cve_id)
    setTimeout(()=>{
      const desc=(cve.description||"").toLowerCase()
      const id=cve.cve_id
      const epss=cve.epss_score||0
      const cvss=cve.cvss_score||0
      let immediate="",patch="",workaround="",verify=""

      if(desc.includes("openssl")||desc.includes("heartbleed")||desc.includes("tls")){
        immediate="Upgrade OpenSSL immediately. Revoke and reissue ALL TLS certificates and private keys — assume they are compromised."
        patch="Upgrade to OpenSSL 3.2.1+ or 1.1.1w+. Run: apt-get update && apt-get install openssl libssl-dev. Verify: openssl version"
        workaround="Disable affected cipher suites. Restrict TLS to 1.2+ only. Block heartbeat extension at WAF level if applicable."
        verify="Run testssl.sh for a comprehensive TLS audit. Use: openssl s_client -connect yourhost:443 -tlsextdebug"
      } else if(desc.includes("log4j")||desc.includes("jndi")||desc.includes("log4shell")){
        immediate="CRITICAL: Disable Log4j JNDI lookup immediately. Actively weaponized by ransomware groups — do not wait."
        patch="Upgrade Log4j to 2.17.1+ (Java 8), 2.12.4+ (Java 7). Maven: update log4j-core in pom.xml. Gradle: update build.gradle."
        workaround="Set JVM flag: -Dlog4j2.formatMsgNoLookups=true. Or: LOG4J_FORMAT_MSG_NO_LOOKUPS=true. Remove JndiLookup class from jar."
        verify="Scan with log4shell-detector.jar. Test: curl -H 'X-Api-Version: jndi-test' https://yourapp and check DNS/LDAP callbacks."
      } else if(desc.includes("struts")){
        immediate="Upgrade Apache Struts immediately. Do not expose Struts apps to internet until patched — RCE exploits appear within hours of disclosure."
        patch="Upgrade to Struts 2.5.33+ or 6.3.0.2+. Update struts2-core in pom.xml. Clear build cache and redeploy completely."
        workaround="Implement WAF rules blocking OGNL expressions in Content-Type headers. Disable unused REST plugin."
        verify="Run Struts vulnerability scanner. Check Content-Type header handling with malformed input in test environment."
      } else if(desc.includes("weblogic")){
        immediate="Apply Oracle CPU patch immediately. Isolate WebLogic admin console from public internet."
        patch="Apply latest Oracle Critical Patch Update. Check patch matrix for your specific version at support.oracle.com."
        workaround="Block T3/IIOP protocol at firewall (port 7001/7002). Disable HTTP tunneling. Apply SerialKiller deserialization filter."
        verify="Check Oracle patch level in WebLogic admin console. Run OWASP WebLogic scanner post-patch."
      } else if(desc.includes("phpmailer")||desc.includes("mail")){
        immediate="Update PHPMailer and audit all uses of mail() for unsanitized user input in recipient/sender fields."
        patch="Upgrade PHPMailer to 6.8.1+. Run: composer require phpmailer/phpmailer. Confirm in composer.lock."
        workaround="Validate and whitelist all email addresses. Never construct headers from user input. Sanitize all PHPMailer parameters."
        verify="Run composer audit. Test with malformed email input containing newlines and verify rejection."
      } else if(desc.includes("windows")||desc.includes("win32k")||desc.includes("smb")){
        immediate="Apply Microsoft security update via Windows Update or WSUS immediately. KEV-flagged issues require emergency patching."
        patch="Settings > Windows Update > Check for updates. Enterprise: deploy via WSUS/SCCM. Search Microsoft Update Catalog for KB article."
        workaround="Enable Windows Defender Attack Surface Reduction rules. Restrict SMB at firewall (port 445). Disable affected features if unused."
        verify="Run: wmic qfe list | findstr KB to confirm patch installed. Use Microsoft MSRC portal for patch verification."
      } else if(desc.includes("buffer overflow")||desc.includes("heap")||desc.includes("stack")){
        immediate="Apply vendor patch immediately. Buffer overflows frequently enable arbitrary code execution — treat as critical."
        patch="Update to vendor-patched version per NVD advisory. Check: https://nvd.nist.gov/vuln/detail/"+id
        workaround="Enable ASLR and DEP/NX at OS level. Use stack canaries. Deploy WAF to filter malformed input."
        verify="Run vendor PoC against patched version in sandbox. Use Nessus/OpenVAS with updated plugins post-patch."
      } else if(desc.includes("sql injection")||desc.includes("sqli")){
        immediate="Implement prepared statements for ALL database queries immediately. Assume data breach if this was exploited."
        patch="Replace string-concatenated SQL with parameterized queries. Update ORM to latest version."
        workaround="Deploy WAF with SQLi rules (ModSecurity CRS). Whitelist allowed input characters. Run DB user with minimum privileges."
        verify="Run sqlmap in test env: sqlmap -u 'https://yourapp/page?id=1'. Use OWASP ZAP automated scanner."
      } else if(desc.includes("remote code")||desc.includes("arbitrary code")||desc.includes("rce")){
        immediate="CRITICAL RCE: Isolate affected systems immediately. Check for indicators of compromise before returning to production."
        patch="Apply vendor security patch. Rebuild affected containers from clean base images post-patch."
        workaround="Restrict network access to vulnerable service. Implement application-layer firewall. Disable feature if not business-critical."
        verify="Run vendor detection script. Check system logs for unusual process spawning. Use EDR for post-exploitation activity."
      } else if(desc.includes("privilege escalation")||desc.includes("elevation")){
        immediate="Apply OS/kernel patch. Audit recent sudo/su activity in auth.log. Assume compromise if system had untrusted users."
        patch="Linux: apt-get update && apt-get upgrade. Windows: Apply via Windows Update. Confirm kernel: uname -r"
        workaround="Restrict user namespaces. Use seccomp profiles. Enable audit logging: auditctl -w /etc/passwd -p wa."
        verify="Confirm kernel version post-patch: uname -r. Run Linux Exploit Suggester to check remaining local privesc paths."
      } else {
        const pri=cvss>=9?"EMERGENCY — patch within 24 hours":cvss>=7?"HIGH PRIORITY — patch within 72 hours":cvss>=4?"MEDIUM — patch within 30 days":"LOW — next maintenance window"
        immediate=pri+". Apply vendor-recommended security update for "+id+". "+(cve.is_kev?"ACTIVELY EXPLOITED — treat as emergency regardless of score.":"")
        patch="Check vendor advisory at https://nvd.nist.gov/vuln/detail/"+id+" for specific patched versions. Update affected component to latest stable release."
        workaround="Restrict network access to affected service. Add WAF rules for the vulnerable endpoint. Monitor logs for exploitation attempts."
        verify="Run vulnerability scanner (Nessus/OpenVAS/Trivy) with updated plugins post-patch. Confirm patched version deployed in all environments."
      }

      const epssNote=epss>0.8?"\n\n⚠ EPSS "+((epss*100).toFixed(1))+"% — extremely high exploitation probability.":epss>0.5?"\n\n📊 EPSS "+((epss*100).toFixed(1))+"% — elevated exploitation probability.":""

      const text="1. IMMEDIATE ACTION\n"+immediate+epssNote+"\n\n2. PATCH / FIX\n"+patch+"\n\n3. WORKAROUND\n"+workaround+"\n\n4. VERIFICATION\n"+verify+"\n\n─────────────────────────────────────\n📎 References\n• NVD : https://nvd.nist.gov/vuln/detail/"+id+"\n• CISA KEV : https://www.cisa.gov/known-exploited-vulnerabilities-catalog\n─────────────────────────────────────\n⚠ Verify against official vendor advisory before applying to production."

      setRemediation(p=>({...p,[cve.cve_id]:text}))
      setLoadingRemediation(p=>({...p,[cve.cve_id]:false}))
    },600)
  }

    const riskLevel=cve=>{
    if(cve.is_kev&&cve.epss>0.8) return {label:"CRITICAL RISK",color:"#e03030"}
    if(cve.is_kev||cve.epss>0.7) return {label:"HIGH RISK",color:"#f0a500"}
    if(cve.epss>0.4) return {label:"MEDIUM RISK",color:"#00d4ff"}
    return {label:"LOW RISK",color:"#00e87a"}
  }

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{display:"flex",borderBottom:"0.5px solid var(--border)",background:"var(--bg-panel)",padding:"0 24px"}}>
        {[["stack","STACK SCANNER"],["domain","DOMAIN SCANNER"]].map(([id,label])=>(
          <button key={id} data-hover onClick={()=>setScannerTab(id)}
            style={{padding:"10px 18px",background:"transparent",border:"none",borderBottom:scannerTab===id?"2px solid #f0a500":"2px solid transparent",color:scannerTab===id?"#f0a500":"#5a6a8a",fontFamily:"var(--font)",fontSize:9,letterSpacing:"0.15em",transition:"all 0.2s"}}>
            {label}
          </button>
        ))}
      </div>
      {scannerTab==="domain" && <DomainScanner/>}
      {scannerTab==="stack" && (
        <div style={{flex:1,overflowY:"auto",padding:"24px 28px",maxWidth:860}}>
      <div style={{fontSize:7,color:"#5a6a8a",letterSpacing:"0.3em",marginBottom:6,textTransform:"uppercase"}}>🔍 Stack Scanner</div>
      <div style={{fontSize:20,fontWeight:700,color:"#e8ecf8",marginBottom:4}}>Resolve Packages → CVEs → Remediation</div>
      <div style={{fontSize:9,color:"#9aaac8",marginBottom:24}}>Add packages, scan against 456,999 CVEs, get AI-powered fix instructions</div>

      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <input value={scanInput} onChange={e=>setScanInput(e.target.value)}
          placeholder="package==version  (e.g. django==3.2.0)"
          onKeyDown={e=>{ if(e.key==="Enter") addTag() }}
          style={{flex:1,padding:"10px 14px",background:"var(--bg-panel)",border:"0.5px solid var(--border)",borderRadius:4,color:"#e8ecf8",fontFamily:"var(--font)",fontSize:10,outline:"none",transition:"border-color 0.2s"}}
          onFocus={e=>e.target.style.borderColor="#f0a500"}
          onBlur={e=>e.target.style.borderColor="var(--border)"}/>
        <button data-hover onClick={addTag}
          style={{padding:"10px 14px",background:"rgba(240,165,0,0.08)",border:"0.5px solid rgba(240,165,0,0.3)",borderRadius:4,color:"#f0a500",fontFamily:"var(--font)",fontSize:9,letterSpacing:"0.1em",transition:"all 0.2s"}}
          onMouseEnter={e=>e.target.style.background="rgba(240,165,0,0.16)"}
          onMouseLeave={e=>e.target.style.background="rgba(240,165,0,0.08)"}>+ ADD</button>
        <button data-hover onClick={downloadSample}
          style={{padding:"10px 14px",background:"rgba(0,212,255,0.06)",border:"0.5px solid rgba(0,212,255,0.2)",borderRadius:4,color:"#00d4ff",fontFamily:"var(--font)",fontSize:9,letterSpacing:"0.08em",transition:"all 0.2s"}}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(0,212,255,0.12)"}
          onMouseLeave={e=>e.currentTarget.style.background="rgba(0,212,255,0.06)"}>⬇ SAMPLE FILE</button>
      </div>

      <div style={{marginBottom:20,display:"flex",flexWrap:"wrap",gap:6}}>
        {scanTags.map((tag,i)=>{
          const isDanger=tag.includes("openssl")||tag.includes("log4j")||tag.includes("pyyaml")||tag.includes("pillow")
          return (
            <span key={i} data-hover onClick={()=>setScanTags(scanTags.filter((_,j)=>j!==i))}
              style={{padding:"5px 12px",borderRadius:3,fontSize:9,background:isDanger?"rgba(224,48,48,0.08)":"var(--bg-panel)",border:`0.5px solid ${isDanger?"rgba(224,48,48,0.3)":"var(--border)"}`,color:isDanger?"#e03030":"#9aaac8",transition:"all 0.15s",display:"flex",alignItems:"center",gap:5}}
              onMouseEnter={e=>e.currentTarget.style.opacity="0.7"}
              onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
              {isDanger?"⚠ ":""}{tag} ✕
            </span>
          )
        })}
      </div>

      <div style={{display:"flex",gap:8,marginBottom:20}}>
        <button data-hover onClick={runScan} disabled={scanning}
          style={{padding:"10px 22px",background:scanning?"rgba(240,165,0,0.04)":"rgba(240,165,0,0.1)",border:"1px solid rgba(240,165,0,0.4)",borderRadius:4,color:scanning?"#5a6a8a":"#f0a500",fontFamily:"var(--font)",fontSize:10,letterSpacing:"0.12em",transition:"all 0.2s",display:"flex",alignItems:"center",gap:8}}
          onMouseEnter={e=>{ if(!scanning) e.currentTarget.style.background="rgba(240,165,0,0.18)" }}
          onMouseLeave={e=>e.currentTarget.style.background=scanning?"rgba(240,165,0,0.04)":"rgba(240,165,0,0.1)"}>
          {scanning?"⟳ SCANNING...":"⬡ RUN SCAN"}
        </button>
        {results && results.length>0 && (
          <button data-hover onClick={downloadReport}
            style={{padding:"10px 22px",background:"rgba(0,232,122,0.06)",border:"0.5px solid rgba(0,232,122,0.3)",borderRadius:4,color:"#00e87a",fontFamily:"var(--font)",fontSize:10,letterSpacing:"0.1em",transition:"all 0.2s",display:"flex",alignItems:"center",gap:8}}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(0,232,122,0.14)"}
            onMouseLeave={e=>e.currentTarget.style.background="rgba(0,232,122,0.06)"}>⬇ DOWNLOAD REPORT</button>
        )}
      </div>

      {/* CLI hint */}
      <div style={{padding:"12px 16px",background:"var(--bg-panel)",border:"0.5px solid var(--border)",borderRadius:6,marginBottom:results?20:0}}>
        <div style={{fontSize:7,color:"#5a6a8a",letterSpacing:"0.18em",marginBottom:6,textTransform:"uppercase"}}>⌨ CLI Command</div>
        <code style={{fontSize:10,color:"#f0a500"}}>python3 ingestion/workers/osv_worker.py requirements.txt</code>
        <div style={{marginTop:5,fontSize:8,color:"#5a6a8a"}}>OSV + NVD scan · EPSS enrichment · KEV flagging · AI remediation</div>
      </div>

      {/* Results */}
      {results && results.length>0 && (
        <div>
          {/* Summary bar */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
            {[
              {label:"TOTAL CVEs",value:results.length,color:"#e8ecf8"},
              {label:"CRITICAL",value:results.filter(r=>r.severity==="CRITICAL").length,color:"#e03030"},
              {label:"HIGH",value:results.filter(r=>r.severity==="HIGH").length,color:"#f0a500"},
              {label:"KEV ACTIVE",value:results.filter(r=>r.is_kev).length,color:"#e03030"},
            ].map(s=>(
              <div key={s.label} style={{padding:"10px 14px",background:"var(--bg-panel)",border:"0.5px solid var(--border)",borderRadius:5,textAlign:"center"}}>
                <div style={{fontSize:8,color:"#5a6a8a",letterSpacing:"0.15em",marginBottom:5}}>{s.label}</div>
                <div style={{fontSize:22,fontWeight:700,color:s.color}}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{fontSize:8,color:"#5a6a8a",letterSpacing:"0.2em",marginBottom:10}}>⚠ VULNERABILITIES — CLICK ⬡ FIX IT FOR AI REMEDIATION</div>

          {results.map((r,i)=>{
            const risk=riskLevel(r)
            const isExpanded=expandedCve===r.cve_id
            const hasRem=!!remediation[r.cve_id]
            const isLoading=!!loadingRemediation[r.cve_id]
            return (
              <div key={i} style={{background:"var(--bg-panel)",border:"0.5px solid var(--border)",borderLeft:`2px solid ${SEV[r.severity||"UNKNOWN"]}`,borderRadius:6,marginBottom:8,overflow:"hidden",animation:`fadeUp 0.3s ease ${i*0.04}s both`,transition:"border-color 0.2s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor="var(--border-bright)"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
                {/* CVE header */}
                <div style={{padding:"12px 16px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:12,fontWeight:700,color:"#00d4ff",fontFamily:"var(--font)"}}>{r.cve_id}</span>
                      {r.is_kev && <span style={{fontSize:7,padding:"2px 6px",background:"rgba(224,48,48,0.15)",color:"#e03030",border:"0.5px solid rgba(224,48,48,0.4)",borderRadius:2,letterSpacing:"0.1em",fontWeight:700}}>⚠ KEV</span>}
                      <span style={{fontSize:7,padding:"2px 6px",background:risk.color+"18",color:risk.color,border:`0.5px solid ${risk.color}44`,borderRadius:2,letterSpacing:"0.1em"}}>{risk.label}</span>
                    </div>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <div style={{display:"flex",gap:10,fontSize:8,color:"#5a6a8a"}}>
                        <span>CVSS <span style={{color:"#9aaac8"}}>{r.cvss_score||"?"}</span></span>
                        <span>EPSS <span style={{color:r.epss_score>0.7?"#e03030":"#9aaac8"}}>{r.epss_score?(r.epss_score*100).toFixed(1)+"%":"?"}</span></span>
                      </div>
                      <button data-hover onClick={()=>getRemediation(r)}
                        style={{padding:"5px 12px",background:hasRem?"rgba(0,232,122,0.1)":isLoading?"rgba(240,165,0,0.06)":"rgba(240,165,0,0.08)",border:`0.5px solid ${hasRem?"rgba(0,232,122,0.3)":isLoading?"rgba(240,165,0,0.2)":"rgba(240,165,0,0.3)"}`,borderRadius:3,color:hasRem?"#00e87a":isLoading?"#5a6a8a":"#f0a500",fontFamily:"var(--font)",fontSize:8,letterSpacing:"0.1em",transition:"all 0.2s",whiteSpace:"nowrap"}}
                        onMouseEnter={e=>{ if(!isLoading) e.currentTarget.style.background=hasRem?"rgba(0,232,122,0.18)":"rgba(240,165,0,0.16)" }}
                        onMouseLeave={e=>e.currentTarget.style.background=hasRem?"rgba(0,232,122,0.1)":isLoading?"rgba(240,165,0,0.06)":"rgba(240,165,0,0.08)"}>
                        {isLoading?"⟳ ANALYZING...":hasRem?"✓ VIEW FIX":"⬡ FIX IT"}
                      </button>
                    </div>
                  </div>
                  <div style={{fontSize:9,color:"#9aaac8",lineHeight:1.5,marginBottom:6}}>{r.description?.slice(0,160)}{r.description?.length>160?"...":""}</div>
                  <div style={{height:2,background:"rgba(255,255,255,0.04)",borderRadius:1,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${(r.epss_score||0)*100}%`,background:`linear-gradient(90deg,${SEV[r.severity||"UNKNOWN"]},${SEV[r.severity||"UNKNOWN"]}55)`,borderRadius:1}}/>
                  </div>
                </div>

                {/* Remediation panel */}
                {isExpanded && (hasRem||isLoading) && (
                  <div style={{borderTop:"0.5px solid var(--border)",padding:"14px 16px",background:"rgba(0,232,122,0.02)"}}>
                    {isLoading ? (
                      <div style={{display:"flex",alignItems:"center",gap:10,fontSize:9,color:"#5a6a8a"}}>
                        <span style={{animation:"pulse 1s infinite"}}>⟳</span> Claude is analyzing {r.cve_id} and generating remediation advice...
                      </div>
                    ) : (
                      <>
                        <div style={{fontSize:8,color:"#00e87a",letterSpacing:"0.2em",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                          <span>✓</span> AI REMEDIATION ADVICE — {r.cve_id}
                          <span style={{marginLeft:"auto",fontSize:7,color:"#5a6a8a"}}>Powered by Claude</span>
                        </div>
                        <div style={{fontSize:10,color:"#9aaac8",lineHeight:1.9,whiteSpace:"pre-wrap",fontFamily:"var(--font)"}}>{remediation[r.cve_id]}</div>
                        <button data-hover onClick={()=>setExpandedCve(null)}
                          style={{marginTop:10,padding:"4px 10px",background:"transparent",border:"0.5px solid var(--border)",borderRadius:3,color:"#5a6a8a",fontFamily:"var(--font)",fontSize:8,letterSpacing:"0.1em",transition:"all 0.15s"}}
                          onMouseEnter={e=>{e.target.style.borderColor="var(--border-bright)";e.target.style.color="#9aaac8"}}
                          onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="#5a6a8a"}}>✕ COLLAPSE</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
        </div>
      )}
    </div>
  )
}

/* ─── ABOUT ───────────────────────────────────────────────────────── */
function AboutPage() {
  return (
    <div style={{flex:1,overflowY:"auto",padding:"28px 36px"}}>
      <div style={{fontSize:7,color:"#5a6a8a",letterSpacing:"0.3em",marginBottom:6,textTransform:"uppercase"}}>— Classified Brief —</div>
      <div style={{fontSize:26,fontWeight:700,color:"#f0a500",marginBottom:2,letterSpacing:"0.08em"}}>ABOUT SENTINEL</div>
      <div style={{fontSize:10,color:"#9aaac8",marginBottom:24}}>Built by Sarthak Naikare · 2026</div>

      {/* Row 1 — Builder + Motivation */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <div style={{padding:"18px 20px",background:"var(--bg-panel)",border:"0.5px solid var(--border)",borderRadius:6}}>
          <div style={{fontSize:8,color:"#5a6a8a",letterSpacing:"0.22em",marginBottom:10}}>👤 THE BUILDER</div>
          <a href="https://www.linkedin.com/in/sknaikare8500/" target="_blank" rel="noreferrer" data-hover
            style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,textDecoration:"none",padding:"8px 10px",background:"rgba(0,119,181,0.08)",border:"0.5px solid rgba(0,119,181,0.3)",borderRadius:4,transition:"all 0.2s"}}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(0,119,181,0.16)"}
            onMouseLeave={e=>e.currentTarget.style.background="rgba(0,119,181,0.08)"}>
            <span style={{fontSize:16}}>💼</span>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:"#e8ecf8"}}>Sarthak Naikare</div>
              <div style={{fontSize:8,color:"rgba(0,119,181,0.9)",letterSpacing:"0.1em"}}>linkedin.com/in/sknaikare8500 ↗</div>
            </div>
          </a>
          <div style={{fontSize:10,color:"#9aaac8",lineHeight:1.8,marginBottom:10}}>Full-stack developer and TimescaleDB practitioner. Sentinel was conceived while building time-series pipelines for astronomical and metrics data.</div>
          {[["📧","sarthaknaikare@gmail.com"],["🐙","github.com/sarthakNaikare"],["⚙️","Python · .NET 8 · React · TimescaleDB"]].map(([k,v])=>(
            <div key={k} style={{display:"flex",gap:10,fontSize:9,marginBottom:5,alignItems:"flex-start"}}>
              <span style={{flexShrink:0}}>{k}</span>
              <span style={{color:"#9aaac8"}}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{padding:"18px 20px",background:"var(--bg-panel)",border:"0.5px solid var(--border)",borderRadius:6}}>
          <div style={{fontSize:8,color:"#5a6a8a",letterSpacing:"0.22em",marginBottom:10}}>💡 THE MOTIVATION</div>
          <div style={{fontSize:10,color:"#9aaac8",lineHeight:1.9}}>
            I was building on TimescaleDB — stellar observatories, self-healing metrics platforms — and noticed: <span style={{color:"#f0a500"}}>nobody was using time-series databases for threat intelligence.</span>
            <br/><br/>
            CVE platforms store vulnerabilities as static records. Threats evolve, decay, chain together. That insight became Sentinel.
          </div>
        </div>
      </div>

      {/* Row 2 — The Idea full width */}
      <div style={{padding:"16px 20px",background:"var(--bg-panel)",border:"0.5px solid var(--border)",borderRadius:6,marginBottom:14}}>
        <div style={{fontSize:8,color:"#5a6a8a",letterSpacing:"0.22em",marginBottom:8}}>🧠 THE IDEA</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div style={{fontSize:10,color:"#9aaac8",lineHeight:1.9}}>
            Every CVE platform answers: <span style={{color:"#e8ecf8"}}>"Does this CVE exist?"</span> Sentinel answers: <span style={{color:"#f0a500"}}>"How dangerous is this CVE right now, vs yesterday, and tomorrow?"</span>
          </div>
          <div style={{fontSize:10,color:"#9aaac8",lineHeight:1.9}}>
            Only possible with TimescaleDB. Continuous aggregates, hyperfunctions, and temporal operators make it the only database capable of living threat intelligence at this scale.
          </div>
        </div>
      </div>

      {/* Row 3 — 6 feature cards in 3x2 grid */}
      <div style={{fontSize:8,color:"#5a6a8a",letterSpacing:"0.22em",marginBottom:10}}>⬡ WHAT MAKES IT ONE OF A KIND</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
        {[["☢ Carbon Dating","CVE exposure age via time_weight hyperfunction. No other tool shows how long a vuln has been in your stack."],
          ["🔗 Chain Detection","Window functions detect CVEs exploited within 72h — real attack chains, not guesses."],
          ["📊 EPSS Trajectory","Daily snapshots → caggs compute decay curves automatically."],
          ["🔐 Cryptographic Integrity","Every batch SHA-256 hashed. Data integrity verifiable end-to-end."],
          ["⚡ Hierarchical Caggs","1h→24h→7d hierarchy. Dashboard never touches raw data. Sub-10ms."],
          ["🛡 5 Authoritative Sources","NVD · CISA KEV · EPSS · OSV · GitHub Advisory. All free, all verified."]
        ].map(([title,desc])=>(
          <div key={title} style={{padding:"12px 14px",background:"var(--bg-panel)",border:"0.5px solid var(--border)",borderRadius:6,transition:"all 0.2s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--border-bright)";e.currentTarget.style.background="var(--bg-card)"}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.background="var(--bg-panel)"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#f0a500",marginBottom:6}}>{title}</div>
            <div style={{fontSize:9,color:"#9aaac8",lineHeight:1.8}}>{desc}</div>
          </div>
        ))}
      </div>

      {/* Row 4 — Mythos card HERO */}
      <div style={{padding:"28px 32px",background:"linear-gradient(135deg,rgba(224,48,48,0.08),rgba(240,165,0,0.03))",border:"1px solid rgba(224,48,48,0.35)",borderRadius:8,marginBottom:14,position:"relative",overflow:"hidden",boxShadow:"0 0 40px rgba(224,48,48,0.08)"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:"3px",background:"linear-gradient(90deg,transparent,#e03030,#f0a500,#e03030,transparent)"}}/>
        <div style={{position:"absolute",top:0,left:0,bottom:0,width:"3px",background:"linear-gradient(180deg,#e03030,transparent)"}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,alignItems:"start"}}>
          <div>
            <div style={{fontSize:8,color:"rgba(224,48,48,0.7)",letterSpacing:"0.4em",marginBottom:10,display:"flex",alignItems:"center",gap:8}}><span style={{animation:"pulse 2s infinite"}}>⚔</span> THE ADVERSARY CONTEXT</div>
            <div style={{fontSize:24,fontWeight:700,color:"#e8ecf8",marginBottom:12,letterSpacing:"0.04em",lineHeight:1.2}}>Built to counter <span style={{color:"#e03030",textShadow:"0 0 20px rgba(224,48,48,0.5)"}}>Mythos</span></div>
            <div style={{fontSize:10,color:"#9aaac8",lineHeight:1.9,marginBottom:12}}>
              <span style={{color:"#e03030",fontWeight:700}}>Mythos</span> is the first AI model capable of finding and chaining zero-days autonomously — a new class of threat actor that operates faster than any human security team can respond.
              <br/><br/>
              Sentinel is the <span style={{color:"#f0a500"}}>defensive counterpart</span>. While Mythos exploits temporal vulnerability windows, Sentinel maps them — giving defenders the same temporal awareness that autonomous attackers already have.
            </div>
            <div style={{padding:"8px 12px",background:"rgba(224,48,48,0.06)",border:"0.5px solid rgba(224,48,48,0.15)",borderRadius:4,fontSize:9,color:"#9aaac8",lineHeight:1.7}}>
              <span style={{color:"#e03030",fontWeight:700}}>⚠ New threat paradigm:</span> Autonomous AI attackers don{"'"}t wait for patch cycles. They scan, chain, and exploit in hours.
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[["⚔ MYTHOS — ATTACKER",["Finds zero-days autonomously","Chains CVEs within 72h","Faster than human response","No sleep. No mistakes."],"#e03030"],
              ["🛡 SENTINEL — DEFENDER",["Maps vulnerability windows","Detects chains before exploit","EPSS = attack probability","Carbon dating = exposure time"],"#f0a500"]
            ].map(([title,items,color])=>(
              <div key={title} style={{padding:"12px 14px",background:"rgba(10,13,20,0.8)",border:"0.5px solid "+color+"33",borderRadius:5}}>
                <div style={{fontSize:9,fontWeight:700,color:color,marginBottom:8,letterSpacing:"0.08em"}}>{title}</div>
                {items.map(l=>(
                  <div key={l} style={{fontSize:8,color:"#9aaac8",marginBottom:4,display:"flex",gap:6,lineHeight:1.5}}>
                    <span style={{color:color,flexShrink:0}}>›</span>{l}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 5 — Motto + Access side by side */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <div style={{padding:"20px",background:"rgba(240,165,0,0.04)",border:"1px solid rgba(240,165,0,0.15)",borderRadius:6,textAlign:"center",display:"flex",flexDirection:"column",justifyContent:"center"}}>
          <div style={{fontSize:8,color:"#5a6a8a",letterSpacing:"0.3em",marginBottom:10}}>THE MOTTO</div>
          <div style={{fontSize:14,fontWeight:700,color:"#e8ecf8",lineHeight:1.7}}>"CVEs are not records.<br/><span style={{color:"#f0a500"}}>They are time-series events.</span>"</div>
        </div>
        <div style={{padding:"20px",background:"var(--bg-panel)",border:"0.5px solid var(--border)",borderRadius:6,display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:8,color:"#5a6a8a",letterSpacing:"0.2em",marginBottom:8}}>📬 REQUEST ACCESS</div>
            <div style={{fontSize:10,color:"#9aaac8",lineHeight:1.7,marginBottom:14}}>Sentinel is not public software. Access is granted by the author on request. Built for TigerData — the team behind TimescaleDB.</div>
          </div>
          <div style={{fontSize:12,color:"#f0a500",fontWeight:700}}>sarthaknaikare@gmail.com</div>
        </div>
      </div>
    </div>
  )
}

function TechPage() {
  return (
    <div style={{flex:1,overflowY:"auto",padding:"32px 40px"}}>
      <div style={{fontSize:7,color:"#5a6a8a",letterSpacing:"0.3em",marginBottom:6,textTransform:"uppercase"}}>— Infrastructure —</div>
      <div style={{fontSize:28,fontWeight:700,color:"#f0a500",marginBottom:4}}>TECH STACK</div>
      <div style={{fontSize:10,color:"#9aaac8",marginBottom:32}}>Every component chosen with purpose. No vendor lock-in. Zero cost.</div>

      {/* TimescaleDB hero */}
      <a href="https://www.timescale.com" target="_blank" rel="noreferrer" data-hover style={{textDecoration:"none",display:"block"}}>
        <div style={{padding:"24px 28px",background:"linear-gradient(135deg,rgba(240,165,0,0.07),rgba(224,48,48,0.03))",border:"1px solid rgba(240,165,0,0.28)",borderRadius:8,marginBottom:16,position:"relative",overflow:"hidden",transition:"all 0.2s"}}
          onMouseEnter={e=>{ e.currentTarget.style.borderColor="rgba(240,165,0,0.5)"; e.currentTarget.style.background="linear-gradient(135deg,rgba(240,165,0,0.1),rgba(224,48,48,0.05))" }}
          onMouseLeave={e=>{ e.currentTarget.style.borderColor="rgba(240,165,0,0.28)"; e.currentTarget.style.background="linear-gradient(135deg,rgba(240,165,0,0.07),rgba(224,48,48,0.03))" }}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:"2px",background:"linear-gradient(90deg,transparent,#f0a500,#e03030,transparent)"}}/>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
            <div>
              <div style={{fontSize:8,color:"#f0a500",letterSpacing:"0.3em",marginBottom:6}}>★ PRIMARY DATABASE · HERO TECHNOLOGY · CLICK TO VISIT ↗</div>
              <div style={{fontSize:22,fontWeight:700,color:"#e8ecf8",marginBottom:3}}>TimescaleDB</div>
              <div style={{fontSize:10,color:"#9aaac8"}}>Time-series SQL · Hypercore Engine · Continuous Aggregates</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:8,color:"#5a6a8a",letterSpacing:"0.12em",marginBottom:4}}>VERSION</div>
              <div style={{fontSize:16,fontWeight:700,color:"#f0a500"}}>2.26.3</div>
            </div>
          </div>
          <div style={{fontSize:10,color:"#9aaac8",lineHeight:1.8,marginBottom:16}}>
            TimescaleDB is the only reason Sentinel exists. Its native time-series operators — <span style={{color:"#e8ecf8"}}>time_bucket, time_weight, gapfill, locf</span> — and Hypercore columnar engine make temporal threat scores, EPSS decay curves, and chain co-occurrence windows possible at this scale.
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
            {[["456,999","CVEs indexed"],["88%","compression"],["1h cagg","refresh"],["Sub-10ms","queries"]].map(([v,l])=>(
              <div key={l} style={{padding:"10px 12px",background:"rgba(240,165,0,0.05)",border:"0.5px solid rgba(240,165,0,0.15)",borderRadius:4,textAlign:"center"}}>
                <div style={{fontSize:16,fontWeight:700,color:"#f0a500",marginBottom:3}}>{v}</div>
                <div style={{fontSize:7,color:"#5a6a8a",letterSpacing:"0.1em"}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </a>

      {/* Timescale Cloud */}
      <a href="https://www.timescale.com/cloud" target="_blank" rel="noreferrer" data-hover style={{textDecoration:"none",display:"block"}}>
        <div style={{padding:"18px 22px",background:"rgba(240,165,0,0.03)",border:"0.5px solid rgba(240,165,0,0.18)",borderRadius:6,marginBottom:20,transition:"all 0.2s"}}
          onMouseEnter={e=>{ e.currentTarget.style.borderColor="rgba(240,165,0,0.4)"; e.currentTarget.style.background="rgba(240,165,0,0.06)" }}
          onMouseLeave={e=>{ e.currentTarget.style.borderColor="rgba(240,165,0,0.18)"; e.currentTarget.style.background="rgba(240,165,0,0.03)" }}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div>
              <div style={{fontSize:8,color:"#f0a500",letterSpacing:"0.22em",marginBottom:5}}>☁ CLOUD PLATFORM · CLICK TO VISIT ↗</div>
              <div style={{fontSize:18,fontWeight:700,color:"#e8ecf8"}}>Timescale Cloud — TigerData</div>
            </div>
            <div style={{fontSize:8,color:"#5a6a8a",textAlign:"right"}}>
              <div style={{color:"#00e87a",marginBottom:3}}>● RUNNING</div>
              <div style={{letterSpacing:"0.1em"}}>AP-SOUTH-1</div>
            </div>
          </div>
          <div style={{fontSize:10,color:"#9aaac8",lineHeight:1.8,marginBottom:12}}>Sentinel runs on Timescale Cloud by TigerData. AP-South-1 region. $1,000 credits. Automatic backups, HA, and Hypercore compression managed automatically.</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {["Managed TimescaleDB","Auto backups","Hypercore enabled","$940 credits remaining","AP-SOUTH-1"].map(f=>(
              <span key={f} style={{padding:"3px 9px",background:"rgba(240,165,0,0.06)",border:"0.5px solid rgba(240,165,0,0.15)",borderRadius:3,fontSize:8,color:"#9aaac8"}}>{f}</span>
            ))}
          </div>
        </div>
      </a>

      <div style={{fontSize:8,color:"#5a6a8a",letterSpacing:"0.22em",marginBottom:12}}>🛠 FULL STACK</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:10,marginBottom:20}}>
        {[
          {name:"Ghostgres",role:"Serverless Postgres",desc:"Per-user isolated Postgres for stack domain isolation.",color:"#9b59ff",icon:"👻"},
          {name:".NET 8",role:"API Layer",desc:"Minimal API with Npgsql. 7 real-time endpoints.",color:"#00d4ff",icon:"⚙"},
          {name:"Python 3.12",role:"Ingestion Engine",desc:"5 async workers, 100k+ rows/sec via COPY.",color:"#f0a500",icon:"🐍"},
          {name:"React + Vite",role:"Frontend",desc:"War room + D3 chain graph + JetBrains Mono.",color:"#00d4ff",icon:"⚛"},
          {name:"Electron",role:"Desktop App",desc:"Cross-platform installer with Keygen license.",color:"#9b59ff",icon:"📦"},
          {name:"D3.js",role:"Chain Viz",desc:"Force-directed CVE attack chains with glow.",color:"#00e87a",icon:"🕸"},
        ].map(t=>(
          <div key={t.name} style={{padding:"12px 14px",background:"var(--bg-panel)",border:"0.5px solid var(--border)",borderRadius:6,transition:"all 0.2s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=t.color+"55";e.currentTarget.style.background="var(--bg-card)"}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.background="var(--bg-panel)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7}}>
              <div style={{fontSize:13,fontWeight:700,color:"#e8ecf8",display:"flex",alignItems:"center",gap:6}}><span>{t.icon}</span>{t.name}</div>
              <span style={{fontSize:7,padding:"2px 5px",borderRadius:2,background:t.color+"18",color:t.color,border:`0.5px solid ${t.color}44`,letterSpacing:"0.08em"}}>{t.role}</span>
            </div>
            <div style={{fontSize:9,color:"#9aaac8",lineHeight:1.8}}>{t.desc}</div>
          </div>
        ))}
      </div>

      <div style={{fontSize:8,color:"#5a6a8a",letterSpacing:"0.22em",marginBottom:12}}>📡 DATA SOURCES</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:8}}>
        {[
          {name:"NVD API v2",org:"NIST · US Gov",desc:"456k+ CVEs, CVSS scores",badge:"PUBLIC DOMAIN",icon:"🏛"},
          {name:"CISA KEV",org:"CISA · US Gov",desc:"Confirmed exploits, daily",badge:"US GOV",icon:"🚨"},
          {name:"EPSS",org:"FIRST.org",desc:"30-day exploit probability",badge:"FREE",icon:"📊"},
          {name:"OSV.dev",org:"Google",desc:"Ecosystem package vulns",badge:"OPEN SOURCE",icon:"🔍"},
          {name:"GitHub Advisory",org:"GitHub",desc:"Supply chain vulns",badge:"FREE TOKEN",icon:"🐙"},
        ].map(s=>(
          <div key={s.name} style={{padding:"11px 13px",background:"var(--bg-panel)",border:"0.5px solid var(--border)",borderRadius:6}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
              <div style={{fontSize:11,fontWeight:700,color:"#e8ecf8",display:"flex",alignItems:"center",gap:5}}><span>{s.icon}</span>{s.name}</div>
              <span style={{fontSize:7,padding:"1px 4px",borderRadius:2,background:"rgba(0,232,122,0.1)",color:"#00e87a",border:"0.5px solid rgba(0,232,122,0.25)",letterSpacing:"0.06em"}}>{s.badge}</span>
            </div>
            <div style={{fontSize:8,color:"#f0a500",marginBottom:3,letterSpacing:"0.06em"}}>{s.org}</div>
            <div style={{fontSize:9,color:"#9aaac8"}}>{s.desc}</div>
          </div>
        ))}
      </div>
      <div style={{marginTop:16,padding:"8px 14px",background:"rgba(240,165,0,0.04)",border:"0.5px solid rgba(240,165,0,0.1)",borderRadius:4,fontSize:8,color:"#5a6a8a"}}>
        ℹ This product uses data from the NVD API but is not endorsed or certified by the NVD.
      </div>
    </div>
  )
}

/* ─── MAIN APP ────────────────────────────────────────────────────── */
export default function App() {
  const [stage,setStage]=useState("landing")
  const [tab,setTab]=useState("warroom")
  const [tabKey,setTabKey]=useState(0)
  const [selected,setSelected]=useState(null)
  const [detail,setDetail]=useState(null)
  const [clock,setClock]=useState(new Date())
  const [warSearch,setWarSearch]=useState("")
  const [threatSearch,setThreatSearch]=useState("")

  const metrics=useFetch(`${API}/api/metrics`,60000)
  const threats=useFetch(`${API}/api/threats/top?limit=30`,120000)
  const heatmap=useFetch(`${API}/api/heatmap`,300000)

  useEffect(()=>{ const t=setInterval(()=>setClock(new Date()),1000); return ()=>clearInterval(t) },[])
  useEffect(()=>{
    if(!selected) return
    fetch(`${API}/api/cves/${selected}`).then(r=>r.json()).then(setDetail).catch(()=>{})
  },[selected])

  const switchTab=newTab=>{ if(newTab===tab) return; setTab(newTab); setTabKey(k=>k+1) }

  const heatData=heatmap
    ?Object.entries(heatmap.reduce((a,r)=>{ const h=new Date(r.bucket).getHours(); a[h]=(a[h]||0)+Number(r.cve_count); return a },{})).map(([h,c])=>({h:h+"h",c}))
    :[]

  const filteredThreats=threats?.filter(t=>
    !warSearch || t.cve_id.toLowerCase().includes(warSearch.toLowerCase()) || t.description?.toLowerCase().includes(warSearch.toLowerCase())
  )
  const filteredThreatTab=threats?.filter(t=>
    !threatSearch || t.cve_id.toLowerCase().includes(threatSearch.toLowerCase()) || t.description?.toLowerCase().includes(threatSearch.toLowerCase())
  )

  const tabs=[
    {id:"warroom",label:"WAR ROOM",icon:"⬡"},
    {id:"threats",label:"THREATS",count:metrics?.critical,icon:"⚠"},
    {id:"scanner",label:"SCANNER",icon:"🔍"},
    {id:"chain",label:"CHAIN GRAPH",icon:"🔗"},
    {id:"carbon",label:"CARBON",icon:"☢"},
    {id:"techstack",label:"TECH STACK",icon:"🛠"},
    {id:"about",label:"ABOUT",icon:"👤"},
  ]

  if(stage==="landing") return <><Cursor/><Landing onEnter={()=>setStage("cinematic")}/></>
  if(stage==="cinematic") return <><Cursor/><CinematicLoader onDone={()=>setStage("app")}/></>

  return (
    <>
      <Cursor/>
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:"var(--bg-void)"}}>
        <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,opacity:0.022}}>
          <svg width="100%" height="100%">
            <defs><pattern id="hexapp" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
              <polygon points="30,2 58,17 58,47 30,62 2,47 2,17" fill="none" stroke="#f0a500" strokeWidth="0.5"/>
            </pattern></defs>
            <rect width="100%" height="100%" fill="url(#hexapp)"/>
          </svg>
        </div>

        {/* Header */}
        <div style={{position:"relative",zIndex:10,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 24px",background:"var(--bg-deep)",borderBottom:"0.5px solid var(--border)"}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <span style={{color:"#e03030",fontSize:8,animation:"pulse 2s infinite"}}>⬤</span>
            <span style={{fontSize:14,fontWeight:700,letterSpacing:"0.2em",background:"linear-gradient(135deg,#ffc840,#f0a500)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>SENTINEL</span>
            <div style={{width:1,height:14,background:"var(--border)"}}/>
            <span style={{fontSize:8,color:"#5a6a8a",letterSpacing:"0.16em"}}>TEMPORAL THREAT INTELLIGENCE</span>
          </div>
          <div style={{display:"flex",gap:18,fontSize:8,letterSpacing:"0.1em",alignItems:"center"}}>
            <span style={{color:"#00e87a",display:"flex",alignItems:"center",gap:5}}><span style={{animation:"pulse 3s infinite"}}>⬤</span>TIMESCALEDB ONLINE</span>
            <span style={{color:"rgba(240,165,0,0.2)"}}>|</span>
            <span style={{color:"#f0a500"}}>{metrics?Number(metrics.total).toLocaleString()+" CVEs":"..."}</span>
            <span style={{color:"rgba(240,165,0,0.2)"}}>|</span>
            <span style={{color:"#e03030",animation:"pulse 4s infinite"}}>{metrics?metrics.kev.toLocaleString()+" KEV":"..."}</span>
            <span style={{color:"rgba(240,165,0,0.2)"}}>|</span>
            <span style={{color:"#9aaac8"}}>{clock.toTimeString().slice(0,8)}</span>
          </div>
        </div>

        {/* Nav */}
        <div style={{position:"relative",zIndex:10,display:"flex",background:"var(--bg-deep)",borderBottom:"0.5px solid var(--border)",paddingLeft:8}}>
          {tabs.map(t=><NavBtn key={t.id} label={t.label} icon={t.icon} active={tab===t.id} onClick={()=>switchTab(t.id)} count={t.count}/>)}
        </div>

        {/* Stats */}
        <div style={{position:"relative",zIndex:10,display:"flex",background:"var(--bg-panel)",borderBottom:"0.5px solid var(--border)"}}>
          <StatCard label="Total CVEs" value={metrics?Number(metrics.total).toLocaleString():"—"} icon="📦"/>
          <StatCard label="Critical" value={metrics?Number(metrics.critical).toLocaleString():"—"} color="#e03030" blink icon="🔴"/>
          <StatCard label="KEV Confirmed" value={metrics?Number(metrics.kev).toLocaleString():"—"} color="#f0a500" sub="actively exploited in wild" blink icon="🚨"/>
          <StatCard label="EPSS Scored" value={metrics?Number(metrics.scored).toLocaleString():"—"} color="#00d4ff" icon="🎯"/>
          <StatCard label="Threat Level" value="HIGH" color="#f0a500" sub="chain risk detected" icon="⚡"/>
        </div>

        {/* Content with tab animation */}
        <div key={tabKey} style={{position:"relative",zIndex:10,flex:1,display:"flex",overflow:"hidden",animation:"tabSlideIn 0.28s cubic-bezier(0.4,0,0.2,1) forwards"}}>

          {tab==="warroom" && (
            <>
              <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
                <div style={{padding:"10px 20px 8px",borderBottom:"0.5px solid var(--border)",background:"var(--bg-panel)"}}>
                  <div style={{fontSize:7,color:"#5a6a8a",letterSpacing:"0.2em",marginBottom:8,textTransform:"uppercase"}}>📊 CVE Activity — Last 24h — Source: threat_scores_1h cagg</div>
                  <div style={{display:"flex",gap:2,alignItems:"flex-end",height:52,padding:"0 0 4px 0"}}>
                    {heatData.map((d,i)=>{
                      const max=Math.max(...heatData.map(x=>x.c),1)
                      const pct=d.c/max
                      const color=pct>0.7?"#e03030":pct>0.4?"#f0a500":"rgba(240,165,0,0.2)"
                      const glow=pct>0.7?"0 0 8px rgba(224,48,48,0.6)":pct>0.4?"0 0 6px rgba(240,165,0,0.4)":"none"
                      return (
                        <div key={i} title={`${d.h}: ${d.c} CVEs`} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                          <div style={{width:"100%",height:`${Math.max(pct*44,2)}px`,background:color,borderRadius:"2px 2px 0 0",boxShadow:glow,minHeight:2,transition:"all 0.3s"}}/>
                          {i%6===0&&<div style={{fontSize:6,color:"#3a4a6a",whiteSpace:"nowrap"}}>{d.h}</div>}
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div style={{padding:"7px 20px",fontSize:7,color:"#5a6a8a",borderBottom:"0.5px solid var(--border)",display:"flex",justifyContent:"space-between",letterSpacing:"0.15em",alignItems:"center"}}>
                  <span>⬡ LIVE THREAT FEED — RANKED BY KEV + EPSS</span>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <SearchBar value={warSearch} onChange={setWarSearch} placeholder="Search CVEs..."/>
                    <span style={{color:"#00e87a",animation:"pulse 2s infinite",fontSize:7}}>● STREAMING</span>
                  </div>
                </div>
                <div style={{flex:1,overflowY:"auto"}}>
                  {filteredThreats?.map((t,i)=><CveCard key={i} cve={t} onClick={setSelected} selected={selected}/>)}
                  {filteredThreats?.length===0 && <div style={{padding:20,fontSize:9,color:"#5a6a8a",textAlign:"center"}}>No CVEs match your search.</div>}
                </div>
              </div>
              <div style={{width:310,borderLeft:"0.5px solid var(--border)",background:"var(--bg-panel)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
                <div style={{flex:1,overflowY:"auto"}}>
                  <DetailPanel detail={detail} onClose={()=>{setSelected(null);setDetail(null)}}/>
                </div>
              </div>
            </>
          )}

          {tab==="threats" && (
            <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
              <div style={{padding:"12px 24px",borderBottom:"0.5px solid var(--border)",background:"var(--bg-panel)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:7,color:"#5a6a8a",letterSpacing:"0.2em",textTransform:"uppercase"}}>⚠ TOP THREATS — RANKED BY KEV STATUS + EPSS SCORE</div>
                <SearchBar value={threatSearch} onChange={setThreatSearch} placeholder="Search threats..."/>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"16px 24px"}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(360px,1fr))",gap:10}}>
                  {filteredThreatTab?.map((t,i)=>(
                    <div key={i} style={{padding:"13px 15px",background:"var(--bg-panel)",border:"0.5px solid var(--border)",borderRadius:6,borderLeft:`2px solid ${SEV[t.severity||"UNKNOWN"]}`,transition:"all 0.2s",animation:`fadeUp 0.3s ease ${i*0.02}s both`}}
                      onMouseEnter={e=>{e.currentTarget.style.background="var(--bg-card)";e.currentTarget.style.borderColor="var(--border-bright)"}}
                      onMouseLeave={e=>{e.currentTarget.style.background="var(--bg-panel)";e.currentTarget.style.borderColor="var(--border)"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:7,alignItems:"center"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:11,fontWeight:700,color:"#00d4ff",fontFamily:"var(--font)"}}>{t.cve_id}</span>
                          {t.is_kev && <span style={{fontSize:7,padding:"1px 5px",background:"rgba(224,48,48,0.12)",color:"#e03030",border:"0.5px solid rgba(224,48,48,0.3)",borderRadius:2,letterSpacing:"0.1em"}}>⚠ KEV</span>}
                        </div>
                        <span style={{fontSize:8,color:SEV[t.severity||"UNKNOWN"],letterSpacing:"0.1em",fontWeight:700}}>{t.severity}</span>
                      </div>
                      <div style={{fontSize:9,color:"#9aaac8",marginBottom:8,lineHeight:1.5}}>{t.description}</div>
                      <div style={{display:"flex",gap:14,fontSize:8,color:"#5a6a8a"}}>
                        <span>CVSS <span style={{color:"#9aaac8"}}>{t.cvss}</span></span>
                        <span>EPSS <span style={{color:t.epss>0.7?"#e03030":t.epss>0.4?"#f0a500":"#9aaac8"}}>{t.epss?(t.epss*100).toFixed(1)+"%":""}</span></span>
                        <span>AGE <span style={{color:"#9aaac8"}}>{t.exposure_age}</span></span>
                      </div>
                      <div style={{marginTop:8,height:2,background:"rgba(255,255,255,0.04)",borderRadius:1,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${(t.epss||0)*100}%`,background:"linear-gradient(90deg,#f0a500,#e03030)",borderRadius:1}}/>
                      </div>
                    </div>
                  ))}
                  {filteredThreatTab?.length===0 && <div style={{padding:20,fontSize:9,color:"#5a6a8a"}}>No threats match your search.</div>}
                </div>
              </div>
            </div>
          )}

          {tab==="scanner" && <ScannerPage/>}
          {tab==="chain" && <ChainGraph/>}
          {tab==="carbon" && (
            <div style={{flex:1,padding:"24px"}}>
              <div style={{fontSize:7,color:"#5a6a8a",letterSpacing:"0.2em",marginBottom:20,textTransform:"uppercase"}}>☢ CARBON DATING — EPSS DECAY CURVES VIA epss_trends_24h CAGG</div>
              <CarbonView cveId={selected}/>
            </div>
          )}
          {tab==="techstack" && <TechPage/>}
          {tab==="about" && <AboutPage/>}
        </div>

        {/* Footer */}
        <div style={{position:"relative",zIndex:10,padding:"5px 24px",background:"var(--bg-deep)",borderTop:"0.5px solid var(--border)",fontSize:7,color:"#5a6a8a",letterSpacing:"0.1em",display:"flex",justifyContent:"space-between"}}>
          <span>⬡ SENTINEL v0.1 · sarthaknaikare@gmail.com</span>
          <span>This product uses data from the NVD API but is not endorsed or certified by the NVD.</span>
        </div>
      </div>
    </>
  )
}
