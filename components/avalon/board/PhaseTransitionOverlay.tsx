import { useEffect, useState, useRef } from "react";
import { AvalonRoom } from "@/server/game/AvalonTypes";
import { CheckCircle2, XOctagon } from "lucide-react";

export default function PhaseTransitionOverlay({
  gameState,
}: {
  gameState: AvalonRoom;
}) {
  const [overlayState, setOverlayState] = useState<{
    show: boolean;
    type: "good" | "evil";
  } | null>(null);

  const prevStateRef = useRef<string | null>(null);

  useEffect(() => {
    const prev = prevStateRef.current;
    const curr = gameState.state;

    // Detect if we transitioned from an active quest phase into game over / assassination
    const isGameEndingPhase = curr === "ASSASSINATION" || curr === "GAME_OVER";
    const wasStandardPhase =
      prev &&
      prev !== "LOBBY" &&
      prev !== "ROLE_REVEAL" &&
      prev !== "ASSASSINATION" &&
      prev !== "GAME_OVER";

    if (wasStandardPhase && isGameEndingPhase) {
      // Game ended. Determine the cause naturally based on quest results
      const goodSuccesses = gameState.questHistory.filter(
        (q) => q.status === "success"
      ).length;
      const type = goodSuccesses >= 3 ? "good" : "evil";

      // Use timeout to prevent React from warning about synchronous state updates in effect
      setTimeout(() => {
        setOverlayState({ show: true, type });
      }, 0);

      // Keep it up for 4.5 seconds, then let it fade out for 1s
      const timer = setTimeout(() => {
        setOverlayState((s) => (s ? { ...s, show: false } : null));

        // Completely unmount after fade-out transition
        setTimeout(() => setOverlayState(null), 1000);
      }, 2500);

      prevStateRef.current = curr;
      return () => clearTimeout(timer);
    }

    prevStateRef.current = curr;
  }, [gameState.state, gameState.questHistory]);

  if (!overlayState) return null;

  return (
    <div
      className={`fixed inset-0 z-999 flex items-center justify-center bg-black/95 transition-opacity duration-1000 ease-in-out animate-in fade-in zoom-in-95 ${
        overlayState.show ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="flex flex-col items-center gap-8">
        <div
          className={`w-36 h-36 rounded-full flex items-center justify-center border-2 border-dashed animate-pulse duration-1000 ${
            overlayState.type === "good"
              ? "border-primary text-primary bg-primary/10 shadow-[0_0_80px_rgba(186,200,220,0.3)]"
              : "border-red-600 text-red-600 bg-red-600/10 shadow-[0_0_80px_rgba(220,38,38,0.3)]"
          }`}
        >
          {overlayState.type === "good" ? (
            <CheckCircle2 className="w-20 h-20 text-green-600" />
          ) : (
            <XOctagon className="w-20 h-20 text-red-600" />
          )}
        </div>
        <div className="text-center space-y-4">
          <h2
            className={`font-headline text-5xl sm:text-7xl font-black uppercase tracking-[0.2em] ${
              overlayState.type === "good" ? "text-green-600 drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]" : "text-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]"
            }`}
          >
            {overlayState.type === "good"
              ? "Thành Công Rồi"
              : "Thất Bại Rồi"}
          </h2>
          <p className="font-label text-base sm:text-xl tracking-[0.25em] uppercase text-on-surface-variant/90 drop-shadow-md">
            {overlayState.type === "good"
              ? "Hoàn tất 3 nhiệm vụ thành công"
              : "Bóng tối đã lấn át 3 nhiệm vụ"}
          </p>
        </div>
      </div>
    </div>
  );
}
