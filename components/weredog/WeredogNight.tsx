"use client";

import { useState, useEffect, useCallback } from "react";
import NightActionPanel from "./NightActionPanel";
import NightPlayerCircle from "./NightPlayerCircle";
import WolfVoteUI from "./WolfVoteUI";
import BodyguardUI from "./BodyguardUI";
import SeerUI from "./SeerUI";
import HunterUI from "./HunterUI";
import CupidUI from "./CupidUI";
import WitchPotionUI from "./WitchPotionUI";
import { ROLE_DISPLAY, type NightPlayer, type WeredogRoleName } from "./nightConstants";
import WeredogHeader from "./WeredogHeader";

interface WeredogNightProps {
  players: NightPlayer[];
  myUserId: string;
  myRole?: WeredogRoleName;
  isHost: boolean;
  currentActiveRole: WeredogRoleName;
  nightNumber: number;
  roleIndex: number;
  totalRoles: number;
  activeNightRoles: WeredogRoleName[];
  // Wolf-specific
  wolfVotes?: Record<string, string>;
  wolfVictimUserId?: string | null;
  // Bodyguard-specific
  lastProtectedUserId?: string | null;
  // Seer-specific
  seerResult?: "Wolf" | "Human" | null;
  // Hunter-specific
  hunterCurrentTarget?: string | null;
  // Witch-specific
  witchHasSave?: boolean;
  witchHasKill?: boolean;
  // Callbacks
  onWolfVote?: (targetUserId: string) => void;
  onWolfRevote?: () => void;
  onBodyguardProtect?: (targetUserId: string) => void;
  onSeerInspect?: (targetUserId: string) => void;
  onHunterAim?: (targetUserId: string) => void;
  onCupidPair?: (userId1: string, userId2: string) => void;
  onWitchChooseAction?: (action: "save" | "kill" | "none") => void;
  onWitchUsePotion?: (targetUserId?: string) => void;
  onHostConfirm?: () => void;
  roomId?: string;
}

