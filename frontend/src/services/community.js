import { db } from "../firebase";
import { getUser } from "./api";
import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

export const DEFAULT_CHANNELS = [
  { id: "general", label: "# general", icon: "💬" },
  { id: "tips", label: "# daily-tips", icon: "💡" },
  { id: "progress", label: "# progress-share", icon: "📊" },
  { id: "support", label: "# support", icon: "🤝" },
];

const FALLBACK_STATUS = "online";

function currentUser() {
  const user = getUser() || {};
  const id = String(user.id || user.user_id || user.email || user.full_name || "").trim();
  if (!id) return null;
  return {
    id,
    name: user.full_name || user.name || "Anonymous",
  };
}

function normalizeStatus(value) {
  if (value === "away" || value === "offline") return value;
  return FALLBACK_STATUS;
}

function normalizeMember(data, id) {
  return {
    id,
    name: data?.name || "Anonymous",
    status: normalizeStatus(data?.status),
    joinedAt: data?.joinedAt || null,
    lastSeen: data?.lastSeen || null,
  };
}

function normalizeChannel(data, id) {
  return {
    id,
    label: data?.label || `# ${id}`,
    icon: data?.icon || "💬",
  };
}

function normalizeMessage(data, id) {
  return {
    id,
    userId: data?.userId || "",
    user: data?.user || "Anonymous",
    text: data?.text || "",
    createdAt: data?.createdAt || null,
  };
}

export async function setCommunityPresence(status = FALLBACK_STATUS) {
  if (!db) return;
  const user = currentUser();
  if (!user) return;

  await setDoc(
    doc(db, "community_members", user.id),
    {
      name: user.name,
      status: normalizeStatus(status),
      lastSeen: serverTimestamp(),
      joinedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function subscribeCommunityMembers(onChange) {
  if (!db) {
    onChange([]);
    return () => {};
  }

  const q = query(collection(db, "community_members"), orderBy("name", "asc"));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => normalizeMember(d.data(), d.id))),
    () => onChange([]),
  );
}

export function subscribeCommunityChannels(onChange) {
  if (!db) {
    onChange(DEFAULT_CHANNELS);
    return () => {};
  }

  const q = query(collection(db, "community_channels"), orderBy("label", "asc"));
  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        onChange(DEFAULT_CHANNELS);
        return;
      }
      onChange(snap.docs.map((d) => normalizeChannel(d.data(), d.id)));
    },
    () => onChange(DEFAULT_CHANNELS),
  );
}

export function subscribeChannelMessages(channelId, onChange, max = 150) {
  if (!db || !channelId) {
    onChange([]);
    return () => {};
  }

  const q = query(
    collection(db, "community_channels", channelId, "messages"),
    orderBy("createdAt", "asc"),
    limit(max),
  );
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => normalizeMessage(d.data(), d.id))),
    () => onChange([]),
  );
}

export async function sendCommunityMessage(channelId, text) {
  if (!db) throw new Error("Community service is not configured.");
  const user = currentUser();
  if (!user) throw new Error("Please log in to post in community.");
  const trimmed = String(text || "").trim();
  if (!trimmed) return;

  await addDoc(collection(db, "community_channels", channelId, "messages"), {
    userId: user.id,
    user: user.name,
    text: trimmed,
    createdAt: serverTimestamp(),
  });
}
