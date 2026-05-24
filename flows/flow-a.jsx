// flow-a.jsx — Hypothesis A: 캐릭터 퍼스트
// 가설: 일정이 아닌 "도쿄에서의 나"라는 정체성을 받을 때 사용자가 강하게 attach하고
//      캐릭터 카드 자체가 공유/바이럴/결제의 핵심 트리거가 된다.

// ── A1 · Landing ──────────────────────────────────────────────
function A1_Landing() {
  return (
    <PhoneShell>
      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column",
                    background: "linear-gradient(170deg, #FFF5EC 0%, #FFFFFF 55%)" }}>
        <TopBar onBack={false} />
        {/* floating character orbs */}
        <div style={{ position: "absolute", top: 80, right: -30,
                      width: 140, height: 140,
                      "--orb-hi": "#ffe5a8", "--orb-mid": "#ff9a3c", "--orb-lo": "#c4470a"
                    }} className="ts-orb" />
        <div style={{ position: "absolute", top: 220, left: -22,
                      width: 92, height: 92,
                      "--orb-hi": "#dbcfff", "--orb-mid": "#9a7df0", "--orb-lo": "#4f33a8"
                    }} className="ts-orb" />
        <div style={{ position: "absolute", top: 320, right: 36,
                      width: 64, height: 64,
                      "--orb-hi": "#bcefe0", "--orb-mid": "#3fc6a6", "--orb-lo": "#0e6f5d"
                    }} className="ts-orb" />

        <div style={{ flex: 1, display: "flex", flexDirection: "column",
                      justifyContent: "flex-end", padding: "24px 28px 36px" }}>
          <div className="ts-eyebrow ts-eyebrow--accent" style={{ marginBottom: 14 }}>
            도쿄에서의 나, 한 줄로
          </div>
          <h1 className="ts-h1 ts-h1--display" style={{ marginBottom: 10 }}>
            당신의 도쿄는<br/>어떤 표정인가요?
          </h1>
          <p className="ts-sub" style={{ marginBottom: 28 }}>
            14개의 질문이면, 당신만의 도쿄 캐릭터를 빚어드려요.<br/>
            그리고 캐릭터가 직접 다닌 3박 4일도요.
          </p>
          <button className="ts-cta ts-cta--ink">
            내 캐릭터 찾기
            <img src="ds/icons/arrow-right.svg"
                 style={{ width: 18, height: 18, filter: "brightness(0) invert(1)" }} />
          </button>
          <div style={{ textAlign: "center", marginTop: 14 }}>
            <span className="ts-caption" style={{ color: "var(--w-label-alternative)" }}>
              지금까지 <span style={{ color: "var(--w-accent-redorange)" }}>12,847명</span>이 자기 캐릭터를 받았어요
            </span>
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}

