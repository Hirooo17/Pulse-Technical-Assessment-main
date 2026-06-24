// Shared types across client + API.

// Signal mailbox message types.
export type SignalType =
  | "request" // connection request (tap a dot)
  | "accept" // recipient accepted
  | "decline" // recipient declined (or auto-declined while busy)
  | "offer" // WebRTC SDP offer
  | "answer" // WebRTC SDP answer
  | "ice" // WebRTC ICE candidate
  | "end"; // hang up / leave the connection

// Pulse Signals — session vibe/status. The key is the emoji stored on the
// Presence row; the value is the human-readable label shown in the UI.
export const PULSE_SIGNALS: Record<string, string> = {
  "👋": "Open to chat",
  "💻": "Coding",
  "🎮": "Gaming",
  "☕": "Chill",
  "🎧": "Music",
  "🌙": "Late night",
  "🧠": "Deep talk",
};

export type PulseSignalEmoji = keyof typeof PULSE_SIGNALS;

export interface PeerDot {
  id: string;
  lat: number;
  lng: number;
  busy: boolean;
  /** Session-scoped vibe chosen by the peer (null = no signal set). */
  signal: string | null;
}

export interface SignalMsg {
  id: string;
  fromId: string;
  toId: string;
  type: SignalType;
  payload: string | null;
  createdAt: string;
}

export interface PollResponse {
  peers: PeerDot[];
  signals: SignalMsg[];
}
