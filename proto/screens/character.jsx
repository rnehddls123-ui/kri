// character.jsx — real AI character generation (Gemini / Claude / GPT)

function Character({ inputs, character, setCharacter, onBack, onContinue }) {
  const [phase, setPhase] = useState(character.image ? "reveal" : "generating");

  // ── Phase 1: Generate character via any LLM ───────────────
  useEffect(() => {
    if (phase !== "generating") return;
    let cancelled = false;

    (async () => {
      if (!hasGemini()) {
        // No key → keep mock after a short delay
        await sleep(2400);
        if (!cancelled) setPhase("gender");
        return;
      }

      try {
        const { text } = await callLLM(
          `여행자 프로필:
동행: ${inputs.companions}
분위기: ${inputs.mood}
메인카테고리: ${inputs.categoryMain}
서브카테고리: ${inputs.categorySub}
숙소: ${inputs.lodging || "도쿄 도심"}
페이스: ${inputs.pace}
예산: ${inputs.budget}

아래 JSON 형식으로만 응답하세요 (코드블록, 설명 없이):
{
  "name": "[지역]에서 [메인카테 행동]하는 [서브카테 형용사]",
  "region": "권역명 (한글 한 곳만)",
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "oneLine": "부드러운 구어체 한 문장 (요체 종결)",
  "hi": "#밝은색hex",
  "mid": "#중간색hex",
  "lo": "#어두운색hex"
}`,
          `당신은 도쿄 여행자 취향 캐릭터 네이머입니다.
네이밍 구조: [지역]에서 [메인카테고리 행동]하는 [서브카테고리 형용사]
예: "우에노에서 먹방 찍는 쇼핑 중독자" / "시모키타자와에서 레코드 고르는 카페인 중독자"
규칙: 관광 안내 금지 / MZ 신조어 / 읽으면 피식 웃음 / JSON만 출력.
색상: 카테고리 분위기를 반영한 hex 3단계 (hi=하이라이트, mid=중간, lo=딥).`,
          512
        );

        const d = parseJSON(text);
        if (!cancelled) {
          setCharacter(prev => ({
            name:     d.name     || prev.name,
            region:   d.region   || prev.region,
            keywords: Array.isArray(d.keywords) ? d.keywords : prev.keywords,
            oneLine:  d.oneLine  || prev.oneLine,
            hi:  d.hi  || prev.hi,
            mid: d.mid || prev.mid,
            lo:  d.lo  || prev.lo,
            gender: null, image: false, imageUrl: null,
            aiGenerated: true,   // marks successful Gemini generation
          }));
        }
      } catch (err) {
        console.warn('[Character] LLM failed:', err.message);
        // aiGenerated stays undefined (falsy) → Reveal shows mock badge
      }

      if (!cancelled) setPhase("gender");
    })();

    return () => { cancelled = true; };
  }, [phase]);

  // ── Phase 2: Generate image (Gemini Imagen 3) ───────────────
  useEffect(() => {
    if (phase !== "rendering") return;
    let cancelled = false;

    (async () => {
      // Need at least Gemini or OpenAI key for image generation
      if (!canGenerateImage()) {
        await sleep(2000);
        if (!cancelled) setPhase("reveal");
        return;
      }

      try {
        // Build content prompt via LLM (any provider)
        let contentPrompt = `${character.gender === "여성" ? "young japanese woman" : "young japanese man"}, ${(character.keywords||[]).join(", ")}, ${character.region} Tokyo style`;

        try {
          const { text } = await callLLM(
            `캐릭터명: "${character.name}"
성별: ${character.gender}
키워드: ${(character.keywords||[]).join(", ")}

캐릭터 이미지 프롬프트를 영어로 생성하세요. JSON만:
{"content_prompt": "..."}`,
            '캐릭터 이미지 프롬프트 생성기. content_prompt만 영어로. JSON만 출력.',
            200
          );
          const d = parseJSON(text);
          if (d.content_prompt) contentPrompt = d.content_prompt;
        } catch(_) {}

        const fullPrompt = `cute 3D clay character, ${contentPrompt}, chubby rounded body, smooth glossy plastic texture, fisheye lens close-up portrait, bright vivid colors, Pixar animation style, kawaii aesthetic, highly detailed 3D render, square format 1:1`;
        const imageUrl = await callImageGen(fullPrompt);

        if (!cancelled) {
          setCharacter(prev => ({ ...prev, image: true, imageUrl }));
          setPhase("reveal");
        }
      } catch (err) {
        console.warn('[Character] Image failed:', err.message);
        if (!cancelled) setPhase("reveal");
      }
    })();

    return () => { cancelled = true; };
  }, [phase]);

  if (phase === "generating") return <Generating phase={1} />;
  if (phase === "gender")     return <GenderPick character={character} onPick={g => { setCharacter(prev => ({ ...prev, gender: g })); setPhase("rendering"); }} />;
  if (phase === "rendering")  return <Generating phase={2} character={character} />;
  return <Reveal inputs={inputs} character={character} onBack={onBack} onContinue={onContinue} onRedo={() => setPhase("generating")} />;
}

