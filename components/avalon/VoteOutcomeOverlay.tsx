"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CheckCircle2, ShieldAlert, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { type AvalonPlayer, type AvalonRoom } from "@/server/game/AvalonTypes";

type VoteOutcome = NonNullable<AvalonRoom["voteOutcome"]>;

function createOutcomeKey(outcome: VoteOutcome): string {
  return `${outcome.kind}-${outcome.result}-${outcome.approveCount ?? 0}-${outcome.rejectCount ?? 0}-${outcome.successCount ?? 0}-${outcome.failCount ?? 0}-${outcome.athenaStage ?? "none"}-${outcome.athenaRawResult ?? "none"}-${outcome.athenaFinalResult ?? "none"}`;
}

export default function VoteOutcomeOverlay({ gameState }: { gameState: AvalonRoom; me?: AvalonPlayer }) {
  const outcome = gameState.voteOutcome;

  if (!outcome) return null;

  return <VoteOutcomeOverlayContent key={createOutcomeKey(outcome)} outcome={outcome} />;
}

function VoteOutcomeOverlayContent({ outcome }: { outcome: VoteOutcome }) {
  const isQuestOutcome = outcome.kind === "quest";
  const isAthenaFlippedStage = Boolean(
    isQuestOutcome && outcome.athenaFlip && outcome.athenaStage === "flipped",
  );
  const shouldTriggerQuestSplash = isQuestOutcome && !isAthenaFlippedStage;

  const [expanded, setExpanded] = useState(false);
  const [showQuestSplash, setShowQuestSplash] = useState(shouldTriggerQuestSplash);
  const [showAthenaCinematic, setShowAthenaCinematic] = useState(isAthenaFlippedStage);
  const [cinematicLoadFailed, setCinematicLoadFailed] = useState(false);
  const cinematicVideoRef = useRef<HTMLVideoElement | null>(null);

  const finishAthenaCinematic = useCallback(() => {
    setShowAthenaCinematic(false);
    if (isQuestOutcome) {
      setShowQuestSplash(true);
    }
  }, [isQuestOutcome]);

  useEffect(() => {
    if (!showQuestSplash) return;

    const timer = window.setTimeout(() => {
      setShowQuestSplash(false);
    }, 1700);

    return () => window.clearTimeout(timer);
  }, [showQuestSplash]);

  useEffect(() => {
    if (!showAthenaCinematic) return;

    const safetyTimer = window.setTimeout(() => {
      finishAthenaCinematic();
    }, 9500);

    const video = cinematicVideoRef.current;
    if (!video) {
      return () => window.clearTimeout(safetyTimer);
    }

    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(() => {
        video.muted = true;
        video.play().catch(() => {
          setCinematicLoadFailed(true);
        });
      });
    }

    return () => window.clearTimeout(safetyTimer);
  }, [showAthenaCinematic, finishAthenaCinematic]);

  if (showAthenaCinematic) {
    return (
      <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/92 backdrop-blur-sm">
        <div className="w-full max-w-5xl px-4 sm:px-6">
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-cyan-300/30 shadow-[0_0_45px_rgba(34,211,238,0.35)] bg-black">
            <video
              ref={cinematicVideoRef}
              src="/audio/cinematic_video.mp4"
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
              preload="auto"
              onEnded={finishAthenaCinematic}
              onError={() => setCinematicLoadFailed(true)}
            />

            {cinematicLoadFailed && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-6 text-center">
                <p className="text-sm uppercase tracking-[0.16em] text-cyan-200/90">
                  Không tải được video Athena. Hệ thống sẽ tự tiếp tục.
                </p>
              </div>
            )}
          </div>
          <div className="text-center space-y-2 mt-4">

            <h3 className="font-headline text-2xl sm:text-3xl uppercase tracking-[0.16em] text-cyan-200 drop-shadow-[0_0_20px_rgba(34,211,238,0.45)]">
              Athena Đang Đảo Ngược Số Phận
            </h3>
          </div>
        </div>
      </div>
    );
  }

  const splashImageSrc =
    outcome.result === "success"
      ? "/Image/mission_success.png"
      : outcome.result === "fail"
        ? "/Image/mission_failed.png"
        : null;

  const splashGradientClass =
    outcome.result === "success"
      ? "from-cyan-900/45 via-emerald-700/25 to-black"
      : "from-rose-900/50 via-amber-700/25 to-black";

  const splashGlowClass =
    outcome.result === "success"
      ? "bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.28)_0%,rgba(14,116,144,0.16)_40%,rgba(0,0,0,0)_74%)]"
      : "bg-[radial-gradient(ellipse_at_center,rgba(244,63,94,0.26)_0%,rgba(251,146,60,0.16)_38%,rgba(0,0,0,0)_74%)]";

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
    <>
      {showQuestSplash && splashImageSrc && (
        <div className="fixed inset-0 z-85 overflow-hidden animate-in fade-in duration-200 pointer-events-none">
          <div className="absolute inset-0 bg-black" />
          <div className={`absolute inset-0 bg-linear-to-b ${splashGradientClass}`} />
          <div className={`absolute inset-0 ${splashGlowClass}`} />

          <div className="relative flex h-dvh min-h-svh w-screen items-center justify-center px-2 py-[8svh] sm:px-6 sm:py-[10vh]">
            <div className="relative h-[min(84svh,980px)] w-[min(100vw,1900px)] sm:h-[min(88vh,1080px)]">
              <Image
                src={splashImageSrc}
                alt={outcome.result === "success" ? "MISSION SUCCESS" : "MISSION FAILED"}
                fill
                priority
                sizes="100vw"
                className="object-contain drop-shadow-[0_0_34px_rgba(255,255,255,0.2)]"
              />
            </div>
          </div>
        </div>
      )}

      <div className="avalon-vote-outcome-shell pointer-events-none absolute top-0 left-0 right-0 z-70 flex justify-center pt-2 px-3">
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={`
              avalon-vote-outcome-toggle pointer-events-auto
              inline-flex items-center gap-1.5 rounded-full border
              px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]
              backdrop-blur-md shadow-lg transition-all duration-200
              ${s.pill}
            `}
            title={expanded ? "Ẩn chi tiết kết quả" : "Xem chi tiết kết quả"}
          >
            {s.icon}
            {expanded ? "Ẩn Kết Quả" : "Xem Kết Quả"}
            {expanded ? (
              <ChevronUp className="h-3 w-3 opacity-60" />
            ) : (
              <ChevronDown className="h-3 w-3 opacity-60" />
            )}
          </button>
        </div>

        {expanded && (
          <div
            className={`
            avalon-vote-outcome-card pointer-events-auto
            absolute top-8 rounded-xl border shadow-xl
            backdrop-blur-md px-4 py-3 w-64
            bg-surface-container-low/95 border-outline-variant/40
          `}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`${s.pill.split(" ").find((c) => c.startsWith("text-")) ?? ""}`}>
                {s.icon}
              </span>
              <h3
                className={`avalon-vote-outcome-title font-headline text-base uppercase tracking-wider ${s.pill
                  .split(" ")
                  .find((c) => c.startsWith("text-")) ?? "text-on-surface"}`}
              >
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
              {outcome.announcement
                ? outcome.announcement
                : isQuestOutcome
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
    </>
  );
}