// shell.jsx — phone shell + reusable atoms for the prototype
const { useState, useEffect, useRef, useMemo } = React;

// ── Shared API helpers ─────────────────────────────────────────
async function callAnthropic(messages, system, model = "claude-haiku-4-5-20251001", maxTokens = 512) {
  const key = window.__apiKeys?.anthropic;
  if (!key) throw new Error("No Anthropic key");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }
  return res.json();
}

async function callOpenAI(body) {
  const key = window.__apiKeys?.openai;
  if (!key) throw new Error("No OpenAI key");
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }
  return res.json();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ───── Device wrapper ─────────────────────────────────────────
function PhoneShell({ children, dark = false, footer, scroll = true, overlay }) {
  return (
    <IOSDevice width={390} height={820} dark={dark}>
      <div className={"ts-screen" + (dark ? " ts-screen--ink" : "")}>
        <div style={{ height: 48, flexShrink: 0 }} />
        <div style={{
          flex: 1, minHeight: 0,
          overflowY: scroll ? "auto" : "hidden",
          overflowX: "hidden",
          display: "flex", flexDirection: "column",
        }}>
          {children}
        </div>
        {footer && (
          <div style={{
            flexShrink: 0,
            padding: "12px 20px 18px",
            borderTop: dark
              ? "1px solid rgba(255,255,255,0.06)"
              : "1px solid var(--w-line-alternative)",
            background: dark ? "var(--w-cool-15)" : "var(--w-bg-normal)",
          }}>
            {footer}
          </div>
        )}
        {overlay}
      </div>
    </IOSDevice>
  );
}

// ───── Top bar with progress (Input screens) ──────────────────
function ProgressBar({ step, total, onBack, dark }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 20px 14px",
      flexShrink: 0,
    }}>
      <button onClick={onBack}
        style={{
          width: 30, height: 30, border: 0, padding: 0,
          background: "transparent", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginLeft: -6,
        }}>
        <img src="ds/icons/chevron-left.svg"
             style={{ width: 22, height: 22,
                      filter: dark ? "brightness(0) invert(1)" : "brightness(0)",
                      opacity: 0.78 }} />
      </button>
      <div style={{
        flex: 1, height: 3, borderRadius: 9999,
        background: dark ? "rgba(255,255,255,0.10)" : "var(--w-fill-normal)",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%", borderRadius: 9999,
          background: dark ? "#fff" : "var(--w-cool-22)",
          width: ((step / total) * 100) + "%",
          transition: "width 320ms cubic-bezier(.4,0,.2,1)",
        }} />
      </div>
      <div style={{
        fontSize: 12, fontWeight: 700, letterSpacing: "0.04em",
        color: dark ? "rgba(255,255,255,0.6)" : "var(--w-label-alternative)",
        fontFamily: "var(--w-font-mono)",
      }}>
        {step} / {total}
      </div>
    </div>
  );
}

// Simple back-only bar (Character, Itinerary, etc)
function PageBar({ onBack, title, right, dark }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 14px 12px",
      flexShrink: 0,
    }}>
      <button onClick={onBack} style={{
        width: 36, height: 36, border: 0, padding: 0,
        background: "transparent", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <img src="ds/icons/chevron-left.svg"
             style={{ width: 22, height: 22,
                      filter: dark ? "brightness(0) invert(1)" : "brightness(0)",
                      opacity: 0.78 }} />
      </button>
      <div style={{ flex: 1, textAlign: "center", fontSize: 14, fontWeight: 700,
                    color: dark ? "#fff" : "var(--w-label-normal)" }}>
        {title}
      </div>
      <div style={{ width: 36, height: 36, display: "flex",
                    alignItems: "center", justifyContent: "center" }}>
        {right}
      </div>
    </div>
  );
}

// ───── CTA button ─────────────────────────────────────────────
function Cta({ children, onClick, variant = "primary", disabled, full = true, leading }) {
  const styles = {
    primary: { background: "var(--w-cool-22)", color: "#fff" },
    accent:  { background: "var(--w-accent-redorange)", color: "#fff" },
    blue:    { background: "var(--w-primary)", color: "#fff" },
    ghost:   { background: "var(--w-fill-normal)", color: "var(--w-label-normal)" },
    outline: { background: "#fff", color: "var(--w-label-normal)",
               boxShadow: "0 0 0 1px var(--w-line-normal) inset" },
  };
  return (
    <button onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        ...styles[variant],
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        border: 0, borderRadius: 14,
        padding: "16px 22px",
        width: full ? "100%" : undefined,
        fontFamily: "var(--w-font-sans)", fontWeight: 700, fontSize: 16,
        letterSpacing: "-0.005em",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        transition: "transform 100ms",
      }}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = "scale(0.985)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
    >
      {leading}
      {children}
    </button>
  );
}

