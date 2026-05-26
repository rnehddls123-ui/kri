// Input screen — 12 cards in sequence, all reading/writing the same `inputs` state.

const INPUT_STEPS = [
  "flights", "companions", "lodging",
  "mood", "categoryMain", "categorySub", "photo",
  "pace", "transport", "stamina", "food", "budget",
];

function Input({ inputs, setInputs, step, setStep, onDone, onBack }) {
  const total = INPUT_STEPS.length;
  const key = INPUT_STEPS[step];

  function patch(p) { setInputs({ ...inputs, ...p }); }
  function next() {
    if (step >= total - 1) onDone();
    else setStep(step + 1);
  }
  function back() {
    if (step === 0) onBack();
    else setStep(step - 1);
  }

  // Per-step validity
  const canAdvance = (() => {
    switch (key) {
      case "flights":
        return inputs.arrAirport && inputs.arrDate && inputs.arrTime &&
               inputs.depAirport && inputs.depDate && inputs.depTime;
      case "companions": return !!inputs.companions;
      case "lodging":    return !!inputs.lodging;
      case "mood":       return !!inputs.mood;
      case "categoryMain": return !!inputs.categoryMain;
      case "categorySub":  return !!inputs.categorySub && inputs.categorySub !== inputs.categoryMain;
      case "photo":      return !!inputs.photo;
      case "pace":       return !!inputs.pace && !!inputs.wake;
      case "transport":  return !!inputs.transport;
      case "stamina":    return !!inputs.stamina;
      case "food":       return !!inputs.food;
      case "budget":     return !!inputs.budget;
      default: return true;
    }
  })();

  return (
    <PhoneShell
      footer={
        <Cta onClick={next} disabled={!canAdvance}>
          {step >= total - 1 ? "캐릭터 빚기" : "다음"}
          <img src="ds/icons/arrow-right.svg"
               style={{ width: 18, height: 18, filter: "brightness(0) invert(1)" }} />
        </Cta>
      }
    >
      <ProgressBar step={step + 1} total={total} onBack={back} />
      <div style={{ padding: "8px 24px 24px", display: "flex",
                    flexDirection: "column", flex: 1, minHeight: 0 }}>
        <Card stepKey={key} inputs={inputs} patch={patch} />
      </div>
    </PhoneShell>
  );
}

