import React from "react";
import { CookingPot, Fingerprint, ShieldAlert } from "lucide-react";
import type { MeansCard, ClueCard, SolvingAttempt } from "@/server/game/DeceptionTypes";

interface SolvingHistoryModalProps {
  solvingAttempts: SolvingAttempt[];
  allMeans: Map<number, MeansCard>;
  allClues: Map<number, ClueCard>;
  getEvidenceTitle: (card: MeansCard | ClueCard) => string;
  onClose: () => void;
}

export default function SolvingHistoryModal({
  solvingAttempts,
  allMeans,
  allClues,
  getEvidenceTitle,
  onClose,
}: SolvingHistoryModalProps) {
  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <section className="deception-card w-full max-w-2xl rounded-3xl border border-(--deception-cyan)/40 bg-[linear-gradient(180deg,rgba(16,21,30,0.98),rgba(10,12,18,0.98))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_0_1px_rgba(0,212,255,0.1)] sm:p-6">
        <h2 className="text-center text-xl font-black uppercase tracking-[0.16em] text-(--on-surface)">
          Lịch sử phá án
        </h2>
        <div className="mt-5 max-h-[60vh] space-y-3 overflow-y-auto pr-2 custom-scrollbar">
          {solvingAttempts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 opacity-60">
              <ShieldAlert className="mb-3 h-10 w-10 text-(--on-surface-variant)" />
              <p className="text-sm font-bold uppercase tracking-widest text-(--on-surface-variant)">
                Chưa có ai tố cáo.
              </p>
            </div>
          ) : (
            solvingAttempts.map((hist) => {
              const selectedMeans = allMeans.get(hist.selectedMeansId);
              const selectedClue = allClues.get(hist.selectedClueId);
              const meansTitle = selectedMeans
                ? getEvidenceTitle(selectedMeans)
                : `Unknown Means #${hist.selectedMeansId}`;
              const clueTitle = selectedClue
                ? getEvidenceTitle(selectedClue)
                : `Unknown Clue #${hist.selectedClueId}`;

              return (
                <div
                  key={hist.id}
                  className="relative shrink-0 overflow-hidden rounded-2xl border border-(--deception-border) bg-black/40 p-4 transition hover:bg-black/60"
                >
                  <div
                    className={`absolute top-0 bottom-0 left-0 w-1 ${hist.result === "correct" ? "bg-(--deception-cyan)" : "bg-(--deception-red)"}`}
                  />
                  <p className="text-sm">
                    <span className="font-black uppercase tracking-[0.06em] text-(--deception-cyan)">
                      {hist.investigatorName}
                    </span>{" "}
                    <span className="text-(--on-surface-variant) px-1 text-sm lowercase tracking-[0.04em]">
                      đã tố cáo
                    </span>{" "}
                    <span className="font-black uppercase tracking-[0.06em] text-(--deception-red-soft)">
                      {hist.accusedName}
                    </span>
                  </p>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-start gap-2 rounded-lg border border-(--deception-amber)/30 bg-(--deception-amber)/10 px-2.5 py-2">
                      <CookingPot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-(--deception-amber)" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-(--deception-amber)">
                          Hung khí
                        </p>
                        <p className="mt-0.5 wrap-break-word text-xs leading-snug font-bold text-(--deception-amber)">
                          {meansTitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 rounded-lg border border-(--deception-cyan)/30 bg-(--deception-cyan)/10 px-2.5 py-2">
                      <Fingerprint className="mt-0.5 h-3.5 w-3.5 shrink-0 text-(--deception-cyan)" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-(--deception-cyan)">
                          Manh mối
                        </p>
                        <p className="mt-0.5 wrap-break-word text-xs leading-snug font-bold text-(--deception-cyan)">
                          {clueTitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <span
                        className={`font-black uppercase tracking-[0.12em] ${hist.result === "correct" ? "text-(--deception-cyan)" : "text-(--deception-red)"}`}
                      >
                        {hist.result === "correct" ? "✓ Đúng" : "✗ Sai"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <button
          onClick={onClose}
          className="deception-btn-outline mt-6 w-full py-3.5 text-xs font-black uppercase tracking-[0.16em]"
        >
          Đóng
        </button>
      </section>
    </div>
  );
}
