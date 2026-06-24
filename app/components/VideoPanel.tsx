"use client";

import { useEffect, useRef, useState } from "react";

function IconPhone({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function VideoPanel({
  localStream,
  remoteStream,
  onEnd,
}: {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onEnd: () => void;
}) {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (localRef.current && localRef.current.srcObject !== localStream) {
      localRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteRef.current && remoteRef.current.srcObject !== remoteStream) {
      remoteRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Call timer
  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const secs = String(elapsed % 60).padStart(2, "0");

  return (
    <div
      className="animate-fade-in absolute inset-0 z-30 flex flex-col"
      style={{ background: "#05050d" }}
    >
      {/* Remote video — fills the space */}
      <div style={{ position: "relative", flex: 1 }}>
        <video
          ref={remoteRef}
          autoPlay
          playsInline
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            background: "#0d0d18",
          }}
        />

        {/* Waiting overlay */}
        {!remoteStream && (
          <div
            className="animate-fade-in"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              color: "rgba(255,255,255,0.38)",
            }}
          >
            <svg
              className="animate-spin-slow"
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="rgba(52,211,153,0.25)"
                strokeWidth="2.5"
              />
              <path
                d="M12 2a10 10 0 0 1 10 10"
                stroke="#34d399"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <span style={{ fontSize: "13px" }}>
              Waiting for stranger&rsquo;s video…
            </span>
          </div>
        )}

        {/* Local PIP */}
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            right: "16px",
            width: "120px",
            height: "160px",
            borderRadius: "14px",
            overflow: "hidden",
            border: "2px solid rgba(255,255,255,0.15)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
            background: "#1a1a2e",
          }}
        >
          <video
            ref={localRef}
            autoPlay
            playsInline
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          {!localStream && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,255,255,0.3)",
                fontSize: "11px",
              }}
            >
              No cam
            </div>
          )}
        </div>

        {/* Timer badge */}
        <div
          className="glass"
          style={{
            position: "absolute",
            top: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "4px 14px",
            borderRadius: "9999px",
            fontSize: "13px",
            fontWeight: 600,
            color: "rgba(255,255,255,0.7)",
            letterSpacing: "0.06em",
          }}
        >
          {mins}:{secs}
        </div>
      </div>

      {/* Control bar */}
      <div
        className="glass"
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "16px",
          borderTopWidth: 1,
          borderBottomWidth: 0,
          borderLeftWidth: 0,
          borderRightWidth: 0,
        }}
      >
        <button
          id="video-end-btn"
          onClick={onEnd}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 28px",
            borderRadius: "9999px",
            background: "linear-gradient(135deg,#ef4444,#dc2626)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "14px",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 0 20px rgba(239,68,68,0.4), 0 4px 12px rgba(0,0,0,0.4)",
            transition: "opacity 0.15s",
          }}
          onMouseOver={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.opacity = "0.85")
          }
          onMouseOut={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.opacity = "1")
          }
        >
          <IconPhone />
          End call
        </button>
      </div>
    </div>
  );
}
