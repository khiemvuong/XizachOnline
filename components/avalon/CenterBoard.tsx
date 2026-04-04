"use client";
import { AvalonRoom, AvalonPlayer } from "@/server/game/AvalonTypes";
import { Socket } from "socket.io-client";
import { ShieldCheck, XCircle, Hourglass, Lock, X, History } from "lucide-react";

export default function CenterBoard({
  gameState,
  me,
  socket,
}: {
  gameState: AvalonRoom;
  me: AvalonPlayer;
  socket: Socket | null;
}) {
  const isLeader =
    gameState.players[gameState.leaderIndex]?.userId === me.userId;
  const currentQ = gameState.questHistory[gameState.currentQuestIndex];
  const isTeamBuilding = gameState.state === "TEAM_BUILDING";
  const canSubmit =
    isTeamBuilding &&
    isLeader &&
    gameState.proposedTeam.length === currentQ?.teamSize;

  return (
    <div
      className="absolute top-[50%] left-[50%] w-[320px] h-[320px] rounded-full flex flex-col items-center justify-center avalon-glass z-10 p-4 shadow-[0_0_60px_rgba(13,27,42,0.6)] border border-white/5 transform -translate-x-1/2 -translate-y-1/2"
      style={{ background: "radial-gradient(circle at center, rgba(15,23,42,0.8) 0%, rgba(6,20,35,0.95) 100%)", backdropFilter: "blur(12px)" }}
    >
      {/* Table Texture */}
      <div
         className="absolute inset-4 rounded-full border border-(--primary)/10 opacity-30 bg-cover bg-center pointer-events-none"
         style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAawRrPg0ptH4zWo0_du2WeBROc-guL2ldGmCgKvj91xt8gfLV-R7Z9m1qgTd_zANIpSJBuqOKDjvWdbfbtXMMAv2-JASHOtd0Gv1BLjjuSU2gFn52jCqQhfH4ASAkA_JvPRkg-wRe1qoX_oRrRv1g9i-WAnfw7FIJSv3h3gAm50a6S1cqLcv3NBi-BUpAFIQL13Qfe-koMKYha2RIm6_rOM7jPwO2h_67IfmXHZ8sh-r6UBEgz0nZqYlfpRNUKzdKe8KiBNaoI7g')" }}
      ></div>
      {/* Top - Missions Board */}
      <div className="absolute top-10 flex gap-2 items-center z-10">
        {gameState.questHistory.map((q: any, idx: number) => {
           const isCurrent = gameState.currentQuestIndex === idx;
           
           if (q.status === 'success') {
              return (
                 <div key={idx} className="w-12 h-12 rounded-lg bg-(--primary-container) border border-(--primary)/40 flex items-center justify-center shadow-[inset_0_0_10px_rgba(131,195,163,0.3)] relative">
                    <ShieldCheck className="w-6 h-6 text-(--primary)" />
                 </div>
              )
           } else if (q.status === 'fail') {
              return (
                 <div key={idx} className="w-12 h-12 rounded-lg bg-(--tertiary-container) border border-(--tertiary)/40 flex items-center justify-center shadow-[inset_0_0_10px_rgba(228,105,98,0.3)] relative">
                    <XCircle className="w-6 h-6 text-(--tertiary)" />
                 </div>
              )
           } else if (isCurrent) {
              return (
                 <div key={idx} className="w-14 h-14 rounded-lg bg-(--surface-container-highest) border-2 border-(--primary) flex flex-col items-center justify-center animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_15px_rgba(131,195,163,0.5)] relative">
                    <span className="text-[12px] font-bold text-(--primary)">{q.teamSize}</span>
                    <span className="text-[8px] text-(--on-surface-variant) font-bold tracking-tighter">NGƯỜI</span>
                 </div>
              )
           } else {
              return (
                 <div key={idx} className="w-12 h-12 rounded-lg bg-(--surface-container) border border-(--outline-variant) flex items-center justify-center opacity-60 relative">
                    <span className="text-[12px] text-(--on-surface-variant) font-bold">{q.teamSize}</span>
                 </div>
              )
           }
        })}
      </div>

      {/* Middle - Action State */}
      <div className="text-center mt-6 flex flex-col items-center justify-center z-10 w-full px-4">
        {gameState.state === "TEAM_BUILDING" && (
          <>
            <h3 className="text-primary-avalon font-serif uppercase tracking-[0.15em] text-xl drop-shadow-md">
              Đề Cử
            </h3>
            <p className="text-xs font-sans mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
              {isLeader ? "Chọn kỵ sĩ đi làm nhiệm vụ" : "Chờ Thủ Lĩnh chọn người"}
            </p>
            <div className="text-[10px] uppercase mt-2 font-bold tracking-widest px-3 py-1 rounded-full bg-yellow-900/30 text-[#e7bf6a] border border-[#e7bf6a]/30">
              Chọn {gameState.proposedTeam.length} / {currentQ?.teamSize}
            </div>
          </>
        )}
        {gameState.state === "VOTING" && (
          <>
            <h3 className="text-[#e7bf6a] font-serif uppercase tracking-[0.15em] text-xl drop-shadow-md">
              Bỏ Phiếu
            </h3>
            <p className="text-xs font-sans mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
              Tán thành đội hình này?
            </p>
          </>
        )}
        {gameState.state === "QUEST" && (
          <>
            <h3 className="text-[#83c3a3] font-serif uppercase tracking-[0.15em] text-xl drop-shadow-md">
              Nhiệm Vụ
            </h3>
            <p className="text-xs font-sans mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
              {gameState.proposedTeam.includes(me.userId) ? "Nhập kết quả nhiệm vụ" : "Chờ đội thực thi"}
            </p>
          </>
        )}

        {isTeamBuilding && isLeader && (
          <button
            className="mt-3 px-6 py-2 text-[10px] uppercase tracking-widest font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-90 rounded-sm"
            style={{ backgroundColor: "var(--primary)", color: "#061423" }}
            disabled={!canSubmit}
            onClick={() => socket?.emit("submitTeam")}
          >
            Chốt Đội Hình
          </button>
        )}
      </div>

      {/* Bottom - Vote Rejection Tracker */}
      {(gameState.state === "TEAM_BUILDING" || gameState.state === "VOTING") && (
        <div className="absolute bottom-8 w-full flex flex-col items-center z-10">
          <span className="text-[8px] font-bold tracking-widest text-(--secondary)/60 uppercase mb-2">Rejection Tracker</span>
          <div className="flex gap-2 items-center justify-center">
            {[1, 2, 3, 4, 5].map((level, i) => {
              if (i < gameState.voteTrack) {
                return (
                  <div key={level} className="w-4 h-4 rounded-full bg-(--tertiary)/20 border-2 border-(--tertiary) flex items-center justify-center shadow-[0_0_10px_rgba(228,105,98,0.5)]">
                     <div className="w-1.5 h-1.5 rounded-full bg-(--tertiary)"></div>
                  </div>
                );
              } else if (level === 5) {
                return (
                  <div key={level} className="w-6 h-6 -mt-1 rounded-full border-2 border-(--tertiary)/40 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-(--tertiary)/20"></div>
                  </div>
                );
              } else {
                 return (
                   <div key={level} className="w-4 h-4 rounded-full bg-(--primary)/10 border border-(--primary)/30"></div>
                 );
              }
            })}
          </div>
        </div>
      )}
    </div>
  );
}
