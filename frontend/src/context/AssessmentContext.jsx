/**
 * AssessmentContext v4
 * Holds raw data from all 5 test modules + API response.
 * Persists results to Firebase Firestore for cross-device access.
 */
import { createContext, useContext, useState, useCallback } from "react";
import { db } from "../firebase";
import {
  collection, addDoc, query, where, orderBy, getDocs, serverTimestamp,
} from "firebase/firestore";

const Ctx = createContext(null);

export function AssessmentProvider({ children }) {
  const [speechData,   setSpeechData]   = useState(null);
  const [memoryData,   setMemoryData]   = useState(null);
  const [reactionData, setReactionData] = useState(null);
  const [stroopData,   setStroopData]   = useState(null);
  const [tapData,      setTapData]      = useState(null);
  const [profile,      setProfile]      = useState(null);
  const [apiResult,    setApiResultRaw] = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [savedResults, setSavedResults] = useState([]); // loaded from Firestore

  const completedCount = [speechData, memoryData, reactionData, stroopData, tapData].filter(Boolean).length;

  // Save result to Firestore and update local cache
  const setApiResult = useCallback(async (result) => {
    setApiResultRaw(result);
    try {
      const user = JSON.parse(sessionStorage.getItem("neuroaid_user") || "{}");
      if (user?.id) {
        const doc = {
          userId: user.id,
          timestamp: serverTimestamp(),
          ...result,
        };
        await addDoc(collection(db, "results"), doc);
        // Update local cache
        setSavedResults(prev => [...prev, { ...result, timestamp: new Date().toISOString() }]);
      }
    } catch (e) {
      // Firestore save failed (no config or offline) — not critical
      console.warn("Firestore save skipped:", e.message);
    }
  }, []);

  // Load historical results from Firestore for the current user
  const loadHistory = useCallback(async () => {
    try {
      const user = JSON.parse(sessionStorage.getItem("neuroaid_user") || "{}");
      if (!user?.id) return [];
      const q = query(
        collection(db, "results"),
        where("userId", "==", user.id),
        orderBy("timestamp", "asc"),
      );
      const snap = await getDocs(q);
      const results = snap.docs.map(d => ({
        ...d.data(),
        id: d.id,
        timestamp: d.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
      }));
      setSavedResults(results);
      return results;
    } catch (e) {
      console.warn("Firestore load failed:", e.message);
      return [];
    }
  }, []);

  function reset() {
    setSpeechData(null); setMemoryData(null); setReactionData(null);
    setStroopData(null); setTapData(null);
    setApiResultRaw(null); setError(null);
  }

  return (
    <Ctx.Provider value={{
      speechData,   setSpeechData,
      memoryData,   setMemoryData,
      reactionData, setReactionData,
      stroopData,   setStroopData,
      tapData,      setTapData,
      profile,      setProfile,
      apiResult,    setApiResult,
      loading,      setLoading,
      error,        setError,
      completedCount,
      reset,
      savedResults, setSavedResults,
      loadHistory,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAssessment = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAssessment must be inside AssessmentProvider");
  return ctx;
};
