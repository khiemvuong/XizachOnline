"use client";

import { AvalonRoom, AvalonPlayer } from "@/server/game/AvalonTypes";
import { Sword, Users } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import { Socket } from "socket.io-client";
import { useSceneScale } from "@/hooks/useSceneScale";

const SCENE_W = 1060;
const SCENE_H = 580;

interface Props {
  gameState: AvalonRoom;
  me: AvalonPlayer;
  socket: Socket | null;
}

export default function EvilAdvisoryView({ gameState, me, socket }: Props) {
  const goodPlayers = gameState.players.filter(
    (p: AvalonPlayer) => p.team !== "Evil" && !p.isSpectator && p.status === "connected"
  );

  const evilTeammates = gameState.players.filter(
    (p: AvalonPlayer) => p.team === "Evil" && p.userId !== me.userId && !p.isSpectator
  );

  const suggestions = gameState.assassinationSuggestions ?? {};
  const myVote = suggestions[me.userId] ?? null;

  const handleToggleVote = (targetId: string) => {
    const next = myVote === targetId ? null : targetId;
    socket?.emit("suggestAssassinationTarget", next);
  };

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const scale = useSceneScale({
    viewportRef,
    sceneWidth: SCENE_W,
    sceneHeight: SCENE_H,
    padding: 16,
    minScale: 0.26,
    minViewportWidth: 280,
    minViewportHeight: 180,
  });

  const cardCount = Math.max(goodPlayers.length, 1);
  const cardGap = 16;
  const cardW = Math.min(240, (SCENE_W - 80 - cardGap * (cardCount - 1)) / cardCount);
  const cardH = 320;

  return (
    <div className="avalon-assassination-shell absolute inset-0 z-50 overflow-hidden animate-in fade-in duration-500">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/15 via-black/50 to-black/85 z-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_22%,rgba(2,15,30,0.88)_100%)] z-0" />

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
              style={{ height: "100px" }}
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="h-px w-12 bg-(--tertiary)/40" />
                <Sword className="h-6 w-6 rotate-45 text-(--tertiary)/60" />
                <div className="h-px w-12 bg-(--tertiary)/40" />
              </div>
              <h2 className="font-headline text-4xl font-bold tracking-[0.14em] text-(--on-surface) uppercase avalon-title-glow-tertiary leading-none">
                THE DAGGER WAITS
              </h2>
              <p className="font-body text-sm tracking-widest uppercase text-(--tertiary)/65 mt-1.5">
                Gợi ý mục tiêu cho Assassin — Assassin vẫn tự quyết định cuối
              </p>
            </div>

            <div className="shrink-0" style={{ height: "10px" }} />

            {/* Teammate suggestions bar — compact */}
            {evilTeammates.length > 0 && (
              <div className="w-full shrink-0 flex flex-wrap items-center justify-center gap-2 mb-3 px-2 py-1.5 rounded-xl bg-black/35 border border-(--tertiary)/12 backdrop-blur-sm">
                <span className="text-[9px] uppercase tracking-[0.2em] text-(--tertiary)/45 font-bold shrink-0">
                  <Users className="inline w-3 h-3 mr-1" />Đồng đội:
                </span>
                {evilTeammates.map((evil) => {
                  const suggestedId = suggestions[evil.userId];
                  const target = suggestedId
                    ? goodPlayers.find((p) => p.userId === suggestedId)
                    : null;
                  return (
                    <span
                      key={evil.userId}
                      className="text-[10px] font-semibold text-(--on-surface-variant)/55 bg-(--surface-container)/35 px-2 py-0.5 rounded-md border border-white/8"
                    >
                      {evil.name}
                      <span className="text-(--tertiary)/50 mx-1">→</span>
                      <span className={target ? "text-white/75" : "text-(--on-surface-variant)/30"}>
                        {target?.name ?? "Chưa chọn"}
                      </span>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Candidate target cards */}
            <div
              className="w-full flex-1 flex items-start justify-center overflow-x-auto overflow-y-hidden"
              style={{ height: `${cardH + 20}px`, maxHeight: `${cardH + 20}px` }}
            >
              <div className="flex items-start justify-center" style={{ gap: `${cardGap}px` }}>
                {goodPlayers.map((player: AvalonPlayer) => {
                  const isSelected = myVote === player.userId;
                  const teammateCount = evilTeammates.filter(
                    (e) => suggestions[e.userId] === player.userId
                  ).length;

                  return (
                    <button
                      key={player.userId}
                      type="button"
                      onClick={() => handleToggleVote(player.userId)}
                      style={{ width: `${cardW}px`, height: `${cardH}px` }}
                      className={`
                        relative shrink-0 rounded-xl border overflow-hidden group
                        transition-all duration-250 cursor-pointer text-left flex flex-col
                        ${isSelected
                          ? "border-(--tertiary)/60 shadow-[0_0_30px_rgba(255,180,168,0.28)] -translate-y-2"
                          : "border-(--outline-variant)/30 hover:border-(--tertiary)/35 hover:-translate-y-1"
                        }
                        bg-(--surface-container-low)/80 backdrop-blur-md
                      `}
                    >
                      {/* Player image */}
                      <div className="relative flex-2 overflow-hidden bg-black min-h-0">
                        <Image
                          src="/avalon_roles/unknown.jpeg"
                          alt={player.name}
                          fill
                          sizes="240px"
                          className={`object-cover transition-all duration-500 ${
                            isSelected
                              ? "grayscale-0 opacity-90 scale-105"
                              : "grayscale opacity-65 group-hover:grayscale-0 group-hover:opacity-80"
                          }`}
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent" />

                        {/* Selected glow ring */}
                        {isSelected && (
                          <div className="absolute inset-0 border-2 border-(--tertiary)/50 rounded-xl pointer-events-none" />
                        )}

                        {/* Teammate consensus badge */}
                        {teammateCount > 0 && (
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-tight border border-(--tertiary)/25 backdrop-blur-sm">
                            <Users className="w-2.5 h-2.5 text-(--tertiary)/70" />
                            <span className="text-(--tertiary)/80">{teammateCount}</span>
                          </div>
                        )}

                        {/* Player name on image */}
                        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
                          <p className="font-headline text-base font-bold text-white truncate drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                            {player.name}
                          </p>
                          <p className="text-[9px] uppercase tracking-widest text-white/45 font-medium">
                            Hidden Servant
                          </p>
                        </div>
                      </div>

                      {/* CTA bar */}
                      <div
                        className={`
                          shrink-0 flex items-center justify-center py-2.5 px-3 border-t transition-colors duration-200
                          ${isSelected
                            ? "border-(--tertiary)/40 bg-(--tertiary)/18"
                            : "border-(--outline-variant)/25 bg-black/30 group-hover:bg-(--tertiary)/10 group-hover:border-(--tertiary)/25"
                          }
                        `}
                      >
                        <span className={`text-[10px] uppercase tracking-[0.2em] font-black ${
                          isSelected ? "text-(--tertiary)" : "text-(--on-surface-variant)/55 group-hover:text-(--tertiary)/70"
                        }`}>
                          {isSelected ? "✓ Gợi Ý Của Bạn" : "Gợi Ý Người Này"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
