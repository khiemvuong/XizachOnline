"use client";

import { useState, useEffect } from "react";
import useScreenWakeLock from "@/hooks/useScreenWakeLock";

// Import sub-components
import WeredogLobby from "./WeredogLobby";
import WeredogRoleReveal from "./WeredogRoleReveal";
import WeredogNight from "./WeredogNight";
import WeredogDayStart from "./WeredogDayStart";
import WeredogDayVoting from "./WeredogDayVoting";
import WeredogGameOver from "./WeredogGameOver";
import { type WeredogRoleName, type NightPlayer } from "./nightConstants";

// ─── Mock Data ───

const MOCK_PLAYERS: NightPlayer[] = [
  { id: "1", userId: "u1", name: "Buster", avatar: "🐶", isAlive: true, isHost: true, role: undefined },
  { id: "2", userId: "u2", name: "Luna", avatar: "🐕", isAlive: true, isHost: false, role: "Wolf", visibleFrameType: "wolf" },
  { id: "3", userId: "u3", name: "Rocky", avatar: "🦮", isAlive: true, isHost: false, role: "Wolf", visibleFrameType: "wolf" },
  { id: "4", userId: "u4", name: "Zoe", avatar: "🐕‍🦺", isAlive: true, isHost: false, role: "Seer", visibleFrameType: "owl" },
  { id: "5", userId: "u5", name: "Chloe", avatar: "🐩", isAlive: true, isHost: false, role: "Bodyguard", visibleFrameType: "shield" },
  { id: "6", userId: "u6", name: "Winston", avatar: "🐺", isAlive: false, isHost: false, role: "Villager", visibleFrameType: "shiba" },
  { id: "7", userId: "u7", name: "Duke", avatar: "🐾", isAlive: true, isHost: false, role: "Hunter", visibleFrameType: "crown" },
  { id: "8", userId: "u8", name: "Daisy", avatar: "🦴", isAlive: true, isHost: false, role: "Witch", visibleFrameType: "potion" },
  { id: "9", userId: "u9", name: "Max", avatar: "🐕", isAlive: true, isHost: false, role: "Cupid", visibleFrameType: "rose" },
];

const LOBBY_PLAYERS = MOCK_PLAYERS.map(p => ({
  id: p.id,
  name: p.name,
  avatar: p.avatar,
  isHost: p.isHost,
}));

type ViewAs = "host" | WeredogRoleName;
const VIEW_OPTIONS: { value: ViewAs; label: string }[] = [
  { value: "host", label: "🎮 Host (Quản trò)" },
  { value: "Wolf", label: "🐺 Sói" },
  { value: "Bodyguard", label: "🛡️ Bảo Vệ" },
  { value: "Seer", label: "🔮 Tiên Tri" },
  { value: "Hunter", label: "🎯 Thợ Săn" },
  { value: "Cupid", label: "💘 Cupid" },
  { value: "Witch", label: "🧪 Phù Thủy" },
  { value: "Villager", label: "🐕 Dân Làng" },
];

const ACTIVE_NIGHT_ROLES: WeredogRoleName[] = ["Cupid", "Bodyguard", "Wolf", "Seer", "Witch", "Hunter"];

