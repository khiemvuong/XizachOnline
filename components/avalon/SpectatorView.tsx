"use client";

import { AvalonPlayer, AvalonRoom } from '@/server/game/AvalonTypes';
import { Eye, Hourglass, Shield, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function SpectatorView({ 
  gameState, me, roomId 
}: { 
  gameState: AvalonRoom; 
  me: AvalonPlayer;
  roomId: string;
}) {
  const activePlayers = gameState.players.filter(p => !p.isSpectator && p.status === 'connected');
  const spectators = gameState.players.filter(p => p.isSpectator);
  const currentQuest = gameState.questHistory[gameState.currentQuestIndex];

  const stateLabels: Record<string, string> = {
    'ROLE_REVEAL': 'Nhận Danh Tính',
    'TEAM_BUILDING': 'Chọn Đội Nhiệm Vụ',
    'VOTING': 'Bỏ Phiếu Đội Hình',
    'QUEST': 'Thực Hiện Nhiệm Vụ',
    'ASSASSINATION': 'Ám Sát Merlin',
    'GAME_OVER': 'Kết Thúc',
  };

  return (
    <div className="flex-1 flex flex-col items-center z-10 h-full min-h-0 overflow-hidden px-3 py-2">

      {/* Compact Room Code + Status Bar */}
      <div className="w-full max-w-3xl flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-(--secondary)/60">Mã phòng</span>
          <span className="text-sm font-headline font-bold text-(--primary) tracking-wider">#{roomId.substring(0,6)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-400/80">
          <Eye className="w-3.5 h-3.5" />
          <span className="text-[10px] font-headline uppercase tracking-widest">Khán giả</span>
        </div>
      </div>

      {/* Quest Progress Bar */}
      <div className="w-full max-w-3xl flex items-center gap-2 mb-4">
        {gameState.questHistory.map((quest, i) => {
          const isCurrent = i === gameState.currentQuestIndex;
          const statusColor = quest.status === 'success' ? 'bg-emerald-500' : quest.status === 'fail' ? 'bg-red-500' : 'bg-slate-700';
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-full h-2 rounded-full transition-all ${statusColor} ${isCurrent ? 'ring-2 ring-amber-400/50 ring-offset-1 ring-offset-slate-900' : ''}`} />
              <div className="flex items-center gap-1">
                <span className={`text-[9px] font-bold ${isCurrent ? 'text-amber-400' : 'text-slate-500'}`}>{quest.teamSize}</span>
                {quest.status === 'success' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                {quest.status === 'fail' && <XCircle className="w-3 h-3 text-red-400" />}
                {quest.status === 'pending' && isCurrent && <Clock className="w-3 h-3 text-amber-400 animate-pulse" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Spectator Card */}
      <div className="w-full max-w-3xl flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="avalon-glass rounded-xl border border-amber-500/20 p-5 flex-1 flex flex-col gap-4 overflow-y-auto custom-avalon-scrollbar">
          
          {/* Current Phase */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2 text-amber-400/70">
              <Hourglass className="w-4 h-4 animate-pulse" />
              <span className="text-[10px] font-headline uppercase tracking-[0.3em]">Trận đang diễn ra</span>
            </div>
            <h2 className="text-xl font-headline text-(--on-surface) uppercase tracking-wider">
              {stateLabels[gameState.state] ?? gameState.state}
            </h2>
            {gameState.state === 'VOTING' && (
              <p className="text-xs text-(--on-surface-variant)">
                Vote track: {gameState.voteTrack}/5 — Quest {gameState.currentQuestIndex + 1}/5 ({currentQuest?.teamSize} người)
              </p>
            )}
            {(gameState.state === 'TEAM_BUILDING' || gameState.state === 'QUEST') && (
              <p className="text-xs text-(--on-surface-variant)">
                Quest {gameState.currentQuestIndex + 1}/5 — Cần {currentQuest?.teamSize} kỵ sĩ
              </p>
            )}
          </div>

          <div className="w-full h-px bg-linear-to-r from-transparent via-amber-500/20 to-transparent" />

          {/* Player List (no roles visible) */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-headline uppercase tracking-widest text-(--secondary)/60 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Kỵ sĩ đang chơi ({activePlayers.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {activePlayers.map(p => {
                const isLeader = gameState.players[gameState.leaderIndex]?.userId === p.userId;
                const isOnTeam = gameState.proposedTeam.includes(p.userId);
                return (
                  <div 
                    key={p.userId}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-colors ${
                      isOnTeam 
                        ? 'border-amber-500/40 bg-amber-500/10' 
                        : isLeader 
                        ? 'border-(--primary)/30 bg-(--primary)/5' 
                        : 'border-(--outline-variant)/20 bg-slate-900/40'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isLeader ? 'bg-(--primary)/20 text-(--primary)' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-(--on-surface) font-medium truncate">{p.name}</p>
                      <p className={`text-[9px] uppercase tracking-wider ${isLeader ? 'text-(--primary)' : 'text-slate-500'}`}>
                        {isLeader ? 'Đội trưởng' : isOnTeam ? 'Nhiệm vụ' : p.status === 'disconnected' ? 'Mất kết nối' : ''}
                      </p>
                    </div>
                    {p.hasVoted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/60 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Other Spectators */}
          {spectators.length > 1 && (
            <>
              <div className="w-full h-px bg-linear-to-r from-transparent via-(--outline-variant)/20 to-transparent" />
              <div className="space-y-1.5">
                <h3 className="text-[10px] font-headline uppercase tracking-widest text-amber-400/50 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  Khán giả khác ({spectators.length - 1})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {spectators.filter(s => s.userId !== me.userId).map(s => (
                    <span key={s.userId} className="px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/30 text-[10px] text-slate-400">
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bottom Message */}
        <div className="mt-3 text-center space-y-1 pb-1">
          <p className="text-xs text-amber-300/60 italic">
            Bạn đang theo dõi trận đấu. Khi trận kết thúc, bạn sẽ tham gia trận tiếp theo.
          </p>
        </div>
      </div>
    </div>
  );
}
