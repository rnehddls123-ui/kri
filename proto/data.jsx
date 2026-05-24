// data.jsx — PRD-aligned option lists + mock places + mock itinerary

// ───── Option lists (from PRD §3) ─────
const OPT = {
  airports: ["NRT", "HND"],
  companions: ["혼자", "커플", "친구 2-3명", "가족(아이있음)", "가족(아이없음)"],
  moods: [
    { v: "번화가", d: "사람·간판·소음이 좋아요" },
    { v: "골목·주택가", d: "맥락 있는 동네를 걷는 게 좋아요" },
    { v: "자연·공원", d: "초록 옆에서 시간을 쓰고 싶어요" },
    { v: "복합", d: "그날의 기분 따라 다 좋아요" },
  ],
  categories: [
    "음식·맛집", "카페·디저트", "쇼핑·편집샵", "플리마켓·빈티지",
    "예술·전시", "문화·역사·신사", "서브컬처", "자연·공원",
    "야경·뷰", "체험·액티비티", "온천·휴식", "근교·당일", "현지인 골목",
  ],
  photos: [
    { v: "인생샷 필수", d: "한 컷을 위해 줄도 서요" },
    { v: "기록용", d: "그날을 기억할 정도면 충분" },
    { v: "관심없음", d: "눈으로 보는 게 더 좋아요" },
  ],
  paces: [
    { v: "빡빡하게", d: "하루 4-5곳" },
    { v: "보통", d: "하루 2-3곳" },
    { v: "여유롭게", d: "하루 1-2곳" },
  ],
  wakes: [
    { v: "일찍 시작", d: "08-09시 시작" },
    { v: "느긋하게", d: "11-12시 시작" },
  ],
  transports: [
    { v: "도보 중심", d: "걸을 수 있는 만큼은 걸어요" },
    { v: "대중교통", d: "JR·메트로 적극 활용" },
    { v: "택시 활용", d: "지치면 부담 없이" },
    { v: "한 동네 깊게", d: "이동 최소화, 한 권역" },
  ],
  staminas: [
    { v: "높음", d: "하루 종일 걸어도 OK" },
    { v: "보통", d: "쉬엄쉬엄이면 가능" },
    { v: "낮음", d: "걷는 거 별로예요" },
  ],
  foods: [
    { v: "맛집 필수", d: "점심·저녁은 무조건 맛집" },
    { v: "적당히", d: "맛있으면 좋고요" },
    { v: "상관없음", d: "끼니만 때우면 OK" },
  ],
  budgets: [
    { v: "절약", d: "~6천엔/일" },
    { v: "보통", d: "6천~1.5만엔/일" },
    { v: "프리미엄", d: "1.5만엔/일~" },
  ],
};

// ───── Mock character library ─────
// Picked deterministically from (categoryMain, categorySub).
// Fallback: "쇼핑 중독자".
const CHARACTERS = {
  "음식·맛집|쇼핑·편집샵": {
    name: "우에노에서 먹방 찍는 쇼핑 중독자",
    region: "우에노",
    keywords: ["로컬 노포", "오모테나시", "감각 편집샵"],
    oneLine: "맛집 한 곳을 위해 골목 끝까지 가고, 디저트는 편집샵에서 골라요.",
    hi: "#ffe5a8", mid: "#ff7a3a", lo: "#8a2400",
  },
  "플리마켓·빈티지|카페·디저트": {
    name: "시모키타자와에서 레코드 고르는 카페인 중독자",
    region: "시모키타자와",
    keywords: ["빈티지", "독립 카페", "취향 큐레이션"],
    oneLine: "레코드 한 장 고르는 데 1시간, 카페에선 노트를 펴요.",
    hi: "#dccfff", mid: "#9a7df0", lo: "#4226a8",
  },
  "서브컬처|쇼핑·편집샵": {
    name: "아키하바라에서 오픈런 하는 찐덕후",
    region: "아키하바라",
    keywords: ["굿즈 사냥", "한정판", "성지순례"],
    oneLine: "신상 발매일은 알람 맞춰서 첫 차로 출발해요.",
    hi: "#bcefe0", mid: "#3fc6a6", lo: "#0e6f5d",
  },
  "쇼핑·편집샵|야경·뷰": {
    name: "긴자에서 윈도우쇼핑 하는 플렉스러",
    region: "긴자",
    keywords: ["하이엔드", "백화점", "스카이라운지"],
    oneLine: "쇼핑은 안 사도 즐겁고, 야경 보러 위층까지 올라가요.",
    hi: "#ffd6e8", mid: "#f06aa2", lo: "#7a1454",
  },
  "문화·역사·신사|자연·공원": {
    name: "야네센에서 골목 배회하는 역사덕후",
    region: "야네센",
    keywords: ["오래된 골목", "신사·절", "공원 산책"],
    oneLine: "신사 한 곳에서 30분, 공원 벤치에서 또 30분이에요.",
    hi: "#c5e9bf", mid: "#5cb963", lo: "#1d5c2d",
  },
};