// ───── Pick card (used in input screens) ──────────────────────
function PickCard({ title, desc, active, onClick, big = true }) {
  return (
    <button onClick={onClick}
      style={{
        all: "unset", boxSizing: "border-box",
        display: "flex", flexDirection: "column", gap: big ? 4 : 6,
        padding: big ? "16px 18px" : "14px 14px",
        background: active ? "var(--w-blue-99)" : "#fff",
        border: "1px solid " + (active ? "var(--w-primary)" : "var(--w-line-normal)"),
        boxShadow: active ? "0 0 0 1px var(--w-primary) inset" : "none",
        borderRadius: 14,
        cursor: "pointer",
        position: "relative",
        transition: "background 150ms, border-color 150ms",
      }}>
      <div style={{
        fontSize: big ? 16 : 14, fontWeight: 700, letterSpacing: "-0.005em",
        color: "var(--w-label-normal)",
      }}>{title}</div>
      {desc && (
        <div style={{
          fontSize: big ? 13 : 12, fontWeight: 500,
          color: "var(--w-label-alternative)", lineHeight: 1.5,
        }}>{desc}</div>
      )}
      {active && (
        <div style={{
          position: "absolute", top: 14, right: 14,
          width: 20, height: 20, borderRadius: 9999,
          background: "var(--w-primary)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <img src="ds/icons/check.svg"
                style={{ width: 12, height: 12, filter: "brightness(0) invert(1)" }} />
        </div>
      )}
    </button>
  );
}

// ───── Chip ───────────────────────────────────────────────────
function Chip({ children, active, onClick, tone = "neutral" }) {
  const tones = {
    neutral: { bg: "var(--w-fill-normal)", color: "var(--w-label-normal)" },
    brand:   { bg: "rgba(0,102,255,0.10)", color: "var(--w-primary)" },
    accent:  { bg: "rgba(255,94,0,0.10)", color: "var(--w-accent-redorange)" },
    ink:     { bg: "var(--w-cool-22)", color: "#fff" },
    outline: { bg: "transparent", color: "var(--w-label-alternative)",
               border: "1px solid var(--w-line-normal)" },
  };
  const t = tones[tone];
  return (
    <span onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "6px 10px", borderRadius: 9999,
        fontSize: 12, fontWeight: 700, letterSpacing: "0.012em",
        background: active ? "var(--w-cool-22)" : t.bg,
        color: active ? "#fff" : t.color,
        border: t.border || "none",
        cursor: onClick ? "pointer" : "default",
        whiteSpace: "nowrap",
        transition: "background 120ms",
      }}>
      {children}
    </span>
  );
}

// ───── Character orb — supports real imageUrl from DALL-E 3 ───
function CharacterOrb({ hi, mid, lo, size = 120, label = "DALL-E 3", imageUrl }) {
  if (imageUrl) {
    return (
      <div style={{
        width: size, height: size, borderRadius: size * 0.22,
        overflow: "hidden", position: "relative",
        boxShadow: `0 ${size*0.04}px ${size*0.14}px rgba(0,0,0,0.22)`,
      }}>
        <img src={imageUrl} alt="AI Character"
             style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        {label && (
          <div style={{
            position: "absolute", left: 10, bottom: 10,
            fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
            color: "rgba(0,0,0,0.42)", textTransform: "uppercase",
            background: "rgba(255,255,255,0.72)",
            padding: "3px 6px", borderRadius: 4,
          }}>{label}</div>
        )}
      </div>
    );
  }

  // Gradient orb placeholder (no image)
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.22,
      background: `radial-gradient(circle at 32% 28%, ${hi} 0%, ${mid} 45%, ${lo} 100%)`,
      position: "relative", overflow: "hidden",
      boxShadow: `inset 0 -${size*0.07}px ${size*0.18}px rgba(0,0,0,0.20), inset 0 ${size*0.04}px ${size*0.10}px rgba(255,255,255,0.32)`,
    }}>
      {/* highlight */}
      <div style={{
        position: "absolute", top: "14%", left: "22%",
        width: "22%", height: "22%", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,255,255,0.7), rgba(255,255,255,0))",
        filter: "blur(2px)",
      }} />
      {label && (
        <div style={{
          position: "absolute", left: 10, bottom: 10,
          fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
          color: "rgba(0,0,0,0.42)", textTransform: "uppercase",
          background: "rgba(255,255,255,0.55)",
          padding: "3px 6px", borderRadius: 4,
        }}>{label}</div>
      )}
    </div>
  );
}

