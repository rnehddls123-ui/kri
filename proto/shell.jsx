// shell.jsx — Gemini-only LLM + Google Maps component + UI atoms
const { useState, useEffect, useRef } = React;

// ══════════════════════════════════════════════════════════════
// Gemini AI helpers
// ══════════════════════════════════════════════════════════════

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function hasGemini() { return !!window.__apiKeys?.gemini; }

// Returns { text: string }
async function callLLM(userPrompt, systemPrompt = '', maxTokens = 1024) {
  if (!hasGemini()) throw new Error('Gemini 키가 없어요');
  const key  = window.__apiKeys.gemini;
  const body = {
    systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
  };
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  if (!res.ok) { const e = await res.json().catch(()=>{}); throw new Error(e?.error?.message || `Gemini HTTP ${res.status}`); }
  const data = await res.json();
  return { text: data.candidates[0].content.parts[0].text };
}

// Parse JSON from LLM response (handles markdown code fences)
function parseJSON(text) {
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (!m) throw new Error('No JSON found');
  return JSON.parse(m[1] || m[0]);
}

// Imagen 3 image generation via Gemini API
async function callImageGen(prompt) {
  if (!hasGemini()) throw new Error('Gemini 키가 없어요');
  const key = window.__apiKeys.gemini;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { sampleCount: 1, aspectRatio: '1:1' },
      }),
    }
  );
  if (!res.ok) { const e = await res.json().catch(()=>{}); throw new Error(e?.error?.message || `Imagen HTTP ${res.status}`); }
  const data = await res.json();
  const b64  = data.predictions?.[0]?.bytesBase64Encoded;
  if (!b64) throw new Error('Imagen returned no image data');
  const mime = data.predictions?.[0]?.mimeType || 'image/png';
  return `data:${mime};base64,${b64}`;
}

function canGenerateImage() { return hasGemini(); }
function imageProviderLabel() { return hasGemini() ? 'Imagen 3' : null; }

