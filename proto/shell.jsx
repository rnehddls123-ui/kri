// shell.jsx — Gemini-only LLM + Google Maps component + UI atoms
const { useState, useEffect, useRef } = React;

// ══════════════════════════════════════════════════════════════
// Gemini AI helpers
// ══════════════════════════════════════════════════════════════

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function hasGemini() { return !!window.__apiKeys?.gemini; }

// Returns { text: string, model: string }
// Tries gemini-2.0-flash first, falls back to gemini-1.5-flash on 4xx errors
async function callLLM(userPrompt, systemPrompt = '', maxTokens = 1024) {
  if (!hasGemini()) throw new Error('Gemini 키가 없어요');
  const key = window.__apiKeys.gemini;
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];

  for (const model of models) {
    const body = {
      systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
    };
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );

    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      const msg = e?.error?.message || `HTTP ${res.status}`;
      // 4xx often means model unavailable for this key tier — try next
      if (res.status === 400 || res.status === 404 || res.status === 429) {
        console.warn(`[LLM] ${model} 실패 (${res.status}: ${msg}) — 다음 모델 시도…`);
        continue;
      }
      throw new Error(`Gemini 오류: ${msg}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    if (!candidate) throw new Error(`Gemini: candidates 없음 (model=${model})`);

    // Handle safety / content filter blocks
    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
      console.warn(`[LLM] finishReason=${candidate.finishReason} — 다음 모델 시도…`);
      continue;
    }

    const text = candidate.content?.parts?.[0]?.text;
    if (!text) throw new Error(`Gemini: 텍스트 없음 (finishReason=${candidate.finishReason})`);

    window.__lastLLMModel = model; // debug aid
    return { text, model };
  }
  throw new Error('Gemini: 모든 모델 실패 — API 키를 확인하세요');
}

// Parse JSON from LLM response (handles markdown code fences)
function parseJSON(text) {
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (!m) throw new Error('No JSON found');
  return JSON.parse(m[1] || m[0]);
}

// Imagen 3 image generation via Gemini API
// Imagen 3 via Gemini API
async function callGeminiImage(prompt) {
  const key = window.__apiKeys.gemini;
  if (!key) throw new Error('No Gemini key');
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { sampleCount: 1, aspectRatio: '1:1' },
      }),
    }
  );
  if (!res.ok) { const e = await res.json().catch(()=>{}); throw new Error(e?.error?.message || `Imagen HTTP ${res.status}`); }
  const data = await res.json();
  const b64  = data.predictions?.[0]?.bytesBase64Encoded;
  if (!b64) throw new Error('Imagen: no image data');
  const mime = data.predictions?.[0]?.mimeType || 'image/png';
  return `data:${mime};base64,${b64}`;
}

// Gemini Flash native image generation — tries multiple model variants in order
async function callGeminiFlashImage(prompt) {
  const key = window.__apiKeys.gemini;
  if (!key) throw new Error('No Gemini key');
  const models = [
    'gemini-2.0-flash-preview-image-generation',
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash',
  ];
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
          }),
        }
      );
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        console.warn(`[FlashImage] ${model} failed (${res.status}): ${e?.error?.message || '?'} — 다음 시도…`);
        continue;
      }
      const data = await res.json();
      const imagePart = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (!imagePart?.inlineData?.data) {
        console.warn(`[FlashImage] ${model} returned no image data — 다음 시도…`);
        continue;
      }
      const { data: b64, mimeType: mime } = imagePart.inlineData;
      console.log(`[FlashImage] ✓ ${model}`);
      return `data:${mime || 'image/png'};base64,${b64}`;
    } catch (e) {
      console.warn(`[FlashImage] ${model} exception:`, e.message, '— 다음 시도…');
    }
  }
  throw new Error('Flash Image: 모든 모델 실패 — API 키를 확인하세요');
}

// Universal: tries Imagen 3, falls back to Gemini Flash image
async function callImageGen(prompt) {
  if (!hasGemini()) throw new Error('Gemini 키가 없어요');
  try {
    return await callGeminiImage(prompt);
  } catch (e1) {
    console.warn('[Image] Imagen 3 failed, trying Flash:', e1.message);
    return await callGeminiFlashImage(prompt);
  }
}

function canGenerateImage() { return hasGemini(); }
function imageProviderLabel() { return hasGemini() ? 'Imagen 3' : null; }

// ══════════════════════════════════════════════════════════════
// Itinerary builder
// ══════════════════════════════════════════════════════════════
function addMin(time, min) {
  const [h, m] = time.split(':').map(Number);
  const t = h * 60 + m + min;
  return `${String(Math.floor(t/60)%24).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;
}

// Returns the lodging area name for a given night number (1-indexed)
function getLodgingForNight(nightNum, lodgings) {
  if (!lodgings || lodgings.length === 0) return null;
  if (lodgings.length === 1) return lodgings[0].area || null;
  let cum = 0;
  for (const l of lodgings) {
    cum += (l.nights || 1);
    if (nightNum <= cum) return l.area || null;
  }
  return lodgings[lodgings.length - 1].area || null;
}

function buildDayNodes(placeIds, dayIdx, totalDays, inputs, PLACES) {
  const nodes = [];
  const isArrival   = dayIdx === 1;
  const isDeparture = dayIdx === totalDays;
  const arrAirport  = inputs.arrAirport || 'NRT';
  const depAirport  = inputs.depAirport || 'NRT';
  const arrTime     = inputs.arrTime    || '14:30';
  const depTime     = inputs.depTime    || '17:30';
  const airMinNRT = 70, airMinHND = 35;
  const airFeeNRT = 3070, airFeeHND = 520;

  const lodgings = (inputs.lodgings && inputs.lodgings.length > 0)
    ? inputs.lodgings
    : [{ area: inputs.lodging || '숙소', nights: Math.max(1, totalDays - 1) }];

  const tonightLodging = isDeparture
    ? (getLodgingForNight(dayIdx - 1, lodgings) || '숙소')
    : (getLodgingForNight(dayIdx, lodgings) || '숙소');
  const lastNightLodging = dayIdx > 1
    ? (getLodgingForNight(dayIdx - 1, lodgings) || '숙소')
    : null;

  const isLodgingChangeDay = !isArrival && !isDeparture
    && lastNightLodging && tonightLodging
    && lastNightLodging !== tonightLodging;

  // ── Time-anchor config ─────────────────────────────────────────
  // Slots are chosen so activities land at meal windows:
  //   4-slot: morning → lunch(12시) → afternoon → dinner(18~19시)
  //   3-slot: brunch(09:30) → lunch(13:00) → dinner(18:30)
  //   2-slot: late morning(10:00) → late afternoon(16:00)
  const lateWake = inputs.wake === '느긋하게';
  const PACE_SLOTS = {
    '빡빡하게': lateWake ? ['11:00','13:30','16:00','19:00'] : ['09:00','12:00','15:00','18:30'],
    '보통':     lateWake ? ['11:30','14:00','19:00']         : ['09:30','13:00','18:30'],
    '여유롭게': lateWake ? ['12:00','17:30']                  : ['10:00','16:00'],
  };

  function toMin(t) {
    const [h, m] = (t || '09:00').split(':').map(Number);
    return h * 60 + m;
  }

  let cur = lateWake ? '11:00' : '09:00';

  // ── Day-start: arrival / lodging change ───────────────────────
  if (isArrival) {
    const lodging1 = getLodgingForNight(1, lodgings) || '숙소';
    const airMin   = arrAirport === 'NRT' ? airMinNRT : airMinHND;
    const airFee   = arrAirport === 'NRT' ? airFeeNRT : airFeeHND;
    const airMode  = arrAirport === 'NRT' ? '나리타 익스프레스' : '공항 모노레일';
    const airEnd   = addMin(arrTime, airMin + 5);
    nodes.push({ type:'transit', from:arrAirport, to:lodging1, mode:airMode, min:airMin, fee:airFee, start:arrTime, end:airEnd });
    const checkEnd = addMin(airEnd, 60);
    nodes.push({ type:'stay', title:`${lodging1} 체크인`, start:airEnd, end:checkEnd, fixed:true });
    cur = checkEnd;
  } else if (isLodgingChangeDay) {
    const checkoutEnd = addMin(cur, 60);
    nodes.push({ type:'stay', title:`${lastNightLodging} 체크아웃`, start:cur, end:checkoutEnd, fixed:true });
    cur = checkoutEnd;
    const transitEnd = addMin(cur, 30);
    nodes.push({ type:'transit', from:lastNightLodging, to:tonightLodging, mode:'지하철', min:30, start:cur, end:transitEnd });
    cur = transitEnd;
    const checkinEnd = addMin(cur, 30);
    nodes.push({ type:'stay', title:`${tonightLodging} 체크인`, start:cur, end:checkinEnd, fixed:true });
    cur = checkinEnd;
  }

  // ── Places — time-anchored for full days, sequential for arrival/departure ──
  // Full days: use PACE_SLOTS so meals fall at correct meal times
  // Arrival/departure: just 1-2 places, no anchor needed
  const slots = (!isArrival && !isDeparture)
    ? (PACE_SLOTS[inputs.pace || '보통'] || PACE_SLOTS['보통'])
    : lateWake ? ['14:00','17:30'] : ['11:30','15:30'];

  let prevEnd = cur;
  for (let i = 0; i < placeIds.length; i++) {
    const id = placeIds[i];
    const p = PLACES[id];
    if (!p) continue;

    const anchor   = slots[i];
    const anchorM  = anchor ? toMin(anchor) : null;
    const prevEndM = toMin(prevEnd);

    // Use anchor if it's comfortably after current position; else sequential gap
    const placeStart = (anchorM && anchorM > prevEndM + 20)
      ? anchor
      : addMin(prevEnd, i === 0 ? 15 : 45);

    const transitMode = inputs.transport === '도보 중심' ? '도보'
                      : i === 0 ? '도보' : '지하철·도보';
    const transitMins = Math.max(10, Math.min(toMin(placeStart) - prevEndM, 60));
    nodes.push({ type:'transit', mode:transitMode, min:transitMins, start:prevEnd, end:placeStart });

    const stayEnd = addMin(placeStart, p.stay || 60);
    nodes.push({ type:'place', id, start:placeStart, end:stayEnd });
    prevEnd = stayEnd;
  }
  cur = prevEnd;

  // ── Day-end: airport or lodging return ────────────────────────
  if (isDeparture) {
    const airMin    = depAirport === 'NRT' ? airMinNRT : airMinHND;
    const airFee    = depAirport === 'NRT' ? airFeeNRT : airFeeHND;
    const airMode   = depAirport === 'NRT' ? '나리타 익스프레스' : '공항 모노레일';
    const depLeave  = addMin(depTime, -(airMin + 120));
    const depArrive = addMin(depTime, -120);
    const checkoutTime = addMin(depLeave, -30);
    nodes.push({ type:'stay', title:`${tonightLodging} 체크아웃`, start:checkoutTime, end:depLeave, fixed:true });
    nodes.push({ type:'transit', from:tonightLodging, to:depAirport, mode:airMode, min:airMin, fee:airFee, start:depLeave, end:depArrive });
    nodes.push({ type:'checkin', title:`${depAirport} 공항 도착`, start:depArrive, fixed:true, note:'출발 2시간 전' });
  } else {
    const transitEnd = addMin(cur, 20);
    nodes.push({ type:'transit', mode:'지하철·도보', min:20, start:cur, end:transitEnd, to:tonightLodging });
    nodes.push({ type:'stay', title:`${tonightLodging} 귀환`, start:transitEnd, end:transitEnd });
  }

  return nodes;
}

function buildItinerary(aiDays, inputs, PLACES) {
  const weekdays = ['일','월','화','수','목','금','토'];
  const baseDate  = new Date(inputs.arrDate || new Date().toISOString().slice(0,10));
  return {
    arrival:   { airport:inputs.arrAirport||'NRT', date:inputs.arrDate||baseDate.toISOString().slice(0,10), time:inputs.arrTime||'14:30', weekday:weekdays[baseDate.getDay()] },
    departure: { airport:inputs.depAirport||'NRT', date:inputs.depDate||new Date(baseDate.getTime()+3*86400000).toISOString().slice(0,10), time:inputs.depTime||'17:30', weekday:weekdays[new Date(inputs.depDate||'').getDay()||0] },
    lodging: inputs.lodgings?.map(l=>`${l.area}(${l.nights}박)`).join(' → ') || inputs.lodging || '도쿄',
    days: aiDays.map((d, i) => {
      const dayDate = new Date(baseDate);
      dayDate.setDate(baseDate.getDate() + i);
      const mm = String(dayDate.getMonth()+1).padStart(2,'0');
      const dd = String(dayDate.getDate()).padStart(2,'0');
      const validIds = (d.placeIds || []).filter(id => PLACES[id]);
      return {
        idx:     i+1,
        date:    `${Number(mm)}/${Number(dd)}`,
        weekday: weekdays[dayDate.getDay()],
        area:    d.area    || '도쿄',
        title:   d.title   || '오늘의 도쿄',
        desc:    d.desc    || '',
        fatigue: d.fatigue || (4 + i * 0.5),
        budget:  d.budget  || 12000,
        walking: d.walking || 40,
        nodes:   buildDayNodes(validIds, i+1, aiDays.length, inputs, PLACES),
      };
    }),
  };
}

// Dynamic fallback itinerary — personalised even when AI is unavailable
// Uses the user's category preferences to pick real places from the active pool
function buildDynamicFallback(inputs, PLACES, numDays) {
  const catMain  = inputs.categoryMain;
  const catSub   = inputs.categorySub;
  const dayCount = { '빡빡하게': 4, '보통': 3, '여유롭게': 2 }[inputs.pace] || 3;

  const byRating = arr => [...arr].sort((a, b) => (b[1].rating || 0) - (a[1].rating || 0));
  const mainPool  = byRating(Object.entries(PLACES).filter(([,p]) => p.category === catMain));
  const subPool   = byRating(Object.entries(PLACES).filter(([,p]) => catSub && p.category === catSub && p.category !== catMain));
  const otherPool = byRating(Object.entries(PLACES).filter(([,p]) => p.category !== catMain && p.category !== catSub));
  const pool = [...mainPool, ...subPool, ...otherPool];
  // Absolute last resort if no category match
  if (pool.length === 0) pool.push(...Object.entries(PLACES).slice(0, 12));

  const budgetYen = { '절약': 7000, '보통': 13000, '프리미엄': 24000 }[inputs.budget] || 12000;
  const walkMin   = { '높음': 55, '보통': 40, '낮음': 22 }[inputs.stamina] || 40;

  const aiDays = Array.from({ length: numDays }, (_, i) => {
    const isFirst = i === 0;
    const isLast  = i === numDays - 1;
    const cnt = isFirst || isLast ? Math.min(2, dayCount) : dayCount;

    // Round-robin through pool so each day gets different places
    const placeIds = Array.from({ length: cnt }, (_, j) => {
      const idx = (i * dayCount + j) % pool.length;
      return pool[idx]?.[0];
    }).filter(Boolean);

    const sample = PLACES[placeIds[0]];
    return {
      idx:     i + 1,
      area:    sample?.region || '도쿄',
      title:   isFirst ? '도착 첫날\n설레는 시작이에요'
               : isLast  ? '마지막 날\n아쉬운 발걸음'
               : `${catMain || '도쿄'} 취향대로\n하루를 채워요`,
      desc:    isFirst ? '입국 후 첫 코스. 짐 풀고 바로 나와요.'
               : isLast  ? '출발 전 마지막 동선.'
               : `${catMain}${catSub ? ' + ' + catSub : ''} 취향으로 묶은 하루예요.`,
      placeIds,
      fatigue: parseFloat((4 + i * 0.5).toFixed(1)),
      budget:  budgetYen,
      walking: walkMin,
    };
  });

  console.log('[Fallback] buildDynamicFallback — catMain:', catMain, 'catSub:', catSub, 'pool:', pool.length, 'days:', numDays);
  return buildItinerary(aiDays, inputs, PLACES);
}

// ══════════════════════════════════════════════════════════════
// Google Maps Places API — real Tokyo place fetching
// ══════════════════════════════════════════════════════════════

// Category → Japanese search queries (better Places API results)
const CAT_QUERIES = {
  "음식·맛집":      "東京 人気 グルメ レストラン",
  "카페·디저트":    "東京 おしゃれ カフェ スペシャルティコーヒー",
  "쇼핑·편집샵":    "東京 セレクトショップ ファッション",
  "플리마켓·빈티지": "東京 ヴィンテージ 古着 下北沢",
  "예술·전시":      "東京 美術館 アート ギャラリー",
  "문화·역사·신사":  "東京 神社 寺院 文化財 歴史",
  "서브컬처":       "秋葉原 アニメ マンガ サブカルチャー",
  "자연·공원":      "東京 公園 庭園 散策",
  "야경·뷰":        "東京 夜景 展望台 絶景スポット",
  "체험·액티비티":   "東京 体験 アクティビティ ワークショップ",
  "온천·휴식":      "東京 銭湯 温泉 スパ",
  "근교·당일":      "東京近郊 鎌倉 箱根 日帰り観光",
  "현지인 골목":    "東京 商店街 下町 路地裏 ローカル",
};

function gmapsPriceLabel(lvl) {
  if (lvl == null) return "보통";
  if (lvl <= 1) return "절약";
  if (lvl === 2) return "보통";
  return "프리미엄";
}

function gmapsRegion(place) {
  const v = place.vicinity || place.formatted_address || "";
  const MAP = {
    "渋谷":"시부야",    "新宿":"신주쿠",        "浅草":"아사쿠사",
    "秋葉原":"아키하바라", "上野":"우에노",       "下北沢":"시모키타자와",
    "代官山":"다이칸야마", "中目黒":"나카메구로",  "六本木":"롯폰기",
    "銀座":"긴자",      "原宿":"하라주쿠",       "表参道":"오모테산도",
    "池袋":"이케부쿠로",  "谷中":"야네센",        "台場":"오다이바",
    "恵比寿":"에비스",   "目黒":"메구로",        "品川":"시나가와",
    "豊洲":"도요스",    "清澄白河":"기요스미",    "蔵前":"구라마에",
    "神保町":"진보초",  "御茶ノ水":"오차노미즈", "吉祥寺":"기치조지",
  };
  for (const [jp, kr] of Object.entries(MAP)) {
    if (v.includes(jp)) return kr;
  }
  return "도쿄";
}

// Fetch real Tokyo places from Google Maps Places API
// Returns a PLACES-compatible object keyed by gm_<placeId>
async function fetchTokyoPlaces(inputs) {
  if (!window.__mapsReady) return null;
  const GP = window.google?.maps?.places;
  if (!GP?.PlacesService) {
    console.warn('[Places] PlacesService unavailable — did you load libraries=places?');
    return null;
  }

  const svcDiv = document.createElement('div');
  const service = new GP.PlacesService(svcDiv);
  const center  = new window.google.maps.LatLng(35.6762, 139.7320); // central Tokyo

  const cats = [inputs.categoryMain, inputs.categorySub].filter(Boolean);
  const allPlaces = {};

  for (const cat of cats) {
    const query = CAT_QUERIES[cat];
    if (!query) continue;
    try {
      const results = await new Promise((resolve, reject) => {
        service.textSearch(
          { query, location: center, radius: 10000 },
          (r, status) => {
            if (status === GP.PlacesServiceStatus.OK && r?.length) resolve(r);
            else reject(new Error(`Places API: ${status}`));
          }
        );
      });

      for (const place of results.slice(0, 10)) {
        if (!place.place_id || !place.geometry?.location) continue;
        if (place.business_status && place.business_status !== 'OPERATIONAL') continue;
        const id = `gm_${place.place_id.slice(-10)}`;
        if (allPlaces[id]) continue; // deduplicate across categories

        allPlaces[id] = {
          name:     place.name,
          region:   gmapsRegion(place),
          category: cat,
          rating:   place.rating ?? 4.0,
          reviews:  place.user_ratings_total ?? 0,
          price:    gmapsPriceLabel(place.price_level),
          open:     "구글맵에서 확인",
          stay:     60,
          lat:      place.geometry.location.lat(),
          lng:      place.geometry.location.lng(),
          info:     `${place.name} — ${place.vicinity || '도쿄'} (구글 평점 ${place.rating ?? '-'}점, 리뷰 ${(place.user_ratings_total ?? 0).toLocaleString()}명)`,
          why:      `${cat} 취향에 맞는 장소예요. 구글 리뷰 ${(place.user_ratings_total ?? 0).toLocaleString()}명이 추천해요.`,
          gmapsId:  place.place_id,
          photoUrl: place.photos?.[0]?.getUrl({ maxWidth: 600, maxHeight: 400 }) || null,
          source:   'gmaps',
        };
      }
      console.log(`[Places] "${cat}" → ${results.length}건 수신`);
    } catch (err) {
      console.warn(`[Places] "${cat}" 검색 실패:`, err.message);
    }
  }

  return Object.keys(allPlaces).length > 0 ? allPlaces : null;
}

Object.assign(window, { callLLM, parseJSON, callImageGen, canGenerateImage, imageProviderLabel, sleep, hasGemini, buildItinerary, buildDynamicFallback, addMin, buildDayNodes, getLodgingForNight, fetchTokyoPlaces, CAT_QUERIES });

// ── Toast notification ─────────────────────────────────────────
function Toast({ message, onDone }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => { setVisible(false); setTimeout(onDone, 280); }, 2200);
    return () => { cancelAnimationFrame(r); clearTimeout(t); };
  }, []);
  return (
    <div style={{
      position:'fixed', bottom:32, left:'50%', transform:`translateX(-50%) translateY(${visible?'0':'12px'})`,
      opacity:visible?1:0, transition:'all 260ms cubic-bezier(.4,0,.2,1)',
      background:'var(--w-cool-22)', color:'#fff',
      padding:'10px 18px', borderRadius:9999,
      fontSize:13, fontWeight:700, letterSpacing:'0.01em',
      whiteSpace:'nowrap', zIndex:999,
      boxShadow:'0 4px 16px rgba(0,0,0,0.22)',
      pointerEvents:'none',
    }}>
      {message}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Google Maps component
// ══════════════════════════════════════════════════════════════

const MAPS_STYLE = [
  { elementType:'geometry',                                         stylers:[{color:'#1a1a2e'}] },
  { elementType:'labels.icon',                                      stylers:[{visibility:'off'}] },
  { elementType:'labels.text.fill',                                 stylers:[{color:'#8896a8'}] },
  { elementType:'labels.text.stroke',                               stylers:[{color:'#1a1a2e'}] },
  { featureType:'water',         elementType:'geometry',            stylers:[{color:'#0d1117'}] },
  { featureType:'landscape',     elementType:'geometry',            stylers:[{color:'#1e1e2e'}] },
  { featureType:'road',          elementType:'geometry',            stylers:[{color:'#2a2a3e'}] },
  { featureType:'road.highway',  elementType:'geometry',            stylers:[{color:'#32324a'}] },
  { featureType:'road.arterial', elementType:'geometry',            stylers:[{color:'#28283c'}] },
  { featureType:'poi',           elementType:'geometry',            stylers:[{color:'#242436'}] },
  { featureType:'poi.park',      elementType:'geometry',            stylers:[{color:'#1a2a1a'}] },
  { featureType:'transit',       elementType:'geometry',            stylers:[{color:'#222232'}] },
];

function GoogleMap({ pins = [], onPin, height = '100%', interactive = false }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef([]);
  const [ready, setReady] = useState(!!window.__mapsReady);

  // Poll until Maps API is loaded
  useEffect(() => {
    if (ready) return;
    const id = setInterval(() => {
      if (window.__mapsReady) { setReady(true); clearInterval(id); }
    }, 300);
    return () => clearInterval(id);
  }, [ready]);

  // Init map once
  useEffect(() => {
    if (!ready || !containerRef.current || mapRef.current) return;
    mapRef.current = new window.google.maps.Map(containerRef.current, {
      center: { lat: 35.685, lng: 139.755 },
      zoom: 12,
      disableDefaultUI: !interactive,
      zoomControl: interactive,
      gestureHandling: interactive ? 'cooperative' : 'none',
      styles: MAPS_STYLE,
    });
  }, [ready]);

  // Update gesture/zoom options when interactive prop changes
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setOptions({
      gestureHandling: interactive ? 'cooperative' : 'none',
      zoomControl: interactive,
      disableDefaultUI: !interactive,
    });
  }, [interactive]);

  // Update markers when pins change
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const google = window.google;

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let hasPins = false;

    pins.forEach((pin, i) => {
      if (pin.lat == null || pin.lng == null) return;
      hasPins = true;
      bounds.extend({ lat: pin.lat, lng: pin.lng });

      const marker = new google.maps.Marker({
        position: { lat: pin.lat, lng: pin.lng },
        map: mapRef.current,
        label: {
          text: pin.label || String(i + 1),
          color: '#ffffff',
          fontWeight: '700',
          fontSize: '11px',
          fontFamily: 'monospace',
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 13,
          fillColor: '#0066FF',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2.5,
        },
      });

      if (onPin) marker.addListener('click', () => onPin(pin, i));
      markersRef.current.push(marker);
    });

    if (hasPins) {
      mapRef.current.fitBounds(bounds, { top:36, right:36, bottom:36, left:36 });
      // Don't over-zoom on single marker
      google.maps.event.addListenerOnce(mapRef.current, 'bounds_changed', () => {
        if (mapRef.current.getZoom() > 15) mapRef.current.setZoom(15);
      });
    }
  }, [ready, pins.map(p => p.id).join(',')]);

  if (!window.__apiKeys?.maps) {
    return (
      <div style={{ width:'100%', height, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'var(--w-bg-alternative)', gap:6 }}>
        <span style={{ fontSize:28 }}>🗺️</span>
        <span style={{ fontSize:12, fontWeight:700, color:'#888' }}>Google Maps 키 미설정</span>
        <span style={{ fontSize:11, color:'#aaa' }}>⚙ API 설정에서 입력하세요</span>
      </div>
    );
  }

  if (!ready) {
    return (
      <div style={{ width:'100%', height, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--w-bg-alternative)' }}>
        <span style={{ fontSize:12, fontWeight:700, color:'#aaa' }}>지도 로딩 중…</span>
      </div>
    );
  }

  return <div ref={containerRef} style={{ width:'100%', height }} />;
}

