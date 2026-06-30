"use client";

import { useState, useMemo } from "react";
import NightPlayerCircle from "./NightPlayerCircle";
import NightActionPanel from "./NightActionPanel";
import { ROLE_DISPLAY, type NightPlayer } from "./nightConstants";

interface WolfVoteUIProps {
  players: NightPlayer[];
  myUserId: string;
  isMyTurn: boolean;
  wolfVotes?: Record<string, string>; // wolfUserId -> targetUserId
  wolfVictimUserId?: string | null;
  onVote?: (targetUserId: string) => void;
  onRevote?: () => void;
  onConfirm?: () => void;
}

export default function WolfVoteUI({
  players,
  myUserId,
  isMyTurn,
  wolfVotes = {},
  wolfVictimUserId,
  onVote,
  onRevote,
  onConfirm,
}: WolfVoteUIProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const display = ROLE_DISPLAY.Wolf;
  const myVote = wolfVotes[myUserId];
  const hasActed = !!myVote;

  // Compute vote counts per target
  const voteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(wolfVotes).forEach(targetId => {
      counts[targetId] = (counts[targetId] ?? 0) + 1;
    });
    return counts;
  }, [wolfVotes]);

  // Wolves and their vote status
  const allWolves = players.filter(p => p.role === "Wolf" && p.isAlive);
  const disabledIds = players
    .filter(p => p.role === "Wolf" || !p.isAlive || p.isHost)
    .map(p => p.userId);

  const handleSelect = (userId: string) => {
    if (hasActed) return;
    setSelectedId(prev => (prev === userId ? null : userId));
  };

  const handleVote = () => {
    if (selectedId && onVote) {
      onVote(selectedId);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-center items-center relative">
      <NightPlayerCircle
        players={players}
        selectedIds={selectedId ? [selectedId] : []}
        onSelectPlayer={isMyTurn && !hasActed ? handleSelect : undefined}
        disabledIds={disabledIds}
        showVotes={voteCounts}
        highlightColor={display.highlightColor}
        glowColor={display.glowColor}
        centerContent={
          <NightActionPanel
            roleKey="Wolf"
            isMyTurn={isMyTurn}
            hasActed={hasActed}
            onConfirm={handleVote}
            confirmDisabled={!selectedId}
          >
            {/* Wolf partner target votes */}
            {isMyTurn && (
              <div className="flex flex-col items-center gap-1.5 mt-2.5 select-none w-full">
                {allWolves.map(w => {
                  const targetId = wolfVotes[w.userId];
                  const targetPlayer = targetId ? players.find(p => p.userId === targetId) : null;

                  return (
                    <div
                      key={w.userId}
                      className=" text-white flex items-center gap-2 text-xs sm:text-sm font-gothic-label uppercase tracking-widest font-bold"
                      style={{ color: targetPlayer ? "#f43f5e" : "#445257" }}
                    >
                      <span>{w.name}</span>
                      <span className="opacity-40 font-normal">→</span>
                      <span className={targetPlayer ? "text-white font-black" : "italic text-[#445257]"}>
                        {targetPlayer ? targetPlayer.name : "..."}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Revote button */}
            {isMyTurn && hasActed && onRevote && (
              <button
                onClick={onRevote}
                className="mt-0.5 px-2 py-0.5 text-[9px] uppercase tracking-wider font-gothic-ui font-bold text-[#829ea2] border border-[#445257]/40 rounded hover:bg-[#222a2f] transition-colors cursor-pointer"
              >
                Bỏ Phiếu Lại
              </button>
            )}

            {/* Final Target display */}
            {wolfVictimUserId !== undefined && (
              <span className="font-gothic-label text-[9px] uppercase tracking-widest text-red-400 mt-0.5">
                {wolfVictimUserId
                  ? `Mục tiêu: ${players.find(p => p.userId === wolfVictimUserId)?.name}`
                  : "Hòa phiếu"}
              </span>
            )}
          </NightActionPanel>
        }
      />
    </div>
  );
}