// ══════════════════════════════════════════════════════════════
// Itinerary builder
// ══════════════════════════════════════════════════════════════
function addMin(time, min) {
  const [h, m] = time.split(':').map(Number);
  const t = h * 60 + m + min;
  return `${String(Math.floor(t/60)%24).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;
}

function buildDayNodes(placeIds, dayIdx, inputs, PLACES) {
  const nodes = [];
  const isArrival   = dayIdx === 1;
  const isDeparture = dayIdx === 4;
  const arrAirport  = inputs.arrAirport || 'NRT';
  const depAirport  = inputs.depAirport || 'NRT';
  const arrTime     = inputs.arrTime    || '14:30';
  const depTime     = inputs.depTime    || '17:30';
  const airMinNRT = 70, airMinHND = 35;
  const airFeeNRT = 3070, airFeeHND = 520;

  let cur = inputs.wake === '느긋하게' ? '11:00' : '09:00';

  if (isArrival) {
    const airMin  = arrAirport === 'NRT' ? airMinNRT : airMinHND;
    const airFee  = arrAirport === 'NRT' ? airFeeNRT : airFeeHND;
    const airMode = arrAirport === 'NRT' ? '나리타 익스프레스' : '공항 모노레일';
    const airEnd  = addMin(arrTime, airMin + 5);
    nodes.push({ type:'transit', from:arrAirport, to:'숙소', mode:airMode, min:airMin, fee:airFee, start:arrTime, end:airEnd });
    const checkEnd = addMin(airEnd, 60);
    nodes.push({ type:'stay', title:'숙소 체크인', start:airEnd, end:checkEnd, fixed:true });
    cur = checkEnd;
  }

  for (const id of placeIds) {
    const p = PLACES[id];
    if (!p) continue;
    const walkEnd = addMin(cur, 10);
    nodes.push({ type:'transit', mode:'도보', min:10, start:cur, end:walkEnd });
    cur = addMin(walkEnd, 2);
    const stayEnd = addMin(cur, p.stay || 60);
    nodes.push({ type:'place', id, start:cur, end:stayEnd });
    cur = stayEnd;
  }

  if (isDeparture) {
    const airMin  = depAirport === 'NRT' ? airMinNRT : airMinHND;
    const airFee  = depAirport === 'NRT' ? airFeeNRT : airFeeHND;
    const airMode = depAirport === 'NRT' ? '나리타 익스프레스' : '공항 모노레일';
    const depLeave  = addMin(depTime, -(airMin + 120));
    const depArrive = addMin(depTime, -120);
    nodes.push({ type:'transit', from:'숙소', to:depAirport, mode:airMode, min:airMin, fee:airFee, start:depLeave, end:depArrive });
    nodes.push({ type:'checkin', title:`${depAirport} 공항 도착`, start:depArrive, fixed:true, note:'출발 2시간 전' });
  } else if (!isArrival) {
    nodes.push({ type:'transit', mode:'도보', min:10, start:cur, end:addMin(cur,10), to:'숙소' });
  }

  return nodes;
}

function buildItinerary(aiDays, inputs, PLACES) {
  const weekdays = ['일','월','화','수','목','금','토'];
  const baseDate  = new Date(inputs.arrDate || '2025-11-22');
  return {
    arrival:   { airport:inputs.arrAirport||'NRT', date:inputs.arrDate||'2025-11-22', time:inputs.arrTime||'14:30', weekday:weekdays[baseDate.getDay()] },
    departure: { airport:inputs.depAirport||'NRT', date:inputs.depDate||'2025-11-25', time:inputs.depTime||'17:30', weekday:weekdays[new Date(inputs.depDate||'2025-11-25').getDay()] },
    lodging: inputs.lodging || '도쿄',
    days: aiDays.map((d, i) => {
      const dayDate = new Date(baseDate);
      dayDate.setDate(baseDate.getDate() + i);
      const mm = String(dayDate.getMonth()+1).padStart(2,'0');
      const dd = String(dayDate.getDate()).padStart(2,'0');
      const validIds = (d.placeIds || []).filter(id => PLACES[id]);
      return {
        idx:     i+1,
        date:    `${Number(mm)}/${Number(dd)}`,
        weekday: weekdays[dayDate.getDay()],
        area:    d.area    || '도쿄',
        title:   d.title   || '오늘의 도쿄',
        desc:    d.desc    || '',
        fatigue: d.fatigue || (4 + i * 0.5),
        budget:  d.budget  || 12000,
        walking: d.walking || 40,
        nodes:   buildDayNodes(validIds, i+1, inputs, PLACES),
      };
    }),
  };
}

Object.assign(window, { callLLM, parseJSON, callImageGen, canGenerateImage, imageProviderLabel, sleep, hasGemini, buildItinerary, addMin, buildDayNodes });

// ══════════════════════════════════════════════════════════════
// Google Maps component
// ══════════════════════════════════════════════════════════════

const MAPS_STYLE = [
  { featureType:'all',           elementType:'labels.icon',        stylers:[{visibility:'off'}] },
  { featureType:'water',         elementType:'geometry',           stylers:[{color:'#cfe8f7'}] },
  { featureType:'landscape',     elementType:'geometry',           stylers:[{color:'#f5f5f5'}] },
  { featureType:'road.highway',  elementType:'geometry',           stylers:[{color:'#e2e2e2'}] },
  { featureType:'road.arterial', elementType:'geometry',           stylers:[{color:'#ebebeb'}] },
  { featureType:'road.local',    elementType:'geometry.fill',      stylers:[{color:'#ffffff'}] },
  { featureType:'poi',           elementType:'geometry',           stylers:[{color:'#eeeeee'}] },
  { featureType:'poi.park',      elementType:'geometry',           stylers:[{color:'#d4edda'}] },
  { featureType:'transit',       elementType:'geometry',           stylers:[{color:'#e5e5e5'}] },
  { featureType:'all',           elementType:'labels.text.fill',   stylers:[{color:'#555555'}] },
  { featureType:'all',           elementType:'labels.text.stroke', stylers:[{color:'#ffffff'}] },
];

function GoogleMap({ pins = [], onPin, height = '100%' }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef([]);
  const [ready, setReady] = useState(!!window.__mapsReady);

  // Poll until Maps API is loaded
  useEffect(() => {
    if (ready) return;
    const id = setInterval(() => {
      if (window.__mapsReady) { setReady(true); clearInterval(id); }
    }, 300);
    return () => clearInterval(id);
  }, [ready]);

  // Init map once
  useEffect(() => {
    if (!ready || !containerRef.current || mapRef.current) return;
    mapRef.current = new window.google.maps.Map(containerRef.current, {
      center: { lat: 35.685, lng: 139.755 },
      zoom: 12,
      disableDefaultUI: true,
      gestureHandling: 'none',
      styles: MAPS_STYLE,
    });
  }, [ready]);

  // Update markers when pins change
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const google = window.google;

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let hasPins = false;

    pins.forEach((pin, i) => {
      if (pin.lat == null || pin.lng == null) return;
      hasPins = true;
      bounds.extend({ lat: pin.lat, lng: pin.lng });

      const marker = new google.maps.Marker({
        position: { lat: pin.lat, lng: pin.lng },
        map: mapRef.current,
        label: {
          text: pin.label || String(i + 1),
          color: '#ffffff',
          fontWeight: '700',
          fontSize: '11px',
          fontFamily: 'monospace',
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 13,
          fillColor: '#0066FF',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2.5,
        },
      });

      if (onPin) marker.addListener('click', () => onPin(pin, i));
      markersRef.current.push(marker);
    });

    if (hasPins) {
      mapRef.current.fitBounds(bounds, { top:36, right:36, bottom:36, left:36 });
      // Don't over-zoom on single marker
      google.maps.event.addListenerOnce(mapRef.current, 'bounds_changed', () => {
        if (mapRef.current.getZoom() > 15) mapRef.current.setZoom(15);
      });
    }
  }, [ready, pins.map(p => p.id).join(',')]);

  if (!window.__apiKeys?.maps) {
    return (
      <div style={{ width:'100%', height, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#f0f4f8', gap:6 }}>
        <span style={{ fontSize:28 }}>🗺️</span>
        <span style={{ fontSize:12, fontWeight:700, color:'#888' }}>Google Maps 키 미설정</span>
        <span style={{ fontSize:11, color:'#aaa' }}>⚙ API 설정에서 입력하세요</span>
      </div>
    );
  }

  if (!ready) {
    return (
      <div style={{ width:'100%', height, display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f4f8' }}>
        <span style={{ fontSize:12, fontWeight:700, color:'#aaa' }}>지도 로딩 중…</span>
      </div>
    );
  }

  return <div ref={containerRef} style={{ width:'100%', height }} />;
}

// ══════════════════════════════════════════════════════════════
// UI Components
// ══════════════════════════════════════════════════════════════
function PhoneShell({ children, dark=false, footer, scroll=true, overlay }) {
  return (
    <IOSDevice width={390} height={820} dark={dark}>
      <div className={"ts-screen" + (dark ? " ts-screen--ink" : "")}>
        <div style={{ height:48, flexShrink:0 }} />
        <div style={{ flex:1, minHeight:0, overflowY:scroll?"auto":"hidden", overflowX:"hidden", display:"flex", flexDirection:"column" }}>
          {children}
        </div>
        {footer && (
          <div style={{ flexShrink:0, padding:"12px 20px 18px", borderTop: dark?"1px solid rgba(255,255,255,0.06)":"1px solid var(--w-line-alternative)", background: dark?"var(--w-cool-15)":"var(--w-bg-normal)" }}>
            {footer}
          </div>
        )}
        {overlay}
      </div>
    </IOSDevice>
  );
}

function ProgressBar({ step, total, onBack }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 20px 14px", flexShrink:0 }}>
      <button onClick={onBack} style={{ width:30, height:30, border:0, padding:0, background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", marginLeft:-6 }}>
        <img src="ds/icons/chevron-left.svg" style={{ width:22, height:22, filter:"brightness(0)", opacity:0.78 }} />
      </button>
      <div style={{ flex:1, height:3, borderRadius:9999, background:"var(--w-fill-normal)", overflow:"hidden" }}>
        <div style={{ height:"100%", borderRadius:9999, background:"var(--w-cool-22)", width:((step/total)*100)+"%", transition:"width 320ms cubic-bezier(.4,0,.2,1)" }} />
      </div>
      <div style={{ fontSize:12, fontWeight:700, letterSpacing:"0.04em", color:"var(--w-label-alternative)", fontFamily:"var(--w-font-mono)" }}>{step} / {total}</div>
    </div>
  );
}

function PageBar({ onBack, title, right, dark }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px 12px", flexShrink:0 }}>
      <button onClick={onBack} style={{ width:36, height:36, border:0, padding:0, background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <img src="ds/icons/chevron-left.svg" style={{ width:22, height:22, filter:dark?"brightness(0) invert(1)":"brightness(0)", opacity:0.78 }} />
      </button>
      <div style={{ flex:1, textAlign:"center", fontSize:14, fontWeight:700, color:dark?"#fff":"var(--w-label-normal)" }}>{title}</div>
      <div style={{ width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center" }}>{right}</div>
    </div>
  );
}

function Cta({ children, onClick, variant="primary", disabled, full=true }) {
  const s = {
    primary:{ background:"var(--w-cool-22)", color:"#fff" },
    accent: { background:"var(--w-accent-redorange)", color:"#fff" },
    ghost:  { background:"var(--w-fill-normal)", color:"var(--w-label-normal)" },
  };
  return (
    <button onClick={disabled?undefined:onClick} disabled={disabled}
      style={{ ...s[variant], opacity:disabled?0.4:1, cursor:disabled?"not-allowed":"pointer", border:0, borderRadius:14, padding:"16px 22px", width:full?"100%":undefined, fontFamily:"var(--w-font-sans)", fontWeight:700, fontSize:16, letterSpacing:"-0.005em", display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"transform 100ms" }}
      onMouseDown={e=>!disabled&&(e.currentTarget.style.transform="scale(0.985)")}
      onMouseUp={e=>(e.currentTarget.style.transform="")}
      onMouseLeave={e=>(e.currentTarget.style.transform="")}>
      {children}
    </button>
  );
}

function PickCard({ title, desc, active, onClick, big=true }) {
  return (
    <button onClick={onClick} style={{ all:"unset", boxSizing:"border-box", display:"flex", flexDirection:"column", gap:big?4:6, padding:big?"16px 18px":"14px 14px", background:active?"var(--w-blue-99)":"#fff", border:"1px solid "+(active?"var(--w-primary)":"var(--w-line-normal)"), boxShadow:active?"0 0 0 1px var(--w-primary) inset":"none", borderRadius:14, cursor:"pointer", position:"relative", transition:"background 150ms, border-color 150ms" }}>
      <div style={{ fontSize:big?16:14, fontWeight:700, letterSpacing:"-0.005em", color:"var(--w-label-normal)" }}>{title}</div>
      {desc && <div style={{ fontSize:big?13:12, fontWeight:500, color:"var(--w-label-alternative)", lineHeight:1.5 }}>{desc}</div>}
      {active && <div style={{ position:"absolute", top:14, right:14, width:20, height:20, borderRadius:9999, background:"var(--w-primary)", display:"flex", alignItems:"center", justifyContent:"center" }}><img src="ds/icons/check.svg" style={{ width:12, height:12, filter:"brightness(0) invert(1)" }} /></div>}
    </button>
  );
}

function Chip({ children, active, onClick, tone="neutral" }) {
  const t = { neutral:{bg:"var(--w-fill-normal)",color:"var(--w-label-normal)"}, brand:{bg:"rgba(0,102,255,0.10)",color:"var(--w-primary)"}, accent:{bg:"rgba(255,94,0,0.10)",color:"var(--w-accent-redorange)"}, ink:{bg:"var(--w-cool-22)",color:"#fff"} };
  const st = t[tone] || t.neutral;
  return <span onClick={onClick} style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"6px 10px", borderRadius:9999, fontSize:12, fontWeight:700, letterSpacing:"0.012em", background:active?"var(--w-cool-22)":st.bg, color:active?"#fff":st.color, cursor:onClick?"pointer":"default", whiteSpace:"nowrap", transition:"background 120ms" }}>{children}</span>;
}

// CharacterOrb — shows real Imagen 3 photo if available, else gradient orb
function CharacterOrb({ hi, mid, lo, size=120, label="AI 생성", imageUrl }) {
  if (imageUrl) {
    return (
      <div style={{ width:size, height:size, borderRadius:size*0.22, overflow:"hidden", position:"relative", boxShadow:`0 ${size*0.04}px ${size*0.14}px rgba(0,0,0,0.22)` }}>
        <img src={imageUrl} alt="AI Character" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
        {label && <div style={{ position:"absolute", left:10, bottom:10, fontSize:9, fontWeight:700, letterSpacing:"0.06em", color:"rgba(0,0,0,0.42)", textTransform:"uppercase", background:"rgba(255,255,255,0.72)", padding:"3px 6px", borderRadius:4 }}>{label}</div>}
      </div>
    );
  }
  return (
    <div style={{ width:size, height:size, borderRadius:size*0.22, background:`radial-gradient(circle at 32% 28%, ${hi} 0%, ${mid} 45%, ${lo} 100%)`, position:"relative", overflow:"hidden", boxShadow:`inset 0 -${size*0.07}px ${size*0.18}px rgba(0,0,0,0.20), inset 0 ${size*0.04}px ${size*0.10}px rgba(255,255,255,0.32)` }}>
      <div style={{ position:"absolute", top:"14%", left:"22%", width:"22%", height:"22%", borderRadius:"50%", background:"radial-gradient(circle, rgba(255,255,255,0.7), rgba(255,255,255,0))", filter:"blur(2px)" }} />
      {label && <div style={{ position:"absolute", left:10, bottom:10, fontSize:9, fontWeight:700, letterSpacing:"0.06em", color:"rgba(0,0,0,0.42)", textTransform:"uppercase", background:"rgba(255,255,255,0.55)", padding:"3px 6px", borderRadius:4 }}>{label}</div>}
    </div>
  );
}

function Eyebrow({ children, tone="default" }) {
  const c = tone==="accent"?"var(--w-accent-redorange)":tone==="brand"?"var(--w-primary)":"var(--w-label-alternative)";
  return <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:c }}>{children}</div>;
}
function Heading({ children, display, dark }) {
  return <h1 style={{ fontFamily:display?"var(--w-font-display)":"var(--w-font-sans)", fontSize:display?28:24, fontWeight:700, letterSpacing:display?"-0.025em":"-0.018em", lineHeight:1.25, color:dark?"#fff":"var(--w-label-normal)", margin:0, textWrap:"balance" }}>{children}</h1>;
}
function Sub({ children, dark }) {
  return <p style={{ fontSize:14, fontWeight:500, lineHeight:1.55, color:dark?"rgba(255,255,255,0.62)":"var(--w-label-alternative)", margin:0 }}>{children}</p>;
}

// Kept for input.jsx lodging card district detection
const TOKYO_DISTRICTS = [
  { name:"시모키타자와" }, { name:"신주쿠" },
  { name:"하라주쿠" },    { name:"오모테산도" },
  { name:"시부야" },      { name:"다이칸야마" },
  { name:"롯폰기" },      { name:"긴자" },
  { name:"마루노우치" },  { name:"츠키지" },
  { name:"아사쿠사" },    { name:"우에노" },
  { name:"야네센" },      { name:"아키하바라" },
  { name:"이케부쿠로" },
];

Object.assign(window, { PhoneShell, ProgressBar, PageBar, Cta, PickCard, Chip, CharacterOrb, GoogleMap, TOKYO_DISTRICTS, Eyebrow, Heading, Sub });
