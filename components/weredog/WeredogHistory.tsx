"use client";

import { useState } from "react";
import { Scroll, X, Eye, Shield } from "lucide-react";
import { type WeredogHistoryRecord } from "@/server/game/WeredogTypes";
import { type NightPlayer, type WeredogRoleName } from "./nightConstants";

interface WeredogHistoryProps {
  history: WeredogHistoryRecord[];
  myRole: WeredogRoleName;
  players: NightPlayer[];
  currentNightNumber: number;
  currentSeerTargetUserId?: string | null;
  currentSeerResult?: "Wolf" | "Human" | null;
  currentBodyguardTargetUserId?: string | null;
}

export default function WeredogHistory({
  history,
  myRole,
  players,
  currentNightNumber,
  currentSeerTargetUserId,
  currentSeerResult,
  currentBodyguardTargetUserId,
}: WeredogHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getPlayerName = (userId?: string | null) => {
    if (!userId) return "???";
    const p = players.find((x) => x.userId === userId);
    return p ? p.name : "Người chơi ẩn danh";
  };

  const isSeer = myRole === "Seer";
  const isBodyguard = myRole === "Bodyguard";

  // Hide for other roles as they don't have private historical results to track
  if (!isSeer && !isBodyguard) return null;

  // Build the log list
  const logs: { night: number; text: string; isWolf?: boolean; isHuman?: boolean }[] = [];

  // Add past history records
  history.forEach((h) => {
    if (isSeer && h.seerTargetUserId) {
      const name = getPlayerName(h.seerTargetUserId);
      const isWolf = h.seerResult === "Wolf";
      logs.push({
        night: h.nightNumber,
        text: `Soi ${name}: ${isWolf ? "Sói 🐺" : "Dân 🐕"}`,
        isWolf,
        isHuman: !isWolf,
      });
    } else if (isBodyguard && h.bodyguardTargetUserId) {
      const name = getPlayerName(h.bodyguardTargetUserId);
      logs.push({
        night: h.nightNumber,
        text: `Bảo vệ ${name} 🛡️`,
      });
    }
  });

  // Add current night action if active and set
  if (isSeer && currentSeerTargetUserId) {
    const name = getPlayerName(currentSeerTargetUserId);
    const isWolf = currentSeerResult === "Wolf";
    logs.push({
      night: currentNightNumber,
      text: `Soi ${name}: ${currentSeerResult ? (isWolf ? "Sói 🐺" : "Dân 🐕") : "Đang soi..."}`,
      isWolf: currentSeerResult ? isWolf : undefined,
      isHuman: currentSeerResult ? !isWolf : undefined,
    });
  } else if (isBodyguard && currentBodyguardTargetUserId) {
    const name = getPlayerName(currentBodyguardTargetUserId);
    logs.push({
      night: currentNightNumber,
      text: `Bảo vệ ${name} 🛡️`,
    });
  }

  // Sort logs by night descending (newest on top)
  logs.sort((a, b) => b.night - a.night);

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start animate-fade-in">
      {isOpen && (
        <div
          className="mb-2 w-72 rounded-lg shadow-2xl overflow-hidden"
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.95)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-2 flex items-center justify-between"
            style={{
              backgroundColor: "rgba(30, 41, 59, 0.8)",
              borderBottom: "1px solid rgba(148, 163, 184, 0.2)",
            }}
          >
            <div className="flex items-center gap-2">
              <Scroll size={16} className="text-amber-400" />
              <span className="text-sm font-medium text-gray-200">
                Lịch sử hành động ({isSeer ? "Tiên Tri" : "Bảo Vệ"})
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* List Area */}
          <div
            className="px-3 py-2 overflow-y-auto space-y-2 max-h-48"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(148, 163, 184, 0.3) transparent",
            }}
          >
            {logs.length === 0 ? (
              <div className="text-center text-gray-500 text-xs py-4">
                Chưa thực hiện hành động nào
              </div>
            ) : (
              logs.map((log, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-xs py-1.5 px-2.5 rounded border"
                  style={{
                    backgroundColor: log.isWolf
                      ? "rgba(220, 38, 38, 0.1)"
                      : log.isHuman
                      ? "rgba(16, 185, 129, 0.1)"
                      : "rgba(71, 85, 105, 0.2)",
                    borderColor: log.isWolf
                      ? "rgba(220, 38, 38, 0.3)"
                      : log.isHuman
                      ? "rgba(16, 185, 129, 0.3)"
                      : "rgba(148, 163, 184, 0.15)",
                  }}
                >
                  <span className="font-bold text-amber-400">Đêm {log.night}:</span>
                  <span
                    className="flex-1 text-gray-200 font-medium"
                    style={{
                      color: log.isWolf
                        ? "#f87171"
                        : log.isHuman
                        ? "#34d399"
                        : undefined,
                    }}
                  >
                    {log.text}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 relative pointer-events-auto"
        style={{
          backgroundColor: isSeer ? "rgba(168, 85, 247, 0.9)" : "rgba(59, 130, 246, 0.9)",
          border: isSeer
            ? "2px solid rgba(168, 85, 247, 0.4)"
            : "2px solid rgba(59, 130, 246, 0.4)",
        }}
        title="Xem lịch sử hành động"
      >
        {isSeer ? (
          <Eye size={20} className="text-white animate-pulse" />
        ) : (
          <Shield size={20} className="text-white" />
        )}
      </button>
    </div>
  );
}
