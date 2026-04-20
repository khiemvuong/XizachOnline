"use client";

import { useEffect, useState } from "react";

function formatMs(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  const mm = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const ss = (seconds % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function TimerBar({
  currentRound,
  timerEndAt,
  timerPausedRemaining,
  roundDurationSeconds,
}: {
  currentRound: number;
  timerEndAt: number | null;
  timerPausedRemaining: number | null;
  roundDurationSeconds?: number;
}) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!timerEndAt) return;
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timerEndAt]);

  const rawRemainingMs = timerEndAt
    ? Math.max(0, timerEndAt - nowMs)
    : (timerPausedRemaining ?? 0);

  const roundDurationMs = Math.max(0, (roundDurationSeconds ?? 0) * 1000);

  // Prevent a one-frame stale-time flash when a new timer starts.
  const remainingMs = timerEndAt && roundDurationMs > 0
    ? Math.min(rawRemainingMs, roundDurationMs)
    : rawRemainingMs;

  const timerText = timerEndAt || timerPausedRemaining
    ? formatMs(remainingMs)
    : "--:--";

  const statusText = timerEndAt
    ? "RUNNING"
    : timerPausedRemaining
      ? "PAUSED"
      : "READY";

  const statusClass = timerEndAt
    ? "text-(--deception-cyan)"
    : timerPausedRemaining
      ? "text-(--on-surface-variant)"
      : "text-(--deception-amber)";

  const isCritical = timerEndAt ? remainingMs <= 30000 : false;

  return (
    <div className="deception-chip deception-timer-chip inline-flex items-center gap-2 rounded-md px-3 py-1.5">
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-(--deception-red-soft)">
        Round {currentRound}
      </span>
      <span
        className={`text-[11px] font-black uppercase tracking-[0.16em] ${
          isCritical ? "animate-pulse text-(--deception-red)" : "text-(--on-surface)"
        }`}
      >
        {timerText}
      </span>
      <span className={`text-[10px] uppercase tracking-[0.14em] ${statusClass}`}>
        {statusText}
      </span>
    </div>
  );
}
