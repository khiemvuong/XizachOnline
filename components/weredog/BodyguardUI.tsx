"use client";

import { useState } from "react";
import NightPlayerCircle from "./NightPlayerCircle";
import NightActionPanel from "./NightActionPanel";
import { ROLE_DISPLAY, type NightPlayer } from "./nightConstants";

interface BodyguardUIProps {
  players: NightPlayer[];
  myUserId: string;
  isMyTurn: boolean;
  lastProtectedUserId?: string | null;
  onProtect?: (targetUserId: string) => void;
}

export default function BodyguardUI({
  players,
  myUserId,
  isMyTurn,
  lastProtectedUserId,
  onProtect,
}: BodyguardUIProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hasActed, setHasActed] = useState(false);
  const display = ROLE_DISPLAY.Bodyguard;

  // Cannot protect same person two nights in a row
  const disabledIds = players
    .filter(p => !p.isAlive || p.isHost || p.userId === myUserId || p.userId === lastProtectedUserId)
    .map(p => p.userId);

  const handleSelect = (userId: string) => {
    if (hasActed) return;
    setSelectedId(prev => (prev === userId ? null : userId));
  };

  const handleConfirm = () => {
    if (selectedId && onProtect) {
      onProtect(selectedId);
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
        centerContent={
          <NightActionPanel
            roleKey="Bodyguard"
            isMyTurn={isMyTurn}
            hasActed={hasActed}
            onConfirm={handleConfirm}
            confirmDisabled={!selectedId}
          >
            {/* Show last protected info */}
            {isMyTurn && lastProtectedUserId && (
              <p className="font-gothic-body text-[8px] text-[#445257] italic text-center mt-0.5">
                Đêm trước đã bảo vệ: {players.find(p => p.userId === lastProtectedUserId)?.name ?? "???"} (không thể chọn lại)
              </p>
            )}
          </NightActionPanel>
        }
      />
    </div>
  );
}
