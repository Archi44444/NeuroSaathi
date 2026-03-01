import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_CHANNELS,
  sendCommunityMessage,
  setCommunityPresence,
  subscribeChannelMessages,
  subscribeCommunityChannels,
  subscribeCommunityMembers,
} from "../services/community";

const INDIGO = "#818cf8";
const STATUS_COLOR = { online: "#34d399", away: "#fbbf24", offline: "#6b7280" };
const STATUS_LABEL = { online: "Online", away: "Away", offline: "Offline" };

function formatMessageTime(value) {
  if (!value) return "now";
  try {
    const date = value?.toDate ? value.toDate() : new Date(value);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "now";
  }
}

export default function CommunityPage() {
  const [channels, setChannels] = useState(DEFAULT_CHANNELS);
  const [activeChannel, setActiveChannel] = useState(DEFAULT_CHANNELS[0].id);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState("all");
  const [messageText, setMessageText] = useState("");
  const [sendError, setSendError] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    const unsubChannels = subscribeCommunityChannels((next) => {
      const safe = next.length ? next : DEFAULT_CHANNELS;
      setChannels(safe);
      setActiveChannel((prev) => (safe.some((ch) => ch.id === prev) ? prev : safe[0].id));
    });
    const unsubMembers = subscribeCommunityMembers(setMembers);
    return () => {
      unsubChannels();
      unsubMembers();
    };
  }, []);

  useEffect(() => {
    const unsubMessages = subscribeChannelMessages(activeChannel, setMessages);
    return () => unsubMessages();
  }, [activeChannel]);

  useEffect(() => {
    setCommunityPresence("online").catch(() => {});
    const onVisibility = () => {
      const next = document.hidden ? "away" : "online";
      setCommunityPresence(next).catch(() => {});
    };
    const onUnload = () => setCommunityPresence("offline");
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onUnload);
      setCommunityPresence("away").catch(() => {});
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, activeChannel]);

  const filteredMembers = useMemo(
    () => (filter === "all" ? members : members.filter((m) => m.status === filter)),
    [filter, members],
  );
  const onlineCount = members.filter((m) => m.status === "online").length;

  async function handleSend() {
    if (!messageText.trim()) return;
    setSending(true);
    setSendError("");
    try {
      await sendCommunityMessage(activeChannel, messageText);
      setMessageText("");
    } catch (e) {
      setSendError(e.message || "Message failed to send.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: `${INDIGO}14`, border: `1px solid ${INDIGO}33`, borderRadius: 99, padding: "5px 14px", marginBottom: 14, fontSize: 11, fontWeight: 700, color: INDIGO, letterSpacing: 1.5, textTransform: "uppercase" }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#34d399", display: "inline-block" }} />
          {onlineCount} online
        </div>
        <h1 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 34, color: "#f0ece3", letterSpacing: -1, marginBottom: 8, fontWeight: 400 }}>
          Community
        </h1>
        <p style={{ color: "rgba(240,236,227,0.45)", fontSize: 14, lineHeight: 1.6, maxWidth: 600 }}>
          Live channels with real-time member presence and messages.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px minmax(0,1fr) 220px", gap: 16 }}>
        <div>
          <div style={{ background: "#141414", borderRadius: 16, padding: 14, border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 700, marginBottom: 10, padding: "0 4px" }}>Channels</div>
            {channels.map((ch) => (
              <button key={ch.id} onClick={() => setActiveChannel(ch.id)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8,
                border: "none", background: activeChannel === ch.id ? `${INDIGO}14` : "transparent",
                color: activeChannel === ch.id ? INDIGO : "rgba(255,255,255,0.45)",
                fontWeight: activeChannel === ch.id ? 600 : 400, fontSize: 13, cursor: "pointer",
                textAlign: "left", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s",
              }}>
                <span>{ch.icon || "💬"}</span>
                <span>{ch.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: "#141414", borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", minHeight: 420 }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16 }}>{channels.find((c) => c.id === activeChannel)?.icon || "💬"}</span>
            <span style={{ fontWeight: 700, color: "#f0ece3", fontSize: 14 }}>
              {channels.find((c) => c.id === activeChannel)?.label || "# general"}
            </span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
              {messages.length} messages
            </span>
          </div>

          <div style={{ flex: 1, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", minHeight: 260 }}>
            {messages.length === 0 ? (
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>No messages yet. Start the conversation.</div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} style={{ display: "flex", gap: 12 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                    background: `linear-gradient(135deg, ${INDIGO}33, rgba(99,102,241,0.15))`,
                    border: `1px solid ${INDIGO}25`, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 12, color: INDIGO, fontWeight: 700,
                  }}>
                    {(msg.user || "A").charAt(0)}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: "#f0ece3" }}>{msg.user}</span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{formatMessageTime(msg.createdAt)}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "rgba(240,236,227,0.65)", lineHeight: 1.6, margin: 0 }}>{msg.text}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>

          <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                placeholder="Write a message..."
                style={{
                  flex: 1, borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.04)", color: "#f0ece3",
                  padding: "10px 12px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none",
                }}
              />
              <button
                onClick={handleSend}
                disabled={sending || !messageText.trim()}
                style={{
                  border: "1px solid rgba(129,140,248,0.35)",
                  background: sending || !messageText.trim() ? "rgba(129,140,248,0.14)" : "rgba(129,140,248,0.26)",
                  color: "#f0ece3", borderRadius: 10, padding: "10px 14px",
                  fontSize: 12, fontWeight: 700, cursor: sending || !messageText.trim() ? "not-allowed" : "pointer",
                }}
              >
                Send
              </button>
            </div>
            {sendError ? (
              <div style={{ marginTop: 8, fontSize: 11, color: "#f87171" }}>{sendError}</div>
            ) : null}
          </div>
        </div>

        <div>
          <div style={{ background: "#141414", borderRadius: 16, padding: 14, border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 700, marginBottom: 10, padding: "0 4px" }}>Members</div>
            <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
              {["all", "online", "away", "offline"].map((value) => (
                <button key={value} onClick={() => setFilter(value)} style={{
                  padding: "3px 8px", borderRadius: 6, border: "none", fontSize: 10, cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                  background: filter === value ? "rgba(255,255,255,0.1)" : "transparent",
                  color: filter === value ? "#f0ece3" : "rgba(255,255,255,0.3)", fontWeight: filter === value ? 700 : 400,
                }}>
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 380, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}>
              {filteredMembers.length === 0 ? (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", padding: "6px 4px" }}>No members yet.</div>
              ) : (
                filteredMembers.map((member) => (
                  <div key={member.id} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "6px 6px", borderRadius: 8,
                    opacity: member.status === "offline" ? 0.45 : 1,
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      background: `linear-gradient(135deg, ${INDIGO}33, rgba(99,102,241,0.15))`,
                      border: `1px solid ${INDIGO}25`, display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 10, color: INDIGO, fontWeight: 700,
                      position: "relative",
                    }}>
                      {member.name.charAt(0)}
                      <span style={{
                        position: "absolute", bottom: -1, right: -1,
                        width: 8, height: 8, borderRadius: "50%",
                        background: STATUS_COLOR[member.status] || STATUS_COLOR.online, border: "1.5px solid #141414",
                      }} />
                    </div>
                    <div style={{ overflow: "hidden" }}>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {member.name}
                      </div>
                      <div style={{ fontSize: 10, color: STATUS_COLOR[member.status] || STATUS_COLOR.online }}>
                        {STATUS_LABEL[member.status] || STATUS_LABEL.online}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
