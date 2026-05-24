// Landing screen
function Landing({ onStart }) {
  return (
    <PhoneShell scroll={false}>
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        position: "relative", overflow: "hidden",
        background: "linear-gradient(168deg, #FFF1E2 0%, #FFFBF5 50%, #FFFFFF 100%)",
      }}>
        {/* Floating orbs as bg decoration */}
        <div style={{ position: "absolute", top: 30, right: -30 }}>
          <CharacterOrb hi="#ffe5a8" mid="#ff7a3a" lo="#8a2400" size={140} label={null} />
        </div>
        <div style={{ position: "absolute", top: 180, left: -32 }}>
          <CharacterOrb hi="#dccfff" mid="#9a7df0" lo="#4226a8" size={90} label={null} />
        </div>
        <div style={{ position: "absolute", top: 264, right: 56 }}>
          <CharacterOrb hi="#bcefe0" mid="#3fc6a6" lo="#0e6f5d" size={62} label={null} />
        </div>
        <div style={{ position: "absolute", top: 350, left: 80 }}>
          <CharacterOrb hi="#ffd6e8" mid="#f06aa2" lo="#7a1454" size={52} label={null} />
        </div>

        {/* Bottom-anchored content */}
        <div style={{
          marginTop: "auto", padding: "32px 28px 36px",
          position: "relative", zIndex: 2,
          background: "linear-gradient(180deg, transparent 0%, #FFFBF5 32%, #FFFFFF 80%)",
        }}>
          <Eyebrow tone="accent">도시 감정 큐레이터</Eyebrow>
          <div style={{ height: 12 }} />
          <h1 style={{
            fontFamily: "var(--w-font-display)", fontWeight: 700,
            fontSize: 32, lineHeight: 1.18, letterSpacing: "-0.028em",
            margin: 0, color: "var(--w-label-normal)",
            textWrap: "balance",
          }}>
            당신의 도쿄는<br/>어떤 표정인가요?
          </h1>
          <div style={{ height: 14 }} />
          <Sub>
            12개의 가벼운 질문이면,<br/>
            당신만의 도쿄 캐릭터와<br/>
            3박 4일 동선을 빚어드려요.
          </Sub>
          <div style={{ height: 28 }} />
          <Cta onClick={onStart}>
            내 도쿄 시작하기
            <img src="ds/icons/arrow-right.svg"
                 style={{ width: 18, height: 18, filter: "brightness(0) invert(1)" }} />
          </Cta>
          <div style={{ marginTop: 14, textAlign: "center" }}>
            <span style={{
              fontSize: 12, fontWeight: 700,
              color: "var(--w-label-alternative)",
            }}>
              지금까지{" "}
              <span style={{ color: "var(--w-accent-redorange)" }}>12,847명</span>
              이 자기 캐릭터를 받았어요
            </span>
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}

Object.assign(window, { Landing });