// ───── Tokyo map (with optional path + click handler) ─────────
const TOKYO_DISTRICTS = [
  { name: "시모키타자와", x: 0.18, y: 0.45 },
  { name: "신주쿠",      x: 0.24, y: 0.42 },
  { name: "하라주쿠",    x: 0.28, y: 0.52 },
  { name: "오모테산도",  x: 0.32, y: 0.55 },
  { name: "시부야",      x: 0.27, y: 0.58 },
  { name: "다이칸야마",  x: 0.32, y: 0.62 },
  { name: "롯폰기",      x: 0.42, y: 0.58 },
  { name: "긴자",        x: 0.62, y: 0.58 },
  { name: "마루노우치",  x: 0.55, y: 0.55 },
  { name: "츠키지",      x: 0.58, y: 0.71 },
  { name: "아사쿠사",    x: 0.62, y: 0.38 },
  { name: "우에노",      x: 0.46, y: 0.64 },
  { name: "야네센",      x: 0.47, y: 0.58 },
  { name: "아키하바라",  x: 0.52, y: 0.58 },
  { name: "이케부쿠로",  x: 0.20, y: 0.32 },
];

function TokyoMap({ pins = [], path = [], highlight, onPin, height = "100%", showLabels = true }) {
  const W = 280, H = 200;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height, display: "block" }}>
      {/* roads */}
      <g stroke="#dadce0" strokeWidth="1.2" fill="none" opacity="0.7">
        <path d="M0 80 Q 80 90, 140 78 T 280 86" />
        <path d="M0 120 Q 90 110, 160 130 T 280 124" />
        <path d="M40 0 Q 60 80, 90 130 T 110 200" />
        <path d="M180 0 Q 170 70, 200 130 T 220 200" />
      </g>
      {/* Sumida river */}
      <path d="M205 0 Q 220 60, 200 100 T 230 200"
            stroke="#cfe1f5" strokeWidth="6" fill="none" opacity="0.65" />
      {/* Yamanote */}
      <ellipse cx="140" cy="100" rx="80" ry="58"
               stroke="#c8e3b8" strokeWidth="2" fill="none"
               opacity="0.55" strokeDasharray="3,3"/>

      {/* districts */}
      {TOKYO_DISTRICTS.map((d) => {
        const x = d.x * W, y = d.y * H;
        const isHi = highlight === d.name;
        return (
          <g key={d.name} opacity={isHi ? 1 : 0.5}>
            <circle cx={x} cy={y} r={isHi ? 4 : 2.5}
                    fill={isHi ? "var(--w-primary)" : "#9aa0a6"} />
            {showLabels && (
              <text x={x + 5} y={y + 2.5} fontSize="6.5" fontWeight="700"
                    fill={isHi ? "var(--w-primary)" : "#5f6368"}
                    fontFamily="var(--w-font-sans)">{d.name}</text>
            )}
          </g>
        );
      })}

      {/* path */}
      {path.length > 1 && (
        <polyline
          fill="none"
          stroke="var(--w-primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={path.map(p => (p.x * W) + "," + (p.y * H)).join(" ")}
        />
      )}

      {/* numbered pins */}
      {pins.map((p, i) => {
        const x = p.x * W, y = p.y * H;
        return (
          <g key={p.id + i} onClick={onPin ? () => onPin(p, i) : undefined}
             style={{ cursor: onPin ? "pointer" : "default" }}>
            <circle cx={x} cy={y} r="9" fill="#fff"
                    stroke="var(--w-primary)" strokeWidth="2.5" />
            <text x={x} y={y + 3.2} fontSize="9" fontWeight="700"
                  textAnchor="middle" fill="var(--w-primary)"
                  fontFamily="var(--w-font-sans)">{p.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ───── Headings ───────────────────────────────────────────────
function Eyebrow({ children, tone = "default" }) {
  const c = tone === "accent" ? "var(--w-accent-redorange)"
          : tone === "brand"  ? "var(--w-primary)"
          : "var(--w-label-alternative)";
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
      textTransform: "uppercase", color: c,
    }}>{children}</div>
  );
}
function Heading({ children, display, dark }) {
  return (
    <h1 style={{
      fontFamily: display ? "var(--w-font-display)" : "var(--w-font-sans)",
      fontSize: display ? 28 : 24,
      fontWeight: 700,
      letterSpacing: display ? "-0.025em" : "-0.018em",
      lineHeight: 1.25,
      color: dark ? "#fff" : "var(--w-label-normal)",
      margin: 0,
      textWrap: "balance",
    }}>{children}</h1>
  );
}
function Sub({ children, dark }) {
  return (
    <p style={{
      fontSize: 14, fontWeight: 500, lineHeight: 1.55,
      color: dark ? "rgba(255,255,255,0.62)" : "var(--w-label-alternative)",
      margin: 0,
    }}>{children}</p>
  );
}

Object.assign(window, {
  PhoneShell, ProgressBar, PageBar, Cta, PickCard, Chip,
  CharacterOrb, TokyoMap, TOKYO_DISTRICTS,
  Eyebrow, Heading, Sub,
  callAnthropic, callOpenAI, sleep,
});
