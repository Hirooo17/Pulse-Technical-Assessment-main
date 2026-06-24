import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Enforce a shared ID format across all routes.
const ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;
const MAX_BODY_BYTES = 64 * 1024;

// POST /api/leave — body { id }. Removes the presence row and any pending
// signals to/from this user. Called via navigator.sendBeacon on tab close, so
// the body may arrive as text — parse defensively.
export async function POST(request: NextRequest) {
  // ── Body size guard ───────────────────────────────────────────────────────
  let text: string;
  try {
    text = await request.text();
  } catch {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }
  if (Buffer.byteLength(text, "utf8") > MAX_BODY_BYTES) {
    return Response.json({ error: "body too large" }, { status: 413 });
  }

  let id: string | undefined;
  try {
    id = text ? (JSON.parse(text)?.id as string | undefined) : undefined;
  } catch {
    id = undefined;
  }

  // ── ID validation ─────────────────────────────────────────────────────────
  if (typeof id !== "string" || !ID_RE.test(id)) {
    return Response.json({ error: "invalid id" }, { status: 400 });
  }

  // Independent cleanup deletes — no atomicity needed (and interactive
  // transactions are unreliable over a PgBouncer pooler).
  await prisma.signal.deleteMany({
    where: { OR: [{ toId: id }, { fromId: id }] },
  });
  await prisma.presence.deleteMany({ where: { id } });

  return Response.json({ ok: true });
}
