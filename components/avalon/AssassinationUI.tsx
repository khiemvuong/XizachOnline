"use client";
import { AvalonRoom, AvalonPlayer } from "@/server/game/AvalonTypes";
import { Skull, Sword } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Socket } from "socket.io-client";
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
    (p: AvalonPlayer) => p.team !== "Evil" && p.status === "connected",
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

  return (
    <div className="absolute inset-0 z-50 overflow-y-auto overflow-x-hidden animate-in fade-in duration-500">
      <div className="relative min-h-full avalon-assassin-bg px-4 py-8 md:px-6 md:py-10 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/15 via-black/38 to-black/70"></div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_22%,rgba(2,15,30,0.88)_100%)]"></div>

        <section className="relative z-20 mx-auto flex w-full max-w-6xl flex-col items-center gap-8">
          <div className="text-center space-y-2">
            <div className="mb-2 flex items-center justify-center gap-4">
              <div className="h-px w-12 bg-tertiary"></div>
              <Sword className="h-10 w-10 rotate-135 text-tertiary fill-current opacity-25" />
              <div className="h-px w-12 bg-tertiary"></div>
            </div>
            <h2 className="font-headline text-5xl md:text-7xl font-bold tracking-[0.18em] text-on-surface uppercase">
              {titleCopy.title}
            </h2>
            <p className="font-body text-tertiary text-base md:text-lg tracking-widest uppercase opacity-90">
              {titleCopy.subtitle}
            </p>
          </div>

          {isAssassin ? (
            <div className="w-full overflow-x-auto pb-5">
              <div className="mx-auto flex min-w-max max-w-6xl gap-5 px-2">
                {goodPlayers.map((player: AvalonPlayer) => (
                  <button
                    key={player.userId}
                    type="button"
                    onClick={() => setSelectedTarget(player)}
                    className="w-56 md:w-64 aspect-3/4 rounded-xl border border-outline-variant/35 bg-surface-container-low/80 backdrop-blur-md overflow-hidden group transition-all duration-500 hover:border-tertiary/45 hover:shadow-[0_0_28px_rgba(255,180,168,0.24)] cursor-pointer text-left"
                  >
                    <div className="relative h-2/3 overflow-hidden">
                      <Image
                        src="/avalon_roles/unknown.jpeg"
                        alt={`Target ${player.name}`}
                        fill
                        className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-surface-container-low to-transparent"></div>
                      <div className="absolute left-3 bottom-3 rounded-md bg-black/55 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
                        {player.name}
                      </div>
                      <div className="absolute top-3 right-3 rounded-full bg-primary-container/80 px-2.5 py-1 text-[10px] uppercase tracking-tight text-primary">
                        Hidden Servant
                      </div>
                    </div>

                    <div className="flex h-1/3 flex-col p-4 md:p-5">
                      <h3 className="font-headline text-xl mb-1 truncate text-(--on-surface)">{player.name}</h3>
                      <p className="text-[10px] uppercase tracking-widest mb-3 text-(--on-surface-variant)">Unknown Identity</p>
                      <p className="mt-auto rounded-xl border border-outline-variant/35 bg-surface-container/40 py-3 text-center text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                        Chọn mục tiêu
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full max-w-3xl rounded-2xl border border-outline-variant/35 bg-surface-container-low/78 p-6 text-center backdrop-blur-md shadow-[0_0_40px_rgba(0,0,0,0.35)]">
              <Skull className="mx-auto mb-3 h-10 w-10 text-tertiary opacity-80" />
              <p className="text-on-surface-variant leading-relaxed">
                Assassin đang lựa chọn mục tiêu trong bóng tối. Hãy chờ phán quyết cuối cùng.
              </p>
            </div>
          )}

          <div className="pointer-events-none hidden lg:block fixed right-8 bottom-20 opacity-20">
            <Sword className="h-56 w-56 rotate-45 text-tertiary fill-current" />
          </div>
        </section>

        {isAssassin && selectedTarget && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/65 px-4">
            <div className="w-full max-w-md rounded-2xl border border-outline-variant/45 bg-surface-container p-6 shadow-[0_0_40px_rgba(0,0,0,0.45)]">
              <h3 className="font-headline text-2xl text-on-surface uppercase tracking-[0.08em]">
                Confirm Target
              </h3>
              <p className="mt-3 text-on-surface-variant leading-relaxed">
                Bạn có chắc với lựa chọn của mình không?
              </p>
              <p className="mt-2 text-tertiary font-semibold">Mục tiêu: {selectedTarget.name}</p>

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTarget(null)}
                  className="flex-1 rounded-xl border border-outline-variant/40 bg-surface-container-high px-4 py-3 text-sm font-semibold uppercase tracking-wide text-on-surface cursor-pointer transition-colors hover:bg-surface-container-highest"
                >
                  Chưa, chọn lại
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAssassinate}
                  className="flex-1 rounded-xl border border-tertiary/60 bg-tertiary px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-white cursor-pointer shadow-[0_0_20px_rgba(255,180,168,0.45)] transition-all hover:scale-[1.02] hover:bg-tertiary-fixed"
                >
                  Chắc chắn
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