function pickCharacter(catMain, catSub) {
  const key = (catMain || "") + "|" + (catSub || "");
  return CHARACTERS[key] || CHARACTERS["음식·맛집|쇼핑·편집샵"];
}

// ───── Mock place library ─────
// place_id is the Google Places-style key. Coordinates are normalized 0..1
// against the TokyoMap viewBox (used by both mini map and timeline map).
const PLACES = {
  "ueno_ponta": {
    name: "Honke Ponta 본가폰타",
    region: "우에노", category: "음식·맛집",
    rating: 4.4, reviews: 1284, price: "보통",
    open: "11:30-14:00, 16:30-21:00", stay: 60,
    pos: { x: 0.46, y: 0.66 },
    lat: 35.7140, lng: 139.7721,
    info: "1905년 개업, 도쿄에서 가장 오래된 양식당 중 한 곳. 카츠동·비프카츠가 시그니처. 평일에도 1시간 대기.",
    why: "맛집 한 곳을 위해 끝까지 가는 갬성과 정확히 일치. 노포 특유의 분위기까지.",
  },
  "ueno_tnm": {
    name: "도쿄국립박물관",
    region: "우에노", category: "예술·전시",
    rating: 4.6, reviews: 5210, price: "보통",
    open: "09:30-17:00 (금토 21:00)", stay: 90,
    pos: { x: 0.50, y: 0.62 },
    lat: 35.7188, lng: 139.7764,
    info: "일본 최대 박물관. 동양관·법륭사 보물관 등 6동. 본관만 봐도 1시간 반은 필요.",
    why: "예술·전시 서브 카테고리 매칭. 야간개관 시간대라 저녁 코스에 정확히 들어맞아요.",
  },
  "ueno_kayaba": {
    name: "Kayaba Coffee 카야바 커피",
    region: "야네센", category: "카페·디저트",
    rating: 4.3, reviews: 1820, price: "보통",
    open: "08:00-23:00", stay: 60,
    pos: { x: 0.47, y: 0.59 },
    lat: 35.7219, lng: 139.7679,
    info: "1938년 개업, 야네센 골목 모서리 목조 가옥. 시그니처는 타마고 산도와 루시안. 2층 다다미석.",
    why: "골목·주택가 분위기 + 노포 카페. 가장 늦게까지 여는 곳 중 하나라 마무리 코스로.",
  },
  "ueno_ameyoko": {
    name: "아메요코 시장",
    region: "우에노", category: "현지인 골목",
    rating: 4.2, reviews: 8930, price: "절약",
    open: "10:00-20:00", stay: 60,
    pos: { x: 0.45, y: 0.69 },
    lat: 35.7091, lng: 139.7753,
    info: "우에노역 남쪽 400m 노점 거리. 해산물·간식·잡화·약국까지 가격 흥정 가능.",
    why: "현지 분위기를 가장 짧은 시간에 흡수할 수 있는 곳.",
  },
  "shimo_jazzy": {
    name: "Jazzy Sport 시모키타점",
    region: "시모키타자와", category: "플리마켓·빈티지",
    rating: 4.5, reviews: 412, price: "보통",
    open: "13:00-21:00", stay: 75,
    pos: { x: 0.18, y: 0.46 },
    lat: 35.6618, lng: 139.6687,
    info: "재즈·소울 중심 레코드숍 겸 셀렉트. 1층 LP, 2층 카세트·기자재. 자체 라벨 머치까지.",
    why: "빈티지 + 음악 취향 직격. 1시간 정도 풀려 있어도 자연스러워요.",
  },
  "shimo_curry": {
    name: "Magic Spice 시모키타",
    region: "시모키타자와", category: "음식·맛집",
    rating: 4.4, reviews: 2107, price: "보통",
    open: "11:30-15:00, 17:30-22:30", stay: 60,
    pos: { x: 0.20, y: 0.49 },
    lat: 35.6606, lng: 139.6670,
    info: "삿포로 본점의 도쿄 분점. 수프카레 원조. 매운맛 7단계, 토핑 무한.",
    why: "줄 서서 먹는 류 좋아하는 사람을 위한 점심 정답.",
  },
  "shimo_cafe": {
    name: "Bear Pond Espresso",
    region: "시모키타자와", category: "카페·디저트",
    rating: 4.3, reviews: 980, price: "보통",
    open: "10:00-18:00 (수휴)", stay: 45,
    pos: { x: 0.19, y: 0.50 },
    lat: 35.6617, lng: 139.6674,
    info: "에스프레소 단일 메뉴 14:00 마감 룰로 유명. 좁은 매장, 1인 1잔 규정.",
    why: "취향 까다로운 곳을 일부러 찾아가는 사람을 위한 코스.",
  },
  "daikan_tsutaya": {
    name: "다이칸야마 츠타야",
    region: "다이칸야마", category: "쇼핑·편집샵",
    rating: 4.5, reviews: 6420, price: "보통",
    open: "07:00-23:00", stay: 90,
    pos: { x: 0.32, y: 0.54 },
    lat: 35.6492, lng: 139.7033,
    info: "T-Site 복합공간. 책·잡지·문구·음반·라운지가 한 부지에. Anjin 라운지에서 와인 한 잔.",
    why: "편집샵·서적·카페가 한 곳, 시간 잡아먹기 좋은 종착지.",
  },
  "akiba_animate": {
    name: "Animate 아키하바라 본점",
    region: "아키하바라", category: "서브컬처",
    rating: 4.4, reviews: 3120, price: "보통",
    open: "11:00-21:00", stay: 90,
    pos: { x: 0.52, y: 0.58 },
    lat: 35.6983, lng: 139.7712,
    info: "9층 규모 굿즈 본거지. 신상 한정판 발매일은 오픈런. 7층 라이브 이벤트 공간.",
    why: "서브컬처 메인 카테고리 매칭. 오픈 직후가 가장 정돈된 시간대.",
  },
  "ginza_itoya": {
    name: "GINZA Itoya 이토야",
    region: "긴자", category: "쇼핑·편집샵",
    rating: 4.5, reviews: 4210, price: "프리미엄",
    open: "10:00-20:00", stay: 75,
    pos: { x: 0.62, y: 0.55 },
    lat: 35.6712, lng: 139.7643,
    info: "1904년 개업 문구 백화점. 12층. 만년필부터 종이까지. 최상층 카페에서 마무리.",
    why: "윈도우쇼핑만으로도 만족스러운 하이엔드 편집의 결정판.",
  },
  "tsukiji_market": {
    name: "츠키지 장외시장",
    region: "츠키지", category: "음식·맛집",
    rating: 4.4, reviews: 12400, price: "보통",
    open: "05:00-14:00 (일휴)", stay: 75,
    pos: { x: 0.58, y: 0.71 },
    lat: 35.6655, lng: 139.7706,
    info: "장내시장 도요스 이전 후에도 장외는 그대로. 해산물 도리·계란말이·참치동.",
    why: "공항 가기 전 마지막 끼니로 가장 도쿄다운 한 끼.",
  },
};