// ── Generating animation ──────────────────────────────────────
function Generating({ phase=1, character }) {
  const items1 = [
    { t:"취향 키워드 추출", done:true },
    { t:"권역 매칭 (26개 중 1)", done:phase===2?true:"pending" },
    { t:"캐릭터명 생성", done:phase===2?true:"pending" },
  ];
  const imgLabel = imageProviderLabel() || 'AI';
  const items2 = [
    { t:"캐릭터 컨셉 분석", done:true },
    { t:`${imgLabel} 이미지 생성`, done:"active" },
    { t:"캐릭터 카드 구성", done:"pending" },
  ];
  const items = phase===1 ? items1 : items2;
  const hi  = character?.hi  || "#ffe5a8";
  const mid = character?.mid || "#ff7a3a";
  const lo  = character?.lo  || "#8a2400";
  const providerLabel = hasGemini() ? 'Gemini' : '목 데이터';

  return (
    <PhoneShell scroll={false}>
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 32px", background:"#F8F9FA" }}>
        <div style={{ position:"relative", width:180, height:180, marginBottom:28 }}>
          <div style={{ position:"absolute", inset:-18, borderRadius:"50%", border:"1px solid rgba(255,94,0,0.20)", animation:"pulse 1.8s ease-out infinite" }} />
          <div style={{ position:"absolute", inset:-40, borderRadius:"50%", border:"1px solid rgba(255,94,0,0.10)", animation:"pulse 2.4s ease-out infinite" }} />
          <CharacterOrb hi={hi} mid={mid} lo={lo} size={180} label={null} />
        </div>

        <Eyebrow tone="accent">STEP {phase} / 2</Eyebrow>
        <div style={{ height:10 }} />
        <h2 style={{ fontFamily:"var(--w-font-sans)", fontSize:24, fontWeight:700, letterSpacing:"-0.018em", lineHeight:1.25, textAlign:"center", margin:0, whiteSpace:"pre-line" }}>
          {phase===1 ? "당신의 캐릭터를\n빚는 중이에요" : "캐릭터 이미지를\n그리는 중이에요"}
        </h2>
        <div style={{ height:28 }} />
        <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:8 }}>
          {items.map((it,i) => {
            const done=it.done===true, active=it.done==="active";
            return (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", borderRadius:10, border:"1px solid "+(done?"rgba(16,185,129,0.20)":active?"rgba(0,102,255,0.15)":"var(--w-line-alternative)"), background:done?"rgba(16,185,129,0.06)":active?"rgba(0,102,255,0.06)":"#fff" }}>
                <span style={{ fontSize:12, fontWeight:700, color:done?"#065F46":active?"var(--w-primary)":"var(--w-label-assistive)" }}>{it.t}</span>
                <span style={{ fontFamily:"var(--w-font-mono)", fontSize:10, fontWeight:700, color:done?"#065F46":active?"var(--w-primary)":"var(--w-label-disable)", letterSpacing:"0.04em" }}>{done?"✓ DONE":active?"RUNNING…":"WAIT"}</span>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop:20, padding:"6px 14px", borderRadius:8, border:"1px solid "+(hasGemini()?"rgba(0,102,255,0.15)":"var(--w-line-alternative)"), background:hasGemini()?"rgba(0,102,255,0.06)":"var(--w-bg-alternative)", fontSize:10, fontWeight:700, color:hasGemini()?"var(--w-primary)":"var(--w-label-assistive)", letterSpacing:"0.05em", fontFamily:"var(--w-font-mono)" }}>
          {hasGemini() ? `${providerLabel} API RUNNING` : "MOCK DATA — ⚙ API 설정에서 키 입력"}
        </div>
      </div>
      <style>{`@keyframes pulse { 0%{transform:scale(0.95);opacity:0.9;} 70%{transform:scale(1.18);opacity:0;} 100%{transform:scale(1.18);opacity:0;} }`}</style>
    </PhoneShell>
  );
}

// ── Gender pick ───────────────────────────────────────────────
function GenderPick({ character, onPick }) {
  const imgLabel = imageProviderLabel();
  return (
    <PhoneShell scroll={false}>
      <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"32px 24px 24px", justifyContent:"center" }}>
        <Eyebrow tone="accent">캐릭터 카드 만들기 마지막 단계</Eyebrow>
        <div style={{ height:12 }} />
        <Heading>{"이미지로 빚을 때\n어떤 모습이 좋을까요?"}</Heading>
        <div style={{ height:12 }} />
        <Sub>{imgLabel ? `고정된 3D 클레이 스타일로 ${imgLabel}가 1회 생성해요.` : "API 키 없이는 그라디언트 오브로 표현돼요. 이미지 외 정체성은 같아요."}</Sub>
        <div style={{ height:32 }} />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {[{ v:"여성", hi:"#ffd6e8", mid:"#f06aa2", lo:"#7a1454" },
            { v:"남성", hi:"#bcd8ff", mid:"#5d8af0", lo:"#1b3a8a" }].map(g => (
            <button key={g.v} onClick={() => onPick(g.v)}
              style={{ all:"unset", cursor:"pointer", background:"#fff", border:"1px solid var(--w-line-normal)", borderRadius:18, padding:"20px 16px", display:"flex", flexDirection:"column", alignItems:"center", gap:14, transition:"border-color 150ms" }}>
              <CharacterOrb hi={g.hi} mid={g.mid} lo={g.lo} size={96} label={null} />
              <div style={{ fontSize:15, fontWeight:700 }}>{g.v}</div>
            </button>
          ))}
        </div>
      </div>
    </PhoneShell>
  );
}