export default function WeredogNight({
  players,
  myUserId,
  myRole,
  isHost,
  currentActiveRole,
  nightNumber,
  roleIndex,
  totalRoles,
  activeNightRoles,
  wolfVotes,
  wolfVictimUserId,
  lastProtectedUserId,
  seerResult,
  hunterCurrentTarget,
  witchHasSave = true,
  witchHasKill = true,
  onWolfVote,
  onWolfRevote,
  onBodyguardProtect,
  onSeerInspect,
  onHunterAim,
  onCupidPair,
  onWitchChooseAction,
  onWitchUsePotion,
  onHostConfirm,
  roomId,
}: WeredogNightProps) {
  const isMyTurn = myRole === currentActiveRole && !isHost;
  const display = ROLE_DISPLAY[currentActiveRole];

  const [timeLeft, setTimeLeft] = useState(10);

  // Reset timer when active role changes
  useEffect(() => {
    setTimeLeft(10);
  }, [currentActiveRole]);

  // Countdown timer
  useEffect(() => {
    if (!isHost || !onHostConfirm) return;
    if (timeLeft <= 0) {
      onHostConfirm();
      return;
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, isHost, onHostConfirm]);

  const handleHostConfirm = useCallback(() => {
    setTimeLeft(0);
    onHostConfirm?.();
  }, [onHostConfirm]);

  // ── Render the role-specific action UI ──
  const renderRoleUI = () => {
    if (isHost) {
      const voteCounts = currentActiveRole === "Wolf" && wolfVotes
        ? Object.values(wolfVotes).reduce((acc, targetId) => {
            if (targetId) acc[targetId] = (acc[targetId] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        : undefined;

      return (
        <div className="w-full h-full flex flex-col justify-center items-center relative">
          <NightPlayerCircle
            players={players}
            selectedIds={[]}
            disabledIds={[]}
            showVotes={voteCounts}
            highlightColor={display.highlightColor}
            glowColor={display.glowColor}
            centerContent={
              <NightActionPanel
                roleKey={currentActiveRole}
                isMyTurn={false}
                hasActed={false}
                isHost={true}
                onHostConfirm={handleHostConfirm}
                hostTimerSeconds={timeLeft}
              />
            }
          />
        </div>
      );
    }

    const commonProps = { players, myUserId, isMyTurn };

    switch (currentActiveRole) {
      case "Wolf":
        return (
          <WolfVoteUI
            {...commonProps}
            wolfVotes={wolfVotes}
            wolfVictimUserId={wolfVictimUserId}
            onVote={onWolfVote}
            onRevote={onWolfRevote}
            onConfirm={undefined}
          />
        );

      case "Bodyguard":
        return (
          <BodyguardUI
            {...commonProps}
            lastProtectedUserId={lastProtectedUserId}
            onProtect={onBodyguardProtect}
          />
        );

      case "Seer":
        return (
          <SeerUI
            {...commonProps}
            seerResult={seerResult}
            onInspect={onSeerInspect}
          />
        );

      case "Hunter":
        return (
          <HunterUI
            {...commonProps}
            currentTarget={hunterCurrentTarget}
            onAim={onHunterAim}
          />
        );

      case "Cupid":
        return (
          <CupidUI
            {...commonProps}
            onPair={onCupidPair}
          />
        );

      case "Witch":
        return (
          <WitchPotionUI
            {...commonProps}
            hasSavePotion={witchHasSave}
            hasKillPotion={witchHasKill}
            wolfVictimUserId={wolfVictimUserId}
            onChooseAction={onWitchChooseAction}
            onUsePotion={onWitchUsePotion}
          />
        );

      default:
        // Elder, Villager — no night action, just spectator
        return (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <NightActionPanel
              roleKey={currentActiveRole}
              isMyTurn={false}
              hasActed={false}
            />
          </div>
        );
    }
  };

  return (
    <div 
      className="relative w-full h-full flex flex-col justify-between bg-cover bg-center overflow-hidden select-none"
      style={{ backgroundImage: "url('/werewolf/night_phase_background.jpeg')" }}
    >
      {/* Dark Vignette Overlay to ensure text readability */}
      <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-black/85 pointer-events-none z-10" />

      {/* Main flex container (relative and z-20 to draw above vignette) */}
      <div className="relative z-20 w-full h-full flex flex-col justify-between flex-1">
        {/* Night header bar (Event Bar) */}
        <WeredogHeader
          roomId={roomId}
          title={`Đêm ${nightNumber}`}
          centerContent={
            <div className="flex items-center justify-center gap-2.5 sm:gap-5 overflow-x-auto py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden w-auto max-w-[65%] sm:max-w-[75%] md:max-w-none">
              {activeNightRoles.map((role, i) => {
                const roleDisplay = ROLE_DISPLAY[role];
                const isActive = i === roleIndex;
                const isPast = i < roleIndex;
                return (
                  <div key={role} className="flex items-center gap-2.5 sm:gap-5 shrink-0">
                    <span
                      className={`font-gothic-label text-[11px] sm:text-[13px] md:text-[14.5px] lg:text-[17px] xl:text-[19px] uppercase tracking-widest font-black transition-all ${
                        isActive
                          ? "scale-105"
                          : isPast
                          ? "text-[#445257] line-through opacity-50"
                          : "text-[#829ea2]/45"
                      }`}
                      style={{
                        color: isActive ? roleDisplay.highlightColor : undefined,
                        textShadow: isActive ? `0 0 8px ${roleDisplay.glowColor}` : "none",
                      }}
                    >
                      {roleDisplay.nameVi}
                    </span>
                    {i < activeNightRoles.length - 1 && (
                      <span className="text-[#445257]/35 text-xs sm:text-sm md:text-base lg:text-lg select-none">→</span>
                    )}
                  </div>
                );
              })}
            </div>
          }
        />

        {/* Main content: role-specific UI */}
        <div className="flex-1 w-full relative overflow-hidden flex items-center justify-center">
          {renderRoleUI()}
        </div>
      </div>
    </div>
  );
}
