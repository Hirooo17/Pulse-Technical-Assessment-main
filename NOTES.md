# Pulse — Phase 1 Debug Notes

## What was broken

Four bugs caused the reported symptoms (messages not working, B can't connect to A, red/green dot disagreement):

---

### Bug 1 — Heartbeat refreshed every user, not just the caller

**File:** `app/api/poll/route.ts`

**What was broken:**
The Prisma `updateMany` that heartbeats the caller's `lastSeen` used `where: {}` — an empty filter — which matched **every** row in the `Presence` table. This meant every user's `lastSeen` was refreshed on every single poll cycle, regardless of who was actually online. Stale users were never reaped because their timestamp was kept current by other users' polls.

**Symptom:** Disconnected/closed browser tabs stayed on the map indefinitely. Map dot count kept growing.

**Fix:** Changed `where: {}` → `where: { id }` so only the polling user's row is heartbeated.

---

### Bug 2 — Chat messages silently dropped (type tag mismatch)

**File:** `lib/webrtc.ts`

**What was broken:**
`sendChat()` serialised messages as `{ t: "msg", text }`. The `onmessage` handler on the receiver's side checked `msg.t === "chat"`. The `"msg"` vs `"chat"` mismatch meant every chat message was silently discarded by the receiver.

**Symptom:** Typing a message appeared to send it (no error), but the other user never received anything.

**Fix:** Changed `sendChat` to emit `{ t: "chat", text }` to match the receiver.

---

### Bug 3 — `busy` flag never cleared on connection end

**File:** `app/api/signal/route.ts`

**What was broken:**
The signal route cleared `busy: false` on `decline` but **not** on `end`. When either peer ended the connection (or one closed their tab, triggering the timeout `"end"` signal), both users remained marked `busy: true` in Postgres indefinitely. Other users saw their dots as red. They also couldn't initiate or accept any new connections until the server was restarted or the row was manually updated.

**Symptom:** After a disconnection, dots appeared red to others. Users couldn't reconnect.

**Fix:** Added `"end"` to the `else if` condition that sets `busy: false`, mirroring the `decline` behavior.

---

### Bug 4 — ICE candidates flushed before remote description was set

**File:** `lib/webrtc.ts`

**What was broken:**
`handleSignal()` called `flushPendingCandidates()` **before** `setRemoteDescription()`. ICE candidates can only be added to an `RTCPeerConnection` after a remote description exists; adding them before throws an `InvalidStateError`. Since the error was caught silently (`catch {}`), the candidates were lost entirely. This left the peer connection without route information and caused it to fail during ICE negotiation.

**Symptom:** Connection appeared to start (offer/answer exchanged) but the data channel never opened. Both sides showed "connecting" indefinitely before timing out. Video calls never started.

**Fix:** Swapped the call order — `setRemoteDescription()` first, then `flushPendingCandidates()`.

---

## How bugs were found

- Bug 1: Code review of `poll/route.ts` — `where: {}` is immediately suspicious.
- Bug 2: Cross-referencing `sendChat` in `webrtc.ts` with `onmessage` in the same file — tag mismatch.
- Bug 3: Code review of `signal/route.ts` busy-flag logic — only `decline` branch, `end` omitted.
- Bug 4: Code review of `handleSignal` call order vs the [WebRTC Perfect Negotiation spec](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation).

## How to manually test the fix

1. Start the dev server: `npm run dev`
2. Open **Browser Window A** at `http://localhost:3000`. When prompted, use DevTools geolocation override to mock a location (e.g. lat: 37.77, lng: -122.41).
3. Click **Enter Pulse**.
4. Open **Browser Window B** (different browser profile or incognito). Mock a different nearby location (e.g. lat: 37.80, lng: -122.45).
5. Click **Enter Pulse** in B.
6. Both windows should show each other's dots on the globe. Dots should be **not red** (not busy).
7. In Window A, click the dot representing B. Window B should show a connection prompt.
8. In Window B, click Accept. Both windows should transition to the chat panel.
9. Send a message from A → verify it appears in B. Send from B → verify it appears in A.
10. Start a video call from either side; verify it connects.
11. Close Window B. Within ~15 seconds, B's dot should disappear from A's map.
12. A's dot should return to green (not busy) shortly after B closes.

## Suggested git commit message

```
fix: 4 bugs causing broken connections, chat, and stale dots

- poll/route: heartbeat only the caller (was updating all rows)
- webrtc: fix sendChat type tag "msg" → "chat" to match receiver
- signal/route: clear busy flag on "end" (was only clearing on decline)
- webrtc: flush ICE candidates after setRemoteDescription, not before
```

## Files changed

| File | Change |
|---|---|
| `app/api/poll/route.ts` | Heartbeat only the caller's presence row |
| `lib/webrtc.ts` | Fix `sendChat` type tag; fix ICE flush order |
| `app/api/signal/route.ts` | Clear `busy` flag on `"end"` signal |
