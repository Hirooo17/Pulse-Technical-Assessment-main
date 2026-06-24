"use client";

import { useEffect, useRef, useState } from "react";

export interface ChatMessage {
  id: number;
  mine: boolean;
  text: string;
}

// ── Icons ────────────────────────────────────────────────────
function IconVideo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M15 10l4.553-2.277A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconX({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSend({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ChatPanel({
  messages,
  connected,
  videoBusy,
  peerSignal,
  onSend,
  onStartVideo,
  onEnd,
}: {
  messages: ChatMessage[];
  connected: boolean;
  videoBusy: boolean;
  /** The peer's selected Pulse Signal emoji (null = none). */
  peerSignal?: string | null;
  onSend: (text: string) => void;
  onStartVideo: () => void;
  onEnd: () => void;
}) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !connected) return;
    onSend(text);
    setDraft("");
  }

  return (
    <div
      className="animate-slide-in-right glass absolute inset-y-0 right-0 z-20 flex flex-col"
      style={{
        width: "min(100vw, 380px)",
        borderTopWidth: 0,
        borderBottomWidth: 0,
        borderRightWidth: 0,
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Avatar / signal icon */}
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "10px",
              background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: peerSignal ? "18px" : "15px",
            }}
          >
            {peerSignal ?? "👤"}
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: "14px", color: "#fff" }}>
              Stranger
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
              {connected ? (
                <>
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "9999px",
                      background: "#34d399",
                      boxShadow: "0 0 5px #34d399",
                      display: "inline-block",
                    }}
                  />
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)" }}>
                    Connected
                  </span>
                </>
              ) : (
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>
                  Connecting…
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            id="chat-video-btn"
            onClick={onStartVideo}
            disabled={!connected || videoBusy}
            className="icon-btn"
            title="Start video call"
          >
            <IconVideo />
          </button>
          <button
            id="chat-end-btn"
            onClick={onEnd}
            className="icon-btn danger"
            title="End connection"
          >
            <IconX />
          </button>
        </div>
      </header>

      {/* ── Messages ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 14px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              color: "rgba(255,255,255,0.22)",
              paddingBottom: "40px",
            }}
          >
            <span style={{ fontSize: "32px" }}>👋</span>
            <p style={{ fontSize: "13px", textAlign: "center", maxWidth: "180px", lineHeight: 1.6 }}>
              {connected
                ? "Say hello! Messages are end-to-end and never stored."
                : "Establishing a secure peer-to-peer channel…"}
            </p>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className="animate-fade-in"
            style={{
              display: "flex",
              justifyContent: m.mine ? "flex-end" : "flex-start",
            }}
          >
            <span
              style={{
                maxWidth: "78%",
                borderRadius: m.mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                padding: "9px 13px",
                fontSize: "14px",
                lineHeight: 1.5,
                background: m.mine
                  ? "linear-gradient(135deg,#34d399,#10b981)"
                  : "rgba(255,255,255,0.08)",
                color: m.mine ? "#052e16" : "#e8e8f0",
                border: m.mine ? "none" : "1px solid rgba(255,255,255,0.06)",
                wordBreak: "break-word",
              }}
            >
              {m.text}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* ── Input ── */}
      <form
        onSubmit={submit}
        style={{
          display: "flex",
          gap: "8px",
          padding: "12px 14px",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          flexShrink: 0,
        }}
      >
        <input
          id="chat-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={connected ? "Message…" : "Connecting…"}
          disabled={!connected}
          style={{
            flex: 1,
            borderRadius: "9999px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.09)",
            padding: "9px 16px",
            fontSize: "14px",
            color: "#e8e8f0",
            outline: "none",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) =>
            ((e.currentTarget as HTMLInputElement).style.borderColor =
              "rgba(52,211,153,0.5)")
          }
          onBlur={(e) =>
            ((e.currentTarget as HTMLInputElement).style.borderColor =
              "rgba(255,255,255,0.09)")
          }
        />
        <button
          id="chat-send-btn"
          type="submit"
          disabled={!connected || !draft.trim()}
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "9999px",
            background:
              connected && draft.trim()
                ? "linear-gradient(135deg,#34d399,#10b981)"
                : "rgba(255,255,255,0.06)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color:
              connected && draft.trim() ? "#052e16" : "rgba(255,255,255,0.25)",
            cursor: connected && draft.trim() ? "pointer" : "not-allowed",
            transition: "all 0.15s",
            flexShrink: 0,
          }}
        >
          <IconSend />
        </button>
      </form>
    </div>
  );
}
