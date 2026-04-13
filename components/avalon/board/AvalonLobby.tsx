import { useState } from "react";
import { type AvalonRoom, type AvalonPlayer } from "@/server/game/AvalonTypes";
import { type Socket } from "socket.io-client";
import { Copy, Hourglass, ChevronsRight, Plus, Settings, Wand2, Eye, Flame, VenetianMask, CloudFog, Swords, Gavel, Camera, Shield, CheckCircle2, Sparkles } from "lucide-react";
import PingIndicator from "./PingIndicator";
import { type LucideIcon } from "lucide-react";

function RoleCard({ label, icon: Icon, isOn, onToggle, disabled, type, tag }: { label: string, icon: LucideIcon, isOn: boolean, onToggle: () => void, disabled: boolean, type: "good" | "evil", tag?: string }) {
  const isGood = type === "good";
  const colorVar = isGood ? "var(--primary)" : "var(--tertiary)";
  const baseBg = isOn ? (isGood ? "bg-(--primary)/10" : "bg-(--tertiary)/10") : "bg-[#0f172a]/50";
  const borderColor = isOn ? (isGood ? "border-(--primary)/50" : "border-(--tertiary)/50") : "border-(--outline-variant)/20";

  return (
    <div 
      onClick={() => !disabled && onToggle()}
      className={`p-3 rounded-xl border ${borderColor} ${baseBg} flex flex-col items-center gap-2 transition-all ${disabled ? (isOn ? "opacity-80" : "opacity-50 cursor-not-allowed") : "cursor-pointer hover:border-(--primary)/50 hover:bg-[#1e293b]"}`}
    >
      <Icon className="w-6 h-6" style={{ color: isOn ? colorVar : "var(--on-surface-variant)" }} />
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-center" style={{ color: isOn ? colorVar : "var(--on-surface-variant)" }}>{label}</span>
        {tag && <span className="text-[8px] bg-(--primary)/20 text-(--primary) px-1.5 py-0.5 rounded uppercase tracking-tighter mt-1 font-bold">{tag}</span>}
      </div>
      <div className="w-8 h-1 rounded-full bg-slate-700 relative overflow-hidden mt-1">
        {isOn && <div className="absolute inset-0 rounded-full" style={{ backgroundColor: colorVar }}></div>}
      </div>
    </div>
  );
}

