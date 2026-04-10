"use client";

import { AvalonPlayer, AvalonRoom } from '@/server/game/AvalonTypes';
import { useEffect, useState, useRef, useCallback, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
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
import SharedChatDropdown, { type ChatTheme } from '@/components/shared/ChatDropdown';
import VoiceChatPanel from './VoiceChatPanel';
import type { LucideIcon } from 'lucide-react';
import { Edit2, ChevronsRight, Copy, Shield, CheckCircle2, Hourglass, Plus, Settings, Wand2, Eye, EyeOff, VenetianMask, Flame, Swords, CloudFog, Gavel, AlertTriangle, Volume2, VolumeX, BookText, LogOut, Hand, X } from 'lucide-react';

type AudioTrackName = 'lobby' | 'win' | 'lose';

const AVALON_AUDIO_SOURCES: Record<AudioTrackName, string> = {
  lobby: '/audio/lobby.opt.ogg',
  win: '/audio/win.opt.ogg',
  lose: '/audio/lose.opt.ogg',
};

export default function AvalonBoard({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<AvalonRoom | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showNameEditModal, setShowNameEditModal] = useState(false);
  const [newNameInput, setNewNameInput] = useState('');
  const [showMyRole, setShowMyRole] = useState(false);
  const [isRoleHidden, setIsRoleHidden] = useState(true);
  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatText, setChatText] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const [isLobbyMusicEnabled, setIsLobbyMusicEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('avalon_lobby_music_enabled') !== '0';
  });
  const initialized = useRef(false);
  const lobbyAudioRef = useRef<HTMLAudioElement | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);
  const loseAudioRef = useRef<HTMLAudioElement | null>(null);
  const raiseHandAudioContextRef = useRef<AudioContext | null>(null);
  const previousRaisedIdsRef = useRef<Set<string>>(new Set());
  const hasRaiseSnapshotRef = useRef(false);
  const playedGameOverWinnerRef = useRef<'Good' | 'Evil' | null>(null);

  const getOrCreateAudio = (
    ref: { current: HTMLAudioElement | null },
    src: string,
    options?: { loop?: boolean; volume?: number; preload?: 'none' | 'metadata' | 'auto' }
  ) => {
    if (!ref.current) {
      const audio = new Audio(src);
      audio.loop = options?.loop ?? false;
      audio.volume = options?.volume ?? 0.5;
      audio.preload = options?.preload ?? 'metadata';
      ref.current = audio;
    }
    return ref.current;
  };

  const stopAudio = (audio: HTMLAudioElement | null, reset = false) => {
    if (!audio) return;
    audio.pause();
    if (reset) {
      audio.currentTime = 0;
    }
  };

  const safePlay = (audio: HTMLAudioElement) => {
    void audio.play().catch(() => undefined);
  };

  const playRaiseHandChime = useCallback(() => {
    if (typeof window === 'undefined') return;

    const AudioContextCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;

    if (!raiseHandAudioContextRef.current) {
      raiseHandAudioContextRef.current = new AudioContextCtor();
    }

    const context = raiseHandAudioContextRef.current;
    if (!context) return;

    if (context.state === 'suspended') {
      void context.resume();
    }

    const startAt = context.currentTime;

    const playTone = (
      frequency: number,
      offset: number,
      duration: number,
      peak: number,
      type: OscillatorType = 'triangle',
      detune = 0,
    ) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, startAt + offset);
      oscillator.detune.setValueAtTime(detune, startAt + offset);

      gainNode.gain.setValueAtTime(0.0001, startAt + offset);
      gainNode.gain.exponentialRampToValueAtTime(peak, startAt + offset + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + offset + duration);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start(startAt + offset);
      oscillator.stop(startAt + offset + duration);
    };

    // Brighter and a bit louder than previous version, but still short/lightweight.
    playTone(620, 0, 0.1, 0.045, 'triangle');
    playTone(860, 0.055, 0.12, 0.06, 'triangle', 6);
    playTone(1180, 0.125, 0.1, 0.042, 'sine');
  }, []);

  const gamePhase = gameState?.state;
  const gameWinner = gameState?.winner;

  useEffect(() => {
    if (!localStorage.getItem('avalon_userId')) {
      localStorage.setItem('avalon_userId', Math.random().toString(36).substr(2, 9));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('avalon_lobby_music_enabled', isLobbyMusicEnabled ? '1' : '0');
  }, [isLobbyMusicEnabled]);

  useEffect(() => {
    if (!hasJoined || initialized.current) return;
    initialized.current = true;

    const userId = localStorage.getItem('avalon_userId')!;
    
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

  useEffect(() => {
    const handleOpenRules = () => setShowRules(true);
    window.addEventListener('avalon-open-rules', handleOpenRules);
    return () => window.removeEventListener('avalon-open-rules', handleOpenRules);
  }, []);

  useEffect(() => {
    if (!gamePhase) return;

    const stopEndTracks = () => {
      stopAudio(winAudioRef.current, true);
      stopAudio(loseAudioRef.current, true);
    };

    if (gamePhase === 'LOBBY') {
      playedGameOverWinnerRef.current = null;
      stopEndTracks();

      if (isLobbyMusicEnabled) {
        const lobbyTrack = getOrCreateAudio(lobbyAudioRef, AVALON_AUDIO_SOURCES.lobby, {
          loop: true,
          volume: 0.35,
          preload: 'auto',
        });
        safePlay(lobbyTrack);
      } else {
        stopAudio(lobbyAudioRef.current, true);
      }

      return;
    }

    stopAudio(lobbyAudioRef.current, true);

    if (gamePhase !== 'GAME_OVER') {
      playedGameOverWinnerRef.current = null;
      stopEndTracks();
      return;
    }

    if (gameWinner !== 'Good' && gameWinner !== 'Evil') {
      stopEndTracks();
      return;
    }

    if (playedGameOverWinnerRef.current === gameWinner) {
      return;
    }

    stopEndTracks();
    const endTrack =
      gameWinner === 'Good'
        ? getOrCreateAudio(winAudioRef, AVALON_AUDIO_SOURCES.win, { volume: 0.55, preload: 'auto' })
        : getOrCreateAudio(loseAudioRef, AVALON_AUDIO_SOURCES.lose, { volume: 0.75, preload: 'auto' });

    endTrack.currentTime = 0;
    safePlay(endTrack);
    playedGameOverWinnerRef.current = gameWinner;
  }, [gamePhase, gameWinner, isLobbyMusicEnabled]);

  useEffect(() => {
    return () => {
      if (raiseHandAudioContextRef.current) {
        void raiseHandAudioContextRef.current.close();
        raiseHandAudioContextRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!gameState) return;

    if (gameState.state === 'LOBBY' || gameState.state === 'GAME_OVER') {
      previousRaisedIdsRef.current = new Set();
      hasRaiseSnapshotRef.current = false;
      return;
    }

    const currentlyRaisedIds = new Set(
      gameState.players
        .filter((player) => player.status === 'connected' && player.isHandRaised)
        .map((player) => player.userId),
    );

    if (!hasRaiseSnapshotRef.current) {
      previousRaisedIdsRef.current = currentlyRaisedIds;
      hasRaiseSnapshotRef.current = true;
      return;
    }

    let hasNewRaise = false;
    for (const raisedId of currentlyRaisedIds) {
      if (!previousRaisedIdsRef.current.has(raisedId)) {
        hasNewRaise = true;
        break;
      }
    }

    if (hasNewRaise) {
      playRaiseHandChime();
    }

    previousRaisedIdsRef.current = currentlyRaisedIds;
  }, [gameState, playRaiseHandChime]);

  const handleSendChat = useCallback((event: FormEvent) => {
    event.preventDefault();
    if (!chatText.trim() || !socket) return;
    socket.emit('chatMessage', chatText.trim());
    setChatText('');
  }, [chatText, socket]);

  // Scroll to bottom when messages arrive
  useEffect(() => {
    if (showChat) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState?.messages?.length, showChat]);

  if (!hasJoined) {
    return (
      <div className="avalon-entry-screen font-body text-primary-avalon h-dvh overflow-hidden flex items-center justify-center relative z-0 p-4">
        {/* Background Atmospheric Elements */}
        <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: "url('/avalon_roles/background.png')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'scroll' }}>
          <div className="absolute inset-0 bg-surface-dim-avalon/70 backdrop-blur-[2px]"></div>
        </div>
        <div className="absolute inset-0 pointer-events-none -z-10">
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-(--primary) opacity-10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-(--tertiary) opacity-10 blur-[120px] rounded-full"></div>
        </div>
        
        <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

        <div className="avalon-entry-card w-full max-w-md avalon-glass rounded-3xl border border-(--outline-variant) shadow-2xl overflow-y-auto max-h-full landscape:max-w-4xl lg:max-w-4xl relative z-10 custom-avalon-scrollbar">
          <div className="avalon-entry-grid grid grid-cols-1 landscape:grid-cols-[1.05fr_1fr] lg:grid-cols-[1.05fr_1fr] gap-4 md:gap-6 p-5 sm:p-1 md:p-8 items-stretch">
            <div className="avalon-entry-copy rounded-2xl border border-(--outline-variant)/25 bg-(--surface-container-low)/50 p-4 sm:p-5 flex flex-col justify-between">
              <div className="text-center md:text-left space-y-2">
                <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.28em] text-(--secondary)">The Illuminated Archive</p>
                <h2 className="text-(--primary) font-extrabold font-serif text-2xl sm:text-3xl landscape:text-2xl lg:text-4xl tracking-wider uppercase avalon-title-glow-primary">Căn Phòng Ánh Sáng</h2>
                <p className="text-(--on-surface-variant) text-sm italic">Hãy chọn danh xưng để hội ngộ các Kỵ sĩ.</p>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-(--primary)/10 border-l-2 border-(--primary)/40 relative">
                <p className="text-(--on-surface-variant) text-xs italic leading-relaxed text-center md:text-left">
                  &quot;Một cuộc chiến trường kỳ cần sự tin tưởng. Nhưng cẩn thận, không phải ai nấy đều là Kỵ Sĩ trung tuyến...&quot;
                </p>
              </div>
            </div>

            <div className="avalon-entry-form rounded-2xl border border-(--outline-variant)/25 bg-[#0f172a]/45 p-4 sm:p-5 flex flex-col justify-center space-y-4">
              <label className="block text-(--secondary) text-xs sm:text-sm uppercase tracking-tighter text-center">Tên của bạn</label>
              <div className="relative group">
                <input
                  className="w-full bg-[#0f172a]/80 border border-(--outline-variant) focus:ring-1 focus:ring-(--primary) rounded-xl py-3 sm:py-4 px-5 text-white placeholder:text-slate-500 font-sans text-center font-bold tracking-widest text-base sm:text-lg outline-none transition-colors"
                  placeholder="Nhập tên..."
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  maxLength={12}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && playerName.trim()) {
                      // Unlock audio for mobile Safari
                      [
                        { ref: winAudioRef, src: AVALON_AUDIO_SOURCES.win },
                        { ref: loseAudioRef, src: AVALON_AUDIO_SOURCES.lose }
                      ].forEach(({ ref, src }) => {
                        const a = getOrCreateAudio(ref, src, { preload: 'auto' });
                        a.play().then(() => a.pause()).catch(() => {});
                      });
                      setHasJoined(true);
                    }
                  }}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                  <Edit2 className="w-4 h-4 sm:w-5 sm:h-5 text-(--primary)/50" />
                </div>
              </div>

              <button
                onClick={() => {
                  if (playerName.trim()) {
                    // Unlock audio for mobile Safari
                    [
                      { ref: winAudioRef, src: AVALON_AUDIO_SOURCES.win },
                      { ref: loseAudioRef, src: AVALON_AUDIO_SOURCES.lose }
                    ].forEach(({ ref, src }) => {
                      const a = getOrCreateAudio(ref, src, { preload: 'auto' });
                      a.play().then(() => a.pause()).catch(() => {});
                    });
                    setHasJoined(true);
                  }
                }}
                disabled={!playerName.trim()}
                className={`px-12 py-3.5 rounded-xl font-headline font-extrabold text-sm transform transition-all tracking-widest uppercase flex items-center justify-center gap-3 w-full
                  ${playerName.trim()
                    ? 'bg-primary-avalon hover:bg-white text-surface-dim-avalon shadow-[0_10px_30px_rgba(186,200,220,0.2)] active:scale-95 cursor-pointer'
                    : 'bg-[#1e2b3b] text-[#768497] cursor-not-allowed border border-[#44474c]/50'
                  }`}
              >
                Gia Nhập
                <ChevronsRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="avalon-theme min-h-screen flex flex-col items-center justify-center gap-6">
        <div className="text-primary-avalon animate-pulse font-serif uppercase text-xl text-center px-4">
          Đang thiết lập bàn tròn...
        </div>
        <a 
          href="/avalon"
          className="px-6 py-2 rounded-lg border border-primary-avalon/30 bg-primary-avalon/10 text-primary-avalon hover:bg-primary-avalon hover:text-[#0b1320] transition-colors font-headline uppercase tracking-widest text-sm shadow-[0_0_15px_rgba(186,200,220,0.15)] hover:shadow-[0_0_25px_rgba(186,200,220,0.4)]"
        >
          Quay lại sảnh chờ
        </a>
      </div>
    );
  }

  const userId = localStorage.getItem('avalon_userId')!;
  const me = gameState.players.find((p: AvalonPlayer) => p.userId === userId);
  const isSpectator = Boolean(me?.isSpectator);
  const isHandRaised = Boolean(me?.isHandRaised);
  const isHost = me?.isHost ?? false;
  const isLobby = gameState.state === 'LOBBY';
  const isGameOver = gameState.state === 'GAME_OVER';
  const boardShellClass = isLobby
    ? 'h-full min-h-0 overflow-y-auto overflow-x-hidden'
    : 'h-full min-h-0 overflow-hidden';

  const handleBackButton = () => {
    if (!isHost) {
      // Non-host: just leave the room
      router.push('/avalon');
      return;
    }
    if (isLobby || isGameOver) {
      // Host at lobby/game-over: just navigate away (no game in progress)
      router.push('/avalon');
      return;
    }
    // Host mid-game: confirm before resetting everyone to lobby
    const confirmed = window.confirm(
      'Bạn là trưởng phòng. Quay về sẽ kết thúc ván chơi đang diễn ra và đưa tất cả mọi người về trang thiết lập phòng. Tiếp tục?'
    );
    if (confirmed) {
      socket?.emit('returnToLobby');
    }
  };

  const handleToggleRaiseHand = () => {
    if (!socket || !me) return;
    socket.emit('toggleRaiseHand', !Boolean(me.isHandRaised));
  };

  const AVALON_CHAT_THEME: ChatTheme = {
    surface: 'rgba(8,16,30,0.95)',
    border: 'color-mix(in srgb, var(--primary) 20%, transparent)',
    accent: 'var(--primary)',
    textPrimary: 'var(--on-surface)',
    textMuted: 'var(--on-surface-variant)',
  };

  return (
    <div className={`avalon-theme ${boardShellClass} flex flex-col p-4 w-full relative z-0`}>
      {/* Avalon Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: "url('/avalon_roles/background.png')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'scroll' }}>
        <div className="absolute inset-0 bg-surface-dim-avalon/70 backdrop-blur-[2px]"></div>
      </div>
      <div className="absolute top-3 right-3 z-50 flex items-center gap-2">
        {/* Edit Name Button — Lobby only */}
        {gameState.state === 'LOBBY' && (
          <button
            onClick={() => {
              setNewNameInput(me?.name ?? '');
              setShowNameEditModal(true);
            }}
            className="p-2 bg-black/40 backdrop-blur-md border border-(--primary)/30 rounded-full hover:bg-(--primary)/10 text-(--primary) hover:text-white transition-colors shadow-lg cursor-pointer"
            title="Đổi tên"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        )}

        {/* Back button: smart context-aware */}
        <button
          onClick={handleBackButton}
          className="p-2 bg-black/40 backdrop-blur-md border border-slate-600/40 rounded-full hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors shadow-lg cursor-pointer"
          title={isHost && !isLobby && !isGameOver ? 'Kết thúc ván — Đưa tất cả về thiết lập phòng' : 'Thoát phòng — Nhập mã phòng khác'}
        >
          <LogOut className="w-5 h-5" />
        </button>

        {/* Rules — always visible */}
        <button
          onClick={() => setShowRules(true)}
          className="p-2 bg-black/40 backdrop-blur-md border border-(--primary)/30 rounded-full hover:bg-(--primary)/10 text-(--primary) hover:text-white transition-colors shadow-lg cursor-pointer"
          title="Luật Chơi"
        >
          <BookText className="w-5 h-5" />
        </button>

        {/* Sound toggle — lobby only */}
        {gameState.state === 'LOBBY' && (
          <button
            onClick={() => setIsLobbyMusicEnabled((prev) => !prev)}
            className="p-2 bg-black/40 backdrop-blur-md border border-(--primary)/30 rounded-full hover:bg-(--primary)/10 text-(--primary) hover:text-white transition-colors shadow-lg cursor-pointer"
            title={isLobbyMusicEnabled ? 'Tắt nhạc sảnh' : 'Bật nhạc sảnh'}
          >
            {isLobbyMusicEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        )}

        {/* My Role — in-game only */}
        {gameState.state !== 'LOBBY' && me?.role && !isSpectator && (
          <button
            onClick={() => setShowMyRole(true)}
            className="p-2 bg-black/40 backdrop-blur-md border border-(--primary)/30 rounded-full hover:bg-(--primary)/10 text-(--primary) hover:text-white transition-colors shadow-lg cursor-pointer"
            title="Bài Của Bạn"
          >
            <VenetianMask className="w-5 h-5" />
          </button>
        )}

        {/* Privacy Shield — in-game only */}
        {gameState.state !== 'LOBBY' && gameState.state !== 'GAME_OVER' && !isSpectator && (
          <button
            onClick={() => setIsRoleHidden(p => !p)}
            className={`p-2 bg-black/40 backdrop-blur-md rounded-full transition-colors shadow-lg cursor-pointer border ${
              isRoleHidden
                ? 'border-amber-500/60 text-amber-400 hover:bg-amber-500/10'
                : 'border-(--primary)/30 text-(--primary) hover:bg-(--primary)/10 hover:text-white'
            }`}
            title={isRoleHidden ? 'Hiện thông tin vai trò' : 'Ẩn thông tin vai trò'}
          >
            {isRoleHidden ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}

        {/* Early end — in-game only */}
        {gameState.state !== 'LOBBY' && gameState.state !== 'GAME_OVER' && !isSpectator && (
          <button
            onClick={() => socket?.emit('voteEarlyEnd', true)}
            className="p-2 bg-black/40 backdrop-blur-md border border-(--tertiary)/30 rounded-full hover:bg-(--tertiary)/10 text-(--tertiary) hover:text-white transition-colors shadow-lg cursor-pointer"
            title="Xin Huỷ Trận Đấu"
          >
            <AlertTriangle className="w-5 h-5" />
          </button>
        )}

        {/* Raise hand — symbolic only */}
        {gameState.state !== 'LOBBY' && gameState.state !== 'GAME_OVER' && me && (
          <button
            onClick={handleToggleRaiseHand}
            className={`p-2 bg-black/40 backdrop-blur-md rounded-full transition-colors shadow-lg cursor-pointer border ${
              isHandRaised
                ? 'border-emerald-400/70 text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25'
                : 'border-(--primary)/30 text-(--primary) hover:bg-(--primary)/10 hover:text-white'
            }`}
            title={isHandRaised ? 'Bỏ tay xuống' : 'Dơ tay tượng trưng'}
          >
            <Hand className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Early End Overlay */}
      {gameState.earlyEndVotes && gameState.earlyEndVotes.length > 0 && gameState.state !== 'GAME_OVER' && !isSpectator && (
        <EarlyEndOverlay gameState={gameState} userId={userId} socket={socket} />
      )}

      {gameState.state === 'LOBBY' && (
        <AvalonLobby gameState={gameState} me={me} socket={socket} roomId={roomId} />
      )}
      
      {gameState.state === 'ROLE_REVEAL' && me && me.role && !me.isSpectator && (
        <RoleReveal gameState={gameState} me={me} onReady={() => socket?.emit('playerReady')} roomId={roomId} />
      )}

      {/* Fallback: no me at all (stale session) */}
      {!me && gameState.state !== 'LOBBY' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 z-10 text-center px-6">
          <div className="w-16 h-16 rounded-full border border-(--primary)/30 flex items-center justify-center">
            <span className="text-3xl animate-pulse">⚔️</span>
          </div>
          <div className="space-y-2">
            <h2 className="font-headline text-2xl text-(--primary) uppercase tracking-widest">Phiên Bản Lỗi</h2>
            <p className="text-(--on-surface-variant) text-sm italic max-w-sm">
              Không tìm thấy dữ liệu người chơi của bạn. Hãy thử tải lại trang.
            </p>
          </div>
          <button
            onClick={() => router.push('/avalon')}
            className="px-6 py-2.5 rounded-xl bg-(--primary)/10 border border-(--primary)/30 text-(--primary) font-headline text-sm uppercase tracking-widest hover:bg-(--primary)/20 transition-colors cursor-pointer"
          >
            Nhập Mã Phòng Khác
          </button>
        </div>
      )}
      
      {gameState.state !== 'LOBBY' && gameState.state !== 'ROLE_REVEAL' && gameState.state !== 'GAME_OVER' && gameState.state !== 'ASSASSINATION' && me && (
        <>
          <RoundTable gameState={gameState} me={me} socket={socket} roomId={roomId} isRoleHidden={isRoleHidden} isReadOnly={isSpectator} />
          <VotingCards gameState={gameState} me={me} socket={socket} isReadOnly={isSpectator} />
        </>
      )}

      {gameState.state === 'ASSASSINATION' && me && (
         <AssassinationUI gameState={gameState} me={me} socket={socket} />
      )}

      {gameState.state === 'GAME_OVER' && me && (
         <GameOver gameState={gameState} me={me} socket={socket} winAudioRef={winAudioRef} loseAudioRef={loseAudioRef} />
      )}

      {me && gameState.state !== 'ASSASSINATION' && gameState.state !== 'GAME_OVER' && (
        <VoteOutcomeOverlay gameState={gameState} me={me} />
      )}

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
      
      {/* Name Edit Modal */}
      {showNameEditModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-surface-dim-avalon border border-(--primary)/30 shadow-2xl p-6 flex flex-col gap-6 relative">
            <button 
              onClick={() => setShowNameEditModal(false)}
              className="absolute top-4 right-4 p-2 text-(--on-surface-variant) hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center space-y-2 mt-2">
              <div className="w-12 h-12 rounded-full border border-(--primary)/30 bg-(--primary)/10 flex items-center justify-center mx-auto mb-4">
                <Edit2 className="w-6 h-6 text-(--primary)" />
              </div>
              <h3 className="text-xl font-headline font-extrabold text-(--primary) tracking-widest uppercase">Đổi Tên</h3>
              <p className="text-sm text-(--on-surface-variant) italic">Hãy chọn danh xưng mới của bạn.</p>
            </div>

            <div className="flex flex-col gap-4 mb-2">
              <input
                type="text"
                value={newNameInput}
                onChange={(e) => setNewNameInput(e.target.value)}
                maxLength={12}
                className="w-full bg-[#0f172a]/80 border border-(--outline-variant) focus:ring-1 focus:ring-(--primary) rounded-xl py-3 px-5 text-white placeholder:text-slate-500 font-sans text-center font-bold tracking-widest text-lg outline-none transition-colors"
                placeholder="Nhập tên mới..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newNameInput.trim()) {
                    socket?.emit('changeName', newNameInput.trim());
                    setShowNameEditModal(false);
                  }
                }}
              />
              <button
                onClick={() => {
                  if (newNameInput.trim()) {
                    socket?.emit('changeName', newNameInput.trim());
                    setShowNameEditModal(false);
                  }
                }}
                disabled={!newNameInput.trim()}
                className={`py-3.5 rounded-xl font-headline font-extrabold text-sm uppercase tracking-widest transition-all ${
                  newNameInput.trim() 
                  ? 'bg-(--primary) text-surface-dim-avalon hover:brightness-110 shadow-lg cursor-pointer' 
                  : 'bg-(--surface-container-high) text-(--on-surface-variant)/50 cursor-not-allowed border border-(--outline-variant)/50'
                }`}
              >
                Xác Nhận
              </button>
            </div>
          </div>
        </div>
      )}
      {me && !isSpectator && <MyRoleModal isOpen={showMyRole} onClose={() => setShowMyRole(false)} gameState={gameState} me={me} />}

      {/* Voice Chat — always available after joining */}
      {me && (
        <VoiceChatPanel
          roomId={roomId}
          userId={userId}
          playerName={me.name}
          players={gameState.players
            .filter(p => p.status === 'connected')
            .map(p => ({ userId: p.userId, name: p.name }))}
        />
      )}

      {/* Chat — always available after joining */}
      {me && (
        <SharedChatDropdown
          messages={gameState.messages ?? []}
          userId={userId}
          showChat={showChat}
          chatText={chatText}
          theme={AVALON_CHAT_THEME}
          onToggleChat={() => setShowChat(p => !p)}
          onCloseChat={() => setShowChat(false)}
          onChatTextChange={setChatText}
          onSendChat={handleSendChat}
        />
      )}
    </div>
  );
}

