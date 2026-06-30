"use client";

import { useState } from "react";
import NightPlayerCircle from "./NightPlayerCircle";
import NightActionPanel from "./NightActionPanel";
import { ROLE_DISPLAY, type NightPlayer } from "./nightConstants";

type WitchAction = "save" | "kill" | "none";

interface WitchPotionUIProps {
  players: NightPlayer[];
  myUserId: string;
  isMyTurn: boolean;
  hasSavePotion: boolean;
  hasKillPotion: boolean;
  wolfVictimUserId?: string | null;
  onChooseAction?: (action: WitchAction) => void;
  onUsePotion?: (targetUserId?: string) => void;
}

export default function WitchPotionUI({
  players,
  myUserId,
  isMyTurn,
  hasSavePotion,
  hasKillPotion,
  wolfVictimUserId,
  onChooseAction,
  onUsePotion,
}: WitchPotionUIProps) {
  const [action, setAction] = useState<WitchAction | null>(null);
  const [killTarget, setKillTarget] = useState<string | null>(null);
  const [hasActed, setHasActed] = useState(false);
  const display = ROLE_DISPLAY.Witch;

  const disabledIds = players
    .filter(p => !p.isAlive || p.isHost || p.userId === myUserId)
    .map(p => p.userId);

  const handleChooseAction = (act: WitchAction) => {
    setAction(act);
    onChooseAction?.(act);
    if (act === "none") {
      setHasActed(true);
    }
  };

  const handleUsePotion = () => {
    if (action === "save") {
      onUsePotion?.();
      setHasActed(true);
    } else if (action === "kill" && killTarget) {
      onUsePotion?.(killTarget);
      setHasActed(true);
    }
  };

  const handleSelectKillTarget = (userId: string) => {
    setKillTarget(prev => (prev === userId ? null : userId));
  };

  const victimName = wolfVictimUserId
    ? players.find(p => p.userId === wolfVictimUserId)?.name
    : null;

  // Step 1: Choose action (save / kill / skip)
  if (!action && isMyTurn) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center relative">
        <NightPlayerCircle
          players={players}
          selectedIds={[]}
          disabledIds={disabledIds}
          highlightColor={display.highlightColor}
          glowColor={display.glowColor}
          centerContent={
            <div className="w-full flex flex-col items-center gap-3 animate-fade-in text-center max-w-[280px]">
              {/* Large Gothic Heading */}
              <h1 
                className="font-gothic-label text-base sm:text-xl md:text-2xl tracking-widest uppercase font-black select-none leading-tight text-shadow-maroon"
                style={{ 
                  textShadow: `0 0 10px ${display.glowColor}, 0 2px 4px rgba(0,0,0,0.9)`,
                  color: display.highlightColor
                }}
              >
                {display.actionHeading}
              </h1>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2 mt-1">
                <button
                  onClick={() => handleChooseAction("save")}
                  disabled={!hasSavePotion}
                  className={`w-[110px] py-2 rounded-lg border text-[11px] font-gothic-ui font-black uppercase tracking-wider transition-all shadow-[0_2px_8px_rgba(0,0,0,0.5)] cursor-pointer ${
                    hasSavePotion
                      ? "border-emerald-500/40 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-900/30 hover:scale-[1.04] hover:border-emerald-500/85"
                      : "border-[#445257]/30 text-[#445257] bg-transparent cursor-not-allowed opacity-40"
                  }`}
                >
                  Cứu {!hasSavePotion && "(Hết)"}
                </button>

                <button
                  onClick={() => handleChooseAction("kill")}
                  disabled={!hasKillPotion}
                  className={`w-[110px] py-2 rounded-lg border text-[11px] font-gothic-ui font-black uppercase tracking-wider transition-all shadow-[0_2px_8px_rgba(0,0,0,0.5)] cursor-pointer ${
                    hasKillPotion
                      ? "border-red-500/40 text-red-400 bg-red-950/20 hover:bg-red-900/30 hover:scale-[1.04] hover:border-red-500/85"
                      : "border-[#445257]/30 text-[#445257] bg-transparent cursor-not-allowed opacity-40"
                  }`}
                >
                  Giết {!hasKillPotion && "(Hết)"}
                </button>

                <button
                  onClick={() => handleChooseAction("none")}
                  className="w-[110px] py-2 rounded-lg border border-[#445257]/45 text-[#829ea2] text-[11px] font-gothic-ui font-black uppercase tracking-wider hover:bg-[#222a2f] hover:text-white hover:scale-[1.04] transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                >
                  Bỏ Qua
                </button>
              </div>

              {/* Potion status */}
              <div className="flex items-center gap-3 text-[9px] font-gothic-ui uppercase tracking-widest text-[#445257] mt-1 select-none">
                <span className={hasSavePotion ? "text-emerald-500/60" : "line-through opacity-50"}>
                  Bình Cứu: {hasSavePotion ? "Còn" : "Hết"}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#445257]/30" />
                <span className={hasKillPotion ? "text-red-500/60" : "line-through opacity-50"}>
                  Bình Giết: {hasKillPotion ? "Còn" : "Hết"}
                </span>
              </div>
            </div>
          }
        />
      </div>
    );
  }

  // Step 2a: Save — show victim info
  if (action === "save" && isMyTurn && !hasActed) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center relative">
        <NightPlayerCircle
          players={players}
          selectedIds={wolfVictimUserId ? [wolfVictimUserId] : []}
          disabledIds={disabledIds}
          highlightColor="#10b981"
          glowColor="rgba(16, 185, 129, 0.4)"
          centerContent={
            <NightActionPanel
              roleKey="Witch"
              isMyTurn={true}
              hasActed={false}
              onConfirm={handleUsePotion}
              confirmLabel="Xác Nhận Cứu"
              confirmDisabled={!wolfVictimUserId}
            >
              {victimName && (
                <span className="font-gothic-label text-[9px] uppercase tracking-widest text-emerald-400 mt-0.5 animate-fade-in block">
                  Cứu: {victimName}
                </span>
              )}
              <button
                onClick={() => setAction(null)}
                className="px-3 py-1 rounded border border-[#445257]/50 text-[#829ea2] text-[9px] font-gothic-ui font-bold uppercase tracking-wider hover:bg-[#222a2f] hover:text-white transition-all cursor-pointer mt-2"
              >
                ← Quay Lại
              </button>
            </NightActionPanel>
          }
        />
      </div>
    );
  }

  // Step 2b: Kill — select target from circle
  if (action === "kill" && isMyTurn && !hasActed) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center relative">
        <NightPlayerCircle
          players={players}
          selectedIds={killTarget ? [killTarget] : []}
          onSelectPlayer={handleSelectKillTarget}
          disabledIds={disabledIds}
          highlightColor="#dc2626"
          glowColor="rgba(220, 38, 38, 0.4)"
          centerContent={
            <NightActionPanel
              roleKey="Witch"
              isMyTurn={true}
              hasActed={false}
              onConfirm={handleUsePotion}
              confirmLabel="Xác Nhận Giết"
              confirmDisabled={!killTarget}
            >
              {killTarget && (
                <span className="font-gothic-label text-[9px] uppercase tracking-widest text-red-400 mt-0.5 animate-fade-in block">
                  Mục tiêu: {players.find(p => p.userId === killTarget)?.name}
                </span>
              )}
              <button
                onClick={() => setAction(null)}
                className="px-3 py-1 rounded border border-[#445257]/50 text-[#829ea2] text-[9px] font-gothic-ui font-bold uppercase tracking-wider hover:bg-[#222a2f] hover:text-white transition-all cursor-pointer mt-2"
              >
                ← Quay Lại
              </button>
            </NightActionPanel>
          }
        />
      </div>
    );
  }

  // Default: spectator / already acted
  return (
    <div className="w-full h-full flex flex-col justify-center items-center relative">
      <NightPlayerCircle
        players={players}
        selectedIds={[]}
        disabledIds={disabledIds}
        highlightColor={display.highlightColor}
        glowColor={display.glowColor}
        centerContent={
          <NightActionPanel roleKey="Witch" isMyTurn={isMyTurn} hasActed={hasActed} />
        }
      />
    </div>
  );
}
