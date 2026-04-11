import { useEffect, useState } from "react";
import { type Socket } from "socket.io-client";
import { Wifi } from "lucide-react";

export default function PingIndicator({
  socket,
  userId,
  setPlayerPings,
}: {
  socket: Socket | null;
  userId?: string;
  setPlayerPings: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}) {
  const [ping, setPing] = useState<number | null>(null);

  useEffect(() => {
    if (!socket || !userId) return;

    const interval = setInterval(() => {
      const start = Date.now();
      socket.emit("measurePing", start, () => {
        const p = Date.now() - start;
        setPing(p);
        setPlayerPings((prev) => ({ ...prev, [userId]: p }));
        socket.emit("updatePing", userId, p);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [socket, userId, setPlayerPings]);

  if (ping === null) return null;

  const color =
    ping < 150
      ? "text-emerald-400"
      : ping < 350
        ? "text-amber-400"
        : "text-red-500";
  const iconClass =
    ping < 150
      ? "text-emerald-400/80"
      : ping < 350
        ? "text-amber-400/80"
        : "text-red-500/80";

  return (
    <div
      className="flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-md shadow-lg mr-2"
      title="Ping hiện tại của thiết bị đến máy chủ"
    >
      <Wifi className={`w-3.5 h-3.5 ${iconClass}`} />
      <span className={`text-[10px] font-bold font-mono tracking-wider ${color}`}>
        {ping}ms
      </span>
    </div>
  );
}
