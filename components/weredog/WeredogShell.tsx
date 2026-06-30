"use client";

import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import useScreenWakeLock from "@/hooks/useScreenWakeLock";

// Import sub-components
import WeredogLobby from "./WeredogLobby";
import WeredogRoleReveal from "./WeredogRoleReveal";
import WeredogNight from "./WeredogNight";
import WolfVoteUI from "./WolfVoteUI";
import WitchPotionUI from "./WitchPotionUI";
import CupidUI from "./CupidUI";
import BodyguardUI from "./BodyguardUI";
import HunterUI from "./HunterUI";
import SeerUI from "./SeerUI";
import WeredogDayStart from "./WeredogDayStart";
import WeredogDayVoting from "./WeredogDayVoting";
import WeredogGameOver from "./WeredogGameOver";

type RoleName = "Wolf" | "Bodyguard" | "Seer" | "Hunter" | "Cupid" | "Witch" | "Elder" | "Villager";

const MOCK_PLAYERS = [
  { id: "1", name: "Buster", avatar: "🐶", isHost: true },
  { id: "2", name: "Luna", avatar: "🐕", isHost: false },
  { id: "3", name: "Rocky", avatar: "🦮", isHost: false },
  { id: "4", name: "Zoe", avatar: "🐕‍🦺", isHost: false },
  { id: "5", name: "Chloe", avatar: "🐩", isHost: false },
  { id: "6", name: "Winston", avatar: "🐺", isHost: false },
  { id: "7", name: "Duke", avatar: "🐾", isHost: false },
  { id: "8", name: "Zoe", avatar: "🐕", isHost: false },
  { id: "9", name: "Daisy", avatar: "🦴", isHost: false },
];

export default function WeredogShell({ roomId }: { roomId: string }) {
  const [stateNum, setStateNum] = useState<number>(1);
  const [myRole, setMyRole] = useState<RoleName>("Seer");
  const [nightRoleIndex, setNightRoleIndex] = useState<number>(0);
  const [gameOverWinner, setGameOverWinner] = useState<string>("Villager");

  const [isLandscape, setIsLandscape] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const activeNightRoles: RoleName[] = ["Cupid", "Bodyguard", "Wolf", "Seer", "Witch", "Hunter"];

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

  const isLobby = stateNum === 1;

  const shellClass = [
    "weredog-theme",
    "weredog-vignette",
    "relative",
    "w-full",
    "flex",
    "flex-col",
    "justify-between",
    "py-6",
    "px-4",
    "sm:px-8",
    "font-gothic-body",
    isLobby ? "min-h-screen" : "weredog-orientation-lock",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className={shellClass}>
      {/* Mobile Orientation Blocker (Only triggers if mobile and in portrait orientation) */}
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
      <div className={`w-full flex-1 flex flex-col justify-between ${isMobile && !isLandscape ? "invisible" : ""}`}>
        
        {/* DEV CONTROLLER: State Switched Panel */}
        <div className="z-50 w-full max-w-3xl mx-auto mb-4 bg-[#222a2f] border border-[#445257] rounded-lg p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg font-gothic-ui">
          <span className="text-xs font-bold text-[#829ea2] flex items-center gap-1.5 uppercase">
            <Settings className="h-4 w-4" /> Dev Controller:
          </span>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                onClick={() => setStateNum(num)}
                className={`px-3 py-1 text-xs rounded font-bold uppercase transition-all ${
                  stateNum === num
                    ? "bg-[#3b1c26] text-white border border-[#5a1d2e]"
                    : "bg-[#0b0d11] text-[#829ea2] hover:bg-[#0b0d11]/80"
                }`}
              >
                {["Lobby", "Reveal", "Night", "Day Start", "Voting", "Over"][num - 1]}
              </button>
            ))}
          </div>

          {/* Context Switchers */}
          {stateNum === 2 && (
            <div className="flex gap-1 text-[10px]">
              <span className="text-[#829ea2]/60 self-center mr-1">Role:</span>
              {(["Seer", "Wolf", "Villager"] as RoleName[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setMyRole(r)}
                  className={`px-1.5 py-0.5 rounded border ${myRole === r ? "border-[#829ea2] text-white" : "border-[#445257] text-[#829ea2]/60"}`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          {stateNum === 3 && (
            <div className="flex gap-1 text-[10px]">
              <span className="text-[#829ea2]/60 self-center mr-1">Waking:</span>
              {activeNightRoles.map((role, idx) => (
                <button
                  key={role}
                  onClick={() => setNightRoleIndex(idx)}
                  className={`px-1.5 py-0.5 rounded border ${nightRoleIndex === idx ? "border-[#829ea2] text-white" : "border-[#445257] text-[#829ea2]/60"}`}
                >
                  {role}
                </button>
              ))}
            </div>
          )}

          {stateNum === 6 && (
            <div className="flex gap-1 text-[10px]">
              <span className="text-[#829ea2]/60 self-center mr-1">Winner:</span>
              {["Villager", "Wolf", "Cupid"].map((w) => (
                <button
                  key={w}
                  onClick={() => setGameOverWinner(w)}
                  className={`px-1.5 py-0.5 rounded border ${gameOverWinner === w ? "border-[#829ea2] text-white" : "border-[#445257] text-[#829ea2]/60"}`}
                >
                  {w}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Outer Border Decor (Lobby has scrolling layout, others are fixed height) */}
        {!isLobby && (
          <div className="pointer-events-none absolute inset-4 border border-[#445257]/20 border-double rounded" />
        )}

        {/* Main Content Area */}
        <div className={`relative z-10 w-full max-w-4xl mx-auto my-auto ${isLobby ? "py-4" : "h-full flex flex-col justify-center"}`}>
          {stateNum === 1 && (
            <WeredogLobby 
              roomId={roomId} 
              players={MOCK_PLAYERS} 
              onStartGame={() => setStateNum(2)} 
            />
          )}

          {stateNum === 2 && (
            <WeredogRoleReveal myRole={myRole} onReady={() => setStateNum(3)} />
          )}

          {stateNum === 3 && (
            <WeredogNight currentRole={activeNightRoles[nightRoleIndex]}>
              {activeNightRoles[nightRoleIndex] === "Cupid" && <CupidUI />}
              {activeNightRoles[nightRoleIndex] === "Bodyguard" && <BodyguardUI />}
              {activeNightRoles[nightRoleIndex] === "Wolf" && <WolfVoteUI />}
              {activeNightRoles[nightRoleIndex] === "Seer" && <SeerUI />}
              {activeNightRoles[nightRoleIndex] === "Witch" && <WitchPotionUI />}
              {activeNightRoles[nightRoleIndex] === "Hunter" && <HunterUI />}
            </WeredogNight>
          )}

          {stateNum === 4 && (
            <WeredogDayStart onStartVoting={() => setStateNum(5)} />
          )}

          {stateNum === 5 && (
            <WeredogDayVoting />
          )}

          {stateNum === 6 && (
            <WeredogGameOver winner={gameOverWinner} onRestart={() => setStateNum(1)} />
          )}
        </div>
      </div>
    </main>
  );
}
