"use client";

import { useMemo } from "react";
import { ArrowLeft, Crown, RotateCcw } from "lucide-react";
import type { ClueCard, DeceptionPlayer, DeceptionRoom, MeansCard } from "@/server/game/DeceptionTypes";

function roleLabel(role?: DeceptionPlayer["role"]) {
  switch (role) {
    case "ForensicScientist":
      return "Pháp Y";
    case "Murderer":
      return "Kẻ Giết Người";
    case "Accomplice":
      return "Đồng Phạm";
    case "Witness":
      return "Nhân Chứng";
    case "Investigator":
      return "Điều Tra Viên";
    default:
      return "Ẩn danh";
  }
}

function winnerLabel(room: DeceptionRoom) {
  if (room.winner === "Investigator") return "PHE ĐIỀU TRA THẮNG";
  if (room.winner === "Murderer") return "PHE SÁT NHÂN THẮNG";
  return "VÁN CHƠI KẾT THÚC";
}

export default function GameOverScene({
  gameState,
  me,
  onExit,
  onReturnToLobby,
  canReturnToLobby = false,
}: {
  gameState: DeceptionRoom;
  me?: DeceptionPlayer;
  onExit: () => void;
  onReturnToLobby?: () => void;
  canReturnToLobby?: boolean;
}) {
  const allMeans = useMemo(() => {
    const map = new Map<number, MeansCard>();
    gameState.players.forEach((player) => {
      player.meansCards.forEach((card) => map.set(card.id, card));
    });
    return map;
  }, [gameState.players]);

  const allClues = useMemo(() => {
    const map = new Map<number, ClueCard>();
    gameState.players.forEach((player) => {
      player.clueCards.forEach((card) => map.set(card.id, card));
    });
    return map;
  }, [gameState.players]);

  const murderMeans = gameState.murderSelection
    ? allMeans.get(gameState.murderSelection.meansId)
    : undefined;
  const murderClue = gameState.murderSelection
    ? allClues.get(gameState.murderSelection.clueId)
    : undefined;

  const murderer = gameState.players.find((player) => player.role === "Murderer");
  const witness = gameState.players.find((player) => player.role === "Witness");
  const witnessTarget = gameState.witnessHuntTarget
    ? gameState.players.find((player) => player.userId === gameState.witnessHuntTarget)
    : undefined;
  const hasWitnessHunt = Boolean(gameState.witnessHuntTarget || gameState.witnessHuntResult);
  const primaryReturnAction = canReturnToLobby && onReturnToLobby ? onReturnToLobby : onExit;
  const primaryReturnLabel = canReturnToLobby ? "Quay về lobby" : "Về sảnh Deception";

  const sortedByTeam = [...gameState.players].sort((a, b) => {
    const score = (player: DeceptionPlayer) => {
      if (player.role === "Murderer" || player.role === "Accomplice") return 0;
      if (player.role === "Witness") return 1;
      if (player.role === "ForensicScientist") return 2;
      return 3;
    };
    return score(a) - score(b);
  });

  return (
    <div className="deception-room-bg deception-theme flex h-dvh flex-col overflow-hidden">
      <header className="deception-topbar">
        <div className="deception-brand">
          <span className="deception-logo-dot" />
          <span className="deception-brand-text">Game Over</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={primaryReturnAction}
            className="deception-icon-btn"
            title={canReturnToLobby ? "Quay về lobby" : "Thoát về sảnh"}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-auto p-4 sm:p-5">
        <section className="deception-card mx-auto w-full max-w-6xl rounded-2xl p-5 sm:p-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(255,45,85,0.15)] text-(--deception-red)">
            <Crown className="h-8 w-8" />
          </div>

          <h1 className="mt-4 text-center text-3xl font-black uppercase tracking-[0.14em] text-(--on-surface)">
            {winnerLabel(gameState)}
          </h1>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <article className="rounded-xl border border-(--deception-border) bg-[rgba(255,255,255,0.03)] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-(--deception-red-soft)">Lời giải thật</p>
              <p className="mt-2 text-sm text-(--on-surface)">
                Hung khí: <span className="font-bold">{murderMeans ? `${murderMeans.vietnamese} (${murderMeans.english})` : "N/A"}</span>
              </p>
              <p className="mt-1 text-sm text-(--on-surface)">
                Manh mối: <span className="font-bold">{murderClue ? `${murderClue.vietnamese} (${murderClue.english})` : "N/A"}</span>
              </p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-(--on-surface-variant)">
                Murderer: {murderer?.name || "Unknown"}
              </p>
            </article>

            <article className="rounded-xl border border-(--deception-border) bg-[rgba(255,255,255,0.03)] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-(--deception-cyan)">Witness Hunt</p>
              {hasWitnessHunt ? (
                <>
                  <p className="mt-2 text-sm text-(--on-surface)">
                    Mục tiêu bị săn: <span className="font-bold text-(--deception-red-soft)">{witnessTarget?.name || "Unknown"}</span>
                  </p>
                  <p className="mt-1 text-sm text-(--on-surface)">
                    Witness: <span className="font-bold">{witness?.name || "Không có"}</span>
                  </p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-(--on-surface-variant)">
                    {gameState.witnessHuntResult === "correct"
                      ? "Murderer đã tìm đúng witness."
                      : "Murderer chọn sai witness."}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-(--on-surface-variant)">
                  Không có giai đoạn witness hunt trong ván này.
                </p>
              )}
            </article>
          </div>

          <section className="mt-5 rounded-xl border border-(--deception-border) bg-[rgba(255,255,255,0.02)] p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-(--deception-cyan)">Role Reveal</p>
            {witnessTarget && (
              <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-(--deception-red-soft)">
                Mục tiêu bị truy sát: <span className="font-black">{witnessTarget.name}</span>
              </p>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {sortedByTeam.map((player) => {
                const isHuntedTarget = player.userId === gameState.witnessHuntTarget;
                return (
                <div
                  key={player.userId}
                  className={`relative rounded-md border p-2.5 ${isHuntedTarget
                    ? "border-(--deception-red) bg-[rgba(255,45,85,0.1)]"
                    : "border-(--deception-border) bg-[rgba(255,255,255,0.03)]"
                    }`}
                >
                  <p className={`truncate text-sm font-bold uppercase tracking-[0.08em] text-(--on-surface) ${isHuntedTarget ? "line-through decoration-2 decoration-(--deception-red-soft)" : ""}`}>
                    {player.name}
                    {player.userId === me?.userId ? " (Bạn)" : ""}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-(--deception-red-soft)">
                    {roleLabel(player.role)}
                  </p>
                  {isHuntedTarget && (
                    <>
                      <div className="pointer-events-none absolute inset-0 rounded-md bg-[linear-gradient(143deg,transparent_47%,rgba(255,45,85,0.72)_49%,rgba(255,45,85,0.72)_51%,transparent_53%)]" />
                      <span className="absolute right-1.5 top-1 rounded border border-(--deception-red-soft) bg-[rgba(255,45,85,0.2)] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-(--deception-red-soft)">
                        Hunted
                      </span>
                    </>
                  )}
                </div>
              );})}
            </div>
          </section>

          <section className="mt-5 rounded-xl border border-(--deception-border) bg-[rgba(255,255,255,0.02)] p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-(--deception-cyan)">Lịch sử phá án</p>
            {gameState.solvingAttempts.length === 0 ? (
              <p className="mt-2 text-sm text-(--on-surface-variant)">Chưa có lượt phá án nào được gửi.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {gameState.solvingAttempts.map((attempt) => {
                  const means = allMeans.get(attempt.selectedMeansId);
                  const clue = allClues.get(attempt.selectedClueId);
                  return (
                    <li key={attempt.id} className="rounded-md border border-(--deception-border) bg-[rgba(255,255,255,0.03)] p-2.5">
                      <p className="text-sm text-(--on-surface)">
                        <span className="font-bold uppercase tracking-[0.08em]">{attempt.investigatorName}</span>
                        {" "}tố cáo{" "}
                        <span className="font-bold uppercase tracking-[0.08em]">{attempt.accusedName}</span>
                      </p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-(--on-surface-variant)">
                        {means?.vietnamese || attempt.selectedMeansId} + {clue?.vietnamese || attempt.selectedClueId}
                      </p>
                      <p className={`mt-1 text-[11px] uppercase tracking-[0.14em] ${
                        attempt.result === "correct" ? "text-(--deception-cyan)" : "text-(--deception-red-soft)"
                      }`}>
                        {attempt.result === "correct" ? "Đúng" : "Sai"}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={primaryReturnAction}
              className="deception-btn-outline px-4 py-2 text-xs uppercase tracking-[0.16em]"
            >
              {primaryReturnLabel}
            </button>
            {canReturnToLobby && onReturnToLobby && (
              <button
                onClick={onReturnToLobby}
                className="deception-btn-red px-4 py-2 text-xs uppercase tracking-[0.16em]"
              >
                <span className="inline-flex items-center gap-1.5">
                  <RotateCcw className="h-4 w-4" />
                  Chơi lại (về lobby)
                </span>
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