// ───── Card renderer ─────────────────────────────────────────
function Card({ stepKey, inputs, patch }) {
  if (stepKey === "flights")      return <FlightsCard inputs={inputs} patch={patch} />;
  if (stepKey === "companions")   return <SimpleCard
    eyebrow="동행 유형" title={"누구와 함께\n가시나요?"}
    sub="동행에 따라 야간 일정과 동선 톤이 달라져요."
    items={OPT.companions.map((v) => ({ v, d: null }))}
    value={inputs.companions} onChange={(v) => patch({ companions: v })}
    big
  />;
  if (stepKey === "lodging")      return <LodgingCard inputs={inputs} patch={patch} />;
  if (stepKey === "mood")         return <SimpleCard
    eyebrow="분위기" title={"어떤 도쿄가\n끌리세요?"}
    sub="가장 마음에 가까운 한 곳을 고르면 돼요."
    items={OPT.moods}
    value={inputs.mood} onChange={(v) => patch({ mood: v })}
    grid
  />;
  if (stepKey === "categoryMain") return <CategoryCard
    title={"가장 끌리는\n한 가지는?"}
    sub="이 카테고리가 캐릭터와 동선의 50% 이상을 차지해요."
    eyebrow="관심 · 메인"
    value={inputs.categoryMain}
    onChange={(v) => patch({ categoryMain: v, ...(v === inputs.categorySub ? { categorySub: null } : {}) })}
  />;
  if (stepKey === "categorySub")  return <CategoryCard
    title={"하나 더\n섞고 싶은 건요?"}
    sub="메인과 다른 카테고리 1개를 1-2개 노드로 섞어드려요."
    eyebrow="관심 · 서브"
    value={inputs.categorySub}
    disabled={inputs.categoryMain}
    onChange={(v) => patch({ categorySub: v })}
  />;
  if (stepKey === "photo")        return <SimpleCard
    eyebrow="사진" title={"사진은\n얼마나 중요해요?"}
    sub="photogenic 점수가 동선 후보 가중치에 들어가요."
    items={OPT.photos}
    value={inputs.photo} onChange={(v) => patch({ photo: v })}
    big
  />;
  if (stepKey === "pace")         return <PaceCard inputs={inputs} patch={patch} />;
  if (stepKey === "transport")    return <SimpleCard
    eyebrow="이동 방식" title={"어떻게 이동\n할 거예요?"}
    sub="이동시간 한계치와 도보 비율을 자동 조정해요."
    items={OPT.transports}
    value={inputs.transport} onChange={(v) => patch({ transport: v })}
    big
  />;
  if (stepKey === "stamina")      return <SimpleCard
    eyebrow="체력" title={"오래 걸을 수\n있는 편이세요?"}
    sub="누적 피로도 한계치로 직접 들어가요."
    items={OPT.staminas}
    value={inputs.stamina} onChange={(v) => patch({ stamina: v })}
    big
  />;
  if (stepKey === "food")         return <SimpleCard
    eyebrow="식사" title={"끼니는\n어떻게 챙길까요?"}
    sub="필수로 두면 점심·저녁에 맛집 노드가 강제 배치돼요."
    items={OPT.foods}
    value={inputs.food} onChange={(v) => patch({ food: v })}
    big
  />;
  if (stepKey === "budget")       return <SimpleCard
    eyebrow="예산" title={"하루 활동비는\n어느 정도?"}
    sub="식사·카페·입장료 합계 기준 (숙소·항공 제외)."
    items={OPT.budgets}
    value={inputs.budget} onChange={(v) => patch({ budget: v })}
    big
  />;
  return null;
}

// ───── Generic simple-pick card (big single-col or 2-col grid) ─
function SimpleCard({ eyebrow, title, sub, items, value, onChange, big, grid }) {
  return (
    <>
      <Eyebrow>{eyebrow}</Eyebrow>
      <div style={{ height: 8 }} />
      <Heading><span style={{ whiteSpace: "pre-line" }}>{title}</span></Heading>
      {sub && (<><div style={{ height: 8 }} /><Sub>{sub}</Sub></>)}
      <div style={{ height: 22 }} />
      <div style={{
        flex: 1, display: grid ? "grid" : "flex",
        flexDirection: grid ? undefined : "column",
        gridTemplateColumns: grid ? "1fr 1fr" : undefined,
        gap: 10, overflow: "hidden",
      }}>
        {items.map((it) => {
          const v = typeof it === "string" ? it : it.v;
          const d = typeof it === "string" ? null : it.d;
          return (
            <PickCard
              key={v}
              title={v} desc={d}
              active={value === v}
              onClick={() => onChange(v)}
              big={!grid}
            />
          );
        })}
      </div>
    </>
  );
}

