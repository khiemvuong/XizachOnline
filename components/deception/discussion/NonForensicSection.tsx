import React from "react";
import { BadgeCheck, User } from "lucide-react";
import EvidencePreviewCard from "@/components/deception/EvidencePreviewCard";
import AvatarDisplay from "@/components/shared/AvatarDisplay";
import type { DeceptionPlayer, MeansCard, ClueCard } from "@/server/game/DeceptionTypes";
import { RoleTone, PendingSolveSelection, PlayerEvidenceView, HintTileView } from "../DiscussionBoard";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";

interface NonForensicSectionProps {
  shouldScaleNonForensicLayout: boolean;
  nonForensicViewportRef: React.RefObject<HTMLDivElement | null>;
  nonForensicSceneWidth: number;
  nonForensicSceneHeight: number;
  nonForensicScale: number;
  isDesktopWideViewport: boolean;
  activePlayers: DeceptionPlayer[];
  hideRolesUi: boolean;
  accusationBadgeTone: (hasBadge: boolean) => { label: string; title: string; chipClass: string; iconClass: string };
  resolvedFocusedPlayerUserId: string | null;
  me: DeceptionPlayer | undefined;
  clampPlayerName: (name: string, maxLen: number) => string;
  isCompactViewport: boolean;
  effectivePendingSolveSelection: PendingSolveSelection | null;
  roleToneByRole: (role: DeceptionPlayer["role"] | undefined, team?: DeceptionPlayer["team"]) => RoleTone;
  playerPings: Record<string, number>;
  roleLabel: (player: DeceptionPlayer | undefined) => string;
  setFocusedPlayerUserId: React.Dispatch<React.SetStateAction<string>>;
  selectableEvidencePlayers: DeceptionPlayer[];
  playerEvidenceViews: Map<string, PlayerEvidenceView>;
  playerReadyMap: Record<string, boolean>;
  playerCardsReady: boolean;
  warmProgressLabel: string;
  knownMurderer: DeceptionPlayer | undefined | null;
  revealedMurderSelection: { meansId: number; clueId: number } | undefined | null;
  handleSelectMeansForSolve: (player: DeceptionPlayer, card: MeansCard, img: string) => void;
  setZoomedCard: React.Dispatch<React.SetStateAction<{ card: MeansCard | ClueCard; tone: "means" | "clue"; imageUrl: string } | null>>;
  handleSelectClueForSolve: (player: DeceptionPlayer, card: ClueCard, img: string) => void;
  forensicHints: HintTileView[];
}

