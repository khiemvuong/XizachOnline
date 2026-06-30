"use client";

import { type ReactNode, useRef } from "react";
import { useSceneScale } from "@/hooks/useSceneScale";
import {
  CIRCLE_POSITIONS,
  ROLE_FRAME_COLORS,
  type NightPlayer,
  type RoleDisplayConfig,
} from "./nightConstants";

// ─── Role Frame Decorators (SVG overlays around avatar) ───

function RoleFrameDecorator({ frameType, size }: { frameType: RoleDisplayConfig["frameType"]; size: number }) {
  const colors = ROLE_FRAME_COLORS[frameType];
  const r = size / 2;
  const strokeW = 2;

  // Each frame type gets a unique decorative element on top of the circle border
  switch (frameType) {
    case "wolf":
      // Wolf fangs at bottom
      return (
        <svg className="absolute inset-0 pointer-events-none" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Left fang */}
          <path d={`M ${r - 6} ${size - 4} L ${r - 3} ${size + 4} L ${r} ${size - 4}`} fill={colors.border} opacity={0.9} />
          {/* Right fang */}
          <path d={`M ${r} ${size - 4} L ${r + 3} ${size + 4} L ${r + 6} ${size - 4}`} fill={colors.border} opacity={0.9} />
          {/* Ear accents at top */}
          <path d={`M ${r - 12} 6 L ${r - 7} -4 L ${r - 2} 6`} fill={colors.border} opacity={0.7} />
          <path d={`M ${r + 2} 6 L ${r + 7} -4 L ${r + 12} 6`} fill={colors.border} opacity={0.7} />
        </svg>
      );

    case "shiba":
      // Shiba ears at top (rounded, friendly)
      return (
        <svg className="absolute inset-0 pointer-events-none" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <path d={`M ${r - 14} 8 Q ${r - 10} -6 ${r - 4} 5`} fill={colors.border} opacity={0.7} stroke={colors.border} strokeWidth={strokeW} />
          <path d={`M ${r + 4} 5 Q ${r + 10} -6 ${r + 14} 8`} fill={colors.border} opacity={0.7} stroke={colors.border} strokeWidth={strokeW} />
        </svg>
      );

    case "owl":
      // Owl horn tufts at top
      return (
        <svg className="absolute inset-0 pointer-events-none" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <path d={`M ${r - 10} 5 L ${r - 12} -5 L ${r - 5} 3`} fill="none" stroke={colors.border} strokeWidth={strokeW} strokeLinecap="round" />
          <path d={`M ${r + 5} 3 L ${r + 12} -5 L ${r + 10} 5`} fill="none" stroke={colors.border} strokeWidth={strokeW} strokeLinecap="round" />
          {/* Small eye circles */}
          <circle cx={r - 6} cy={r - 2} r={2} fill="none" stroke={colors.border} strokeWidth={1} opacity={0.5} />
          <circle cx={r + 6} cy={r - 2} r={2} fill="none" stroke={colors.border} strokeWidth={1} opacity={0.5} />
        </svg>
      );

    case "rose":
      // Rose petals accent
      return (
        <svg className="absolute inset-0 pointer-events-none" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={r - 10} cy={size - 3} r={3} fill={colors.border} opacity={0.6} />
          <circle cx={r - 6} cy={size - 6} r={2.5} fill={colors.border} opacity={0.5} />
          <circle cx={r + 10} cy={size - 3} r={3} fill={colors.border} opacity={0.6} />
          <circle cx={r + 6} cy={size - 6} r={2.5} fill={colors.border} opacity={0.5} />
        </svg>
      );

    case "potion":
      // Potion bubbles
      return (
        <svg className="absolute inset-0 pointer-events-none" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={r + 12} cy={8} r={2.5} fill={colors.border} opacity={0.5} />
          <circle cx={r + 15} cy={14} r={1.5} fill={colors.border} opacity={0.4} />
          <circle cx={r - 13} cy={size - 8} r={2} fill={colors.border} opacity={0.4} />
        </svg>
      );

    case "shield":
      // Shield crest at bottom
      return (
        <svg className="absolute inset-0 pointer-events-none" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <path 
            d={`M ${r - 6} ${size - 2} L ${r} ${size + 5} L ${r + 6} ${size - 2}`} 
            fill={colors.border} opacity={0.6} 
            stroke={colors.border} strokeWidth={1}
          />
        </svg>
      );

    case "crown":
      // Crown at top
      return (
        <svg className="absolute inset-0 pointer-events-none" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <path 
            d={`M ${r - 10} 4 L ${r - 7} -3 L ${r - 3} 2 L ${r} -5 L ${r + 3} 2 L ${r + 7} -3 L ${r + 10} 4`} 
            fill="none" stroke={colors.border} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round" 
            opacity={0.8}
          />
        </svg>
      );

    default:
      return null;
  }
}

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
        {player.visibleFrameType && !isDead && (
          <RoleFrameDecorator frameType={player.visibleFrameType} size={size} />
        )}

        {/* Avatar emoji */}
        <span className={`select-none ${isDead ? "opacity-40" : ""}`} style={{ fontSize: size * 0.45 }}>
          {player.avatar}
        </span>

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
      </div>

      {/* Player name */}
      <span
        className={`font-gothic-body text-[9px] sm:text-[10px] font-semibold tracking-wide max-w-[60px] truncate transition-colors ${
          isDead ? "text-[#445257] line-through" : isSelected ? "text-white" : "text-[#829ea2]"
        }`}
        style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}
      >
        {player.name}
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
  const avatarSize = gamePlayers.length > 8 ? 44 : 52;
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
    minScale: 0.4,
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