// ── Reveal ────────────────────────────────────────────────────
function Reveal({ inputs, character, onBack, onContinue, onRedo }) {
  function nights(a,b) {
    if (!a||!b) return 0;
    return Math.max(0, Math.round((new Date(b)-new Date(a))/(1000*60*60*24)));
  }
  return (
    <PhoneShell dark footer={
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={onRedo} style={{ flex:"0 0 auto", padding:16, background:"rgba(255,255,255,0.06)", color:"#fff", border:0, borderRadius:14, fontFamily:"var(--w-font-sans)", fontWeight:700, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
          <img src="ds/icons/refresh.svg" style={{ width:16, height:16, filter:"brightness(0) invert(1)", opacity:0.7 }} />
          다시 빚기
        </button>
        <button onClick={onContinue} style={{ flex:1, padding:16, background:"var(--w-accent-redorange)", color:"#fff", border:0, borderRadius:14, fontFamily:"var(--w-font-sans)", fontWeight:700, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          일정 만들기
          <img src="ds/icons/arrow-right.svg" style={{ width:18, height:18, filter:"brightness(0) invert(1)" }} />
        </button>
      </div>
    }>
      <PageBar onBack={onBack} dark right={<img src="ds/icons/share.svg" style={{ width:22, height:22, filter:"brightness(0) invert(1)", opacity:0.78 }} />} />
      <div style={{ padding:"0 22px 24px", color:"#fff" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <Eyebrow tone="accent">당신의 도쿄 캐릭터</Eyebrow>
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.06em", padding:"3px 8px", borderRadius:9999, background: character.aiGenerated?"rgba(255,94,0,0.22)":"rgba(255,255,255,0.10)", color: character.aiGenerated?"#ffb085":"rgba(255,255,255,0.45)" }}>
            {character.aiGenerated ? "✦ Gemini AI" : "목 데이터"}
          </span>
        </div>
        <div style={{ height:16 }} />
        <div style={{ background:"linear-gradient(160deg, #2a2225 0%, #1a1518 100%)", borderRadius:24, padding:"22px 20px 20px", border:"1px solid rgba(255,255,255,0.06)", display:"flex", flexDirection:"column", alignItems:"center" }}>
          <CharacterOrb hi={character.hi} mid={character.mid} lo={character.lo} size={170} label={character.imageUrl?"Imagen 3":"AI 생성"} imageUrl={character.imageUrl} />
          <div style={{ height:16 }} />
          <div style={{ fontFamily:"var(--w-font-display)", fontWeight:700, fontSize:22, lineHeight:1.18, letterSpacing:"-0.02em", textAlign:"center", textWrap:"balance" }}>{character.name}</div>
          <div style={{ height:12 }} />
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", justifyContent:"center" }}>
            {character.keywords.map((k,i) => (
              <span key={i} style={{ fontSize:11, fontWeight:700, padding:"5px 9px", borderRadius:9999, background:"rgba(255,255,255,0.10)", color:"#fff" }}>#{k}</span>
            ))}
          </div>
        </div>
        <div style={{ height:16 }} />
        <p style={{ color:"rgba(255,255,255,0.72)", fontSize:14, lineHeight:1.6, textAlign:"center", margin:0, fontWeight:500 }}>{character.oneLine}</p>
        <div style={{ height:22 }} />
        <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:14, padding:14 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.06em", color:"rgba(255,255,255,0.5)", textTransform:"uppercase", marginBottom:10 }}>내 입력 요약</div>
          <div style={{ display:"grid", gridTemplateColumns:"70px 1fr", gap:"6px 14px" }}>
            {[
              ["일정", `${inputs.arrAirport||"-"} → ${inputs.depAirport||"-"} · ${nights(inputs.arrDate,inputs.depDate)||"-"}박`],
              ["동행", inputs.companions||"-"],
              ["분위기", inputs.mood||"-"],
              ["관심", [inputs.categoryMain,inputs.categorySub].filter(Boolean).join(" · ")||"-"],
              ["페이스", [inputs.pace,inputs.wake].filter(Boolean).join(" · ")||"-"],
            ].map(([k,v]) => (
              <React.Fragment key={k}>
                <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.45)", paddingTop:1 }}>{k}</div>
                <div style={{ fontSize:12, fontWeight:600, color:"#fff" }}>{v}</div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}

Object.assign(window, { Character, Generating, GenderPick, Reveal });
