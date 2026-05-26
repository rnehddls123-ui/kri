// Input screen — 12 cards in sequence, all reading/writing the same `inputs` state.

const INPUT_STEPS = [
  "flights", "companions", "lodging",
  "mood", "category",
  "pace", "transport", "budget",
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
      case "lodging": {
        const lgs = inputs.lodgings;
        if (lgs && lgs.length > 0) return lgs.every(l => !!l.area);
        return !!inputs.lodging;
      }
      case "mood":       return !!inputs.mood;
      case "category":   return !!(inputs.categoryMain && inputs.categorySub);
      case "pace":       return !!inputs.pace && !!inputs.wake;
      case "transport":  return !!inputs.transport;
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
  if (stepKey === "category")     return <CategoryBothCard inputs={inputs} patch={patch} />;
  if (stepKey === "pace")         return <PaceCard inputs={inputs} patch={patch} />;
  if (stepKey === "transport")    return <SimpleCard
    eyebrow="이동 방식" title={"어떻게 이동\n할 거예요?"}
    sub="이동시간 한계치와 도보 비율을 자동 조정해요."
    items={OPT.transports}
    value={inputs.transport} onChange={(v) => patch({ transport: v })}
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
      background: "var(--w-bg-elevated)", border: "1px solid var(--w-line-normal)",
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
              background: airport === a ? "var(--w-blue-99)" : "var(--w-bg-elevated)",
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
    background: "var(--w-bg-elevated)",
    outline: "none",
  };
}

