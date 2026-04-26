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
  roleToneByRole: (role: DeceptionPlayer["role"] | undefined) => RoleTone;
  me: DeceptionPlayer | undefined;
  playerEvidenceViews: Map<string, PlayerEvidenceView>;

  playerReadyMap: Record<string, boolean>;
  warmProgressLabel: string;
  forensicHintTiles: SceneTile[];
  socket: Socket | null;
  voiceChatNode?: React.ReactNode;
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
  voiceChatNode,
}: ForensicSectionProps) {
  const [showPauseModal, setShowPauseModal] = useState(false);
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
              {voiceChatNode && (
                <div className="ml-1 shrink-0">
                  {voiceChatNode}
                </div>
              )}
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
          onSelectOption={(tileId: string, optionIndex: number) => {
            if (gameState.state === "SOLVING_ATTEMPT") return;
            socket?.emit("placeMarker", {
              tileId,
              optionIndex,
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
              const roleTone = hideRolesUi ? roleToneByRole(undefined) : roleToneByRole(player.role);
              return (
                <button
                  key={player.userId}
                  disabled={false}
                  onClick={() => {
                    setFocusedPlayerUserId(player.userId);
                  }}
                  title="Xem bộ thẻ người chơi"
                  className={`relative shrink-0 w-[180px] sm:w-[220px] overflow-hidden rounded-lg border p-1.5 md:p-2 text-left transition ${active ? roleTone.activeCardClass : roleTone.idleCardClass}`}
                >
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <AvatarDisplay
                      avatarUrl={player.avatarUrl}
                      name={player.name}
                      className={`h-7 w-7 md:h-10 md:w-10 border text-[10px] md:text-sm tracking-[0.08em] ${roleTone.avatarClass}`}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[10px] md:text-xs font-bold uppercase tracking-[0.08em] text-(--on-surface)">
                        {displayName}
                        {playerPings[player.userId] !== undefined && (
                          <span className={`ml-1 text-[8px] md:text-[10px] font-black font-mono tracking-tighter ${playerPings[player.userId] < 150 ? "text-emerald-400" : playerPings[player.userId] < 350 ? "text-amber-400" : "text-red-500"}`}>{Math.min(999, playerPings[player.userId])}ms</span>
                        )}
                      </p>
                      <div className="mt-0.5 md:mt-1 flex flex-wrap items-center gap-1">
                        <span className={`inline-flex max-w-full items-center gap-1 rounded border px-1 py-0 md:px-1.5 md:py-0.5 text-[7px] md:text-[9px] font-black uppercase tracking-widest ${roleTone.chipClass}`}>
                          <span className={`h-1 w-1 md:h-1.5 md:w-1.5 rounded-full ${roleTone.dotClass}`} />
                          <span className="truncate">{hideRolesUi ? "Người chơi" : player.role}</span>
                        </span>
                        {showForensicBadge && (
                          <span className="inline-flex items-center gap-1 rounded border border-cyan-300/75 bg-[radial-gradient(circle_at_30%_30%,rgba(70,220,255,0.35),rgba(12,68,102,0.58))] px-1 py-0 md:px-1.5 md:py-0.5 text-[7px] md:text-[8px] font-black uppercase tracking-widest text-cyan-50 shadow-[0_0_10px_rgba(0,212,255,0.28)]">
                            <span className="h-1 w-1 md:h-1.5 md:w-1.5 rounded-full bg-cyan-200 shadow-[0_0_8px_rgba(120,240,255,0.8)]" />
                            Pháp y
                          </span>
                        )}
                        <span title={accusationTone.title} className={`inline-flex items-center gap-1 rounded border px-1 py-0 md:px-1.5 md:py-0.5 text-[7px] md:text-[8px] font-black uppercase tracking-widest ${accusationTone.chipClass}`}>
                          <BadgeCheck className={`h-2 w-2 md:h-2.5 md:w-2.5 ${accusationTone.iconClass}`} />
                          <span>{accusationTone.label}</span>
                        </span>
                        {isSelf && (
                          <span className="rounded border border-cyan-300/70 bg-cyan-400/18 px-1 py-0 md:px-1.5 md:py-0.5 text-[7px] md:text-[8px] font-black uppercase tracking-widest text-cyan-100">Bạn</span>
                        )}
                      </div>
                    </div>
                  </div>
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
                            <div className="relative h-44 md:h-48 xl:h-56 [@media(max-height:500px)]:h-[110px]" key={`forensic-players-means-${activePlayer.userId}-${card.id}`}>
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
                            <div className="relative h-44 md:h-48 xl:h-56 [@media(max-height:500px)]:h-[110px]" key={`forensic-players-clue-${activePlayer.userId}-${card.id}`}>
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
