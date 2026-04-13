"use client";

import { AvalonRoom, AvalonPlayer } from "@/server/game/AvalonTypes";
import { Skull } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import { useSceneScale } from "@/hooks/useSceneScale";

const SCENE_W = 1060;
const SCENE_H = 580;

const EVIL_ROLES = new Set([
  "Assassin", "Morgana", "Mordred", "Oberon",
  "Minion_Evil", "Evil Lancelot",
]);

const ROLE_DISPLAY: Record<string, { vn: string; color: string; glow: string }> = {
  Assassin:        { vn: "Sát Thủ",       color: "text-orange-300",   glow: "shadow-[0_0_24px_rgba(251,146,60,0.3)]" },
  Morgana:         { vn: "Morgana",        color: "text-rose-400",     glow: "shadow-[0_0_24px_rgba(251,113,133,0.3)]" },
  Mordred:         { vn: "Mordred",        color: "text-red-400",      glow: "shadow-[0_0_24px_rgba(248,113,113,0.3)]" },
  Oberon:          { vn: "Oberon",         color: "text-purple-400",   glow: "shadow-[0_0_24px_rgba(192,132,252,0.3)]" },
  Minion_Evil:     { vn: "Thuộc Hạ Quỷ",  color: "text-amber-400",    glow: "shadow-[0_0_18px_rgba(251,191,36,0.2)]" },
  "Evil Lancelot": { vn: "Lancelot Ác",   color: "text-orange-400",   glow: "shadow-[0_0_18px_rgba(251,146,60,0.2)]" },
};

const ROLE_IMAGE_MAP: Record<string, string> = {
  Assassin:        "/avalon_roles/assassin.jpeg",
  Morgana:         "/avalon_roles/morgana.jpeg",
  Mordred:         "/avalon_roles/mordred.jpeg",
  Oberon:          "/avalon_roles/oberon.jpeg",
  Minion_Evil:     "/avalon_roles/evil_minion.jpeg",
  "Evil Lancelot": "/avalon_roles/evil_minion.jpeg",
};

interface Props {
  gameState: AvalonRoom;
}

export default function GoodWatchView({ gameState }: Props) {
  // Identify evil players by role (more reliable than team field during broadcast)
  const evilPlayers = gameState.players.filter(
    (p: AvalonPlayer) =>
      !p.isSpectator &&
      p.role != null &&
      EVIL_ROLES.has(p.role)
  );

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

  const cardCount = Math.max(evilPlayers.length, 1);
  const cardGap = 18;
  const cardW = Math.min(230, (SCENE_W - 80 - cardGap * (cardCount - 1)) / cardCount);
  const cardH = 340;

  return (
    <div className="avalon-assassination-shell absolute inset-0 z-50 overflow-hidden animate-in fade-in duration-500">
      {/* Cinematic background */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/25 via-black/55 to-black/90 z-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_60%,rgba(100,0,0,0.12)_0%,transparent_70%)] z-0" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-(--tertiary)/30 to-transparent z-0" />

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

            {/* Header — reveal announcement style */}
            <div
              className="text-center w-full shrink-0 flex flex-col items-center justify-center"
              style={{ height: "120px" }}
            >
              <div className="flex items-center justify-center gap-4 mb-2.5">
                <div className="h-px w-16 bg-linear-to-r from-transparent to-(--tertiary)/50" />
                <Skull className="h-7 w-7 text-(--tertiary) opacity-70" />
                <div className="h-px w-16 bg-linear-to-l from-transparent to-(--tertiary)/50" />
              </div>
              <h2 className="font-headline text-5xl font-bold tracking-[0.14em] text-(--on-surface) uppercase avalon-title-glow-tertiary leading-none">
                Real Identity
              </h2>
              <p className="font-body text-sm tracking-[0.22em] uppercase text-(--tertiary)/65 mt-2">
                Phe Quỷ đang bàn luận để lựa chọn mục tiêu cuối cùng
              </p>
            </div>

            <div className="shrink-0" style={{ height: "12px" }} />

            {/* Evil role cards — staggered dramatic reveal */}
            <div
              className="w-full flex items-center justify-center overflow-x-auto overflow-y-hidden"
              style={{ height: `${cardH + 20}px`, maxHeight: `${cardH + 20}px` }}
            >
              <div className="flex items-start justify-center" style={{ gap: `${cardGap}px` }}>
                {evilPlayers.map((player: AvalonPlayer, i: number) => {
                  const roleKey = player.role ?? "";
                  const display = ROLE_DISPLAY[roleKey] ?? {
                    vn: "Bóng Tối",
                    color: "text-(--tertiary)/70",
                    glow: "",
                  };
                  const imageSrc = ROLE_IMAGE_MAP[roleKey] ?? "/avalon_roles/evil_minion.jpeg";

                  return (
                    <div
                      key={player.userId}
                      className={`
                        relative shrink-0 rounded-xl border border-(--tertiary)/30
                        bg-(--surface-container-low)/80 backdrop-blur-md overflow-hidden
                        flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-600
                        ${display.glow}
                      `}
                      style={{
                        width: `${cardW}px`,
                        height: `${cardH}px`,
                        animationDelay: `${i * 140}ms`,
                        animationFillMode: "both",
                      }}
                    >
                      {/* Role image — full bleed, sharp */}
                      <div className="relative flex-2 overflow-hidden bg-black min-h-0">
                        <Image
                          src={imageSrc}
                          alt={display.vn}
                          fill
                          sizes="230px"
                          className="object-cover opacity-85"
                        />
                        {/* Vignette overlay */}
                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent" />

                        {/* Role badge — top right */}
                        <div className="absolute top-2.5 right-2.5 rounded-full bg-black/70 px-2.5 py-1 text-[9px] uppercase tracking-[0.15em] font-bold backdrop-blur-sm border border-(--tertiary)/30">
                          <span className={display.color}>{display.vn}</span>
                        </div>

                        {/* Player name overlay on image — bottom */}
                        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
                          <h3 className="font-headline text-lg font-bold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] truncate">
                            {player.name}
                          </h3>
                        </div>
                      </div>

                      {/* Role label bar — bottom card section */}
                      <div className="shrink-0 flex items-center justify-center px-3 py-2.5 gap-2 border-t border-(--tertiary)/20 bg-black/40">
                        <span className={`text-[11px] uppercase tracking-[0.2em] font-black ${display.color}`}>
                          {display.vn}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Waiting dots */}
            <div className="shrink-0 mt-5 flex flex-col items-center gap-2">
              <div className="flex gap-2">
                {[0, 160, 320].map((delay) => (
                  <div
                    key={delay}
                    className="h-1 w-6 rounded-full bg-(--tertiary)/35 animate-pulse"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-(--on-surface-variant)/30 font-semibold">
                Chờ Assassin ra phán quyết...
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
