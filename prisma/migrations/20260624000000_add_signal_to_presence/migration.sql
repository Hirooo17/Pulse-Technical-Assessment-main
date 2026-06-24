-- Add Pulse Signal vibe column to Presence.
-- This is a nullable VARCHAR(32) — stores one emoji from the PULSE_SIGNALS
-- allowlist. Null means the user has not selected a vibe. The column expires
-- with the presence row (deleted on leave, on staleness, or on session end).
ALTER TABLE "Presence" ADD COLUMN "signal" VARCHAR(32);
