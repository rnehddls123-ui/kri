// flow-b.jsx — Hypothesis B: 동선 실측 퍼스트
// 가설: 사용자는 AI가 만든 일정을 못 믿는다(할루시네이션 공포).
//      Google Places 실측 데이터와 9단계 알고리즘 투명성을 보여줘야
//      "저장·공유·결제"로 전환된다. 캐릭터는 작은 라벨로만 노출.

// ── B1 · Landing ──────────────────────────────────────────────
function B1_Landing() {
  return (
    <PhoneShell>
      <TopBar onBack={false} />
      <div className="ts-body" style={{ paddingTop: 4, justifyContent: "space-between" }}>
        <div>
          <div className="ts-eyebrow" style={{ marginBottom: 14 }}>
            Tokyo travel engine
          </div>
          <h1 className="ts-h1 ts-h1--display" style={{ marginBottom: 14 }}>
            도쿄 3박 4일,<br/>실측으로 짜드려요.
          </h1>
          <p className="ts-sub" style={{ marginBottom: 24 }}>
            14개 입력 · Google Places 실측 · 9단계 알고리즘.<br/>
            AI 추측이 아니라, 검증된 데이터로 만든 동선.
          </p>

          {/* mini map mock */}
          <div className="ts-map" style={{ marginBottom: 16 }}>
            <TokyoMapMock
              path={[
                { x: 0.42, y: 0.36 }, { x: 0.55, y: 0.38 }, { x: 0.50, y: 0.58 },
                { x: 0.34, y: 0.68 }, { x: 0.30, y: 0.62 },
              ]}
              highlight="우에노"
            />
            <div style={{
              position: "absolute", left: 12, bottom: 12,
              background: "rgba(255,255,255,0.92)", padding: "6px 10px",
              borderRadius: 8, fontSize: 11, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 9999,
                              background: "var(--w-primary)", display: "inline-block" }} />
              26개 권역 · 평균 동선 12.4km
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 24 }}>
            {[
              { n: "4.0+", l: "평점만 후보" },
              { n: "±5분", l: "이동시간 오차" },
              { n: "100%", l: "영업시간 검증" },
            ].map((s, i) => (
              <div key={i} style={{
                padding: 12, borderRadius: 12,
                background: "var(--w-bg-alternative)",
                textAlign: "center",
              }}>
                <div style={{
                  fontFamily: "var(--w-font-display)", fontWeight: 700, fontSize: 20,
                  color: "var(--w-primary)", letterSpacing: "-0.01em",
                }}>{s.n}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--w-label-alternative)",
                              letterSpacing: "0.04em", marginTop: 2 }}>
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className="ts-cta">
          동선 만들기
          <img src="ds/icons/arrow-right.svg"
               style={{ width: 18, height: 18, filter: "brightness(0) invert(1)" }} />
        </button>
      </div>
    </PhoneShell>
  );
}