export default function WeredogShell({ roomId }: { roomId: string }) {
  const [stateNum, setStateNum] = useState<number>(1);
  const [myRole, setMyRole] = useState<WeredogRoleName>("Seer");
  const [nightRoleIndex, setNightRoleIndex] = useState<number>(0);
  const [gameOverWinner, setGameOverWinner] = useState<string>("Villager");
  const [viewAs, setViewAs] = useState<ViewAs>("host");
  const [debugOpen, setDebugOpen] = useState(false);
  const [mockVotes, setMockVotes] = useState<Record<string, string>>({});

  const [isLandscape, setIsLandscape] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Simulate some initial votes from other players in Day Voting
  useEffect(() => {
    if (stateNum === 5) {
      setMockVotes({
        u2: "u4",
        u3: "u4",
        u5: "skip",
      });
    } else if (stateNum === 1) {
      setMockVotes({});
    }
  }, [stateNum]);

  const { supported: wakeLockSupported } = useScreenWakeLock({
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

  // Derive mock identity based on viewAs
  const isHost = viewAs === "host";
  const mockMyUserId = isHost
    ? "u1" // Host is player u1
    : MOCK_PLAYERS.find(p => p.role === viewAs)?.userId ?? "u4";
  const mockMyRole = isHost ? undefined : (viewAs as WeredogRoleName);

  // Adjust visible frame types based on viewAs (simulate role-based visibility)
  const visiblePlayers: NightPlayer[] = MOCK_PLAYERS.map(p => {
    if (isHost) return p; // Host sees everything
    if (p.userId === mockMyUserId) return p; // See own frame
    // Seer can see inspected players (mock: show all for demo)
    if (viewAs === "Seer") return p;
    // Wolf can see other wolves
    if (viewAs === "Wolf" && p.role === "Wolf") return p;
    // Others don't see role frames
    return { ...p, visibleFrameType: undefined };
  });

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
      {/* Debug Dropdown — Absolute positioned, doesn't take layout space */}
      <div className="fixed top-2 right-2 z-[100] font-gothic-ui">
        <button
          onClick={() => setDebugOpen(!debugOpen)}
          className="w-7 h-7 rounded-full bg-[#222a2f]/90 border border-[#445257]/50 text-[#829ea2] text-xs flex items-center justify-center hover:bg-[#3b1c26] transition-colors cursor-pointer backdrop-blur-sm"
          title="Debug Panel"
        >
          ⚙
        </button>

        {debugOpen && (
          <div className="absolute top-9 right-0 w-56 bg-[#0b0d11]/95 backdrop-blur-md border border-[#445257]/40 rounded-lg shadow-2xl p-3 space-y-3 text-[10px] animate-fade-in">
            <div className="text-[#829ea2]/50 uppercase tracking-widest font-bold text-[9px] border-b border-[#445257]/20 pb-1">
              Debug Controls
            </div>

            {/* State selector */}
            <div className="space-y-1">
              <label className="text-[#829ea2]/60 uppercase tracking-widest">State</label>
              <div className="flex flex-wrap gap-1">
                {[
                  { n: 1, label: "Lobby" },
                  { n: 2, label: "Reveal" },
                  { n: 3, label: "Night" },
                  { n: 4, label: "Day" },
                  { n: 5, label: "Vote" },
                  { n: 6, label: "Over" },
                ].map(({ n, label }) => (
                  <button
                    key={n}
                    onClick={() => setStateNum(n)}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                      stateNum === n
                        ? "border-[#829ea2] text-white bg-[#829ea2]/20"
                        : "border-[#445257]/30 text-[#445257] hover:text-[#829ea2]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Night role selector */}
            {stateNum === 3 && (
              <div className="space-y-1">
                <label className="text-[#829ea2]/60 uppercase tracking-widest">Night Role</label>
                <div className="flex flex-wrap gap-1">
                  {ACTIVE_NIGHT_ROLES.map((role, i) => (
                    <button
                      key={role}
                      onClick={() => setNightRoleIndex(i)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                        nightRoleIndex === i
                          ? "border-[#829ea2] text-white bg-[#829ea2]/20"
                          : "border-[#445257]/30 text-[#445257] hover:text-[#829ea2]"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* View-as selector */}
            {stateNum === 3 && (
              <div className="space-y-1">
                <label className="text-[#829ea2]/60 uppercase tracking-widest">View As</label>
                <select
                  value={viewAs}
                  onChange={e => setViewAs(e.target.value as ViewAs)}
                  className="w-full bg-[#222a2f] border border-[#445257]/40 rounded px-2 py-1 text-[10px] text-[#cdd6d8] cursor-pointer focus:outline-none focus:border-[#829ea2]/50"
                >
                  {VIEW_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* My Role selector (for Role Reveal) */}
            {stateNum === 2 && (
              <div className="space-y-1">
                <label className="text-[#829ea2]/60 uppercase tracking-widest">My Role</label>
                <select
                  value={myRole}
                  onChange={e => setMyRole(e.target.value as WeredogRoleName)}
                  className="w-full bg-[#222a2f] border border-[#445257]/40 rounded px-2 py-1 text-[10px] text-[#cdd6d8] cursor-pointer focus:outline-none focus:border-[#829ea2]/50"
                >
                  {(["Wolf", "Bodyguard", "Seer", "Hunter", "Cupid", "Witch", "Elder", "Villager"] as WeredogRoleName[]).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

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
            <p className="mt-3 text-[10px] uppercase tracking-widest text-[#829ea2]/50">
              {wakeLockSupported
                ? "Màn hình sẽ được giữ sáng tự động khi vào game."
                : "Không hỗ trợ tự động khóa tắt màn hình."}
            </p>
          </div>
        </div>
      )}

      {/* Main Game Interface Wrapper */}
      <div className={`w-full h-full flex-1 flex flex-col justify-between weredog-game-container ${isMobile && !isLandscape ? "invisible" : ""}`}>

        {/* Outer Border Decor */}
        {!isLobby && (
          <div className="pointer-events-none absolute inset-4 border border-[#445257]/20 border-double rounded" />
        )}

        {/* Main Content Area */}
        <div className="relative z-10 w-full h-full flex flex-col justify-between flex-1">
          {stateNum === 1 && (
            <WeredogLobby
              roomId={roomId}
              players={LOBBY_PLAYERS}
              onStartGame={() => setStateNum(2)}
            />
          )}

           {stateNum === 2 && (
            <WeredogRoleReveal myRole={myRole} onReady={() => setStateNum(3)} roomId={roomId} />
          )}

          {stateNum === 3 && (
            <WeredogNight
              players={visiblePlayers}
              myUserId={mockMyUserId}
              myRole={mockMyRole}
              isHost={isHost}
              roomId={roomId}
              currentActiveRole={ACTIVE_NIGHT_ROLES[nightRoleIndex]}
              nightNumber={1}
              roleIndex={nightRoleIndex}
              totalRoles={ACTIVE_NIGHT_ROLES.length}
              activeNightRoles={ACTIVE_NIGHT_ROLES}
              wolfVotes={{}}
              witchHasSave={true}
              witchHasKill={true}
              onWolfVote={(id) => console.log("[Mock] Wolf vote:", id)}
              onWolfRevote={() => console.log("[Mock] Wolf revote")}
              onBodyguardProtect={(id) => console.log("[Mock] Bodyguard protect:", id)}
              onSeerInspect={(id) => console.log("[Mock] Seer inspect:", id)}
              onHunterAim={(id) => console.log("[Mock] Hunter aim:", id)}
              onCupidPair={(a, b) => console.log("[Mock] Cupid pair:", a, b)}
              onWitchChooseAction={(act) => console.log("[Mock] Witch action:", act)}
              onWitchUsePotion={(id) => console.log("[Mock] Witch potion:", id)}
              onHostConfirm={() => {
                console.log("[Mock] Host confirmed role:", ACTIVE_NIGHT_ROLES[nightRoleIndex]);
                if (nightRoleIndex < ACTIVE_NIGHT_ROLES.length - 1) {
                  setNightRoleIndex(nightRoleIndex + 1);
                } else {
                  setStateNum(4);
                }
              }}
            />
          )}

          {stateNum === 4 && (
            <WeredogDayStart
              roomId={roomId}
              isHost={isHost}
              players={visiblePlayers}
              deathsThisNight={["u6"]}
              onStartVoting={() => setStateNum(5)}
            />
          )}

          {stateNum === 5 && (
            <WeredogDayVoting
              roomId={roomId}
              isHost={isHost}
              players={visiblePlayers}
              myUserId={mockMyUserId}
              isAlive={MOCK_PLAYERS.find(p => p.userId === mockMyUserId)?.isAlive ?? true}
              votes={mockVotes}
              onVoteSubmit={(id) => setMockVotes(prev => ({ ...prev, [mockMyUserId]: id }))}
              onHostConfirm={() => setStateNum(6)}
              onHostTiebreakDecide={(action) => {
                console.log("[Mock] Tiebreak decide:", action);
                setStateNum(6);
              }}
            />
          )}

          {stateNum === 6 && (
            <WeredogGameOver
              winner={gameOverWinner}
              players={MOCK_PLAYERS}
              roomId={roomId}
              onRestart={() => setStateNum(1)}
            />
          )}
        </div>
      </div>
    </main>
  );
}
