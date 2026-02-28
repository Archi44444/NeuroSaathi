import { T } from "../utils/theme";
import { DarkCard } from "../components/RiskDashboard";
import { useGames } from "../context/GamesContext";
import { CATEGORY_STYLE, GAMES } from "../utils/gamesCatalog";

const LIME = "#C8F135";

export default function GamesHub({ setPage }) {
  const { resultsByGame } = useGames();
  const byCategory = GAMES.reduce((acc, g) => {
    if (!acc[g.category]) acc[g.category] = [];
    acc[g.category].push(g);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 36, color: T.cream, letterSpacing: -1, marginBottom: 8 }}>CST Games</h1>
        <p style={{ color: T.creamFaint, fontSize: 14, maxWidth: 760 }}>
          Separate cognitive training modules. These game results are stored independently from clinical assessment outputs.
        </p>
      </div>

      {Object.entries(byCategory).map(([category, list]) => (
        <div key={category} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: CATEGORY_STYLE[category]?.color || LIME, textTransform: "uppercase", letterSpacing: 1.1, fontWeight: 700, marginBottom: 10 }}>{category}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
            {list.map(game => {
              const played = (resultsByGame[game.id] || []).length > 0;
              const cat = CATEGORY_STYLE[game.category] || { color: LIME, bg: `${LIME}12` };
              return (
                <DarkCard key={game.id} style={{ padding: 18, cursor: "pointer" }} onClick={() => setPage(game.id)}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: cat.bg, border: `1px solid ${cat.color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                      {game.icon}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <span style={{ padding: "2px 8px", borderRadius: 20, border: `1px solid ${cat.color}44`, color: cat.color, background: cat.bg, fontSize: 10, fontWeight: 700 }}>{game.category}</span>
                      <span style={{ padding: "2px 8px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.15)", color: T.creamFaint, background: "rgba(255,255,255,0.04)", fontSize: 10, fontWeight: 700 }}>{game.difficulty}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                    <div style={{ color: T.cream, fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>{game.title}</div>
                    {played && (
                      <span style={{ padding: "2px 8px", borderRadius: 20, border: `1px solid ${LIME}44`, color: LIME, background: `${LIME}12`, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>Played</span>
                    )}
                  </div>

                  <div style={{ color: T.creamFaint, fontSize: 12, lineHeight: 1.6 }}>{game.measures}</div>
                  <div style={{ marginTop: 12, color: cat.color, fontSize: 12, fontWeight: 700 }}>Start -&gt;</div>
                </DarkCard>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
