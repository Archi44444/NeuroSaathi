import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { T } from "../utils/theme";
import { DarkCard, Btn } from "../components/RiskDashboard";
import { useGames } from "../context/GamesContext";
import { CATEGORY_STYLE, GAMES } from "../utils/gamesCatalog";

const LIME = "#C8F135";

const DIFFICULTY_TARGET_MS = {
  Easy: 4800,
  Medium: 4200,
  Hard: 3400,
};

const QUESTION_LIMIT_MS = {
  Easy: 26000,
  Medium: 22000,
  Hard: 18000,
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function average(nums) {
  if (!nums?.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function stdDev(nums) {
  if (!nums?.length) return 0;
  const mean = average(nums);
  const variance = nums.reduce((sum, n) => sum + (n - mean) ** 2, 0) / nums.length;
  return Math.sqrt(variance);
}

function computeCstScore({ correct, total, responseTimesMs, difficulty }) {
  const accuracyPct = total > 0 ? (correct / total) * 100 : 0;
  const meanRtMs = average(responseTimesMs);
  const rtStdMs = stdDev(responseTimesMs);
  const target = DIFFICULTY_TARGET_MS[difficulty] || DIFFICULTY_TARGET_MS.Medium;

  const speedRatio = target > 0 ? meanRtMs / target : 1;
  const speedScore =
    speedRatio <= 1
      ? clamp(100 - (1 - speedRatio) * 12, 0, 100)
      : clamp(100 - (speedRatio - 1) * 85, 0, 100);

  const cv = meanRtMs > 0 ? rtStdMs / meanRtMs : 1;
  const consistencyScore = clamp(100 - cv * 140, 0, 100);

  const cstScore = Math.round(
    clamp(accuracyPct * 0.72 + speedScore * 0.18 + consistencyScore * 0.10, 0, 100)
  );

  return {
    cstScore,
    accuracyPct: Math.round(accuracyPct),
    meanRtMs: Math.round(meanRtMs),
    rtStdMs: Math.round(rtStdMs),
    speedScore: Math.round(speedScore),
    consistencyScore: Math.round(consistencyScore),
  };
}

function scoreAnswerPoints(isCorrect, rtMs, nextStreak, difficulty) {
  if (!isCorrect) return 0;
  const target = DIFFICULTY_TARGET_MS[difficulty] || DIFFICULTY_TARGET_MS.Medium;
  const speedBonus = clamp(Math.round(((target - rtMs) / target) * 25), 0, 25);
  const streakBonus = clamp(nextStreak * 3, 0, 18);
  return 72 + speedBonus + streakBonus;
}

function FaceCard({ face, label, showName = false }) {
  if (!face) return null;
  return (
    <div style={{
      border: `1px solid ${T.cardBorder}`,
      borderRadius: 12,
      background: "rgba(255,255,255,0.03)",
      padding: 10,
      minWidth: 110,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: T.creamFaint, fontWeight: 700 }}>Face {face.id}</span>
        <span style={{ fontSize: 10, color: T.creamFaint }}>{face.marker}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
        <div style={{ width: 62, height: 62, borderRadius: "50%", background: face.tone, position: "relative", overflow: "hidden", border: "1px solid rgba(0,0,0,0.15)" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 24, background: face.hair }} />
          <div style={{ position: "absolute", top: 26, left: 18, width: 6, height: 6, borderRadius: "50%", background: "#1f2937" }} />
          <div style={{ position: "absolute", top: 26, right: 18, width: 6, height: 6, borderRadius: "50%", background: "#1f2937" }} />
          <div style={{ position: "absolute", top: 40, left: "50%", width: 18, height: 8, borderBottom: "2px solid #7c2d12", borderRadius: "0 0 10px 10px", transform: "translateX(-50%)" }} />
        </div>
      </div>
      <div style={{ height: 6, background: face.shirt, borderRadius: 6, marginBottom: 6 }} />
      {showName && (
        <div style={{ textAlign: "center", color: T.cream, fontSize: 12, fontWeight: 700 }}>
          {label}
        </div>
      )}
    </div>
  );
}

export default function GamePlay({ setPage, gameId }) {
  const game = useMemo(() => GAMES.find(g => g.id === gameId), [gameId]);
  const isFaceNameGame = game?.id === "game-face-name";
  const faceById = useMemo(() => {
    const map = {};
    (game?.faceBank || []).forEach(f => { map[f.id] = f; });
    return map;
  }, [game]);
  const { saveGameResult } = useGames();
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [done, setDone] = useState(false);
  const [startTs, setStartTs] = useState(null);
  const [qStartTs, setQStartTs] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [comfortMode, setComfortMode] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [currentAnswer, setCurrentAnswer] = useState(null);
  const [scorePoints, setScorePoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [hintsLeft, setHintsLeft] = useState(2);
  const [eliminated, setEliminated] = useState([]);
  const [timeLeftMs, setTimeLeftMs] = useState(0);
  const isLockedRef = useRef(false);
  const endTimeRef = useRef(null);
  const questionLimitMs = QUESTION_LIMIT_MS[game?.difficulty] || QUESTION_LIMIT_MS.Medium;

  function startGame() {
    setStarted(true);
    setIndex(0);
    setAnswers([]);
    setDone(false);
    const now = Date.now();
    setStartTs(now);
    setQStartTs(now);
    setLastResult(null);
    setFeedback(null);
    setCurrentAnswer(null);
    setScorePoints(0);
    setStreak(0);
    setBestStreak(0);
    setHintsLeft(2);
    setEliminated([]);
    setTimeLeftMs(questionLimitMs);
    isLockedRef.current = false;
  }

  const submitAnswer = useCallback((optionIndex, timedOut = false) => {
    if (isLockedRef.current) return;
    isLockedRef.current = true;

    const now = Date.now();
    const answerRtMs = timedOut ? questionLimitMs : Math.max(200, now - (qStartTs || now));
    const isCorrect = optionIndex === game.questions[index].answer;
    const points = scoreAnswerPoints(
      isCorrect,
      answerRtMs,
      streak + (isCorrect ? 1 : 0),
      game.difficulty
    );
    const answer = {
      selected: optionIndex,
      correct: isCorrect,
      rtMs: answerRtMs,
      timedOut,
      points,
    };

    setCurrentAnswer(answer);
    setFeedback({
      selected: optionIndex,
      correctIndex: game.questions[index].answer,
      isCorrect,
      timedOut,
      points,
    });
    if (isCorrect) {
      setStreak(s => {
        const ns = s + 1;
        setBestStreak(b => Math.max(b, ns));
        return ns;
      });
      setScorePoints(p => p + points);
    } else {
      setStreak(0);
    }
  }, [game, index, qStartTs, questionLimitMs, streak]);

  const continueAfterAnswer = useCallback(() => {
    if (!currentAnswer) return;
    const nextAnswers = [...answers, currentAnswer];
    const total = game.questions.length;

    if (index >= total - 1) {
      const nextCorrect = nextAnswers.reduce(
        (acc, ans) => acc + (ans.correct ? 1 : 0),
        0
      );
      const endTime = Date.now();
      const durationSec = Math.max(
        1,
        Math.round((endTime - (startTs || endTime)) / 1000)
      );
      endTimeRef.current = endTime;
      const responseTimesMs = nextAnswers.map(a => a.rtMs);
      const metrics = computeCstScore({
        correct: nextCorrect,
        total,
        responseTimesMs,
        difficulty: game.difficulty,
      });
      const payload = {
        score: metrics.cstScore,
        cstScore: metrics.cstScore,
        correct: nextCorrect,
        total,
        durationSec,
        accuracyPct: metrics.accuracyPct,
        meanRtMs: metrics.meanRtMs,
        rtStdMs: metrics.rtStdMs,
        speedScore: metrics.speedScore,
        consistencyScore: metrics.consistencyScore,
        finishedAt: new Date().toISOString(),
        title: game.title,
        category: game.category,
        difficulty: game.difficulty,
        points: scorePoints + (currentAnswer.points || 0),
        bestStreak,
        comfortMode,
      };

      saveGameResult(game.id, payload);
      setAnswers(nextAnswers);
      setLastResult(payload);
      setDone(true);
      return;
    }

    setAnswers(nextAnswers);
    setIndex(i => i + 1);
    setQStartTs(Date.now());
    setTimeLeftMs(questionLimitMs);
    setEliminated([]);
    setCurrentAnswer(null);
    setFeedback(null);
    isLockedRef.current = false;
  }, [answers, bestStreak, comfortMode, currentAnswer, game, index, questionLimitMs, saveGameResult, scorePoints, startTs]);

  useEffect(() => {
    if (!started || done || comfortMode || feedback) return;
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const left = Math.max(0, questionLimitMs - (Date.now() - startedAt));
      setTimeLeftMs(left);
      if (left <= 0) {
        clearInterval(timer);
        submitAnswer(-1, true);
      }
    }, 120);
    return () => clearInterval(timer);
  }, [started, done, comfortMode, feedback, index, questionLimitMs, submitAnswer]);

  function useHint() {
    if (hintsLeft <= 0 || !q || feedback) return;
    const wrong = q.options
      .map((_, i) => i)
      .filter(i => i !== q.answer);
    setEliminated(wrong.slice(0, 2));
    setHintsLeft(h => h - 1);
  }

  if (!game) {
    return (
      <div style={{ color: T.red, fontSize: 14 }}>
        Game not found.
      </div>
    );
  }

  const q = game.questions[index];
  const qFace = q?.faceId ? faceById[q.faceId] : null;
  const progressPct = Math.round(((index + 1) / game.questions.length) * 100);
  const timerPct = questionLimitMs > 0 ? Math.round((timeLeftMs / questionLimitMs) * 100) : 0;
  const categoryTone = CATEGORY_STYLE[game.category] || {
    color: LIME,
    bg: "rgba(200,241,53,0.10)",
  };

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
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: "#93c5fd", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
              Select play mode
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => setComfortMode(true)}
                style={{
                  border: comfortMode ? `1px solid ${LIME}` : `1px solid ${T.cardBorder}`,
                  background: comfortMode ? "rgba(200,241,53,0.10)" : "rgba(255,255,255,0.03)",
                  color: comfortMode ? LIME : T.cream,
                  borderRadius: 12,
                  padding: "10px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                Comfort Mode (Recommended)
              </button>
              <button
                onClick={() => setComfortMode(false)}
                style={{
                  border: !comfortMode ? "1px solid #60a5fa" : `1px solid ${T.cardBorder}`,
                  background: !comfortMode ? "rgba(96,165,250,0.12)" : "rgba(255,255,255,0.03)",
                  color: !comfortMode ? "#93c5fd" : T.cream,
                  borderRadius: 12,
                  padding: "10px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                Challenge Mode (Timed)
              </button>
            </div>
            <div style={{ color: T.creamFaint, fontSize: 12, marginTop: 7 }}>
              Comfort mode removes per-question timer and is easier for elderly users.
            </div>
          </div>
          {isFaceNameGame && game.studyPairs?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: "#93c5fd", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                Study these face-name pairs before starting:
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 8 }}>
                {game.studyPairs.map(pair => (
                  <FaceCard
                    key={pair.faceId}
                    face={faceById[pair.faceId]}
                    label={pair.name}
                    showName
                  />
                ))}
              </div>
            </div>
          )}
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
          <div style={{ height: 7, borderRadius: 999, background: "rgba(255,255,255,0.06)", marginBottom: 14 }}>
            <div style={{ height: "100%", width: `${progressPct}%`, borderRadius: 999, background: `linear-gradient(90deg,${LIME},#9abf28)`, transition: "width 0.25s ease" }} />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            <span style={{ border: `1px solid ${T.cardBorder}`, borderRadius: 999, padding: "4px 10px", fontSize: 11, color: T.creamFaint }}>
              Points: <strong style={{ color: T.cream }}>{scorePoints}</strong>
            </span>
            <span style={{ border: `1px solid ${T.cardBorder}`, borderRadius: 999, padding: "4px 10px", fontSize: 11, color: T.creamFaint }}>
              Streak: <strong style={{ color: "#86efac" }}>{streak}</strong>
            </span>
            <span style={{ border: `1px solid ${T.cardBorder}`, borderRadius: 999, padding: "4px 10px", fontSize: 11, color: T.creamFaint }}>
              Hints left: <strong style={{ color: "#93c5fd" }}>{hintsLeft}</strong>
            </span>
            {!comfortMode && (
              <span style={{ border: `1px solid ${timerPct < 25 ? "#f87171" : T.cardBorder}`, borderRadius: 999, padding: "4px 10px", fontSize: 11, color: timerPct < 25 ? "#f87171" : T.creamFaint }}>
                Time left: <strong>{Math.ceil(timeLeftMs / 1000)}s</strong>
              </span>
            )}
          </div>
          <div
            style={{
              color: T.cream,
              fontWeight: 700,
              fontSize: 22,
              lineHeight: 1.4,
              marginBottom: 18,
            }}
          >
            {q.q}
          </div>
          {isFaceNameGame && qFace && (
            <div style={{ marginBottom: 14, maxWidth: 150 }}>
              <FaceCard face={qFace} />
            </div>
          )}
          {!feedback && hintsLeft > 0 && (
            <div style={{ marginBottom: 10 }}>
              <button
                onClick={useHint}
                style={{
                  border: "1px solid rgba(96,165,250,0.35)",
                  background: "rgba(96,165,250,0.10)",
                  color: "#93c5fd",
                  borderRadius: 10,
                  padding: "7px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                Use Hint (remove 2 wrong options)
              </button>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {q.options.map((opt, i) => (
              <button
                key={opt}
                onClick={() => submitAnswer(i, false)}
                disabled={!!feedback || eliminated.includes(i)}
                style={{
                  textAlign: "left",
                  padding: "16px 16px",
                  borderRadius: 10,
                  border: `1px solid ${
                    feedback
                      ? i === feedback.correctIndex
                        ? "rgba(134,239,172,0.9)"
                        : i === feedback.selected
                          ? "rgba(248,113,113,0.9)"
                          : T.cardBorder
                      : T.cardBorder
                  }`,
                  background: feedback
                    ? i === feedback.correctIndex
                      ? "rgba(34,197,94,0.18)"
                      : i === feedback.selected
                        ? "rgba(248,113,113,0.18)"
                        : "rgba(255,255,255,0.03)"
                    : eliminated.includes(i)
                      ? "rgba(255,255,255,0.015)"
                      : "rgba(255,255,255,0.05)",
                  opacity: eliminated.includes(i) ? 0.45 : 1,
                  color: T.cream,
                  cursor: feedback || eliminated.includes(i) ? "not-allowed" : "pointer",
                  fontFamily: "'DM Sans',sans-serif",
                  fontSize: 16,
                  fontWeight: 700,
                  minHeight: 64,
                }}
              >
                {opt}
              </button>
            ))}
          </div>
          {feedback && (
            <div style={{ marginTop: 14 }}>
              <div style={{ color: feedback.isCorrect ? "#86efac" : "#fca5a5", fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
                {feedback.timedOut
                  ? "Time is up for this question."
                  : feedback.isCorrect
                    ? `Great answer! +${feedback.points} points`
                    : "Not this one. Keep going."}
              </div>
              <Btn onClick={continueAfterAnswer}>
                {index === game.questions.length - 1 ? "Finish Game ->" : "Next Question ->"}
              </Btn>
            </div>
          )}
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
          {lastResult && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              <span style={{ border: `1px solid ${T.cardBorder}`, borderRadius: 999, padding: "4px 10px", fontSize: 11, color: T.creamFaint }}>
                Points: <strong style={{ color: T.cream }}>{lastResult.points ?? scorePoints}</strong>
              </span>
              <span style={{ border: `1px solid ${T.cardBorder}`, borderRadius: 999, padding: "4px 10px", fontSize: 11, color: T.creamFaint }}>
                Best streak: <strong style={{ color: "#86efac" }}>{lastResult.bestStreak ?? bestStreak}</strong>
              </span>
              <span style={{ border: `1px solid ${T.cardBorder}`, borderRadius: 999, padding: "4px 10px", fontSize: 11, color: T.creamFaint }}>
                Avg response: <strong style={{ color: "#93c5fd" }}>{lastResult.meanRtMs}ms</strong>
              </span>
            </div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={() => setPage("game-results")}>{"View Games Results ->"}</Btn>
            <Btn variant="ghost" onClick={() => setPage("games")}>Back to Games</Btn>
          </div>
        </DarkCard>
      )}
    </div>
  );
}
