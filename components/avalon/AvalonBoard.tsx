"use client";

import { AvalonPlayer, AvalonRoom } from '@/server/game/AvalonTypes';
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import RoleReveal from './RoleReveal';
import RoundTable from './RoundTable';
import VotingCards from './VotingCards';
import AssassinationUI from './AssassinationUI';
import GameOver from './GameOver';
import EarlyEndOverlay from './EarlyEndOverlay';
import VoteOutcomeOverlay from './VoteOutcomeOverlay';
import RulesModal from './RulesModal';
import MyRoleModal from './MyRoleModal';
import type { LucideIcon } from 'lucide-react';
import { BookOpen, Edit2, ChevronsRight, Copy, Shield, CheckCircle2, Hourglass, Plus, Settings, Wand2, Eye, VenetianMask, Flame, Swords, CloudFog, Gavel, AlertTriangle, BookText } from 'lucide-react';

export default function AvalonBoard({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<AvalonRoom | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showMyRole, setShowMyRole] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    // if (!localStorage.getItem('avalon_userId')) {
    //   localStorage.setItem('avalon_userId', Math.random().toString(36).substr(2, 9));
    // }
    if (!sessionStorage.getItem('avalon_userId')) {
      sessionStorage.setItem('avalon_userId', Math.random().toString(36).substr(2, 9));
    }
  }, []);

  useEffect(() => {
    if (!hasJoined || initialized.current) return;
    initialized.current = true;

    // const userId = localStorage.getItem('avalon_userId')!;
    const userId = sessionStorage.getItem('avalon_userId')!;
    
    // Connect specifically to the /avalon namespace
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "";
    const socketio = io(`${socketUrl}/avalon`, {
      reconnectionDelayMax: 10000,
    });

    socketio.on('connect', () => {
      setSocket(socketio);
      socketio.emit('joinRoom', { roomId, playerName, userId });
    });

    socketio.on('avalonGameState', (state: AvalonRoom) => {
      setGameState(state);
    });

    return () => {
      socketio.disconnect();
      initialized.current = false;
    };
  }, [hasJoined, roomId, playerName]);

  if (!hasJoined) {
    return (
      <div className="font-body text-primary-avalon h-screen overflow-hidden flex flex-col relative z-0">
        {/* Background Atmospheric Elements */}
        <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCe79Gc9SGc6EKO9KgDlXh9feqsIYrJalRcurvGANaXucPIsKyB-ndT87S0Qw3yyiQC5jpVkN3TTMN8f3WQwYB7eFJEZQ0rgPtogy0igcGgrZbtRNH2uiu133f5tHszGaW4GHlq2-LQ7N8kvEejj2_-AFbk80B7fK8G3wqm5L0XpNvYgaP8pJV3C1pkFR550fSiPqyRT28Bvwk_mh0xJC6Nv6xHQj1HxREGxwLnq0Kcd004LWjJiy1vL5euJ2BCEloyZs-n6ihZig')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
          <div className="absolute inset-0 bg-surface-dim-avalon/70 backdrop-blur-[2px]"></div>
        </div>
        <div className="absolute inset-0 pointer-events-none -z-10">
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-(--primary) opacity-10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-(--tertiary) opacity-10 blur-[120px] rounded-full"></div>
        </div>
        
        {/* Top Navigation Anchor */}
        <header className="bg-slate-950/80 backdrop-blur-md fixed top-0 w-full z-10 flex justify-between items-center px-6 py-3 shadow-[0_0_20px_rgba(13,27,42,0.5)]">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-primary-avalon" />
            <h1 className="text-lg font-serif italic text-primary-avalon tracking-widest uppercase">The Illuminated Archive</h1>
          </div>
          <button 
            onClick={() => setShowRules(true)}
            className="p-2 bg-black/40 backdrop-blur-md border border-(--primary)/30 rounded-full hover:bg-(--primary)/10 text-(--primary) hover:text-white transition-colors shadow-lg cursor-pointer"
            title="Luật Chơi"
          >
            <BookText className="w-6 h-6" />
          </button>
        </header>

        <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

        <div className="flex-1 mt-16 px-4 md:px-8 py-8 flex items-center justify-center relative z-0">
           {/* Section */}
           <div className="w-full max-w-md space-y-8 avalon-glass p-8 rounded-2xl border border-(--outline-variant) shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <div className="text-center space-y-2">
                <h2 className="text-(--primary) font-serif text-3xl tracking-wider uppercase">Căn Phòng Ánh Sáng</h2>
                <p className="text-(--on-surface-variant) text-sm italic">Hãy chọn danh xưng để hội ngộ các Kỵ sĩ.</p>
              </div>
              
              <div className="space-y-4">
                <label className="block text-(--secondary) text-sm uppercase tracking-tighter text-center">Tên của bạn</label>
                <div className="relative group">
                  <input
                    className="w-full bg-[#0f172a]/80 border border-(--outline-variant) focus:ring-1 focus:ring-(--primary) rounded-lg py-4 px-5 text-white placeholder:text-slate-500 font-sans text-center font-bold tracking-widest text-lg outline-none transition-colors"
                    placeholder="Nhập tên..."
                    value={playerName}
                    onChange={e => setPlayerName(e.target.value)}
                    maxLength={12}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && playerName.trim()) setHasJoined(true);
                    }}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                    <Edit2 className="w-5 h-5 text-(--primary)/50" />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-center">
                 <button 
                   onClick={() => playerName.trim() && setHasJoined(true)}
                   disabled={!playerName.trim()}
                   className={`px-12 py-4 rounded-xl font-headline font-extrabold text-sm transform transition-all tracking-widest uppercase flex items-center justify-center gap-3 w-full
                     ${playerName.trim() 
                       ? 'bg-primary-avalon hover:bg-white text-surface-dim-avalon shadow-[0_10px_30px_rgba(186,200,220,0.2)] active:scale-95 cursor-pointer' 
                       : 'bg-[#1e2b3b] text-[#768497] cursor-not-allowed border border-[#44474c]/50'
                     }`}
                 >
                    Gia Nhập
                    <ChevronsRight className="w-6 h-6" />
                 </button>
              </div>
              
              <div className="mt-8 p-4 rounded-lg bg-(--primary)/10 border-l-2 border-(--primary)/40 relative">
                 <p className="text-(--on-surface-variant) text-xs italic leading-relaxed text-center">
                   "Một cuộc chiến trường kỳ cần sự tin tưởng. Nhưng cẩn thận, không phải ái nấy đều là Kỵ Sĩ trung tuyến..."
                 </p>
              </div>
           </div>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="avalon-theme min-h-screen flex items-center justify-center">
        <div className="text-primary-avalon animate-pulse font-serif uppercase text-xl">Đang thiết lập bàn tròn...</div>
      </div>
    );
  }

  // const userId = localStorage.getItem('avalon_userId')!;
  const userId = sessionStorage.getItem('avalon_userId')!;
  const me = gameState.players.find((p: AvalonPlayer) => p.userId === userId);

  return (
    <div className="avalon-theme min-h-176 flex flex-col p-4 w-full relative overflow-x-hidden z-0">
      {/* Avalon Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCe79Gc9SGc6EKO9KgDlXh9feqsIYrJalRcurvGANaXucPIsKyB-ndT87S0Qw3yyiQC5jpVkN3TTMN8f3WQwYB7eFJEZQ0rgPtogy0igcGgrZbtRNH2uiu133f5tHszGaW4GHlq2-LQ7N8kvEejj2_-AFbk80B7fK8G3wqm5L0XpNvYgaP8pJV3C1pkFR550fSiPqyRT28Bvwk_mh0xJC6Nv6xHQj1HxREGxwLnq0Kcd004LWjJiy1vL5euJ2BCEloyZs-n6ihZig')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
        <div className="absolute inset-0 bg-surface-dim-avalon/70 backdrop-blur-[2px]"></div>
      </div>
      <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
        {gameState.state !== 'LOBBY' && me?.role && (
          <button 
            onClick={() => setShowMyRole(true)}
            className="p-2 bg-black/40 backdrop-blur-md border border-(--primary)/30 rounded-full hover:bg-(--primary)/10 text-(--primary) hover:text-white transition-colors shadow-lg cursor-pointer"
            title="Bài Của Bạn"
          >
            <VenetianMask className="w-6 h-6" />
          </button>
        )}
        <button 
          onClick={() => setShowRules(true)}
          className="p-2 bg-black/40 backdrop-blur-md border border-(--primary)/30 rounded-full hover:bg-(--primary)/10 text-(--primary) hover:text-white transition-colors shadow-lg cursor-pointer"
          title="Luật Chơi"
        >
          <BookText className="w-6 h-6" />
        </button>
        {gameState.state !== 'LOBBY' && gameState.state !== 'GAME_OVER' && (
          <button 
            onClick={() => socket?.emit('voteEarlyEnd', true)}
            className="p-2 bg-black/40 backdrop-blur-md border border-(--tertiary)/30 rounded-full hover:bg-(--tertiary)/10 text-(--tertiary) hover:text-white transition-colors shadow-lg cursor-pointer"
            title="Xin Huỷ Trận Đấu"
          >
            <AlertTriangle className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Early End Overlay */}
      {gameState.earlyEndVotes && gameState.earlyEndVotes.length > 0 && gameState.state !== 'GAME_OVER' && (
        <EarlyEndOverlay gameState={gameState} userId={userId} socket={socket} />
      )}

      {gameState.state === 'LOBBY' && (
        <AvalonLobby gameState={gameState} me={me} socket={socket} roomId={roomId} />
      )}
      
      {gameState.state === 'ROLE_REVEAL' && me && (
        <RoleReveal gameState={gameState} me={me} onReady={() => socket?.emit('playerReady')} />
      )}
      
      {gameState.state !== 'LOBBY' && gameState.state !== 'ROLE_REVEAL' && gameState.state !== 'GAME_OVER' && gameState.state !== 'ASSASSINATION' && me && (
        <>
          <RoundTable gameState={gameState} me={me} socket={socket} />
          <VotingCards gameState={gameState} me={me} socket={socket} />
        </>
      )}

      {gameState.state === 'ASSASSINATION' && me && (
         <AssassinationUI gameState={gameState} me={me} socket={socket} />
      )}

      {gameState.state === 'GAME_OVER' && me && (
         <GameOver gameState={gameState} me={me} socket={socket} />
      )}

      {me && <VoteOutcomeOverlay gameState={gameState} me={me} />}

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
      {me && <MyRoleModal isOpen={showMyRole} onClose={() => setShowMyRole(false)} gameState={gameState} me={me} />}
    </div>
  );
}

