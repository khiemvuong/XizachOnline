"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useScreenWakeLock from "@/hooks/useScreenWakeLock";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import PlayerProfileModal from "@/components/shared/PlayerProfileModal";
import { useWeredogStore } from "./store/useWeredogStore";

// Import sub-components
import WeredogLobby from "./WeredogLobby";
import WeredogRoleReveal from "./WeredogRoleReveal";
import WeredogNight from "./WeredogNight";
import WeredogDayStart from "./WeredogDayStart";
import WeredogDayVoting from "./WeredogDayVoting";
import WeredogGameOver from "./WeredogGameOver";
import { type WeredogRoleName, type NightPlayer, type RoleDisplayConfig, ROLE_DISPLAY } from "./nightConstants";

const EMOJIS = ["🐶", "🐺", "🦊", "🦁", "🐯", "🐼", "🐻", "🐨", "🐸", "🐔", "🐧", "🐦"];
function getFallbackAvatar(name: string, index: number): string {
  let code = 0;
  for (let i = 0; i < name.length; i++) {
    code += name.charCodeAt(i);
  }
  return EMOJIS[(code + index) % EMOJIS.length];
}

export default function WeredogShell({ roomId }: { roomId: string }) {
  const { profile, updateProfile } = usePlayerProfile();
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Zustand Store binding
  const {
    gameState,
    userId,
    updateProfile: syncProfileOnServer,
    startGame,
    playerReady,
    updateSettings,
    wolfVote,
    wolfRevote,
    bodyguardProtect,
    seerInspect,
    hunterAim,
    cupidPair,
    witchChooseAction,
    witchUsePotion,
    hostConfirmNightAction,
    startDayVoting,
    dayVote,
    hostConfirmDayVote,
    hostTiebreakerDecision,
    returnToLobby,
    transferHost,
  } = useWeredogStore();

  const router = useRouter();
  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState(false);
  const [isLandscape, setIsLandscape] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const handleBack = () => {
    if (gameState && gameState.state !== "LOBBY") {
      setShowLeaveConfirmModal(true);
    } else {
      useWeredogStore.getState().disconnect();
      router.push("/weredog");
    }
  };

  const handleConfirmLeave = () => {
    setShowLeaveConfirmModal(false);
    const me = gameState?.players.find((p) => p.userId === userId);
    if (me?.isHost) {
      returnToLobby();
    } else {
      useWeredogStore.getState().disconnect();
      router.push("/weredog");
    }
  };

  // Sync WebSocket connection on profile or roomId change
  const { name: profileNameStr, avatarUrl: profileAvatarUrlStr } = profile;
  useEffect(() => {
    useWeredogStore.getState().connect(roomId, { name: profileNameStr, avatarUrl: profileAvatarUrlStr });
    return () => {
      useWeredogStore.getState().disconnect();
    };
  }, [roomId, profileNameStr, profileAvatarUrlStr]);

  useScreenWakeLock({
    enabled: isMobile,
    mobileOnly: false,
  });

  useEffect(() => {
    const update = () => {
      const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
      const noHover = window.matchMedia("(hover: none)").matches;
      const smallViewport = Math.min(window.innerWidth, window.innerHeight) <= 900;
      const touchCapable = navigator.maxTouchPoints > 0 || "ontouchstart" in window;
      const isiPhone = /iPhone/i.test(navigator.userAgent);
      setIsMobile((smallViewport && (coarsePointer || noHover || touchCapable)) || isiPhone);
      setIsLandscape(window.matchMedia("(orientation: landscape)").matches);
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  // Display loading spinner while connecting/waiting for initial state
  if (!gameState) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#0b0d11] text-[#829ea2] font-serif">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#cda372]/30 border-t-[#cda372] rounded-full animate-spin" />
          <p className="text-sm uppercase tracking-widest font-bold">Đang kết nối đến máy chủ...</p>
        </div>
      </div>
    );
  }

  // Derive me (current player in gameState)
  const me = gameState.players.find((p) => p.userId === userId);
  const isHost = me?.isHost || false;
  const myRole = me?.role || "Villager";

  // Derive active players mapped with fallback avatar emoji
  const onlinePlayers = gameState.players.map((p, idx) => ({
    id: p.id,
    userId: p.userId,
    name: p.name,
    avatar: getFallbackAvatar(p.name, idx),
    avatarUrl: p.avatarUrl || null,
    isHost: p.isHost,
    isSpectator: p.isSpectator,
    isReady: p.isReady,
    isAlive: p.isAlive,
    role: p.role,
    elderLives: p.elderLives,
    isLover: p.isLover,
    loverUserId: p.loverUserId,
  }));

  // Setup derived visible players (with role frames resolved)
  const visiblePlayers: NightPlayer[] = onlinePlayers.map((p) => {
    let frameType: RoleDisplayConfig["frameType"] | undefined = undefined;
    if (isHost || p.userId === userId) {
      frameType = p.role ? ROLE_DISPLAY[p.role]?.frameType : undefined;
    } else if (me?.role === "Wolf" && p.role === "Wolf") {
      frameType = "wolf";
    } else if (me?.role === "Seer" && gameState.history) {
      const record = gameState.history.find((h) => h.seerTargetUserId === p.userId);
      if (record && record.seerResult) {
        frameType = record.seerResult === "Wolf" ? "wolf" : "shiba";
      }
    }
    return {
      ...p,
      visibleFrameType: frameType,
    };
  });

  const stateNum =
    gameState.state === "LOBBY" ? 1 :
    gameState.state === "ROLE_REVEAL" ? 2 :
    gameState.state === "NIGHT_ACTION" ? 3 :
    gameState.state === "DAY_START" ? 4 :
    gameState.state === "DAY_VOTING" ? 5 :
    gameState.state === "GAME_OVER" ? 6 : 1;

  const isLobby = stateNum === 1;

  const shellClass = [
    "weredog-theme",
    "weredog-vignette",
    "relative",
    "w-full",
    "flex",
    "flex-col",
    "justify-between",
    "font-gothic-body",
    isLobby ? "min-h-screen overflow-y-auto" : "h-dvh overflow-hidden weredog-orientation-lock",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className={shellClass}>
      {/* Mobile Orientation Blocker */}
      {isMobile && !isLandscape && (
        <div className="weredog-orientation-blocker font-gothic-ui">
          <div className="weredog-orientation-card">
            <div className="text-4xl text-[#829ea2] animate-pulse">↻</div>
            <h2 className="mt-4 text-lg font-bold uppercase tracking-wider text-white">
              Xoay ngang điện thoại
            </h2>
            <p className="mt-2 text-sm text-[#829ea2]/80 leading-relaxed">
              Giao diện Weredog tối ưu cho landscape để hiển thị đầy đủ bảng vai trò và giao tiếp đêm.
            </p>
          </div>
        </div>
      )}

      {/* Main viewport scale container */}
      <div className="flex-1 w-full flex flex-col justify-between overflow-hidden relative">
        <div className="flex-1 w-full flex flex-col items-center justify-center p-2 relative overflow-hidden">
          {stateNum === 1 && (
            <WeredogLobby
              roomId={roomId}
              wolfCount={gameState.settings.wolfCount}
              selectedRoles={gameState.settings.enabledRoles}
              onUpdateSettings={updateSettings}
              onStartGame={startGame}
              profileAvatarUrl={profile.avatarUrl}
              profileName={profile.name}
              onOpenProfile={() => setShowProfileModal(true)}
              myUserId={userId}
              onBack={handleBack}
              isHost={isHost}
              players={onlinePlayers}
              onTransferHost={transferHost}
            />
          )}

          {stateNum === 2 && (
            <WeredogRoleReveal
              myRole={myRole}
              onReady={playerReady}
              roomId={roomId}
              readyCount={gameState.players.filter(p => p.isReady).length}
              totalPlayers={gameState.players.filter(p => !p.isSpectator && !p.isHost).length}
              hasClickedReady={me?.isReady || false}
              onBack={handleBack}
              isHost={isHost}
              players={onlinePlayers}
            />
          )}

          {stateNum === 3 && (
            <WeredogNight
              players={visiblePlayers}
              myUserId={userId}
              myRole={myRole}
              isHost={isHost}
              roomId={roomId}
              currentActiveRole={gameState.currentNightActiveRole as WeredogRoleName}
              nightNumber={gameState.nightNumber}
              roleIndex={gameState.currentNightRoleIndex}
              activeNightRoles={gameState.activeNightRolesOrder as WeredogRoleName[]}
              wolfVotes={gameState.wolfVotes}
              wolfVictimUserId={gameState.wolfVictimUserId}
              lastProtectedUserId={me?.protectedLastNightUserId}
              bodyguardTargetUserId={gameState.bodyguardTargetUserId}
              seerTargetUserId={gameState.seerTargetUserId}
              seerResult={gameState.seerResult}
              witchActionSelected={gameState.witchActionSelected}
              witchTargetUserId={gameState.witchTargetUserId}
              hunterTargetUserId={gameState.hunterTargetUserId}
              cupidLoverUserIds={gameState.cupidLoverUserIds}
              witchHasSave={me?.witchHasSaveBottle ?? true}
              witchHasKill={me?.witchHasKillBottle ?? true}
              isElderDead={gameState.isElderDead}
              onWolfVote={wolfVote}
              onWolfRevote={wolfRevote}
              onBodyguardProtect={bodyguardProtect}
              onSeerInspect={seerInspect}
              onHunterAim={hunterAim}
              onCupidPair={cupidPair}
              onWitchChooseAction={witchChooseAction}
              onWitchUsePotion={witchUsePotion}
              onHostConfirm={hostConfirmNightAction}
              onBack={handleBack}
            />
          )}

          {stateNum === 4 && (
            <WeredogDayStart
              roomId={roomId}
              dayNumber={gameState.nightNumber}
              isHost={isHost}
              players={visiblePlayers}
              deathsThisNight={gameState.deathsThisNight}
              onStartVoting={startDayVoting}
              onBack={handleBack}
            />
          )}

          {stateNum === 5 && (
            <WeredogDayVoting
              roomId={roomId}
              dayNumber={gameState.nightNumber}
              isHost={isHost}
              players={visiblePlayers}
              myUserId={userId}
              isAlive={me?.isAlive ?? true}
              votes={gameState.dayVotes}
              onVoteSubmit={dayVote}
              onHostConfirm={hostConfirmDayVote}
              onHostTiebreakDecide={(action) => hostTiebreakerDecision(action === "skip" ? "skip" : "revote")}
              onBack={handleBack}
            />
          )}

          {stateNum === 6 && (
            <WeredogGameOver
              winner={gameState.winner || "Villager"}
              players={onlinePlayers}
              roomId={roomId}
              onRestart={returnToLobby}
              onBack={handleBack}
            />
          )}
        </div>
      </div>

      {showLeaveConfirmModal && (
        <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-[#0b0d11] border border-[#5a1d2e]/50 rounded-xl shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute -top-[120px] left-1/2 -translate-x-1/2 w-[240px] h-[150px] bg-red-900/20 blur-[60px] rounded-full pointer-events-none" />

            <h3 className="font-serif italic font-extrabold text-[#e1c7a5] text-lg uppercase tracking-wide mb-2 drop-shadow-md">
              {isHost ? "Rời Phòng & Hủy Trận?" : "Thoát Khỏi Trận Đấu?"}
            </h3>
            <p className="font-serif italic text-[#829ea2]/90 text-xs leading-relaxed mb-6">
              {isHost
                ? "Bạn là Quản trò. Nếu bạn rời phòng, trận đấu đang diễn ra sẽ bị hủy và toàn bộ người chơi khác sẽ được đưa trở lại phòng chờ (Lobby)."
                : "Bạn đang tham gia trận đấu. Nếu bạn rời đi bây giờ, bạn sẽ bị ngắt kết nối khỏi phòng chơi và mất quyền tham gia trận này."}
            </p>
            <div className="flex items-center justify-end gap-3 pointer-events-auto">
              <button
                onClick={() => setShowLeaveConfirmModal(false)}
                className="px-4 py-2 rounded bg-[#222a2f] border border-[#445257]/40 text-[#829ea2] text-xs font-bold font-serif uppercase tracking-wider hover:bg-[#3b1c26]/20 hover:text-white transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmLeave}
                className="px-4 py-2 rounded bg-[#3b1c26] border border-[#5a1d2e] text-red-200 text-xs font-bold font-serif uppercase tracking-wider hover:bg-red-800/80 hover:text-white hover:shadow-[0_0_12px_rgba(220,38,38,0.3)] transition-all cursor-pointer"
              >
                Xác Nhận Rời
              </button>
            </div>
          </div>
        </div>
      )}

      <PlayerProfileModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        name={profile.name}
        avatarUrl={profile.avatarUrl}
        userId={userId}
        onSave={(name, avatarUrl) => {
          updateProfile({ name, avatarUrl });
          syncProfileOnServer(name, avatarUrl);
          setShowProfileModal(false);
        }}
        themeClass="weredog-theme"
      />
    </main>
  );
}
