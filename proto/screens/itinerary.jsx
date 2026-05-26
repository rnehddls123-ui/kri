// itinerary.jsx — AI-driven dynamic itinerary (장소·취향 맞춤)

function Itinerary({ character, inputs, onBack, openPlace, onOpenPlace, onClosePlace }) {
  const [loading, setLoading]   = useState(true);
  const [liveItin, setLiveItin] = useState(null);
  const [day, setDay]           = useState(1);
  const [usedProvider, setUsedProvider] = useState(null);
  const [gmapsCount, setGmapsCount]     = useState(0);
  const [mapOpen, setMapOpen]       = useState(false);

  // ── Generate dynamic itinerary via LLM ──────────────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const start    = Date.now();
      const provider = hasGemini() ? 'gemini' : null;

      // Date math: how many days?
      const arrDate = new Date(inputs.arrDate || '2025-11-22');
      const depDate = new Date(inputs.depDate || '2025-11-25');
      const numDays = Math.max(2, Math.round((depDate - arrDate) / (1000*60*60*24)) + 1);

      // ── Step 1: Fetch real places from Google Maps Places API ──
      let dynamicPlaces = null;
      if (window.__apiKeys?.maps) {
        // Maps JS API loads asynchronously — wait up to 8s for it to be ready
        if (!window.__mapsReady) {
          console.log('[Itinerary] Maps API 로딩 대기 중…');
          for (let i = 0; i < 16; i++) {
            await sleep(500);
            if (window.__mapsReady) break;
          }
        }
        if (window.__mapsReady) {
          try {
            dynamicPlaces = await fetchTokyoPlaces(inputs);
            if (dynamicPlaces) {
              const cnt = Object.keys(dynamicPlaces).length;
              if (!cancelled) setGmapsCount(cnt);
              console.log(`[Itinerary] 구글맵 ${cnt}개 장소 실시간 수신 ✓`);
            } else {
              console.warn('[Itinerary] fetchTokyoPlaces returned null (Places API 비활성화?)');
            }
          } catch (err) {
            console.warn('[Itinerary] GMaps Places fetch 실패:', err.message);
          }
        } else {
          console.warn('[Itinerary] Maps API 8초 내 로딩 실패 — 하드코딩 장소 사용');
        }
      }

      // Merge: dynamic (GMaps) + hardcoded fallback
      // Dynamic places override hardcoded ones with same id (won't clash — different key prefix)
      const activePlaces = dynamicPlaces
        ? { ...PLACES, ...dynamicPlaces }
        : PLACES;

      // Store globally so PlaceRow / PlaceDetail can read dynamic places by id
      window.__runtimePlaces = activePlaces;

      let result = null;

      if (provider) {
        try {
          const catMain  = inputs.categoryMain;
          const catSub   = inputs.categorySub;
          const dayPlaces = { '빡빡하게': 4, '보통': 3, '여유롭게': 2 }[inputs.pace] || 3;

          // Build a relevance-sorted place list (top 22) so the prompt stays focused
          // Main-category places first, then sub, then others — each group sorted by rating
          const sortedForPrompt = Object.entries(activePlaces).sort(([,a], [,b]) => {
            const sa = a.category === catMain ? 3 : a.category === catSub ? 2 : 1;
            const sb = b.category === catMain ? 3 : b.category === catSub ? 2 : 1;
            if (sa !== sb) return sb - sa;
            return (b.rating || 0) - (a.rating || 0);
          }).slice(0, 22);

          const placeList = sortedForPrompt
            .map(([id, p]) => `${id}|${p.name}|${p.region}|${p.category}|${p.price}`)
            .join('\n');

          console.log(`[Itinerary] LLM 호출 — ${numDays}일, 페이스:${dayPlaces}곳/일, 장소 ${sortedForPrompt.length}개, 메인:${catMain}, 서브:${catSub}`);

          const { text, model: usedModel } = await callLLM(
`[여행자 프로필]
캐릭터: ${character.name} | 권역: ${character.region}
메인취향: ${catMain} | 서브취향: ${catSub || '없음'}
분위기: ${inputs.mood} | 동행: ${inputs.companions}
페이스: ${inputs.pace} (하루 ${dayPlaces}곳) | 기상: ${inputs.wake}
예산: ${inputs.budget} | 체력: ${inputs.stamina || '보통'}

[장소 목록 — ID|이름|권역|카테고리|가격 — 반드시 이 ID만 사용]
${placeList}

[일정 생성 요청: ${numDays}일]
Day 1(도착일): placeIds 1~2개만
${numDays > 2 ? `Day 2~${numDays-1}(풀데이): placeIds ${dayPlaces}개씩` : ''}
Day ${numDays}(출국일): placeIds 1~2개만
- 메인취향(${catMain}) 장소 최우선, 서브취향(${catSub || '없음'}) 혼합
- 같은 날은 같은 권역 장소 묶어 이동 최소화
- placeIds: 위 목록의 ID를 그대로 복사 (절대 임의 생성 금지)

JSON 출력 (days 배열, 요소 ${numDays}개):
{"days":[{"idx":1,"area":"권역명","title":"감성 제목\\n2줄","desc":"구어체 설명 2~3문장","placeIds":["위목록ID"],"fatigue":5.5,"budget":12000,"walking":40}]}`,
`도쿄 여행 큐레이터. 반드시 JSON만 출력. 코드블록·마크다운 절대 금지. placeIds는 제공된 목록의 ID만 사용.`,
            2500
          );

          console.log(`[Itinerary] LLM 응답 수신 (${usedModel}), 길이: ${text.length}자`);
          console.log('[Itinerary] 응답 미리보기:', text.slice(0, 200));

          const d = parseJSON(text);
          if (d?.days && Array.isArray(d.days) && d.days.length > 0) {
            // Validate: at least one day has placeIds that exist in activePlaces
            const validDays = d.days.filter(day =>
              (day.placeIds || []).some(id => activePlaces[id])
            );
            if (validDays.length > 0) {
              result = buildItinerary(d.days, inputs, activePlaces);
              if (!cancelled) setUsedProvider(provider);
              console.log(`[Itinerary] ✓ AI 일정 생성 완료 — ${d.days.length}일, 유효일수: ${validDays.length}`);
            } else {
              console.warn('[Itinerary] AI가 유효한 placeIds를 하나도 반환하지 않음 — 폴백 사용');
              console.warn('[Itinerary] AI placeIds 예시:', d.days[0]?.placeIds);
            }
          } else {
            console.warn('[Itinerary] JSON 파싱 실패 또는 days 배열 없음');
          }
        } catch (err) {
          console.warn('[Itinerary] AI 호출 실패:', err.message);
        }
      }

      // Fallback: dynamic itinerary respecting the user's actual categories + pace
      // (never falls back to the hardcoded 2025-11-22 ITINERARY constant)
      if (!result) {
        console.log('[Itinerary] 동적 폴백 사용 — catMain:', inputs.categoryMain);
        result = buildDynamicFallback(inputs, activePlaces, numDays);
      }

      const elapsed = Date.now() - start;
      if (elapsed < 2600) await sleep(2600 - elapsed);

      if (!cancelled) {
        setLiveItin(result);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  if (loading || !liveItin) return <GeneratingItin />;

  const dayData    = liveItin.days.find(d => d.idx === day) || liveItin.days[0];
  const placeNodes = dayData.nodes.filter(n => n.type === 'place');
  const allP       = window.__runtimePlaces || PLACES;
  const pins       = placeNodes
    .map((n, i) => {
      const p = allP[n.id];
      if (!p) return null;
      return { lat: p.lat, lng: p.lng, id: n.id, label: String(i + 1), name: p.name };
    })
    .filter(Boolean);

  const arrD   = new Date(liveItin.arrival.date);
  const depD   = new Date(liveItin.departure.date);
  const nights = Math.round((depD - arrD) / (1000 * 60 * 60 * 24));
  const providerLabel = usedProvider === 'gemini' ? 'Gemini' : null;

  return (
    <PhoneShell
      overlay={openPlace && (
        <PlaceDetail placeId={openPlace} character={character} onClose={onClosePlace} />
      )}
    >
      {/* Page bar */}
      <PageBar
        onBack={onBack}
        title={
          <span style={{ fontSize:14, fontWeight:700 }}>
            {character.name.length > 18 ? character.name.slice(0, 16) + '…' : character.name}
          </span>
        }
        right={<img src="ds/icons/share.svg" style={{ width:22, height:22, opacity:0.65 }} />}
      />

      {/* Trip header */}
      <div style={{ padding:'0 20px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.06em', color:'var(--w-label-alternative)', textTransform:'uppercase' }}>
            도쿄 · {nights}박 {liveItin.days.length}일
          </div>
          <div style={{ fontFamily:'var(--w-font-display)', fontSize:22, fontWeight:700, letterSpacing:'-0.02em', marginTop:2 }}>
            {liveItin.arrival.airport} {liveItin.arrival.date.slice(5)} → {liveItin.departure.airport} {liveItin.departure.date.slice(5)}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:9999, background:'var(--w-bg-alternative)' }}>
          <CharacterOrb hi={character.hi} mid={character.mid} lo={character.lo} size={22} label={null} imageUrl={null} />
          <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.02em', color:'var(--w-label-normal)' }}>
            {character.region}
          </span>
        </div>
      </div>

      {/* AI + GMaps badge */}
      {(providerLabel || gmapsCount > 0) && (
        <div style={{ margin:'0 20px 10px', padding:'6px 12px', borderRadius:8, background:'rgba(255,94,0,0.07)', border:'1px solid rgba(255,94,0,0.15)', display:'flex', alignItems:'center', gap:6, fontSize:11, fontWeight:700, color:'var(--w-accent-redorange)', letterSpacing:'0.04em', flexWrap:'wrap' }}>
          {gmapsCount > 0 && <span>📍 구글맵 실시간 {gmapsCount}개 장소</span>}
          {gmapsCount > 0 && providerLabel && <span style={{ opacity:0.5 }}>·</span>}
          {providerLabel && <span>✦ {providerLabel}가 취향으로 동선 완성</span>}
        </div>
      )}

      {/* Map — collapsed / expanded */}
      <div style={{ margin:'0 20px 12px' }}>
        {!mapOpen ? (
          /* Compact bar */
          <button onClick={() => setMapOpen(true)}
            style={{ all:'unset', cursor:'pointer', width:'100%', boxSizing:'border-box', background:'var(--w-bg-alternative)', borderRadius:14, padding:'13px 16px', display:'flex', alignItems:'center', gap:10, border:'1px solid var(--w-line-alternative)' }}>
            <span style={{ fontSize:22, lineHeight:1 }}>🗺️</span>
            <span style={{ flex:1, fontSize:13, fontWeight:700, color:'var(--w-label-normal)' }}>지도에서 동선 보기 · {dayData.area}</span>
            <span style={{ fontSize:11, fontWeight:700, color:'var(--w-accent-redorange)', background:'rgba(255,94,0,0.10)', padding:'3px 8px', borderRadius:9999 }}>{placeNodes.length}개 장소</span>
            <span style={{ fontSize:18, color:'var(--w-label-alternative)', lineHeight:1 }}>›</span>
          </button>
        ) : (
          /* Expanded square map */
          <div style={{ borderRadius:18, overflow:'hidden', aspectRatio:'1/1', position:'relative', border:'1px solid var(--w-line-alternative)' }}>
            <GoogleMap pins={pins} onPin={p => { onOpenPlace(p.id); }} height="100%" interactive={true} />
            <div style={{ position:'absolute', left:12, top:12, background:'rgba(255,255,255,0.94)', padding:'6px 10px', borderRadius:8, fontSize:11, fontWeight:700, display:'flex', alignItems:'center', gap:6, pointerEvents:'none' }}>
              <img src="ds/icons/location.svg" style={{ width:12, height:12, filter:'brightness(0)', opacity:0.7 }} />
              {dayData.area}
            </div>
            <div style={{ position:'absolute', right:12, top:12, background:'var(--w-cool-22)', color:'#fff', padding:'6px 10px', borderRadius:8, fontSize:11, fontWeight:700, pointerEvents:'none' }}>
              {placeNodes.length}개 장소
            </div>
            <button onClick={() => setMapOpen(false)}
              style={{ position:'absolute', left:12, bottom:12, background:'rgba(255,255,255,0.94)', border:0, borderRadius:8, padding:'6px 10px', fontSize:11, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
              ✕ 닫기
            </button>
          </div>
        )}
      </div>

      {/* Day tabs */}
      <div style={{ display:'flex', gap:6, padding:'0 20px 12px' }}>
        {liveItin.days.map(d => (
          <button key={d.idx} onClick={() => { setDay(d.idx); setMapOpen(false); }}
            style={{ flex:1, padding:'10px 4px', borderRadius:10, border:0, background:d.idx===day?'var(--w-cool-22)':'var(--w-bg-alternative)', color:d.idx===day?'#fff':'var(--w-label-alternative)', cursor:'pointer', fontFamily:'var(--w-font-sans)', display:'flex', flexDirection:'column', alignItems:'center', gap:1 }}>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.05em' }}>DAY {d.idx}</span>
            <span style={{ fontSize:11, fontWeight:500, opacity:0.7 }}>{d.date} {d.weekday}</span>
          </button>
        ))}
      </div>

      {/* Day header card */}
      <div style={{ margin:'0 20px 14px', borderRadius:20, overflow:'hidden' }}>
        <div style={{ background:dayHeaderBg(day), padding:'18px 20px 16px' }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.06em', opacity:0.5, textTransform:'uppercase', color:dayHeaderInk(day) }}>
            DAY {day} · {dayData.weekday}요일
          </div>
          <div style={{ height:6 }} />
          <div style={{ fontFamily:'var(--w-font-display)', fontSize:22, fontWeight:700, letterSpacing:'-0.02em', lineHeight:1.25, color:dayHeaderInk(day), whiteSpace:'pre-line' }}>
            {dayData.title}
          </div>
          <div style={{ height:10 }} />
          <p style={{ fontSize:13, lineHeight:1.6, color:dayHeaderInk(day), opacity:0.7, margin:0, fontWeight:500 }}>
            {dayData.desc}
          </p>
        </div>
        {/* Stats row */}
        <div style={{ display:'flex', background:'rgba(0,0,0,0.04)', padding:'10px 20px' }}>
          {[
            ['🚶', `${dayData.walking || '–'}분 도보`],
            ['💴', `¥${(dayData.budget || 0).toLocaleString()}`],
            ['😮‍💨', `피로도 ${dayData.fatigue || '–'}/10`],
          ].map(([icon, txt]) => (
            <div key={txt} style={{ flex:1, textAlign:'center', fontSize:11, fontWeight:700, color:'var(--w-label-alternative)' }}>
              {icon}
              <div style={{ marginTop:2 }}>{txt}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div style={{ padding:'0 20px 32px' }}>
        <Timeline nodes={dayData.nodes} onOpenPlace={onOpenPlace} />
      </div>
    </PhoneShell>
  );
}

// ── Day card colour helpers ───────────────────────────────────
function dayHeaderBg(idx) {
  const p = {
    1: 'linear-gradient(135deg,#FFE6D4 0%,#FFC79A 100%)',
    2: 'linear-gradient(135deg,#DCCFFF 0%,#B399FF 100%)',
    3: 'linear-gradient(135deg,#C5E9D6 0%,#88D2B0 100%)',
    4: 'linear-gradient(135deg,#FFD6E8 0%,#F7A4C5 100%)',
    5: 'linear-gradient(135deg,#C5DFF8 0%,#8DB8F0 100%)',
  };
  return p[idx] || p[((idx - 1) % 5) + 1] || p[1];
}
function dayHeaderInk(idx) {
  const k = { 1:'#4d1f00', 2:'#2a1466', 3:'#0c3d28', 4:'#590e3a', 5:'#0c2d5a' };
  return k[idx] || k[((idx - 1) % 5) + 1] || k[1];
}

// ── Timeline components ───────────────────────────────────────
function Timeline({ nodes, onOpenPlace }) {
  let placeNum = 0;
  return (
    <div style={{ position:'relative', paddingLeft:30 }}>
      <div style={{ position:'absolute', left:14, top:8, bottom:8, width:2, background:'var(--w-fill-strong)', borderRadius:2 }} />
      {nodes.map((n, i) => {
        if (n.type === 'transit')                       return <TransitRow key={i} n={n} />;
        if (n.type === 'stay' || n.type === 'checkin')  return <StayRow    key={i} n={n} />;
        placeNum += 1;
        return <PlaceRow key={i} n={n} num={placeNum} onOpen={onOpenPlace} />;
      })}
    </div>
  );
}

function TransitRow({ n }) {
  return (
    <div style={{ position:'relative', padding:'4px 0 10px' }}>
      <div style={{ position:'absolute', left:-19, top:8, width:8, height:8, borderRadius:9999, background:'var(--w-bg-normal)', border:'2px solid var(--w-label-disable)' }} />
      <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, color:'var(--w-label-alternative)', fontWeight:600, letterSpacing:'0.01em' }}>
        <img src="ds/icons/arrow-down.svg" style={{ width:11, height:11, filter:'brightness(0)', opacity:0.55 }} />
        <span>{n.mode}</span>
        <span style={{ color:'var(--w-label-disable)' }}>·</span>
        <span>{n.min}분</span>
        {n.fee != null && <>
          <span style={{ color:'var(--w-label-disable)' }}>·</span>
          <span>¥{n.fee.toLocaleString()}</span>
        </>}
      </div>
      {(n.from || n.to) && (
        <div style={{ fontSize:10, color:'var(--w-label-assistive)', fontWeight:600, marginTop:2, paddingLeft:19, display:'flex', alignItems:'center', gap:3 }}>
          {n.from && <span>{n.from}</span>}
          {n.from && n.to && <span style={{ opacity:0.5, margin:'0 2px' }}>→</span>}
          {n.to && <span>{n.to}</span>}
        </div>
      )}
    </div>
  );
}

function StayRow({ n }) {
  return (
    <div style={{ position:'relative', padding:'6px 0 14px' }}>
      <div style={{ position:'absolute', left:-23, top:6, width:16, height:16, borderRadius:5, background:'var(--w-cool-22)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <img src="ds/icons/check.svg" style={{ width:10, height:10, filter:'brightness(0) invert(1)' }} />
      </div>
      <div style={{ fontFamily:'var(--w-font-mono)', fontSize:11, color:'var(--w-label-alternative)', fontWeight:700, letterSpacing:'0.02em' }}>
        {n.start}{n.end ? ` - ${n.end}` : ''}
      </div>
      <div style={{ fontSize:14, fontWeight:700, marginTop:2 }}>{n.title}</div>
      {n.note && <div style={{ fontSize:11, color:'var(--w-label-alternative)', fontWeight:500, marginTop:2 }}>{n.note}</div>}
    </div>
  );
}

function PlaceRow({ n, num, onOpen }) {
  const p = (window.__runtimePlaces || PLACES)[n.id];
  if (!p) return null;
  return (
    <button onClick={() => onOpen(n.id)}
      style={{ all:'unset', display:'block', width:'100%', cursor:'pointer', position:'relative', padding:'8px 0 16px' }}>
      <div style={{ position:'absolute', left:-25, top:6, width:20, height:20, borderRadius:9999, background:'var(--w-bg-normal)', border:'3px solid var(--w-primary)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'var(--w-primary)', fontFamily:'var(--w-font-mono)' }}>
        {num}
      </div>
      <div style={{ fontFamily:'var(--w-font-mono)', fontSize:11, color:'var(--w-label-alternative)', fontWeight:700, letterSpacing:'0.02em' }}>
        {n.start} - {n.end}
      </div>
      <div style={{ fontSize:15, fontWeight:700, marginTop:2, letterSpacing:'-0.005em', color:'var(--w-label-normal)' }}>
        {p.name}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4, fontSize:12, color:'var(--w-label-alternative)', fontWeight:500 }}>
        <img src="ds/icons/star-fill.svg" style={{ width:11, height:11 }} />
        <span style={{ fontWeight:700 }}>{p.rating}</span>
        <span style={{ color:'var(--w-label-disable)' }}>·</span>
        <span>{p.category}</span>
        <span style={{ color:'var(--w-label-disable)' }}>·</span>
        <span style={{ color:'var(--w-status-positive)', fontWeight:700 }}>영업중</span>
      </div>
    </button>
  );
}

// ── Generating loading screen ─────────────────────────────────
function GeneratingItin() {
  const [step, setStep] = useState(0);
  // uses hasGemini() directly

  const steps = [
    window.__apiKeys?.maps ? '구글맵 실시간 장소 데이터 수신 중' : '취향 카테고리 · 장소 라이브러리 로딩',
    '취향 벡터 추출 · 카테고리 가중치 계산',
    '일별 권역 할당 (이동 최소화)',
    '장소 스코어링 · 동선 최적화',
    '에디토리얼 카피 · 최종 일정 완성',
  ];

  useEffect(() => {
    if (step >= steps.length) return;
    const t = setTimeout(() => setStep(s => s + 1), 480);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <PhoneShell scroll={false}>
      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'0 32px', background:'radial-gradient(circle at 50% 30%, #EAF2FE 0%, #FFFFFF 70%)' }}>
        <Eyebrow tone="brand">AI 일정 생성</Eyebrow>
        <div style={{ height:10 }} />
        <Heading>{"캐릭터 취향으로\n동선을 짜는 중이에요"}</Heading>
        <div style={{ height:22 }} />
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {steps.map((s, i) => {
            const done   = i < step;
            const active = i === step;
            return (
              <div key={i} style={{ display:'flex', gap:12, alignItems:'center', padding:'12px 14px', borderRadius:12, background:done?'rgba(0,191,64,0.07)':active?'rgba(0,102,255,0.08)':'var(--w-bg-alternative)' }}>
                <div style={{ width:22, height:22, borderRadius:7, flexShrink:0, background:done?'rgba(0,191,64,0.15)':active?'rgba(0,102,255,0.18)':'var(--w-fill-normal)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:done?'var(--w-status-positive)':active?'var(--w-primary)':'var(--w-label-assistive)', fontFamily:'var(--w-font-mono)' }}>
                  {done ? '✓' : i + 1}
                </div>
                <span style={{ flex:1, fontSize:13, fontWeight:700, color:done?'var(--w-status-positive)':active?'var(--w-primary)':'var(--w-label-assistive)' }}>
                  {s}{active ? '…' : ''}
                </span>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop:20, padding:'6px 12px', borderRadius:9999, background:hasGemini()?'rgba(0,102,255,0.08)':'rgba(112,115,124,0.08)', textAlign:'center', fontSize:11, fontWeight:700, color:hasGemini()?'var(--w-primary)':'var(--w-label-assistive)', letterSpacing:'0.04em' }}>
          {hasGemini() ? '✦ Gemini가 캐릭터 취향으로 장소를 선택하는 중' : '목 데이터 사용 중 — ⚙ API 설정에서 키 입력'}
        </div>
      </div>
    </PhoneShell>
  );
}

Object.assign(window, { Itinerary });