// ───── Mock 4-day itinerary (default character) ─────
// Built to match a Sat NRT 14:30 arrival → Tue HND 17:30 departure
const ITINERARY = {
  arrival: { airport: "NRT", date: "2025-11-22", time: "14:30", weekday: "토" },
  departure: { airport: "NRT", date: "2025-11-25", time: "17:30", weekday: "화" },
  lodging: "우에노 (3박)",
  days: [
    {
      idx: 1, date: "11/22", weekday: "토", area: "우에노",
      title: "도착하자마자\n먹는 것부터 시작해요",
      desc: "나리타에서 70분, 짐 풀자마자 우에노로 향해요. 첫 끼는 100년 된 카츠동집에서 줄 서서. 골목 끝 박물관 야간개관 뒤 노포 카페에서 마무리.",
      fatigue: 5.5, budget: 12400, walking: 38,
      nodes: [
        { type: "transit", from: "NRT T1", to: "숙소", mode: "나리타 익스프레스", min: 70, fee: 3070, start: "14:30", end: "16:00" },
        { type: "stay", title: "숙소 체크인", start: "16:00", end: "17:00", fixed: true },
        { type: "transit", mode: "도보", min: 8, start: "17:00", end: "17:08" },
        { type: "place", id: "ueno_ponta", start: "17:10", end: "18:30" },
        { type: "transit", mode: "도보", min: 6, start: "18:30", end: "18:36" },
        { type: "place", id: "ueno_tnm", start: "19:00", end: "20:30" },
        { type: "transit", mode: "도보", min: 12, start: "20:30", end: "20:42" },
        { type: "place", id: "ueno_kayaba", start: "21:00", end: "22:00" },
        { type: "transit", mode: "도보", min: 8, start: "22:00", end: "22:08", to: "숙소" },
      ],
    },
    {
      idx: 2, date: "11/23", weekday: "일", area: "시모키타자와 · 다이칸야마",
      title: "골목과 빈티지로\n하루를 채워요",
      desc: "오다큐선으로 시모키타까지. 레코드 한 장 고르는 데 한 시간이 사라져도 이상하지 않은 동네예요. 점심엔 수프카레, 오후엔 다이칸야마.",
      fatigue: 6.2, budget: 14800, walking: 52,
      nodes: [
        { type: "transit", from: "숙소", to: "시모키타자와", mode: "오다큐선", min: 28, fee: 180, start: "10:00", end: "10:28" },
        { type: "place", id: "shimo_jazzy", start: "10:30", end: "11:45" },
        { type: "transit", mode: "도보", min: 4, start: "11:45", end: "11:49" },
        { type: "place", id: "shimo_curry", start: "12:00", end: "13:00" },
        { type: "transit", mode: "도보", min: 6, start: "13:00", end: "13:06" },
        { type: "place", id: "shimo_cafe", start: "13:15", end: "14:00" },
        { type: "transit", mode: "도큐 도요코선", min: 18, fee: 180, start: "14:00", end: "14:18" },
        { type: "place", id: "daikan_tsutaya", start: "14:30", end: "16:00" },
        { type: "transit", from: "다이칸야마", to: "숙소", mode: "JR 야마노테선", min: 32, fee: 220, start: "16:00", end: "16:32" },
      ],
    },
    {
      idx: 3, date: "11/24", weekday: "월", area: "아키하바라 · 긴자",
      title: "오타쿠와 럭셔리 사이에서",
      desc: "오픈런으로 굿즈를 픽업하고, 오후에는 긴자로 옮겨가 윈도우쇼핑. 이토야에서 한 시간, 마지막은 츠키지 근처에서 저녁.",
      fatigue: 6.8, budget: 19200, walking: 44,
      nodes: [
        { type: "transit", from: "숙소", to: "아키하바라", mode: "JR 야마노테선", min: 8, fee: 160, start: "10:30", end: "10:38" },
        { type: "place", id: "akiba_animate", start: "11:00", end: "12:30" },
        { type: "transit", mode: "도쿄 메트로 긴자선", min: 22, fee: 180, start: "12:30", end: "12:52" },
        { type: "place", id: "ginza_itoya", start: "13:30", end: "14:45" },
        { type: "transit", mode: "도보", min: 14, start: "14:45", end: "14:59" },
        { type: "place", id: "tsukiji_market", start: "15:15", end: "16:30" },
      ],
    },
    {
      idx: 4, date: "11/25", weekday: "화", area: "우에노 · NRT", departing: true,
      title: "마지막 끼는\n시장에서 챙겨요",
      desc: "체크아웃 후 우에노 아메요코에서 짧게 둘러보고, 마지막 끼니는 츠키지 장외시장에서. 출국 2시간 전 NRT 도착.",
      fatigue: 3.1, budget: 5200, walking: 28,
      nodes: [
        { type: "stay", title: "숙소 체크아웃", start: "10:00", end: "11:00", fixed: true },
        { type: "transit", mode: "도보", min: 6, start: "11:00", end: "11:06" },
        { type: "place", id: "ueno_ameyoko", start: "11:10", end: "12:10" },
        { type: "transit", from: "우에노", to: "NRT T1", mode: "나리타 익스프레스", min: 75, fee: 3070, start: "12:30", end: "13:45" },
        { type: "checkin", title: "NRT 공항 도착", start: "15:30", fixed: true, note: "출발 2시간 전" },
      ],
    },
  ],
};

Object.assign(window, { OPT, CHARACTERS, pickCharacter, PLACES, ITINERARY });
