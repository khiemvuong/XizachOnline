import React from "react";
import { BadgeCheck } from "lucide-react";
import EvidencePreviewCard from "@/components/deception/EvidencePreviewCard";
import type { DeceptionPlayer, MeansCard, ClueCard } from "@/server/game/DeceptionTypes";
import { RoleTone, PendingSolveSelection, PlayerEvidenceView, HintTileView } from "../DiscussionBoard";

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
  roleToneByRole: (role: DeceptionPlayer["role"] | undefined) => RoleTone;
  playerPings: Record<string, number>;
  roleLabel: (player: DeceptionPlayer | undefined) => string;
  setFocusedPlayerUserId: React.Dispatch<React.SetStateAction<string>>;
  selectableEvidencePlayers: DeceptionPlayer[];
  playerEvidenceViews: Map<string, PlayerEvidenceView>;
  playerReadyMap: Record<string, boolean>;
  playerCardsReady: boolean;
  warmProgressLabel: string;
  isForensic: boolean;
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
  isForensic,
  knownMurderer,
  revealedMurderSelection,
  handleSelectMeansForSolve,
  setZoomedCard,
  handleSelectClueForSolve,
  forensicHints,
}: NonForensicSectionProps) {
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
                .sort((a, b) => {
                  if (a.userId === me?.userId) return -1;
                  if (b.userId === me?.userId) return 1;
                  return 0;
                })
                .map((player: DeceptionPlayer) => {
                const showForensicBadge = !hideRolesUi && player.role === "ForensicScientist";
                const accusationTone = accusationBadgeTone(player.hasBadge);
                const active = player.userId === resolvedFocusedPlayerUserId;
                const isSelf = player.userId === me?.userId;
                const initial = (player.name?.trim().charAt(0) || "?").toUpperCase();
                const displayName = clampPlayerName(
                  player.name,
                  isDesktopWideViewport ? 11 : isCompactViewport ? 11 : 14,
                );
                const roleTone = hideRolesUi
                  ? roleToneByRole(undefined)
                  : roleToneByRole(player.role);

                const isMurderer = player.role === "Murderer" || player.isMurdererHint;

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

                    <div className="flex items-center gap-2">
                      <div
                        className={`flex shrink-0 items-center justify-center rounded-full border font-black uppercase tracking-[0.08em] ${roleTone.avatarClass} ${isDesktopWideViewport ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm"}`}
                      >
                        {initial}
                      </div>

                      <div className="min-w-0">
                        <p
                          className={`truncate font-bold uppercase tracking-[0.08em] text-(--on-surface) ${isDesktopWideViewport ? "text-xs" : "text-sm"}`}
                        >
                          {displayName}
                          {playerPings[player.userId] !== undefined && (
                            <span
                              className={`ml-1 text-[10px] font-black font-mono tracking-tighter ${
                                playerPings[player.userId] < 150
                                  ? "text-emerald-400"
                                  : playerPings[player.userId] < 350
                                    ? "text-amber-400"
                                    : "text-red-500"
                              }`}
                            >
                              {Math.min(999, playerPings[player.userId])}
                              ms
                            </span>
                          )}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <span
                            className={`inline-flex max-w-full items-center gap-1 rounded border font-black uppercase tracking-widest ${roleTone.chipClass} ${isDesktopWideViewport ? "px-1 py-0.5 text-[8px]" : "px-1.5 py-0.5 text-[9px]"}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${roleTone.dotClass}`} />
                            <span className="truncate">
                              {hideRolesUi ? "Người chơi" : roleLabel(player)}
                            </span>
                          </span>

                          {showForensicBadge && (
                            <span
                              className={`inline-flex items-center gap-1 rounded border border-cyan-300/75 bg-[radial-gradient(circle_at_30%_30%,rgba(70,220,255,0.35),rgba(12,68,102,0.58))] font-black uppercase tracking-widest text-cyan-50 shadow-[0_0_10px_rgba(0,212,255,0.28)] ${isDesktopWideViewport ? "px-1 py-0.5 text-[8px]" : "px-1.5 py-0.5 text-[8px]"}`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_8px_rgba(120,240,255,0.8)]" />
                              Pháp y
                            </span>
                          )}

                          <span
                            title={accusationTone.title}
                            className={`inline-flex items-center gap-1 rounded border font-black uppercase tracking-widest ${accusationTone.chipClass} ${isDesktopWideViewport ? "px-1 py-0.5 text-[8px]" : "px-1.5 py-0.5 text-[8px]"}`}
                          >
                            <BadgeCheck className={`h-2.5 w-2.5 ${accusationTone.iconClass}`} />
                            <span>{accusationTone.label}</span>
                          </span>

                          {isSelf && (
                            <span
                              className={`rounded border border-cyan-300/70 bg-cyan-400/18 font-black uppercase tracking-widest text-cyan-100 ${isDesktopWideViewport ? "px-1 py-0.5 text-[8px]" : "px-1.5 py-0.5 text-[8px]"}`}
                            >
                              Bạn
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section
            className={`grid min-h-0 flex-1 ${isDesktopWideViewport ? "gap-3 grid-cols-[minmax(0,1fr)_22rem]" : "gap-4 grid-cols-[minmax(0,1fr)_21rem]"}`}
          >
            <article className="deception-card min-h-0 overflow-visible rounded-xl p-3">
              <div className="relative h-full min-h-0">
                {[...selectableEvidencePlayers]
                  .filter((p) => p.role !== "ForensicScientist")
                  .map((player: DeceptionPlayer) => {
                  const view = playerEvidenceViews.get(player.userId);
                  if (!view) return null;

                  const isActive = player.userId === resolvedFocusedPlayerUserId;
                  const playerHasNoCards = hideRolesUi && view.cardCount === 0;
                  const canSelectPlayerForSolve = isForensic || player.userId !== me?.userId;
                  const playerIsKnownMurderer = Boolean(knownMurderer && player.userId === knownMurderer.userId);

                  return (
                    <section
                      key={`discussion-players-view-${player.userId}`}
                      aria-hidden={!isActive}
                      className={
                        isActive
                          ? "relative h-full transition-opacity duration-200"
                          : "pointer-events-none absolute inset-0 h-full opacity-0 transition-opacity duration-200"
                      }
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
                              effectivePendingSolveSelection?.accusedUserId === player.userId &&
                              effectivePendingSolveSelection.means?.id === card.id;

                            return (
                              <EvidencePreviewCard
                                key={`means-${player.userId}-${card.id}`}
                                card={card}
                                tone="means"
                                highlighted={isMurderMeans}
                                selected={isSelectedMeans}
                                rotationClass={rotationClass}
                                evidenceNum={String(card.id).padStart(2, "0")}
                                imageUrl={imageUrl}
                                onSelect={
                                  canSelectPlayerForSolve
                                    ? (_c: MeansCard, _t: "means" | "clue", img: string) => handleSelectMeansForSolve(player, card, img)
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
                              effectivePendingSolveSelection?.accusedUserId === player.userId &&
                              effectivePendingSolveSelection.clue?.id === card.id;

                            return (
                              <EvidencePreviewCard
                                key={`clue-${player.userId}-${card.id}`}
                                card={card}
                                tone="clue"
                                highlighted={isMurderClue}
                                selected={isSelectedClue}
                                rotationClass={rotationClass}
                                evidenceNum={String(card.id).padStart(2, "0")}
                                imageUrl={imageUrl}
                                onSelect={
                                  canSelectPlayerForSolve
                                    ? (_c: ClueCard, _t: "means" | "clue", img: string) => handleSelectClueForSolve(player, card, img)
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
                })}
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
