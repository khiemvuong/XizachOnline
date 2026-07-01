"use client";

import { useState, useMemo } from "react";
import NightPlayerCircle from "./NightPlayerCircle";
import Image from "next/image";
import WeredogHeader from "./WeredogHeader";

interface Player {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  isAlive: boolean;
  isHost: boolean;
  voteWeight?: number;
}

interface WeredogDayVotingProps {
  roomId?: string;
  dayNumber?: number;
  isHost: boolean;
  players: Player[];
  myUserId: string;
  isAlive: boolean;
  // Vote state
  votes?: Record<string, string>; // voterUserId -> targetUserId ("skip" or player userId)
  tiebreakerActive?: boolean;
  // Callbacks
  onVoteSubmit?: (targetUserId: string) => void;
  onHostConfirm?: () => void;
  onHostTiebreakDecide?: (action: "revote" | "skip") => void;
  onBack?: () => void;
}

export default function WeredogDayVoting({
  roomId,
  dayNumber = 1,
  isHost,
  players,
  myUserId,
  isAlive,
  votes = {},
  tiebreakerActive = false,
  onVoteSubmit,
  onHostConfirm,
  onHostTiebreakDecide,
  onBack,
}: WeredogDayVotingProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const myVote = votes[myUserId];
  const hasVoted = !!myVote;

  // Tally votes for display if voting is public or confirmed (scaled by voter weight)
  const voteCounts = useMemo(() => {
    const tallies: Record<string, number> = {};
    Object.entries(votes).forEach(([voterUserId, targetId]) => {
      if (targetId && targetId !== "skip") {
        const voter = players.find((p) => p.userId === voterUserId);
        const weight = voter?.voteWeight ?? 1;
        tallies[targetId] = (tallies[targetId] ?? 0) + weight;
      }
    });
    return tallies;
  }, [votes, players]);

  // Dead players and host cannot be target of voting (can vote for self)
  const disabledIds = useMemo(() => {
    return players
      .filter((p) => !p.isAlive || p.isHost)
      .map((p) => p.userId);
  }, [players]);

  const handleSelect = (userId: string) => {
    if (hasVoted) return;
    setSelectedId((prev) => (prev === userId ? null : userId));
  };

  const handleConfirmVote = () => {
    if (selectedId && onVoteSubmit) {
      onVoteSubmit(selectedId);
    }
  };

  // Decorate player names to show checkmark if they've voted
  const decoratedPlayers = useMemo(() => {
    return players.map((p) => {
      const hasPlayerVoted = !!votes[p.userId];
      let name = p.name;
      if (hasPlayerVoted) name += " ✓";
      if (p.userId === myUserId) name += " (Bạn)";
      return {
        ...p,
        name,
      };
    });
  }, [players, votes, myUserId]);

  const totalAlive = players.filter((p) => p.isAlive && !p.isHost).length;
  const votedCount = Object.keys(votes).length;



  // Render central action content
  const renderCenterContent = () => {
    if (tiebreakerActive && isHost) {
      return (
        <div className="w-full flex flex-col items-center justify-center gap-2 py-2 animate-fade-in text-center max-w-[280px]">
          <h1 
            className="font-gothic-label text-base sm:text-lg md:text-xl tracking-widest uppercase font-black select-none leading-tight mb-1 text-[#f43f5e] text-shadow-maroon"
            style={{ textShadow: "0 0 10px rgba(244,63,94,0.3), 0 2px 4px rgba(0,0,0,0.9)" }}
          >
            HÒA PHIẾU TREO CỔ
          </h1>
          <p className="font-gothic-body text-[#829ea2]/80 text-[10px] sm:text-xs leading-normal mb-2">
            Số phiếu bằng nhau! Hãy chọn cách giải quyết:
          </p>
          <div className="flex flex-col gap-2 w-full max-w-[200px] pointer-events-auto">
            <button
              onClick={() => onHostTiebreakDecide?.("revote")}
              className="px-3 py-1.5 bg-[#3b1c26] hover:bg-[#551c2e] border border-red-500/30 rounded text-[10px] uppercase font-gothic-label tracking-widest font-black transition-all hover:scale-[1.02] active:scale-95 cursor-pointer text-red-400"
            >
              Bỏ Phiếu Lại
            </button>
            <button
              onClick={() => onHostTiebreakDecide?.("skip")}
              className="px-3 py-1.5 bg-[#222a2f] hover:bg-[#2b353b] border border-[#445257]/50 rounded text-[10px] uppercase font-gothic-label tracking-widest font-black transition-all hover:scale-[1.02] active:scale-95 cursor-pointer text-[#829ea2]"
            >
              Bỏ Qua Treo Cổ
            </button>
          </div>
        </div>
      );
    }

    if (isHost) {
      return (
        <div className="w-full flex flex-col items-center justify-center gap-2 py-2 animate-fade-in text-center max-w-[280px]">
          <h1 
            className="font-gothic-label text-base sm:text-xl md:text-2xl tracking-widest uppercase font-black select-none leading-tight mb-1 text-shadow-maroon"
            style={{ 
              textShadow: "0 0 10px rgba(225,199,165,0.2), 0 2px 4px rgba(0,0,0,0.9)",
              color: "#e1c7a5"
            }}
          >
            QUẢN TRÒ
          </h1>
          <p className="font-gothic-body text-[#829ea2]/85 text-[10px] sm:text-xs leading-normal mb-1.5">
            Tiến độ bỏ phiếu: <span className="text-white font-mono font-bold">{votedCount}/{totalAlive}</span>
          </p>

          {onHostConfirm && (
            <div className="pointer-events-auto">
              <button
                onClick={onHostConfirm}
                disabled={votedCount < totalAlive}
                className={`relative w-[200px] h-[52px] transition-all duration-200 group ${
                  votedCount < totalAlive
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:scale-[1.03] active:scale-95 cursor-pointer"
                }`}
              >
                {/* Plaque SVG */}
                <svg
                  width="200"
                  height="32"
                  viewBox="0 0 200 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute top-[10px] left-0 drop-shadow-[0_3px_6px_rgba(0,0,0,0.5)]"
                >
                  <defs>
                    <linearGradient id="plaqueGradHostVote" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4d1b28" />
                      <stop offset="100%" stopColor="#250d14" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 12 2 L 188 2 L 194 8 L 194 10 L 200 16 L 194 22 L 194 24 L 188 30 L 12 30 L 6 24 L 6 22 L 0 16 L 6 10 L 6 8 Z"
                    fill="url(#plaqueGradHostVote)"
                    stroke="#cda372"
                    strokeWidth="1.5"
                  />
                </svg>

                {/* Button label */}
                <span
                  className="absolute left-0 w-[140px] text-center top-[26px] -translate-y-1/2 font-gothic-body text-xs sm:text-sm font-black uppercase tracking-wider select-none text-[#e1c7a5]"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
                >
                  XÁC NHẬN
                </span>

                {/* Wax seal */}
                <div
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#3b1c26] border border-[#5a1d2e] flex items-center justify-center shadow-[0_3px_8px_rgba(0,0,0,0.7)] overflow-hidden z-10 transition-all group-hover:shadow-[0_0_12px_rgba(205,163,114,0.4)]"
                >
                  <Image
                    src="/werewolf/logo.png"
                    alt="Seal"
                    width={44}
                    height={44}
                    className="w-full h-full object-cover"
                  />
                </div>
              </button>
            </div>
          )}
        </div>
      );
    }

    if (!isAlive) {
      return (
        <div className="w-full flex flex-col items-center justify-center gap-1.5 animate-fade-in text-center max-w-[280px]">
          <h1 
            className="font-gothic-label text-base sm:text-xl md:text-2xl tracking-widest uppercase font-black select-none leading-tight mb-1 text-red-500/80 text-shadow-maroon"
            style={{ textShadow: "0 0 10px rgba(220,38,38,0.2), 0 2px 4px rgba(0,0,0,0.9)" }}
          >
            BẠN ĐÃ CHẾT
          </h1>
          <p className="font-gothic-body text-[#829ea2]/75 text-[10px] sm:text-xs leading-normal italic">
            Hãy giữ im lặng và quan sát cuộc bỏ phiếu treo cổ của dân làng...
          </p>
        </div>
      );
    }

    if (hasVoted) {
      const votedPlayer = myVote !== "skip" ? players.find(p => p.userId === myVote) : null;
      return (
        <div className="w-full flex flex-col items-center justify-center gap-1.5 py-2 animate-fade-in text-center max-w-[280px]">
          <h1 
            className="font-gothic-label text-base sm:text-xl md:text-2xl tracking-widest uppercase font-black select-none leading-tight mb-1 text-emerald-400 text-shadow-maroon"
            style={{ textShadow: "0 0 10px rgba(16,185,129,0.2), 0 2px 4px rgba(0,0,0,0.9)" }}
          >
            ĐÃ BỎ PHIẾU
          </h1>
          <p className="font-gothic-body text-[#829ea2]/80 text-[10px] sm:text-xs leading-tight mb-1">
            Bạn đã chọn:{" "}
            <span className="text-white font-bold uppercase tracking-wider font-gothic-label">
              {votedPlayer ? votedPlayer.name : "Bỏ Qua Treo Cổ"}
            </span>
          </p>
          <button
            onClick={() => {
              onVoteSubmit?.("cancel");
              setSelectedId(null);
            }}
            className="px-4 py-1.5 rounded-full border border-amber-500/80 bg-[#1b1c22]/90 hover:bg-amber-500/20 text-amber-300 hover:text-white text-[10px] font-serif font-bold uppercase tracking-wider transition-all cursor-pointer mt-1 pointer-events-auto shadow-[0_2px_8px_rgba(245,158,11,0.2)]"
          >
            ❌ HỦY PHIẾU
          </button>
        </div>
      );
    }

    // Active Vote Input for Player
    return (
      <div className="w-full flex flex-col items-center justify-center gap-2 py-2 animate-fade-in text-center max-w-[280px]">
        <h1 
          className="font-gothic-label text-base sm:text-xl md:text-2xl tracking-widest uppercase font-black select-none leading-tight mb-1 text-shadow-maroon"
          style={{ 
            textShadow: "0 0 10px rgba(225,199,165,0.2), 0 2px 4px rgba(0,0,0,0.9)",
            color: "#e1c7a5"
          }}
        >
          TREO CỔ
        </h1>

        <div className="flex flex-col items-center gap-2 pointer-events-auto mt-1">
          {/* Skip voting toggle button */}
          <button
            onClick={() => setSelectedId(selectedId === "skip" ? null : "skip")}
            className={`px-3 py-1.5 border rounded-md text-[9px] sm:text-[10px] uppercase font-gothic-label tracking-widest font-black transition-all cursor-pointer hover:scale-105 active:scale-95 ${
              selectedId === "skip"
                ? "bg-amber-950/40 text-amber-400 border-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.25)]"
                : "bg-black/45 text-[#829ea2]/35 border-[#445257]/35 hover:text-[#829ea2]/70"
            }`}
          >
            Bỏ Qua Treo Cổ
          </button>

          {/* Confirm Vote Button */}
          <button
            onClick={handleConfirmVote}
            disabled={!selectedId}
            className="relative w-[220px] h-[52px] hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer group disabled:opacity-30 disabled:pointer-events-none mt-1"
          >
            {/* Plaque SVG */}
            <svg
              width="220"
              height="32"
              viewBox="0 0 220 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute top-[10px] left-0 drop-shadow-[0_3px_6px_rgba(0,0,0,0.5)]"
            >
              <defs>
                <linearGradient id="plaqueGradConfirmVote" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4d1b28" />
                  <stop offset="100%" stopColor="#250d14" />
                </linearGradient>
              </defs>
              <path
                d="M 12 2 L 208 2 L 214 8 L 214 10 L 220 16 L 214 22 L 214 24 L 208 30 L 12 30 L 6 24 L 6 22 L 0 16 L 6 10 L 6 8 Z"
                fill="url(#plaqueGradConfirmVote)"
                stroke="#cda372"
                strokeWidth="1.5"
              />
            </svg>

            {/* Button label */}
            <span
              className="absolute left-5 top-[26px] -translate-y-1/2 font-gothic-body text-xs font-black uppercase tracking-wider select-none text-[#e1c7a5]"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
            >
              BỎ PHIẾU TREO CỔ
            </span>

            {/* Wax seal */}
            <div
              className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#3b1c26] border border-[#5a1d2e] flex items-center justify-center shadow-[0_3px_8px_rgba(0,0,0,0.7)] overflow-hidden z-10 transition-all group-hover:shadow-[0_0_12px_rgba(205,163,114,0.4)]"
            >
              <Image
                src="/werewolf/logo.png"
                alt="Seal"
                width={44}
                height={44}
                className="w-full h-full object-cover"
              />
            </div>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="relative w-full h-full flex flex-col justify-between bg-cover bg-center overflow-hidden select-none"
      style={{ backgroundImage: "url('/werewolf/weredog-lobby-bg.jpeg')" }}
    >
      {/* Daylight vignette - slightly brighter but atmospheric */}
      <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-black/75 pointer-events-none z-10" />

      {/* Main Container */}
      <div className="relative z-20 w-full h-full flex flex-col justify-between flex-1">
        {/* Header bar */}
        <WeredogHeader roomId={roomId} title={`Bỏ Phiếu Treo Cổ — Ngày ${dayNumber}`} onBack={onBack} />
        
        {/* Main Content Area (Split into Left Sidebar and Right Player Circle side-by-side) */}
        <div className="flex-1 w-full flex flex-row items-center justify-between px-6 py-4 gap-6 overflow-hidden">
          
          {/* Left Sidebar: Public Votes (Relative flex item, no longer absolute) */}
          <div className="w-[160px] h-full bg-[#111318]/95 border border-[#cda372]/20 rounded-lg p-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.85)] z-40 flex flex-col select-none pointer-events-auto shrink-0">
            <span className="font-serif text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#e1c7a5] border-b border-[#cda372]/20 pb-1 mb-2 block text-center">
              Danh sách bỏ phiếu
            </span>
            <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#cda372]/20 scrollbar-track-transparent space-y-2">
              {players
                .filter((p) => p.isAlive && !p.isHost)
                .map((p) => {
                  const targetId = votes[p.userId];
                  const targetPlayer = targetId
                    ? targetId === "skip"
                      ? { name: "Bỏ qua" }
                      : players.find((x) => x.userId === targetId)
                    : null;
                  const isElder = p.voteWeight && p.voteWeight > 1;

                  return (
                    <div
                      key={p.userId}
                      className="flex items-center justify-between border-b border-[#445257]/10 pb-1 text-[9px] sm:text-[10px] font-serif uppercase tracking-wider font-bold w-full"
                      style={{ color: targetPlayer ? (targetId === "skip" ? "#829ea2" : "#f43f5e") : "#445257" }}
                    >
                      <span className="text-[#e1c7a5] truncate max-w-[50px]" title={p.name}>
                        {p.name}
                        {isElder && <span className="text-amber-400 text-[8px] ml-0.5 font-bold">(x2)</span>}
                      </span>
                      <span className="opacity-40 font-normal mx-0.5">→</span>
                      <span 
                        className={`truncate max-w-[50px] text-right ${targetPlayer ? "text-white font-black" : "italic text-[#445257]/50"}`}
                        title={targetPlayer ? targetPlayer.name : "Đang chọn..."}
                      >
                        {targetPlayer ? targetPlayer.name : "..."}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Right Area: Player Circle (Flex-1) */}
          <div className="flex-1 h-full relative overflow-hidden flex items-center justify-center">
            <div className="w-full h-full flex flex-col justify-center items-center relative">
              <NightPlayerCircle
                players={decoratedPlayers}
                selectedIds={selectedId && selectedId !== "skip" ? [selectedId] : []}
                onSelectPlayer={isAlive && !hasVoted && !isHost ? handleSelect : undefined}
                disabledIds={disabledIds}
                showVotes={voteCounts}
                highlightColor="#e1c7a5"
                glowColor="rgba(225,199,165,0.4)"
                myUserId={myUserId}
                centerContent={renderCenterContent()}
                minScale={0.95}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
