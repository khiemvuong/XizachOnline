"use client";

import { useState } from "react";
import NightPlayerCircle from "./NightPlayerCircle";
import NightActionPanel from "./NightActionPanel";
import { ROLE_DISPLAY, type NightPlayer } from "./nightConstants";

interface CupidUIProps {
  players: NightPlayer[];
  myUserId: string;
  isMyTurn: boolean;
  onPair?: (userId1: string, userId2: string) => void;
}

export default function CupidUI({
  players,
  myUserId,
  isMyTurn,
  onPair,
}: CupidUIProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hasActed, setHasActed] = useState(false);
  const display = ROLE_DISPLAY.Cupid;

  const disabledIds = players
    .filter(p => !p.isAlive || p.isHost)
    .map(p => p.userId);

  const handleSelect = (userId: string) => {
    if (hasActed) return;
    setSelectedIds(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      }
      if (prev.length >= 2) {
        // Replace oldest selection
        return [prev[1], userId];
      }
      return [...prev, userId];
    });
  };

  const handleConfirm = () => {
    if (selectedIds.length === 2 && onPair) {
      onPair(selectedIds[0], selectedIds[1]);
      setHasActed(true);
    }
  };

  const lover1 = selectedIds[0] ? players.find(p => p.userId === selectedIds[0]) : null;
  const lover2 = selectedIds[1] ? players.find(p => p.userId === selectedIds[1]) : null;

  return (
    <div className="w-full h-full flex flex-col justify-center items-center relative">
      <NightPlayerCircle
        players={players}
        selectedIds={selectedIds}
        onSelectPlayer={isMyTurn && !hasActed ? handleSelect : undefined}
        maxSelections={2}
        disabledIds={disabledIds}
        highlightColor={display.highlightColor}
        glowColor={display.glowColor}
        centerContent={
          <NightActionPanel
            roleKey="Cupid"
            isMyTurn={isMyTurn}
            hasActed={hasActed}
            onConfirm={handleConfirm}
            confirmLabel={selectedIds.length === 2 ? "Xác Nhận Ghép Đôi" : `Chọn ${2 - selectedIds.length} người nữa`}
            confirmDisabled={selectedIds.length !== 2}
          >
            {/* Show paired lovers */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-1 text-[9px] font-gothic-label uppercase tracking-widest text-pink-400 mt-0.5 animate-fade-in">
                <span>{lover1?.name ?? "?"}</span>
                <span className="text-[#445257]">-</span>
                <span>{lover2?.name ?? "?"}</span>
              </div>
            )}
          </NightActionPanel>
        }
      />
    </div>
  );
}
