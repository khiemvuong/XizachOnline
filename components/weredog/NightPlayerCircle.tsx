"use client";

import { type ReactNode, useRef } from "react";
import { useSceneScale } from "@/hooks/useSceneScale";
import {
  CIRCLE_POSITIONS,
  ROLE_FRAME_COLORS,
  type NightPlayer,
} from "./nightConstants";
import AvatarDisplay from "@/components/shared/AvatarDisplay";

import RoleAccessory from "./RoleAccessory";

// ─── Single Player Node ───

interface PlayerNodeProps {
  player: NightPlayer;
  isSelected: boolean;
  isDisabled: boolean;
  onSelect?: () => void;
  highlightColor?: string;
  glowColor?: string;
  voteCount?: number;
  size: number;
  myUserId?: string;
  isBitten?: boolean;
  isProtected?: boolean;
  isAimed?: boolean;
  isLover?: boolean;
  isInspected?: boolean;
  isPoisoned?: boolean;
  isSaved?: boolean;
}

function PlayerNode({
  player,
  isSelected,
  isDisabled,
  onSelect,
  highlightColor = "#829ea2",
  glowColor = "rgba(130, 158, 162, 0.4)",
  voteCount,
  size,
  myUserId,
  isBitten = false,
  isProtected = false,
  isAimed = false,
  isLover = false,
  isInspected = false,
  isPoisoned = false,
  isSaved = false,
}: PlayerNodeProps) {
  const isDead = !player.isAlive;
  const canClick = !isDead && !isDisabled && !player.isHost && onSelect;
  const frameColors = player.visibleFrameType
    ? ROLE_FRAME_COLORS[player.visibleFrameType]
    : null;

  return (
    <button
      type="button"
      onClick={canClick ? onSelect : undefined}
      disabled={!canClick}
      className={`flex flex-col items-center gap-0.5 transition-all duration-200 group ${
        canClick ? "cursor-pointer hover:scale-110" : "cursor-default"
      }`}
      aria-label={`${player.name}${isDead ? " (đã chết)" : ""}${isSelected ? " (đang chọn)" : ""}`}
    >
      {/* Avatar container */}
      <div
        className="relative rounded-full flex items-center justify-center transition-all duration-300"
        style={{
          width: size,
          height: size,
          border: `3px solid ${
            isSelected ? highlightColor : frameColors?.border ?? "#445257"
          }`,
          boxShadow: isSelected
            ? `0 0 16px ${glowColor}, 0 0 32px ${glowColor}`
            : frameColors
            ? `0 0 8px ${frameColors.glow}`
            : "0 4px 8px rgba(0,0,0,0.6)",
          backgroundColor: isDead ? "rgba(11, 13, 17, 0.8)" : "rgba(34, 42, 47, 0.7)",
          opacity: isDead ? 0.45 : isDisabled ? 0.5 : 1,
          filter: isDead ? "grayscale(1)" : "none",
        }}
      >
        {/* Role frame decorator */}
        {player.visibleFrameType && (
          <RoleAccessory frameType={player.visibleFrameType} role={player.role} />
        )}

        {/* Avatar emoji or Image */}
        {player.avatarUrl || (player.avatar && (player.avatar.startsWith("/") || player.avatar.startsWith("http"))) ? (
          <AvatarDisplay
            avatarUrl={player.avatarUrl || player.avatar}
            name={player.name}
            size={size - 6}
            className={`w-full h-full rounded-full ${isDead ? "grayscale opacity-40" : ""}`}
          />
        ) : (
          <span className={`select-none ${isDead ? "opacity-40" : ""}`} style={{ fontSize: size * 0.45 }}>
            {player.avatar || player.name.charAt(0).toUpperCase()}
          </span>
        )}

        {/* Dead overlay */}
        {isDead && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full">
            <span className="text-red-500/80 font-bold" style={{ fontSize: size * 0.5 }}>✕</span>
          </div>
        )}

        {/* Selection pulse ring */}
        {isSelected && (
          <div
            className="absolute inset-[-4px] rounded-full animate-pulse pointer-events-none"
            style={{ border: `2px solid ${highlightColor}`, opacity: 0.5 }}
          />
        )}

        {/* Vote count badge (Wolf multi-vote) */}
        {voteCount !== undefined && voteCount > 0 && (
          <div
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-gothic-ui z-10"
            style={{
              backgroundColor: highlightColor,
              color: "#0b0d11",
              boxShadow: `0 2px 6px ${glowColor}`,
            }}
          >
            {voteCount}
          </div>
        )}

        {/* Protected Overlay (Bodyguard) */}
        {isProtected && (
          <div 
            className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-slate-900 border border-sky-400 text-sky-400 rounded-full flex items-center justify-center text-[10px] shadow-[0_0_8px_rgba(56,189,248,0.5)] z-20 font-bold select-none animate-bounce" 
            title="Được Bảo Vệ"
            style={{ animationDuration: "2s" }}
          >
            🛡️
          </div>
        )}

        {/* Bitten Overlay (Wolf) */}
        {isBitten && (
          <div 
            className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-slate-900 border border-rose-600 text-rose-500 rounded-full flex items-center justify-center text-[10px] shadow-[0_0_8px_rgba(244,63,94,0.6)] z-20 font-bold select-none animate-pulse" 
            title="Bị Sói Cắn"
          >
            🩸
          </div>
        )}

        {/* Aimed Overlay (Hunter) */}
        {isAimed && (
          <div 
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-900 border border-amber-500 text-amber-500 rounded-full flex items-center justify-center text-[10px] shadow-[0_0_8px_rgba(245,158,11,0.5)] z-20 font-bold select-none" 
            title="Bị Nhắm Bắn"
          >
            🎯
          </div>
        )}

        {/* Lover Overlay (Cupid) */}
        {isLover && (
          <div 
            className="absolute -bottom-1.5 -left-1.5 w-5 h-5 bg-slate-900 border border-pink-500 text-pink-400 rounded-full flex items-center justify-center text-[10px] shadow-[0_0_10px_rgba(236,72,153,0.5)] z-20 font-bold select-none" 
            title="Cặp Đôi Tơ Hồng"
          >
            ❤️
          </div>
        )}

        {/* Inspected Overlay (Seer) */}
        {isInspected && (
          <div 
            className="absolute top-1/2 -translate-y-1/2 -left-2 w-5 h-5 bg-slate-900 border border-purple-500 text-purple-400 rounded-full flex items-center justify-center text-[10px] shadow-[0_0_8px_rgba(168,85,247,0.5)] z-20 font-bold select-none" 
            title="Bị Tiên Tri Soi"
          >
            🔮
          </div>
        )}

        {/* Poisoned Overlay (Witch) */}
        {isPoisoned && (
          <div 
            className="absolute top-1/2 -translate-y-1/2 -right-2 w-5 h-5 bg-slate-900 border border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center text-[10px] shadow-[0_0_8px_rgba(16,185,129,0.5)] z-20 font-bold select-none" 
            title="Bị Phù Thủy Độc Sát"
          >
            💀
          </div>
        )}

        {/* Saved Overlay (Witch) */}
        {isSaved && (
          <div 
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-slate-900 border border-teal-400 text-teal-400 rounded-full flex items-center justify-center text-[10px] shadow-[0_0_8px_rgba(45,212,191,0.5)] z-20 font-bold select-none animate-pulse" 
            title="Được Phù Thủy Cứu"
          >
            💚
          </div>
        )}

        {/* Elder Remaining Lives Overlay (1 Life left) */}
        {player.role === "Elder" && player.elderLives === 1 && (
          <div 
            className="absolute -bottom-2 -right-2 bg-[#40121a]/95 border border-red-500/80 text-red-300 px-1 py-0.5 rounded text-[7px] font-gothic-label tracking-widest font-black uppercase shadow-[0_0_8px_rgba(239,68,68,0.4)] z-20 select-none animate-pulse" 
            title="Còn 1 Mạng"
          >
            SOS
          </div>
        )}
      </div>

      {/* Player name */}
      <span
        className={`font-gothic-body text-[11px] sm:text-[12px] font-semibold tracking-wide max-w-[85px] truncate transition-colors ${
          isDead ? "text-[#445257] line-through" : isSelected ? "text-white" : "text-[#829ea2]"
        }`}
        style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}
      >
        {player.name}
        {player.userId === myUserId && " (Bạn)"}
      </span>

      {/* Host badge */}
      {player.isHost && (
        <span className="text-[7px] text-amber-400 font-gothic-ui font-bold uppercase tracking-wider">
          Host
        </span>
      )}
    </button>
  );
}

