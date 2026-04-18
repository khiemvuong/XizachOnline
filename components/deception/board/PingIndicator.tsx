"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { type Socket } from "socket.io-client";
import { Wifi } from "lucide-react";

export default function PingIndicator({
  socket,
  userId,
  setPlayerPings,
}: {
  socket: Socket | null;
  userId?: string;
  setPlayerPings: Dispatch<SetStateAction<Record<string, number>>>;
}) {
  const [ping, setPing] = useState<number | null>(null);

  useEffect(() => {
    if (!socket || !userId) return;

    const interval = setInterval(() => {
      const start = Date.now();
      socket.emit("measurePing", start, () => {
        const measured = Date.now() - start;
        setPing(measured);
        setPlayerPings((prev) => ({ ...prev, [userId]: measured }));
        socket.emit("updatePing", userId, measured);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [socket, userId, setPlayerPings]);

  if (ping === null) return null;

  const color = ping < 150 ? "text-emerald-400" : ping < 350 ? "text-amber-400" : "text-red-500";
  const iconClass = ping < 150 ? "text-emerald-400/80" : ping < 350 ? "text-amber-400/80" : "text-red-500/80";

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border border-(--deception-border) bg-[rgba(0,0,0,0.35)] px-2 py-1 shadow-sm backdrop-blur-md"
      title="Ping hiện tại của thiết bị đến máy chủ"
    >
      <Wifi className={`h-3.5 w-3.5 ${iconClass}`} />
      <span className={`text-[10px] font-bold font-mono tracking-wider ${color}`}>
        {Math.min(999, ping)}ms
      </span>
    </div>
  );
}
