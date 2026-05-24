// itinerary.jsx — real Claude Sonnet editorial copy + AI-generated day descriptions

function Itinerary({ character, inputs, onBack, openPlace, onOpenPlace, onClosePlace }) {
  const [loading, setLoading]       = useState(true);
  const [day, setDay]               = useState(1);
  const [dayEdits, setDayEdits]     = useState({}); // { [dayIdx]: { title, desc } } from Claude

  // ── Generate editorial copy via Claude Sonnet ─────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Run for ~2.2s regardless (loading animation)
      const start = Date.now();

      if (window.__apiKeys?.anthropic) {
        try {
          const res = await callAnthropic(
            [{
              role: "user",
              content: `여행자 캐릭터: ${character.name}
메인 카테고리: ${inputs.categoryMain}
서브 카테고리: ${inputs.categorySub}
분위기 선호: ${inputs.mood}
동행: ${inputs.companions}
숙소: ${inputs.lodging || "도쿄"}
예산: ${inputs.budget}

아래 4일 일정 각각에 어울리는 에디토리얼 카피를 JSON으로 생성해:
- Day1: 공항 도착 → 우에노 맛집·박물관·카페
- Day2: 시모키타자와(레코드/카레/커피) → 다이칸야마
- Day3: 아키하바라 → 긴자 → 츠키지
- Day4: 우에노 아메요코 → 공항 출발

JSON 형식:
{
  "days": [
    {
      "idx": 1,
      "title": "2줄 제목 (\\n으로 구분, 감성적)",
      "desc": "3~4줄 에디토리얼 설명 (29cm/토스 스타일, 구어체 요체)"
    },
    ...
  ]
}`,
            }],
            `당신은 도쿄 여행 큐레이터입니다.
톤: 부드러운 구어체 요체. 29cm, 토스 스타일.
규칙: 관광 안내 어조 금지 / 소설적 표현 금지 / 읽으면 그날 일정이 머릿속에 그려져야 함.
캐릭터 취향에 맞게 하루 컨셉을 잡아주세요. JSON만 출력.`,
            "claude-sonnet-4-6",
            1024
          );

          const text = res.content[0].text;
          const m = text.match(/\{[\s\S]*\}/);
          if (m && !cancelled) {
            const d = JSON.parse(m[0]);
            if (d.days) {
              const edits = {};
              d.days.forEach(day => { edits[day.idx] = { title: day.title, desc: day.desc }; });
              setDayEdits(edits);
            }
          }
        } catch (err) {
          console.warn("[Itinerary] Claude call failed:", err.message);
        }
      }

      // Ensure minimum loading time
      const elapsed = Date.now() - start;
      if (elapsed < 2200) await sleep(2200 - elapsed);
      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, []);

  if (loading) return <GeneratingItin />;

  const dayData = ITINERARY.days.find((d) => d.idx === day) || ITINERARY.days[0];

  // Merge real AI copy if available
  const mergedDayData = dayEdits[day]
    ? { ...dayData, title: dayEdits[day].title, desc: dayEdits[day].desc }
    : dayData;

  const placeNodes = dayData.nodes.filter((n) => n.type === "place");
  const pins = placeNodes.map((n, i) => ({
    ...PLACES[n.id].pos, id: n.id, label: String(i + 1),
  }));
  const pathPoints = pins;

  return (
    <PhoneShell
      overlay={openPlace && (
        <PlaceDetail placeId={openPlace} character={character} onClose={onClosePlace} />
      )}
    >
      <PageBar onBack={onBack}
        title={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{character.name.length > 18
              ? character.name.slice(0, 16) + "…"
              : character.name}</span>
          </span>
        }
        right={<img src="ds/icons/share.svg" style={{ width: 22, height: 22, opacity: 0.65 }} />}
      />

      {/* Trip header */}
      <div style={{ padding: "0 20px 14px", display: "flex",
                    alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
                        color: "var(--w-label-alternative)", textTransform: "uppercase" }}>
            도쿄 · 3박 4일
          </div>
          <div style={{
            fontFamily: "var(--w-font-display)", fontSize: 22,
            fontWeight: 700, letterSpacing: "-0.02em", marginTop: 2,
          }}>
            {ITINERARY.arrival.airport} {ITINERARY.arrival.date.slice(5)}
            {" → "}
            {ITINERARY.departure.airport} {ITINERARY.departure.date.slice(5)}
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 10px", borderRadius: 9999,
          background: "var(--w-bg-alternative)",
        }}>
          <CharacterOrb hi={character.hi} mid={character.mid} lo={character.lo}
            size={22} label={null} imageUrl={null} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.02em",
                          color: "var(--w-label-normal)" }}>
            {character.region}
          </span>
        </div>
      </div>

      {/* AI indicator badge */}
      {dayEdits[day] && (
        <div style={{
          margin: "0 20px 10px", padding: "6px 12px", borderRadius: 8,
          background: "rgba(255,94,0,0.07)", border: "1px solid rgba(255,94,0,0.15)",
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 11, fontWeight: 700, color: "var(--w-accent-redorange)",
          letterSpacing: "0.04em",
        }}>
          <img src="ds/icons/sparkle-fill.svg" style={{ width: 12, height: 12 }} />
          Claude Sonnet이 이 카피를 생성했어요
        </div>
      )}

      {/* Map */}
      <div style={{
        margin: "0 20px 12px", borderRadius: 18, overflow: "hidden",
        background: "var(--w-cool-98)",
        aspectRatio: "1.55 / 1", position: "relative",
        border: "1px solid var(--w-line-alternative)",
      }}>
        <TokyoMap pins={pins} path={pathPoints} highlight={character.region}
                  onPin={(p) => onOpenPlace(p.id)} />
        <div style={{
          position: "absolute", left: 12, top: 12, background: "rgba(255,255,255,0.94)",
          padding: "6px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <img src="ds/icons/location.svg"
                style={{ width: 12, height: 12, filter: "brightness(0)", opacity: 0.7 }} />
          {dayData.area}
        </div>
        <div style={{
          position: "absolute", right: 12, top: 12, background: "var(--w-cool-22)",
          color: "#fff", padding: "6px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700,
        }}>
          {placeNodes.length}개 장소
        </div>
      </div>

      {/* Day tabs */}
      <div style={{ display: "flex", gap: 6, padding: "0 20px 12px" }}>
        {ITINERARY.days.map((d) => (
          <button key={d.idx} onClick={() => setDay(d.idx)}
            style={{
              flex: 1, padding: "10px 4px", borderRadius: 10, border: 0,
              background: d.idx === day ? "var(--w-cool-22)" : "var(--w-bg-alternative)",
              color: d.idx === day ? "#fff" : "var(--w-label-alternative)",
              cursor: "pointer",
              fontFamily: "var(--w-font-sans)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
            }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em" }}>
              DAY {d.idx}
            </span>
            <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.7 }}>
              {d.date} {d.weekday}
            </span>
          </button>
        ))}
      </div>

      {/* Day editorial intro */}
      <div style={{ padding: "0 22px 16px" }}>
        <div style={{
          background: dayHeaderBg(day),
          borderRadius: 16, padding: "16px 18px",
          color: dayHeaderInk(day),
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
                        marginBottom: 4, opacity: 0.78 }}>
            {dayData.area.toUpperCase()}
          </div>
          <div style={{
            fontFamily: "var(--w-font-display)", fontSize: 18, fontWeight: 700,
            lineHeight: 1.3, letterSpacing: "-0.018em", whiteSpace: "pre-line",
          }}>
            {mergedDayData.title}
          </div>
          <div style={{ height: 8 }} />
          <div style={{ fontSize: 12, lineHeight: 1.6, fontWeight: 500, opacity: 0.78 }}>
            {mergedDayData.desc}
          </div>
          <div style={{ height: 12 }} />
          <div style={{ display: "flex", gap: 14, fontSize: 11 }}>
            <Stat label="피로도" v={`${dayData.fatigue}/7`} />
            <Stat label="예상 지출" v={`¥${dayData.budget.toLocaleString()}`} />
            <Stat label="도보" v={`${dayData.walking}%`} />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ padding: "0 24px 24px" }}>
        <Timeline nodes={dayData.nodes} onOpenPlace={onOpenPlace} />
      </div>
    </PhoneShell>
  );
}

