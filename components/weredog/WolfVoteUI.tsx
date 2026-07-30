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
  onVote?: (targetUserId: string) => void;
}

export default function WolfVoteUI({
  players,
  myUserId,
  isMyTurn,
  wolfVotes = {},
  onVote,
}: WolfVoteUIProps) {
  const display = ROLE_DISPLAY.Wolf;
  const myVote = wolfVotes[myUserId];
  const [selectedId, setSelectedId] = useState<string | null>(myVote || null);
  const hasActed = !!selectedId && selectedId === myVote;

  // React official pattern: adjust state during render when prop changes
  const [prevMyVote, setPrevMyVote] = useState<string | null | undefined>(myVote);
  if (myVote !== prevMyVote) {
    setPrevMyVote(myVote);
    setSelectedId(myVote || null);
  }

  // Compute vote counts per target
  const voteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(wolfVotes).forEach(targetId => {
      counts[targetId] = (counts[targetId] ?? 0) + 1;
    });
    return counts;
  }, [wolfVotes]);

  const me = players.find(p => p.userId === myUserId);
  const isMeDead = me ? !me.isAlive : false;

  // Wolves and their vote status
  const allWolves = players.filter(p => p.role === "Wolf" && p.isAlive);

  if (isMeDead) {
    const allPlayerIds = players.map(p => p.userId);
    return (
      <div className="w-full h-full flex flex-col justify-center items-center relative">
        <NightPlayerCircle
          players={players}
          selectedIds={[]}
          disabledIds={allPlayerIds}
          showVotes={voteCounts}
          highlightColor={display.highlightColor}
          glowColor={display.glowColor}
          myUserId={myUserId}
          centerContent={
            <div className="w-full flex flex-col items-center justify-center gap-2 animate-fade-in text-center max-w-70">
              <h1 
                className="font-gothic-label text-base sm:text-xl md:text-2xl tracking-widest uppercase font-black select-none leading-tight text-shadow-maroon text-red-500"
                style={{ 
                  textShadow: "0 0 10px rgba(239,68,68,0.35), 0 2px 4px rgba(0,0,0,0.9)",
                }}
              >
                {display.actionHeading}
              </h1>

              <div className="bg-red-950/40 border border-red-500/25 rounded-lg p-3 text-red-400 text-xs sm:text-sm font-serif leading-relaxed mt-2 shadow-md">
                ⚠️ BẠN ĐÃ CHẾT!
              </div>
            </div>
          }
        />
      </div>
    );
  }
  const disabledIds = players
    .filter(p => !p.isAlive || p.isHost)
    .map(p => p.userId);

  const handleSelect = (userId: string) => {
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
        onSelectPlayer={isMyTurn ? handleSelect : undefined}
        disabledIds={disabledIds}
        showVotes={voteCounts}
        highlightColor={display.highlightColor}
        glowColor={display.glowColor}
        myUserId={myUserId}
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
                      className="flex items-center gap-2 bg-red-950/20 border border-red-500/10 px-3 py-1 rounded-full text-xs sm:text-sm font-serif font-bold transition-all shadow-sm"
                      style={{ 
                        color: targetPlayer ? "#fca5a5" : "#445257",
                        borderColor: targetPlayer ? "rgba(239, 68, 68, 0.25)" : "rgba(68, 82, 87, 0.15)"
                      }}
                    >
                      <span className="text-red-300 font-semibold">{w.name}</span>
                      <span className="text-red-500 font-black opacity-60">🩸</span>
                      <span className={targetPlayer ? "text-white font-black" : "italic text-[#445257]/60 font-normal"}>
                        {targetPlayer ? targetPlayer.name : "Đang chọn..."}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
           </NightActionPanel>
        }
      />
    </div>
  );
}
