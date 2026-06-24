
interface Window {
  timestamps: number[];
}

// Map keyed by `${ip}:${route}` so limits are per-route, not shared.
const store = new Map<string, Window>();

// Purge entries older than `windowMs` from a window.
function prune(win: Window, now: number, windowMs: number) {
  const cutoff = now - windowMs;
  let i = 0;
  while (i < win.timestamps.length && win.timestamps[i] < cutoff) i++;
  if (i > 0) win.timestamps.splice(0, i);
}

/**
 * Returns true if the caller is within the allowed rate, false if over limit.
 *
 * @param key      Unique caller key (e.g. IP address) — pass "unknown" when
 *                 the IP cannot be determined; that bucket is shared.
 * @param route    Route identifier used to separate per-route counters.
 * @param limit    Maximum requests allowed within `windowMs`.
 * @param windowMs Sliding window duration in milliseconds (default 60 000).
 */
export function checkRateLimit(
  key: string,
  route: string,
  limit: number,
  windowMs = 60_000,
): boolean {
  const storeKey = `${key}:${route}`;
  const now = Date.now();

  let win = store.get(storeKey);
  if (!win) {
    win = { timestamps: [] };
    store.set(storeKey, win);
  }

  prune(win, now, windowMs);

  if (win.timestamps.length >= limit) {
    return false; // over limit
  }

  win.timestamps.push(now);
  return true; // allowed
}

/**
 * Extract the best-available client IP from a Next.js request.
 * Falls back to "unknown" when no IP header is present (e.g. local dev).
 */
export function getClientIp(request: Request): string {
  // Cloudflare
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf;
  // Vercel / general proxy
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "unknown";
}