// ══════════════════════════════════════════════════════════════
// UI Components
// ══════════════════════════════════════════════════════════════
function PhoneShell({ children, dark=false, footer, scroll=true, overlay }) {
  return (
    <IOSDevice width={390} dark={dark}>
      <div className={"ts-screen" + (dark ? " ts-screen--ink" : "")}>
        {/* No iOS status bar → use small safe-area top pad instead of 48px */}
        <div style={{ height:12, flexShrink:0 }} />
        <div style={{ flex:1, minHeight:0, overflowY:scroll?"auto":"hidden", overflowX:"hidden", display:"flex", flexDirection:"column" }}>
          {children}
        </div>
        {footer && (
          <div style={{ flexShrink:0, padding:"12px 20px 18px", borderTop: dark?"1px solid rgba(255,255,255,0.06)":"1px solid var(--w-line-alternative)", background: dark?"var(--w-cool-15)":"var(--w-bg-normal)" }}>
            {footer}
          </div>
        )}
        {overlay}
      </div>
    </IOSDevice>
  );
}

function ProgressBar({ step, total, onBack }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 20px 14px", flexShrink:0 }}>
      <button onClick={onBack} style={{ width:30, height:30, border:0, padding:0, background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", marginLeft:-6 }}>
        <img src="ds/icons/chevron-left.svg" style={{ width:22, height:22, filter:"brightness(0)", opacity:0.78 }} />
      </button>
      <div style={{ flex:1, height:3, borderRadius:9999, background:"var(--w-fill-normal)", overflow:"hidden" }}>
        <div style={{ height:"100%", borderRadius:9999, background:"var(--w-cool-22)", width:((step/total)*100)+"%", transition:"width 320ms cubic-bezier(.4,0,.2,1)" }} />
      </div>
      <div style={{ fontSize:12, fontWeight:700, letterSpacing:"0.04em", color:"var(--w-label-alternative)", fontFamily:"var(--w-font-mono)" }}>{step} / {total}</div>
    </div>
  );
}

function PageBar({ onBack, title, right, dark }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px 12px", flexShrink:0 }}>
      <button onClick={onBack} style={{ width:36, height:36, border:0, padding:0, background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <img src="ds/icons/chevron-left.svg" style={{ width:22, height:22, filter:dark?"brightness(0) invert(1)":"brightness(0)", opacity:0.78 }} />
      </button>
      <div style={{ flex:1, textAlign:"center", fontSize:14, fontWeight:700, color:dark?"#fff":"var(--w-label-normal)" }}>{title}</div>
      <div style={{ width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center" }}>{right}</div>
    </div>
  );
}

function Cta({ children, onClick, variant="primary", disabled, full=true }) {
  const s = {
    primary:{ background:"var(--w-cool-22)", color:"#fff" },
    accent: { background:"var(--w-accent-redorange)", color:"#fff" },
    ghost:  { background:"var(--w-fill-normal)", color:"var(--w-label-normal)" },
  };
  return (
    <button onClick={disabled?undefined:onClick} disabled={disabled}
      style={{ ...s[variant], opacity:disabled?0.4:1, cursor:disabled?"not-allowed":"pointer", border:0, borderRadius:14, padding:"16px 22px", width:full?"100%":undefined, fontFamily:"var(--w-font-sans)", fontWeight:700, fontSize:16, letterSpacing:"-0.005em", display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"transform 100ms" }}
      onMouseDown={e=>!disabled&&(e.currentTarget.style.transform="scale(0.985)")}
      onMouseUp={e=>(e.currentTarget.style.transform="")}
      onMouseLeave={e=>(e.currentTarget.style.transform="")}>
      {children}
    </button>
  );
}

function PickCard({ title, desc, active, onClick, big=true }) {
  return (
    <button onClick={onClick} style={{ all:"unset", boxSizing:"border-box", display:"flex", flexDirection:"column", gap:big?4:6, padding:big?"16px 18px":"14px 14px", background:active?"var(--w-blue-99)":"var(--w-bg-elevated)", border:"1px solid "+(active?"var(--w-primary)":"var(--w-line-normal)"), boxShadow:active?"0 0 0 1px var(--w-primary) inset":"none", borderRadius:14, cursor:"pointer", position:"relative", transition:"background 150ms, border-color 150ms" }}>
      <div style={{ fontSize:big?16:14, fontWeight:700, letterSpacing:"-0.005em", color:"var(--w-label-normal)" }}>{title}</div>
      {desc && <div style={{ fontSize:big?13:12, fontWeight:500, color:"var(--w-label-alternative)", lineHeight:1.5 }}>{desc}</div>}
      {active && <div style={{ position:"absolute", top:14, right:14, width:20, height:20, borderRadius:9999, background:"var(--w-primary)", display:"flex", alignItems:"center", justifyContent:"center" }}><img src="ds/icons/check.svg" style={{ width:12, height:12, filter:"brightness(0) invert(1)" }} /></div>}
    </button>
  );
}

function Chip({ children, active, onClick, tone="neutral" }) {
  const t = { neutral:{bg:"var(--w-fill-normal)",color:"var(--w-label-normal)"}, brand:{bg:"rgba(0,102,255,0.10)",color:"var(--w-primary)"}, accent:{bg:"rgba(255,94,0,0.10)",color:"var(--w-accent-redorange)"}, ink:{bg:"var(--w-cool-22)",color:"#fff"} };
  const st = t[tone] || t.neutral;
  return <span onClick={onClick} style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"6px 10px", borderRadius:9999, fontSize:12, fontWeight:700, letterSpacing:"0.012em", background:active?"var(--w-cool-22)":st.bg, color:active?"#fff":st.color, cursor:onClick?"pointer":"default", whiteSpace:"nowrap", transition:"background 120ms" }}>{children}</span>;
}

// CharacterOrb — shows real Imagen 3 photo if available, else gradient orb
function CharacterOrb({ hi, mid, lo, size=120, label="AI 생성", imageUrl }) {
  if (imageUrl) {
    return (
      <div style={{ width:size, height:size, borderRadius:size*0.22, overflow:"hidden", position:"relative", boxShadow:`0 ${size*0.04}px ${size*0.14}px rgba(0,0,0,0.22)` }}>
        <img src={imageUrl} alt="AI Character" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
        {label && <div style={{ position:"absolute", left:10, bottom:10, fontSize:9, fontWeight:700, letterSpacing:"0.06em", color:"rgba(0,0,0,0.42)", textTransform:"uppercase", background:"rgba(255,255,255,0.72)", padding:"3px 6px", borderRadius:4 }}>{label}</div>}
      </div>
    );
  }
  return (
    <div style={{ width:size, height:size, borderRadius:size*0.22, background:`radial-gradient(circle at 32% 28%, ${hi} 0%, ${mid} 45%, ${lo} 100%)`, position:"relative", overflow:"hidden", boxShadow:`inset 0 -${size*0.07}px ${size*0.18}px rgba(0,0,0,0.20), inset 0 ${size*0.04}px ${size*0.10}px rgba(255,255,255,0.32)` }}>
      <div style={{ position:"absolute", top:"14%", left:"22%", width:"22%", height:"22%", borderRadius:"50%", background:"radial-gradient(circle, rgba(255,255,255,0.7), rgba(255,255,255,0))", filter:"blur(2px)" }} />
      {label && <div style={{ position:"absolute", left:10, bottom:10, fontSize:9, fontWeight:700, letterSpacing:"0.06em", color:"rgba(0,0,0,0.42)", textTransform:"uppercase", background:"rgba(255,255,255,0.55)", padding:"3px 6px", borderRadius:4 }}>{label}</div>}
    </div>
  );
}

function Eyebrow({ children, tone="default" }) {
  const c = tone==="accent"?"var(--w-accent-redorange)":tone==="brand"?"var(--w-primary)":"var(--w-label-alternative)";
  return <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:c }}>{children}</div>;
}
function Heading({ children, display, dark }) {
  return <h1 style={{ fontFamily:display?"var(--w-font-display)":"var(--w-font-sans)", fontSize:display?28:24, fontWeight:700, letterSpacing:display?"-0.025em":"-0.018em", lineHeight:1.25, color:dark?"#fff":"var(--w-label-normal)", margin:0, textWrap:"balance" }}>{children}</h1>;
}
function Sub({ children, dark }) {
  return <p style={{ fontSize:14, fontWeight:500, lineHeight:1.55, color:dark?"rgba(255,255,255,0.62)":"var(--w-label-alternative)", margin:0 }}>{children}</p>;
}

