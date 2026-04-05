"use client";

import { useState } from "react";
import { CheckCircle2, Crown, ShieldAlert, XCircle } from "lucide-react";
import { type AvalonPlayer, type AvalonRoom } from "@/server/game/AvalonTypes";

export default function VoteOutcomeOverlay({ gameState, me }: { gameState: AvalonRoom; me?: AvalonPlayer }) {
  const outcome = gameState.voteOutcome;

  const [isOpen, setIsOpen] = useState(true);

  if (!outcome) return null;

  const isQuestOutcome = outcome.kind === "quest";
  const statusStyleByResult = {
    approve: {
      title: "Team Approved",
      accentClass: "text-emerald-300",
      barClass: "bg-emerald-400/60",
      pillClass: "bg-emerald-500/18 border-emerald-400/40 text-emerald-200",
      icon: <CheckCircle2 className="h-8 w-8" />,
    },
    reject: {
      title: "Team Rejected",
      accentClass: "text-amber-300",
      barClass: "bg-amber-400/60",
      pillClass: "bg-amber-500/18 border-amber-400/40 text-amber-200",
      icon: <XCircle className="h-8 w-8" />,
    },
    success: {
      title: "Quest Success",
      accentClass: "text-cyan-300",
      barClass: "bg-cyan-400/60",
      pillClass: "bg-cyan-500/18 border-cyan-400/40 text-cyan-200",
      icon: <CheckCircle2 className="h-8 w-8" />,
    },
    fail: {
      title: "Quest Failed",
      accentClass: "text-rose-300",
      barClass: "bg-rose-500/60",
      pillClass: "bg-rose-500/18 border-rose-400/40 text-rose-200",
      icon: <ShieldAlert className="h-8 w-8" />,
    },
  } as const;

  const statusStyle = statusStyleByResult[outcome.result];
  const title = statusStyle.title;

  const subtitle = isQuestOutcome
    ? outcome.result === "success"
      ? "Nhiệm vụ đã được hoàn thành. Hành trình tiếp tục."
      : "Nhiệm vụ thất bại. Bóng tối vừa ghi thêm một dấu ấn."
    : outcome.result === "approve"
      ? "Đề cử được thông qua. Đội nhiệm vụ đã sẵn sàng."
      : "Đề cử bị bác bỏ. Quyền thủ lĩnh sẽ chuyển sang người kế tiếp.";

  const accentClass = statusStyle.accentClass;
  const barClass = statusStyle.barClass;
  const detailVisible =
    typeof outcome.totalVotes === "number" ||
    typeof outcome.approveCount === "number" ||
    typeof outcome.failCount === "number";

  const boardLabel = isQuestOutcome ? "Kết quả nhiệm vụ" : "Kết quả bỏ phiếu đội";

  return (
    <div className="avalon-vote-outcome-shell pointer-events-none absolute inset-0 z-70 px-4 pt-4 md:pt-6">
      <div className="mx-auto flex w-full max-w-2xl justify-center">
        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          className={`avalon-vote-outcome-toggle pointer-events-auto inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${statusStyle.pillClass}`}
        >
          {outcome.result === "approve" || outcome.result === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : outcome.result === "fail" ? (
            <ShieldAlert className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {boardLabel}
          <span className="text-[9px] opacity-80">{isOpen ? "Ẩn" : "Hiện"}</span>
        </button>
      </div>

      {isOpen && (
        <div className="avalon-vote-outcome-card mx-auto mt-3 w-full max-w-2xl rounded-2xl border border-outline-variant/40 bg-surface-container-low/92 px-5 py-4 shadow-[0_0_45px_rgba(0,0,0,0.45)] backdrop-blur-md md:px-6 pointer-events-auto">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className={`text-[10px] uppercase tracking-[0.34em] font-label ${accentClass}`}>
              {isQuestOutcome ? "QUEST OUTCOME" : "COUNCIL OUTCOME"}
            </p>
            {detailVisible && (
              <div className="inline-flex items-center gap-2 rounded-full bg-surface-container-high/70 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
                <Crown className="h-3.5 w-3.5" />
                {me?.userId === outcome.leaderUserId ? "Chi tiết cho Thủ Lĩnh" : "Kết quả công khai"}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className={`shrink-0 ${accentClass}`}>{statusStyle.icon}</div>
            <div className="min-w-0">
              <h3 className={`avalon-vote-outcome-title font-headline text-2xl uppercase tracking-[0.12em] ${accentClass}`}>{title}</h3>
              <p className="avalon-vote-outcome-subtitle text-sm text-on-surface-variant">{subtitle}</p>
            </div>
          </div>

          <div className={`mt-3 h-1 w-full rounded-full ${barClass}`}></div>

          {detailVisible ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em]">
              {isQuestOutcome ? (
                <>
                  <span className="rounded-md border border-cyan-400/35 bg-cyan-500/12 px-2 py-1 text-cyan-200">
                    Success: {outcome.successCount ?? 0}
                  </span>
                  <span className="rounded-md border border-rose-400/35 bg-rose-500/12 px-2 py-1 text-rose-200">
                    Fail: {outcome.failCount ?? 0}
                  </span>
                </>
              ) : (
                <>
                  <span className="rounded-md border border-emerald-400/35 bg-emerald-500/12 px-2 py-1 text-emerald-200">
                    Approve: {outcome.approveCount ?? 0}
                  </span>
                  <span className="rounded-md border border-amber-400/35 bg-amber-500/12 px-2 py-1 text-amber-200">
                    Reject: {outcome.rejectCount ?? 0}
                  </span>
                </>
              )}
              {typeof outcome.totalVotes === "number" && (
                <span className="rounded-md border border-outline-variant/45 bg-surface-container-high/40 px-2 py-1 text-on-surface-variant">
                  Votes: {outcome.totalVotes}
                </span>
              )}
            </div>
          ) : (
            <div className="mt-3 text-xs uppercase tracking-[0.22em] text-on-surface-variant">
              Kết quả đã được chốt
            </div>
          )}
        </div>
      )}
    </div>
  );
}