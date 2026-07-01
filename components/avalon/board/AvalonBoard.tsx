"use client";

import { AvalonPlayer, AvalonRoom } from "@/server/game/AvalonTypes";
import { useEffect, useState, useRef, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import RoleReveal from "../RoleReveal";
import RoundTable from "../RoundTable";
import VotingCards from "../VotingCards";
import SkillDecisionOverlay from "../SkillDecisionOverlay";
import AssassinationUI from "../assassination/AssassinationUI";
import GameOver from "../game-over/GameOver";
import EarlyEndOverlay from "../EarlyEndOverlay";
import VoteOutcomeOverlay from "../VoteOutcomeOverlay";
import RulesModal from "../RulesModal";
import MyRoleModal from "../MyRoleModal";
import SharedChatDropdown, { type ChatTheme } from "@/components/shared/ChatDropdown";
import VoiceChatPanel from "../VoiceChatPanel";
import MinionCinematicOverlays from "../MinionCinematicOverlays";
import { AlertTriangle, X, Moon } from "lucide-react";

import { useAvalonAudio } from "@/hooks/useAvalonAudio";
import AvalonEntryScreen from "./AvalonEntryScreen";
import AvalonLobby from "./AvalonLobby";
import AvalonAssetPreloader from "../AvalonAssetPreloader";
import PhaseTransitionOverlay from "./PhaseTransitionOverlay";
import { AnimatePresence, motion } from "framer-motion";
import AvalonTopBar from "./AvalonTopBar";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import PlayerProfileModal from "@/components/shared/PlayerProfileModal";

export default function AvalonBoard({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<AvalonRoom | null>(null);
  const [hasJoined, setHasJoined] = useState(false);

  // Modals & Overlays state
  const [showRules, setShowRules] = useState(false);
  const [showNameEditModal, setShowNameEditModal] = useState(false);
  const { profile, updateProfile } = usePlayerProfile();
  const [showMyRole, setShowMyRole] = useState(false);
  const [isRoleHidden, setIsRoleHidden] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [playerPings, setPlayerPings] = useState<Record<string, number>>({});

  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatText, setChatText] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();

  // Audio state & refs
  const [isLobbyMusicEnabled, setIsLobbyMusicEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("avalon_lobby_music_enabled") !== "0";
  });
  const winAudioRef = useRef<HTMLAudioElement | null>(null);
  const loseAudioRef = useRef<HTMLAudioElement | null>(null);

  const { playRaiseHandChime, unlockAudio } = useAvalonAudio({
    gamePhase: gameState?.state,
    gameWinner: gameState?.winner,
    isLobbyMusicEnabled,
    winAudioRef,
    loseAudioRef,
  });

  const initialized = useRef(false);
  const previousRaisedIdsRef = useRef<Set<string>>(new Set());
  const hasRaiseSnapshotRef = useRef(false);

  // Setup initial random ID if none found
  useEffect(() => {
    if (!localStorage.getItem("avalon_userId")) {
      localStorage.setItem("avalon_userId", Math.random().toString(36).substr(2, 9));
    }
  }, []);

  // Save Audio Setting
  useEffect(() => {
    localStorage.setItem("avalon_lobby_music_enabled", isLobbyMusicEnabled ? "1" : "0");
  }, [isLobbyMusicEnabled]);

  // Handle Joining
  useEffect(() => {
    if (!hasJoined || initialized.current) return;
    initialized.current = true;

    const userId = localStorage.getItem("avalon_userId")!;
    
    // Connect specifically to the /avalon namespace
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "";
    const socketio = io(`${socketUrl}/avalon`, {
      reconnectionDelayMax: 10000,
    });

    socketio.on("connect", () => {
      setSocket(socketio);
      const nameToUse = profile.name || `Knight_${Math.floor(Math.random() * 1000)}`;
      socketio.emit("joinRoom", { roomId, playerName: nameToUse, userId, avatarUrl: profile.avatarUrl });
    });

    socketio.on("avalonGameState", (state: AvalonRoom) => {
      setGameState(state);
    });

    socketio.on("playerPing", (userId: string, ping: number) => {
      setPlayerPings((prev) => ({ ...prev, [userId]: ping }));
    });

    return () => {
      socketio.disconnect();
      initialized.current = false;
    };
  }, [hasJoined, roomId, profile.name, profile.avatarUrl]);

  // Handle external rule open
  useEffect(() => {
    const handleOpenRules = () => setShowRules(true);
    window.addEventListener("avalon-open-rules", handleOpenRules);
    return () => window.removeEventListener("avalon-open-rules", handleOpenRules);
  }, []);

  // Watch Hand Raises
  useEffect(() => {
    if (!gameState) return;

    if (gameState.state === "LOBBY" || gameState.state === "GAME_OVER") {
      previousRaisedIdsRef.current = new Set();
      hasRaiseSnapshotRef.current = false;
      return;
    }

    const currentlyRaisedIds = new Set(
      gameState.players
        .filter((player) => player.status === "connected" && player.isHandRaised)
        .map((player) => player.userId)
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

  // Handle Chat Send
  const handleSendChat = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      if (!chatText.trim() || !socket) return;
      socket.emit("chatMessage", chatText.trim());
      setChatText("");
    },
    [chatText, socket]
  );

  // Scroll to bottom when messages arrive
  useEffect(() => {
    if (showChat) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [gameState?.messages?.length, showChat]);

  // ─── Render Entry Screen ───
  if (!hasJoined) {
    return (
      <>
        <AvalonAssetPreloader />
        <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
        <AvalonEntryScreen
          onRulesClick={() => setShowRules(true)}
          onOpenProfile={() => setShowNameEditModal(true)}
          profile={profile}
          onJoin={() => {
            unlockAudio();
            setHasJoined(true);
          }}
        />
      </>
    );
  }

  // ─── Render Loading Screen ───
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

  // Helper variables (Derived from gameState to keep Topbar/Modals instantly snappy)
  const userId = localStorage.getItem("avalon_userId")!;
  const me = gameState?.players.find((p: AvalonPlayer) => p.userId === userId);
  const isSpectator = Boolean(me?.isSpectator);
  const isHandRaised = Boolean(me?.isHandRaised);
  const isHost = me?.isHost ?? false;
  const isLobby = gameState?.state === "LOBBY";
  const isGameOver = gameState?.state === "GAME_OVER";

  const handleBackButton = () => {
    if (isLobby || isGameOver) {
      router.push("/avalon");
      return;
    }
    // Mid-game: confirm before doing anything
    setShowResetConfirm(true);
  };

  const handleToggleRaiseHand = () => {
    if (!socket || !me) return;
    socket.emit("toggleRaiseHand", !Boolean(me.isHandRaised));
  };

  const AVALON_CHAT_THEME: ChatTheme = {
    surface: "rgba(8,16,30,0.95)",
    border: "color-mix(in srgb, var(--primary) 20%, transparent)",
    accent: "var(--primary)",
    textPrimary: "var(--on-surface)",
    textMuted: "var(--on-surface-variant)",
  };

  return (
    <div className={`avalon-theme h-dvh min-h-0 overflow-hidden flex flex-col w-full relative z-0`}>
      <AvalonAssetPreloader />
      {gameState && <PhaseTransitionOverlay gameState={gameState} />}

      {/* Background */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: "url('/avalon_roles/background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "scroll",
        }}
      >
        <div className="absolute inset-0 bg-surface-dim-avalon/70 backdrop-blur-[2px]"></div>
      </div>

      <AvalonTopBar
        me={me}
        socket={socket}
        isHost={isHost}
        isSpectator={isSpectator}
        isLobby={isLobby}
        isGameOver={isGameOver}
        isRoleHidden={isRoleHidden}
        isHandRaised={isHandRaised}
        isLobbyMusicEnabled={isLobbyMusicEnabled}
        setIsLobbyMusicEnabled={setIsLobbyMusicEnabled}
        setIsRoleHidden={setIsRoleHidden}
        setShowNameEditModal={setShowNameEditModal}
        setShowRules={setShowRules}
        setShowMyRole={setShowMyRole}
        handleBackButton={handleBackButton}
        handleToggleRaiseHand={handleToggleRaiseHand}
      />

      {/* Early End Overlay */}
      {gameState.earlyEndVotes &&
        gameState.earlyEndVotes.length > 0 &&
        gameState.state !== "GAME_OVER" &&
        !isSpectator && (
          <EarlyEndOverlay gameState={gameState} userId={userId} socket={socket} />
        )}

      {/* Phases Routing */}
      <AnimatePresence mode="wait">
        <motion.div
          key={gameState.state}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex-1 flex flex-col w-full relative min-h-0 overflow-y-auto overflow-x-hidden"
        >
          {gameState.state === "LOBBY" && (
            <AvalonLobby
              gameState={gameState}
              me={me}
              socket={socket}
              roomId={roomId}
              playerPings={playerPings}
              setPlayerPings={setPlayerPings}
              onOpenProfile={() => setShowNameEditModal(true)}
            />
          )}

          {gameState.state === "ROLE_REVEAL" ? (
            me && me.role && !me.isSpectator ? (
              <RoleReveal
                gameState={gameState}
                me={me}
                onReady={() => socket?.emit("playerReady")}
                roomId={roomId}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-6 relative z-10 w-full h-full px-4 text-center">
                <div className="w-24 h-24 rounded-full bg-(--surface-container-high)/50 border border-(--primary)/30 flex items-center justify-center shadow-[0_0_30px_rgba(131,195,163,0.15)] relative">
                  <Moon className="w-10 h-10 text-(--primary) animate-pulse relative z-10" />
                  <div className="absolute inset-0 rounded-full border border-(--primary)/10 scale-[1.2]"></div>
                  <div className="absolute inset-0 rounded-full border border-(--primary)/5 scale-[1.4]"></div>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-white tracking-widest uppercase shadow-black drop-shadow-lg">
                  Mọi người đang ngủ...
                </h1>
                <p className="text-xs sm:text-sm font-medium text-(--on-surface-variant)/70 uppercase tracking-[0.25em]">
                  Góc nhìn Khán Giả
                </p>
              </div>
            )
          ) : null}

          {/* Fallback Error Phase */}
          {!me && gameState.state !== "LOBBY" && (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 z-10 text-center px-6">
              <div className="w-16 h-16 rounded-full border border-(--primary)/30 flex items-center justify-center">
                <span className="text-3xl animate-pulse">⚔️</span>
              </div>
              <div className="space-y-2">
                <h2 className="font-headline text-2xl text-(--primary) uppercase tracking-widest">
                  Phiên Bản Lỗi
                </h2>
                <p className="text-(--on-surface-variant) text-sm italic max-w-sm">
                  Không tìm thấy dữ liệu người chơi của bạn. Hãy thử tải lại trang.
                </p>
              </div>
              <button
                onClick={() => router.push("/avalon")}
                className="px-6 py-2.5 rounded-xl bg-(--primary)/10 border border-(--primary)/30 text-(--primary) font-headline text-sm uppercase tracking-widest hover:bg-(--primary)/20 transition-colors cursor-pointer"
              >
                Nhập Mã Phòng Khác
              </button>
            </div>
          )}

          {/* Main Game Interface */}
          {gameState.state !== "LOBBY" &&
            gameState.state !== "ROLE_REVEAL" &&
            gameState.state !== "GAME_OVER" &&
            gameState.state !== "ASSASSINATION" &&
            me && (
              <>
                <RoundTable
                  gameState={gameState}
                  me={me}
                  socket={socket}
                  roomId={roomId}
                  isRoleHidden={isRoleHidden}
                  isReadOnly={isSpectator}
                  playerPings={playerPings}
                />
                <VotingCards gameState={gameState} me={me} socket={socket} isReadOnly={isSpectator} />
                {gameState.state === "SKILL_DECISION" && (
                  <SkillDecisionOverlay
                    gameState={gameState}
                    me={me}
                    socket={socket}
                    isReadOnly={isSpectator}
                  />
                )}
              </>
            )}

          {gameState.state === "ASSASSINATION" && me && (
            <AssassinationUI gameState={gameState} me={me} socket={socket} />
          )}

          {gameState.state === "GAME_OVER" && me && (
            <GameOver
              gameState={gameState}
              me={me}
              socket={socket}
              winAudioRef={winAudioRef}
              loseAudioRef={loseAudioRef}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {me &&
        gameState.state !== "ASSASSINATION" &&
        gameState.state !== "GAME_OVER" && (
          <VoteOutcomeOverlay gameState={gameState} me={me} />
        )}

      {me && <MinionCinematicOverlays gameState={gameState} me={me} />}

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

      {/* Name Edit Modal -> Replaced with Profile Modal */}
      <PlayerProfileModal
        open={showNameEditModal}
        onClose={() => setShowNameEditModal(false)}
        name={me?.name || ""}
        avatarUrl={me?.avatarUrl ?? null}
        userId={userId}
        onSave={(newName, newAvatarUrl) => {
          updateProfile({ name: newName, avatarUrl: newAvatarUrl });
          if (socket) {
            socket.emit("changeName", newName);
            socket.emit("updateAvatar", newAvatarUrl);
          }
          setShowNameEditModal(false);
        }}
      />

      {me && !isSpectator && (
        <MyRoleModal isOpen={showMyRole} onClose={() => setShowMyRole(false)} gameState={gameState} me={me} />
      )}

      {/* Host Reset Confirm Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-surface-dim-avalon border border-(--primary)/30 shadow-2xl p-6 flex flex-col gap-6 relative">
            <button
              onClick={() => setShowResetConfirm(false)}
              className="absolute top-4 right-4 text-(--on-surface-variant)/50 hover:text-(--secondary) transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-(--secondary) font-headline text-lg sm:text-xl uppercase tracking-widest border-b border-(--outline-variant)/30 pb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Cảnh báo
            </h3>
            <p className="text-(--on-surface-variant) text-sm sm:text-base leading-relaxed text-center sm:text-left">
              {isHost ? (
                <>
                  Bạn là trưởng phòng. Nếu quay về,{" "}
                  <strong className="text-amber-500">ván chơi đang diễn ra sẽ bị huỷ</strong> và đưa
                  tất cả mọi người trở lại sảnh chờ.
                </>
              ) : (
                <>Bạn có chắc chắn muốn rời khỏi phòng không?</>
              )}
              <br />
              <br />
              Bạn có chắc chắn muốn tiếp tục?
            </p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 rounded-xl font-headline font-semibold text-sm uppercase tracking-wider text-(--on-surface-variant) bg-(--surface-container-high) hover:bg-(--surface-container-highest) transition-colors cursor-pointer border border-(--outline-variant)/50"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (isHost) {
                    socket?.emit("returnToLobby");
                  } else {
                    router.push("/avalon");
                  }
                  setShowResetConfirm(false);
                }}
                className="flex-1 py-3 rounded-xl font-headline font-extrabold text-sm uppercase tracking-wider bg-amber-500 text-black hover:bg-amber-400 transition-colors shadow-lg cursor-pointer"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Chat — always available after joining */}
      {me && (
        <VoiceChatPanel
          roomId={roomId}
          userId={userId}
          playerName={me.name}
          players={gameState.players
            .filter((p) => p.status === "connected")
            .map((p) => ({ userId: p.userId, name: p.name }))}
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
          onToggleChat={() => setShowChat((p) => !p)}
          onCloseChat={() => setShowChat(false)}
          onChatTextChange={setChatText}
          onSendChat={handleSendChat}
        />
      )}
    </div>
  );
}
