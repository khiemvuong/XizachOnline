"use client";

import { useMemo, useState } from "react";
import type { Socket } from "socket.io-client";
import { ArrowLeft, Crosshair, EyeOff, Target } from "lucide-react";
import type { DeceptionPlayer, DeceptionRoom } from "@/server/game/DeceptionTypes";

function isEvil(player: DeceptionPlayer) {
  return player.role === "Murderer" || player.role === "Accomplice";
}

export default function WitnessHunt({
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
  const [selectedUserId, setSelectedUserId] = useState("");

  const isMurderer = me?.role === "Murderer";

  const huntTargets = useMemo(
    () =>
      gameState.players.filter(
        (player) =>
          !player.isSpectator &&
          !isEvil(player) &&
          player.role !== "ForensicScientist",
      ),
    [gameState.players],
  );

  return (
    <div className="deception-room-bg deception-theme flex h-dvh flex-col overflow-hidden">
      <header className="deception-topbar">
        <div className="deception-brand">
          <span className="deception-logo-dot" />
          <span className="deception-brand-text">Witness Hunt</span>
        </div>
        <button onClick={onExit} className="deception-icon-btn" title="Thoát về sảnh">
          <ArrowLeft className="h-4 w-4" />
        </button>
      </header>

      <main className="relative min-h-0 flex-1 overflow-y-auto px-3 py-3 pb-5 sm:px-4 sm:py-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_26%,rgba(255,45,85,0.2),transparent_45%),radial-gradient(circle_at_50%_75%,rgba(0,0,0,0.82),transparent_48%)]" />

        <section className="deception-card relative z-10 mx-auto w-full max-w-5xl rounded-2xl p-4 sm:p-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(255,45,85,0.15)] text-(--deception-red)">
            <Crosshair className="h-8 w-8" />
          </div>

          <h1 className="mt-3 text-center text-2xl font-black uppercase tracking-[0.12em] text-(--deception-red) sm:mt-4 sm:text-3xl sm:tracking-[0.14em]">
            Săn Nhân Chứng
          </h1>

          {isMurderer ? (
            <>
              <p className="mx-auto mt-2 max-w-[52ch] text-center text-sm text-(--on-surface-variant) sm:mt-3">
                Chọn một người bạn nghi là Witness. Quyết định này sẽ khóa ngay khi xác nhận.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {huntTargets.map((player) => {
                  const selected = selectedUserId === player.userId;
                  return (
                    <button
                      key={player.userId}
                      onClick={() => setSelectedUserId(player.userId)}
                      className={`rounded-lg border p-3 text-left transition ${
                        selected
                          ? "border-(--deception-red) bg-[rgba(255,45,85,0.12)]"
                          : "border-(--deception-border) bg-[rgba(255,255,255,0.03)] hover:border-(--deception-red-soft)"
                      }`}
                    >
                      <p className="text-sm font-extrabold uppercase tracking-[0.08em] text-(--on-surface)">
                        {player.name}
                      </p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-(--on-surface-variant)">
                        Suspect
                      </p>
                    </button>
                  );
                })}
              </div>

              {huntTargets.length === 0 && (
                <p className="mt-4 text-center text-sm text-(--on-surface-variant)">
                  Không có mục tiêu hợp lệ để truy sát.
                </p>
              )}

              <div className="mt-4 flex items-center justify-stretch sm:mt-6 sm:justify-end">
                <button
                  onClick={() => {
                    if (!selectedUserId) return;
                    socket?.emit("witnessHuntSelect", selectedUserId);
                  }}
                  disabled={!selectedUserId}
                  className="deception-btn-red w-full px-5 py-3 text-xs font-black uppercase tracking-[0.2em] disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Target className="h-4 w-4" />
                    Xác nhận mục tiêu
                  </span>
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mx-auto mt-2 max-w-[52ch] text-center text-sm text-(--on-surface-variant) sm:mt-3">
                Kẻ sát nhân đang chọn mục tiêu truy sát. Giữ kín thân phận của bạn tới giây cuối cùng.
              </p>
              <div className="mt-4 mx-auto flex w-full max-w-lg items-center justify-center gap-2 rounded-lg border border-(--deception-border) p-3 text-xs uppercase tracking-[0.16em] text-(--on-surface-variant) sm:mt-6">
                <EyeOff className="h-4 w-4 text-(--deception-cyan)" />
                Đang chờ murderer hành động...
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
