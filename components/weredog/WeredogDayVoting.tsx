"use client";

import { useState, useMemo, useRef } from "react";
import { useSceneScale } from "@/hooks/useSceneScale";
import NightPlayerCircle from "./NightPlayerCircle";
import NightActionPanel from "./NightActionPanel";
import Image from "next/image";
import WeredogHeader from "./WeredogHeader";

interface Player {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  isAlive: boolean;
  isHost: boolean;
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
}: WeredogDayVotingProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const scale = useSceneScale({
    viewportRef: containerRef,
    sceneWidth: 800,
    sceneHeight: 380,
    padding: 4,
    minScale: 0.4,
    maxScale: 2.2,
  });

  const myVote = votes[myUserId];
  const hasVoted = !!myVote;

  // Tally votes for display if voting is public or confirmed
  const voteCounts = useMemo(() => {
    const tallies: Record<string, number> = {};
    Object.values(votes).forEach((targetId) => {
      if (targetId && targetId !== "skip") {
        tallies[targetId] = (tallies[targetId] ?? 0) + 1;
      }
    });
    return tallies;
  }, [votes]);

  // Dead players, host, and self cannot be target of voting
  const disabledIds = useMemo(() => {
    return players
      .filter((p) => !p.isAlive || p.isHost || p.userId === myUserId)
      .map((p) => p.userId);
  }, [players, myUserId]);

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
      return {
        ...p,
        name: hasPlayerVoted ? `${p.name} ✓` : p.name,
      };
    });
  }, [players, votes]);

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
                className="relative w-[200px] h-[52px] hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer group"
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
        <div className="w-full flex flex-col items-center justify-center gap-1.5 animate-fade-in text-center max-w-[280px]">
          <h1 
            className="font-gothic-label text-base sm:text-xl md:text-2xl tracking-widest uppercase font-black select-none leading-tight mb-1 text-emerald-400 text-shadow-maroon"
            style={{ textShadow: "0 0 10px rgba(16,185,129,0.2), 0 2px 4px rgba(0,0,0,0.9)" }}
          >
            ĐÃ BỎ PHIẾU
          </h1>
          <p className="font-gothic-body text-[#829ea2]/80 text-[10px] sm:text-xs leading-tight">
            Bạn đã chọn:{" "}
            <span className="text-white font-bold uppercase tracking-wider font-gothic-label">
              {votedPlayer ? votedPlayer.name : "Bỏ Qua Treo Cổ"}
            </span>
          </p>
          <p className="font-gothic-body text-[#445257] text-[9px] sm:text-[10px] italic leading-tight mt-1 animate-pulse">
            Đang đợi quản trò chốt kết quả...
          </p>
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
            className="relative w-[200px] h-[52px] hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer group disabled:opacity-30 disabled:pointer-events-none mt-1"
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
                <linearGradient id="plaqueGradConfirmVote" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4d1b28" />
                  <stop offset="100%" stopColor="#250d14" />
                </linearGradient>
              </defs>
              <path
                d="M 12 2 L 188 2 L 194 8 L 194 10 L 200 16 L 194 22 L 194 24 L 188 30 L 12 30 L 6 24 L 6 22 L 0 16 L 6 10 L 6 8 Z"
                fill="url(#plaqueGradConfirmVote)"
                stroke="#cda372"
                strokeWidth="1.5"
              />
            </svg>

            {/* Button label */}
            <span
              className="absolute left-0 w-[140px] text-center top-[26px] -translate-y-1/2 font-gothic-body text-xs sm:text-sm font-black uppercase tracking-wider select-none text-[#e1c7a5]"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
            >
              BỎ PHIẾU
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
        <WeredogHeader roomId={roomId} title="Bỏ Phiếu Treo Cổ" />

        {/* Main Content Area */}
        <div ref={containerRef} className="flex-1 w-full relative overflow-hidden flex items-center justify-center">
          <div className="w-full h-full flex flex-col justify-center items-center relative">
            <NightPlayerCircle
              players={decoratedPlayers}
              selectedIds={selectedId && selectedId !== "skip" ? [selectedId] : []}
              onSelectPlayer={isAlive && !hasVoted && !isHost ? handleSelect : undefined}
              disabledIds={disabledIds}
              showVotes={voteCounts}
              highlightColor="#e1c7a5"
              glowColor="rgba(225,199,165,0.4)"
              centerContent={renderCenterContent()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
