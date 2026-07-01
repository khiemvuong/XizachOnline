"use client";

import { useState } from "react";
import NightPlayerCircle from "./NightPlayerCircle";
import NightActionPanel from "./NightActionPanel";
import { ROLE_DISPLAY, type NightPlayer } from "./nightConstants";

interface HunterUIProps {
  players: NightPlayer[];
  myUserId: string;
  isMyTurn: boolean;
  currentTarget?: string | null;
  onAim?: (targetUserId: string) => void;
}

export default function HunterUI({
  players,
  myUserId,
  isMyTurn,
  currentTarget,
  onAim,
}: HunterUIProps) {
  const [selectedId, setSelectedId] = useState<string | null>(currentTarget ?? null);
  const [hasActed, setHasActed] = useState(false);
  const display = ROLE_DISPLAY.Hunter;

  const disabledIds = players
    .filter(p => !p.isAlive || p.isHost || p.userId === myUserId)
    .map(p => p.userId);

  const handleSelect = (userId: string) => {
    if (hasActed) return;
    setSelectedId(prev => (prev === userId ? null : userId));
  };

  const handleConfirm = () => {
    if (selectedId && onAim) {
      onAim(selectedId);
      setHasActed(true);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-center items-center relative">
      <NightPlayerCircle
        players={players}
        selectedIds={selectedId ? [selectedId] : []}
        onSelectPlayer={isMyTurn && !hasActed ? handleSelect : undefined}
        disabledIds={disabledIds}
        highlightColor={display.highlightColor}
        glowColor={display.glowColor}
        myUserId={myUserId}
        centerContent={
          <NightActionPanel
            roleKey="Hunter"
            isMyTurn={isMyTurn}
            hasActed={hasActed}
            onConfirm={handleConfirm}
            confirmDisabled={!selectedId}
          >
            {/* Show aim target info */}
            {selectedId && (
              <span className="font-gothic-label text-[9px] uppercase tracking-widest text-amber-400 mt-0.5 animate-fade-in block">
                Ngắm: {players.find(p => p.userId === selectedId)?.name}
              </span>
            )}
          </NightActionPanel>
        }
      />
    </div>
  );
}