// ───── Lodging card (supports 1 or 2 lodging areas) ─────────
function LodgingCard({ inputs, patch }) {
  const numNights = (inputs.arrDate && inputs.depDate)
    ? Math.max(1, Math.round((new Date(inputs.depDate) - new Date(inputs.arrDate)) / (1000*60*60*24)))
    : null;

  // Normalize lodgings into array
  const lodgings = (inputs.lodgings && inputs.lodgings.length > 0)
    ? inputs.lodgings
    : inputs.lodging
      ? [{ area: inputs.lodging, nights: numNights || 1 }]
      : [];

  const hasTwo = lodgings.length >= 2;

  function setArea(idx, area) {
    const updated = lodgings.map((l, i) => i === idx ? { ...l, area } : l);
    if (updated.length === 0) updated.push({ area, nights: numNights || 1 });
    patch({ lodgings: updated, lodging: updated[0]?.area || null });
  }

  function setNights1(nights) {
    if (!numNights || nights < 1 || nights >= numNights) return;
    const updated = [
      { ...(lodgings[0] || {}), nights },
      { ...(lodgings[1] || {}), nights: numNights - nights },
    ];
    patch({ lodgings: updated, lodging: updated[0]?.area || null });
  }

  function addSecond() {
    const n1 = Math.max(1, Math.floor((numNights || 2) / 2));
    const n2 = (numNights || 2) - n1;
    const updated = [
      { ...(lodgings[0] || { area: null }), nights: n1 },
      { area: null, nights: n2 },
    ];
    patch({ lodgings: updated, lodging: updated[0]?.area || null });
  }

  function removeSec() {
    const updated = [{ ...(lodgings[0] || { area: null }), nights: numNights || 1 }];
    patch({ lodgings: updated, lodging: updated[0]?.area || null });
  }

  // When user selects area for the very first slot (no lodgings yet)
  function selectFirst(area) {
    const updated = [{ area, nights: numNights || 1 }];
    patch({ lodgings: updated, lodging: area });
  }

  return (
    <>
      <Eyebrow>숙소 위치</Eyebrow>
      <div style={{ height:8 }} />
      <Heading>{"숙소가 있는\n권역을 골라주세요"}</Heading>
      <div style={{ height:8 }} />
      <Sub>권역 기준으로 동선 이동 시간을 계산해요.</Sub>

      {numNights !== null && (
        <div style={{ marginTop:12, padding:'10px 16px', background:'var(--w-bg-alternative)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:12, fontWeight:700, color:'var(--w-label-alternative)', letterSpacing:'0.04em' }}>항공편 기준</span>
          <span style={{ fontFamily:'var(--w-font-display)', fontSize:20, fontWeight:700, letterSpacing:'-0.015em' }}>
            {numNights}박 {numNights + 1}일
          </span>
        </div>
      )}

      <div style={{ height:14 }} />

      {/* Lodging 1 */}
      <LodgingSlot
        label={hasTwo ? `숙소 1 · ${lodgings[0]?.nights || 1}박` : '숙소 권역'}
        selectedArea={lodgings[0]?.area || null}
        onSelectArea={lodgings.length === 0 ? selectFirst : (a) => setArea(0, a)}
        nights={hasTwo ? (lodgings[0]?.nights || 1) : null}
        onSetNights={hasTwo ? setNights1 : null}
        minNights={1}
        maxNights={hasTwo ? (numNights || 2) - 1 : null}
      />

      {hasTwo && (
        <>
          <div style={{ margin:'12px 0', display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ flex:1, height:1, background:'var(--w-line-alternative)' }} />
            <span style={{ fontSize:10, fontWeight:700, color:'var(--w-label-disable)', letterSpacing:'0.05em' }}>체크아웃 후 이동</span>
            <div style={{ flex:1, height:1, background:'var(--w-line-alternative)' }} />
          </div>
          <LodgingSlot
            label={`숙소 2 · ${lodgings[1]?.nights || 1}박`}
            selectedArea={lodgings[1]?.area || null}
            onSelectArea={(a) => setArea(1, a)}
            nights={null}
            onSetNights={null}
          />
          <button onClick={removeSec}
            style={{ all:'unset', cursor:'pointer', marginTop:10, fontSize:12, fontWeight:700, color:'var(--w-label-alternative)', display:'flex', alignItems:'center', gap:4 }}>
            <span>✕</span>
            <span style={{ textDecoration:'underline' }}>숙소 나누기 취소</span>
          </button>
        </>
      )}

      {!hasTwo && numNights && numNights > 1 && (
        <button onClick={addSecond}
          style={{ all:'unset', cursor:'pointer', marginTop:14, width:'100%', boxSizing:'border-box', padding:'12px 16px', borderRadius:12, border:'1.5px dashed var(--w-line-strong)', display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontSize:13, fontWeight:700, color:'var(--w-label-alternative)' }}>
          <span style={{ fontSize:16 }}>+</span>
          <span>숙소 추가 · 권역 이동 여정</span>
        </button>
      )}
    </>
  );
}

// ───── Single lodging slot (area chips + optional nights stepper) ─
function LodgingSlot({ label, selectedArea, onSelectArea, nights, onSetNights, minNights, maxNights }) {
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <span style={{ fontSize:11, fontWeight:700, color:'var(--w-label-alternative)', letterSpacing:'0.05em', textTransform:'uppercase' }}>
          {label}
        </span>
        {onSetNights && nights != null && (
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <button
              onClick={() => onSetNights(nights - 1)}
              disabled={nights <= (minNights || 1)}
              style={{ all:'unset', cursor: nights <= (minNights || 1) ? 'not-allowed' : 'pointer', width:26, height:26, borderRadius:7, background:'var(--w-fill-normal)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color: nights <= (minNights || 1) ? 'var(--w-label-disable)' : 'var(--w-label-normal)' }}>
              −
            </button>
            <span style={{ fontSize:13, fontWeight:700, minWidth:24, textAlign:'center', letterSpacing:'-0.01em' }}>{nights}박</span>
            <button
              onClick={() => onSetNights(nights + 1)}
              disabled={maxNights != null && nights >= maxNights}
              style={{ all:'unset', cursor: maxNights != null && nights >= maxNights ? 'not-allowed' : 'pointer', width:26, height:26, borderRadius:7, background:'var(--w-fill-normal)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color: maxNights != null && nights >= maxNights ? 'var(--w-label-disable)' : 'var(--w-label-normal)' }}>
              +
            </button>
          </div>
        )}
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
        {TOKYO_DISTRICTS.map((d) => (
          <button key={d.name}
            onClick={() => onSelectArea(d.name)}
            style={{
              all:'unset', cursor:'pointer',
              padding:'8px 14px', borderRadius:9999,
              fontSize:13, fontWeight:700,
              background: selectedArea === d.name ? 'var(--w-cool-22)' : 'var(--w-bg-elevated)',
              color: selectedArea === d.name ? '#fff' : 'var(--w-label-normal)',
              border:'1px solid ' + (selectedArea === d.name ? 'var(--w-cool-22)' : 'var(--w-line-normal)'),
              transition:'all 120ms',
            }}>
            {d.name}
          </button>
        ))}
      </div>
    </div>
  );
}

// ───── Category card — Main + Sub on one screen ──────────────
// Phase 1: no main selected → pick main (all chips normal, tap → dark/filled = main)
// Phase 2: main set, no sub → tap another → becomes sub (accent). main chip goes muted.
// Reset: tap main chip → clears both. Tap sub chip → clears sub only.
function CategoryBothCard({ inputs, patch }) {
  const main = inputs.categoryMain;
  const sub  = inputs.categorySub;

  function handleChip(c) {
    if (c === main) {
      patch({ categoryMain: null, categorySub: null });
    } else if (c === sub) {
      patch({ categorySub: null });
    } else if (!main) {
      patch({ categoryMain: c, categorySub: null });
    } else {
      patch({ categorySub: c });
    }
  }

  const phaseTitle = !main
    ? "가장 끌리는\n취향은?"
    : !sub
    ? "하나 더\n섞어볼까요?"
    : "취향 조합\n완성! ✓";

  const phaseSub = !main
    ? "첫 번째 선택이 캐릭터와 동선의 절반 이상을 결정해요."
    : !sub
    ? `메인 "${main}" 고정 · 서브를 하나 더 골라요.`
    : `"${main}" + "${sub}" 조합으로 맞춤 동선을 짜드려요.`;

  return (
    <>
      <Eyebrow>관심 · 취향</Eyebrow>
      <div style={{ height:8 }} />
      <Heading><span style={{ whiteSpace:'pre-line' }}>{phaseTitle}</span></Heading>
      <div style={{ height:8 }} />
      <Sub>{phaseSub}</Sub>

      {/* Selected summary */}
      {(main || sub) && (
        <div style={{ marginTop:12, display:'flex', gap:6, alignItems:'center', padding:'8px 12px', borderRadius:10, background:'var(--w-bg-alternative)' }}>
          {main && (
            <span style={{ fontSize:10, fontWeight:700, color:'var(--w-label-alternative)', letterSpacing:'0.04em' }}>메인</span>
          )}
          {main && <CategoryTag cat={main} size='sm' />}
          {sub && <span style={{ fontSize:10, color:'var(--w-label-disable)' }}>+</span>}
          {sub && (
            <>
              <span style={{ fontSize:10, fontWeight:700, color:'var(--w-label-alternative)', letterSpacing:'0.04em' }}>서브</span>
              <CategoryTag cat={sub} size='sm' />
            </>
          )}
        </div>
      )}

      <div style={{ height:16 }} />

      <div style={{ display:'flex', flexWrap:'wrap', gap:7, alignContent:'flex-start' }}>
        {OPT.categories.map((c) => {
          const isMain = c === main;
          const isSub  = c === sub;
          const catC   = (typeof CAT_COLOR !== 'undefined' ? CAT_COLOR : {})[c] || {};

          let style;
          if (isMain && sub) {
            style = { background:'var(--w-fill-normal)', color:'var(--w-label-disable)', border:'1px solid var(--w-line-alternative)', opacity:0.5 };
          } else if (isMain) {
            style = { background:'var(--w-cool-22)', color:'#fff', border:'1px solid var(--w-cool-22)' };
          } else if (isSub) {
            style = { background: catC.bg||'var(--w-fill-normal)', color: catC.color||'var(--w-label-normal)', border:'1.5px solid '+(catC.dot||'var(--w-line-normal)') };
          } else {
            style = { background:'var(--w-bg-elevated)', color:'var(--w-label-normal)', border:'1px solid var(--w-line-normal)' };
          }

          return (
            <button key={c} onClick={() => handleChip(c)}
              style={{
                all:'unset', cursor:'pointer', boxSizing:'border-box',
                padding:'9px 13px', borderRadius:9999,
                fontSize:12, fontWeight:700, letterSpacing:'0.01em',
                display:'flex', alignItems:'center', gap:5,
                transition:'all 120ms',
                ...style,
              }}>
              {!isMain && !isSub && catC.dot && (
                <span style={{ width:6, height:6, borderRadius:'50%', background:catC.dot, flexShrink:0 }} />
              )}
              {c}
              {isMain && <span style={{ fontSize:8, fontWeight:800, opacity:0.7 }}>메인</span>}
              {isSub  && <span style={{ fontSize:8, fontWeight:800, opacity:0.8 }}>서브</span>}
            </button>
          );
        })}
      </div>
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