export default function AvalonLobby({ 
  gameState, 
  me, 
  socket, 
  roomId, 
  playerPings, 
  setPlayerPings 
}: { 
  gameState: AvalonRoom, 
  me?: AvalonPlayer, 
  socket: Socket | null, 
  roomId: string, 
  playerPings: Record<string, number>, 
  setPlayerPings: React.Dispatch<React.SetStateAction<Record<string, number>>> 
}) {
  const isHost = me?.isHost;
  const connectedCount = gameState.players.filter(p => p.status === "connected" && !p.isSpectator).length;

  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [reorderMode, setReorderMode] = useState(false);

  const handleToggleSetting = (key: keyof typeof gameState.settings) => {
    if (!isHost || !socket) return;
    
    const newSettings = {
       ...gameState.settings,
       [key]: !gameState.settings[key]
    };
    
    // Automatically toggle Athena with advanced mode
    if (key === "advancedMode") {
      newSettings.athena = newSettings.advancedMode;
    }

    socket.emit("updateSettings", newSettings);
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
  };

  const handleDragStart = (idx: number) => {
    if (!isHost) return;
    setDragIdx(idx);
  };
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setOverIdx(idx);
  };
  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setOverIdx(null); return; }
    const ordered = [...gameState.players];
    const [moved] = ordered.splice(dragIdx, 1);
    ordered.splice(idx, 0, moved);
    socket?.emit("reorderPlayers", ordered.map(p => p.userId));
    setDragIdx(null);
    setOverIdx(null);
  };
  const handleDragEnd = () => { setDragIdx(null); setOverIdx(null); };

  const handleMovePlayer = (idx: number, direction: "up" | "down") => {
    if (!isHost || !socket) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= gameState.players.length) return;
    const ordered = [...gameState.players];
    [ordered[idx], ordered[targetIdx]] = [ordered[targetIdx], ordered[idx]];
    socket.emit("reorderPlayers", ordered.map(p => p.userId));
  };

  const handleTransferHost = (targetUserId: string) => {
    if (!isHost || !socket || targetUserId === me?.userId) return;
    socket.emit("transferHost", targetUserId);
  };

  return (
    <div className="flex-1 mt-14 px-2 md:px-4 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 w-full z-10">
      
      <div className="md:col-span-12 lg:col-span-7 space-y-6 flex flex-col h-full">
        <div className="avalon-glass p-6 rounded-xl border border-(--outline-variant)/30 flex justify-between items-center relative overflow-hidden group shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div className="absolute inset-0 bg-linear-to-r from-(--primary)/5 to-transparent pointer-events-none"></div>
          <div>
            <h2 className="text-(--secondary) font-headline text-sm tracking-[0.2em] uppercase mb-1">Mã Hội Yến</h2>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-headline font-bold text-(--primary) tracking-tighter uppercase avalon-title-glow-primary">#{roomId.substring(0,6)}</span>
              <button onClick={copyRoomId} className="p-2 hover:bg-white/10 rounded-full transition-colors text-(--primary)/60 cursor-pointer" title="Sao chép Mã phòng">
                <Copy className="w-5 h-5" />
              </button>
              <div className="ml-2 scale-110 origin-left">
                <PingIndicator socket={socket} userId={me?.userId} setPlayerPings={setPlayerPings} />
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="block text-[10px] text-(--secondary)/60 uppercase tracking-widest mb-1">Sĩ Số Tham Gia</span>
            <span className="text-3xl font-headline text-(--on-surface)">
              {connectedCount < 10 ? `0${connectedCount}` : connectedCount}
              <span className="text-(--primary)/30 text-xl font-body">/10</span>
            </span>
          </div>
        </div>

        <div className="space-y-3 flex-1 flex flex-col">
          <div className="flex justify-between items-center px-2">
            <h3 className="font-headline text-lg text-(--primary) tracking-wide avalon-title-glow-primary">Bàn Tròn Kỵ Sĩ</h3>
            {isHost ? (
              <button
                onClick={() => setReorderMode(m => !m)}
                className={`text-[10px] uppercase tracking-widest flex items-center gap-1 px-3 py-1 rounded-full border transition-all cursor-pointer ${
                  reorderMode
                    ? "border-(--tertiary)/50 bg-(--tertiary)/10 text-(--tertiary)"
                    : "border-(--primary)/20 bg-surface-container-low/40 hover:border-(--primary)/40"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>
                {reorderMode ? "Xong" : "Sắp xếp"}
              </button>
            ) : (
              <span className="text-[10px] text-(--primary)/40 uppercase tracking-widest flex items-center gap-1">
                <Hourglass className="w-3 h-3 animate-pulse" /> Đang chờ...
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-2 overflow-y-auto pr-1">
            {gameState.players.map((player, idx) => (
               <div
                 key={player.userId}
                 draggable={!!isHost && !reorderMode}
                 onDragStart={() => handleDragStart(idx)}
                 onDragOver={(e) => handleDragOver(e, idx)}
                 onDrop={() => handleDrop(idx)}
                 onDragEnd={handleDragEnd}
                 className={`flex items-center justify-between p-4 bg-[#0f172a]/80 border rounded-lg group hover:bg-[#1e293b] transition-all shadow-sm ${
                   isHost && !reorderMode ? "cursor-grab active:cursor-grabbing" : ""
                 } ${dragIdx === idx ? "opacity-40 scale-95" : ""} ${overIdx === idx && dragIdx !== idx ? "border-(--primary)/60 bg-(--primary)/5" : "border-(--outline-variant)/20"}`}
               >
                 <div className="flex items-center gap-3">
                   {isHost && reorderMode && (
                     <div className="flex flex-col gap-0.5 shrink-0">
                       <button
                         onClick={(e) => { e.stopPropagation(); handleMovePlayer(idx, "up"); }}
                         disabled={idx === 0}
                         className="p-0.5 rounded text-(--primary)/40 hover:text-(--primary) hover:bg-(--primary)/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                       >
                         <ChevronsRight className="w-4 h-4 -rotate-90" />
                       </button>
                       <button
                         onClick={(e) => { e.stopPropagation(); handleMovePlayer(idx, "down"); }}
                         disabled={idx === gameState.players.length - 1}
                         className="p-0.5 rounded text-(--primary)/40 hover:text-(--primary) hover:bg-(--primary)/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                       >
                         <ChevronsRight className="w-4 h-4 rotate-90" />
                       </button>
                     </div>
                   )}
                   {isHost && !reorderMode && (
                     <div className="text-(--on-surface-variant)/30 hover:text-(--on-surface-variant)/60 transition-colors shrink-0 hidden md:block">
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                     </div>
                   )}
                   <div className={`w-6 text-center text-[11px] font-bold shrink-0 ${reorderMode ? "text-(--primary)/60" : "text-(--on-surface-variant)/30"}`}>
                     {idx + 1}
                   </div>
                   <div className={`w-2 h-8 rounded-full ${player.status === "connected" ? (player.isHost ? "bg-(--tertiary)" : "bg-(--primary)") : "bg-gray-600"}`}></div>
                   <div className="w-10 h-10 rounded-full bg-(--primary-container)/10 border border-(--primary)/30 flex items-center justify-center text-(--primary) font-bold">
                     {player.name.charAt(0).toUpperCase()}
                   </div>
                   <div>
                     <p className={`text-(--on-surface) font-bold text-sm tracking-wide flex items-center gap-1.5 ${player.status === "disconnected" ? "text-gray-500 line-through" : ""}`}>
                       {player.name} {player.userId === me?.userId && "(Bạn)"}
                       {playerPings[player.userId] !== undefined && (
                         <span className={`text-[10px] font-black font-mono tracking-tighter ${playerPings[player.userId] < 150 ? "text-emerald-400" : playerPings[player.userId] < 350 ? "text-amber-400" : "text-red-500"}`}>
                           {Math.min(999, playerPings[player.userId])}ms
                         </span>
                       )}
                     </p>
                      <p className={`text-[10px] uppercase font-bold ${
                          player.isHost ? "text-(--tertiary)/80"
                          : player.isSpectator ? "text-amber-400/80"
                          : "text-(--primary)/60"
                        }`}>
                        {player.isHost ? "Host" : player.isSpectator ? "Góc Nhìn Khán Giả" : (player.status === "connected" ? "Sẵn Sàng" : "Mất Kết Nối")}
                      </p>
                   </div>
                 </div>
                  <div className="flex items-center gap-2">
                    {!player.isHost && (
                      player.userId === me?.userId ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); socket?.emit("toggleSpectatorLobby"); }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer shadow-md ${
                            player.isSpectator
                              ? "text-amber-400 bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                              : "bg-surface-container-low/50 border-(--primary)/40 text-(--primary)/90 bg-(--primary)/10 hover:shadow-[0_0_15px_rgba(131,195,163,0.2)]"
                          }`}
                          title={player.isSpectator ? "Đang bật Góc Nhìn Khán Giả — bấm để trở lại thành Người Chơi" : "Bấm để chuyển sang Góc Nhìn Khán Giả"}
                        >
                          <Camera className="w-4 h-4" />
                          <span className="hidden sm:inline">{player.isSpectator ? "Đang Xem" : "Làm Khán Giả"}</span>
                        </button>
                      ) : player.isSpectator ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-amber-400/30 bg-amber-500/10 text-amber-400/80">
                          <Camera className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Khán Giả</span>
                        </span>
                      ) : null
                    )}
                    {isHost && !player.isHost && !player.isSpectator && player.status === "connected" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleTransferHost(player.userId); }}
                        className="p-1.5 rounded-full hover:bg-(--tertiary)/15 text-(--tertiary) transition-all cursor-pointer"
                        title="Chuyển Host"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                    )}
                    {player.isSpectator
                      ? <Eye className="w-5 h-5 text-(--tertiary)/50" />
                      : player.isHost
                        ? <Shield className="w-6 h-6 text-(--tertiary)/50 fill-(--tertiary)/20" />
                        : <CheckCircle2 className="w-6 h-6 text-(--primary)/30" />
                    }
                  </div>
               </div>
            ))}
            
            {gameState.players.filter(p => !p.isSpectator).length < 10 && (
              <div className="flex items-center justify-between p-4 bg-[#0f172a]/30 rounded-lg border border-dashed border-(--primary)/20 opacity-60">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#1e293b]/50 border border-(--outline-variant)/20 flex items-center justify-center text-(--primary)/30">
                    <Plus className="w-6 h-6" />
                  </div>
                  <p className="text-(--primary)/40 font-bold text-sm tracking-wide italic">Đang chiêu mộ...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="md:col-span-12 lg:col-span-5 space-y-6">
        <div className="avalon-glass rounded-xl p-6 border border-(--outline-variant)/30 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <h3 className="font-headline text-lg text-(--secondary) tracking-widest uppercase mb-6 flex items-center gap-2">
            <Settings className="w-6 h-6 text-(--primary)" />
            Nghi Thức Khởi Nguồn
          </h3>

          <div
            onClick={() => isHost && handleToggleSetting("advancedMode")}
            className={`mb-6 relative overflow-hidden rounded-2xl border p-4 transition-all ${isHost ? "cursor-pointer" : "cursor-not-allowed opacity-70"} ${gameState.settings.advancedMode ? "border-(--primary)/60 bg-linear-to-r from-(--primary)/18 to-cyan-500/10 shadow-[0_0_30px_rgba(131,195,163,0.18)]" : "border-(--outline-variant)/35 bg-[#0f172a]/55 hover:bg-[#1e293b]/70"}`}
          >
            <div className="absolute inset-0 pointer-events-none bg-linear-to-r from-transparent via-white/5 to-transparent opacity-30" />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-(--primary)" />
                  <p className="text-xs uppercase tracking-[0.22em] font-headline text-(--on-surface)">
                    Chế Độ Nâng Cao
                  </p>
                  <span className="px-1.5 py-0.5 rounded-md border border-cyan-300/40 bg-cyan-500/20 text-cyan-200 text-[9px] font-black uppercase tracking-wider">
                    NEW
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-(--on-surface-variant)">
                  Kích hoạt bộ luật mở rộng: phase kỹ năng, Athena, Minion Cha Cha Cha và log lịch sử kỹ năng cuối game.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider border border-(--primary)/35 bg-(--primary)/12 text-(--primary)">Skill Phase</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider border border-cyan-300/35 bg-cyan-500/12 text-cyan-200">Athena</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider border border-amber-300/35 bg-amber-500/12 text-amber-200">Skill Log</span>
                </div>
                <p className="mt-2 text-[10px] text-(--on-surface-variant)/75">
                  {isHost ? "Chỉ Host có thể bật/tắt chế độ này." : "Chỉ Host có thể thay đổi cài đặt này."}
                </p>
              </div>
              <div className={`relative mt-0.5 h-7 w-14 shrink-0 rounded-full border overflow-hidden ${gameState.settings.advancedMode ? "border-(--primary)/70 bg-(--primary)/40" : "border-(--outline-variant)/55 bg-(--outline-variant)/35"}`}>
                <div className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-surface-dim-avalon shadow-[0_1px_6px_rgba(0,0,0,0.45)] transition-transform duration-200 ${gameState.settings.advancedMode ? "translate-x-6" : "translate-x-0"}`} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            <RoleCard label="Merlin" icon={Wand2} isOn={gameState.settings.merlin} onToggle={() => handleToggleSetting("merlin")} disabled={!isHost} type="good" />
            <RoleCard label="Percival" icon={Eye} isOn={gameState.settings.percival} onToggle={() => handleToggleSetting("percival")} disabled={!isHost} type="good" />
            <RoleCard label="Athena" icon={Sparkles} isOn={!!gameState.settings.athena} onToggle={() => handleToggleSetting("athena")} disabled={!isHost || !gameState.settings.advancedMode} type="good" tag="NEW" />
            <RoleCard label="Assassin" icon={Swords} isOn={gameState.settings.assassin} onToggle={() => handleToggleSetting("assassin")} disabled={!isHost} type="evil" />
            <RoleCard label="Morgana" icon={Flame} isOn={gameState.settings.morgana} onToggle={() => handleToggleSetting("morgana")} disabled={!isHost} type="evil" />
            <RoleCard label="Mordred" icon={VenetianMask} isOn={gameState.settings.mordred} onToggle={() => handleToggleSetting("mordred")} disabled={!isHost} type="evil" />
            <RoleCard label="Oberon" icon={CloudFog} isOn={gameState.settings.oberon} onToggle={() => handleToggleSetting("oberon")} disabled={!isHost} type="evil" />
          </div>

          <div
            onClick={() => isHost && handleToggleSetting("leaderSeesDetailedVoteCounts")}
            className={`mb-8 rounded-xl border p-4 transition-all ${isHost ? "cursor-pointer hover:bg-[#1e293b]/70" : "cursor-not-allowed opacity-70"} ${gameState.settings.leaderSeesDetailedVoteCounts ? "border-(--primary)/45 bg-(--primary)/10" : "border-(--outline-variant)/35 bg-[#0f172a]/45"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] font-headline text-(--on-surface)">
                  Thủ Lĩnh Xem Chi Tiết Phiếu
                </p>
                <p className="mt-1 text-[11px] text-(--on-surface-variant)">
                  Bật: khi hiện kết quả approve/reject hoặc success/fail, chỉ thủ lĩnh thấy số lượt chi tiết.
                </p>
                <p className="mt-0.5 text-[11px] text-(--on-surface-variant)">
                  Tắt: tất cả chỉ thấy kết quả cuối, không hiện số lượng phiếu.
                </p>
              </div>
              <div className={`relative mt-1 h-6 w-11 shrink-0 rounded-full border overflow-hidden ${gameState.settings.leaderSeesDetailedVoteCounts ? "border-(--primary)/65 bg-(--primary)/35" : "border-(--outline-variant)/55 bg-(--outline-variant)/35"}`}>
                <div className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-surface-dim-avalon shadow-[0_1px_6px_rgba(0,0,0,0.45)] transition-transform duration-200 ${gameState.settings.leaderSeesDetailedVoteCounts ? "translate-x-5" : "translate-x-0"}`} />
              </div>
            </div>
          </div>

          <div
            onClick={() => isHost && handleToggleSetting("showQuestParticipantsBoard")}
            className={`mb-8 rounded-xl border p-4 transition-all ${isHost ? "cursor-pointer hover:bg-[#1e293b]/70" : "cursor-not-allowed opacity-70"} ${gameState.settings.showQuestParticipantsBoard ? "border-(--tertiary)/45 bg-(--tertiary)/10" : "border-(--outline-variant)/35 bg-[#0f172a]/45"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] font-headline text-(--on-surface)">
                  Bảng Lịch Sử Nhiệm Vụ
                </p>
                <p className="mt-1 text-[11px] text-(--on-surface-variant)">
                  Bật: trên bàn chơi sẽ hiện bảng ai đã tham gia từng nhiệm vụ theo phase.
                </p>
                <p className="mt-0.5 text-[11px] text-(--on-surface-variant)">
                  Tắt: ẩn hoàn toàn bảng lịch sử nhiệm vụ.
                </p>
              </div>
              <div className={`relative mt-1 h-6 w-11 shrink-0 rounded-full border overflow-hidden ${gameState.settings.showQuestParticipantsBoard ? "border-(--tertiary)/65 bg-(--tertiary)/35" : "border-(--outline-variant)/55 bg-(--outline-variant)/35"}`}>
                <div className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-surface-dim-avalon shadow-[0_1px_6px_rgba(0,0,0,0.45)] transition-transform duration-200 ${gameState.settings.showQuestParticipantsBoard ? "translate-x-5" : "translate-x-0"}`} />
              </div>
            </div>
          </div>

          {isHost ? (
            <div>
              <button 
                className={`w-full py-4 rounded-xl font-headline font-extrabold text-sm tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-3
                  ${connectedCount >= (gameState.settings.athena ? 7 : 5)
                    ? "bg-primary-avalon text-surface-dim-avalon shadow-[0_4px_20px_rgba(131,195,163,0.3)] hover:scale-[1.02] active:scale-[0.98]" 
                    : "bg-[#1e2b3b] text-[#768497] border border-[#44474c]/50 cursor-not-allowed"
                  }`}
                disabled={connectedCount < (gameState.settings.athena ? 7 : 5)}
                onClick={() => socket?.emit("startAvalonGame")}
              >
                <Gavel className="w-6 h-6" />
                {connectedCount >= (gameState.settings.athena ? 7 : 5) ? "Khai Mạc Tiệc Rượu" : (gameState.settings.athena ? "Cần >= 7 Người (Athena)" : "Tối Thiểu 5 Người")}
              </button>
            </div>
          ) : (
            <div className="w-full text-center text-(--primary)/40 border border-dashed border-(--primary)/20 py-4 rounded-xl text-sm font-bold uppercase tracking-widest bg-(--primary)/5">
               Chờ Host Bắt Đầu...
            </div>
          )}
          <p className="text-center text-[10px] text-(--primary)/40 mt-4 uppercase tracking-tighter">Bàn tròn yêu cầu tối thiểu 5 hiệp sĩ (7 nếu có rãnh Athena) để khởi động.</p>
        </div>

        <div className="p-4 bg-linear-to-br from-(--primary)/5 to-transparent border-l-2 border-(--primary)/40 rounded-r-xl">
          <p className="italic text-xs text-(--primary)/70 leading-relaxed font-sans">
            &quot;Vận mệnh đan xen, tốt xấu lẫn lộn. Không ai biết trước ánh sáng hay bóng tối sẽ cai trị vùng đất Avalon này. Liệu niềm tin của bạn đã đặt đúng chỗ?&quot;
          </p>
        </div>
      </div>
      
    </div>
  );
}