// ── A2 · Mood input ──────────────────────────────────────────
function A2_Input() {
  const picks = [
    { t: "번화가", d: "사람·간판·소음이\n좋아요", hi: "#ffd0c4", mid: "#ff6a3d", lo: "#8a1f00", on: true },
    { t: "골목·주택가", d: "맥락 있는 동네를\n걷는 게 좋아요", hi: "#ffe5a8", mid: "#ff9a3c", lo: "#7a3d00" },
    { t: "자연·공원", d: "초록 옆에서\n시간을 쓰고 싶어요", hi: "#c5e9bf", mid: "#5cb963", lo: "#1d5c2d" },
    { t: "복합", d: "그날의 기분 따라\n다 좋아요", hi: "#dccfff", mid: "#9a7df0", lo: "#4226a8" },
  ];
  return (
    <PhoneShell>
      <TopBar progress={3/14} count="3 / 14" />
      <div className="ts-body">
        <div className="ts-eyebrow" style={{ marginBottom: 10 }}>분위기</div>
        <h1 className="ts-h1" style={{ marginBottom: 8 }}>
          어떤 도쿄에<br/>가까운가요?
        </h1>
        <p className="ts-sub" style={{ marginBottom: 22 }}>
          가장 마음 끌리는 한 곳을 골라주세요.
        </p>
        <div className="ts-pickgrid" style={{ flex: 1 }}>
          {picks.map((p, i) => (
            <div key={i} className={"ts-pick" + (p.on ? " is-active" : "")}>
              <div className="ts-pick__art"
                   style={{ "--orb-hi": p.hi, "--orb-mid": p.mid, "--orb-lo": p.lo,
                            background: `radial-gradient(circle at 32% 28%, ${p.hi} 0%, ${p.mid} 45%, ${p.lo} 100%)`,
                            boxShadow: "inset 0 -10px 24px rgba(0,0,0,0.18), inset 0 6px 12px rgba(255,255,255,0.3)" }}>
              </div>
              <div>
                <div className="ts-pick__title">{p.t}</div>
                <div className="ts-pick__desc" style={{ whiteSpace: "pre-line" }}>{p.d}</div>
              </div>
              {p.on && (
                <div style={{
                  position: "absolute", top: 12, right: 12,
                  width: 22, height: 22, borderRadius: 9999,
                  background: "var(--w-primary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <img src="ds/icons/check.svg" style={{ width: 14, height: 14, filter: "brightness(0) invert(1)" }} />
                </div>
              )}
            </div>
          ))}
        </div>
        <button className="ts-cta" style={{ marginTop: 16 }}>다음</button>
      </div>
    </PhoneShell>
  );
}

// ── A3 · 생성중 ──────────────────────────────────────────────
function A3_Generating() {
  return (
    <PhoneShell>
      <div style={{ flex: 1, display: "flex", flexDirection: "column",
                    background: "radial-gradient(circle at 50% 30%, #FFE6D4 0%, #FFFFFF 65%)" }}>
        <TopBar onBack={false} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", padding: "0 32px" }}>
          {/* Pulsing orb */}
          <div style={{ position: "relative", width: 180, height: 180, marginBottom: 36 }}>
            <div style={{ position: "absolute", inset: -22, borderRadius: "50%",
                          border: "1px solid rgba(255,94,0,0.18)" }} />
            <div style={{ position: "absolute", inset: -44, borderRadius: "50%",
                          border: "1px solid rgba(255,94,0,0.10)" }} />
            <div className="ts-orb" style={{
              width: "100%", height: "100%",
              "--orb-hi": "#ffe5a8", "--orb-mid": "#ff7a3a", "--orb-lo": "#8a2400",
            }} />
          </div>
          <div className="ts-eyebrow ts-eyebrow--accent" style={{ marginBottom: 8 }}>
            STEP 3 / 5
          </div>
          <h1 className="ts-h1" style={{ textAlign: "center", marginBottom: 12 }}>
            당신의 캐릭터를<br/>빚는 중이에요
          </h1>
          <p className="ts-sub" style={{ textAlign: "center" }}>
            취향을 분석하고, 도쿄의 26개 권역 중<br/>
            가장 어울리는 한 곳을 고르고 있어요.
          </p>

          <div style={{ marginTop: 28, width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
            {["취향 키워드 추출", "권역 매칭", "캐릭터명 생성 (DALL-E)"].map((s, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 16px", borderRadius: 12,
                background: i < 2 ? "rgba(0,191,64,0.08)" : "rgba(255,94,0,0.10)",
              }}>
                <span style={{ fontSize: 13, fontWeight: 700,
                               color: i < 2 ? "var(--w-status-positive)" : "var(--w-accent-redorange)" }}>
                  {s}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700,
                               color: i < 2 ? "var(--w-status-positive)" : "var(--w-accent-redorange)" }}>
                  {i < 2 ? "완료" : "생성 중…"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}

// ── A4 · 캐릭터 reveal (메인 이벤트) ─────────────────────────
function A4_Reveal() {
  return (
    <PhoneShell dark>
      <TopBar dark />
      <div className="ts-body" style={{ paddingTop: 0 }}>
        <div className="ts-eyebrow ts-eyebrow--accent" style={{ marginBottom: 8 }}>
          당신의 도쿄 캐릭터
        </div>

        {/* Character orb — DALL-E render placeholder */}
        <div style={{
          background: "linear-gradient(160deg, #2a2a2e 0%, #1a1a1c 100%)",
          borderRadius: 24, padding: 22, marginBottom: 16,
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
          <div className="ts-orb" style={{
            "--orb-hi": "#ffe5a8", "--orb-mid": "#ff7a3a", "--orb-lo": "#8a2400",
            width: 168, height: 168, margin: "0 auto",
          }}>
            <div className="ts-orb__tag">DALL-E 3</div>
          </div>
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <div style={{
              fontFamily: "var(--w-font-display)", fontWeight: 700, fontSize: 22,
              lineHeight: 1.2, letterSpacing: "-0.02em", color: "#fff",
              textWrap: "balance",
            }}>
              우에노에서 먹방 찍는<br/>갬성충
            </div>
            <div style={{ marginTop: 10, display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
              <span className="ts-chip ts-chip--accent">#로컬식당탐험</span>
              <span className="ts-chip ts-chip--violet">#감성카페</span>
              <span className="ts-chip" style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}>#아침형</span>
            </div>
          </div>
        </div>

        <p className="ts-sub" style={{
          color: "rgba(255,255,255,0.7)", marginBottom: 16, lineHeight: 1.55,
          textAlign: "center", fontSize: 13,
        }}>
          맛집 한 곳을 위해 골목 끝까지 가는 사람.<br/>
          밥 먹다가 들른 갤러리를 더 오래 머무는 타입이에요.
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button className="ts-cta ts-cta--ghost" style={{
            flex: "0 0 auto", background: "rgba(255,255,255,0.08)", color: "#fff",
            padding: "14px 16px", display: "flex", gap: 8,
          }}>
            <img src="ds/icons/share.svg" style={{ width: 18, height: 18, filter: "brightness(0) invert(1)" }} />
            공유
          </button>
          <button className="ts-cta ts-cta--accent" style={{ flex: 1 }}>
            이 사람의 3박 4일 보기
            <img src="ds/icons/arrow-right.svg"
                 style={{ width: 18, height: 18, filter: "brightness(0) invert(1)" }} />
          </button>
        </div>
        <button className="ts-cta ts-cta--ghost" style={{
          background: "transparent", color: "rgba(255,255,255,0.5)",
          padding: 10, fontSize: 13, display: "flex", gap: 6,
        }}>
          <img src="ds/icons/refresh.svg" style={{ width: 14, height: 14,
                filter: "brightness(0) invert(1)", opacity: 0.5 }} />
          다른 캐릭터로 다시 빚기
        </button>
      </div>
    </PhoneShell>
  );
}

// ── A5 · 캐릭터 더 알기 + 소셜 ───────────────────────────────
function A5_Friends() {
  const friends = [
    { name: "민지", char: "시모키타에서 레코드 고르는\n카페인 중독자",
      hi: "#dccfff", mid: "#9a7df0", lo: "#4226a8" },
    { name: "도윤", char: "긴자에서 윈도우쇼핑 하는\n플렉스러",
      hi: "#bcefe0", mid: "#3fc6a6", lo: "#0e6f5d" },
    { name: "유진", char: "아키하바라에서 오픈런 하는\n찐덕후",
      hi: "#ffc4d6", mid: "#f053a0", lo: "#7a1454" },
  ];
  return (
    <PhoneShell>
      <TopBar />
      <div className="ts-body ts-body--scroll" style={{ paddingTop: 0 }}>
        <div className="ts-eyebrow ts-eyebrow--accent" style={{ marginBottom: 6 }}>
          AI가 본 당신
        </div>
        <h1 className="ts-h1" style={{ marginBottom: 18 }}>갬성충, 더 보기</h1>

        {/* 출몰 지역 */}
        <div className="ts-card" style={{ marginBottom: 14, padding: 16 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
            color: "var(--w-label-assistive)", textTransform: "uppercase", marginBottom: 12,
          }}>
            자주 출몰할 동네
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span className="ts-chip ts-chip--ink">우에노</span>
            <span className="ts-chip ts-chip--outline">야네센</span>
            <span className="ts-chip ts-chip--outline">키요스미시라카와</span>
            <span className="ts-chip ts-chip--outline">아사쿠사</span>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: "var(--w-label-alternative)", lineHeight: 1.55 }}>
            번화가보다 골목 맛집이 더 끌리는 사람.<br/>
            관광객 적은 식당가에서 1시간씩 머물러요.
          </div>
        </div>

        {/* 친구 캐릭터 비교 — 소셜 훅 */}
        <div className="ts-card" style={{ padding: 16, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
              color: "var(--w-label-assistive)", textTransform: "uppercase",
            }}>
              친구 캐릭터와 합치기
            </div>
            <span className="ts-chip ts-chip--brand">NEW</span>
          </div>
          {friends.map((f, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 0",
              borderTop: i > 0 ? "1px solid var(--w-line-alternative)" : "none",
            }}>
              <div className="ts-orb" style={{
                "--orb-hi": f.hi, "--orb-mid": f.mid, "--orb-lo": f.lo,
                width: 44, height: 44, borderRadius: 14,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: "var(--w-label-alternative)" }}>{f.name}</div>
                <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3, whiteSpace: "pre-line",
                              overflow: "hidden", textOverflow: "ellipsis" }}>
                  {f.char}
                </div>
              </div>
              <button style={{
                fontSize: 11, fontWeight: 700, color: "var(--w-primary)",
                background: "rgba(0,102,255,0.08)", border: 0,
                padding: "6px 10px", borderRadius: 9999, cursor: "pointer",
              }}>같이 갈래</button>
            </div>
          ))}
        </div>

        <CtaStack primary="갬성충의 3박 4일 보기" accent />
      </div>
    </PhoneShell>
  );
}

// ── A6 · 스토리북 일정 ───────────────────────────────────────
function A6_Story() {
  return (
    <PhoneShell>
      <TopBar />
      <div className="ts-body ts-body--scroll" style={{ paddingTop: 0, paddingBottom: 32 }}>
        {/* Mini character */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div className="ts-orb" style={{
            "--orb-hi": "#ffe5a8", "--orb-mid": "#ff7a3a", "--orb-lo": "#8a2400",
            width: 36, height: 36, borderRadius: 12,
          }} />
          <div>
            <div style={{ fontSize: 11, color: "var(--w-label-alternative)", fontWeight: 700 }}>
              갬성충의 도쿄
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.005em" }}>
              3박 4일 · 우에노 베이스
            </div>
          </div>
        </div>

        {/* Day 1 */}
        <div className="ts-card" style={{
          padding: 0, overflow: "hidden", marginBottom: 14,
        }}>
          <div style={{
            background: "linear-gradient(140deg, #FFE6D4 0%, #FFC79A 100%)",
            padding: "18px 18px 22px", color: "#4d1f00",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em" }}>
              DAY 1 · 토요일 · 우에노
            </div>
            <div style={{
              fontFamily: "var(--w-font-display)", fontSize: 22, fontWeight: 700,
              lineHeight: 1.25, letterSpacing: "-0.02em", marginTop: 4,
            }}>
              도착하자마자<br/>먹는 거부터 시작해요
            </div>
          </div>
          <div style={{ padding: 18, fontSize: 14, lineHeight: 1.65,
                        color: "var(--w-label-normal)", fontWeight: 500 }}>
            나리타에서 70분, 짐 풀자마자 우에노로 향해요.<br/>
            첫 끼는 100년 된 카츠동집에서 줄 서서 먹는 게 코스의 시작입니다.<br/>
            골목 끝 갤러리에서 한 시간, 디저트는 우에노공원 옆 카페에서.
          </div>
          <div style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { t: "Honke Ponta", c: "음식·맛집", time: "17:00" },
              { t: "도쿄국립박물관", c: "예술·전시", time: "19:00" },
              { t: "Kayaba Coffee", c: "카페·디저트", time: "20:30" },
            ].map((n, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", background: "var(--w-bg-alternative)",
                borderRadius: 12,
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 9999,
                  background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "var(--w-accent-redorange)",
                }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{n.t}</div>
                  <div style={{ fontSize: 11, color: "var(--w-label-alternative)", fontWeight: 500 }}>{n.c}</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--w-label-alternative)" }}>
                  {n.time}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Day 2 (collapsed) */}
        <div className="ts-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{
            background: "linear-gradient(140deg, #DCCFFF 0%, #B399FF 100%)",
            padding: "18px 18px 16px", color: "#2a1466",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em" }}>
                DAY 2 · 일요일 · 야네센
              </div>
              <div style={{ fontFamily: "var(--w-font-display)", fontSize: 18, fontWeight: 700,
                            lineHeight: 1.3, letterSpacing: "-0.02em", marginTop: 2 }}>
                골목을 천천히 줍는 날
              </div>
            </div>
            <img src="ds/icons/chevron-down.svg" style={{ width: 22, opacity: 0.6 }} />
          </div>
        </div>

        <div style={{ marginTop: 18, padding: "14px 18px",
                      background: "var(--w-bg-alternative)", borderRadius: 16,
                      display: "flex", alignItems: "center", gap: 10 }}>
          <img src="ds/icons/sparkle-fill.svg"
               style={{ width: 18, height: 18, filter: "none" }} />
          <div style={{ flex: 1, fontSize: 12, color: "var(--w-label-normal)", lineHeight: 1.5, fontWeight: 500 }}>
            갬성충의 동선은 보통 사람보다 <b>20% 느리게</b> 짜였어요.<br/>한 곳에 오래 머무는 타입이라.
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}

Object.assign(window, {
  A1_Landing, A2_Input, A3_Generating, A4_Reveal, A5_Friends, A6_Story,
});
