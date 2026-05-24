// shell.jsx — atoms + multi-provider LLM helpers
const { useState, useEffect, useRef, useMemo } = React;

// ══════════════════════════════════════════════════════════════
// Multi-provider LLM helpers
// Supports: Gemini (AIza…) · Anthropic (sk-ant-…) · OpenAI (sk-…)
// ══════════════════════════════════════════════════════════════

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function getProvider() {
  if (window.__apiKeys?.gemini)    return 'gemini';
  if (window.__apiKeys?.anthropic) return 'anthropic';
  if (window.__apiKeys?.openai)    return 'openai';
  return null;
}

// Returns { text: string } normalized across all providers
async function callLLM(userPrompt, systemPrompt = '', maxTokens = 1024) {
  const provider = getProvider();
  if (!provider) throw new Error('No AI key configured');

  if (provider === 'gemini') {
    const key = window.__apiKeys.gemini;
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

  if (provider === 'anthropic') {
    const key = window.__apiKeys.anthropic;
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: maxTokens,
        system: systemPrompt || undefined,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });
    if (!res.ok) { const e = await res.json().catch(()=>{}); throw new Error(e?.error?.message || `Claude HTTP ${res.status}`); }
    const data = await res.json();
    return { text: data.content[0].text };
  }

  if (provider === 'openai') {
    const key = window.__apiKeys.openai;
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: userPrompt });
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: maxTokens, messages }),
    });
    if (!res.ok) { const e = await res.json().catch(()=>{}); throw new Error(e?.error?.message || `OpenAI HTTP ${res.status}`); }
    const data = await res.json();
    return { text: data.choices[0].message.content };
  }

  throw new Error('Unknown provider');
}

// Parse first JSON object/array from LLM text (LLMs sometimes wrap in markdown)
function parseJSON(text) {
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (!m) throw new Error('No JSON found');
  return JSON.parse(m[1] || m[0]);
}

// ── Image generation ─────────────────────────────────────────
// Tries Gemini Imagen 3 first, then DALL-E 3 (OpenAI) as fallback.
// Returns a URL (data: for Imagen, https: for DALL-E).

async function callGeminiImage(prompt) {
  const key = window.__apiKeys?.gemini;
  if (!key) throw new Error('No Gemini key for image generation');
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

async function callDallE(prompt) {
  const key = window.__apiKeys?.openai;
  if (!key) throw new Error('No OpenAI key for image generation');
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ model: 'dall-e-3', prompt, size: '1024x1024', quality: 'standard', n: 1 }),
  });
  if (!res.ok) { const e = await res.json().catch(()=>{}); throw new Error(e?.error?.message || `DALL-E HTTP ${res.status}`); }
  const data = await res.json();
  return data.data[0].url;
}

// Universal image generator — Gemini Imagen 3 preferred, DALL-E 3 fallback
async function callImageGen(prompt) {
  if (window.__apiKeys?.gemini)  return callGeminiImage(prompt);
  if (window.__apiKeys?.openai)  return callDallE(prompt);
  throw new Error('No image generation key (need Gemini or OpenAI)');
}

function canGenerateImage() {
  return !!(window.__apiKeys?.gemini || window.__apiKeys?.openai);
}

function imageProviderLabel() {
  if (window.__apiKeys?.gemini) return 'Imagen 3';
  if (window.__apiKeys?.openai) return 'DALL-E 3';
  return null;
}

// ══════════════════════════════════════════════════════════════
// Itinerary builder — builds node list from place IDs
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
  const airMinNRT   = 70;  const airMinHND = 35;
  const airFeeNRT   = 3070; const airFeeHND = 520;

  let cur = '09:00';
  if (inputs.wake === '느긋하게') cur = '11:00';

  if (isArrival) {
    const airMin = arrAirport === 'NRT' ? airMinNRT : airMinHND;
    const airFee = arrAirport === 'NRT' ? airFeeNRT : airFeeHND;
    const airMode = arrAirport === 'NRT' ? '나리타 익스프레스' : '공항 모노레일';
    const airEnd = addMin(arrTime, airMin + 5);
    nodes.push({ type:'transit', from:`${arrAirport}`, to:'숙소', mode:airMode, min:airMin, fee:airFee, start:arrTime, end:airEnd });
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
    const airMin = depAirport === 'NRT' ? airMinNRT : airMinHND;
    const airFee = depAirport === 'NRT' ? airFeeNRT : airFeeHND;
    const airMode = depAirport === 'NRT' ? '나리타 익스프레스' : '공항 모노레일';
    const depLeave = addMin(depTime, -(airMin + 120));
    const depArrive = addMin(depTime, -120);
    nodes.push({ type:'transit', from:'숙소', to:`${depAirport}`, mode:airMode, min:airMin, fee:airFee, start:depLeave, end:depArrive });
    nodes.push({ type:'checkin', title:`${depAirport} 공항 도착`, start:depArrive, fixed:true, note:'출발 2시간 전' });
  } else if (!isArrival) {
    nodes.push({ type:'transit', mode:'도보', min:10, start:cur, end:addMin(cur, 10), to:'숙소' });
  }

  return nodes;
}