function Stat({ label, v }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 10, opacity: 0.65, letterSpacing: "0.04em", fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, marginTop: 1 }}>{v}</div>
    </div>
  );
}

function dayHeaderBg(idx) {
  const palettes = {
    1: "linear-gradient(135deg, #FFE6D4 0%, #FFC79A 100%)",
    2: "linear-gradient(135deg, #DCCFFF 0%, #B399FF 100%)",
    3: "linear-gradient(135deg, #C5E9D6 0%, #88D2B0 100%)",
    4: "linear-gradient(135deg, #FFD6E8 0%, #F7A4C5 100%)",
  };
  return palettes[idx] || palettes[1];
}
function dayHeaderInk(idx) {
  const inks = { 1: "#4d1f00", 2: "#2a1466", 3: "#0c3d28", 4: "#590e3a" };
  return inks[idx] || inks[1];
}

// ───── Timeline ──────────────────────────────────────────────
function Timeline({ nodes, onOpenPlace }) {
  let placeNumber = 0;
  return (
    <div style={{ position: "relative", paddingLeft: 30 }}>
      {/* vertical rail */}
      <div style={{
        position: "absolute", left: 14, top: 8, bottom: 8,
        width: 2, background: "var(--w-fill-strong)", borderRadius: 2,
      }} />
      {nodes.map((n, i) => {
        if (n.type === "transit") return <TransitRow key={i} n={n} />;
        if (n.type === "stay" || n.type === "checkin") return <StayRow key={i} n={n} />;
        placeNumber += 1;
        return <PlaceRow key={i} n={n} num={placeNumber} onOpen={onOpenPlace} />;
      })}
    </div>
  );
}

