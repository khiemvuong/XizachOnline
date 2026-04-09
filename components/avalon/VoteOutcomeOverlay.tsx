"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ShieldAlert, XCircle, ChevronDown, ChevronUp, X } from "lucide-react";
import { type AvalonPlayer, type AvalonRoom } from "@/server/game/AvalonTypes";

type VoteOutcome = NonNullable<AvalonRoom["voteOutcome"]>;

function createOutcomeKey(outcome: VoteOutcome): string {
  return `${outcome.kind}-${outcome.result}-${outcome.approveCount ?? 0}-${outcome.rejectCount ?? 0}-${outcome.successCount ?? 0}-${outcome.failCount ?? 0}`;
}

export default function VoteOutcomeOverlay({ gameState }: { gameState: AvalonRoom; me?: AvalonPlayer }) {
  const outcome = gameState.voteOutcome;

  if (!outcome) return null;

  return <VoteOutcomeOverlayContent key={createOutcomeKey(outcome)} outcome={outcome} />;
}

function VoteOutcomeOverlayContent({ outcome }: { outcome: VoteOutcome }) {
  const [expanded, setExpanded] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setExpanded(false), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  if (dismissed) return null;

  const isQuestOutcome = outcome.kind === "quest";

  const styles = {
    approve: {
      pill: "bg-emerald-950/85 border-emerald-500/50 text-emerald-300",
      icon: <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />,
      label: "Thông Qua",
      detail: `✓ ${outcome.approveCount ?? 0}  ✗ ${outcome.rejectCount ?? 0}`,
    },
    reject: {
      pill: "bg-amber-950/85 border-amber-500/50 text-amber-300",
      icon: <XCircle className="h-3.5 w-3.5 shrink-0" />,
      label: "Bác Bỏ",
      detail: `✓ ${outcome.approveCount ?? 0}  ✗ ${outcome.rejectCount ?? 0}`,
    },
    success: {
      pill: "bg-cyan-950/85 border-cyan-500/50 text-cyan-300",
      icon: <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />,
      label: "Thành Công",
      detail: `✓ ${outcome.successCount ?? 0}  ✗ ${outcome.failCount ?? 0}`,
    },
    fail: {
      pill: "bg-rose-950/85 border-rose-500/50 text-rose-300",
      icon: <ShieldAlert className="h-3.5 w-3.5 shrink-0" />,
      label: "Thất Bại",
      detail: `✓ ${outcome.successCount ?? 0}  ✗ ${outcome.failCount ?? 0}`,
    },
  } as const;

  const s = styles[outcome.result];

  return (
    <div className="avalon-vote-outcome-shell pointer-events-none absolute top-0 left-0 right-0 z-70 flex justify-center pt-2 px-3">
      <div className="inline-flex items-center gap-1">
        {/* Main pill */}
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className={`
            avalon-vote-outcome-toggle pointer-events-auto
            inline-flex items-center gap-1.5 rounded-full border
            px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]
            backdrop-blur-md shadow-lg transition-all duration-200
            ${s.pill}
          `}
        >
          {s.icon}
          {s.label}
          <span className="opacity-60 font-mono text-[9px] ml-0.5">{s.detail}</span>
          {expanded
            ? <ChevronUp className="h-3 w-3 opacity-50" />
            : <ChevronDown className="h-3 w-3 opacity-50" />
          }
        </button>

        {/* Dismiss button — hides until next round */}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="pointer-events-auto rounded-full border border-white/15 bg-black/60 backdrop-blur-md p-1 hover:bg-white/15 transition-colors"
          title="Ẩn cho tới lượt tiếp theo"
        >
          <X className="h-3 w-3 text-white/60" />
        </button>
      </div>

      {/* Expanded detail — small card */}
      {expanded && (
        <div className={`
          avalon-vote-outcome-card pointer-events-auto
          absolute top-8 rounded-xl border shadow-xl
          backdrop-blur-md px-4 py-3 w-64
          bg-surface-container-low/95 border-outline-variant/40
        `}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`${s.pill.split(' ').find(c => c.startsWith('text-')) ?? ''}`}>
              {s.icon}
            </span>
            <h3 className={`avalon-vote-outcome-title font-headline text-base uppercase tracking-wider ${s.pill.split(' ').find(c => c.startsWith('text-')) ?? 'text-on-surface'}`}>
              {styles[outcome.result].label}
            </h3>
          </div>

          <div className="flex flex-wrap gap-1.5 text-[10px] uppercase tracking-[0.15em]">
            {isQuestOutcome ? (
              <>
                <span className="rounded border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-cyan-200">
                  Success: {outcome.successCount ?? 0}
                </span>
                <span className="rounded border border-rose-400/30 bg-rose-500/10 px-2 py-0.5 text-rose-200">
                  Fail: {outcome.failCount ?? 0}
                </span>
              </>
            ) : (
              <>
                <span className="rounded border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-200">
                  Approve: {outcome.approveCount ?? 0}
                </span>
                <span className="rounded border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-amber-200">
                  Reject: {outcome.rejectCount ?? 0}
                </span>
              </>
            )}
            {typeof outcome.totalVotes === "number" && (
              <span className="rounded border border-outline-variant/40 bg-surface-container-high/40 px-2 py-0.5 text-on-surface-variant">
                Total: {outcome.totalVotes}
              </span>
            )}
          </div>

          <p className="avalon-vote-outcome-subtitle mt-2 text-[10px] text-on-surface-variant/80 leading-relaxed">
            {isQuestOutcome
              ? outcome.result === "success"
                ? "Nhiệm vụ hoàn thành. Hành trình tiếp tục."
                : "Nhiệm vụ thất bại. Bóng tối ghi dấu ấn."
              : outcome.result === "approve"
                ? "Đội được thông qua. Sẵn sàng lên đường."
                : "Đề cử bị bác. Quyền thủ lĩnh chuyển tiếp."}
          </p>
        </div>
      )}
    </div>
  );
}