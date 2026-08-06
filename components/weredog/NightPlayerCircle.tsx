"use client";

import { type ReactNode, useRef } from "react";
import {
  EyeOpen,
  Flask,
  Heart2,
  HeartPulse,
  Paw,
  Shield,
  Target,
} from "reicon-react";
import type { IconComponent } from "reicon-react/createIcon";
import { useSceneScale } from "@/hooks/useSceneScale";
import {
  CIRCLE_POSITIONS,
  ROLE_FRAME_COLORS,
  type NightPlayer,
} from "./nightConstants";
import AvatarDisplay from "@/components/shared/AvatarDisplay";

import RoleAccessory from "./RoleAccessory";

// ─── Single Player Node ───

type NightStatusKind =
  | "bitten"
  | "protected"
  | "aimed"
  | "lover"
  | "inspected"
  | "poisoned"
  | "saved";

const NIGHT_STATUS_CONFIG: Record<
  NightStatusKind,
  {
    label: string;
    Icon: IconComponent;
    iconColor: string;
    positionClassName: string;
    shellClassName: string;
    iconClassName?: string;
  }
> = {
  bitten: {
    label: "Bị sói cắn",
    Icon: Paw,
    iconColor: "#fb7185",
    positionClassName: "-left-5 -top-4",
    shellClassName: "border-rose-400/90 bg-[#1b0b10]/95 text-rose-300 shadow-[0_0_18px_rgba(220,38,38,0.7)]",
    iconClassName: "scale-[1.05]",
  },
  protected: {
    label: "Được bảo vệ",
    Icon: Shield,
    iconColor: "#7dd3fc",
    positionClassName: "-right-5 -bottom-4",
    shellClassName: "border-sky-300/90 bg-[#081522]/95 text-sky-200 shadow-[0_0_18px_rgba(56,189,248,0.55)]",
  },
  aimed: {
    label: "Bị thợ săn ngắm",
    Icon: Target,
    iconColor: "#fbbf24",
    positionClassName: "-right-5 -top-4",
    shellClassName: "border-amber-300/90 bg-[#211506]/95 text-amber-200 shadow-[0_0_18px_rgba(245,158,11,0.55)]",
  },
  lover: {
    label: "Cặp đôi Cupid",
    Icon: Heart2,
    iconColor: "#f472b6",
    positionClassName: "-left-5 -bottom-4",
    shellClassName: "border-pink-300/90 bg-[#230818]/95 text-pink-200 shadow-[0_0_18px_rgba(236,72,153,0.55)]",
  },
  inspected: {
    label: "Đã được Tiên tri soi",
    Icon: EyeOpen,
    iconColor: "#c4b5fd",
    positionClassName: "-left-6 top-1/2 -translate-y-1/2",
    shellClassName: "border-violet-300/90 bg-[#140d25]/95 text-violet-200 shadow-[0_0_18px_rgba(167,139,250,0.55)]",
  },
  poisoned: {
    label: "Bị ném bình độc",
    Icon: Flask,
    iconColor: "#bef264",
    positionClassName: "-right-6 top-1/2 -translate-y-1/2",
    shellClassName: "border-lime-300/90 bg-[#071a11]/95 text-lime-200 shadow-[0_0_18px_rgba(132,204,22,0.6)]",
    iconClassName: "-rotate-12",
  },
  saved: {
    label: "Được phù thủy cứu",
    Icon: HeartPulse,
    iconColor: "#5de861",
    positionClassName: "left-1/2 -top-7 -translate-x-1/2",
    shellClassName: "border-emerald-200/90 bg-[#06201d]/95 text-emerald-100 shadow-[0_0_18px_rgba(93,232,97,0.65)]",
  },
};

function NightStatusMark({ kind }: { kind: NightStatusKind }) {
  const config = NIGHT_STATUS_CONFIG[kind];
  const Icon = config.Icon;

  return (
    <div
      className={`absolute z-30 h-7 w-7 sm:h-8 sm:w-8 rounded-full border ${config.positionClassName} ${config.shellClassName} pointer-events-none select-none overflow-visible`}
      title={config.label}
      aria-hidden="true"
    >
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.2),transparent_42%,rgba(0,0,0,0.42))]" />
      <Icon
        size={21}
        weight="Filled"
        color={config.iconColor}
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.75)] sm:size-6 ${config.iconClassName ?? ""}`}
      />
    </div>
  );
}

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
  const canClick = !isDead && !isDisabled && !player.isModerator && onSelect;
  const frameColors = player.visibleFrameType
    ? ROLE_FRAME_COLORS[player.visibleFrameType]
    : null;
  const activeStatuses: NightStatusKind[] = [
    isBitten && "bitten",
    isProtected && "protected",
    isAimed && "aimed",
    isLover && "lover",
    isInspected && "inspected",
    isPoisoned && "poisoned",
    isSaved && "saved",
  ].filter(Boolean) as NightStatusKind[];
  const statusLabel = activeStatuses
    .map((status) => NIGHT_STATUS_CONFIG[status].label)
    .join(", ");

  return (
    <button
      type="button"
      onClick={canClick ? onSelect : undefined}
      disabled={!canClick}
      className={`flex flex-col items-center gap-0.5 transition-[transform,opacity] duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d11] ${
        canClick ? "cursor-pointer hover:scale-[1.08] active:scale-95" : "cursor-default"
      }`}
      aria-label={[
        player.name,
        isDead ? "đã chết" : "",
        isSelected ? "đang chọn" : "",
        statusLabel,
      ].filter(Boolean).join(", ")}
    >
      {/* Avatar container */}
      <div
        className="relative rounded-full flex items-center justify-center transition-[border-color,box-shadow,opacity,filter] duration-300"
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
            className="absolute -inset-1 rounded-full animate-pulse motion-reduce:animate-none pointer-events-none"
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

        {activeStatuses.map((status) => (
          <NightStatusMark key={status} kind={status} />
        ))}

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
        className={`font-gothic-body text-[11px] sm:text-[12px] font-semibold tracking-wide max-w-21.25 truncate transition-colors ${
          isDead ? "text-[#445257] line-through" : isSelected ? "text-white" : "text-[#829ea2]"
        }`}
        style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}
      >
        {player.name}
        {player.userId === myUserId && " (Bạn)"}
      </span>

      {/* Host badge */}
      {player.isModerator && (
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
  const gamePlayers = players.filter(p => !p.isModerator);
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