function AvalonLobby({ gameState, me, socket, roomId }: { gameState: AvalonRoom, me?: AvalonPlayer, socket: Socket | null, roomId: string }) {
  const isHost = me?.isHost;
  const connectedCount = gameState.players.filter(p => p.status === 'connected').length;

  const handleToggleSetting = (key: keyof typeof gameState.settings) => {
    if (!isHost || !socket) return;
    socket.emit('updateSettings', {
       ...gameState.settings,
       [key]: !gameState.settings[key]
    });
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
  };

  return (
    <div className="flex-1 mt-14 px-2 md:px-4 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 w-full z-10">
      
      {/* Mảng Trái: Thông tin phòng & Danh sách người chơi */}
      <div className="md:col-span-12 lg:col-span-7 space-y-6 flex flex-col h-full">
        {/* Room Code Card */}
        <div className="avalon-glass p-6 rounded-xl border border-(--outline-variant)/30 flex justify-between items-center relative overflow-hidden group shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div className="absolute inset-0 bg-linear-to-r from-(--primary)/5 to-transparent pointer-events-none"></div>
          <div>
            <h2 className="text-(--secondary) font-headline text-sm tracking-[0.2em] uppercase mb-1">Mã Hội Yến</h2>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-headline font-bold text-(--primary) tracking-tighter uppercase">#{roomId.substring(0,6)}</span>
              <button onClick={copyRoomId} className="p-2 hover:bg-white/10 rounded-full transition-colors text-(--primary)/60 cursor-pointer">
                <Copy className="w-5 h-5" />
              </button>
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

        {/* Player List */}
        <div className="space-y-3 flex-1 flex flex-col">
          <div className="flex justify-between items-center px-2">
            <h3 className="font-headline text-lg text-(--primary) tracking-wide">Bàn Tròn Kỵ Sĩ</h3>
            <span className="text-[10px] text-(--primary)/40 uppercase tracking-widest flex items-center gap-1">
               <Hourglass className="w-3 h-3 animate-pulse" /> Đang chờ...
            </span>
          </div>
          
          <div className="grid grid-cols-1 gap-2 overflow-y-auto pr-1">
            {gameState.players.map((player) => (
               <div key={player.userId} className="flex items-center justify-between p-4 bg-[#0f172a]/80 border border-(--outline-variant)/20 rounded-lg group hover:bg-[#1e293b] transition-all shadow-sm">
                 <div className="flex items-center gap-4">
                   <div className={`w-2 h-8 rounded-full ${player.status === 'connected' ? (player.isHost ? 'bg-(--tertiary)' : 'bg-(--primary)') : 'bg-gray-600'}`}></div>
                   <div className="w-10 h-10 rounded-full bg-(--primary-container)/10 border border-(--primary)/30 flex items-center justify-center text-(--primary) font-bold">
                     {player.name.charAt(0).toUpperCase()}
                   </div>
                   <div>
                     <p className={`text-(--on-surface) font-bold text-sm tracking-wide ${player.status === 'disconnected' ? 'text-gray-500 line-through' : ''}`}>
                       {player.name} {player.userId === me?.userId && '(Bạn)'}
                     </p>
                     <p className={`text-[10px] uppercase font-bold ${player.isHost ? 'text-(--tertiary)/80' : 'text-(--primary)/60'}`}>
                       {player.isHost ? 'Host' : (player.status === 'connected' ? 'Sẵn Sàng' : 'Mất Kết Nối')}
                     </p>
                   </div>
                 </div>
                 {player.isHost ? <Shield className="w-6 h-6 text-(--tertiary)/50 fill-(--tertiary)/20" /> : <CheckCircle2 className="w-6 h-6 text-(--primary)/30" />}
               </div>
            ))}
            
            {gameState.players.length < 10 && (
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

      {/* Mảng Phải: Cài đặt Roles & Bắt đầu */}
      <div className="md:col-span-12 lg:col-span-5 space-y-6">
        <div className="avalon-glass rounded-xl p-6 border border-(--outline-variant)/30 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <h3 className="font-headline text-lg text-(--secondary) tracking-widest uppercase mb-6 flex items-center gap-2">
            <Settings className="w-6 h-6 text-(--primary)" />
            Nghi Thức Khởi Nguồn
          </h3>

          {/* Roles Grid */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <RoleCard label="Merlin" icon={Wand2} isOn={gameState.settings.merlin} onToggle={() => handleToggleSetting('merlin')} disabled={!isHost} type="good" />
            <RoleCard label="Percival" icon={Eye} isOn={gameState.settings.percival} onToggle={() => handleToggleSetting('percival')} disabled={!isHost} type="good" />
            <RoleCard label="Assassin" icon={Swords} isOn={gameState.settings.assassin} onToggle={() => handleToggleSetting('assassin')} disabled={!isHost} type="evil" />
            <RoleCard label="Morgana" icon={Flame} isOn={gameState.settings.morgana} onToggle={() => handleToggleSetting('morgana')} disabled={!isHost} type="evil" />
            <RoleCard label="Mordred" icon={VenetianMask} isOn={gameState.settings.mordred} onToggle={() => handleToggleSetting('mordred')} disabled={!isHost} type="evil" />
            <RoleCard label="Oberon" icon={CloudFog} isOn={gameState.settings.oberon} onToggle={() => handleToggleSetting('oberon')} disabled={!isHost} type="evil" />
          </div>

          <div
            onClick={() => isHost && handleToggleSetting('leaderSeesDetailedVoteCounts')}
            className={`mb-8 rounded-xl border p-4 transition-all ${isHost ? 'cursor-pointer hover:bg-[#1e293b]/70' : 'cursor-not-allowed opacity-70'} ${gameState.settings.leaderSeesDetailedVoteCounts ? 'border-(--primary)/45 bg-(--primary)/10' : 'border-(--outline-variant)/35 bg-[#0f172a]/45'}`}
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
              <div className={`relative mt-1 h-6 w-11 shrink-0 rounded-full border overflow-hidden ${gameState.settings.leaderSeesDetailedVoteCounts ? 'border-(--primary)/65 bg-(--primary)/35' : 'border-(--outline-variant)/55 bg-(--outline-variant)/35'}`}>
                <div className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-surface-dim-avalon shadow-[0_1px_6px_rgba(0,0,0,0.45)] transition-transform duration-200 ${gameState.settings.leaderSeesDetailedVoteCounts ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>
          </div>

          <div
            onClick={() => isHost && handleToggleSetting('showQuestParticipantsBoard')}
            className={`mb-8 rounded-xl border p-4 transition-all ${isHost ? 'cursor-pointer hover:bg-[#1e293b]/70' : 'cursor-not-allowed opacity-70'} ${gameState.settings.showQuestParticipantsBoard ? 'border-(--tertiary)/45 bg-(--tertiary)/10' : 'border-(--outline-variant)/35 bg-[#0f172a]/45'}`}
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
              <div className={`relative mt-1 h-6 w-11 shrink-0 rounded-full border overflow-hidden ${gameState.settings.showQuestParticipantsBoard ? 'border-(--tertiary)/65 bg-(--tertiary)/35' : 'border-(--outline-variant)/55 bg-(--outline-variant)/35'}`}>
                <div className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-surface-dim-avalon shadow-[0_1px_6px_rgba(0,0,0,0.45)] transition-transform duration-200 ${gameState.settings.showQuestParticipantsBoard ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>
          </div>

          {/* Action Button */}
          {isHost ? (
            <div>
              <button 
                className={`w-full py-4 rounded-xl font-headline font-extrabold text-sm tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-3
                  ${connectedCount >= 5 
                    ? 'bg-primary-avalon text-surface-dim-avalon shadow-[0_4px_20px_rgba(131,195,163,0.3)] hover:scale-[1.02] active:scale-[0.98]' 
                    : 'bg-[#1e2b3b] text-[#768497] border border-[#44474c]/50 cursor-not-allowed'
                  }`}
                disabled={connectedCount < 5}
                onClick={() => socket?.emit('startAvalonGame')}
              >
                <Gavel className="w-6 h-6" />
                {connectedCount >= 5 ? 'Khai Mạc Tiệc Rượu' : 'Tối Thiểu 5 Người'}
              </button>
            </div>
          ) : (
            <div className="w-full text-center text-(--primary)/40 border border-dashed border-(--primary)/20 py-4 rounded-xl text-sm font-bold uppercase tracking-widest bg-(--primary)/5">
               Chờ Host Bắt Đầu...
            </div>
          )}
          <p className="text-center text-[10px] text-(--primary)/40 mt-4 uppercase tracking-tighter">Bàn tròn yêu cầu tối thiểu 5 hiệp sĩ để khởi động.</p>
        </div>

        {/* Lore Tip */}
        <div className="p-4 bg-linear-to-br from-(--primary)/5 to-transparent border-l-2 border-(--primary)/40 rounded-r-xl">
          <p className="italic text-xs text-(--primary)/70 leading-relaxed font-sans">
            "Vận mệnh đan xen, tốt xấu lẫn lộn. Không ai biết trước ánh sáng hay bóng tối sẽ cai trị vùng đất Avalon này. Liệu niềm tin của bạn đã đặt đúng chỗ?"
          </p>
        </div>
      </div>
      
    </div>
  );
}

function RoleCard({ label, icon: Icon, isOn, onToggle, disabled, type }: { label: string, icon: LucideIcon, isOn: boolean, onToggle: () => void, disabled: boolean, type: 'good' | 'evil' }) {
  const isGood = type === 'good';
  const colorVar = isGood ? 'var(--primary)' : 'var(--tertiary)';
  const baseBg = isOn ? (isGood ? 'bg-(--primary)/10' : 'bg-(--tertiary)/10') : 'bg-[#0f172a]/50';
  const borderColor = isOn ? (isGood ? 'border-(--primary)/50' : 'border-(--tertiary)/50') : 'border-(--outline-variant)/20';

  return (
    <div 
      onClick={() => !disabled && onToggle()}
      className={`p-3 rounded-xl border ${borderColor} ${baseBg} flex flex-col items-center gap-2 transition-all ${disabled ? (isOn ? 'opacity-80' : 'opacity-50 cursor-not-allowed') : 'cursor-pointer hover:border-(--primary)/50 hover:bg-[#1e293b]'}`}
    >
      <Icon className="w-6 h-6" style={{ color: isOn ? colorVar : 'var(--on-surface-variant)' }} />
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: isOn ? colorVar : 'var(--on-surface-variant)' }}>{label}</span>
      <div className="w-8 h-1 rounded-full bg-slate-700 relative overflow-hidden">
        {isOn && <div className="absolute inset-0 rounded-full" style={{ backgroundColor: colorVar }}></div>}
      </div>
    </div>
  );
} 
