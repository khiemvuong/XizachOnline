"use client";

import { useMemo, useState } from "react";
import type { Socket } from "socket.io-client";
import { ArrowLeft, CookingPot, EyeOff, Fingerprint, Microscope } from "lucide-react";
import type { DeceptionPlayer, DeceptionRoom, MeansCard, ClueCard } from "@/server/game/DeceptionTypes";
import SceneBoard from "./SceneBoard";
import ForensicClueBoard from "./ForensicClueBoard";
import { getResolvedMeansImageUrl, getResolvedClueImageUrl } from "@/utils/deceptionAssets";
import Image from "next/image";

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
      <div className="flex flex-col py-2 px-3 sm:px-4 flex-1">
        <h4 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">{card.vietnamese}</h4>
        <h5 className="text-[10px] sm:text-xs font-mono text-(--on-surface-variant)/60 uppercase tracking-widest">{card.english}</h5>
        <div className="mt-auto pt-2 sm:pt-3 border-t border-white/5">
          <p className="text-[11px] sm:text-xs text-(--on-surface-variant) italic leading-relaxed">&quot;{card.description}&quot;</p>
        </div>
      </div>
    </div>
  );
};

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
  const [zoomedCard, setZoomedCard] = useState<{
    card: MeansCard | ClueCard;
    tone: "means" | "clue";
    imageUrl: string;
  } | null>(null);

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
          selectedOption: tile.markerIndex !== null ? tile.options[tile.markerIndex] : null,
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
              <section className="deception-card deception-forensic-summary relative rounded-xl border-t-4 border-(--deception-red) bg-[rgba(14,16,23,0.9)] p-3 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-(--deception-cyan) sm:gap-2 sm:text-sm sm:tracking-[0.18em]">
                    <Microscope className="h-5 w-5" />
                    BÀN PHÂN TÍCH PHÁP Y
                  </div>

                  <div className="flex items-center gap-2 mr-10 sm:mr-12 xl:hidden">
                    {canConfirmSceneSetup && (
                      <button
                        disabled={awaitingReplacementChoice || !allMarked}
                        onClick={() => socket?.emit("confirmSceneSetup")}
                        className="deception-btn-red deception-primary-action px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.16em] shadow-[0_8px_24px_rgba(255,81,103,0.3)] disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        NIÊM PHONG
                      </button>
                    )}

                    {canStartDiscussion && (
                      <button
                        onClick={() => socket?.emit("startDiscussion")}
                        className="deception-btn-cyan deception-primary-action px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.16em]"
                      >
                        PHÁN QUYẾT
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-(--deception-red)/30 bg-[linear-gradient(145deg,rgba(255,81,103,0.08),rgba(255,81,103,0.02))] p-3 shadow-[inset_0_2px_20px_rgba(255,81,103,0.05)] sm:mt-4 sm:p-5 relative overflow-hidden">
                  {/* Decorative Background Elements */}
                  <div className="absolute -right-4 -top-4 text-[120px] leading-none text-(--deception-red) opacity-[0.03] pointer-events-none select-none font-black tracking-tighter">
                    SO
                  </div>
                  <div className="absolute left-0 top-0 h-full w-1 bg-linear-to-b from-(--deception-red)/50 to-transparent" />
                  
                  <div className="relative z-10 flex flex-col gap-4 sm:gap-5">
                    <div className="flex items-center gap-2 border-b border-(--deception-red)/20 pb-2">
                      <div className="h-2 w-2 rounded-full bg-(--deception-red) animate-pulse shadow-[0_0_8px_rgba(255,81,103,0.8)]" />
                      <p className="text-[11px] font-black uppercase tracking-[0.25em] text-(--deception-red-soft) sm:text-xs text-shadow-sm">
                        BỘ HỒ SƠ TỘI ÁC MẬT
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      {selectedMeans ? (
                        <FullCardDetail card={selectedMeans} tone="means" />
                      ) : (
                        <div className="flex h-20 w-full items-center justify-center rounded-md border-2 border-dashed border-(--deception-amber)/30 bg-(--deception-amber)/5">
                          <div className="hidden items-center gap-2 text-(--deception-amber)/50 sm:flex">
                             <CookingPot className="h-5 w-5" /> Đang trích xuất Mẫu Cơ Khí... (Chờ Hung Khí)
                          </div>
                          <CookingPot className="h-5 w-5 text-(--deception-amber)/50 sm:hidden" />
                        </div>
                      )}

                      {selectedClue ? (
                        <FullCardDetail card={selectedClue} tone="clue" />
                      ) : (
                        <div className="flex h-20 w-full items-center justify-center rounded-md border-2 border-dashed border-(--deception-cyan)/30 bg-(--deception-cyan)/5">
                           <div className="hidden items-center gap-2 text-(--deception-cyan)/50 sm:flex">
                             <Fingerprint className="h-5 w-5" /> Đang thu thập Dấu Vết... (Chờ Manh Mối)
                          </div>
                          <Fingerprint className="h-5 w-5 text-(--deception-cyan)/50 sm:hidden" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative z-10 mt-3 flex items-center justify-between border-t border-(--deception-red)/10 pt-3 text-[10px] uppercase tracking-[0.12em] text-(--on-surface-variant)/80 sm:text-[11px]">
                    <p className="flex items-center gap-2">
                      <span className="inline-block h-1 w-1 bg-(--on-surface-variant) opacity-50" />
                      {awaitingReplacementChoice
                        ? "Giai đoạn cập nhật Hồ Sơ Hiện Trường"
                        : "Cần hoàn tất 6 báo cáo trước khi niêm phong"}
                    </p>
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
                    {awaitingReplacementChoice ? "ĐANG TIẾP NHẬN MANH MỐI MỚI" : "NIÊM PHONG TOÀN BỘ HỒ SƠ"}
                  </button>
                )}

                {canStartDiscussion && (
                  <button
                    onClick={() => socket?.emit("startDiscussion")}
                    className="deception-btn-cyan deception-primary-action px-8 py-4 text-sm font-black uppercase tracking-[0.2em]"
                  >
                    MỞ CUỘC ĐIỀU TRA
                  </button>
                )}
              </section>
            </>
          ) : (
            <>
              <section className="deception-card deception-forensic-summary rounded-xl border border-(--deception-border) bg-[rgba(14,16,23,0.84)]">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-(--on-surface-variant) sm:gap-2 sm:text-[11px]">
                  <EyeOff className="h-3.5 w-3.5 text-(--deception-cyan) sm:h-4 sm:w-4" />
                  PHÁP Y ĐANG DỰNG LẠI HIỆN TRƯỜNG VÀ KIỂM ĐỊNH CHỨNG CỨ...
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
              TIẾT LỘ GỢI Ý MỚI
            </h2>
            <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-(--on-surface-variant)">
              Thay thế 1 báo cáo cũ bằng chứng cứ bám sát nhất sự thật.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {replaceableEvidenceTiles.map((tile) => (
                <button
                  key={tile.id}
                  onClick={() => requestReplacementConfirmation(tile.id)}
                  className="group relative flex flex-col items-start gap-1.5 overflow-hidden rounded-xl border border-[rgba(255,184,0,0.3)] bg-[linear-gradient(180deg,rgba(255,184,0,0.08),rgba(255,184,0,0.02))] p-4 text-left transition-all hover:scale-[1.02] hover:border-[rgba(255,184,0,0.6)] hover:bg-[rgba(255,184,0,0.12)] hover:shadow-[0_8px_30px_rgba(255,184,0,0.15)] focus:outline-none"
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <p className="text-sm font-black uppercase tracking-[0.12em] text-(--deception-amber)">
                      #{tile.index + 1} {tile.nameVi}
                    </p>
                  </div>
                  
                  {tile.selectedOption ? (
                    <div className="mt-1 flex w-full items-center gap-2 rounded-md bg-black/40 px-2.5 py-1.5">
                      <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-(--deception-cyan)" />
                      <p className="truncate text-xs font-semibold text-(--on-surface)">
                        Dấu vết chốt: <span className="text-(--deception-cyan)">{tile.selectedOption.textVi}</span>
                      </p>
                    </div>
                  ) : (
                    <div className="mt-1 flex w-full items-center gap-2 rounded-md bg-black/40 px-2.5 py-1.5">
                      <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-(--on-surface-variant)" />
                      <p className="truncate text-xs text-(--on-surface-variant)">Khuyết phân tích</p>
                    </div>
                  )}

                  <p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-(--on-surface-variant) opacity-70">
                    {tile.name}
                  </p>
                  
                  {/* Decorative glow on hover */}
                  <div className="pointer-events-none absolute -inset-px rounded-xl bg-linear-to-br from-[rgba(255,184,0,0.2)] to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
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
              PHÊ CHUẨN THAY ĐỔI
            </h2>

            <p className="mt-3 text-center text-sm text-(--on-surface-variant)">
              Bạn có chắc muốn đào thải hồ sơ <span className="font-bold text-(--deception-amber)">#{pendingReplacementTile.index + 1} {pendingReplacementTile.nameVi}</span> để bốc manh mối mới không? Dữ liệu cũ sẽ bị tiêu hủy vĩnh viễn.
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

      {zoomedCard && (
        <div 
          className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          onClick={() => setZoomedCard(null)}
        >
          <div 
            className="relative flex w-full flex-col items-center gap-3 sm:gap-4 animate-in fade-in zoom-in duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Image Container */}
            <div className={`relative aspect-2/3 h-[50dvh] sm:h-[60dvh] shrink-0 overflow-hidden rounded-2xl border-2 shadow-[0_20px_50px_rgba(0,0,0,0.8)] ${zoomedCard.tone === 'means' ? 'border-(--deception-amber)' : 'border-(--deception-cyan)'}`}>
              <Image 
                src={zoomedCard.imageUrl}
                alt={zoomedCard.card.vietnamese || zoomedCard.card.english || "Card"}
                fill
                unoptimized
                className="object-cover"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(to_top,rgba(0,0,0,0.9),transparent)]" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-center">
                <p className={`text-[10px] font-black uppercase tracking-widest ${zoomedCard.tone === 'means' ? 'text-(--deception-amber)' : 'text-(--deception-cyan)'}`}>
                  {zoomedCard.tone === 'means' ? 'Hung khí' : 'Manh mối'}
                </p>
                <h3 className="mt-1 text-lg font-bold uppercase leading-tight text-white drop-shadow-md">
                  {zoomedCard.card.vietnamese || zoomedCard.card.english}
                </h3>
              </div>
            </div>

            {/* Description Container */}
            {zoomedCard.card.description && (
              <div className={`w-full max-w-xs sm:max-w-sm rounded-xl border p-3 sm:p-4 text-center backdrop-blur-sm ${zoomedCard.tone === 'means' ? 'border-(--deception-amber)/30 bg-(--deception-amber)/10 text-(--deception-amber-soft)' : 'border-(--deception-cyan)/30 bg-(--deception-cyan)/10 text-(--deception-cyan-soft)'}`}>
                <p className="text-sm italic leading-relaxed">
                  &quot;{zoomedCard.card.description}&quot;
                </p>
              </div>
            )}
            
            <button
              onClick={() => setZoomedCard(null)}
              className="mt-2 rounded-full border border-white/20 bg-white/10 px-6 py-2 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