// ─── Main NightPlayerCircle Component ───

interface NightPlayerCircleProps {
  players: NightPlayer[];
  selectedIds: string[];
  onSelectPlayer?: (userId: string) => void;
  maxSelections?: number;
  disabledIds?: string[];
  showVotes?: Record<string, number>;
  highlightColor?: string;
  glowColor?: string;
  centerContent?: ReactNode;
  myUserId?: string;
  bittenUserIds?: string[];
  protectedUserIds?: string[];
  aimedUserIds?: string[];
  loverUserIds?: string[];
  inspectedUserIds?: string[];
  poisonedUserIds?: string[];
  savedUserIds?: string[];
  minScale?: number;
}

export default function NightPlayerCircle({
  players,
  selectedIds,
  onSelectPlayer,
  maxSelections = 1,
  disabledIds = [],
  showVotes,
  highlightColor = "#829ea2",
  glowColor = "rgba(130, 158, 162, 0.4)",
  centerContent,
  myUserId,
  bittenUserIds = [],
  protectedUserIds = [],
  aimedUserIds = [],
  loverUserIds = [],
  inspectedUserIds = [],
  poisonedUserIds = [],
  savedUserIds = [],
  minScale = 0.4,
}: NightPlayerCircleProps) {
  const handleSelect = (userId: string) => {
    if (!onSelectPlayer) return;

    // If already selected, deselect
    if (selectedIds.includes(userId)) {
      onSelectPlayer(userId);
      return;
    }

    // If max selections reached, don't allow more (parent handles replacement logic)
    if (selectedIds.length >= maxSelections) {
      // For single select, replace the existing selection
      if (maxSelections === 1) {
        onSelectPlayer(userId);
      }
      return;
    }

    onSelectPlayer(userId);
  };

  // Filter out host from player slots (host is moderator, not in circle)
  const gamePlayers = players.filter(p => !p.isHost);
  const avatarSize = gamePlayers.length > 8 ? 54 : 70;
  const total = gamePlayers.length;

  // Symmetrically map player count to CIRCLE_POSITIONS indexes
  const getSymmetricPositions = (totalCount: number): number[] => {
    switch (totalCount) {
      case 5:
        return [0, 1, 2, 9, 10];
      case 6:
        return [0, 1, 2, 9, 10, 11];
      case 7:
        return [0, 1, 2, 3, 4, 9, 10];
      case 8:
        return [0, 1, 2, 3, 4, 9, 10, 11];
      case 9:
        return [0, 1, 2, 3, 4, 5, 6, 9, 10];
      case 10:
        return [0, 1, 2, 3, 4, 5, 6, 9, 10, 11];
      case 11:
        return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      case 12:
      default:
        return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    }
  };

  const slotMapping = getSymmetricPositions(total);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const scale = useSceneScale({
    viewportRef: containerRef,
    sceneWidth: 800,
    sceneHeight: 380,
    padding: 4,
    minScale: minScale,
    maxScale: 2.2, // Allow zoom up to 2.2x on desktop screens
  });

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden flex items-center justify-center relative select-none pointer-events-none"
    >
      <div
        className="relative transition-transform duration-200 pointer-events-none"
        style={{
          width: "800px",
          height: "380px",
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {/* Player nodes positioned in circle */}
        {gamePlayers.map((player, index) => {
          const slotIndex = slotMapping[index] ?? index;
          const pos = CIRCLE_POSITIONS[slotIndex % CIRCLE_POSITIONS.length];
          const isSelected = selectedIds.includes(player.userId);
          const isDisabled = disabledIds.includes(player.userId);
          const voteCount = showVotes?.[player.userId];

          return (
            <div
              key={player.userId}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-auto"
              style={{ left: pos.left, top: pos.top }}
            >
              <PlayerNode
                player={player}
                isSelected={isSelected}
                isDisabled={isDisabled}
                onSelect={() => handleSelect(player.userId)}
                highlightColor={highlightColor}
                glowColor={glowColor}
                voteCount={voteCount}
                size={avatarSize}
                myUserId={myUserId}
                isBitten={bittenUserIds.includes(player.userId)}
                isProtected={player.isProtected || protectedUserIds.includes(player.userId)}
                isAimed={aimedUserIds.includes(player.userId)}
                isLover={player.isLover || loverUserIds.includes(player.userId)}
                isInspected={player.isInspected || inspectedUserIds.includes(player.userId)}
                isPoisoned={poisonedUserIds.includes(player.userId)}
                isSaved={savedUserIds.includes(player.userId)}
              />
            </div>
          );
        })}

        {/* Center content (role icon, status, etc.) */}
        {centerContent && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto">
            {centerContent}
          </div>
        )}
      </div>
    </div>
  );
}
