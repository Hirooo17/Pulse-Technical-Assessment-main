import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyPrivacyOffset, isValidLatLng } from "@/lib/geo";
import { PULSE_SIGNALS } from "@/lib/types";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Enforce a shared ID format across all routes:
// UUID-like alphanumeric + hyphens/underscores, 8–64 chars.
const ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;

// Max body size to read from a POST request (64 KB). Prevents memory exhaustion
// from huge payloads before JSON parsing.
const MAX_BODY_BYTES = 64 * 1024;

// POST /api/join — body { id, lat, lng, signal? } (raw coords).
// Applies a 1–3 km privacy offset and upserts the presence row. Raw
// coordinates are never stored. Optionally stores a Pulse Signal emoji.
export async function POST(request: NextRequest) {
  // ── Rate limit: max 10 joins per minute per IP ────────────────────────────
  const ip = getClientIp(request);
  if (!checkRateLimit(ip, "join", 10, 60_000)) {
    return Response.json({ error: "too many requests" }, { status: 429 });
  }

  // ── Body size guard ───────────────────────────────────────────────────────
  let rawText: string;
  try {
    rawText = await request.text();
  } catch {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }
  if (Buffer.byteLength(rawText, "utf8") > MAX_BODY_BYTES) {
    return Response.json({ error: "body too large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawText);
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }

  const { id, lat, lng, signal } = (body ?? {}) as Record<string, unknown>;

  // ── ID validation ─────────────────────────────────────────────────────────
  if (typeof id !== "string" || !ID_RE.test(id)) {
    return Response.json({ error: "invalid id" }, { status: 400 });
  }

  // ── Coordinate validation ─────────────────────────────────────────────────
  if (!isValidLatLng(lat, lng)) {
    return Response.json({ error: "invalid coordinates" }, { status: 400 });
  }

  // ── Signal validation (optional) ──────────────────────────────────────────
  // Only accept emojis from the PULSE_SIGNALS allowlist; silently ignore
  // anything else rather than failing the join (signal is cosmetic).
  const signalValue =
    typeof signal === "string" && signal in PULSE_SIGNALS ? signal : null;

  const offset = applyPrivacyOffset(lat as number, lng as number);

  await prisma.presence.upsert({
    where: { id },
    create: {
      id,
      lat: offset.lat,
      lng: offset.lng,
      busy: false,
      signal: signalValue,
      lastSeen: new Date(),
    },
    update: {
      lat: offset.lat,
      lng: offset.lng,
      signal: signalValue,
      lastSeen: new Date(),
    },
  });

  return Response.json({ ok: true });
}
