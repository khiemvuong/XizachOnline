import React, { useState } from "react";
import { History, EyeOff, VolumeX, Volume2, ArrowLeft, CookingPot, Fingerprint, BadgeCheck } from "lucide-react";
import type { DeceptionRoom, DeceptionPlayer, MeansCard, ClueCard, SceneTile } from "@/server/game/DeceptionTypes";
import type { Socket } from "socket.io-client";
import type { RoleTone, PlayerEvidenceView } from "../DiscussionBoard";
import TimerBar from "@/components/deception/TimerBar";
import EvidencePreviewCard from "@/components/deception/EvidencePreviewCard";
import SceneBoard from "@/components/deception/SceneBoard";
import { getResolvedMeansImageUrl, getResolvedClueImageUrl } from "@/utils/deceptionAssets";
import Image from "next/image";
import AvatarDisplay from "@/components/shared/AvatarDisplay";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";

// ── Forensic-specific: role label + color group ──
function forensicRoleLabel(role: string | undefined): string {
  switch (role) {
    case "Murderer": return "Sát Nhân";
    case "Accomplice": return "Đồng Phạm";
    case "Lover": return "Tình Nhân";
    case "Witness": return "Nhân Chứng";
    case "Investigator": return "Điều Tra";
    case "Phantom": return "Bóng Ma";
    case "Detective": return "Thám Tử";
    case "ForensicScientist": return "Pháp Y";
    default: return "Ẩn Danh";
  }
}


