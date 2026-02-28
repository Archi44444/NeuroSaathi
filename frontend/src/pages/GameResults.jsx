import { T } from "../utils/theme";
import { DarkCard, Btn } from "../components/RiskDashboard";
import { useGames } from "../context/GamesContext";
import { CATEGORY_STYLE, GAMES } from "../utils/gamesCatalog";

const LIME = "#C8F135";

function resultTone(score) {
  if (score >= 80) return "#86efac";
  if (score >= 60) return "#facc15";
  return "#f87171";
}

export default function GameResults({ setPage }) {
  const { resultsByGame, clearGameResults } = useGames();
  const rows = GAMES.map(game => {
    const list = resultsByGame[game.id] || [];
    const latest = list.length ? list[list.length - 1] : null;
    return { game, attempts: list.length, latest };
  });

  const hasAny = rows.some(r => r.attempts > 0);

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
          marginBottom: 8,
        }}
      >
        Games Results
      </h1>
      <p style={{ color: T.creamFaint, fontSize: 14, marginBottom: 22 }}>
        This section is separate from assessment results to keep clinical assessment output clean.
      </p>

      {!hasAny ? (
        <DarkCard style={{ padding: 26 }} hover={false}>
          <div style={{ color: T.cream, fontWeight: 700, marginBottom: 6 }}>
            No game attempts yet
          </div>
          <div style={{ color: T.creamFaint, fontSize: 13, marginBottom: 14 }}>
            Play a game from the Games section to populate this panel.
          </div>
          <Btn onClick={() => setPage("games")}>{"Go to Games ->"}</Btn>
        </DarkCard>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map(({ game, attempts, latest }) => {
            const tone = CATEGORY_STYLE[game.category] || { color: LIME, bg: "rgba(200,241,53,0.10)" };
            return (
              <DarkCard key={game.id} style={{ padding: 16 }} hover={false}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        border: `1px solid ${T.cardBorder}`,
                        background: "rgba(255,255,255,0.04)",
                        display: "grid",
                        placeItems: "center",
                        fontSize: 18,
                      }}
                    >
                      {game.icon || "?"}
                    </div>
                    <div>
                      <div style={{ color: T.cream, fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
                        {game.title}
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span
                          style={{
                            color: tone.color,
                            background: tone.bg,
                            border: `1px solid ${tone.color}33`,
                            borderRadius: 999,
                            padding: "3px 9px",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {game.category}
                        </span>
                        <span
                          style={{
                            color: T.creamFaint,
                            background: "rgba(255,255,255,0.04)",
                            border: `1px solid ${T.cardBorder}`,
                            borderRadius: 999,
                            padding: "3px 9px",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {game.difficulty || "Standard"}
                        </span>
                        <span
                          style={{
                            color: T.creamFaint,
                            background: "rgba(255,255,255,0.04)",
                            border: `1px solid ${T.cardBorder}`,
                            borderRadius: 999,
                            padding: "3px 9px",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          Attempts: {attempts}
                        </span>
                      </div>
                    </div>
                  </div>

                  {latest ? (
                    <div style={{ textAlign: "right", minWidth: 130 }}>
                      <div style={{ color: resultTone(latest.score), fontWeight: 800, fontSize: 20 }}>
                        {latest.score}%
                      </div>
                      <div style={{ color: T.creamFaint, fontSize: 11 }}>
                        {latest.correct}/{latest.total} correct
                      </div>
                      <div style={{ color: T.creamFaint, fontSize: 11 }}>
                        {latest.durationSec}s
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: "#555", fontSize: 12 }}>Not played</div>
                  )}
                </div>
              </DarkCard>
            );
          })}

          <div style={{ marginTop: 6 }}>
            <Btn variant="ghost" onClick={clearGameResults}>Clear Games Results</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
