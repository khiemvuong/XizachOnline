"use client";
import { AvalonRoom, AvalonPlayer } from "@/server/game/AvalonTypes";
import { Socket } from "socket.io-client";
import { ShieldCheck, XCircle, Lock, Swords } from "lucide-react";

export default function CenterBoard({
  gameState,
  me,
  socket,
  isReadOnly = false,
}: {
  gameState: AvalonRoom;
  me: AvalonPlayer;
  socket: Socket | null;
  isReadOnly?: boolean;
}) {
  const isLeader =
    gameState.players[gameState.leaderIndex]?.userId === me.userId;
  const currentQ = gameState.questHistory[gameState.currentQuestIndex];
  const isTeamBuilding = gameState.state === "TEAM_BUILDING";
  const canSubmit =
    isTeamBuilding &&
    isLeader &&
    !isReadOnly &&
    !me.isSpectator &&
    gameState.proposedTeam.length === currentQ?.teamSize;
  const publicSkillAnnouncements =
    gameState.skillDecisionState?.publicAnnouncements ?? [];

  return (
    <div
      className="relative flex flex-col items-center justify-between w-full max-w-105 rounded-3xl avalon-glass z-10 p-5 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/5"
      style={{
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(6,20,35,0.95) 100%)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Table Texture Overlay */}
      <div className="absolute inset-0 rounded-3xl opacity-5 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_70%)] opacity-10"></div>
      </div>
      {/* Campaign Progress Header */}
      <div className="z-10 w-full flex flex-col items-center mb-2 md:mb-3">
        <h2 className="text-(--on-surface) font-headline text-sm md:text-lg tracking-[0.3em] uppercase opacity-90 drop-shadow-lg avalon-title-glow-primary">
          Campaign Progress
        </h2>
      </div>

      {/* Quests Row */}
      <div className="z-10 w-full flex justify-between items-start gap-2 md:gap-4 px-2">
        {gameState.questHistory.map((q: AvalonRoom["questHistory"][number], idx: number) => {
          const isCurrent = gameState.currentQuestIndex === idx;
          const questNumber = idx + 1;

          let cardContent;
          let cardStyles =
            "w-14 h-14 md:w-16 md:h-16 rounded-xl border flex flex-col items-center justify-center transition-all duration-500 shadow-lg";
          let labelContent = `${q.teamSize} Players`;

          if (q.status === "success") {
            cardStyles +=
              " bg-(--primary)/10 border-(--primary)/40 shadow-(--primary)/10";
            cardContent = (
              <ShieldCheck className="w-5 h-5 md:w-8 md:h-8 text-(--primary)" />
            );
          } else if (q.status === "fail") {
            cardStyles +=
              " bg-(--tertiary)/10 border-(--tertiary)/40 shadow-(--tertiary)/10";
            cardContent = (
              <XCircle className="w-5 h-5 md:w-8 md:h-8 text-(--tertiary)" />
            );
          } else if (isCurrent) {
            cardStyles +=
              " bg-(--surface-container-highest) border-white shadow-white/20 scale-110 z-20 ring-1 ring-white/50";
            cardContent = (
              <Swords className="w-5 h-5 md:w-8 md:h-8 text-white animate-pulse" />
            );
            labelContent = `MISSION ${questNumber}`;
          } else {
            cardStyles += " bg-slate-900/50 border-slate-800/80 opacity-40";
            cardContent = (
              <Lock className="w-4 h-4 md:w-6 md:h-6 text-slate-500" />
            );
          }

          return (
            <div key={idx} className="flex flex-col items-center gap-2 group">
              <div className={cardStyles}>{cardContent}</div>
              <span
                className={`text-[8px] md:text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${isCurrent ? "text-white" : "text-slate-500"}`}
              >
                {labelContent}
              </span>
            </div>
          );
        })}
      </div>

      {/* Middle - Action State */}
      <div className="z-10 w-full flex flex-col items-center justify-center my-3 md:my-4">
        {gameState.state === "TEAM_BUILDING" && (
          <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-700">
            <h3 className="text-[#e7bf6a] font-headline uppercase tracking-[0.2em] text-[10px] md:text-sm drop-shadow-md">
              Đề Cử Đội Hình
            </h3>
            <p className="text-[7px] md:text-[10px] font-medium text-slate-400 mt-0.5 uppercase tracking-widest italic opacity-80">
              {isLeader
                ? "Chọn kỵ sĩ đi thực thi nhiệm vụ"
                : `Chờ Thủ Lĩnh ${gameState.players[gameState.leaderIndex]?.name} chọn người`}
            </p>
            <div className="mt-1.5 px-3 py-0.5 rounded-full bg-yellow-900/20 text-[#e7bf6a] border border-[#e7bf6a]/30 text-[8px] font-bold tracking-widest">
              ĐÃ CHỌN {gameState.proposedTeam.length} / {currentQ?.teamSize}
            </div>
          </div>
        )}

        {gameState.state === "VOTING" && (
          <div className="flex flex-col items-center">
            <h3 className="text-[#e7bf6a] font-headline uppercase tracking-[0.2em] text-[10px] md:text-sm drop-shadow-md">
              Bỏ Phiếu Tín Nhiệm
            </h3>
            <p className="text-[7px] md:text-[10px] font-medium text-slate-400 mt-0.5 uppercase tracking-widest opacity-80">
              Tán thành đội hình được đề cử?
            </p>
          </div>
        )}

        {gameState.state === "SKILL_DECISION" && (
          <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h3 className="text-(--primary) font-headline uppercase tracking-[0.2em] text-[10px] md:text-sm drop-shadow-md">
              Quyết Định Kỹ Năng
            </h3>
            <p className="text-[7px] md:text-[10px] font-medium text-slate-400 mt-0.5 uppercase tracking-widest opacity-80 text-center">
              Người đi quest đang chọn dùng kỹ năng trước khi bỏ phiếu nhiệm vụ
            </p>
            {publicSkillAnnouncements.length > 0 && (
              <div className="mt-2 space-y-1 max-w-60">
                {publicSkillAnnouncements.slice(-2).map((line, idx) => (
                  <p
                    key={`${line}-${idx}`}
                    className="text-[8px] md:text-[10px] text-cyan-200/90 text-center border border-cyan-400/25 bg-cyan-500/10 rounded-lg px-2 py-1"
                  >
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {gameState.state === "QUEST_RESOLUTION" && (
          <div className="flex flex-col items-center animate-in fade-in duration-500">
            <h3 className="text-cyan-300 font-headline uppercase tracking-[0.2em] text-[10px] md:text-sm drop-shadow-md">
              Kết Toán Nhiệm Vụ
            </h3>
            <p className="text-[7px] md:text-[10px] font-medium text-slate-400 mt-0.5 uppercase tracking-widest opacity-80">
              Đang xử lý hiệu ứng đảo số phận
            </p>
          </div>
        )}

        {isTeamBuilding && isLeader && !isReadOnly && !me.isSpectator && (
          <button
            className="mt-3 px-6 py-2 text-[9px] md:text-[11px] uppercase tracking-[0.2em] font-black transition-all bg-primary-avalon text-surface-dim-avalon hover:scale-105 active:scale-95 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed rounded-lg shadow-xl"
            disabled={!canSubmit}
            onClick={() => socket?.emit("submitTeam")}
          >
            Chốt Đội Hình
          </button>
        )}
      </div>

      {/* Bottom - Vote Rejection Tracker */}
      <div className="z-10 w-full flex flex-col items-center">
        <span className="text-[8px] md:text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase mb-2 md:mb-3">
          Rejection Tracker
        </span>
        <div className="flex gap-3 md:gap-4 items-center justify-center">
          {[1, 2, 3, 4, 5].map((level, i) => {
            const isCurrentTracker = i < gameState.voteTrack;
            const isLast = level === 5;

            return (
              <div
                key={level}
                className={`w-3 h-3 md:w-3.5 md:h-3.5 rounded-full transition-all duration-700 ${isCurrentTracker
                    ? "bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] border-white scale-110"
                    : isLast
                      ? "border-2 border-(--tertiary)/40 bg-(--tertiary)/10"
                      : "bg-slate-700/50 border border-slate-600/50"
                  }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