function TransitRow({ n }) {
  return (
    <div style={{ position: "relative", padding: "4px 0 10px" }}>
      <div style={{
        position: "absolute", left: -19, top: 8,
        width: 8, height: 8, borderRadius: 9999,
        background: "var(--w-bg-normal)", border: "2px solid var(--w-label-disable)",
      }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8,
                    fontSize: 11, color: "var(--w-label-alternative)", fontWeight: 600,
                    letterSpacing: "0.01em" }}>
        <img src="ds/icons/arrow-down.svg"
              style={{ width: 11, height: 11, filter: "brightness(0)", opacity: 0.55 }} />
        <span>{n.mode}</span>
        <span style={{ color: "var(--w-label-disable)" }}>·</span>
        <span>{n.min}분</span>
        {n.fee !== undefined && (
          <>
            <span style={{ color: "var(--w-label-disable)" }}>·</span>
            <span>¥{n.fee.toLocaleString()}</span>
          </>
        )}
      </div>
    </div>
  );
}

function StayRow({ n }) {
  return (
    <div style={{ position: "relative", padding: "6px 0 14px" }}>
      <div style={{
        position: "absolute", left: -23, top: 6,
        width: 16, height: 16, borderRadius: 5,
        background: "var(--w-cool-22)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <img src="ds/icons/check.svg" style={{ width: 10, height: 10,
              filter: "brightness(0) invert(1)" }} />
      </div>
      <div style={{ fontFamily: "var(--w-font-mono)", fontSize: 11,
                    color: "var(--w-label-alternative)", fontWeight: 700,
                    letterSpacing: "0.02em" }}>
        {n.start}{n.end ? ` - ${n.end}` : ""}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{n.title}</div>
      {n.note && (
        <div style={{ fontSize: 11, color: "var(--w-label-alternative)",
                      fontWeight: 500, marginTop: 2 }}>{n.note}</div>
      )}
    </div>
  );
}

