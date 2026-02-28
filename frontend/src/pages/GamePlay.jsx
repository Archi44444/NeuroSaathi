import { useMemo, useRef, useState } from "react";
import { T } from "../utils/theme";
import { DarkCard, Btn } from "../components/RiskDashboard";
import { useGames } from "../context/GamesContext";
import { CATEGORY_STYLE, GAMES } from "../utils/gamesCatalog";

const LIME = "#C8F135";

export default function GamePlay({ setPage, gameId }) {
  const game = useMemo(() => GAMES.find(g => g.id === gameId), [gameId]);
  const { saveGameResult } = useGames();
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [done, setDone] = useState(false);
  const [startTs, setStartTs] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const isLockedRef = useRef(false);

  if (!game) {
    return (
      <div style={{ color: T.red, fontSize: 14 }}>
        Game not found.
      </div>
    );
  }

  const q = game.questions[index];
  const categoryTone = CATEGORY_STYLE[game.category] || {
    color: LIME,
    bg: "rgba(200,241,53,0.10)",
  };

  function startGame() {
    setStarted(true);
    setIndex(0);
    setAnswers([]);
    setDone(false);
    setStartTs(Date.now());
    setLastResult(null);
    isLockedRef.current = false;
  }

  function pickOption(optionIndex) {
    if (isLockedRef.current) return;
    isLockedRef.current = true;

    const nextAnswers = [...answers, optionIndex];
    const total = game.questions.length;

    if (index >= total - 1) {
      const nextCorrect = nextAnswers.reduce(
        (acc, ans, i) => acc + (ans === game.questions[i].answer ? 1 : 0),
        0
      );
      const durationSec = Math.max(
        1,
        Math.round((Date.now() - (startTs || Date.now())) / 1000)
      );
      const score = Math.round((nextCorrect / total) * 100);
      const payload = {
        score,
        correct: nextCorrect,
        total,
        durationSec,
        finishedAt: new Date().toISOString(),
        title: game.title,
        category: game.category,
      };

      saveGameResult(game.id, payload);
      setAnswers(nextAnswers);
      setLastResult(payload);
      setDone(true);
      return;
    }

    setAnswers(nextAnswers);
    setIndex(i => i + 1);
    isLockedRef.current = false;
  }

  return (
    <div>
      <button
        onClick={() => setPage("games")}
        style={{
          background: "none",
          border: "none",
          color: T.creamFaint,
          cursor: "pointer",
          fontFamily: "'DM Sans',sans-serif",
          fontSize: 13,
          marginBottom: 20,
        }}
      >
        {"<- Back to Games"}
      </button>

      <h1
        style={{
          fontFamily: "'Instrument Serif',serif",
          fontSize: 34,
          color: T.cream,
          letterSpacing: -1,
          marginBottom: 6,
        }}
      >
        {game.title}
      </h1>
      <p style={{ color: T.creamFaint, fontSize: 14, marginBottom: 24 }}>
        {game.measures}
      </p>

      {!started && (
        <DarkCard style={{ padding: 26 }} hover={false}>
          <div style={{ color: T.cream, fontWeight: 700, marginBottom: 8 }}>
            Ready to start?
          </div>
          <div style={{ color: T.creamFaint, fontSize: 13, marginBottom: 16 }}>
            {game.questions.length} quick questions. Result is stored under{" "}
            <strong style={{ color: LIME }}>Games Results</strong>, separate from assessment results.
          </div>
          <Btn onClick={startGame}>{"Start Game ->"}</Btn>
        </DarkCard>
      )}

      {started && !done && (
        <DarkCard style={{ padding: 26 }} hover={false}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <div
              style={{
                color: categoryTone.color,
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                fontWeight: 700,
              }}
            >
              {game.category}
            </div>
            <div style={{ color: T.creamFaint, fontSize: 12 }}>
              Q {index + 1} / {game.questions.length}
            </div>
          </div>
          <div
            style={{
              color: T.cream,
              fontWeight: 700,
              fontSize: 20,
              lineHeight: 1.4,
              marginBottom: 18,
            }}
          >
            {q.q}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {q.options.map((opt, i) => (
              <button
                key={opt}
                onClick={() => pickOption(i)}
                style={{
                  textAlign: "left",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: `1px solid ${T.cardBorder}`,
                  background: "rgba(255,255,255,0.04)",
                  color: T.cream,
                  cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </DarkCard>
      )}

      {done && (
        <DarkCard style={{ padding: 26 }} hover={false}>
          <div style={{ color: LIME, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
            Game completed
          </div>
          <div
            style={{
              fontFamily: "'Instrument Serif',serif",
              fontSize: 46,
              color: T.cream,
              lineHeight: 1,
            }}
          >
            {lastResult ? `${lastResult.score}%` : "0%"}
          </div>
          <div style={{ color: T.creamFaint, fontSize: 13, marginBottom: 18 }}>
            {lastResult
              ? `${lastResult.correct} / ${lastResult.total} correct`
              : `0 / ${game.questions.length} correct`}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={() => setPage("game-results")}>{"View Games Results ->"}</Btn>
            <Btn variant="ghost" onClick={() => setPage("games")}>Back to Games</Btn>
          </div>
        </DarkCard>
      )}
    </div>
  );
}
