"use client";

import NightActionPanel from "./NightActionPanel";
import NightPlayerCircle from "./NightPlayerCircle";
import WolfVoteUI from "./WolfVoteUI";
import BodyguardUI from "./BodyguardUI";
import SeerUI from "./SeerUI";
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
  activeNightRoles: WeredogRoleName[];
  // Wolf-specific
  wolfVotes?: Record<string, string>;
  wolfVictimUserId?: string | null;
  // Bodyguard-specific
  lastProtectedUserId?: string | null;
  // Seer-specific
  seerResult?: "Wolf" | "Human" | null;
  // Witch-specific
  witchHasSave?: boolean;
  witchHasKill?: boolean;
  // Extra action trackers for Host countdown
  bodyguardTargetUserId?: string | null;
  seerTargetUserId?: string | null;
  witchActionSelected?: "save" | "kill" | "none";
  witchTargetUserId?: string | null;
  cupidLoverUserIds?: string[];
  // Callbacks
  onWolfVote?: (targetUserId: string) => void;
  onWolfRevote?: () => void;
  onBodyguardProtect?: (targetUserId: string) => void;
  onSeerInspect?: (targetUserId: string) => void;
  onCupidPair?: (userId1: string, userId2: string) => void;
  onWitchChooseAction?: (action: "save" | "kill" | "none") => void;
  onWitchUsePotion?: (targetUserId?: string) => void;
  onHostConfirm?: () => void;
  roomId?: string;
  onBack?: () => void;
  isElderDead?: boolean;
}

