"use client";

import { AvalonRoom, AvalonPlayer } from "@/server/game/AvalonTypes";
import { Sword, Eye } from "lucide-react";
import Image from "next/image";
import { useState, useRef } from "react";
import { Socket } from "socket.io-client";
import { useSceneScale } from "@/hooks/useSceneScale";

const SCENE_W = 1060;
const SCENE_H = 600;

interface Props {
  gameState: AvalonRoom;
  me: AvalonPlayer;
  socket: Socket | null;
}

export default function AssassinView({ gameState, me, socket }: Props) {
  // Bug fix: exclude spectators from target list
  const goodPlayers = gameState.players.filter(
    (p: AvalonPlayer) =>
      p.team !== "Evil" && p.status === "connected" && !p.isSpectator,
  );

  const evilPlayers = gameState.players.filter(
    (p: AvalonPlayer) =>
      p.team === "Evil" && p.userId !== me.userId && !p.isSpectator,
  );

  const suggestions = gameState.assassinationSuggestions ?? {};

  const [selectedTarget, setSelectedTarget] = useState<AvalonPlayer | null>(
    null,
  );

  const handleConfirm = () => {
    if (!selectedTarget) return;
    socket?.emit("assassinate", selectedTarget.userId);
    setSelectedTarget(null);
  };

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const scale = useSceneScale({
    viewportRef,
    sceneWidth: SCENE_W,
    sceneHeight: SCENE_H,
    padding: 16,
    minScale: 0.28,
    minViewportWidth: 280,
    minViewportHeight: 180,
  });

  const cardCount = goodPlayers.length || 3;
  const cardGap = 16;
  const maxCardW = Math.min(
    240,
    (SCENE_W - 80 - cardGap * (cardCount - 1)) / cardCount,
  );
  const cardH = 320;

  // Suggestions — map userId→name of suggested target
  const suggestionEntries = evilPlayers
    .map((evil) => {
      const suggestedId = suggestions[evil.userId];
      if (!suggestedId) return null;
      const target = gameState.players.find((p) => p.userId === suggestedId);
      return { evilName: evil.name, targetName: target?.name ?? "???" };
    })
    .filter(Boolean) as { evilName: string; targetName: string }[];

  return (
    <div className="avalon-assassination-shell absolute inset-0 z-50 overflow-hidden animate-in fade-in duration-500">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/15 via-black/45 to-black/80 z-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_22%,rgba(2,15,30,0.90)_100%)] z-0" />

      <div ref={viewportRef} className="relative w-full h-full z-10">
        <div
          className="absolute left-1/2 top-1/2 pointer-events-auto"
          style={{
            width: `${SCENE_W}px`,
            height: `${SCENE_H}px`,
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          <div className="h-full w-full flex flex-col items-center px-10">
            {/* Header */}
            <div
              className="text-center w-full shrink-0 flex flex-col items-center justify-center"
              style={{ height: "110px" }}
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="h-px w-12 bg-(--tertiary)/60" />
                <Sword className="h-7 w-7 rotate-135 text-(--tertiary) fill-current opacity-25" />
                <div className="h-px w-12 bg-(--tertiary)/60" />
              </div>
              <h2 className="font-headline text-5xl font-bold tracking-[0.16em] text-(--on-surface) uppercase avalon-title-glow-tertiary leading-none">
                THE FINAL STRIKE
              </h2>
              <p className="font-body text-(--tertiary) text-sm tracking-widest uppercase opacity-80 mt-1.5">
                Assassin — chọn mục tiêu để hạ Merlin.
              </p>
            </div>

            <div className="shrink-0" style={{ height: "12px" }} />
            {/* Advisory strip removed — suggestions moved to cards */}

            {/* Target Cards */}
            <div
              className="w-full flex-1 flex items-start justify-center overflow-x-auto overflow-y-hidden"
              style={{
                height: `${cardH + 20}px`,
                maxHeight: `${cardH + 20}px`,
              }}
            >
              <div
                className="flex items-start justify-center"
                style={{ gap: `${cardGap}px` }}
              >
                {goodPlayers.map((player: AvalonPlayer) => {
                  const suggestedBy = evilPlayers.filter(
                    (evil) => suggestions[evil.userId] === player.userId,
                  );

                  return (
                    <button
                      key={player.userId}
                      type="button"
                      onClick={() => setSelectedTarget(player)}
                      style={{ width: `${maxCardW}px`, height: `${cardH}px` }}
                      className="relative shrink-0 rounded-xl border border-(--outline-variant)/35 bg-(--surface-container-low)/80 backdrop-blur-md overflow-hidden group transition-all duration-300 hover:-translate-y-2 hover:border-(--tertiary)/45 hover:shadow-[0_0_28px_rgba(255,180,168,0.24)] cursor-pointer text-left flex flex-col"
                    >
                      <div className="relative flex-2 overflow-hidden bg-black">
                        <Image
                          src="/avalon_roles/unknown.jpeg"
                          alt={player.name}
                          fill
                          sizes="240px"
                          className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 opacity-80 group-hover:opacity-100"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-(--surface-container-low) to-transparent" />

                        {/* Suggestion Badges */}
                        {suggestedBy.length > 0 && (
                          <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10 pointer-events-none">
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/60 border border-(--tertiary)/30 backdrop-blur-md w-fit">
                              <Eye className="w-3.5 h-3.5 text-(--tertiary) drop-shadow-[0_0_8px_var(--color-tertiary-avalon,var(--tertiary))]" />
                              <span className="text-[9px] uppercase tracking-widest text-(--tertiary) font-black drop-shadow-md">
                                Gợi ý
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 max-w-[150px]">
                              {suggestedBy.map((evil) => (
                                <span
                                  key={evil.userId}
                                  className="rounded bg-(--tertiary) px-2 py-0.5 text-[10px] font-extrabold text-white shadow-[0_0_15px_rgba(255,180,168,0.3)]"
                                >
                                  {evil.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="absolute top-3 right-3 rounded-full bg-(--primary-container)/90 px-2 py-0.5 text-[10px] uppercase tracking-tight text-(--primary) shadow-lg backdrop-blur-md">
                          Servant
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col p-3 items-center text-center">
                        <h3 className="font-headline text-base mb-0.5 truncate text-(--on-surface) w-full">
                          {player.name}
                        </h3>
                        <p className="text-[9px] uppercase tracking-widest mb-2 text-(--on-surface-variant)/60">
                          Danh tính ẩn
                        </p>
                        <p className="mt-auto w-full rounded-lg border border-(--outline-variant)/35 bg-(--surface-container)/40 py-1.5 text-[10px] font-bold uppercase tracking-widest text-(--on-surface-variant) group-hover:bg-(--tertiary)/20 group-hover:text-(--tertiary) group-hover:border-(--tertiary)/40 transition-colors">
                          Chọn mục tiêu
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {selectedTarget && (
        <div className="absolute inset-0 z-100 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-(--tertiary)/30 bg-(--surface-container-high) p-7 shadow-[0_0_60px_rgba(255,180,168,0.2)]">
            <h3 className="font-headline text-2xl text-(--tertiary) uppercase tracking-widest mb-2 flex items-center gap-3">
              <Sword className="h-5 w-5" /> Xác Nhận Mục Tiêu
            </h3>
            <p className="text-(--on-surface-variant)">
              Ám sát{" "}
              <span className="font-bold text-white tracking-wide uppercase px-1">
                {selectedTarget.name}
              </span>
              ?
            </p>
            <p className="mt-1.5 text-sm text-(--tertiary)/70 italic">
              Nếu mục tiêu không phải là Merlin, phe Ác sẽ thất bại.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedTarget(null)}
                className="flex-1 rounded-xl border border-(--outline-variant)/40 bg-(--surface-container) px-4 py-3.5 text-sm font-semibold uppercase tracking-widest text-(--on-surface) cursor-pointer hover:bg-(--surface-container-highest) transition-colors"
              >
                Trở lại
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 rounded-xl border border-(--tertiary)/60 bg-(--tertiary) px-4 py-3.5 text-sm font-extrabold uppercase tracking-widest text-white cursor-pointer shadow-[0_0_20px_rgba(255,180,168,0.45)] hover:brightness-110 transition-all"
              >
                Chắc chắn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
