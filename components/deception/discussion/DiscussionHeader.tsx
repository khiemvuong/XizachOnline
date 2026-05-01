import React from "react";
import { Search, ChevronDown, History, Eye, EyeOff, VolumeX, Volume2, ArrowLeft } from "lucide-react";
import TimerBar from "@/components/deception/TimerBar";
import type { DeceptionRoom, DeceptionPlayer } from "@/server/game/DeceptionTypes";
import type { PendingSolveSelection } from "../DiscussionBoard";

interface DiscussionHeaderProps {
  isCompactViewport: boolean;
  openSolveConfirmModal: () => void;
  canOpenSolve: boolean;
  isPendingSolveComplete: boolean;
  solveButtonTitle: string;
  isSolveSelectionDetailsOpen: boolean;
  setIsSolveSelectionDetailsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedEvidenceCount: number;
  gameState: DeceptionRoom;
  setShowForensicClueBoard: (show: boolean) => void;
  setShowSolvingHistory: (show: boolean) => void;
  onToggleRoleMask: () => void;
  hideRolesUi: boolean;
  canToggleDiscussionAudio: boolean;
  onToggleBgm: () => void;
  bgmMuted: boolean;
  onExit: () => void;
  shouldShowSolveSelectionDetails: boolean;
  effectivePendingSolveSelection: PendingSolveSelection | null;
  pendingSolveAccused: DeceptionPlayer | undefined;
  clearPendingSolveSelection: () => void;
  selectedMeansTitle: string;
  selectedClueTitle: string;

}

