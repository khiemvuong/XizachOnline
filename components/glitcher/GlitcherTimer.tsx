"use client";

import { useEffect, useState } from "react";

function formatSeconds(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function GlitcherTimer({
  startedAt,
  deadlineAt,
  label = "Thời gian",
}: {
  startedAt: number | null;
  deadlineAt: number | null;
  label?: string;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!deadlineAt) return;

    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [deadlineAt]);

  const remainingMs = deadlineAt ? Math.max(0, deadlineAt - now) : 0;
  const remainingSeconds = deadlineAt ? Math.ceil(remainingMs / 1000) : null;
  const durationMs =
    startedAt && deadlineAt && deadlineAt > startedAt ? deadlineAt - startedAt : 0;
  const progress = durationMs > 0 ? Math.max(0, Math.min(1, remainingMs / durationMs)) : 0;
  const isCritical = remainingSeconds !== null && remainingSeconds < 10;
  const isUrgent = remainingSeconds !== null && remainingSeconds < 5;

  return (
    <div
      className={`glitcher-timer ${isCritical ? "is-critical" : ""} ${isUrgent ? "is-urgent" : ""}`}
      aria-label={`${label}: ${remainingSeconds === null ? "không giới hạn" : formatSeconds(remainingSeconds)}`}
    >
      <span
        className="glitcher-timer__dial"
        style={{ "--glitcher-timer-progress": `${progress * 360}deg` } as React.CSSProperties}
        aria-hidden="true"
      />
      <span className="glitcher-timer__value" aria-hidden="true">
        {remainingSeconds === null ? "--:--" : formatSeconds(remainingSeconds)}
      </span>
    </div>
  );
}