export default function WeredogNight({
  players,
  myUserId,
  myRole,
  isElderDead = false,
  isHost,
  currentActiveRole,
  nightNumber,
  roleIndex,
  activeNightRoles,
  wolfVotes,
  wolfVictimUserId,
  lastProtectedUserId,
  seerResult,
  witchHasSave = true,
  witchHasKill = true,
  bodyguardTargetUserId,
  seerTargetUserId,
  witchActionSelected,
  witchTargetUserId,
  cupidLoverUserIds,
  onWolfVote,
  onWolfRevote,
  onBodyguardProtect,
  onSeerInspect,
  onCupidPair,
  onWitchChooseAction,
  onWitchUsePotion,
  onHostConfirm,
  roomId,
  onBack,
}: WeredogNightProps) {
  const isMyTurn = myRole === currentActiveRole && !isHost;
  const display = ROLE_DISPLAY[currentActiveRole];

  const isActiveRoleDead = (() => {
    if (currentActiveRole === "Wolf") {
      const wolves = players.filter((p) => p.role === "Wolf" && !p.isModerator);
      return wolves.length === 0 || wolves.every((w) => !w.isAlive);
    }
    const rolePlayer = players.find((p) => p.role === currentActiveRole && !p.isModerator);
    return rolePlayer ? !rolePlayer.isAlive : true;
  })();

  const hasRoleActed = (() => {
    if (isActiveRoleDead) {
      return true;
    }
    if (isElderDead && currentActiveRole !== "Wolf") {
      return true;
    }
    if (currentActiveRole === "Cupid") {
      return !!cupidLoverUserIds && cupidLoverUserIds.length === 2;
    }
    if (currentActiveRole === "Bodyguard") {
      return !!bodyguardTargetUserId;
    }
    if (currentActiveRole === "Wolf") {
      return wolfVictimUserId !== undefined;
    }
    if (currentActiveRole === "Seer") {
      return !!seerTargetUserId;
    }
    if (currentActiveRole === "Witch") {
      return witchActionSelected === "none" || !!witchTargetUserId;
    }
    return false;
  })();

  const hostSelectedIds = (() => {
    if (currentActiveRole === "Cupid") {
      return cupidLoverUserIds || [];
    }
    if (currentActiveRole === "Bodyguard") {
      return bodyguardTargetUserId ? [bodyguardTargetUserId] : [];
    }
    if (currentActiveRole === "Wolf") {
      return wolfVictimUserId ? [wolfVictimUserId] : [];
    }
    if (currentActiveRole === "Seer") {
      return seerTargetUserId ? [seerTargetUserId] : [];
    }
    if (currentActiveRole === "Witch") {
      return witchTargetUserId ? [witchTargetUserId] : [];
    }
    return [];
  })();

  const hostActionSummary = (() => {
    const getPlayerName = (uid?: string | null) => {
      if (!uid) return "";
      const p = players.find(x => x.userId === uid);
      return p ? p.name : "";
    };

    if (currentActiveRole === "Cupid" && cupidLoverUserIds && cupidLoverUserIds.length === 2) {
      return `Đã ghép đôi: ${getPlayerName(cupidLoverUserIds[0])} & ${getPlayerName(cupidLoverUserIds[1])}`;
    }
    if (currentActiveRole === "Bodyguard" && bodyguardTargetUserId) {
      return `Đã bảo vệ: ${getPlayerName(bodyguardTargetUserId)}`;
    }
    if (currentActiveRole === "Wolf") {
      if (wolfVictimUserId === null) {
        return "Bất đồng ý kiến (vòng bỏ phiếu hòa)!";
      }
      if (wolfVictimUserId) {
        return `Đã thống nhất cắn: ${getPlayerName(wolfVictimUserId)}`;
      }
    }
    if (currentActiveRole === "Seer" && seerTargetUserId) {
      const resultText = seerResult === "Wolf" ? "Chó Sói" : seerResult === "Human" ? "Dân Thường" : "Dân Thường";
      return `Đã soi: ${getPlayerName(seerTargetUserId)} (${resultText})`;
    }
    if (currentActiveRole === "Witch" && witchActionSelected) {
      if (witchActionSelected === "save" && witchTargetUserId) {
        return `Đã cứu: ${getPlayerName(witchTargetUserId)}`;
      }
      if (witchActionSelected === "kill" && witchTargetUserId) {
        return `Đã độc sát: ${getPlayerName(witchTargetUserId)}`;
      }
      if (witchActionSelected === "none") {
        return `Quyết định không dùng thuốc`;
      }
    }
    return "";
  })();

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
            selectedIds={hostSelectedIds}
            disabledIds={[]}
            showVotes={voteCounts}
            highlightColor={display.highlightColor}
            glowColor={display.glowColor}
            myUserId={myUserId}
            bittenUserIds={wolfVictimUserId ? [wolfVictimUserId] : []}
            protectedUserIds={bodyguardTargetUserId ? [bodyguardTargetUserId] : []}
            aimedUserIds={[]}
            loverUserIds={cupidLoverUserIds || []}
            inspectedUserIds={seerTargetUserId ? [seerTargetUserId] : []}
            poisonedUserIds={witchActionSelected === "kill" && witchTargetUserId ? [witchTargetUserId] : []}
            savedUserIds={witchActionSelected === "save" && witchTargetUserId ? [witchTargetUserId] : []}
            centerContent={
              <NightActionPanel
                roleKey={currentActiveRole}
                isMyTurn={false}
                hasActed={false}
                isHost={true}
                onHostConfirm={onHostConfirm}
                hasRoleActed={hasRoleActed}
                hostActionSummary={hostActionSummary}
                onWolfRevote={onWolfRevote}
                isActiveRoleDead={isActiveRoleDead}
                isElderDead={isElderDead}
              />
            }
          />
        </div>
      );
    }

    const commonProps = { players, myUserId, isMyTurn };

    if (isElderDead && currentActiveRole !== "Wolf" && isMyTurn) {
      const allPlayerIds = players.map(p => p.userId);
      return (
        <div className="w-full h-full flex flex-col items-center justify-center relative">
          <NightPlayerCircle
            players={players}
            selectedIds={[]}
            disabledIds={allPlayerIds}
            highlightColor={display.highlightColor}
            glowColor={display.glowColor}
            myUserId={myUserId}
            centerContent={
              <NightActionPanel
                roleKey={currentActiveRole}
                isMyTurn={isMyTurn}
                hasActed={false}
                isElderDead={isElderDead}
              />
            }
          />
        </div>
      );
    }

    switch (currentActiveRole) {
      case "Wolf":
        return (
          <WolfVoteUI
            {...commonProps}
            wolfVotes={wolfVotes}
            onVote={onWolfVote}
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
            seerTargetUserId={seerTargetUserId}
            onInspect={onSeerInspect}
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
            witchActionSelected={witchActionSelected}
            witchTargetUserId={witchTargetUserId}
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
          onBack={onBack}
          centerContent={
            <div className="flex flex-wrap items-center justify-center gap-y-1.5 gap-x-2.5 sm:gap-x-5 py-1 w-full text-center">
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
