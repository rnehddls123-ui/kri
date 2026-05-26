// Place detail — slide-up sheet modal
function PlaceDetail({ placeId, character, onClose, onSwapPlace }) {
  const p = (window.__runtimePlaces || PLACES)[placeId];
  if (!p) return null;
  const [saved, setSaved] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem('kri_saved_places') || '[]');
      return s.includes(placeId);
    } catch { return false; }
  });
  const [toast, setToast] = useState(null);
  // animate in on mount
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(r);
  }, []);
  function close() {
    setOpen(false);
    setTimeout(onClose, 240);
  }

  function handleSave() {
    try {
      const s = JSON.parse(localStorage.getItem('kri_saved_places') || '[]');
      if (!saved) {
        const updated = [...s.filter(id => id !== placeId), placeId];
        localStorage.setItem('kri_saved_places', JSON.stringify(updated));
        setSaved(true);
        setToast('저장됐어요 ✓');
      } else {
        const updated = s.filter(id => id !== placeId);
        localStorage.setItem('kri_saved_places', JSON.stringify(updated));
        setSaved(false);
        setToast('저장 해제됐어요');
      }
    } catch { setToast('저장 실패'); }
  }

  function handleSwap() {
    if (!onSwapPlace) return;
    const places = window.__runtimePlaces || PLACES;
    const same = Object.entries(places)
      .filter(([id, pl]) => id !== placeId && pl.category === p.category)
      .sort((a, b) => (b[1].rating || 0) - (a[1].rating || 0));
    if (same.length === 0) { setToast('비슷한 장소가 없어요'); return; }
    const next = same[0][0];
    setToast(`${places[next].name}으로 교체할게요`);
    setTimeout(() => { onSwapPlace(placeId, next); close(); }, 900);
  }

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 100,
      pointerEvents: "auto",
    }}>
      {/* dimmer */}
      <div onClick={close} style={{
        position: "absolute", inset: 0,
        background: "rgba(23,23,25,0.52)",
        opacity: open ? 1 : 0, transition: "opacity 220ms ease",
      }} />
      {/* sheet */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0,
        height: "86%",
        background: "var(--w-bg-normal)",
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        overflow: "hidden", display: "flex", flexDirection: "column",
        transform: open ? "translateY(0)" : "translateY(100%)",
        transition: "transform 280ms cubic-bezier(.4,0,.2,1)",
      }}>
        {/* drag handle */}
        <div style={{ flexShrink: 0, padding: "10px 0 4px",
                      display: "flex", justifyContent: "center" }}>
          <div style={{ width: 38, height: 4, borderRadius: 9999,
                        background: "rgba(0,0,0,0.18)" }} />
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          {/* hero — real photo when available, plain header otherwise */}
          {p.photoUrl ? (
            <div style={{
              margin: "8px 16px 0", height: 168, borderRadius: 18,
              position: "relative", overflow: "hidden",
            }}>
              <img src={p.photoUrl} alt={p.name}
                style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
              <div style={{
                position: "absolute", left: 14, bottom: 12,
                padding: "5px 9px", borderRadius: 6,
                background: "rgba(0,0,0,0.52)", color: "#fff",
                fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
                fontFamily: "var(--w-font-mono)",
              }}>
                📍 GOOGLE MAPS LIVE
              </div>
              <button onClick={close} style={{
                position: "absolute", top: 12, right: 12,
                width: 32, height: 32, borderRadius: 9999, border: 0,
                background: "rgba(20,20,28,0.80)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <img src="ds/icons/close.svg" style={{ width: 16, height: 16 }} />
              </button>
            </div>
          ) : (
            /* No photo — compact header row, no gradient box */
            <div style={{
              margin: "4px 16px 0", padding: "6px 4px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
                color: "var(--w-label-alternative)", fontFamily: "var(--w-font-mono)",
                padding: "4px 8px", borderRadius: 6,
                background: "var(--w-fill-normal)",
              }}>
                {p.source === 'gmaps' ? '📍 GOOGLE MAPS LIVE' : 'GOOGLE PLACES'}
              </span>
              <button onClick={close} style={{
                width: 32, height: 32, borderRadius: 9999, border: 0,
                background: "var(--w-fill-normal)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <img src="ds/icons/close.svg" style={{ width: 16, height: 16 }} />
              </button>
            </div>
          )}

          <div style={{ padding: "18px 22px 24px" }}>
            <Eyebrow>{p.category} · {p.region}</Eyebrow>
            <div style={{ height: 8 }} />
            <Heading>{p.name}</Heading>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10,
                          fontSize: 13, fontWeight: 500, color: "var(--w-label-alternative)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3,
                              color: "var(--w-label-normal)" }}>
                <img src="ds/icons/star-fill.svg" style={{ width: 13, height: 13 }} />
                <b>{p.rating}</b>
                <span style={{ color: "var(--w-label-alternative)" }}>
                  ({p.reviews.toLocaleString()})
                </span>
              </span>
              <span style={{ color: "var(--w-label-disable)" }}>·</span>
              <span style={{ color: "var(--w-status-positive)", fontWeight: 700 }}>영업 중</span>
              <span style={{ color: "var(--w-label-disable)" }}>·</span>
              <span>예산 {p.price}</span>
            </div>

            <div style={{ height: 18 }} />

            {/* Stay stat */}
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontFamily:'var(--w-font-mono)', fontSize:18, fontWeight:700, color:'var(--w-label-normal)' }}>{p.stay}분</span>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--w-label-assistive)' }}>평균 체류</span>
            </div>

            <div style={{ height: 20 }} />

            {/* Data grid — 4 cells */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, borderRadius:12, overflow:'hidden', border:'1px solid var(--w-line-alternative)' }}>
              {[
                { l:'평점', v:`⭐ ${p.rating}` },
                { l:'리뷰', v:`${p.reviews.toLocaleString()}명` },
                { l:'영업시간', v:p.open },
                { l:'예산', v:p.price },
              ].map((d, i) => (
                <div key={i} style={{ padding:'10px 14px', background:i%2===0?'var(--w-bg-elevated)':'var(--w-bg-alternative)', borderRight:i%2===0?'1px solid var(--w-line-alternative)':undefined, borderBottom:i<2?'1px solid var(--w-line-alternative)':undefined }}>
                  <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--w-label-assistive)', marginBottom:4 }}>{d.l}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--w-label-normal)' }}>{d.v}</div>
                </div>
              ))}
            </div>

            <div style={{ height: 20 }} />

            {/* 정보 */}
            <SectionLabel>정보</SectionLabel>
            <p style={{
              fontSize: 13, lineHeight: 1.65, fontWeight: 500,
              color: "var(--w-label-normal)", margin: "8px 0 0", textWrap: "pretty",
            }}>
              {p.info}
            </p>

            <div style={{ height: 18 }} />

            {/* 추천이유 */}
            <div style={{
              padding: "14px 16px", borderRadius: 12,
              background: "var(--w-bg-alternative)",
              border: "1px solid var(--w-line-alternative)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <CharacterOrb hi={character.hi} mid={character.mid} lo={character.lo}
                  size={18} label={null} />
                <span style={{ fontSize: 10, fontWeight: 700,
                                letterSpacing: "0.06em", color: "var(--w-label-alternative)",
                                textTransform: "uppercase" }}>
                  {character.name.split(" 하는 ")[1] || "당신"}에게
                </span>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.65, fontWeight: 500, color: "var(--w-label-normal)" }}>
                {p.why}
              </div>
            </div>

            <div style={{ height: 18 }} />

            {/* Actions */}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleSave} style={{ ...ghostButton(), background: saved ? 'rgba(16,185,129,0.10)' : undefined, color: saved ? '#065F46' : undefined }}>
                <img src="ds/icons/bookmark.svg" style={{ width: 16, height: 16, opacity: 0.7 }} />
                {saved ? '저장됨 ✓' : '저장'}
              </button>
              <button onClick={handleSwap} style={ghostButton()}>
                <img src="ds/icons/refresh.svg" style={{ width: 16, height: 16, opacity: 0.7 }} />
                비슷한 곳으로
              </button>
            </div>
            <div style={{ height: 8 }} />
            <button
              onClick={() => {
                const pp = (window.__runtimePlaces || PLACES)[placeId];
                const url = pp?.gmapsId
                  ? `https://www.google.com/maps/place/?q=place_id:${pp.gmapsId}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((pp?.name || '') + ' ' + (pp?.region || '') + ' 도쿄')}`;
                window.open(url, '_blank');
              }}
              style={{
              width: "100%", padding: "14px 20px", borderRadius: 14, border: 0,
              background: "var(--w-cool-22)", color: "#fff",
              fontFamily: "var(--w-font-sans)", fontWeight: 700, fontSize: 15,
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8,
            }}>
              구글맵에서 열기
              <img src="ds/icons/arrow-right.svg"
                    style={{ width: 16, height: 16, filter: "brightness(0) invert(1)" }} />
            </button>
          </div>
        </div>
      </div>
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

