"use client";

import { useMemo, useState } from "react";
import type { Socket } from "socket.io-client";
import {
  ArrowLeft,
  CookingPot,
  EyeOff,
  Fingerprint,
  Microscope,
} from "lucide-react";
import type { DeceptionPlayer, DeceptionRoom } from "@/server/game/DeceptionTypes";
import SceneBoard from "./SceneBoard";
import ForensicClueBoard from "./ForensicClueBoard";

export default function ForensicPanel({
  gameState,
  me,
  socket,
  onExit,
}: {
  gameState: DeceptionRoom;
  me?: DeceptionPlayer;
  socket: Socket | null;
  onExit: () => void;
}) {
  const isForensic = me?.role === "ForensicScientist";

  const awaitingReplacementChoice = Boolean(gameState.awaitingReplacementChoice);

  const allMarked =
    gameState.activeSceneTiles.length > 0 &&
    gameState.activeSceneTiles.every((tile) => tile.markerIndex !== null);

  const replaceableEvidenceTiles = useMemo(
    () =>
      gameState.activeSceneTiles
        .map((tile, index) => ({
          id: tile.id,
          index,
          type: tile.type,
          nameVi: tile.nameVi,
          name: tile.name,
        }))
        .filter((tile) => tile.type === "evidence_brown"),
    [gameState.activeSceneTiles],
  );

  const [pendingReplacementTileId, setPendingReplacementTileId] = useState<string | null>(null);

  const pendingReplacementTile = useMemo(
    () => replaceableEvidenceTiles.find((tile) => tile.id === pendingReplacementTileId) || null,
    [replaceableEvidenceTiles, pendingReplacementTileId],
  );

  const allCards = useMemo(
    () => ({
      means: gameState.players.flatMap((player) => player.meansCards),
      clues: gameState.players.flatMap((player) => player.clueCards),
    }),
    [gameState.players],
  );

  const selectedMeans =
    gameState.murderSelection &&
    allCards.means.find((card) => card.id === gameState.murderSelection?.meansId);
  const selectedClue =
    gameState.murderSelection &&
    allCards.clues.find((card) => card.id === gameState.murderSelection?.clueId);

  const canConfirmSceneSetup = gameState.state === "SCENE_SETUP";
  const canStartDiscussion = gameState.state === "DISCUSSION" && !gameState.timerEndAt;

  const requestReplacementConfirmation = (tileId: string) => {
    setPendingReplacementTileId(tileId);
  };

  const closeReplacementConfirmation = () => {
    setPendingReplacementTileId(null);
  };

  const confirmReplacementTile = () => {
    if (!pendingReplacementTileId) return;
    socket?.emit("chooseReplacementTile", pendingReplacementTileId);
    setPendingReplacementTileId(null);
  };

  return (
    <div className="deception-room-bg deception-theme deception-phase-shell relative flex h-dvh flex-col overflow-hidden">
      <button
        onClick={onExit}
        className="deception-icon-btn absolute right-3 top-3 z-25 md:right-4 md:top-4"
        title="Thoát về sảnh"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      <main className={`deception-phase-main deception-forensic-template-main relative min-h-0 flex-1 ${
        isForensic
          ? "overflow-y-auto overflow-x-hidden px-2 pb-3 pt-8 sm:px-4 sm:pb-4 sm:pt-11"
          : "overflow-hidden px-2 pb-2 pt-7 sm:px-3 sm:pb-3 sm:pt-10"
      }`}>
        <div className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_12%_14%,rgba(255,81,103,0.28),transparent_35%),radial-gradient(circle_at_82%_12%,rgba(157,106,255,0.2),transparent_30%),radial-gradient(circle_at_80%_82%,rgba(0,212,255,0.18),transparent_34%)]" />

        <div className={`relative z-10 mx-auto flex w-full max-w-7xl flex-col ${isForensic ? "gap-2.5 pb-3 sm:gap-3 sm:pb-4" : "h-full"}`}>
          {isForensic ? (
            <>
              <section className="deception-card deception-forensic-summary rounded-xl border-l-4 border-(--deception-red) bg-[rgba(14,16,23,0.9)] p-2.5 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-(--deception-cyan) sm:gap-2 sm:text-sm sm:tracking-[0.18em]">
                    <Microscope className="h-4 w-4" />
                    Forensic Scientist Panel
                  </div>
                </div>

                <div className="mt-2.5 rounded-lg border border-(--deception-border) bg-[rgba(255,81,103,0.1)] p-2.5 sm:mt-3 sm:p-3">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-(--deception-red-soft) sm:text-[11px]">
                      Solution
                    </p>

                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1.5 sm:gap-x-4 sm:gap-y-2">
                      <div className="inline-flex min-w-0 items-center gap-1.5 sm:gap-2">
                        <CookingPot className="h-4 w-4 shrink-0 text-(--deception-amber)" />
                        <span className="truncate text-sm font-bold uppercase tracking-[0.06em] text-(--on-surface) sm:tracking-[0.08em]">
                          {selectedMeans ? selectedMeans.vietnamese : "Đang chờ"}
                        </span>
                      </div>

                      <span className="text-(--on-surface-variant)">+</span>

                      <div className="inline-flex min-w-0 items-center gap-1.5 sm:gap-2">
                        <Fingerprint className="h-4 w-4 shrink-0 text-(--deception-cyan)" />
                        <span className="truncate text-sm font-bold uppercase tracking-[0.06em] text-(--on-surface) sm:tracking-[0.08em]">
                          {selectedClue ? selectedClue.vietnamese : "Đang chờ"}
                        </span>
                      </div>
                    </div>

                    {canConfirmSceneSetup && (
                      <button
                        disabled={awaitingReplacementChoice || !allMarked}
                        onClick={() => socket?.emit("confirmSceneSetup")}
                        className="deception-btn-red deception-primary-action ml-auto px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] shadow-[0_8px_24px_rgba(255,81,103,0.3)] disabled:cursor-not-allowed disabled:opacity-45 xl:hidden"
                      >
                        Xác nhận
                      </button>
                    )}

                    {canStartDiscussion && (
                      <button
                        onClick={() => socket?.emit("startDiscussion")}
                        className="deception-btn-cyan deception-primary-action ml-auto px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] xl:hidden"
                      >
                        Bắt đầu
                      </button>
                    )}
                  </div>

                  <div className="mt-2 text-[10px] uppercase tracking-[0.12em] text-(--on-surface-variant) sm:mt-2.5 sm:text-[11px]">
                    {awaitingReplacementChoice
                      ? "Đang chờ chọn gợi ý thay"
                      : "Đánh dấu đủ 6 thẻ để xác nhận"}
                  </div>
                </div>
              </section>

              <section className="deception-card deception-forensic-scene rounded-xl border border-(--deception-border) bg-[rgba(7,11,18,0.78)] p-2 sm:p-3">
                <SceneBoard
                  variant="forensicNotes"
                  tiles={gameState.activeSceneTiles}
                  readOnly={!isForensic || awaitingReplacementChoice}
                  replacedTileIndex={gameState.replacedTileIndex}
                  onSelectOption={(tileId, optionIndex) => {
                    if (!isForensic) return;
                    socket?.emit("placeMarker", {
                      tileId,
                      optionIndex,
                    });
                  }}
                />
              </section>

              <section className="deception-forensic-actions hidden justify-center pt-1 xl:flex">
                {canConfirmSceneSetup && (
                  <button
                    disabled={awaitingReplacementChoice || !allMarked}
                    onClick={() => socket?.emit("confirmSceneSetup")}
                    className="deception-btn-red deception-primary-action px-12 py-4 text-sm font-black uppercase tracking-[0.2em] shadow-[0_10px_40px_rgba(255,81,103,0.35)] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {awaitingReplacementChoice ? "Đang chờ chọn gợi ý thay" : "Finish Marking"}
                  </button>
                )}

                {canStartDiscussion && (
                  <button
                    onClick={() => socket?.emit("startDiscussion")}
                    className="deception-btn-cyan deception-primary-action px-8 py-4 text-sm font-black uppercase tracking-[0.2em]"
                  >
                    Start Discussion
                  </button>
                )}
              </section>
            </>
          ) : (
            <>
              <section className="deception-card deception-forensic-summary rounded-xl border border-(--deception-border) bg-[rgba(14,16,23,0.84)]">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-(--on-surface-variant) sm:gap-2 sm:text-[11px]">
                  <EyeOff className="h-3.5 w-3.5 text-(--deception-cyan) sm:h-4 sm:w-4" />
                  Pháp y đang điều khiển hiện trường
                </div>
              </section>

              <section className="min-h-0 flex-1 overflow-hidden">
                <ForensicClueBoard
                  tiles={gameState.activeSceneTiles}
                />
              </section>
            </>
          )}
        </div>
      </main>

      {isForensic && awaitingReplacementChoice && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <section className="deception-card w-full max-w-3xl rounded-2xl border border-(--deception-border) bg-[rgba(10,13,20,0.96)] p-4 sm:p-5">
            <h2 className="text-2xl font-black uppercase tracking-[0.12em] text-(--on-surface)">
              Replace Clue
            </h2>
            <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-(--on-surface-variant)">
              Chọn 1 gợi ý vàng để thay bằng ô mới cho round hiện tại.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {replaceableEvidenceTiles.map((tile) => (
                <button
                  key={tile.id}
                  onClick={() => requestReplacementConfirmation(tile.id)}
                  className="rounded-lg border border-(--deception-amber) bg-[rgba(255,184,0,0.08)] px-3 py-2 text-left transition hover:bg-[rgba(255,184,0,0.18)]"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-(--deception-amber)">
                    #{tile.index + 1} {tile.nameVi}
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-(--on-surface-variant)">
                    {tile.name}
                  </p>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {isForensic && awaitingReplacementChoice && pendingReplacementTile && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/72 p-4 backdrop-blur-sm">
          <section className="deception-card w-full max-w-md rounded-2xl p-5 sm:p-6">
            <h2 className="text-center text-2xl font-black uppercase tracking-[0.12em] text-(--on-surface)">
              Confirm Replace
            </h2>

            <p className="mt-3 text-center text-sm text-(--on-surface-variant)">
              Thay gợi ý <span className="font-bold text-(--deception-amber)">#{pendingReplacementTile.index + 1} {pendingReplacementTile.nameVi}</span> bằng ô mới?
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={closeReplacementConfirmation}
                className="deception-btn-outline px-4 py-3 text-xs font-black uppercase tracking-[0.16em]"
              >
                Hủy
              </button>

              <button
                onClick={confirmReplacementTile}
                className="deception-btn-cyan px-4 py-3 text-xs font-black uppercase tracking-[0.16em]"
              >
                Xác nhận
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