// ───── Flights card ──────────────────────────────────────────
function FlightsCard({ inputs, patch }) {
  return (
    <>
      <Eyebrow>항공편</Eyebrow>
      <div style={{ height: 8 }} />
      <Heading>{"입국 · 출국\n시간을 알려주세요"}</Heading>
      <div style={{ height: 8 }} />
      <Sub>박수는 자동으로 계산해드려요.</Sub>
      <div style={{ height: 20 }} />

      <FlightBlock
        label="입국" airport={inputs.arrAirport} date={inputs.arrDate} time={inputs.arrTime}
        onChange={(p) => patch(Object.fromEntries(Object.entries(p).map(([k, v]) => ["arr" + k, v])))}
      />
      <div style={{ height: 12 }} />
      <FlightBlock
        label="출국" airport={inputs.depAirport} date={inputs.depDate} time={inputs.depTime}
        onChange={(p) => patch(Object.fromEntries(Object.entries(p).map(([k, v]) => ["dep" + k, v])))}
      />

      {inputs.arrDate && inputs.depDate && (
        <div style={{
          marginTop: 18, padding: "12px 14px",
          background: "var(--w-bg-alternative)", borderRadius: 12,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--w-label-alternative)",
                          letterSpacing: "0.04em" }}>
            계산된 박수
          </span>
          <span style={{ fontFamily: "var(--w-font-display)", fontSize: 20,
                          fontWeight: 700, letterSpacing: "-0.015em" }}>
            {nights(inputs.arrDate, inputs.depDate)}박{" "}
            {nights(inputs.arrDate, inputs.depDate) + 1}일
          </span>
        </div>
      )}
    </>
  );
}

function nights(a, b) {
  if (!a || !b) return 0;
  const da = new Date(a), db = new Date(b);
  return Math.max(0, Math.round((db - da) / (1000*60*60*24)));
}

function FlightBlock({ label, airport, date, time, onChange }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid var(--w-line-normal)",
      borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--w-label-alternative)",
                    letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {OPT.airports.map((a) => (
          <button key={a} onClick={() => onChange({ Airport: a })}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 10,
              border: "1px solid " + (airport === a ? "var(--w-primary)" : "var(--w-line-normal)"),
              background: airport === a ? "var(--w-blue-99)" : "#fff",
              fontSize: 14, fontWeight: 700,
              color: airport === a ? "var(--w-primary)" : "var(--w-label-normal)",
              cursor: "pointer", letterSpacing: "0.03em",
            }}>
            {a} <span style={{
              fontSize: 11, fontWeight: 500, color: "var(--w-label-alternative)",
              marginLeft: 4,
            }}>
              {a === "NRT" ? "나리타" : "하네다"}
            </span>
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input type="date"
          value={date || ""}
          onChange={(e) => onChange({ Date: e.target.value })}
          style={inputStyle()}
        />
        <input type="time"
          value={time || ""}
          onChange={(e) => onChange({ Time: e.target.value })}
          style={{ ...inputStyle(), maxWidth: 120 }}
        />
      </div>
    </div>
  );
}

function inputStyle() {
  return {
    flex: 1, padding: "10px 12px", borderRadius: 10,
    border: "1px solid var(--w-line-normal)",
    fontFamily: "var(--w-font-sans)", fontSize: 14,
    color: "var(--w-label-normal)",
    background: "#fff",
    outline: "none",
  };
}