function AvalonLobby({ gameState, me, socket, roomId }: { gameState: AvalonRoom, me?: AvalonPlayer, socket: Socket | null, roomId: string }) {
  const isHost = me?.isHost;
  const connectedCount = gameState.players.filter(p => p.status === 'connected').length;

  // ── Reorder state (mobile-friendly with up/down buttons) ──
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [reorderMode, setReorderMode] = useState(false);

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

  // ── Desktop drag handlers ──
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
    socket?.emit('reorderPlayers', ordered.map(p => p.userId));
    setDragIdx(null);
    setOverIdx(null);
  };
  const handleDragEnd = () => { setDragIdx(null); setOverIdx(null); };

  // ── Mobile reorder: move up/down ──
  const handleMovePlayer = (idx: number, direction: 'up' | 'down') => {
    if (!isHost || !socket) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= gameState.players.length) return;
    const ordered = [...gameState.players];
    [ordered[idx], ordered[targetIdx]] = [ordered[targetIdx], ordered[idx]];
    socket.emit('reorderPlayers', ordered.map(p => p.userId));
  };

  // ── Transfer host ──
  const handleTransferHost = (targetUserId: string) => {
    if (!isHost || !socket || targetUserId === me?.userId) return;
    socket.emit('transferHost', targetUserId);
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
              <span className="text-4xl font-headline font-bold text-(--primary) tracking-tighter uppercase avalon-title-glow-primary">#{roomId.substring(0,6)}</span>
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
            <h3 className="font-headline text-lg text-(--primary) tracking-wide avalon-title-glow-primary">Bàn Tròn Kỵ Sĩ</h3>
            {isHost ? (
              <button
                onClick={() => setReorderMode(m => !m)}
                className={`text-[10px] uppercase tracking-widest flex items-center gap-1 px-3 py-1 rounded-full border transition-all cursor-pointer ${
                  reorderMode
                    ? 'border-(--tertiary)/50 bg-(--tertiary)/10 text-(--tertiary)'
                    : 'border-(--primary)/20 /40 hover:border-(--primary)/40'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>
                {reorderMode ? 'Xong' : 'Sắp xếp'}
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
                   isHost && !reorderMode ? 'cursor-grab active:cursor-grabbing' : ''
                 } ${dragIdx === idx ? 'opacity-40 scale-95' : ''} ${overIdx === idx && dragIdx !== idx ? 'border-(--primary)/60 bg-(--primary)/5' : 'border-(--outline-variant)/20'}`}
               >
                 <div className="flex items-center gap-3">
                   {/* Reorder buttons (mobile-friendly) */}
                   {isHost && reorderMode && (
                     <div className="flex flex-col gap-0.5 shrink-0">
                       <button
                         onClick={(e) => { e.stopPropagation(); handleMovePlayer(idx, 'up'); }}
                         disabled={idx === 0}
                         className="p-0.5 rounded text-(--primary)/40 hover:text-(--primary) hover:bg-(--primary)/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                       >
                         <ChevronsRight className="w-4 h-4 -rotate-90" />
                       </button>
                       <button
                         onClick={(e) => { e.stopPropagation(); handleMovePlayer(idx, 'down'); }}
                         disabled={idx === gameState.players.length - 1}
                         className="p-0.5 rounded text-(--primary)/40 hover:text-(--primary) hover:bg-(--primary)/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                       >
                         <ChevronsRight className="w-4 h-4 rotate-90" />
                       </button>
                     </div>
                   )}
                   {/* Drag handle (desktop only, hidden in reorder mode) */}
                   {isHost && !reorderMode && (
                     <div className="text-(--on-surface-variant)/30 hover:text-(--on-surface-variant)/60 transition-colors shrink-0 hidden md:block">
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                     </div>
                   )}
                   {/* Seat number */}
                   <div className={`w-6 text-center text-[11px] font-bold shrink-0 ${reorderMode ? 'text-(--primary)/60' : 'text-(--on-surface-variant)/30'}`}>
                     {idx + 1}
                   </div>
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
                 <div className="flex items-center gap-2">
                   {/* Transfer host button — host can click on other players */}
                   {isHost && !player.isHost && player.status === 'connected' && (
                     <button
                       onClick={(e) => { e.stopPropagation(); handleTransferHost(player.userId); }}
                       className="p-1.5 rounded-full hover:bg-(--tertiary)/15 text-(--tertiary) transition-all cursor-pointer"
                       title="Chuyển Host"
                     >
                       <Shield className="w-4 h-4" />
                     </button>
                   )}
                   {player.isHost ? <Shield className="w-6 h-6 text-(--tertiary)/50 fill-(--tertiary)/20" /> : <CheckCircle2 className="w-6 h-6 text-(--primary)/30" />}
                 </div>
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
            &quot;Vận mệnh đan xen, tốt xấu lẫn lộn. Không ai biết trước ánh sáng hay bóng tối sẽ cai trị vùng đất Avalon này. Liệu niềm tin của bạn đã đặt đúng chỗ?&quot;
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
