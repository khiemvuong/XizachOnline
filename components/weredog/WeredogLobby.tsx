"use client";

import { Settings, Users } from "lucide-react";

interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
}

interface WeredogLobbyProps {
  roomId: string;
  players: Player[];
  onStartGame?: () => void;
}

const SLOT_POSITIONS = [
  { left: "50%", top: "16%" },   // 1. Luna (Top Center)
  { left: "33%", top: "22%" },   // 2. Buster (Top Left)
  { left: "67%", top: "22%" },   // 3. Rocky (Top Right)
  { left: "18%", top: "34%" },   // 4. Zoe (Upper Left)
  { left: "82%", top: "34%" },   // 5. Chloe (Upper Right)
  { left: "15%", top: "54%" },   // 6. Winston (Middle Left)
  { left: "85%", top: "54%" },   // 7. Duke (Middle Right)
  { left: "20%", top: "75%" },   // 8. Zoe 2 (Lower Left)
  { left: "80%", top: "75%" },   // 9. Daisy (Lower Right)
];

export default function WeredogLobby({ roomId, players, onStartGame }: WeredogLobbyProps) {
  // Map players to slots
  // We fill the slots up to players.length, other slots remain empty frames
  return (
    <div 
      className="relative w-full h-[88vh] md:h-[80vh] rounded-xl overflow-hidden bg-cover bg-center border border-[#445257]/30 shadow-2xl flex flex-col justify-between"
      style={{ backgroundImage: "url('/Image/weredog-lobby-bg.jpeg')" }}
    >
      {/* Dark Vignette Overlay to ensure text readability */}
      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />

      {/* Main Interactive Stage */}
      <div className="relative flex-1 w-full h-full select-none">
        
        {/* Game Title Logo (matches image, positioned to overlay nicely) */}
        <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]">
          <h1 className="font-gothic-heading text-[#cdd6d8] text-4xl md:text-5xl tracking-[0.15em] uppercase font-bold text-shadow-maroon">
            Werewolf
          </h1>
          <p className="font-gothic-heading text-[#829ea2] text-xl md:text-2xl tracking-[0.25em] uppercase mt-2 font-medium">
            Dog Village
          </p>
        </div>

        {/* Start Game wax-seal button */}
        {onStartGame && (
          <button
            onClick={onStartGame}
            className="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 px-10 py-3 bg-[#3b1c26] border-2 border-[#5a1d2e] rounded-full text-[#829ea2] hover:text-white hover:bg-[#551c2e] hover:shadow-[0_0_20px_rgba(59,28,38,0.8)] transition-all font-gothic-heading text-sm font-bold uppercase tracking-widest cursor-pointer shadow-2xl active:scale-95"
            style={{ textShadow: "0 0 8px rgba(130, 158, 162, 0.6)" }}
          >
            Start Game
          </button>
        )}

        {/* Player Slots Circular Layout */}
        {SLOT_POSITIONS.map((pos, index) => {
          const player = players[index];
          const hasPlayer = !!player;

          return (
            <div
              key={index}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-300"
              style={{ left: pos.left, top: pos.top }}
            >
              {/* Avatar circular frame */}
              <div 
                className={`w-20 h-20 rounded-full border-2 bg-[#222a2f]/20 backdrop-blur-[2px] flex items-center justify-center text-3xl transition-all ${
                  hasPlayer 
                    ? "border-[#829ea2] shadow-[0_0_15px_rgba(130,158,162,0.3)] bg-[#222a2f]/60" 
                    : "border-[#445257] hover:border-[#445257]/80"
                }`}
              >
                {hasPlayer ? (
                  <span className="animate-fade-in">{player.avatar}</span>
                ) : (
                  <span className="text-transparent">?</span>
                )}
              </div>

              {/* Player Name below slot */}
              <div 
                className={`mt-2 font-gothic-body text-sm font-semibold tracking-wide transition-all ${
                  hasPlayer ? "text-[#cdd6d8]" : "text-[#445257]/60"
                }`}
                style={{ textShadow: hasPlayer ? "0 2px 4px rgba(0,0,0,0.8)" : "none" }}
              >
                {hasPlayer ? player.name : "Waiting..."}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom UI Bar */}
      <div className="relative z-10 w-full bg-[#0b0d11]/90 border-t border-[#445257]/30 px-6 py-3 flex items-center justify-between font-gothic-ui text-[11px] text-[#445257] tracking-wider select-none uppercase font-bold">
        <div className="flex items-center gap-1.5">
          <span>Room Code:</span>
          <span className="text-[#829ea2] font-mono font-black tracking-widest">{roomId}</span>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-[#445257]" />
            <span>Player Count:</span>
            <span className="text-[#829ea2] font-black">{players.length} / 12</span>
          </div>

          <button className="hover:text-[#829ea2] transition-colors cursor-pointer" aria-label="Settings">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