// Kept for input.jsx lodging card district detection
const TOKYO_DISTRICTS = [
  { name:"시모키타자와" }, { name:"신주쿠" },
  { name:"하라주쿠" },    { name:"오모테산도" },
  { name:"시부야" },      { name:"다이칸야마" },
  { name:"롯폰기" },      { name:"긴자" },
  { name:"마루노우치" },  { name:"츠키지" },
  { name:"아사쿠사" },    { name:"우에노" },
  { name:"야네센" },      { name:"아키하바라" },
  { name:"이케부쿠로" },
];

// ── Category color map & tag ──────────────────────────────────
const CAT_COLOR = {
  '음식·맛집':      { bg:'rgba(249,115,22,0.15)', color:'#FB923C', dot:'#F97316' },
  '카페·디저트':    { bg:'rgba(180,83,9,0.15)',   color:'#D97706', dot:'#B45309' },
  '쇼핑·편집샵':    { bg:'rgba(139,92,246,0.15)', color:'#A78BFA', dot:'#8B5CF6' },
  '플리마켓·빈티지':{ bg:'rgba(16,185,129,0.15)', color:'#34D399', dot:'#10B981' },
  '예술·전시':      { bg:'rgba(59,130,246,0.15)', color:'#60A5FA', dot:'#3B82F6' },
  '문화·역사·신사': { bg:'rgba(239,68,68,0.15)',  color:'#F87171', dot:'#EF4444' },
  '서브컬처':       { bg:'rgba(124,58,237,0.15)', color:'#C084FC', dot:'#7C3AED' },
  '자연·공원':      { bg:'rgba(34,197,94,0.15)',  color:'#4ADE80', dot:'#22C55E' },
  '야경·뷰':        { bg:'rgba(99,102,241,0.15)', color:'#818CF8', dot:'#6366F1' },
  '현지인 골목':    { bg:'rgba(234,179,8,0.15)',  color:'#FCD34D', dot:'#EAB308' },
  '체험·액티비티':  { bg:'rgba(20,184,166,0.15)', color:'#2DD4BF', dot:'#14B8A6' },
  '온천·휴식':      { bg:'rgba(236,72,153,0.15)', color:'#F472B6', dot:'#EC4899' },
  '근교·당일':      { bg:'rgba(168,85,247,0.15)', color:'#C084FC', dot:'#A855F7' },
};