export default function DiscussionHeader({
  isCompactViewport,
  openSolveConfirmModal,
  canOpenSolve,
  isPendingSolveComplete,
  solveButtonTitle,
  isSolveSelectionDetailsOpen,
  setIsSolveSelectionDetailsOpen,
  selectedEvidenceCount,
  gameState,
  setShowSolvingHistory,
  onToggleRoleMask,
  hideRolesUi,
  canToggleDiscussionAudio,
  onToggleBgm,
  bgmMuted,
  onExit,
  shouldShowSolveSelectionDetails,
  effectivePendingSolveSelection,
  pendingSolveAccused,
  clearPendingSolveSelection,
  selectedMeansTitle,
  selectedClueTitle,

}: DiscussionHeaderProps) {
  return (
    <section
      className={`deception-card relative z-40 overflow-visible rounded-xl ${isCompactViewport ? "p-1.5" : "p-2"}`}
    >
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1.5">
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={openSolveConfirmModal}
            disabled={!canOpenSolve || !isPendingSolveComplete}
            className={`deception-btn-cyan shrink-0 inline-flex items-center gap-1.5 font-black uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-45 ${
              isCompactViewport ? "px-2 py-1.5 text-[10px]" : "px-2.5 py-1.5 text-[10px]"
            }`}
            title={solveButtonTitle}
          >
            <Search className={isCompactViewport ? "h-3 w-3" : "h-3.5 w-3.5"} />
            Tố cáo
          </button>

          <button
            onClick={() => setIsSolveSelectionDetailsOpen((previous: boolean) => !previous)}
            className={`deception-btn-outline shrink-0 inline-flex items-center gap-1.5 font-black uppercase tracking-[0.14em] ${
              isCompactViewport ? "px-2 py-1.5 text-[10px]" : "px-2.5 py-1.5 text-[10px]"
            }`}
            title={isSolveSelectionDetailsOpen ? "Thu gọn chi tiết lựa chọn" : "Mở chi tiết lựa chọn"}
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${isSolveSelectionDetailsOpen ? "rotate-180" : "rotate-0"}`}
            />
            {selectedEvidenceCount}/2
          </button>
          
          <div className="rounded border border-indigo-500/30 bg-indigo-500/10 px-2 py-1.5 text-[10px] font-mono font-black tracking-widest text-indigo-300 sm:px-2.5 sm:text-[11px] ml-1">
            #{gameState.id}
          </div>
        </div>

        <div className="flex min-w-0 justify-center">
          <div className={`shrink-0 ${isCompactViewport ? "origin-center scale-90" : ""}`}>
            <TimerBar
              currentRound={gameState.currentRound}
              timerEndAt={gameState.timerEndAt}
              timerPausedRemaining={gameState.timerPausedRemaining}
              roundDurationSeconds={gameState.settings.discussionTimeSeconds}
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => setShowSolvingHistory(true)}
            className="deception-btn-outline shrink-0 inline-flex h-8 w-8 items-center justify-center p-0"
            title="Lịch sử Tố Cáo"
            aria-label="Lịch sử Tố Cáo"
          >
            <History className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={onToggleRoleMask}
            className="deception-btn-outline shrink-0 inline-flex h-8 w-8 items-center justify-center p-0"
            title={hideRolesUi ? "Hiện lại role thật" : "Ẩn role thật"}
            aria-label={hideRolesUi ? "Hiện lại role thật" : "Ẩn role thật"}
          >
            {hideRolesUi ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>

          {canToggleDiscussionAudio && (
            <button
              onClick={onToggleBgm}
              className="deception-btn-outline shrink-0 inline-flex h-8 w-8 items-center justify-center p-0"
              title={bgmMuted ? "Bật nhạc nền" : "Tắt nhạc nền"}
              aria-label={bgmMuted ? "Bật nhạc nền" : "Tắt nhạc nền"}
            >
              {bgmMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>
          )}


          <button
            onClick={onExit}
            className="deception-btn-outline shrink-0 inline-flex h-8 w-8 items-center justify-center p-0"
            title="Thoát về sảnh"
            aria-label="Thoát về sảnh"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <div id="deception-voice-slot" className="ml-1 shrink-0" />
        </div>
      </div>

      {shouldShowSolveSelectionDetails && (
        <div className="pointer-events-none absolute left-2 right-2 top-full z-50 mt-1.5">
          <div className="pointer-events-auto rounded-lg border border-(--deception-border) bg-[rgba(11,16,26,0.96)] px-2 py-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.55)] backdrop-blur-md">
            <div className="flex min-w-0 items-center justify-between gap-2">
              <p
                className={`min-w-0 truncate text-[10px] font-bold uppercase tracking-[0.14em] ${
                  effectivePendingSolveSelection ? "text-(--on-surface)" : "text-(--on-surface-variant)"
                }`}
                title={
                  effectivePendingSolveSelection
                    ? `Đang chọn tố cáo: ${pendingSolveAccused?.name || effectivePendingSolveSelection.accusedName}`
                    : "Chọn trực tiếp 1 hung khí + 1 manh mối trên cùng người chơi để tố cáo"
                }
              >
                {effectivePendingSolveSelection
                  ? `Đang chọn tố cáo: ${pendingSolveAccused?.name || effectivePendingSolveSelection.accusedName}`
                  : "Chưa chọn đủ 2 lá để tố cáo"}
              </p>

              <div className="flex shrink-0 items-center gap-1">
                {effectivePendingSolveSelection && (
                  <button
                    onClick={clearPendingSolveSelection}
                    className="deception-btn-outline px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]"
                    title="Bỏ lựa chọn tố cáo hiện tại"
                  >
                    Xóa chọn
                  </button>
                )}
              </div>
            </div>

            {effectivePendingSolveSelection && (
              <p className="mt-1 text-[9px] font-black uppercase tracking-[0.12em] text-(--on-surface-variant)">
                Đã chọn: {selectedEvidenceCount}/2
              </p>
            )}

            <div className="mt-1.5 grid gap-1 sm:grid-cols-2">
              <p className="truncate rounded-md border border-(--deception-amber)/30 bg-(--deception-amber)/10 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-(--deception-amber)">
                Hung khí: {selectedMeansTitle}
              </p>
              <p className="truncate rounded-md border border-(--deception-cyan)/30 bg-(--deception-cyan)/10 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-(--deception-cyan)">
                Manh mối: {selectedClueTitle}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