// Build a full ITINERARY object from LLM day data + user inputs
function buildItinerary(aiDays, inputs, PLACES) {
  const weekdays = ['일','월','화','수','목','금','토'];
  const baseDate  = new Date(inputs.arrDate || '2025-11-22');

  return {
    arrival:   { airport: inputs.arrAirport||'NRT', date: inputs.arrDate||'2025-11-22', time: inputs.arrTime||'14:30', weekday: weekdays[baseDate.getDay()] },
    departure: { airport: inputs.depAirport||'NRT', date: inputs.depDate||'2025-11-25', time: inputs.depTime||'17:30', weekday: weekdays[new Date(inputs.depDate||'2025-11-25').getDay()] },
    lodging: inputs.lodging || '도쿄',
    days: aiDays.map((d, i) => {
      const dayDate = new Date(baseDate);
      dayDate.setDate(baseDate.getDate() + i);
      const mm = String(dayDate.getMonth()+1).padStart(2,'0');
      const dd = String(dayDate.getDate()).padStart(2,'0');
      const validIds = (d.placeIds || []).filter(id => PLACES[id]);
      return {
        idx:     i + 1,
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

Object.assign(window, { callLLM, parseJSON, callDallE, callGeminiImage, callImageGen, canGenerateImage, imageProviderLabel, sleep, getProvider, buildItinerary, addMin, buildDayNodes });

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

// CharacterOrb — shows real DALL-E image if available, else gradient
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

const TOKYO_DISTRICTS = [
  { name:"시모키타자와", x:0.18, y:0.45 }, { name:"신주쿠", x:0.24, y:0.42 },
  { name:"하라주쿠", x:0.28, y:0.52 },    { name:"오모테산도", x:0.32, y:0.55 },
  { name:"시부야", x:0.27, y:0.58 },      { name:"다이칸야마", x:0.32, y:0.62 },
  { name:"롯폰기", x:0.42, y:0.58 },      { name:"긴자", x:0.62, y:0.58 },
  { name:"마루노우치", x:0.55, y:0.55 },  { name:"츠키지", x:0.58, y:0.71 },
  { name:"아사쿠사", x:0.62, y:0.38 },    { name:"우에노", x:0.46, y:0.64 },
  { name:"야네센", x:0.47, y:0.58 },      { name:"아키하바라", x:0.52, y:0.58 },
  { name:"이케부쿠로", x:0.20, y:0.32 },
];

function TokyoMap({ pins=[], path=[], highlight, onPin, height="100%" }) {
  const W=280, H=200;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height, display:"block" }}>
      <g stroke="#dadce0" strokeWidth="1.2" fill="none" opacity="0.7">
        <path d="M0 80 Q 80 90, 140 78 T 280 86" /><path d="M0 120 Q 90 110, 160 130 T 280 124" />
        <path d="M40 0 Q 60 80, 90 130 T 110 200" /><path d="M180 0 Q 170 70, 200 130 T 220 200" />
      </g>
      <path d="M205 0 Q 220 60, 200 100 T 230 200" stroke="#cfe1f5" strokeWidth="6" fill="none" opacity="0.65" />
      <ellipse cx="140" cy="100" rx="80" ry="58" stroke="#c8e3b8" strokeWidth="2" fill="none" opacity="0.55" strokeDasharray="3,3"/>
      {TOKYO_DISTRICTS.map(d => {
        const x=d.x*W, y=d.y*H, isHi=highlight===d.name;
        return (
          <g key={d.name} opacity={isHi?1:0.5}>
            <circle cx={x} cy={y} r={isHi?4:2.5} fill={isHi?"var(--w-primary)":"#9aa0a6"} />
            <text x={x+5} y={y+2.5} fontSize="6.5" fontWeight="700" fill={isHi?"var(--w-primary)":"#5f6368"} fontFamily="var(--w-font-sans)">{d.name}</text>
          </g>
        );
      })}
      {path.length>1 && <polyline fill="none" stroke="var(--w-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={path.map(p=>(p.x*W)+","+(p.y*H)).join(" ")} />}
      {pins.map((p,i) => {
        const x=p.x*W, y=p.y*H;
        return (
          <g key={p.id+i} onClick={onPin?()=>onPin(p,i):undefined} style={{ cursor:onPin?"pointer":"default" }}>
            <circle cx={x} cy={y} r="9" fill="#fff" stroke="var(--w-primary)" strokeWidth="2.5" />
            <text x={x} y={y+3.2} fontSize="9" fontWeight="700" textAnchor="middle" fill="var(--w-primary)" fontFamily="var(--w-font-sans)">{p.label}</text>
          </g>
        );
      })}
    </svg>
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

Object.assign(window, { PhoneShell, ProgressBar, PageBar, Cta, PickCard, Chip, CharacterOrb, TokyoMap, TOKYO_DISTRICTS, Eyebrow, Heading, Sub });
