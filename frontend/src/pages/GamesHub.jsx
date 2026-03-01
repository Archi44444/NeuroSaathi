import { T } from "../utils/theme";
import { DarkCard } from "../components/RiskDashboard";
import { useGames } from "../context/GamesContext";
import { CATEGORY_STYLE, GAMES } from "../utils/gamesCatalog";

const LIME = "#C8F135";
const REQUIRED_GAMES = 5;

export default function GamesHub({ setPage }) {
  const { resultsByGame } = useGames();
  const playedCount = GAMES.filter(g => (resultsByGame[g.id] || []).length > 0).length;

  const byCategory = GAMES.reduce((acc, g) => {
    if (!acc[g.category]) acc[g.category] = [];
    acc[g.category].push(g);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(200,241,53,0.10)", border: `1px solid ${LIME}33`, borderRadius: 99, padding: "5px 14px", marginBottom: 14, fontSize: 11, fontWeight: 700, color: LIME, letterSpacing: 1.5, textTransform: "uppercase" }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: LIME, display: "inline-block" }} />
          CST Games
        </div>
        <h1 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 36, color: T.cream, letterSpacing: -1, marginBottom: 8 }}>Games Hub</h1>
        <p style={{ color: T.creamFaint, fontSize: 14, maxWidth: 760 }}>
          Complete at least <strong style={{ color: LIME }}>5 out of 9</strong> games to generate your cognitive training analysis. Results are stored independently from clinical assessments.
        </p>
      </div>

      {/* Progress bar */}
      <DarkCard style={{ padding: 20, marginBottom: 28 }} hover={false}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: "#888", fontWeight: 700, letterSpacing: 0.5 }}>Games Progress</span>
          <span style={{ fontSize: 13, fontWeight: 900, color: playedCount >= REQUIRED_GAMES ? LIME : "#fff" }}>
            {playedCount} <span style={{ color: "#444", fontWeight: 400 }}>/ 9</span>
            {playedCount >= REQUIRED_GAMES && <span style={{ color: LIME, marginLeft: 8, fontSize: 11 }}>✓ Minimum reached</span>}
          </span>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${(playedCount / 9) * 100}%`,
            background: `linear-gradient(90deg, ${LIME}, #9ABF28)`,
            borderRadius: 2, transition: "width 0.6s ease", boxShadow: `0 0 12px ${LIME}55`,
          }} />
        </div>
        {playedCount >= REQUIRED_GAMES && (
          <div style={{ marginTop: 10 }}>
            <button
              onClick={() => setPage("game-results")}
              style={{
                padding: "8px 18px", borderRadius: 10, background: LIME, color: "#0a0a0a",
                fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
              }}
            >
              🧠 View Game Analysis Results →
            </button>
          </div>
        )}
      </DarkCard>

      {Object.entries(byCategory).map(([category, list]) => (
        <div key={category} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: CATEGORY_STYLE[category]?.color || LIME, textTransform: "uppercase", letterSpacing: 1.1, fontWeight: 700, marginBottom: 10 }}>{category}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
            {list.map(game => {
              const played = (resultsByGame[game.id] || []).length > 0;
              const cat = CATEGORY_STYLE[game.category] || { color: LIME, bg: `${LIME}12` };
              return (
                <DarkCard key={game.id} style={{ padding: 18, cursor: "pointer", position: "relative" }} onClick={() => setPage(game.id)}>
                  {played && (
                    <div style={{ position: "absolute", top: 12, right: 12, background: `${LIME}12`, border: `1px solid ${LIME}44`, borderRadius: 8, padding: "2px 8px", fontSize: 10, color: LIME, fontWeight: 700 }}>
                      ✓ DONE
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: cat.bg, border: `1px solid ${cat.color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                      {game.icon}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <span style={{ padding: "2px 8px", borderRadius: 20, border: `1px solid ${cat.color}44`, color: cat.color, background: cat.bg, fontSize: 10, fontWeight: 700 }}>{game.category}</span>
                      <span style={{ padding: "2px 8px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.15)", color: T.creamFaint, background: "rgba(255,255,255,0.04)", fontSize: 10, fontWeight: 700 }}>{game.difficulty}</span>
                    </div>
                  </div>
                  <div style={{ color: T.cream, fontWeight: 700, fontSize: 15, lineHeight: 1.3, marginBottom: 8 }}>{game.title}</div>
                  <div style={{ color: T.creamFaint, fontSize: 12, lineHeight: 1.6 }}>{game.measures}</div>
                  <div style={{ marginTop: 12, color: cat.color, fontSize: 12, fontWeight: 700 }}>{played ? "Replay →" : "Start →"}</div>
                </DarkCard>
              );
            })}
          </div>
        </div>
      ))}

      {playedCount >= REQUIRED_GAMES && (
        <div style={{ marginTop: 8, padding: "14px 20px", background: `${LIME}08`, border: `1px solid ${LIME}25`, borderRadius: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: LIME, fontWeight: 600 }}>
            🎯 You've completed {playedCount}/9 games — analysis available!
          </span>
          <button
            onClick={() => setPage("game-results")}
            style={{ padding: "8px 16px", borderRadius: 10, background: LIME, color: "#0a0a0a", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}
          >
            View Results →
          </button>
        </div>
      )}
    </div>
  );
}