// ── B2 · Data input ──────────────────────────────────────────
function B2_Input() {
  return (
    <PhoneShell>
      <TopBar progress={5/14} count="5 / 14" />
      <div className="ts-body ts-body--scroll" style={{ paddingTop: 0 }}>
        <div className="ts-eyebrow" style={{ marginBottom: 8 }}>체력 · 페이스</div>
        <h1 className="ts-h1" style={{ marginBottom: 6 }}>
          하루에 얼마나<br/>걸을 수 있어요?
        </h1>
        <p className="ts-sub" style={{ marginBottom: 18 }}>
          누적 피로도 한계치를 알고리즘에 직접 반영해요.
        </p>

        {/* Slider — fatigue cap */}
        <div className="ts-card" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div className="ts-caption">FATIGUE CAP</div>
            <div style={{
              fontFamily: "var(--w-font-display)", fontSize: 28, fontWeight: 700,
              letterSpacing: "-0.02em",
            }}>
              7.0 <span style={{ fontSize: 13, color: "var(--w-label-alternative)" }}>/ 10</span>
            </div>
          </div>
          <div className="ts-slider">
            <div className="ts-slider__fill" style={{ width: "70%" }} />
            <div className="ts-slider__thumb" style={{ left: "70%" }} />
          </div>
          <div className="ts-slider__ticks">
            <span>낮음 (5)</span><span>보통 (7)</span><span>높음 (10)</span>
          </div>
          <div style={{
            marginTop: 14, padding: "10px 12px",
            background: "var(--w-bg-alternative)", borderRadius: 10,
            fontSize: 12, color: "var(--w-label-alternative)", lineHeight: 1.55,
          }}>
            → 하루 평균 노드 <b style={{ color: "var(--w-label-normal)" }}>3개</b>,
            도보 비율 <b style={{ color: "var(--w-label-normal)" }}>40%</b>로 자동 조정.
          </div>
        </div>

        {/* Pace */}
        <div className="ts-caption" style={{ marginBottom: 8 }}>페이스</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
          {[
            { t: "빡빡하게", s: "하루 4~5곳, 일찍 시작", on: false },
            { t: "보통", s: "하루 2~3곳, 점심부터", on: true },
            { t: "여유롭게", s: "하루 1~2곳, 한 곳에 오래", on: false },
          ].map((o, i) => (
            <div key={i} className={"ts-radio" + (o.on ? " is-active" : "")}>
              <div>
                <div className="ts-radio__title">{o.t}</div>
                <div className="ts-radio__sub">{o.s}</div>
              </div>
              <div style={{
                width: 20, height: 20, borderRadius: 9999,
                border: "2px solid " + (o.on ? "var(--w-primary)" : "var(--w-line-normal)"),
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {o.on && <div style={{ width: 10, height: 10, borderRadius: 9999, background: "var(--w-primary)" }} />}
              </div>
            </div>
          ))}
        </div>

        <button className="ts-cta">다음</button>
      </div>
    </PhoneShell>
  );
}

// ── B3 · 알고리즘 라이브 (투명성) ────────────────────────────
function B3_Live() {
  const steps = [
    { n: "1", t: "전처리", d: "체력보통 · 페이스보통 · 예산보통", s: "done" },
    { n: "2", t: "활동 가능 시간 계산", d: "NRT T1 도착 14:30 → 16:30 시작", s: "done" },
    { n: "3", t: "일자별 노드 수 결정", d: "3 / 4 / 4 / 2 (출국일 단축)", s: "done" },
    { n: "4", t: "권역 할당", d: "우에노 → 시모키타 → 시부야 → 긴자", s: "done" },
    { n: "5", t: "동선 뼈대 구성", d: "권역 진입 이동시간 산출 중", s: "active" },
    { n: "6", t: "노드 스코어링", d: "메인 카테고리 가중 1.0, 서브 0.4", s: "pending" },
    { n: "7", t: "Fatigue 검증", d: "누적 한계치 7.0", s: "pending" },
    { n: "8", t: "시간 배치", d: "영업시간 충돌 검증", s: "pending" },
    { n: "9", t: "이동 정보 확정", d: "Distance Matrix API", s: "pending" },
  ];
  return (
    <PhoneShell dark>
      <TopBar onBack={false} dark />
      <div className="ts-body" style={{ paddingTop: 6, color: "#fff" }}>
        <div className="ts-eyebrow" style={{ marginBottom: 8, color: "var(--w-blue-70)" }}>
          ALGORITHM · LIVE
        </div>
        <h1 className="ts-h1" style={{ color: "#fff", marginBottom: 16 }}>
          9단계로<br/>동선을 짜는 중
        </h1>

        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div className="ts-log" style={{ flex: 1, overflow: "hidden",
                paddingTop: 6, fontFamily: "var(--w-font-mono)", color: "rgba(255,255,255,0.65)" }}>
            {steps.map((s, i) => {
              const color =
                s.s === "done" ? "var(--w-status-positive)"
                : s.s === "active" ? "var(--w-blue-70)"
                : "rgba(255,255,255,0.32)";
              return (
                <div key={i} style={{
                  padding: "10px 0",
                  borderBottom: i < steps.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  display: "flex", gap: 12, alignItems: "flex-start",
                }}>
                  <div style={{
                    minWidth: 24, height: 24, borderRadius: 6,
                    background: s.s === "done" ? "rgba(0,191,64,0.15)"
                            : s.s === "active" ? "rgba(0,102,255,0.18)" : "rgba(255,255,255,0.05)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color,
                  }}>
                    {s.s === "done" ? "✓" : s.n}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color,
                                  fontFamily: "var(--w-font-sans)" }}>
                      {s.t}
                      {s.s === "active" && (
                        <span style={{ marginLeft: 6, fontWeight: 500, opacity: 0.6 }}>...</span>
                      )}
                    </div>
                    {s.s !== "pending" && (
                      <div style={{ fontSize: 11, marginTop: 2,
                                    color: "rgba(255,255,255,0.55)",
                                    fontFamily: "var(--w-font-mono)" }}>
                        → {s.d}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{
          padding: "12px 14px", borderRadius: 12,
          background: "rgba(0,102,255,0.12)",
          border: "1px solid rgba(0,102,255,0.25)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginTop: 12,
        }}>
          <div style={{ fontSize: 12, color: "var(--w-blue-70)", fontWeight: 700 }}>
            노드 후보 248개 → 14개 선정
          </div>
          <div style={{ fontFamily: "var(--w-font-display)", fontSize: 22, fontWeight: 700,
                        color: "#fff", letterSpacing: "-0.02em" }}>
            5 / 9
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}

// ── B4 · 일정 reveal (map + timeline) ────────────────────────
function B4_Itinerary() {
  return (
    <PhoneShell>
      <TopBar />
      <div className="ts-body ts-body--scroll" style={{ paddingTop: 0, paddingBottom: 24 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                      marginBottom: 10 }}>
          <div>
            <div className="ts-eyebrow">DAY 1 · 토요일 11/22</div>
            <h2 className="ts-h2" style={{ marginTop: 2 }}>우에노 · 야네센</h2>
          </div>
          <span className="ts-chip ts-chip--outline">갬성충</span>
        </div>

        {/* Day tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          {[
            { d: "1", on: true }, { d: "2" }, { d: "3" }, { d: "4" },
          ].map((t, i) => (
            <div key={i} style={{
              flex: 1, padding: "8px 0", textAlign: "center", borderRadius: 8,
              background: t.on ? "var(--w-cool-22)" : "var(--w-bg-alternative)",
              color: t.on ? "#fff" : "var(--w-label-alternative)",
              fontSize: 12, fontWeight: 700,
            }}>
              DAY {t.d}
            </div>
          ))}
        </div>

        {/* Map */}
        <div className="ts-map" style={{ marginBottom: 16 }}>
          <TokyoMapMock
            path={[
              { x: 0.46, y: 0.86 }, { x: 0.50, y: 0.68 }, { x: 0.34, y: 0.68 },
              { x: 0.30, y: 0.62 }, { x: 0.46, y: 0.86 },
            ]}
            highlight="우에노"
          />
          <div style={{
            position: "absolute", left: 12, top: 12,
            background: "rgba(255,255,255,0.95)", padding: "6px 10px",
            borderRadius: 8, fontSize: 11, fontWeight: 700,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <img src="ds/icons/location.svg" className="ts-icon" />
            5.2 km · 도보 38%
          </div>
          <div style={{
            position: "absolute", right: 12, top: 12,
            background: "var(--w-primary)", color: "#fff",
            padding: "6px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700,
          }}>
            4개 장소
          </div>
        </div>

        {/* Day-level info bar */}
        <div style={{
          display: "flex", padding: "12px 14px", marginBottom: 16,
          background: "var(--w-bg-alternative)", borderRadius: 12,
          fontSize: 11, fontWeight: 700, letterSpacing: "0.02em",
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: "var(--w-label-alternative)" }}>피로도</div>
            <div style={{ fontFamily: "var(--w-font-display)", fontSize: 18,
                          color: "var(--w-status-positive)", letterSpacing: "-0.01em" }}>5.5 / 7</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "var(--w-label-alternative)" }}>예상 지출</div>
            <div style={{ fontFamily: "var(--w-font-display)", fontSize: 18, letterSpacing: "-0.01em" }}>
              ¥12,400
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "var(--w-label-alternative)" }}>이동</div>
            <div style={{ fontFamily: "var(--w-font-display)", fontSize: 18, letterSpacing: "-0.01em" }}>
              82분
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="ts-tl">
          <div className="ts-tl__node">
            <div className="ts-tl__dot" style={{ borderColor: "var(--w-label-alternative)" }} />
            <div className="ts-tl__time">14:30 · NRT T1</div>
            <div className="ts-tl__title">나리타 공항 도착</div>
          </div>
          <div className="ts-tl__transit">
            <img src="ds/icons/arrow-down.svg" className="ts-icon" style={{ width: 12, height: 12 }} />
            나리타 익스프레스 · 70분 · ¥3,070
          </div>
          <div className="ts-tl__node">
            <div className="ts-tl__dot" style={{ borderColor: "var(--w-label-alternative)" }} />
            <div className="ts-tl__time">15:40 · 우에노</div>
            <div className="ts-tl__title">숙소 체크인</div>
            <div className="ts-tl__meta">
              <span>1시간</span><span>고정</span>
            </div>
          </div>
          <div className="ts-tl__transit">
            <img src="ds/icons/arrow-down.svg" className="ts-icon" style={{ width: 12, height: 12 }} />
            도보 · 8분
          </div>
          <div className="ts-tl__node">
            <div className="ts-tl__dot" />
            <div className="ts-tl__time">17:00</div>
            <div className="ts-tl__title">Honke Ponta · 본가폰타</div>
            <div className="ts-tl__meta">
              <span><img src="ds/icons/star-fill.svg" className="ts-icon"
                          style={{ filter: "none", verticalAlign: "-2px", width: 11, height: 11 }} /> 4.4</span>
              <span>음식·맛집</span><span>¥2,800</span>
            </div>
          </div>
          <div className="ts-tl__transit">
            <img src="ds/icons/arrow-down.svg" className="ts-icon" style={{ width: 12, height: 12 }} />
            도보 · 12분
          </div>
          <div className="ts-tl__node">
            <div className="ts-tl__dot" />
            <div className="ts-tl__time">19:00</div>
            <div className="ts-tl__title">도쿄국립박물관 (야간개관)</div>
            <div className="ts-tl__meta">
              <span><img src="ds/icons/star-fill.svg" className="ts-icon"
                          style={{ filter: "none", verticalAlign: "-2px", width: 11, height: 11 }} /> 4.6</span>
              <span>예술·전시</span><span>¥1,000</span>
              <span style={{ color: "var(--w-status-cautionary)" }}>~21:00 마감</span>
            </div>
          </div>
        </div>

        <button className="ts-cta ts-cta--ghost" style={{ marginTop: 12, padding: "12px",
                fontSize: 13, gap: 6 }}>
          <img src="ds/icons/refresh.svg" className="ts-icon" />
          이 동선 다시 짜기
        </button>
      </div>
    </PhoneShell>
  );
}

// ── B5 · 노드 상세 (Google Places 메타) ──────────────────────
function B5_Node() {
  return (
    <PhoneShell>
      <TopBar />
      <div className="ts-body ts-body--scroll" style={{ paddingTop: 0, paddingBottom: 16 }}>
        {/* hero photo */}
        <div style={{
          width: "calc(100% + 48px)", marginLeft: -24, marginRight: -24,
          aspectRatio: "1.4 / 1", marginBottom: 16, position: "relative",
          background: "linear-gradient(135deg, #2a1e16 0%, #6b3a1a 60%, #c97a3d 100%)",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(circle at 30% 70%, rgba(255,200,140,0.4), transparent 60%)",
          }} />
          <div style={{
            position: "absolute", left: 16, bottom: 14,
            color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
            background: "rgba(0,0,0,0.4)", padding: "4px 8px", borderRadius: 6,
          }}>
            GOOGLE PLACES · place_id: ChIJN1t...
          </div>
        </div>

        <div className="ts-eyebrow" style={{ marginBottom: 6 }}>음식·맛집 · 우에노</div>
        <h1 className="ts-h1" style={{ marginBottom: 8, fontSize: 22 }}>
          Honke Ponta Honke 본가폰타
        </h1>
        <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <img src="ds/icons/star-fill.svg" style={{ width: 14, height: 14 }} />
            <span style={{ fontSize: 14, fontWeight: 700 }}>4.4</span>
            <span style={{ fontSize: 12, color: "var(--w-label-alternative)" }}>(1,284)</span>
          </div>
          <span style={{ color: "var(--w-label-disable)" }}>·</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--w-status-positive)" }}>
            영업 중
          </span>
          <span style={{ color: "var(--w-label-disable)" }}>·</span>
          <span style={{ fontSize: 12, color: "var(--w-label-alternative)" }}>~21:00 마감</span>
        </div>

        {/* Meta grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          {[
            { l: "예산레벨", v: "보통", s: "price_level 2" },
            { l: "평균 체류", v: "1.0h", s: "카테고리 기본값" },
            { l: "이동시간", v: "8분", s: "숙소→식당 도보" },
            { l: "리뷰 신선도", v: "30일", s: "최근 리뷰 14건" },
          ].map((m, i) => (
            <div key={i} className="ts-card ts-card--flat" style={{ padding: 12 }}>
              <div className="ts-caption">{m.l}</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2,
                            letterSpacing: "-0.005em" }}>{m.v}</div>
              <div style={{ fontSize: 10, color: "var(--w-label-assistive)",
                            fontFamily: "var(--w-font-mono)", marginTop: 2 }}>
                {m.s}
              </div>
            </div>
          ))}
        </div>

        {/* Recommendation reason */}
        <div className="ts-card" style={{
          padding: 14, marginBottom: 12,
          background: "rgba(0,102,255,0.05)",
          borderColor: "rgba(0,102,255,0.18)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <img src="ds/icons/sparkle-fill.svg" style={{ width: 14, height: 14 }} />
            <span className="ts-caption" style={{ color: "var(--w-primary)" }}>왜 추천했나</span>
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--w-label-normal)",
                        fontWeight: 500 }}>
            메인 카테고리 <b>음식·맛집</b> 가중 1.0 / 평점 4.4 / 관광지 밀도 낮음.<br/>
            <span style={{ color: "var(--w-label-alternative)" }}>
              "맛집 한 곳 위해 끝까지 가는" 갬성충 성향과 일치.
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="ts-cta ts-cta--ghost" style={{ flex: 1, padding: "12px" }}>
            <img src="ds/icons/refresh.svg" className="ts-icon" /> 비슷한 곳으로 교체
          </button>
          <button className="ts-cta" style={{ flex: 1, padding: "12px" }}>
            확정
          </button>
        </div>
      </div>
    </PhoneShell>
  );
}

// ── B6 · 검증 대시보드 ───────────────────────────────────────
function B6_Verify() {
  return (
    <PhoneShell>
      <TopBar />
      <div className="ts-body ts-body--scroll" style={{ paddingTop: 0, paddingBottom: 16 }}>
        <div className="ts-eyebrow" style={{ marginBottom: 6 }}>전체 일정 검증</div>
        <h1 className="ts-h1" style={{ marginBottom: 14 }}>
          3박 4일,<br/>검증 통과했어요
        </h1>

        {/* Big score */}
        <div className="ts-card ts-card--ink" style={{ padding: 18, marginBottom: 14 }}>
          <div className="ts-caption" style={{ color: "rgba(255,255,255,0.55)" }}>
            ALGORITHM SCORE
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
            <div style={{ fontFamily: "var(--w-font-display)", fontSize: 42, fontWeight: 700,
                          letterSpacing: "-0.02em", color: "#fff" }}>
              92
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>/ 100</div>
            <div style={{ marginLeft: "auto" }}>
              <span className="ts-chip" style={{
                background: "rgba(0,191,64,0.18)", color: "var(--w-green-50)",
              }}>최적 동선</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                        marginTop: 14, gap: 12 }}>
            {[
              { l: "총 비용", v: "¥48,200" },
              { l: "총 이동", v: "4h 12m" },
              { l: "도보 비율", v: "44%" },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)",
                              fontWeight: 700, letterSpacing: "0.04em" }}>{s.l}</div>
                <div style={{ fontSize: 13, color: "#fff", fontWeight: 700, marginTop: 2 }}>
                  {s.v}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Day-by-day gauges */}
        <div className="ts-card" style={{ padding: 16, marginBottom: 14 }}>
          <div className="ts-caption" style={{ marginBottom: 12 }}>일자별 누적 피로도</div>
          {[
            { d: "DAY 1", v: 5.5, cap: 7, ok: true },
            { d: "DAY 2", v: 6.2, cap: 7, ok: true },
            { d: "DAY 3", v: 6.8, cap: 7, ok: true, warn: true },
            { d: "DAY 4", v: 3.1, cap: 7, ok: true },
          ].map((d, i) => (
            <div key={i} style={{ padding: "10px 0",
                                  borderTop: i > 0 ? "1px solid var(--w-line-alternative)" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{d.d}</span>
                <span style={{ fontSize: 12, fontWeight: 700,
                               color: d.warn ? "var(--w-status-cautionary)" : "var(--w-label-alternative)",
                               fontFamily: "var(--w-font-mono)" }}>
                  {d.v} / {d.cap}
                </span>
              </div>
              <div className="ts-gauge">
                <div className="ts-gauge__fill" style={{ width: (d.v / d.cap * 100) + "%" }} />
              </div>
            </div>
          ))}
        </div>

        {/* Character footer label */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 12px", background: "var(--w-bg-alternative)", borderRadius: 12,
          marginBottom: 16,
        }}>
          <div className="ts-orb" style={{
            "--orb-hi": "#ffe5a8", "--orb-mid": "#ff7a3a", "--orb-lo": "#8a2400",
            width: 28, height: 28, borderRadius: 9,
          }} />
          <div style={{ flex: 1, fontSize: 11, color: "var(--w-label-alternative)" }}>
            <span style={{ color: "var(--w-label-normal)", fontWeight: 700 }}>갬성충</span>
            의 취향이 동선 스코어링에 반영됐어요
          </div>
          <img src="ds/icons/chevron-right.svg" style={{ width: 16, opacity: 0.5 }} />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="ts-cta ts-cta--ghost" style={{ flex: 1, padding: 14 }}>
            저장
          </button>
          <button className="ts-cta" style={{ flex: 1.6 }}>
            동선 공유하기
            <img src="ds/icons/arrow-right.svg"
                 style={{ width: 18, height: 18, filter: "brightness(0) invert(1)" }} />
          </button>
        </div>
      </div>
    </PhoneShell>
  );
}

Object.assign(window, {
  B1_Landing, B2_Input, B3_Live, B4_Itinerary, B5_Node, B6_Verify,
});
