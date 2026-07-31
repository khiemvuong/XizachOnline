"use client";

import Image from "next/image";
import type { GlitcherClientState, GlitcherPublicPlayer } from "@/server/game/GlitcherTypes";
import { GLITCHER_ASSETS } from "@/utils/glitcherAssets";
import PlayerTile from "../PlayerTile";
import ResultSceneFrame from "../ResultSceneFrame";
import type { EmitGlitcherAction } from "../gameTypes";

export default function RevealScreen({
  gameState,
  me,
  emitAction,
  onExit,
}: {
  gameState: GlitcherClientState;
  me?: GlitcherPublicPlayer;
  emitAction: EmitGlitcherAction;
  onExit: () => void;
}) {
  const reveal = gameState.latestReveal;
  const glitchPlayer = gameState.players.find((player) => player.userId === reveal?.glitchUserId);

  let outcomeTitle = "KẾT QUẢ VÁN ĐẤU";
  let outcomeBorder = "border-sky-400";
  let outcomeText = "text-sky-400";
  let outcomeDesc = "";

  if (reveal?.outcome === "GLITCH_WIN") {
    outcomeTitle = "🔴 GLITCH THẮNG!";
    outcomeBorder = "border-red-500";
    outcomeText = "text-red-500";
    outcomeDesc = "Kẻ giả mạo (Glitch) đã ẩn nấp thành công và chiến thắng!";
  } else if (reveal?.outcome === "NORMAL_WIN") {
    outcomeTitle = "🟢 DÂN THẮNG!";
    outcomeBorder = "border-emerald-500";
    outcomeText = "text-emerald-500";
    outcomeDesc = "Nhóm người chơi bình thường đã tìm ra chính xác Glitch!";
  } else if (reveal?.outcome === "TIE") {
    outcomeTitle = "🟡 HÒA TRẬN!";
    outcomeBorder = "border-amber-500";
    outcomeText = "text-amber-500";
    outcomeDesc = "Số phiếu TOP bằng nhau và có chứa Glitch!";
  }

  return (
    <ResultSceneFrame
      eyebrow="Kết quả giải mã"
      title="Kết Quả Ván Đấu"
      onExit={onExit}
    >
      {reveal ? (
        <main className="grid grid-cols-12 gap-6 p-4 md:p-6 w-full h-full max-w-7xl mx-auto text-slate-200">
          
          {/* CỘT TRÁI: Kết quả & Lượt Vote */}
          <div className="col-span-4 flex flex-col gap-6">
            
            {/* Outcome Banner */}
            <div className={`bg-slate-900/90 border-2 ${outcomeBorder} rounded-2xl p-6 text-center shadow-lg`}>
              <h1 className={`text-2xl md:text-3xl font-black ${outcomeText} mb-2 tracking-wide`}>
                {outcomeTitle}
              </h1>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                {outcomeDesc}
              </p>
            </div>

            {/* Chi tiết lượt bầu chọn */}
            <div className="bg-slate-900/70 border border-slate-700/50 rounded-2xl p-5 flex flex-col flex-1 h-full max-h-[500px]">
              <div className="mb-4 border-b border-slate-700/50 pb-3">
                <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase block mb-1">
                  Chi tiết lượt bầu chọn
                </span>
                <h2 className="text-lg font-bold text-white">Kết quả bỏ phiếu</h2>
              </div>
              
              <ul className="space-y-2 overflow-y-auto pr-2" style={{ scrollbarWidth: "thin", scrollbarColor: "#475569 transparent" }}>
                {reveal.votes.map((vote) => (
                  <li 
                    key={vote.voterUserId} 
                    className="flex items-center justify-between bg-slate-800/40 hover:bg-slate-800/60 transition-colors p-3 rounded-lg text-sm border border-slate-700/30"
                  >
                    <span className="truncate max-w-[40%] font-medium text-slate-300">{vote.voterName}</span>
                    <i className="text-slate-600 px-2 not-italic text-lg">→</i>
                    <strong className={`truncate max-w-[50%] ${vote.targetUserId === reveal.glitchUserId ? "text-red-400 drop-shadow-[0_0_2px_rgba(248,113,113,0.8)]" : "text-slate-100"}`}>
                      {vote.targetName ?? "Không có phiếu"}
                    </strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CỘT PHẢI: Thông tin hiện trường & Lộ diện Glitch */}
          <div className="col-span-8 flex flex-col gap-6">
            
            {/* Scenes */}
            <section className="grid grid-cols-2 gap-4">
              <article className="bg-slate-900/80 border border-slate-700 border-l-4 border-l-emerald-500 rounded-xl p-5 shadow-md">
                <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase mb-2 block">
                  Hiện trường thật (Dân)
                </span>
                <h2 className="text-xl font-bold text-white mb-2 leading-tight">{reveal.trueScene.title}</h2>
                <p className="text-slate-400 text-sm leading-relaxed">{reveal.trueScene.description}</p>
              </article>
              
              <article className="bg-slate-900/80 border border-slate-700 border-l-4 border-l-red-500 rounded-xl p-5 shadow-md">
                <span className="text-xs font-bold text-red-400 tracking-widest uppercase mb-2 block">
                  Hiện trường mồi (Glitch)
                </span>
                <h2 className="text-xl font-bold text-white mb-2 leading-tight">{reveal.glitchScene.title}</h2>
                <p className="text-slate-400 text-sm leading-relaxed">{reveal.glitchScene.description}</p>
              </article>
            </section>

            {/* Glitcher Reveal Identity */}
            <section 
              className="relative bg-[#0a0f18] border border-red-900/40 rounded-2xl p-8 flex flex-col items-center justify-center overflow-hidden flex-1 shadow-inner"
              aria-labelledby="glitcher-revealed-player"
            >
              {/* Background Decoration */}
              <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                <Image
                  src={GLITCHER_ASSETS.raster.roseDataCore}
                  alt=""
                  aria-hidden="true"
                  width={600}
                  height={600}
                  className="object-contain w-full h-full mix-blend-screen"
                />
              </div>
              
              <div className="relative z-10 text-center flex flex-col items-center">
                <span className="text-slate-400 tracking-[0.2em] text-sm uppercase mb-2 block">
                  Danh tính thật sự
                </span>
                <h2 
                  id="glitcher-revealed-player" 
                  className="text-4xl md:text-5xl font-black text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)] tracking-wide"
                >
                  {reveal.glitchPlayerName}
                </h2>
                
                {glitchPlayer && (
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-red-900/50 backdrop-blur-sm min-w-[250px]">
                    <PlayerTile player={glitchPlayer} layout="ranking" tone="glitch">
                      <span className="text-red-400 font-medium text-sm">Vai Glitch</span>
                    </PlayerTile>
                  </div>
                )}
              </div>
            </section>

            {/* Actions */}
            <footer className="flex flex-wrap gap-4 justify-end mt-2">
              {me?.isHost ? (
                <>
                  <button
                    type="button"
                    onClick={() => emitAction("returnToLobby")}
                    className="px-6 py-2.5 rounded-lg font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-all border border-slate-600"
                  >
                    Về Lobby
                  </button>
                  <button
                    type="button"
                    onClick={() => emitAction("startTour")}
                    className="px-6 py-2.5 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  >
                    Chơi ván mới
                  </button>
                </>
              ) : (
                <div className="w-full text-center lg:text-right py-3">
                  <p className="text-slate-400 italic text-sm animate-pulse">
                    Đang chờ chủ phòng chọn ván tiếp theo hoặc về lobby…
                  </p>
                </div>
              )}
            </footer>
          </div>
        </main>
      ) : (
        <div className="flex items-center justify-center w-full h-64 text-slate-400 animate-pulse" role="status">
          Đang tổng hợp phiếu bầu…
        </div>
      )}
    </ResultSceneFrame>
  );
}