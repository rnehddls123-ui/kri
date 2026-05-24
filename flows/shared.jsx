// shared.jsx — small atoms used by both flows
const { useState } = React;

// Phone scaffolding
function PhoneShell({ children, dark = false, title }) {
  return (
    <IOSDevice width={380} height={780} dark={dark} title={title === undefined ? null : title}>
      <div className={"ts-screen" + (dark ? " ts-screen--ink" : "")}>{children}</div>
    </IOSDevice>
  );
}

function TopBar({ progress, count, onBack = true, dark = false }) {
  return (
    <div className="ts-topbar">
      {onBack !== false ? (
        <div className="ts-topbar__back"><img src="ds/icons/chevron-left.svg" alt="back" /></div>
      ) : <div style={{ width: 24 }} />}
      {progress !== undefined && (
        <div className="ts-progress">
          <div className="ts-progress__fill" style={{ width: (progress * 100) + "%" }} />
        </div>
      )}
      {count && <div className="ts-progress__count">{count}</div>}
    </div>
  );
}

function Icon({ name, size = 16, dim = 0.75, brand }) {
  return (
    <img src={"ds/icons/" + name + ".svg"} alt=""
         style={{
           width: size, height: size,
           filter: brand ? "none" : "brightness(0)",
           opacity: dim,
         }} />
  );
}

// CTA group — primary, optional secondary
function CtaStack({ primary, onPrimary, secondary, accent, ink }) {
  const cls = "ts-cta " + (accent ? "ts-cta--accent " : "") + (ink ? "ts-cta--ink " : "");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 12 }}>
      <button className={cls.trim()} onClick={onPrimary}>{primary}
        <img src="ds/icons/arrow-right.svg"
             style={{ width: 18, height: 18, filter: "brightness(0) invert(1)" }} />
      </button>
      {secondary && <button className="ts-cta ts-cta--ghost">{secondary}</button>}
    </div>
  );
}

// District/area mock — used in maps
const TOKYO_AREAS = [
  { name: "시모키타자와", lat: 0.38, lng: 0.22 },
  { name: "신주쿠",      lat: 0.42, lng: 0.36 },
  { name: "하라주쿠",    lat: 0.50, lng: 0.42 },
  { name: "오모테산도",  lat: 0.54, lng: 0.46 },
  { name: "시부야",      lat: 0.55, lng: 0.38 },
  { name: "긴자",        lat: 0.55, lng: 0.62 },
  { name: "마루노우치",  lat: 0.50, lng: 0.58 },
  { name: "츠키지",      lat: 0.60, lng: 0.62 },
  { name: "아사쿠사",    lat: 0.32, lng: 0.74 },
  { name: "우에노",      lat: 0.34, lng: 0.68 },
  { name: "야네센",      lat: 0.30, lng: 0.62 },
  { name: "아키하바라",  lat: 0.40, lng: 0.64 },
  { name: "이케부쿠로",  lat: 0.30, lng: 0.32 },
  { name: "롯폰기",      lat: 0.60, lng: 0.46 },
];

// Pretty map mock with optional path
function TokyoMapMock({ path = [], pins = [], highlight }) {
  return (
    <svg viewBox="0 0 280 200" style={{ width: "100%", height: "100%", display: "block" }}>
      {/* faux roads */}
      <g stroke="#dadce0" strokeWidth="1.2" fill="none" opacity="0.7">
        <path d="M0 80 Q 80 90, 140 78 T 280 86" />
        <path d="M0 120 Q 90 110, 160 130 T 280 124" />
        <path d="M40 0 Q 60 80, 90 130 T 110 200" />
        <path d="M180 0 Q 170 70, 200 130 T 220 200" />
      </g>
      {/* river-ish */}
      <path d="M210 0 Q 220 60, 200 100 T 230 200"
            stroke="#cfe1f5" strokeWidth="5" fill="none" opacity="0.6" />
      {/* Yamanote line ring */}
      <ellipse cx="140" cy="100" rx="80" ry="58" stroke="#c8e3b8" strokeWidth="2" fill="none"
               opacity="0.55" strokeDasharray="3,3"/>
      {/* district pins */}
      {TOKYO_AREAS.map((a, i) => {
        const x = a.lng * 280, y = a.lat * 200;
        const isHi = highlight === a.name;
        return (
          <g key={a.name} opacity={isHi ? 1 : 0.55}>
            <circle cx={x} cy={y} r={isHi ? 5 : 3}
                    fill={isHi ? "var(--w-primary)" : "#9aa0a6"} />
            <text x={x + 7} y={y + 3} fontSize="7" fontWeight="700"
                  fill={isHi ? "var(--w-primary)" : "#5f6368"}
                  fontFamily="var(--w-font-sans)">{a.name}</text>
          </g>
        );
      })}
      {/* path */}
      {path.length > 1 && (
        <g>
          <polyline
            fill="none"
            stroke="var(--w-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="0"
            points={path.map(p => (p.x * 280) + "," + (p.y * 200)).join(" ")}
          />
          {path.map((p, i) => (
            <g key={i}>
              <circle cx={p.x * 280} cy={p.y * 200} r="7" fill="#fff" stroke="var(--w-primary)" strokeWidth="2.5" />
              <text x={p.x * 280} y={p.y * 200 + 3} fontSize="8" fontWeight="700"
                    textAnchor="middle" fill="var(--w-primary)"
                    fontFamily="var(--w-font-sans)">{i + 1}</text>
            </g>
          ))}
        </g>
      )}
      {pins.map((p, i) => (
        <circle key={"pin"+i} cx={p.x * 280} cy={p.y * 200} r="5"
                fill="var(--w-accent-redorange)" stroke="#fff" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

// Hypothesis brief card (used as wide artboards at top of each section)
function Brief({ tag, kind, title, sub, hyp, kpi, risk }) {
  return (
    <div className={"brief brief--" + kind}>
      <div className="brief__tag">{tag}</div>
      <h2 className="brief__title">{title}</h2>
      <p className="brief__sub">{sub}</p>
      <div className="brief__grid">
        <div className="brief__cell">
          <h4>핵심 가설</h4>
          <p>{hyp}</p>
        </div>
        <div className="brief__cell">
          <h4>검증 지표</h4>
          <p>{kpi}</p>
        </div>
        <div className="brief__cell">
          <h4>핵심 리스크</h4>
          <p>{risk}</p>
        </div>
      </div>
    </div>
  );
}

// Discussion prompt card (used at end of each section)
function Prompt({ kind, items }) {
  return (
    <div className={"brief brief--" + kind} style={{ width: 380 }}>
      <div className="brief__tag">팀 디스커션 프롬프트</div>
      <ul style={{ margin: 0, padding: "0 0 0 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((it, i) => (
          <li key={i} style={{
            fontSize: 13, lineHeight: 1.55, color: "var(--w-label-normal)",
            fontWeight: 500
          }}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

Object.assign(window, { PhoneShell, TopBar, Icon, CtaStack, TokyoMapMock, TOKYO_AREAS, Brief, Prompt });