const FullCardDetail = ({ card, tone }: { card: MeansCard | ClueCard, tone: "means"|"clue" }) => {
  const isMeans = tone === "means";
  const imageUrl = isMeans ? getResolvedMeansImageUrl(card.id) : getResolvedClueImageUrl(card.id);
  const Icon = isMeans ? CookingPot : Fingerprint;
  
  return (
    <div className={`flex w-full overflow-hidden rounded-lg border-l-4 bg-[rgba(10,14,20,0.6)] border ${isMeans ? 'border-l-(--deception-amber) border-white/5' : 'border-l-(--deception-cyan) border-white/5'}`}>
      <div className="relative w-20 sm:w-24 shrink-0 border-r border-white/5 bg-black/40 p-1">
        <div className="relative aspect-2/3 w-full overflow-hidden rounded-md">
           <Image src={imageUrl} alt={card.english} fill unoptimized className="object-cover opacity-90" />
        </div>
        <div className={`absolute left-0 top-0 rounded-br-lg bg-[#0a0d14]/90 p-1 drop-shadow-md ${isMeans ? 'text-(--deception-amber)' : 'text-(--deception-cyan)'}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="flex flex-col py-2 px-3 sm:px-4 flex-1 min-w-0">
        <h4 className="truncate text-sm sm:text-base font-bold text-white uppercase tracking-wider">{card.vietnamese}</h4>
        <h5 className="truncate text-[10px] sm:text-xs font-mono text-(--on-surface-variant)/60 uppercase tracking-widest">{card.english}</h5>
        <div className="mt-auto pt-2 sm:pt-3 border-t border-white/5">
          <p className="line-clamp-2 text-[11px] sm:text-xs text-(--on-surface-variant) italic leading-relaxed">&quot;{card.description}&quot;</p>
        </div>
      </div>
    </div>
  );
};

interface ForensicSectionProps {
  forensicTab: "hints" | "players";
  setForensicTab: React.Dispatch<React.SetStateAction<"hints" | "players">>;
  setShowSolvingHistory: (show: boolean) => void;
  onToggleRoleMask: () => void;
  onToggleBgm: () => void;
  onExit: () => void;
  hideRolesUi: boolean;
  canToggleDiscussionAudio: boolean;
  bgmMuted: boolean;
  gameState: DeceptionRoom;
  selectedMeansForensic: MeansCard | undefined;
  selectedClueForensic: ClueCard | undefined;
  isCompactViewport: boolean;
  activePlayers: DeceptionPlayer[];
  accusationBadgeTone: (hasBadge: boolean) => { label: string; title: string; chipClass: string; iconClass: string };
  resolvedFocusedPlayerUserId: string | null;
  setFocusedPlayerUserId: React.Dispatch<React.SetStateAction<string>>;
  setZoomedCard: (zoomedCard: {
    card: MeansCard | ClueCard;
    tone: "means" | "clue";
    imageUrl: string;
  } | null) => void;
  clampPlayerName: (name: string, maxLen: number) => string;
  playerPings: Record<string, number>;
  roleToneByRole: (role: DeceptionPlayer["role"] | undefined, team?: DeceptionPlayer["team"]) => RoleTone;
  me: DeceptionPlayer | undefined;
  playerEvidenceViews: Map<string, PlayerEvidenceView>;

  playerReadyMap: Record<string, boolean>;
  warmProgressLabel: string;
  forensicHintTiles: SceneTile[];
  socket: Socket | null;

}

export default function ForensicSection({
  forensicTab,
  setForensicTab,
  setShowSolvingHistory,
  onToggleRoleMask,
  onToggleBgm,
  onExit,
  hideRolesUi,
  canToggleDiscussionAudio,
  bgmMuted,
  gameState,
  selectedMeansForensic,
  selectedClueForensic,
  isCompactViewport,
  activePlayers,
  accusationBadgeTone,
  resolvedFocusedPlayerUserId,
  setFocusedPlayerUserId,
  setZoomedCard,
  clampPlayerName,
  playerPings,
  roleToneByRole,
  me,
  playerEvidenceViews,
  forensicHintTiles,
  socket,

}: ForensicSectionProps) {
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [markerNotice, setMarkerNotice] = useState<string | null>(null);
  const [pendingMarker, setPendingMarker] = useState<{ tileId: string; optionIndex: number; tileName: string; optionText: string } | null>(null);
  const knownMurderer = gameState.players.find((p) => p.role === "Murderer");

  // Swipe gesture for mobile
  const validPlayers = [...activePlayers].filter((p) => p.role !== "ForensicScientist");
  const currentIndex = validPlayers.findIndex((p) => p.userId === resolvedFocusedPlayerUserId);

  const { ref: swipeRef, onTouchStart, onTouchEnd } = useSwipeGesture<HTMLElement>({
    onSwipeLeft: () => {
      if (validPlayers.length > 0) {
        const nextIndex = currentIndex < validPlayers.length - 1 ? currentIndex + 1 : 0;
        setFocusedPlayerUserId(validPlayers[nextIndex].userId);
      }
    },
    onSwipeRight: () => {
      if (validPlayers.length > 0) {
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : validPlayers.length - 1;
        setFocusedPlayerUserId(validPlayers[prevIndex].userId);
      }
    },
    threshold: 40,
  });

  const closeMarkerModal = () => {
    setPendingMarker(null);
    setMarkerNotice(null);
  };

  const confirmMarkerPlacement = () => {
    if (!pendingMarker) return;
    socket?.emit("placeMarker", {
      tileId: pendingMarker.tileId,
      optionIndex: pendingMarker.optionIndex,
    });
    closeMarkerModal();
  };

  return (
    <div className="min-h-0 flex-1 space-y-2 overflow-auto sm:space-y-3">
      <section className="rounded-xl border border-white/10 bg-slate-900/82 p-3 shadow-2xl backdrop-blur-xl sm:p-4">
        <div className="flex flex-col gap-2.5 sm:gap-3">
          {/* Header row: Tabs, Timer, Tools */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1.5">
            <div className="flex shrink-0 items-center gap-1.5">
              <div className="inline-flex items-center gap-1 rounded-lg border border-(--deception-border) bg-[rgba(255,255,255,0.02)] p-1">
                <button
                  onClick={() => setForensicTab("hints")}
                  className={`rounded-md px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] transition sm:px-3 sm:text-[11px] ${
                    forensicTab === "hints"
                      ? "bg-rose-600 text-white"
                      : "text-(--on-surface-variant) hover:bg-rose-500/15 hover:text-rose-200"
                  }`}
                >
                  6 Viên Đạn
                </button>
                <button
                  onClick={() => setForensicTab("players")}
                  className={`rounded-md px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] transition sm:px-3 sm:text-[11px] ${
                    forensicTab === "players"
                      ? "bg-cyan-600 text-white"
                      : "text-(--on-surface-variant) hover:bg-cyan-500/15 hover:text-cyan-200"
                  }`}
                >
                  Người chơi
                </button>
              </div>
              <div className="rounded border border-indigo-500/30 bg-indigo-500/10 px-2 py-1.5 text-[10px] font-mono font-black tracking-widest text-indigo-300 sm:px-2.5 sm:text-[11px]">
                #{gameState.id}
              </div>
            </div>

            <div className="flex min-w-0 justify-center">
              <div className={`shrink-0 ${isCompactViewport ? "origin-center scale-90" : ""}`}>
                <TimerBar
                  currentRound={gameState.currentRound}
                  timerEndAt={gameState.timerEndAt}
                  timerPausedRemaining={gameState.timerPausedRemaining}
                  roundDurationSeconds={gameState.settings.discussionTimeSeconds}
                />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={() => setShowSolvingHistory(true)}
                className="deception-btn-outline shrink-0 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] transition sm:px-3 sm:text-[11px]"
                title="Lịch sử Tố Cáo"
              >
                <History className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Lịch sử
                {gameState.solvingAttempts.length > 0 && ` (${gameState.solvingAttempts.length})`}
              </button>
              <button
                onClick={onToggleRoleMask}
                className="deception-icon-btn shrink-0"
                title={hideRolesUi ? "Hiện lại role thật" : "Ẩn role thật"}
              >
                <EyeOff className="h-4 w-4" />
              </button>
              {canToggleDiscussionAudio && (
                <button
                  onClick={onToggleBgm}
                  className="deception-icon-btn shrink-0"
                  title={bgmMuted ? "Bật nhạc nền" : "Tắt nhạc nền"}
                >
                  {bgmMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
              )}
              <button
                onClick={onExit}
                className="deception-icon-btn shrink-0"
                title="Thoát về sảnh"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div id="deception-voice-slot" className="ml-1 shrink-0" />
            </div>
          </div>

          <div className="mt-1 rounded-xl border border-(--deception-red)/30 bg-[linear-gradient(145deg,rgba(255,81,103,0.08),rgba(255,81,103,0.02))] p-3 shadow-[inset_0_2px_20px_rgba(255,81,103,0.05)] sm:p-5 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-[120px] leading-none text-(--deception-red) opacity-[0.03] pointer-events-none select-none font-black tracking-tighter">
              SO
            </div>
            <div className="absolute left-0 top-0 h-full w-1 bg-linear-to-b from-(--deception-red)/50 to-transparent" />
            
            <div className="relative z-10 flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center justify-between border-b border-(--deception-red)/20 pb-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-(--deception-red) animate-pulse shadow-[0_0_8px_rgba(255,81,103,0.8)]" />
                  <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.25em] text-(--deception-red-soft) sm:text-xs text-shadow-sm">
                    BỘ HỒ SƠ TỘI ÁC MẬT
                    {!hideRolesUi && knownMurderer && (
                      <span className="text-white/60 tracking-normal capitalize ml-1 border-l border-(--deception-red)/30 pl-2">
                        {knownMurderer.name}
                      </span>
                    )}
                  </p>
                </div>
                {gameState.state === "DISCUSSION" && (
                  <>
                    {!gameState.timerEndAt ? (
                      <button
                        onClick={() => socket?.emit("startDiscussion")}
                        className="deception-btn-cyan px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] sm:px-3 sm:py-2 sm:text-[11px] sm:tracking-[0.16em]"
                      >
                        Tiếp tục
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowPauseModal(true)}
                        className="deception-btn-outline border-rose-500/50 text-rose-300 hover:bg-rose-500/20 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] sm:px-3 sm:py-2 sm:text-[11px] sm:tracking-[0.16em]"
                      >
                        Tạm dừng
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {hideRolesUi ? (
                   <div className="flex h-20 w-full items-center justify-center rounded-md border-2 border-dashed border-(--on-surface-variant)/30 bg-(--on-surface-variant)/5">
                     <div className="flex items-center gap-2 text-(--on-surface-variant)/50 text-[11px] font-bold uppercase tracking-[0.14em]">
                       <EyeOff className="h-5 w-5" /> Ẩn theo chế độ ngụy trang
                     </div>
                   </div>
                ) : (
                  <>
                    {selectedMeansForensic ? (
                      <FullCardDetail card={selectedMeansForensic} tone="means" />
                    ) : (
                      <div className="flex h-20 w-full items-center justify-center rounded-md border-2 border-dashed border-(--deception-amber)/30 bg-(--deception-amber)/5">
                        <div className="hidden items-center gap-2 text-(--deception-amber)/50 sm:flex text-[11px] font-bold uppercase tracking-widest">
                          <CookingPot className="h-5 w-5" /> Đang trích xuất Mẫu Cơ Khí... (Chờ Hung Khí)
                        </div>
                        <CookingPot className="h-5 w-5 text-(--deception-amber)/50 sm:hidden" />
                      </div>
                    )}

                    {selectedClueForensic ? (
                      <FullCardDetail card={selectedClueForensic} tone="clue" />
                    ) : (
                      <div className="flex h-20 w-full items-center justify-center rounded-md border-2 border-dashed border-(--deception-cyan)/30 bg-(--deception-cyan)/5">
                         <div className="hidden items-center gap-2 text-(--deception-cyan)/50 sm:flex text-[11px] font-bold uppercase tracking-widest">
                           <Fingerprint className="h-5 w-5" /> Đang thu thập Dấu Vết... (Chờ Manh Mối)
                        </div>
                        <Fingerprint className="h-5 w-5 text-(--deception-cyan)/50 sm:hidden" />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className={`deception-card rounded-xl ${isCompactViewport ? "p-2.5 pb-20" : "p-4"} ${
        forensicTab === "hints" ? "block" : "hidden"
      }`}>
        <SceneBoard
          tiles={forensicHintTiles}
          variant="forensicNotes"
          readOnly={gameState.state === "SOLVING_ATTEMPT"}
          replacedTileIndex={gameState.replacedTileIndex}
          releaseSealsForAdjustment={Boolean(
            gameState.currentRound > 1 &&
            gameState.replacedTileIndex !== null &&
            !gameState.forensicMarkerAdjustmentUsedThisRound
          )}
          onSelectOption={(tileId: string, optionIndex: number) => {
            if (gameState.state === "SOLVING_ATTEMPT") return;
            if (gameState.state === "DISCUSSION") {
              setMarkerNotice("Chỉ được đổi lựa chọn ở phase thay card nâu sau khi hết round.");
              return;
            }
            if (gameState.awaitingReplacementChoice) {
              setMarkerNotice("Hãy chọn card nâu cần thay trước khi đổi lựa chọn trên board.");
              return;
            }
            const selectedTile = forensicHintTiles.find((tile) => tile.id === tileId);
            if (!selectedTile) return;
            const isChangingExistingMarker = selectedTile.markerIndex !== null;
            const canAdjustMarker =
              gameState.currentRound === 1 ||
              selectedTile.markerIndex === null ||
              (gameState.replacedTileIndex !== null && !gameState.forensicMarkerAdjustmentUsedThisRound);
            if (!canAdjustMarker) {
              setMarkerNotice("Round này Pháp y đã chốt 1 thay đổi. Hãy đợi round sau.");
              return;
            }
            if (gameState.currentRound === 1 && isChangingExistingMarker) return;
            setPendingMarker({
              tileId,
              optionIndex,
              tileName: selectedTile?.nameVi || selectedTile?.name || "Báo cáo hiện trường",
              optionText: selectedTile?.options[optionIndex]?.textVi || selectedTile?.options[optionIndex]?.text || "Lựa chọn đã chọn",
            });
          }}
        />
      </section>

        <section className={`deception-card rounded-xl ${isCompactViewport ? "p-2.5 pb-20" : "p-3.5"} ${
        forensicTab === "players" ? "block" : "hidden"
      }`}>
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {[...activePlayers]
              .filter((p) => p.role !== "ForensicScientist")
              .map((player) => {
              const showForensicBadge = !hideRolesUi && player.role === "ForensicScientist";
              const accusationTone = accusationBadgeTone(player.hasBadge);
              const active = player.userId === resolvedFocusedPlayerUserId;
              const isSelf = player.userId === me?.userId;
              const displayName = clampPlayerName(player.name, isCompactViewport ? 11 : 14);
              const roleTone = hideRolesUi ? roleToneByRole(undefined) : roleToneByRole(player.role, player.team);
              const isMurderer = !hideRolesUi && player.team === "Murderer";
              
              // Theme variables for the decor
              const decorColor = hideRolesUi 
                ? "text-slate-500" 
                : isMurderer 
                  ? "text-rose-500" 
                  : "text-cyan-500";
              const watermarkText = hideRolesUi ? "CLASSIFIED" : isMurderer ? "SUSPECT" : "CLEARED";

              return (
                <button
                  key={player.userId}
                  disabled={false}
                  onClick={() => {
                    setFocusedPlayerUserId(player.userId);
                  }}
                  title="Xem bộ thẻ người chơi"
                  className={`relative shrink-0 w-[180px] sm:w-[235px] overflow-hidden rounded-lg border p-1.5 md:p-2 text-left transition ${active ? roleTone.activeCardClass : roleTone.idleCardClass}`}
                >
                  {/* Investigation Background Decor - Harmornized */}
                  <div className={`absolute inset-0 overflow-hidden pointer-events-none rounded-[inherit] transition-colors duration-500 ${decorColor}`}>
                     {/* Blueprint/Graph Grid */}
                     <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                     
                     {/* Corner Caution Stripes - top left */}
                     <div className="absolute -left-6 -top-6 h-16 w-16 -rotate-45 opacity-[0.12]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, currentColor, currentColor 2px, transparent 2px, transparent 6px)' }} />
                     
                     {/* Side Barcode - right edge */}
                     <div className="absolute -right-2 top-0 h-full w-6 opacity-[0.1]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, currentColor 0, currentColor 1.5px, transparent 1.5px, transparent 3px, currentColor 3px, currentColor 5px, transparent 5px, transparent 7px)' }} />

                     {/* Creative SVG Icon based on Role */}
                     <div className="absolute right-4 top-1/2 -translate-y-1/2 w-20 h-20 opacity-[0.06] -rotate-12">
                        {hideRolesUi ? (
                           // Folder / Classified icon
                           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="9" y1="14" x2="15" y2="14"></line></svg>
                        ) : isMurderer ? (
                           // Target / Crosshair icon
                           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg>
                        ) : (
                           // Shield / Check icon
                           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
                        )}
                     </div>

                     {/* Elegant Typography Watermark */}
                     <span className="absolute -bottom-1 right-12 select-none text-2xl font-black uppercase tracking-widest opacity-[0.06]">
                        {watermarkText}
                     </span>
                  </div>

                  {/* Glassmorphism & layout upgrade */}
                  <div className="relative z-10 flex items-center gap-2 md:gap-3">
                    <div className="relative shrink-0">
                      <div className={`absolute inset-0 rounded-full blur-[6px] opacity-70 ${active ? 'bg-current' : 'hidden'}`} />
                      <AvatarDisplay
                        avatarUrl={player.avatarUrl}
                        name={player.name}
                        className={`relative border-2 tracking-[0.08em] shadow-[0_4px_10px_rgba(0,0,0,0.5)] ${roleTone.avatarClass} h-8 w-8 md:h-12 md:w-12 text-[10px] md:text-sm`}
                      />
                    </div>

                    <div className="min-w-0 flex-1 py-0.5">
                      <div className="flex items-center justify-between gap-1 md:gap-2">
                        <p className="truncate font-black uppercase tracking-widest text-(--on-surface) drop-shadow-md text-[10px] md:text-xs">
                          {displayName}
                        </p>
                        {playerPings[player.userId] !== undefined && (
                          <span className={`shrink-0 text-[8px] md:text-[9px] font-black font-mono tracking-tighter ${playerPings[player.userId] < 150 ? "text-emerald-400" : playerPings[player.userId] < 350 ? "text-amber-400" : "text-red-500"}`}>
                            {Math.min(999, playerPings[player.userId])}ms
                          </span>
                        )}
                      </div>

                      <div className="mt-0.5 md:mt-1 flex flex-wrap items-center gap-1 md:gap-1.5">
                        {/* ROLE TAG - Folder Tab Style */}
                        {(() => {
                          const tagColor = hideRolesUi ? "border-l-slate-400 bg-gradient-to-r from-slate-500/20 to-transparent text-slate-300" : roleTone.tagClass;
                          const dotColor = hideRolesUi ? "bg-slate-400" : roleTone.dotClass;

                          return (
                            <span className={`inline-flex max-w-full items-center gap-1.5 border-l-[3px] px-1 md:px-2 py-0 md:py-0.5 text-[7px] md:text-[9px] font-black uppercase tracking-widest shadow-sm ${tagColor}`}>
                              <span className={`h-1 md:h-1.5 w-1 md:w-1.5 rounded-sm ${dotColor}`} />
                              <span className="truncate">{hideRolesUi ? "Người chơi" : forensicRoleLabel(player.role)}</span>
                            </span>
                          );
                        })()}

                        {/* FORENSIC BADGE (If applicable) */}
                        {showForensicBadge && (
                          <span className="inline-flex items-center gap-1.5 border-l-[3px] border-l-teal-400 bg-linear-to-r from-teal-500/20 to-transparent px-1 md:px-2 py-0 md:py-0.5 text-[7px] md:text-[9px] font-black uppercase tracking-widest text-teal-200 shadow-sm">
                            <span className="h-1 md:h-1.5 w-1 md:w-1.5 rounded-sm bg-teal-400 shadow-[0_0_6px_rgba(45,212,191,0.8)]" />
                            Pháp y
                          </span>
                        )}

                        {/* ACCUSATION BADGE - Ticket/Token Style */}
                        <span title={accusationTone.title} className={`relative inline-flex items-center gap-1.5 rounded-sm outline outline-offset-[1.5px] px-1 md:px-2 py-0 md:py-0.5 text-[7px] md:text-[9px] font-black uppercase tracking-widest mx-0.5 md:mx-1 ${player.hasBadge ? 'outline-amber-400/80 bg-amber-500/20 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.3)]' : 'outline-slate-700/80 bg-slate-800/40 text-slate-500'}`}>
                          <BadgeCheck className={`h-2 md:h-3 w-2 md:w-3 ${player.hasBadge ? 'text-amber-400 drop-shadow-[0_0_3px_currentColor]' : 'text-slate-500'}`} />
                          <span>{accusationTone.label}</span>
                        </span>

                        {/* YOU TAG - Solid High Contrast Style */}
                        {isSelf && (
                          <span className="flex items-center gap-1 rounded-sm bg-cyan-400 text-cyan-950 px-1 md:px-2 py-0 md:py-[3px] text-[7px] md:text-[10px] font-black uppercase tracking-widest shadow-[0_0_12px_rgba(34,211,238,0.6)] ring-1 ring-cyan-200">
                            BẠN
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Background Texture */}
                  <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
                </button>
              );
            })}
          </div>
          <article 
            className="mt-3 min-h-0 rounded-xl border border-(--deception-border) bg-[rgba(255,255,255,0.02)] p-3 touch-pan-y"
            ref={swipeRef}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div className="relative min-h-48">
              {(() => {
                const activePlayer = [...activePlayers]
                  .filter((p) => p.role !== "ForensicScientist")
                  .find((p) => p.userId === resolvedFocusedPlayerUserId);

                if (!activePlayer) return null;

                const view = playerEvidenceViews.get(activePlayer.userId);
                if (!view) return null;

                const playerHasNoCards = hideRolesUi && view.cardCount === 0;

                return (
                  <section
                    key={`forensic-players-view-${activePlayer.userId}`}
                    className="relative animate-[fadeIn_200ms_ease-out]"
                  >
                    {playerHasNoCards ? (
                      <div className="flex h-full items-center justify-center rounded-lg border border-(--deception-border) bg-[rgba(255,255,255,0.03)] p-4 text-center">
                        <p className="text-base italic leading-tight text-(--on-surface-variant)" style={{ fontFamily: "var(--font-cormorant), var(--font-headline), serif" }}>
                          Người chơi này không có bộ thẻ công khai.
                        </p>
                      </div>
                    ) : (
                      <div className="grid min-h-0 grid-cols-2 sm:grid-cols-4 [@media(max-height:500px)]:grid-cols-4 gap-2 md:gap-3">
                        {view.means.map(({ card, imageUrl, rotationClass }) => {
                          const isMurderMeans =
                            activePlayer.role === "Murderer" && card.id === selectedMeansForensic?.id;

                          return (
                            <div className="relative h-44 md:h-48 xl:h-56 [@media(max-height:500px)]:h-[160px]" key={`forensic-players-means-${activePlayer.userId}-${card.id}`}>
                              <EvidencePreviewCard
                                card={card}
                                tone="means"
                                highlighted={Boolean(isMurderMeans)}
                                rotationClass={rotationClass}
                                evidenceNum={String(card.id).padStart(2, "0")}
                                imageUrl={imageUrl}
                                onLongPress={(c: MeansCard, t: "means" | "clue", img: string) =>
                                  setZoomedCard({ card: c, tone: t, imageUrl: img })
                                }
                                onLongPressEnd={() => setZoomedCard(null)}
                              />
                            </div>
                          );
                        })}
                        {view.clues.map(({ card, imageUrl, rotationClass }) => {
                          const isMurderClue =
                            activePlayer.role === "Murderer" && card.id === selectedClueForensic?.id;

                          return (
                            <div className="relative h-44 md:h-48 xl:h-56 [@media(max-height:500px)]:h-[160px]" key={`forensic-players-clue-${activePlayer.userId}-${card.id}`}>
                              <EvidencePreviewCard
                                card={card}
                                tone="clue"
                                highlighted={Boolean(isMurderClue)}
                                rotationClass={rotationClass}
                                evidenceNum={String(card.id).padStart(2, "0")}
                                imageUrl={imageUrl}
                                onLongPress={(c: ClueCard, t: "means" | "clue", img: string) =>
                                  setZoomedCard({ card: c, tone: t, imageUrl: img })
                                }
                                onLongPressEnd={() => setZoomedCard(null)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })()}
            </div>
          </article>
        </section>

      {(markerNotice || pendingMarker) && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <section className="deception-card w-full max-w-md overflow-hidden rounded-2xl border border-(--deception-border) bg-[rgba(10,13,20,0.97)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:p-6">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-(--deception-cyan)/45 bg-(--deception-cyan)/12 text-(--deception-cyan)">
              <Fingerprint className="h-6 w-6" />
            </div>
            <h2 className="text-center text-xl font-black uppercase tracking-[0.14em] text-(--on-surface)">
              {pendingMarker ? "Xác nhận dấu vết" : "Chưa thể đổi dấu vết"}
            </h2>
            <p className="mt-3 text-center text-sm leading-relaxed text-(--on-surface-variant)">
              {pendingMarker ? (
                <>
                  Chốt <span className="font-bold text-(--deception-cyan)">{pendingMarker.optionText}</span> cho báo cáo <span className="font-bold text-(--deception-amber)">{pendingMarker.tileName}</span>? Bạn chỉ được đổi lựa chọn 1 lần trong round này, có chắc muốn đổi không?
                </>
              ) : (
                markerNotice
              )}
            </p>
            <div className={`mt-6 grid gap-3 ${pendingMarker ? "grid-cols-2" : "grid-cols-1"}`}>
              {pendingMarker && (
                <button
                  onClick={closeMarkerModal}
                  className="deception-btn-outline px-4 py-3 text-xs font-black uppercase tracking-[0.16em]"
                >
                  Hủy
                </button>
              )}
              <button
                onClick={pendingMarker ? confirmMarkerPlacement : closeMarkerModal}
                className="deception-btn-cyan px-4 py-3 text-xs font-black uppercase tracking-[0.16em]"
              >
                {pendingMarker ? "Chốt lựa chọn" : "Đã hiểu"}
              </button>
            </div>
          </section>
        </div>
      )}

      {showPauseModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-rose-500/30 bg-slate-900 p-5 shadow-2xl">
            <h3 className="mb-2 text-lg font-bold text-slate-100">Tạm dừng thời gian?</h3>
            <p className="mb-6 text-sm text-slate-400">
              Bạn có chắc muốn tạm dừng thời gian thảo luận hiện tại không?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowPauseModal(false)}
                className="rounded-lg px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/5 transition"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  socket?.emit("pauseDiscussion");
                  setShowPauseModal(false);
                }}
                className="deception-btn-cyan rounded-lg px-4 py-2 text-sm font-bold shadow-lg"
              >
                Tạm dừng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
