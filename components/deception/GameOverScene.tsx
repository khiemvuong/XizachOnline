"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, RotateCcw, History, X, CheckCircle2, XCircle } from "lucide-react";
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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
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
            onClick={() => setIsHistoryOpen(true)}
            className="deception-icon-btn text-(--deception-cyan)"
            title="Xem lịch sử phá án"
          >
            <History className="h-4 w-4" />
          </button>
          <div className="h-4 w-px bg-(--deception-border) mx-1" />
          <button
            onClick={primaryReturnAction}
            className="deception-icon-btn"
            title={canReturnToLobby ? "Quay về lobby" : "Thoát về sảnh"}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-auto p-2 sm:p-5 landscape:p-1 sm:landscape:p-4">
        <section className="deception-card mx-auto w-full max-w-7xl rounded-2xl p-3 sm:p-6 landscape:p-2 sm:landscape:p-5 flex flex-col min-h-0 landscape:scale-[0.99] landscape:max-w-full origin-top">
          <div className="flex flex-col items-center">
            <div className={`text-[9px] sm:text-xs font-black uppercase tracking-[0.4em] mb-0.5 sm:mb-2 ${
              gameState.winner === "Investigator" ? "text-(--deception-cyan)" : "text-(--deception-red)"
            }`}>
              {gameState.winner === "Investigator" ? "Mission Accomplished" : "Case Closed: Failed"}
            </div>
            <h1 className={`text-xl sm:text-5xl font-black uppercase tracking-tighter sm:tracking-widest text-center drop-shadow-2xl bg-linear-to-b bg-clip-text text-transparent py-1 sm:py-2 leading-relaxed ${
              gameState.winner === "Investigator" 
                ? "from-(--deception-cyan) to-blue-500" 
                : "from-(--deception-red) to-orange-600"
            } landscape:text-lg sm:landscape:text-4xl`}>
              {winnerLabel(gameState)}
            </h1>
          </div>

          <div className="mt-4 sm:mt-5 grid gap-2 sm:gap-4 grid-cols-1 landscape:grid-cols-2 sm:grid-cols-2 lg:grid-cols-2">
            <article className="rounded-xl border border-(--deception-border) bg-[rgba(255,255,255,0.04)] p-3 sm:p-4 backdrop-blur-sm transition-all hover:bg-[rgba(255,255,255,0.06)]">
              <p className="text-[10px] uppercase tracking-[0.2em] text-(--deception-red-soft) font-bold">Lời giải thật</p>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-(--on-surface)">
                  Hung khí: <span className="font-bold text-(--deception-red-soft)">{murderMeans ? `${murderMeans.vietnamese}` : "N/A"}</span>
                  <span className="ml-1 opacity-50 text-[10px]">{murderMeans?.english}</span>
                </p>
                <p className="text-sm text-(--on-surface)">
                  Manh mối: <span className="font-bold text-(--deception-red-soft)">{murderClue ? `${murderClue.vietnamese}` : "N/A"}</span>
                  <span className="ml-1 opacity-50 text-[10px]">{murderClue?.english}</span>
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.14em] text-(--on-surface-variant)">
                  Hung Thủ: <span className="text-(--on-surface) font-bold">{murderer?.name || "Unknown"}</span>
                </p>
              </div>
            </article>

            <article className="rounded-xl border border-(--deception-border) bg-[rgba(255,255,255,0.04)] p-3 sm:p-4 backdrop-blur-sm transition-all hover:bg-[rgba(255,255,255,0.06)]">
              <p className="text-[10px] uppercase tracking-[0.2em] text-(--deception-cyan) font-bold">Truy sát Nhân chứng</p>
              {hasWitnessHunt ? (
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-(--on-surface)">
                    Mục tiêu: <span className="font-bold text-(--deception-red-soft)">{witnessTarget?.name || "Unknown"}</span>
                  </p>
                  <p className="text-sm text-(--on-surface)">
                    Nhân chứng: <span className="font-bold">{witness?.name || "N/A"}</span>
                  </p>
                  <div className="mt-3 pt-2 border-t border-white/5">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${
                      gameState.witnessHuntResult === "correct" ? "text-(--deception-red-soft)" : "text-(--deception-cyan)"
                    }`}>
                      {gameState.witnessHuntResult === "correct"
                        ? "Sát nhân đã thắng nhờ săn được witness"
                        : "Sát nhân thất bại trong việc săn witness"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex items-center justify-center h-full min-h-[60px]">
                  <p className="text-xs italic text-(--on-surface-variant) opacity-60">
                    Không có giai đoạn truy sát
                  </p>
                </div>
              )}
            </article>
          </div>

          <section className="mt-3 sm:mt-5 rounded-xl border border-(--deception-border) bg-[rgba(255,255,255,0.02)] p-2 sm:p-4 min-h-0 flex flex-col">
            <p className="text-[9px] uppercase tracking-[0.2em] text-(--deception-cyan) font-bold">Danh sách nhân vật</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 landscape:grid-cols-4 sm:landscape:grid-cols-5 md:landscape:grid-cols-6 lg:landscape:grid-cols-8">
              {sortedByTeam.map((player) => {
                const isMurderer = player.role === "Murderer";
                const isAccomplice = player.role === "Accomplice";
                const isWitness = player.role === "Witness";
                const isForensic = player.role === "ForensicScientist";
                const isHuntedTarget = player.userId === gameState.witnessHuntTarget;
                
                let roleColorClass = "border-(--deception-border) bg-white/5";
                if (isMurderer) roleColorClass = "border-(--deception-red) bg-red-950/30 shadow-[inset_0_0_15px_rgba(255,45,85,0.1)]";
                if (isAccomplice) roleColorClass = "border-(--deception-red)/50 bg-red-950/10";
                if (isWitness) roleColorClass = "border-(--deception-cyan)/60 bg-cyan-950/10";
                if (isForensic) roleColorClass = "border-purple-500/50 bg-purple-950/10";

                return (
                <div
                  key={player.userId}
                  className={`relative rounded-lg border p-2 sm:p-3 transition-all ${roleColorClass} ${
                    isHuntedTarget ? "ring-2 ring-(--deception-red) ring-offset-2 ring-offset-black" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <p className={`truncate text-[10px] sm:text-sm font-bold uppercase tracking-wider text-(--on-surface) ${isHuntedTarget ? "line-through opacity-70" : ""}`}>
                      {player.name}
                      {player.userId === me?.userId ? " (Bạn)" : ""}
                    </p>
                    {isMurderer && <span className="text-[10px]">🔪</span>}
                    {isForensic && <span className="text-[10px]">🔬</span>}
                  </div>
                  <p className={`mt-0.5 sm:mt-1 text-[9px] sm:text-[10px] uppercase tracking-widest font-black ${
                    (isMurderer || isAccomplice) ? "text-(--deception-red-soft)" : 
                    isForensic ? "text-purple-400" : "text-(--deception-cyan)"
                  }`}>
                    {roleLabel(player.role)}
                  </p>
                  
                  {isHuntedTarget && (
                    <div className="absolute -right-1.5 -top-1.5 z-10">
                       <span className="flex h-6 w-6 items-center justify-center rounded-full bg-(--deception-red) text-white text-[12px] shadow-[0_0_15px_rgba(255,45,85,0.5)] animate-pulse border-2 border-white/20">
                          ☠️
                       </span>
                    </div>
                  )}
                </div>
              );})}
            </div>
          </section>

          {/* Bottom Actions */}
          <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-3">
            {canReturnToLobby && onReturnToLobby && (
              <button
                onClick={onReturnToLobby}
                className="deception-btn-red px-6 py-2.5 text-xs font-black uppercase tracking-[0.16em] rounded-xl shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                <span className="inline-flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  CHƠI LẠI
                </span>
              </button>
            )}
          </div>
        </section>
      </main>

      {/* History Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-(--deception-surface) border border-(--deception-border) rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
            <header className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/3">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-(--deception-cyan)" />
                <h2 className="text-sm font-black uppercase tracking-widest text-(--on-surface)">Lịch Sử Phá Án</h2>
              </div>
              <button 
                onClick={() => setIsHistoryOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-(--on-surface-variant) transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 overflow-auto p-5 custom-scrollbar">
              {gameState.solvingAttempts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 opacity-40">
                  <History className="h-12 w-12 mb-3" />
                  <p className="text-sm italic">Chưa có lượt phá án nào được gửi.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {gameState.solvingAttempts.map((attempt) => {
                    const means = allMeans.get(attempt.selectedMeansId);
                    const clue = allClues.get(attempt.selectedClueId);
                    const isCorrect = attempt.result === "correct";
                    
                    return (
                      <div key={attempt.id} className={`group relative rounded-xl border p-4 transition-all ${
                        isCorrect ? "bg-cyan-500/5 border-cyan-500/20" : "bg-white/2 border-white/5"
                      }`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black uppercase tracking-wider text-(--on-surface)">
                                {attempt.investigatorName}
                              </span>
                              <span className="text-[10px] text-(--on-surface-variant) uppercase">Buộc tội</span>
                              <span className="text-xs font-black uppercase tracking-wider text-(--deception-red-soft)">
                                {attempt.accusedName}
                              </span>
                            </div>
                            
                            <div className="mt-3 grid grid-cols-2 gap-3">
                              <div className="space-y-0.5">
                                <p className="text-[9px] uppercase tracking-widest text-(--on-surface-variant) opacity-50">Hung khí</p>
                                <p className="text-xs font-bold text-(--on-surface)">{means?.vietnamese || attempt.selectedMeansId}</p>
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-[9px] uppercase tracking-widest text-(--on-surface-variant) opacity-50">Manh mối</p>
                                <p className="text-xs font-bold text-(--on-surface)">{clue?.vietnamese || attempt.selectedClueId}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="shrink-0 flex flex-col items-center gap-1">
                            {isCorrect ? (
                              <>
                                <CheckCircle2 className="h-5 w-5 text-(--deception-cyan)" />
                                <span className="text-[10px] font-black text-(--deception-cyan) uppercase">ĐÚNG</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-5 w-5 text-(--deception-red-soft)" />
                                <span className="text-[10px] font-black text-(--deception-red-soft) uppercase">SAI</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-current opacity-10" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <footer className="px-5 py-4 bg-white/5 border-t border-white/5 flex justify-end">
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="px-6 py-2 bg-(--deception-cyan) hover:bg-(--deception-cyan)/80 text-black text-xs font-black uppercase tracking-widest rounded-lg transition-all shadow-lg"
              >
                Đóng
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
