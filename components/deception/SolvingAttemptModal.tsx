import { ShieldAlert } from "lucide-react";
import type { ClueCard, DeceptionPlayer, MeansCard } from "@/server/game/DeceptionTypes";
import EvidenceImageCard from "./EvidenceImageCard";

interface SolvingAttemptModalProps {
  attempt: {
    investigatorName: string;
    accusedName: string;
    selectedMeansId: number;
    selectedClueId: number;
  };
  attemptAccused: DeceptionPlayer | undefined;
  attemptMeans: MeansCard | undefined;
  attemptClue: ClueCard | undefined;
  isForensic: boolean;
  autoSolvingResult: "correct" | "incorrect" | null;
  onConfirm: () => void;
}

export default function SolvingAttemptModal({
  attempt,
  attemptAccused,
  attemptMeans,
  attemptClue,
  isForensic,
  autoSolvingResult,
  onConfirm,
}: SolvingAttemptModalProps) {
  return (
    <div className="fixed inset-0 z-70 flex flex-col items-center justify-center bg-black/75 p-2 backdrop-blur-sm sm:p-4">
      <section className="deception-card relative flex h-full w-full max-w-2xl flex-col overflow-visible rounded-2xl p-3 sm:h-auto sm:max-h-[90dvh] sm:p-6">
        {/* Decorative tape — allows popping out since overflow-visible is set */}
        <div className="pointer-events-none absolute -left-4 -top-3 z-20 hidden h-7 w-28 -rotate-12 rounded-xs border border-[rgba(255,210,198,0.42)] bg-[linear-gradient(180deg,rgba(255,186,170,0.32),rgba(255,160,140,0.2))] shadow-[0_6px_14px_rgba(0,0,0,0.28)] sm:block" />

        {/* Header — compact */}
        <div className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(255,45,85,0.15)] text-(--deception-red)">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.18em] text-(--deception-red-soft)">Solving Attempt</p>
            <h2 className="truncate text-base font-black uppercase tracking-widest text-(--on-surface) sm:text-xl">
              {attempt.investigatorName} tố cáo {attemptAccused?.name || attempt.accusedName}
            </h2>
          </div>
        </div>

        {/* Card previews — fill remaining height, flex-auto ensures it respects the set height before shrinking */}
        <div className="mt-2.5 grid h-40 min-h-0 flex-auto grid-cols-2 gap-3 sm:mt-4 sm:h-75" style={{ gridAutoRows: "1fr" }}>
          <EvidenceImageCard
            id={attemptMeans?.id || attempt.selectedMeansId}
            tone="means"
            english={attemptMeans?.english}
            vietnamese={attemptMeans?.vietnamese}
          />
          <EvidenceImageCard
            id={attemptClue?.id || attempt.selectedClueId}
            tone="clue"
            english={attemptClue?.english}
            vietnamese={attemptClue?.vietnamese}
          />
        </div>

        {/* Footer — compact */}
        <div className="mt-2 shrink-0 space-y-2 sm:mt-3">
          {isForensic ? (
            <div className="space-y-2">
              <p
                className={`text-center text-[11px] font-bold uppercase tracking-[0.14em] ${
                  autoSolvingResult === "correct"
                    ? "text-(--deception-cyan)"
                    : "text-(--deception-red-soft)"
                }`}
              >
                {autoSolvingResult === null
                  ? "Kết quả hệ thống: Đang đối chiếu"
                  : autoSolvingResult === "correct"
                  ? "✓ Kết quả hệ thống: Đúng"
                  : "✗ Kết quả hệ thống: Sai"}
              </p>

              <button
                onClick={onConfirm}
                className="deception-btn-cyan w-full px-4 py-2 text-xs font-black uppercase tracking-[0.16em]"
              >
                Xác nhận kết quả
              </button>
            </div>
          ) : (
            <p className="text-center text-[11px] uppercase tracking-[0.16em] text-(--on-surface-variant)">
              Chờ Pháp y xác nhận kết quả hệ thống...
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