export default function NonForensicSection({
  shouldScaleNonForensicLayout,
  nonForensicViewportRef,
  nonForensicSceneWidth,
  nonForensicSceneHeight,
  nonForensicScale,
  isDesktopWideViewport,
  activePlayers,
  hideRolesUi,
  accusationBadgeTone,
  resolvedFocusedPlayerUserId,
  me,
  clampPlayerName,
  isCompactViewport,
  effectivePendingSolveSelection,
  roleToneByRole,
  playerPings,
  roleLabel,
  setFocusedPlayerUserId,
  selectableEvidencePlayers,
  playerEvidenceViews,
  knownMurderer,
  revealedMurderSelection,
  handleSelectMeansForSolve,
  setZoomedCard,
  handleSelectClueForSolve,
  forensicHints,
}: NonForensicSectionProps) {
  // Swipe gesture for mobile
  const validPlayers = [...selectableEvidencePlayers].filter((p) => p.role !== "ForensicScientist");
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
    <section
      ref={nonForensicViewportRef}
      className={`relative min-h-0 flex-1 ${shouldScaleNonForensicLayout ? "overflow-hidden" : "overflow-auto"}`}
    >
      <div
        className={`flex h-full w-full ${
          shouldScaleNonForensicLayout
            ? "items-center justify-center overflow-hidden"
            : "items-stretch justify-stretch"
        }`}
      >
        <div
          className={
            shouldScaleNonForensicLayout
              ? "flex shrink-0 flex-col gap-4"
              : "flex h-full w-full flex-col gap-4"
          }
          style={
            shouldScaleNonForensicLayout
              ? {
                  width: `${nonForensicSceneWidth}px`,
                  height: `${nonForensicSceneHeight}px`,
                  transform: `scale(${nonForensicScale})`,
                  transformOrigin: "center center",
                }
              : undefined
          }
        >
          <section className="deception-card rounded-xl p-3">
            <div
              className={
                isDesktopWideViewport
                  ? "flex gap-1.5 overflow-x-auto pr-1"
                  : "grid grid-cols-3 gap-2 md:grid-cols-4 xl:grid-cols-6"
              }
            >
              {[...activePlayers]
                .filter((p) => p.role !== "ForensicScientist")
                .map((player: DeceptionPlayer) => {
                const showForensicBadge = !hideRolesUi && player.role === "ForensicScientist";
                const accusationTone = accusationBadgeTone(player.hasBadge);
                const active = player.userId === resolvedFocusedPlayerUserId;
                const isSelf = player.userId === me?.userId;
                const displayName = clampPlayerName(
                  player.name,
                  isDesktopWideViewport ? 11 : isCompactViewport ? 11 : 14,
                );
                const roleTone = hideRolesUi
                  ? roleToneByRole(undefined)
                  : roleToneByRole(player.role, player.team);

                const isMurderer = player.role === "Murderer" || player.isMurdererHint;
                
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
                    className={`relative overflow-hidden rounded-lg border text-left transition ${isMurderer ? "rounded-br-none" : ""} ${active ? roleTone.activeCardClass : roleTone.idleCardClass} ${isDesktopWideViewport ? "min-w-[10.8rem] p-1.5" : "p-2"}`}
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
                    <div className="relative z-10 flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className={`absolute inset-0 rounded-full blur-[6px] opacity-70 ${active ? 'bg-current' : 'hidden'}`} />
                        <AvatarDisplay
                          avatarUrl={player.avatarUrl}
                          name={player.name}
                          className={`relative border-2 tracking-[0.08em] shadow-[0_4px_10px_rgba(0,0,0,0.5)] ${roleTone.avatarClass} ${
                            isDesktopWideViewport ? "h-10 w-10 text-xs" : "h-12 w-12 text-sm"
                          }`}
                        />
                      </div>

                      <div className="min-w-0 flex-1 py-0.5">
                        <div className="flex items-center justify-between gap-2">
                           <p className={`truncate font-black uppercase tracking-widest text-(--on-surface) drop-shadow-md ${isDesktopWideViewport ? "text-[11px]" : "text-xs"}`}>
                             {displayName}
                           </p>
                           {playerPings[player.userId] !== undefined && (
                             <span className={`shrink-0 text-[9px] font-black font-mono tracking-tighter ${
                                 playerPings[player.userId] < 150 ? "text-emerald-400" : playerPings[player.userId] < 350 ? "text-amber-400" : "text-red-500"
                               }`}>
                               {Math.min(999, playerPings[player.userId])}ms
                             </span>
                           )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {/* ROLE TAG - Folder Tab Style */}
                          <span className={`inline-flex max-w-full items-center gap-1.5 border-l-[3px] font-black uppercase tracking-widest shadow-sm ${hideRolesUi ? "border-l-slate-400 bg-linear-to-r from-slate-500/20 to-transparent text-slate-300" : roleTone.tagClass} ${isDesktopWideViewport ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-0.5 text-[9px]"}`}>
                            <span className={`h-1.5 w-1.5 rounded-sm ${hideRolesUi ? "bg-slate-400" : roleTone.dotClass}`} />
                            <span className="truncate">{hideRolesUi ? "Người chơi" : roleLabel(player)}</span>
                          </span>

                          {/* FORENSIC BADGE (If applicable) */}
                          {showForensicBadge && (
                            <span className={`inline-flex items-center gap-1.5 border-l-[3px] border-l-teal-400 bg-linear-to-r from-teal-500/20 to-transparent font-black uppercase tracking-widest text-teal-200 shadow-sm ${isDesktopWideViewport ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-0.5 text-[9px]"}`}>
                              <span className="h-1.5 w-1.5 rounded-sm bg-teal-400 shadow-[0_0_6px_rgba(45,212,191,0.8)]" />
                              Pháp y
                            </span>
                          )}

                          {/* ACCUSATION BADGE - Ticket/Token Style */}
                          <span title={accusationTone.title} className={`relative inline-flex items-center gap-1.5 rounded-sm outline outline-offset-[1.5px] font-black uppercase tracking-widest ${player.hasBadge ? 'outline-amber-400/80 bg-amber-500/20 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.3)]' : 'outline-slate-700/80 bg-slate-800/40 text-slate-500'} ${isDesktopWideViewport ? "px-1.5 py-0.5 text-[8px] mx-0.5" : "px-2 py-[3px] text-[9px] mx-1"}`}>
                            <BadgeCheck className={`h-3 w-3 ${player.hasBadge ? 'text-amber-400 drop-shadow-[0_0_3px_currentColor]' : 'text-slate-500'}`} />
                            <span>{accusationTone.label}</span>
                          </span>

                          {/* YOU TAG - Solid High Contrast Style */}
                          {isSelf && (
                            <span className={`flex items-center gap-1 rounded-sm bg-cyan-400 text-cyan-950 font-black uppercase tracking-widest shadow-[0_0_12px_rgba(34,211,238,0.6)] ring-1 ring-cyan-200 ${isDesktopWideViewport ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-[3px] text-[10px]"}`}>
                              <User className="h-3 w-3" strokeWidth={3} />
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
          </section>

          <section
            className={`grid min-h-0 flex-1 ${isDesktopWideViewport ? "gap-3 grid-cols-[minmax(0,1fr)_22rem]" : "gap-4 grid-cols-[minmax(0,1fr)_21rem]"}`}
          >
            <article 
              className="deception-card min-h-0 overflow-visible rounded-xl p-3 touch-pan-y"
              ref={swipeRef}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <div className="relative h-full min-h-0">
                {(() => {
                  const activePlayer = [...selectableEvidencePlayers]
                    .filter((p) => p.role !== "ForensicScientist")
                    .find((p) => p.userId === resolvedFocusedPlayerUserId);

                  if (!activePlayer) return null;

                  const view = playerEvidenceViews.get(activePlayer.userId);
                  if (!view) return null;

                  const playerHasNoCards = hideRolesUi && view.cardCount === 0;
                  const canSelectPlayerForSolve = true;
                  const playerIsKnownMurderer = Boolean(knownMurderer && activePlayer.userId === knownMurderer.userId);

                  return (
                    <section
                      key={`discussion-players-view-${activePlayer.userId}`}
                      className="relative h-full animate-[fadeIn_200ms_ease-out]"
                    >
                      {playerHasNoCards ? (
                        <div className="flex h-full items-center justify-center rounded-lg border border-(--deception-border) bg-[rgba(255,255,255,0.03)] p-4 text-center">
                          <p
                            className="text-base italic leading-tight text-(--on-surface-variant)"
                            style={{ fontFamily: "var(--font-cormorant), var(--font-headline), serif" }}
                          >
                            Người chơi này không có bộ thẻ công khai.
                          </p>
                        </div>
                      ) : (
                        <div className="grid h-full min-h-0 grid-cols-4 auto-rows-fr gap-3 overflow-visible">
                          {view.means.map(({ card, imageUrl, rotationClass }: { card: MeansCard; imageUrl: string; rotationClass: string }) => {
                            const isMurderMeans =
                              playerIsKnownMurderer &&
                              Boolean(revealedMurderSelection) &&
                              card.id === revealedMurderSelection?.meansId;
                            const isSelectedMeans =
                              effectivePendingSolveSelection?.accusedUserId === activePlayer.userId &&
                              effectivePendingSolveSelection.means?.id === card.id;

                            return (
                              <EvidencePreviewCard
                                key={`means-${activePlayer.userId}-${card.id}`}
                                card={card}
                                tone="means"
                                highlighted={isMurderMeans}
                                selected={isSelectedMeans}
                                rotationClass={rotationClass}
                                evidenceNum={String(card.id).padStart(2, "0")}
                                imageUrl={imageUrl}
                                onSelect={
                                  canSelectPlayerForSolve
                                    ? (_c: MeansCard, _t: "means" | "clue", img: string) => handleSelectMeansForSolve(activePlayer, card, img)
                                    : undefined
                                }
                                onLongPress={(c: MeansCard, t: "means" | "clue", img: string) =>
                                  setZoomedCard({ card: c, tone: t, imageUrl: img })
                                }
                                onLongPressEnd={() => setZoomedCard(null)}
                              />
                            );
                          })}

                          {view.clues.map(({ card, imageUrl, rotationClass }: { card: ClueCard; imageUrl: string; rotationClass: string }) => {
                            const isMurderClue =
                              playerIsKnownMurderer &&
                              Boolean(revealedMurderSelection) &&
                              card.id === revealedMurderSelection?.clueId;
                            const isSelectedClue =
                              effectivePendingSolveSelection?.accusedUserId === activePlayer.userId &&
                              effectivePendingSolveSelection.clue?.id === card.id;

                            return (
                              <EvidencePreviewCard
                                key={`clue-${activePlayer.userId}-${card.id}`}
                                card={card}
                                tone="clue"
                                highlighted={isMurderClue}
                                selected={isSelectedClue}
                                rotationClass={rotationClass}
                                evidenceNum={String(card.id).padStart(2, "0")}
                                imageUrl={imageUrl}
                                onSelect={
                                  canSelectPlayerForSolve
                                    ? (_c: ClueCard, _t: "means" | "clue", img: string) => handleSelectClueForSolve(activePlayer, card, img)
                                    : undefined
                                }
                                onLongPress={(c: ClueCard, t: "means" | "clue", img: string) =>
                                  setZoomedCard({ card: c, tone: t, imageUrl: img })
                                }
                                onLongPressEnd={() => setZoomedCard(null)}
                              />
                            );
                          })}
                        </div>
                      )}
                    </section>
                  );
                })()}
              </div>
            </article>

            <aside
              className={`deception-card min-h-0 overflow-hidden rounded-xl border-[rgba(133,103,70,0.42)] bg-[radial-gradient(circle_at_20%_14%,rgba(133,103,70,0.16),transparent_42%),linear-gradient(180deg,rgba(18,15,12,0.97),rgba(10,9,8,0.98))] ${isCompactViewport ? "p-2.5" : "p-3.5"} flex flex-col`}
            >
              <div className="flex items-center justify-between gap-2 border-b border-[rgba(188,155,117,0.24)] pb-2">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#dcc09a]">
                  6 gợi ý của pháp y
                </p>
                <span className="rounded border border-[rgba(188,155,117,0.36)] bg-[rgba(86,59,34,0.26)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#c6ab87]">
                  Case Board
                </span>
              </div>

              <div className="relative mt-2.5 min-h-0 flex-1">
                <div className="pointer-events-none absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-[linear-gradient(180deg,rgba(214,182,143,0),rgba(214,182,143,0.52),rgba(214,182,143,0.2),rgba(214,182,143,0))]" />

                <div
                  className="relative grid h-full min-h-0 grid-cols-1 gap-1.5"
                  style={{
                    gridTemplateRows: `repeat(${Math.max(1, forensicHints.length)}, minmax(0, 1fr))`,
                  }}
                >
                  {forensicHints.map((hint: HintTileView, index: number) => {
                    const rightAligned = hint.side === "right";

                    return (
                      <div
                        key={hint.id}
                        className={`relative min-h-0 flex ${rightAligned ? "justify-end pl-4" : "justify-start pr-4"}`}
                      >
                        <span className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(214,182,143,0.75)] bg-[rgba(67,44,27,0.95)] shadow-[0_0_0_2px_rgba(11,10,8,0.8)]" />

                        <span
                          className={`pointer-events-none absolute top-1/2 h-px w-4 -translate-y-1/2 bg-[rgba(214,182,143,0.44)] ${rightAligned ? "left-[calc(50%+0.31rem)]" : "right-[calc(50%+0.31rem)]"}`}
                        />

                        <article
                          className="relative flex h-full min-h-0 w-[86%] flex-col justify-center overflow-hidden rounded-md border px-3.5 py-2.5 shadow-[0_6px_16px_rgba(0,0,0,0.36),inset_0_0_0_1px_rgba(255,236,206,0.05)]"
                          style={{ borderColor: hint.accentColor, background: hint.cardSurface }}
                        >
                          <span
                            className={`pointer-events-none absolute bottom-1 rounded border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] opacity-75 z-0 ${rightAligned ? "left-2" : "right-2"}`}
                            style={{
                              color: hint.dossierInk,
                              borderColor: hint.accentColor,
                              background: "rgba(14,11,9,0.34)",
                            }}
                          >
                            #{String(index + 1).padStart(2, "0")}
                          </span>

                          <span
                            className={`absolute top-2 h-1.5 w-6 rounded-full ${rightAligned ? "left-2" : "right-2"}`}
                            style={{ backgroundColor: hint.accentColor }}
                          />

                          <p
                            className={`relative z-10 truncate text-[11px] font-bold uppercase tracking-widest ${rightAligned ? "text-right" : "text-left"}`}
                            style={{ color: hint.titleColor }}
                            title={hint.title}
                          >
                            {hint.title}
                          </p>

                          <p
                            className={`relative z-10 mt-1 line-clamp-1 text-[clamp(1.12rem,2.05vh,1.4rem)] font-bold leading-[1.06] wrap-break-word ${rightAligned ? "text-right" : "text-left"}`}
                            style={{ color: hint.pickedColor }}
                            title={hint.picked}
                          >
                            {hint.picked}
                          </p>
                        </article>
                      </div>
                    );
                  })}
                </div>
              </div>
            </aside>
          </section>
        </div>
      </div>
    </section>
  );
}
