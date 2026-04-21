import React from "react";
import { History, EyeOff, VolumeX, Volume2, ArrowLeft, CookingPot, Fingerprint, BadgeCheck } from "lucide-react";
import type { DeceptionRoom, DeceptionPlayer, MeansCard, ClueCard, SceneTile } from "@/server/game/DeceptionTypes";
import type { Socket } from "socket.io-client";
import type { RoleTone, PlayerEvidenceView } from "../DiscussionBoard";
import TimerBar from "@/components/deception/TimerBar";
import EvidencePreviewCard from "@/components/deception/EvidencePreviewCard";
import SceneBoard from "@/components/deception/SceneBoard";

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
  playerReadyMap,
  warmProgressLabel,
  forensicHintTiles,
  socket,
}: ForensicSectionProps) {
  return (
    <div className="min-h-0 flex-1 space-y-2 overflow-auto sm:space-y-3">
      <section className="rounded-xl border border-white/10 bg-slate-900/82 p-3 shadow-2xl backdrop-blur-xl sm:p-4">
        <div className="flex flex-col gap-2.5 sm:gap-3">
          <div className="flex items-center justify-between gap-2">
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
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowSolvingHistory(true)}
                className={`deception-btn-outline rounded-md px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] transition sm:px-3 sm:text-[11px]`}
                title="Lịch sử Tố Cáo"
              >
                <span className="flex items-center gap-1.5">
                  <History className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  Lịch sử
                  {gameState.solvingAttempts.length > 0 &&
                    ` (${gameState.solvingAttempts.length})`}
                </span>
              </button>
              <button
                onClick={onToggleRoleMask}
                className="deception-icon-btn"
                title={hideRolesUi ? "Hiện lại role thật" : "Ẩn role thật"}
              >
                <EyeOff className="h-4 w-4" />
              </button>
              {canToggleDiscussionAudio && (
                <button
                  onClick={onToggleBgm}
                  className="deception-icon-btn"
                  title={bgmMuted ? "Bật nhạc nền" : "Tắt nhạc nền"}
                >
                  {bgmMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
              )}
              <button
                onClick={onExit}
                className="deception-icon-btn"
                title="Thoát về sảnh"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="w-full rounded-md border-l-4 border-rose-500/60 bg-[rgba(255,255,255,0.04)] px-2.5 py-2 sm:px-3 sm:py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Solution</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-slate-100 sm:gap-2.5 sm:text-sm">
              {hideRolesUi ? (
                <span className="text-[10px] uppercase tracking-[0.14em] text-(--on-surface-variant) sm:text-[11px] sm:tracking-[0.16em]">
                  Ẩn theo chế độ ngụy trang
                </span>
              ) : (
                <>
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <CookingPot className="h-4 w-4 shrink-0 text-cyan-300" />
                    <span className="truncate">
                      {selectedMeansForensic
                        ? `${selectedMeansForensic.english} (${selectedMeansForensic.vietnamese})`
                        : "Đang chờ"}
                    </span>
                  </span>
                  <span className="text-slate-500">+</span>
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <Fingerprint className="h-4 w-4 shrink-0 text-rose-300" />
                    <span className="truncate">
                      {selectedClueForensic
                        ? `${selectedClueForensic.english} (${selectedClueForensic.vietnamese})`
                        : "Đang chờ"}
                    </span>
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className={isCompactViewport ? "origin-left scale-90" : ""}>
              <TimerBar
                currentRound={gameState.currentRound}
                timerEndAt={gameState.timerEndAt}
                timerPausedRemaining={gameState.timerPausedRemaining}
                roundDurationSeconds={gameState.settings.discussionTimeSeconds}
              />
            </div>
            <div className="flex items-center gap-1.5">
              {gameState.state === "DISCUSSION" && !gameState.timerEndAt && (
                <button
                  onClick={() => socket?.emit("startDiscussion")}
                  className="deception-btn-cyan px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] sm:px-3 sm:py-2 sm:text-[11px] sm:tracking-[0.16em]"
                >
                  Bắt đầu
                </button>
              )}
              <button
                onClick={() => setForensicTab("players")}
                className="deception-icon-btn hidden lg:inline-flex"
                title="Xem thẻ người chơi"
              >
                <History className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
      {forensicTab === "hints" ? (
        <section className={`deception-card rounded-xl ${isCompactViewport ? "p-2.5 pb-20" : "p-4"}`}>
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
      ) : (
        <section className={`deception-card rounded-xl ${isCompactViewport ? "p-2.5 pb-20" : "p-3.5"}`}>
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {[...activePlayers]
              .filter((p) => p.role !== "ForensicScientist")
              .sort((a, b) => {
                if (a.userId === me?.userId) return -1;
                if (b.userId === me?.userId) return 1;
                return 0;
              })
              .map((player) => {
              const showForensicBadge = !hideRolesUi && player.role === "ForensicScientist";
              const accusationTone = accusationBadgeTone(player.hasBadge);
              const active = player.userId === resolvedFocusedPlayerUserId;
              const isSelf = player.userId === me?.userId;
              const initial = (player.name?.trim().charAt(0) || "?").toUpperCase();
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
                    <div className={`flex h-7 w-7 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full border text-[10px] md:text-sm font-black uppercase tracking-[0.08em] ${roleTone.avatarClass}`}>{initial}</div>
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
          <article className="mt-3 min-h-0 rounded-xl border border-(--deception-border) bg-[rgba(255,255,255,0.02)] p-3">
            <div className="relative min-h-48">
              {[...activePlayers]
                .filter((p) => p.role !== "ForensicScientist")
                .map((player) => {
                const view = playerEvidenceViews.get(player.userId);
                if (!view) return null;
                const isActive = player.userId === resolvedFocusedPlayerUserId;
                const playerHasNoCards = hideRolesUi && view.cardCount === 0;
                const playerHasWarmCards = Boolean(playerReadyMap[player.userId]);
                const playerNeedsWarmup = !playerHasNoCards && !playerHasWarmCards;
                return (
                  <section
                    key={`forensic-players-view-${player.userId}`}
                    aria-hidden={!isActive}
                    className={isActive ? "relative transition-opacity duration-200" : "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200"}
                  >
                    {playerHasNoCards ? (
                      <div className="flex h-full items-center justify-center rounded-lg border border-(--deception-border) bg-[rgba(255,255,255,0.03)] p-4 text-center">
                        <p className="text-base italic leading-tight text-(--on-surface-variant)" style={{ fontFamily: "var(--font-cormorant), var(--font-headline), serif" }}>
                          Người chơi này không có bộ thẻ công khai.
                        </p>
                      </div>
                    ) : playerNeedsWarmup ? (
                      <div className="flex h-full items-center justify-center rounded-lg border border-(--deception-border) bg-[rgba(255,255,255,0.03)] p-4 text-center">
                        <div>
                          <p className="text-base italic leading-tight text-(--on-surface-variant)" style={{ fontFamily: "var(--font-cormorant), var(--font-headline), serif" }}>
                            Đang tải bộ chứng cứ của người chơi này. Dữ liệu người khác sẽ được nạp ngầm.
                          </p>
                          <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-(--on-surface-variant)">Tiến độ warm cache: {warmProgressLabel} người chơi</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid min-h-0 grid-cols-2 md:grid-cols-4 [@media(max-height:500px)]:grid-cols-4 gap-2 md:gap-3">
                        {view.means.map(({ card, imageUrl, rotationClass }) => {
                          const isMurderMeans =
                            player.role === "Murderer" && card.id === selectedMeansForensic?.id;

                          return (
                            <div className="relative h-44 md:h-48 xl:h-56 [@media(max-height:500px)]:h-[110px]" key={`forensic-players-means-${player.userId}-${card.id}`}>
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
                            player.role === "Murderer" && card.id === selectedClueForensic?.id;

                          return (
                            <div className="relative h-44 md:h-48 xl:h-56 [@media(max-height:500px)]:h-[110px]" key={`forensic-players-clue-${player.userId}-${card.id}`}>
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
              })}
            </div>
          </article>
        </section>
      )}
    </div>
  );
}