function MetaCell({ label, v }) {
  return (
    <div style={{
      padding: "12px 14px", borderRadius: 12,
      background: "var(--w-bg-alternative)",
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
        color: "var(--w-label-assistive)", textTransform: "uppercase",
      }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>
        {v}
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
      color: "var(--w-label-alternative)", textTransform: "uppercase",
    }}>
      {children}
    </div>
  );
}

function ghostButton() {
  return {
    flex: 1, padding: "12px 14px", borderRadius: 12, border: 0,
    background: "var(--w-fill-normal)", color: "var(--w-label-normal)",
    fontFamily: "var(--w-font-sans)", fontWeight: 700, fontSize: 13,
    cursor: "pointer", display: "flex", alignItems: "center",
    justifyContent: "center", gap: 6,
  };
}

// Hero "photo" — a deterministic warm gradient per place
function placeHero(p) {
  const cats = {
    "음식·맛집":      "linear-gradient(135deg, #2a1e16 0%, #6b3a1a 50%, #c97a3d 100%)",
    "카페·디저트":    "linear-gradient(135deg, #2f261a 0%, #7a5a2e 55%, #d4a574 100%)",
    "쇼핑·편집샵":    "linear-gradient(135deg, #1f1f23 0%, #4a4a5a 60%, #b8b8c4 100%)",
    "플리마켓·빈티지": "linear-gradient(135deg, #1c2a1f 0%, #4a6a4a 55%, #b8d4a8 100%)",
    "예술·전시":       "linear-gradient(135deg, #19173a 0%, #38357a 55%, #8c8ec8 100%)",
    "문화·역사·신사": "linear-gradient(135deg, #2c1717 0%, #6b3030 55%, #c87575 100%)",
    "서브컬처":       "linear-gradient(135deg, #1a1a3a 0%, #404090 55%, #6a8aff 100%)",
    "자연·공원":      "linear-gradient(135deg, #182919 0%, #3a6a3a 55%, #98d490 100%)",
    "야경·뷰":        "linear-gradient(135deg, #0c0c1e 0%, #2a2a5a 55%, #6f7ec0 100%)",
    "현지인 골목":    "linear-gradient(135deg, #2a201a 0%, #6e5240 55%, #c4a085 100%)",
  };
  return cats[p.category] || cats["음식·맛집"];
}

Object.assign(window, { PlaceDetail });
