"use client";

import { useState } from "react";
import NightPlayerCircle from "./NightPlayerCircle";
import NightActionPanel from "./NightActionPanel";
import { ROLE_DISPLAY, type NightPlayer } from "./nightConstants";

interface SeerUIProps {
  players: NightPlayer[];
  myUserId: string;
  isMyTurn: boolean;
  seerResult?: "Wolf" | "Human" | null;
  onInspect?: (targetUserId: string) => void;
}

export default function SeerUI({
  players,
  myUserId,
  isMyTurn,
  seerResult,
  onInspect,
}: SeerUIProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hasActed, setHasActed] = useState(false);
  const [revealedResult, setRevealedResult] = useState<"Wolf" | "Human" | null>(null);
  const display = ROLE_DISPLAY.Seer;

  const disabledIds = players
    .filter(p => !p.isAlive || p.isHost || p.userId === myUserId)
    .map(p => p.userId);

  const handleSelect = (userId: string) => {
    if (hasActed) return;
    setSelectedId(prev => (prev === userId ? null : userId));
  };

  const handleConfirm = () => {
    if (selectedId && onInspect) {
      onInspect(selectedId);
      setHasActed(true);
      // Simulate result (in real app, backend sends seerResult via stateUpdate)
      setRevealedResult(seerResult ?? (Math.random() > 0.7 ? "Wolf" : "Human"));
    }
  };

  const targetName = selectedId ? players.find(p => p.userId === selectedId)?.name : null;

  return (
    <div className="w-full h-full flex flex-col justify-center items-center relative">
      <NightPlayerCircle
        players={players}
        selectedIds={selectedId ? [selectedId] : []}
        onSelectPlayer={isMyTurn && !hasActed ? handleSelect : undefined}
        disabledIds={disabledIds}
        highlightColor={display.highlightColor}
        glowColor={display.glowColor}
        centerContent={
          <NightActionPanel
            roleKey="Seer"
            isMyTurn={isMyTurn}
            hasActed={hasActed}
            onConfirm={handleConfirm}
            confirmDisabled={!selectedId}
          >
            {/* Show result after inspection */}
            {hasActed && revealedResult && (
              <div
                className="mt-0.5 px-2.5 py-0.5 rounded-full text-[9px] font-gothic-label uppercase tracking-widest font-bold border animate-fade-in inline-block"
                style={{
                  color: revealedResult === "Wolf" ? "#dc2626" : "#10b981",
                  borderColor: revealedResult === "Wolf" ? "#dc2626" : "#10b981",
                  backgroundColor: revealedResult === "Wolf" ? "rgba(220,38,38,0.15)" : "rgba(16,185,129,0.15)",
                }}
              >
                {targetName}: {revealedResult === "Wolf" ? "Sói" : "Dân"}
              </div>
            )}
          </NightActionPanel>
        }
      />
    </div>
  );
}
