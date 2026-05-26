// App — root state + screen routing
function App() {
  const [screen, setScreen]     = useState("landing");
  const [inputStep, setInputStep] = useState(0);
  const [inputs, setInputs]     = useState({
    arrAirport: "NRT", arrDate: "2025-11-22", arrTime: "14:30",
    depAirport: "NRT", depDate: "2025-11-25", depTime: "17:30",
    companions: "혼자",
    lodging: "우에노 토요코인 (3박)",
    mood: "골목·주택가",
    categoryMain: "음식·맛집",
    categorySub: "쇼핑·편집샵",
    photo: "기록용",
    pace: "보통",
    wake: "일찍 시작",
    transport: "도보 중심",
    stamina: "보통",
    food: "맛집 필수",
    budget: "보통",
  });
  const [character, setCharacter] = useState(() => ({
    ...pickCharacter("음식·맛집", "쇼핑·편집샵"),
    gender: null, image: false, imageUrl: null,
  }));
  const [openPlace, setOpenPlace] = useState(null);

  // When input categories change, refresh the character preview — but only while
  // still in the input flow (not after the character has been AI-generated).
  // This prevents the category-change effect from overwriting an AI-generated character.
  useEffect(() => {
    // Don't overwrite an already AI-generated character
    setCharacter((prev) => {
      if (prev.aiGenerated) return prev; // keep Gemini result
      const c = pickCharacter(inputs.categoryMain, inputs.categorySub);
      return { ...c, gender: prev.gender, image: false, imageUrl: null };
    });
  }, [inputs.categoryMain, inputs.categorySub]);

  // Global reset hook (used by the "처음으로" pill outside the phone frame)
  useEffect(() => {
    window.__protoReset = () => {
      setScreen("landing");
      setInputStep(0);
      setOpenPlace(null);
      // Reset character (clear aiGenerated so the next run generates fresh)
      const c = pickCharacter(inputs.categoryMain, inputs.categorySub);
      setCharacter({ ...c, gender: null, image: false, imageUrl: null, aiGenerated: false });
    };
    return () => { delete window.__protoReset; };
  }, [inputs.categoryMain, inputs.categorySub]);

  // ── Routing ──────────────────────────────────────────────
  if (screen === "landing") {
    return <Landing onStart={() => { setInputStep(0); setScreen("input"); }} />;
  }
  if (screen === "input") {
    return (
      <Input
        inputs={inputs} setInputs={setInputs}
        step={inputStep} setStep={setInputStep}
        onBack={() => setScreen("landing")}
        onDone={() => setScreen("character")}
      />
    );
  }
  if (screen === "character") {
    return (
      <Character
        inputs={inputs}
        character={character} setCharacter={setCharacter}
        onBack={() => { setInputStep(INPUT_STEPS.length - 1); setScreen("input"); }}
        onContinue={() => setScreen("itinerary")}
      />
    );
  }
  if (screen === "itinerary") {
    return (
      <Itinerary
        character={character} inputs={inputs}
        onBack={() => setScreen("character")}
        openPlace={openPlace}
        onOpenPlace={(id) => setOpenPlace(id)}
        onClosePlace={() => setOpenPlace(null)}
      />
    );
  }
  return null;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
