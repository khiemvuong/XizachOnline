"use client";

import { useState, useMemo } from "react";
import NightPlayerCircle from "./NightPlayerCircle";
import NightActionPanel from "./NightActionPanel";
import { ROLE_DISPLAY, type NightPlayer } from "./nightConstants";

interface SeerUIProps {
  players: NightPlayer[];
  myUserId: string;
  isMyTurn: boolean;
  seerResult?: "Wolf" | "Human" | null;
  seerTargetUserId?: string | null;
  onInspect?: (targetUserId: string) => void;
}

export default function SeerUI({
  players,
  myUserId,
  isMyTurn,
  seerResult,
  seerTargetUserId,
  onInspect,
}: SeerUIProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hasActed, setHasActed] = useState(false);
  const display = ROLE_DISPLAY.Seer;

  const disabledIds = players
    .filter(p => !p.isAlive || p.isModerator || p.userId === myUserId)
    .map(p => p.userId);

  // Reset local state when it's no longer my turn (handled safely during render phase)
  const [prevIsMyTurn, setPrevIsMyTurn] = useState(isMyTurn);
  if (isMyTurn !== prevIsMyTurn) {
    setPrevIsMyTurn(isMyTurn);
    setHasActed(false);
    setSelectedId(null);
  }

  const handleSelect = (userId: string) => {
    if (hasActed) return;
    setSelectedId(prev => (prev === userId ? null : userId));
  };

  const handleConfirm = () => {
    if (selectedId && onInspect) {
      onInspect(selectedId);
      setHasActed(true);
    }
  };

  const revealedResult = seerResult ?? null;
  const targetName = players.find(p => p.userId === (selectedId ?? seerTargetUserId))?.name;

  // Build a map of all inspected players and their results (current night only)
  const inspectedPlayers = useMemo(() => {
    const m = new Map<string, "Wolf" | "Human">();
    // Current night inspect
    if (hasActed && revealedResult) {
      const targetId = selectedId || seerTargetUserId;
      if (targetId) {
        m.set(targetId, revealedResult);
      }
    } else if (seerTargetUserId && seerResult) {
      m.set(seerTargetUserId, seerResult);
    }
    return m;
  }, [hasActed, revealedResult, selectedId, seerTargetUserId, seerResult]);

  // Inject visible accessory frames ("wolf" or "shiba") for inspected players
  const modifiedPlayers = useMemo(() => {
    return players.map(p => {
      const result = inspectedPlayers.get(p.userId);
      if (result) {
        return {
          ...p,
          visibleFrameType: result === "Wolf" ? ("wolf" as const) : ("shiba" as const),
        };
      }
      return p;
    });
  }, [players, inspectedPlayers]);

  return (
    <div className="w-full h-full flex flex-col justify-center items-center relative">
      <NightPlayerCircle
        players={modifiedPlayers}
        selectedIds={selectedId ? [selectedId] : []}
        onSelectPlayer={isMyTurn && !hasActed ? handleSelect : undefined}
        disabledIds={disabledIds}
        highlightColor={display.highlightColor}
        glowColor={display.glowColor}
        myUserId={myUserId}
        inspectedUserIds={seerTargetUserId ? [seerTargetUserId] : (selectedId && hasActed ? [selectedId] : [])}
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
