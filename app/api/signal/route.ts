import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import type { SignalType } from "@/lib/types";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Enforce a shared ID format across all routes.
const ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;

const VALID_TYPES: SignalType[] = [
  "request",
  "accept",
  "decline",
  "offer",
  "answer",
  "ice",
  "end",
];

const MAX_PAYLOAD = 64 * 1024; // SDP/ICE are small; cap to be safe.
const MAX_BODY_BYTES = 64 * 1024;

// POST /api/signal — body { fromId, toId, type, payload? }
// Drops one message into the recipient's mailbox. Also manages the `busy`
// flag so a user can only be in one connection at a time.
export async function POST(request: NextRequest) {
  // ── Rate limit: max 120 signals per minute per IP ─────────────────────────
  // (WebRTC signaling involves rapid ICE candidate exchanges — 120/min is
  // generous for legitimate use and still throttles obvious spam.)
  const ip = getClientIp(request);
  if (!checkRateLimit(ip, "signal", 120, 60_000)) {
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

  const { fromId, toId, type, payload } = (body ?? {}) as Record<
    string,
    unknown
  >;

  // ── ID validation ─────────────────────────────────────────────────────────
  if (typeof fromId !== "string" || !ID_RE.test(fromId)) {
    return Response.json({ error: "invalid fromId" }, { status: 400 });
  }
  if (typeof toId !== "string" || !ID_RE.test(toId)) {
    return Response.json({ error: "invalid toId" }, { status: 400 });
  }

  // ── Self-signal guard ─────────────────────────────────────────────────────
  if (fromId === toId) {
    return Response.json({ error: "cannot signal self" }, { status: 400 });
  }

  // ── Type validation ───────────────────────────────────────────────────────
  if (typeof type !== "string" || !VALID_TYPES.includes(type as SignalType)) {
    return Response.json({ error: "invalid type" }, { status: 400 });
  }

  // ── Payload validation ────────────────────────────────────────────────────
  if (
    payload !== undefined &&
    payload !== null &&
    (typeof payload !== "string" || payload.length > MAX_PAYLOAD)
  ) {
    return Response.json({ error: "invalid payload" }, { status: 400 });
  }

  const signalType = type as SignalType;
  const payloadStr = typeof payload === "string" ? payload : null;

  // ── Sender existence check (partial spoofing guard) ───────────────────────
  // Verify the fromId actually exists in presence before accepting the signal.
  // This prevents a ghost client from injecting signals as an offline user.
  // Note: this is not a cryptographic proof — a client could still claim
  // another active user's ID. Full auth tokens would be the next step.
  const senderExists = await prisma.presence.findUnique({
    where: { id: fromId },
    select: { id: true },
  });
  if (!senderExists) {
    return Response.json({ error: "sender not online" }, { status: 403 });
  }

  // Enforce "one active connection at a time": if the target is already busy,
  // auto-decline the request instead of delivering it.
  if (signalType === "request") {
    const target = await prisma.presence.findUnique({
      where: { id: toId },
      select: { busy: true },
    });
    if (!target) {
      // Target went offline — tell the initiator it was declined.
      await sendDecline(toId, fromId);
      return Response.json({ ok: true, autoDeclined: true });
    }
    if (target.busy) {
      await sendDecline(toId, fromId);
      return Response.json({ ok: true, autoDeclined: true });
    }
  }

  // Busy transitions:
  // - accept: the connection is now active → mark BOTH peers busy.
  // - decline/end: free both peers.
  if (signalType === "accept") {
    await prisma.presence.updateMany({
      where: { id: { in: [fromId, toId] } },
      data: { busy: true },
    });
  } else if (signalType === "decline" || signalType === "end") {
    await prisma.presence.updateMany({
      where: { id: { in: [fromId, toId] } },
      data: { busy: false },
    });
  }

  await prisma.signal.create({
    data: { fromId, toId, type: signalType, payload: payloadStr },
  });

  return Response.json({ ok: true });
}

// Helper: deliver an auto-decline from `target` back to `initiator`.
async function sendDecline(targetId: string, initiatorId: string) {
  await prisma.signal.create({
    data: { fromId: targetId, toId: initiatorId, type: "decline", payload: null },
  });
}
