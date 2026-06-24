"use client";

import { useState } from "react";

export default function EntryGate({
  onReady,
}: {
  onReady: (lat: number, lng: number) => void;
}) {
  const [status, setStatus] = useState<"idle" | "locating" | "error">("idle");
  const [error, setError] = useState<string>("");

  function enter() {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      setError("Your browser doesn't support location access.");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => onReady(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        setStatus("error");
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission is required to place you on the map."
            : "Couldn't get your location. Please try again.",
        );
      },
      // We relax the accuracy and maximumAge because strict high-accuracy
      // often times out on desktop browsers without a GPS chip.
      { timeout: 15_000, maximumAge: 60_000 },
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-[#090912] p-6">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          style={{
            position: "absolute",
            top: "30%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "520px",
            height: "520px",
            borderRadius: "9999px",
            background:
              "radial-gradient(circle, rgba(52,211,153,0.09) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
      </div>

      <div className="animate-fade-in relative z-10 flex flex-col items-center gap-8 text-center">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3">
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #34d399 0%, #059669 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 32px rgba(52,211,153,0.35)",
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" fill="white" />
              <circle
                cx="12"
                cy="12"
                r="7"
                stroke="white"
                strokeWidth="1.5"
                strokeOpacity="0.5"
              />
              <circle
                cx="12"
                cy="12"
                r="11"
                stroke="white"
                strokeWidth="1"
                strokeOpacity="0.2"
              />
            </svg>
          </div>
          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "#fff",
            }}
          >
            Pulse
          </h1>
          <p
            style={{
              maxWidth: "340px",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.52)",
              fontSize: "15px",
            }}
          >
            A living globe of anonymous strangers. Drop onto the map, tap a dot,
            and start talking.
          </p>
        </div>

        {/* CTA */}
        <button
          id="enter-pulse-btn"
          onClick={enter}
          disabled={status === "locating"}
          style={{
            padding: "12px 32px",
            borderRadius: "9999px",
            background:
              status === "locating"
                ? "rgba(52,211,153,0.4)"
                : "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
            color: status === "locating" ? "rgba(255,255,255,0.6)" : "#052e16",
            fontWeight: 700,
            fontSize: "15px",
            border: "none",
            cursor: status === "locating" ? "not-allowed" : "pointer",
            boxShadow:
              status === "locating"
                ? "none"
                : "0 0 24px rgba(52,211,153,0.4), 0 4px 12px rgba(0,0,0,0.4)",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            minWidth: "180px",
            justifyContent: "center",
          }}
        >
          {status === "locating" ? (
            <>
              <svg
                className="animate-spin-slow"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeOpacity="0.3"
                />
                <path
                  d="M12 2a10 10 0 0 1 10 10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              Locating…
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                  fill="currentColor"
                />
              </svg>
              Enter Pulse
            </>
          )}
        </button>

        {status === "error" && (
          <p
            className="animate-fade-in"
            style={{
              maxWidth: "320px",
              fontSize: "13px",
              color: "#f87171",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "12px",
              padding: "10px 16px",
            }}
          >
            {error}
          </p>
        )}

        {/* Footer note */}
        <p
          style={{
            maxWidth: "300px",
            fontSize: "12px",
            color: "rgba(255,255,255,0.28)",
            lineHeight: 1.7,
          }}
        >
          No sign-up. Your dot is placed 1–3&nbsp;km from your real location.
          Nothing is stored — closing the tab ends everything.
        </p>
      </div>
    </div>
  );
}
