"use client";

import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Map as MapboxMap, Marker } from "mapbox-gl";
import type { PeerDot } from "@/lib/types";

const envToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const TOKEN =
  !envToken || envToken === "pk.your_mapbox_token_here" ? "" : envToken;

function dotColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  // Use vibrant but distinguishable hues; avoid very dark or very light ones.
  return `hsl(${Math.abs(hash) % 300 + 30}, 80%, 62%)`;
}

export default function WorldMap({
  peers,
  me,
  onPeerClick,
  canConnect,
  onlineCount,
  connState,
}: {
  peers: PeerDot[];
  me: { lat: number; lng: number } | null;
  onPeerClick: (id: string) => void;
  canConnect: boolean;
  onlineCount: number;
  connState: "idle" | "requesting" | "incoming" | "connecting" | "connected";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const meMarkerRef = useRef<Marker | null>(null);
  const [ready, setReady] = useState(false);

  const onPeerClickRef = useRef(onPeerClick);
  const canConnectRef = useRef(canConnect);
  useEffect(() => {
    onPeerClickRef.current = onPeerClick;
    canConnectRef.current = canConnect;
  });

  // Initialise the map once.
  useEffect(() => {
    if (!TOKEN || !containerRef.current) return;
    let cancelled = false;
    const markers = markersRef.current;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !containerRef.current) return;
      mapboxgl.accessToken = TOKEN;
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: me ? [me.lng, me.lat] : [0, 20],
        zoom: me ? 4 : 1.4,
        attributionControl: true,
        projection: "globe",
      });
      map.on("load", () => {
        if (!cancelled) {
          // Subtle atmosphere on the globe
          if (map.setFog) {
            map.setFog({
              color: "#0d0d18",
              "high-color": "#141428",
              "horizon-blend": 0.04,
              "space-color": "#090912",
              "star-intensity": 0.45,
            });
          }
          setReady(true);
        }
      });
      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      markers.forEach((m) => m.remove());
      markers.clear();
      meMarkerRef.current?.remove();
      meMarkerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "Me" pin.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !me) return;
    let cancelled = false;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled) return;
      if (!meMarkerRef.current) {
        const el = document.createElement("div");
        el.className = "pulse-me";
        el.title = "You";
        el.innerHTML = `<span class="pulse-me-label">Me</span><span class="pulse-me-emoji">📍</span>`;
        meMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([me.lng, me.lat])
          .addTo(map);
      } else {
        meMarkerRef.current.setLngLat([me.lng, me.lat]);
      }
    })();

    return () => { cancelled = true; };
  }, [me, ready]);

  // Peer markers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    let cancelled = false;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled) return;
      const markers = markersRef.current;
      const seen = new Set<string>();

      for (const peer of peers) {
        seen.add(peer.id);
        let marker = markers.get(peer.id);
        if (!marker) {
          const el = document.createElement("button");
          el.className = "pulse-dot";
          el.style.background = dotColor(peer.id);
          el.title = peer.busy ? "Busy" : "Tap to connect";
          el.addEventListener("click", (e) => {
            e.stopPropagation();
            if (canConnectRef.current && !peer.busy) {
              onPeerClickRef.current(peer.id);
            }
          });
          marker = new mapboxgl.Marker({ element: el })
            .setLngLat([peer.lng, peer.lat])
            .addTo(map);
          markers.set(peer.id, marker);
        }
        const el = marker.getElement() as HTMLButtonElement;
        el.style.opacity = peer.busy ? "0.35" : "1";
        el.title = peer.busy ? "Busy" : "Tap to connect";
      }

      for (const [id, marker] of markers) {
        if (!seen.has(id)) {
          marker.remove();
          markers.delete(id);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [peers, ready]);

  const connLabel: Record<typeof connState, string> = {
    idle: "Tap a dot to connect",
    requesting: "Requesting…",
    incoming: "Incoming request",
    connecting: "Connecting…",
    connected: "Connected",
  };

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full" style={{ background: "#090912" }} />

      {/* Missing token notice */}
      {!TOKEN && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <div
            className="glass animate-scale-in"
            style={{
              padding: "24px 28px",
              borderRadius: "16px",
              maxWidth: "360px",
            }}
          >
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
              Set{" "}
              <code style={{ color: "var(--accent)", fontSize: "12px" }}>
                NEXT_PUBLIC_MAPBOX_TOKEN
              </code>{" "}
              in <code style={{ fontSize: "12px" }}>.env</code> to load the map.
            </p>
          </div>
        </div>
      )}

      {/* ── Top header bar ── */}
      <header
        className="glass absolute left-0 right-0 top-0 z-10 flex items-center justify-between"
        style={{ padding: "10px 16px", borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 0 }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "8px",
              background: "linear-gradient(135deg,#34d399,#059669)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" fill="white" />
              <circle cx="12" cy="12" r="7" stroke="white" strokeWidth="2" strokeOpacity="0.5" />
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: "15px", letterSpacing: "-0.02em", color: "#fff" }}>
            Pulse
          </span>
        </div>

        {/* Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div className="status-pill">
            <span className="status-dot" />
            <span>{onlineCount} online</span>
          </div>
          <div
            className="status-pill"
            style={{
              color: connState === "connected"
                ? "var(--accent)"
                : connState === "idle"
                ? "rgba(255,255,255,0.38)"
                : "rgba(255,255,255,0.7)",
            }}
          >
            {connLabel[connState]}
          </div>
        </div>
      </header>
    </div>
  );
}
