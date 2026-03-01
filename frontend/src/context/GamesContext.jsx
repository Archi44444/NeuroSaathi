import { createContext, useContext, useMemo, useState } from "react";

const STORAGE_KEY = "ms_game_results";
const GamesCtx = createContext(null);

function readStore() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(value) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Ignore storage errors.
  }
}

export function GamesProvider({ children }) {
  const [resultsByGame, setResultsByGame] = useState(() => readStore());

  function saveGameResult(gameId, result) {
    setResultsByGame(prev => {
      const next = {
        ...prev,
        [gameId]: [...(prev[gameId] || []), result],
      };
      writeStore(next);
      return next;
    });
  }

  function clearGameResults() {
    setResultsByGame({});
    writeStore({});
  }

  const value = useMemo(() => ({
    resultsByGame,
    saveGameResult,
    clearGameResults,
  }), [resultsByGame]);

  return <GamesCtx.Provider value={value}>{children}</GamesCtx.Provider>;
}

export function useGames() {
  const ctx = useContext(GamesCtx);
  if (!ctx) throw new Error("useGames must be used inside GamesProvider");
  return ctx;
}