// ───── Lodging card ──────────────────────────────────────────
function LodgingCard({ inputs, patch }) {
  const numNights = (inputs.arrDate && inputs.depDate)
    ? Math.max(0, Math.round((new Date(inputs.depDate) - new Date(inputs.arrDate)) / (1000*60*60*24)))
    : null;

  return (
    <>
      <Eyebrow>숙소 위치</Eyebrow>
      <div style={{ height:8 }} />
      <Heading>{"숙소가 있는\n권역을 골라주세요"}</Heading>
      <div style={{ height:8 }} />
      <Sub>선택한 권역을 기준으로 동선 이동 시간을 계산해요.</Sub>

      {numNights !== null && (
        <div style={{ marginTop:12, padding:'10px 16px', background:'var(--w-bg-alternative)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:12, fontWeight:700, color:'var(--w-label-alternative)', letterSpacing:'0.04em' }}>항공편 기준 일정</span>
          <span style={{ fontFamily:'var(--w-font-display)', fontSize:20, fontWeight:700, letterSpacing:'-0.015em' }}>
            {numNights}박 {numNights + 1}일
          </span>
        </div>
      )}

      <div style={{ height:20 }} />
      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
        {TOKYO_DISTRICTS.map((d) => (
          <button key={d.name}
            onClick={() => patch({ lodging: d.name })}
            style={{
              all:'unset', cursor:'pointer',
              padding:'10px 18px', borderRadius:9999,
              fontSize:14, fontWeight:700,
              background: inputs.lodging === d.name ? 'var(--w-cool-22)' : '#fff',
              color: inputs.lodging === d.name ? '#fff' : 'var(--w-label-normal)',
              border:'1px solid ' + (inputs.lodging === d.name ? 'var(--w-cool-22)' : 'var(--w-line-normal)'),
              transition:'all 120ms',
            }}>
            {d.name}
          </button>
        ))}
      </div>
    </>
  );
}

// ───── Category card (13 chips) ──────────────────────────────
function CategoryCard({ eyebrow, title, sub, value, onChange, disabled }) {
  return (
    <>
      <Eyebrow>{eyebrow}</Eyebrow>
      <div style={{ height: 8 }} />
      <Heading><span style={{ whiteSpace: "pre-line" }}>{title}</span></Heading>
      <div style={{ height: 8 }} />
      <Sub>{sub}</Sub>
      <div style={{ height: 22 }} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignContent: "flex-start" }}>
        {OPT.categories.map((c) => {
          const isDisabled = disabled === c;
          const isActive = value === c;
          return (
            <button key={c} onClick={() => !isDisabled && onChange(c)}
              disabled={isDisabled}
              style={{
                all: "unset", cursor: isDisabled ? "not-allowed" : "pointer",
                padding: "10px 14px", borderRadius: 9999,
                fontSize: 13, fontWeight: 700, letterSpacing: "0.01em",
                background: isActive ? "var(--w-cool-22)"
                          : isDisabled ? "transparent" : "#fff",
                color: isActive ? "#fff"
                     : isDisabled ? "var(--w-label-disable)" : "var(--w-label-normal)",
                border: "1px solid " + (isActive ? "var(--w-cool-22)"
                                       : isDisabled ? "var(--w-line-alternative)"
                                       : "var(--w-line-normal)"),
                opacity: isDisabled ? 0.5 : 1,
                transition: "all 120ms",
                textDecoration: isDisabled ? "line-through" : "none",
              }}>
              {c}
            </button>
          );
        })}
      </div>
      {disabled && (
        <div style={{
          marginTop: "auto", padding: "10px 14px",
          background: "var(--w-bg-alternative)", borderRadius: 10,
          fontSize: 12, color: "var(--w-label-alternative)", fontWeight: 500,
        }}>
          메인으로 고른 <b style={{ color: "var(--w-label-normal)" }}>{disabled}</b>는 제외돼요.
        </div>
      )}
    </>
  );
}

// ───── Pace + wake card (single screen, 2 questions) ─────────
function PaceCard({ inputs, patch }) {
  return (
    <>
      <Eyebrow>페이스 · 기상</Eyebrow>
      <div style={{ height: 8 }} />
      <Heading>{"하루 페이스는\n어느 정도가 좋아요?"}</Heading>
      <div style={{ height: 8 }} />
      <Sub>하루 노드 수와 시작 시간이 함께 결정돼요.</Sub>
      <div style={{ height: 20 }} />

      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--w-label-alternative)",
                    letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>
        페이스
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
        {OPT.paces.map((p) => (
          <PickCard key={p.v} title={p.v} desc={p.d}
            active={inputs.pace === p.v}
            onClick={() => patch({ pace: p.v })} big />
        ))}
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--w-label-alternative)",
                    letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>
        기상 패턴
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {OPT.wakes.map((w) => (
          <PickCard key={w.v} title={w.v} desc={w.d}
            active={inputs.wake === w.v}
            onClick={() => patch({ wake: w.v })} big={false} />
        ))}
      </div>
    </>
  );
}

Object.assign(window, { Input, INPUT_STEPS });
