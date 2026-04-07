"use client";

import { AvalonRoom, AvalonPlayer } from "@/server/game/AvalonTypes";
import { Skull, Sword } from "lucide-react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { Socket } from "socket.io-client";

// Scene canvas — everything will be scaled to fit inside the viewport
const SCENE_W = 1060;
const SCENE_H = 580; // tighter budget: header 120 + gap 16 + cards 380 + gap 16 + note 28 = 560 + 20 padding

export default function AssassinationUI({
  gameState,
  me,
  socket,
}: {
  gameState: AvalonRoom;
  me: AvalonPlayer;
  socket: Socket | null;
}) {
  const isAssassin = me.role === "Assassin";
  const goodPlayers = gameState.players.filter(
    (p: AvalonPlayer) => p.team !== "Evil" && p.status === "connected"
  );
  const [selectedTarget, setSelectedTarget] = useState<AvalonPlayer | null>(null);

  const handleConfirmAssassinate = () => {
    if (!selectedTarget) return;
    socket?.emit("assassinate", selectedTarget.userId);
    setSelectedTarget(null);
  };

  const titleCopy = isAssassin
    ? {
        title: "THE FINAL STRIKE",
        subtitle: "Assassin, choose your target to slay Merlin.",
      }
    : {
        title: "THE DAGGER WAITS",
        subtitle: "Assassin đang đưa ra lựa chọn cuối cùng...",
      };

  // ── Scale logic ────────────────────────────────────────────────────────────
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const compute = () => {
      if (!viewportRef.current) return;
      const r = viewportRef.current.getBoundingClientRect();
      const aw = Math.max(280, r.width - 16);
      const ah = Math.max(200, r.height - 16);
      setScale(Math.max(0.3, Math.min(1, aw / SCENE_W, ah / SCENE_H)));
    };

    compute();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(compute) : null;
    if (ro && viewportRef.current) ro.observe(viewportRef.current);
    window.addEventListener("resize", compute);
    window.addEventListener("orientationchange", compute);

    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", compute);
      window.removeEventListener("orientationchange", compute);
    };
  }, []);

  // Card dimensions computed based on player count — fit them all side-by-side
  const cardCount = goodPlayers.length || 3;
  const cardGap = 20;
  const maxCardW = Math.min(260, (SCENE_W - 80 - cardGap * (cardCount - 1)) / cardCount);
  const cardH = 340;

  return (
    <div className="avalon-assassination-shell absolute inset-0 z-50 overflow-hidden animate-in fade-in duration-500">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/15 via-black/45 to-black/80 z-0"></div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_22%,rgba(2,15,30,0.90)_100%)] z-0"></div>

      {/* Viewport */}
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
            {/* Header — compact */}
            <div className="text-center w-full shrink-0" style={{ height: "120px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="h-px w-12 bg-tertiary/60"></div>
                <Sword className="h-8 w-8 rotate-135 text-tertiary fill-current opacity-25" />
                <div className="h-px w-12 bg-tertiary/60"></div>
              </div>
              <h2 className="font-headline text-5xl font-bold tracking-[0.16em] text-on-surface uppercase avalon-title-glow-tertiary leading-none">
                {titleCopy.title}
              </h2>
              <p className="font-body text-tertiary text-base tracking-widest uppercase opacity-80 mt-2">
                {titleCopy.subtitle}
              </p>
            </div>

            {/* Spacer */}
            <div className="shrink-0" style={{ height: "16px" }}></div>

            {isAssassin ? (
              /* Target cards — inline flex, auto-sized */
              <div className="w-full flex-1 flex items-start justify-center overflow-x-auto overflow-y-hidden"
                style={{ height: `${cardH + 20}px`, maxHeight: `${cardH + 20}px` }}>
                <div className="flex items-start justify-center" style={{ gap: `${cardGap}px` }}>
                  {goodPlayers.map((player: AvalonPlayer) => (
                    <button
                      key={player.userId}
                      type="button"
                      onClick={() => setSelectedTarget(player)}
                      style={{ width: `${maxCardW}px`, height: `${cardH}px` }}
                      className="relative shrink-0 rounded-xl border border-outline-variant/35 bg-surface-container-low/80 backdrop-blur-md overflow-hidden group transition-all duration-300 hover:-translate-y-3 hover:border-tertiary/45 hover:shadow-[0_0_28px_rgba(255,180,168,0.24)] cursor-pointer text-left flex flex-col"
                    >
                      <div className="relative flex-2 overflow-hidden bg-black">
                        <Image
                          src="/avalon_roles/unknown.jpeg"
                          alt={`Target ${player.name}`}
                          fill
                          sizes="(max-width: 768px) 150px, 200px"
                          className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 opacity-80 group-hover:opacity-100"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-surface-container-low to-transparent"></div>
                        <div className="absolute left-3 bottom-3 rounded-md bg-black/65 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
                          {player.name}
                        </div>
                        <div className="absolute top-3 right-3 rounded-full bg-primary-container/90 px-2 py-0.5 text-[10px] uppercase tracking-tight text-primary shadow-lg backdrop-blur-md">
                          Hidden Servant
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col p-4 items-center text-center">
                        <h3 className="font-headline text-lg mb-0.5 truncate text-on-surface w-full">{player.name}</h3>
                        <p className="text-[10px] uppercase tracking-widest mb-2 text-on-surface-variant/70">Unknown Identity</p>
                        <p className="mt-auto w-full rounded-lg border border-outline-variant/35 bg-surface-container/40 py-2 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant group-hover:bg-tertiary/20 group-hover:text-tertiary group-hover:border-tertiary/40 transition-colors">
                          Chọn mục tiêu
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Wait card for non-assassins */
              <div
                className="w-full max-w-2xl rounded-2xl border border-outline-variant/35 bg-surface-container-low/78 px-10 py-8 text-center backdrop-blur-md shadow-[0_0_40px_rgba(0,0,0,0.35)] flex flex-col items-center justify-center shrink-0"
                style={{ height: `${cardH}px` }}
              >
                <Skull className="mb-5 h-14 w-14 text-tertiary opacity-80" />
                <p className="text-on-surface-variant leading-relaxed text-xl tracking-wide max-w-lg">
                  Assassin đang lựa chọn mục tiêu trong bóng tối.
                  Hãy chờ phán quyết cuối cùng.
                </p>
                <div className="mt-6 flex gap-2 justify-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-tertiary/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="h-1.5 w-1.5 rounded-full bg-tertiary/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="h-1.5 w-1.5 rounded-full bg-tertiary/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal — independent of scaling */}
      {isAssassin && selectedTarget && (
        <div className="absolute inset-0 z-100 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-tertiary/30 bg-surface-container-high p-7 shadow-[0_0_60px_rgba(255,180,168,0.2)]">
            <h3 className="font-headline text-2xl text-tertiary uppercase tracking-widest mb-2 flex items-center gap-3">
              <Sword className="h-5 w-5" /> Confirm Target
            </h3>
            <p className="text-on-surface-variant">
              Ám sát <span className="font-bold text-white tracking-wide uppercase px-1">{selectedTarget.name}</span>?
            </p>
            <p className="mt-1.5 text-sm text-tertiary/70 italic">
              Nếu mục tiêu không phải là Merlin, phe Ác sẽ thất bại.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedTarget(null)}
                className="flex-1 rounded-xl border border-outline-variant/40 bg-surface-container px-4 py-3.5 text-sm font-semibold uppercase tracking-widest text-on-surface cursor-pointer hover:bg-surface-container-highest transition-colors"
              >
                Trở lại
              </button>
              <button
                type="button"
                onClick={handleConfirmAssassinate}
                className="flex-1 rounded-xl border border-tertiary/60 bg-tertiary px-4 py-3.5 text-sm font-extrabold uppercase tracking-widest text-white cursor-pointer shadow-[0_0_20px_rgba(255,180,168,0.45)] hover:bg-tertiary-fixed transition-colors"
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
