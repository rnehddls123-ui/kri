// Landing — home screen + inline API settings
function Landing({ onStart }) {
  const [view, setView] = useState(() =>
    (!window.__apiKeys?.gemini && !window.__apiKeys?.maps) ? 'api' : 'home'
  );

  if (view === 'api') return <ApiSettingsView onBack={() => setView('home')} onStart={onStart} />;
  return <HomeView onStart={onStart} onSettings={() => setView('api')} />;
}

function HomeView({ onStart, onSettings }) {
  const geminiOk = !!window.__apiKeys?.gemini;
  const mapsOk   = !!window.__apiKeys?.maps;

  const cats = ['음식·맛집','카페·디저트','쇼핑·편집샵','플리마켓·빈티지','예술·전시','문화·역사·신사','서브컬처','자연·공원','야경·뷰','현지인 골목'];

  return (
    <PhoneShell scroll={false}>
      <div style={{ flex:1, display:'flex', flexDirection:'column', background:'var(--w-bg-normal)' }}>

        {/* Header row */}
        <div style={{ padding:'14px 20px 0', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <span style={{ fontFamily:'var(--w-font-mono)', fontSize:10, fontWeight:700, letterSpacing:'0.08em', color:'var(--w-label-assistive)', textTransform:'uppercase' }}>
            TOKYO TRAVEL ENGINE
          </span>
          <span style={{ fontFamily:'var(--w-font-mono)', fontSize:10, fontWeight:700, color:'var(--w-label-disable)' }}>
            v1.0
          </span>
        </div>

        {/* Hero text */}
        <div style={{ padding:'22px 22px 0', flexShrink:0 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:'var(--w-label-alternative)', marginBottom:10 }}>
            도시 감정 큐레이터
          </div>
          <h1 style={{
            fontFamily:'var(--w-font-sans)', fontWeight:700,
            fontSize:28, lineHeight:1.22, letterSpacing:'-0.024em',
            margin:0, color:'var(--w-label-normal)',
          }}>
            당신의 도쿄는<br/>어떤 표정인가요?
          </h1>
        </div>

        {/* Stats grid */}
        <div style={{ padding:'18px 22px 0', flexShrink:0 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            {[
              { v:'12', l:'개 질문' },
              { v:'3~5', l:'일 동선' },
              { v:'AI', l:'맞춤 큐레이션' },
            ].map(({ v, l }) => (
              <div key={l} style={{
                background:'var(--w-bg-elevated)', border:'1px solid var(--w-line-alternative)',
                borderRadius:12, padding:'14px 12px',
                display:'flex', flexDirection:'column', alignItems:'center', gap:4,
              }}>
                <span style={{ fontFamily:'var(--w-font-mono)', fontSize:20, fontWeight:700, letterSpacing:'-0.01em', color:'var(--w-label-normal)', lineHeight:1 }}>{v}</span>
                <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--w-label-assistive)' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category strip */}
        <div style={{ padding:'16px 0 0', flexShrink:0 }}>
          <div style={{ padding:'0 22px', marginBottom:8, fontSize:10, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--w-label-assistive)' }}>
            선택 가능한 취향
          </div>
          <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch', paddingBottom:2 }}>
            <div style={{ display:'flex', gap:6, padding:'0 22px', width:'max-content' }}>
              {cats.map(c => <CategoryTag key={c} cat={c} size='sm' />)}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ flex:1 }} />

        {/* CTA area */}
        <div style={{ padding:'20px 22px 24px', flexShrink:0 }}>
          <p style={{ fontSize:13, fontWeight:500, lineHeight:1.6, color:'var(--w-label-alternative)', margin:'0 0 16px', textAlign:'center' }}>
            12개의 가벼운 질문이면,<br/>당신만의 도쿄 캐릭터와 동선을 빚어드려요.
          </p>
          <Cta onClick={onStart}>
            내 도쿄 시작하기
            <img src="ds/icons/arrow-right.svg" style={{ width:18, height:18, filter:'brightness(0) invert(1)' }} />
          </Cta>
          <div style={{ height:10 }} />
          {/* API status row */}
          <button onClick={onSettings} style={{
            all:'unset', cursor:'pointer', width:'100%',
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'10px 14px', borderRadius:12,
            background:'var(--w-bg-elevated)', border:'1px solid var(--w-line-alternative)',
            boxSizing:'border-box',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:13 }}>⚙</span>
              <span style={{ fontSize:11, fontWeight:700, color:'var(--w-label-alternative)' }}>API 설정</span>
            </div>
            <div style={{ display:'flex', gap:5 }}>
              <span style={{ fontSize:9, fontWeight:700, padding:'3px 7px', borderRadius:4, background:geminiOk?'rgba(16,185,129,0.10)':'var(--w-fill-normal)', color:geminiOk?'#065F46':'var(--w-label-assistive)' }}>
                Gemini {geminiOk?'✓':'미입력'}
              </span>
              <span style={{ fontSize:9, fontWeight:700, padding:'3px 7px', borderRadius:4, background:mapsOk?'rgba(16,185,129,0.10)':'var(--w-fill-normal)', color:mapsOk?'#065F46':'var(--w-label-assistive)' }}>
                Maps {mapsOk?'✓':'미입력'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </PhoneShell>
  );
}

// ── API settings screen ───────────────────────────────────────
function ApiSettingsView({ onBack, onStart }) {
  const [gemini, setGemini] = useState(window.__apiKeys?.gemini || '');
  const [maps,   setMaps]   = useState(window.__apiKeys?.maps   || '');
  const [saved,  setSaved]  = useState(false);

  function save() {
    window.__saveApiKeys && window.__saveApiKeys(gemini.trim(), maps.trim());
    setSaved(true);
    setTimeout(() => { setSaved(false); onBack(); }, 1200);
  }

  const geminiOk = gemini.trim().length > 6;
  const mapsOk   = maps.trim().length > 6;

  return (
    <PhoneShell
      footer={
        <Cta onClick={save} disabled={!geminiOk}>
          {saved ? '✓ 저장됨' : '저장하기'}
        </Cta>
      }
    >
      <div style={{ padding:'8px 8px 0' }}>
        <button onClick={onBack}
          style={{ all:'unset', cursor:'pointer', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <img src="ds/icons/chevron-left.svg" style={{ width:22, height:22, filter:'brightness(0)', opacity:0.7 }} />
        </button>
      </div>

      <div style={{ padding:'4px 24px 24px' }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:'var(--w-label-alternative)', marginBottom:8 }}>연동 설정</div>
        <h1 style={{ fontFamily:'var(--w-font-sans)', fontSize:24, fontWeight:700, letterSpacing:'-0.018em', lineHeight:1.25, color:'var(--w-label-normal)', margin:0 }}>
          AI + 지도<br/>연결해요
        </h1>
        <p style={{ fontSize:13, fontWeight:500, lineHeight:1.6, color:'var(--w-label-alternative)', margin:'8px 0 24px' }}>
          Gemini 하나로 캐릭터·일정·이미지가 전부 생성돼요.
        </p>

        {/* Gemini */}
        <div style={{ marginBottom:6, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', color:'var(--w-label-alternative)' }}>
            Gemini API Key
          </span>
          {geminiOk && <span style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:4, background:'rgba(16,185,129,0.10)', color:'#065F46' }}>✓ 입력됨</span>}
        </div>
        <input type="password"
          value={gemini}
          onChange={e => setGemini(e.target.value)}
          placeholder="AIzaSy…"
          style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:'1px solid '+(geminiOk?'rgba(16,185,129,0.4)':'var(--w-line-normal)'), fontFamily:'var(--w-font-mono)', fontSize:13, color:'var(--w-label-normal)', background:'#fff', outline:'none', marginBottom:6 }}
        />
        <p style={{ fontSize:11, color:'var(--w-label-assistive)', margin:'0 0 20px', lineHeight:1.5 }}>
          ✅ 캐릭터·일정·이미지 생성<br/>
          <a href="https://aistudio.google.com/apikey" target="_blank" style={{ color:'var(--w-primary)' }}>Google AI Studio</a>에서 무료 발급
        </p>

        {/* Maps */}
        <div style={{ marginBottom:6, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', color:'var(--w-label-alternative)' }}>
            Google Maps API Key
          </span>
          {mapsOk && <span style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:4, background:'rgba(16,185,129,0.10)', color:'#065F46' }}>✓ 입력됨</span>}
        </div>
        <input type="password"
          value={maps}
          onChange={e => setMaps(e.target.value)}
          placeholder="AIzaSy…"
          style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:'1px solid '+(mapsOk?'rgba(16,185,129,0.4)':'var(--w-line-normal)'), fontFamily:'var(--w-font-mono)', fontSize:13, color:'var(--w-label-normal)', background:'#fff', outline:'none', marginBottom:6 }}
        />
        <p style={{ fontSize:11, color:'var(--w-label-assistive)', margin:'0 0 20px', lineHeight:1.5 }}>
          ✅ 지도 동선 표시 (Maps JS API + Places API)<br/>
          <a href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com" target="_blank" style={{ color:'var(--w-primary)' }}>Google Cloud Console</a>에서 발급
        </p>

        <div style={{ padding:'12px 14px', borderRadius:12, background:'var(--w-bg-alternative)', fontSize:11, color:'var(--w-label-alternative)', lineHeight:1.6 }}>
          🔒 로컬스토리지에만 저장 · 외부 서버 전송 없음
        </div>
      </div>
    </PhoneShell>
  );
}

Object.assign(window, { Landing });
