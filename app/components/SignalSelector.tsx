"use client";

import { PULSE_SIGNALS } from "@/lib/types";

// Keys in display order — matches the PULSE_SIGNALS constant.
const SIGNAL_ENTRIES = Object.entries(PULSE_SIGNALS) as [string, string][];

export default function SignalSelector({
  value,
  onChange,
}: {
  /** Currently selected emoji, or null for "no signal". */
  value: string | null;
  onChange: (emoji: string | null) => void;
}) {
  return (
    <div className="signal-selector" role="group" aria-label="Choose your vibe">
      {/* Clear / none option */}
      <button
        id="signal-none"
        className={`signal-pill signal-none-pill${value === null ? " selected" : ""}`}
        onClick={() => onChange(null)}
        title="No signal"
        aria-pressed={value === null}
      >
        –
      </button>

      {SIGNAL_ENTRIES.map(([emoji, label]) => (
        <button
          key={emoji}
          id={`signal-${label.toLowerCase().replace(/\s+/g, "-")}`}
          className={`signal-pill${value === emoji ? " selected" : ""}`}
          onClick={() => onChange(value === emoji ? null : emoji)}
          title={label}
          aria-label={label}
          aria-pressed={value === emoji}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