function PlaceRow({ n, num, onOpen }) {
  const p = PLACES[n.id];
  if (!p) return null;
  return (
    <button onClick={() => onOpen(n.id)}
      style={{
        all: "unset", display: "block", width: "100%", cursor: "pointer",
        position: "relative", padding: "8px 0 16px",
      }}>
      <div style={{
        position: "absolute", left: -25, top: 6,
        width: 20, height: 20, borderRadius: 9999,
        background: "var(--w-bg-normal)", border: "3px solid var(--w-primary)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 9, fontWeight: 700, color: "var(--w-primary)",
        fontFamily: "var(--w-font-mono)",
      }}>{num}</div>
      <div style={{ fontFamily: "var(--w-font-mono)", fontSize: 11,
                    color: "var(--w-label-alternative)", fontWeight: 700,
                    letterSpacing: "0.02em" }}>
        {n.start} - {n.end}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2,
                    letterSpacing: "-0.005em", color: "var(--w-label-normal)" }}>
        {p.name}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4,
                    fontSize: 12, color: "var(--w-label-alternative)", fontWeight: 500 }}>
        <img src="ds/icons/star-fill.svg" style={{ width: 11, height: 11 }} />
        <span style={{ fontWeight: 700 }}>{p.rating}</span>
        <span style={{ color: "var(--w-label-disable)" }}>·</span>
        <span>{p.category}</span>
        <span style={{ color: "var(--w-label-disable)" }}>·</span>
        <span style={{ color: "var(--w-status-positive)", fontWeight: 700 }}>영업중</span>
      </div>
    </button>
  );
}

// ───── Generating-itinerary loading ──────────────────────────
function GeneratingItin() {
  const [step, setStep] = useState(0);
  const steps = [
    "전처리 · 활동 가능 시간 계산",
    "권역 할당 (우에노 → 시모키타 → 아키하바라)",
    "노드 스코어링 (메인 1.0 / 서브 0.4)",
    "Fatigue 검증 · 영업시간 충돌 검사",
    "이동 정보 확정 (Distance Matrix)",
  ];
  useEffect(() => {
    if (step >= steps.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), 400);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <PhoneShell scroll={false}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column",
                    justifyContent: "center", padding: "0 32px",
                    background: "radial-gradient(circle at 50% 30%, #EAF2FE 0%, #FFFFFF 70%)" }}>
        <Eyebrow tone="brand">9단계 알고리즘</Eyebrow>
        <div style={{ height: 10 }} />
        <Heading>{"3박 4일 동선을\n짜는 중이에요"}</Heading>
        <div style={{ height: 22 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {steps.map((s, i) => {
            const done   = i < step;
            const active = i === step;
            return (
              <div key={i} style={{
                display: "flex", gap: 12, alignItems: "center",
                padding: "12px 14px", borderRadius: 12,
                background: done ? "rgba(0,191,64,0.07)"
                          : active ? "rgba(0,102,255,0.08)"
                          : "var(--w-bg-alternative)",
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 7,
                  background: done ? "rgba(0,191,64,0.15)"
                            : active ? "rgba(0,102,255,0.18)"
                            : "var(--w-fill-normal)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                  color: done ? "var(--w-status-positive)"
                       : active ? "var(--w-primary)"
                       : "var(--w-label-assistive)",
                  fontFamily: "var(--w-font-mono)",
                }}>{done ? "✓" : i + 1}</div>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 700,
                                color: done ? "var(--w-status-positive)"
                                     : active ? "var(--w-primary)"
                                     : "var(--w-label-assistive)" }}>
                  {s}{active && "…"}
                </span>
              </div>
            );
          })}
        </div>
        {window.__apiKeys?.anthropic && (
          <div style={{
            marginTop: 20, padding: "6px 12px", borderRadius: 9999,
            background: "rgba(0,102,255,0.08)", textAlign: "center",
            fontSize: 11, fontWeight: 700, color: "var(--w-primary)",
            letterSpacing: "0.04em",
          }}>
            ✦ Claude Sonnet으로 에디토리얼 카피 생성 중
          </div>
        )}
      </div>
    </PhoneShell>
  );
}

Object.assign(window, { Itinerary });
