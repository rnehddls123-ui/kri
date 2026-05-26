// Landing — home screen + inline API settings
function Landing({ onStart }) {
  const [view, setView] = useState(() =>
    (!window.__apiKeys?.gemini && !window.__apiKeys?.maps) ? 'api' : 'home'
  );

  if (view === 'api') return <ApiSettingsView onBack={() => setView('home')} onStart={onStart} />;
  return <HomeView onStart={onStart} onSettings={() => setView('api')} />;
}

// ── Home screen ───────────────────────────────────────────────
function HomeView({ onStart, onSettings }) {
  const geminiOk = !!window.__apiKeys?.gemini;
  const mapsOk   = !!window.__apiKeys?.maps;

  return (
    <PhoneShell scroll={false}>
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        position: "relative", overflow: "hidden",
        background: "linear-gradient(168deg, #FFF1E2 0%, #FFFBF5 50%, #FFFFFF 100%)",
      }}>
        {/* Decorative orbs */}
        <div style={{ position: "absolute", top: 20, right: -30 }}>
          <CharacterOrb hi="#ffe5a8" mid="#ff7a3a" lo="#8a2400" size={130} label={null} />
        </div>
        <div style={{ position: "absolute", top: 160, left: -32 }}>
          <CharacterOrb hi="#dccfff" mid="#9a7df0" lo="#4226a8" size={82} label={null} />
        </div>
        <div style={{ position: "absolute", top: 240, right: 56 }}>
          <CharacterOrb hi="#bcefe0" mid="#3fc6a6" lo="#0e6f5d" size={56} label={null} />
        </div>
        <div style={{ position: "absolute", top: 320, left: 80 }}>
          <CharacterOrb hi="#ffd6e8" mid="#f06aa2" lo="#7a1454" size={46} label={null} />
        </div>

        {/* Bottom-anchored content */}
        <div style={{
          marginTop: "auto", padding: "28px 28px 28px",
          position: "relative", zIndex: 2,
          background: "linear-gradient(180deg, transparent 0%, #FFFBF5 28%, #FFFFFF 76%)",
        }}>
          <Eyebrow tone="accent">도시 감정 큐레이터</Eyebrow>
          <div style={{ height: 10 }} />
          <h1 style={{
            fontFamily: "var(--w-font-display)", fontWeight: 700,
            fontSize: 30, lineHeight: 1.18, letterSpacing: "-0.028em",
            margin: 0, color: "var(--w-label-normal)", textWrap: "balance",
          }}>
            당신의 도쿄는<br/>어떤 표정인가요?
          </h1>
          <div style={{ height: 12 }} />
          <Sub>
            12개의 가벼운 질문이면,<br/>
            당신만의 도쿄 캐릭터와<br/>
            3박 4일 동선을 빚어드려요.
          </Sub>
          <div style={{ height: 22 }} />
          <Cta onClick={onStart}>
            내 도쿄 시작하기
            <img src="ds/icons/arrow-right.svg"
                 style={{ width: 18, height: 18, filter: "brightness(0) invert(1)" }} />
          </Cta>
          <div style={{ height: 12 }} />

          {/* API status / settings link */}
          <button onClick={onSettings} style={{
            all: "unset", cursor: "pointer", width: "100%",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 14px", borderRadius: 12,
            background: "var(--w-bg-alternative)",
            border: "1px solid var(--w-line-alternative)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>⚙</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--w-label-alternative)" }}>
                API 설정
              </span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "3px 7px", borderRadius: 5,
                background: geminiOk ? "rgba(0,191,64,0.12)" : "var(--w-fill-normal)",
                color: geminiOk ? "#00BF40" : "var(--w-label-assistive)",
              }}>Gemini {geminiOk ? "✓" : "미입력"}</span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "3px 7px", borderRadius: 5,
                background: mapsOk ? "rgba(0,191,64,0.12)" : "var(--w-fill-normal)",
                color: mapsOk ? "#00BF40" : "var(--w-label-assistive)",
              }}>Maps {mapsOk ? "✓" : "미입력"}</span>
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
          {saved ? "✓ 저장됨" : "저장하기"}
        </Cta>
      }
    >
      {/* Back */}
      <div style={{ padding: "8px 8px 0" }}>
        <button onClick={onBack}
          style={{ all:"unset", cursor:"pointer", width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <img src="ds/icons/chevron-left.svg" style={{ width:22, height:22, filter:"brightness(0)", opacity:0.7 }} />
        </button>
      </div>

      <div style={{ padding: "4px 24px 24px" }}>
        <Eyebrow>연동 설정</Eyebrow>
        <div style={{ height: 8 }} />
        <Heading>{"AI + 지도\n연결해요"}</Heading>
        <div style={{ height: 8 }} />
        <Sub>Gemini 하나로 캐릭터·일정·이미지가 전부 생성돼요. 지도는 Google Maps 키가 필요해요.</Sub>

        <div style={{ height: 24 }} />

        {/* Gemini */}
        <div style={{ marginBottom: 6, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase", color:"var(--w-label-alternative)" }}>
            Gemini API Key
          </span>
          {geminiOk && <span style={{ fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:4, background:"rgba(0,191,64,0.12)", color:"#00BF40" }}>✓ 입력됨</span>}
        </div>
        <input type="password"
          value={gemini}
          onChange={e => setGemini(e.target.value)}
          placeholder="AIzaSy…"
          style={{
            width:"100%", padding:"12px 14px", borderRadius:10,
            border:"1px solid " + (geminiOk ? "rgba(0,191,64,0.4)" : "var(--w-line-normal)"),
            fontFamily:"var(--w-font-mono)", fontSize:13, color:"var(--w-label-normal)",
            background:"#fff", outline:"none", marginBottom:6,
          }}
        />
        <p style={{ fontSize:11, color:"var(--w-label-assistive)", margin:"0 0 20px", lineHeight:1.5 }}>
          ✅ 캐릭터 생성 &nbsp;✅ 일정 생성 &nbsp;✅ 이미지 생성<br/>
          <a href="https://aistudio.google.com/apikey" target="_blank"
             style={{ color:"var(--w-primary)" }}>Google AI Studio</a>에서 무료 발급
        </p>

        {/* Maps */}
        <div style={{ marginBottom: 6, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase", color:"var(--w-label-alternative)" }}>
            Google Maps API Key
          </span>
          {mapsOk && <span style={{ fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:4, background:"rgba(0,191,64,0.12)", color:"#00BF40" }}>✓ 입력됨</span>}
        </div>
        <input type="password"
          value={maps}
          onChange={e => setMaps(e.target.value)}
          placeholder="AIzaSy…"
          style={{
            width:"100%", padding:"12px 14px", borderRadius:10,
            border:"1px solid " + (mapsOk ? "rgba(0,191,64,0.4)" : "var(--w-line-normal)"),
            fontFamily:"var(--w-font-mono)", fontSize:13, color:"var(--w-label-normal)",
            background:"#fff", outline:"none", marginBottom:6,
          }}
        />
        <p style={{ fontSize:11, color:"var(--w-label-assistive)", margin:"0 0 20px", lineHeight:1.5 }}>
          ✅ 지도 동선 표시 (Maps JavaScript API + Places API)<br/>
          <a href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com" target="_blank"
             style={{ color:"var(--w-primary)" }}>Google Cloud Console</a>에서 발급. 도메인 허용 필요.
        </p>

        <div style={{ padding:"12px 14px", borderRadius:12, background:"var(--w-bg-alternative)", fontSize:11, color:"var(--w-label-alternative)", lineHeight:1.6 }}>
          🔒 로컬스토리지에만 저장 · 외부 서버 전송 없음
        </div>
      </div>
    </PhoneShell>
  );
}

Object.assign(window, { Landing });