function CategoryTag({ cat, size='sm' }) {
  const c = CAT_COLOR[cat] || { bg:'var(--w-fill-normal)', color:'var(--w-label-alternative)', dot:'#888' };
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      padding: size==='lg' ? '5px 10px' : '3px 8px',
      borderRadius:6,
      background:c.bg, color:c.color,
      fontSize: size==='lg' ? 12 : 10, fontWeight:700, letterSpacing:'0.02em',
    }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:c.dot, flexShrink:0 }} />
      {cat}
    </span>
  );
}

// ── DataStat — big number + small label ───────────────────────
function DataStat({ value, label, accent }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
      <div style={{
        fontFamily:'var(--w-font-mono)', fontSize:18, fontWeight:700,
        letterSpacing:'-0.01em', color:accent||'var(--w-label-normal)', lineHeight:1,
      }}>
        {value}
      </div>
      <div style={{
        fontSize:9, fontWeight:700, letterSpacing:'0.07em',
        textTransform:'uppercase', color:'var(--w-label-assistive)',
      }}>
        {label}
      </div>
    </div>
  );
}

// ── DataRow — label | value horizontal row ────────────────────
function DataRow({ label, value }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'9px 0', borderBottom:'1px solid var(--w-line-alternative)',
    }}>
      <span style={{ fontSize:12, fontWeight:600, color:'var(--w-label-alternative)' }}>{label}</span>
      <span style={{ fontSize:13, fontWeight:700, color:'var(--w-label-normal)' }}>{value}</span>
    </div>
  );
}

Object.assign(window, { PhoneShell, ProgressBar, PageBar, Cta, PickCard, Chip, CharacterOrb, GoogleMap, TOKYO_DISTRICTS, Eyebrow, Heading, Sub, CategoryTag, CAT_COLOR, DataStat, DataRow, Toast });
