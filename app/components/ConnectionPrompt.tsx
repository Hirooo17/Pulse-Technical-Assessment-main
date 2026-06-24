"use client";

// Reusable centered prompt for "someone wants to connect" and
// "someone wants to start video".
export default function ConnectionPrompt({
  title,
  subtitle,
  acceptLabel,
  declineLabel,
  onAccept,
  onDecline,
}: {
  title: string;
  subtitle?: string;
  acceptLabel: string;
  declineLabel: string;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="glass animate-scale-in w-full text-center"
        style={{ maxWidth: "320px", borderRadius: "20px", padding: "28px 24px" }}
      >
        {/* Icon */}
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            background: "rgba(52,211,153,0.12)",
            border: "1px solid rgba(52,211,153,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
              fill="rgba(52,211,153,0.8)"
            />
          </svg>
        </div>

        <h2
          style={{
            fontSize: "16px",
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            style={{
              marginTop: "6px",
              fontSize: "13px",
              color: "rgba(255,255,255,0.48)",
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </p>
        )}

        <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
          <button
            id="conn-decline-btn"
            onClick={onDecline}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: "9999px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.65)",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,0.1)";
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,0.05)";
            }}
          >
            {declineLabel}
          </button>
          <button
            id="conn-accept-btn"
            onClick={onAccept}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: "9999px",
              background: "linear-gradient(135deg, #34d399, #10b981)",
              color: "#052e16",
              fontSize: "14px",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 0 16px rgba(52,211,153,0.3)",
              transition: "opacity 0.15s",
            }}
            onMouseOver={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.opacity = "0.88")
            }
            onMouseOut={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.opacity = "1")
            }
          >
            {acceptLabel}
          </button>
        </div>

        <p
          style={{
            marginTop: "14px",
            fontSize: "11px",
            color: "rgba(255,255,255,0.22)",
          }}
        >
          Anonymous · approximate location · no history
        </p>
      </div>
    </div>
  );
}
