import React from "react";
import Image from "next/image";
import type { DeceptionPlayer, MeansCard, ClueCard } from "@/server/game/DeceptionTypes";
import type { PendingSolveSelection } from "../DiscussionBoard";

interface SolveConfirmModalProps {
  pendingSolveAccused: DeceptionPlayer | undefined;
  effectivePendingSolveSelection: PendingSolveSelection;
  getEvidenceTitle: (card: MeansCard | ClueCard | null | undefined) => string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function SolveConfirmModal({
  pendingSolveAccused,
  effectivePendingSolveSelection,
  getEvidenceTitle,
  onCancel,
  onConfirm,
}: SolveConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <section className="deception-card w-full max-w-2xl rounded-3xl border border-(--deception-red)/40 bg-[linear-gradient(180deg,rgba(23,15,18,0.97),rgba(13,11,16,0.98))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.74)] sm:p-6">
        <h2 className="text-center text-2xl font-black uppercase tracking-[0.15em] text-(--on-surface)">
          Xác nhận tố cáo
        </h2>
        <p className="mt-3 text-center text-sm leading-relaxed text-(--on-surface-variant)">
          Bạn đang tố cáo{" "}
          <span className="font-black uppercase tracking-[0.08em] text-(--deception-red-soft)">
            {pendingSolveAccused?.name ||
              effectivePendingSolveSelection.accusedName}
          </span>
          . Hãy kiểm tra đúng người và đúng 2 lá trước khi gửi.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <article className="rounded-2xl border border-(--deception-amber)/35 bg-(--deception-amber)/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-(--deception-amber)">
              Hung khí
            </p>
            <div className="mt-2 flex items-center gap-3">
              <div className="relative h-18 w-12 shrink-0 overflow-hidden rounded-md border border-(--deception-amber)/45 bg-black/45">
                <Image
                  src={effectivePendingSolveSelection.means!.imageUrl || ""}
                  alt={
                    effectivePendingSolveSelection.means?.card.vietnamese ||
                    effectivePendingSolveSelection.means?.card.english ||
                    "Means"
                  }
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-(--deception-amber)">
                  #
                  {String(
                    effectivePendingSolveSelection.means!.id,
                  ).padStart(2, "0")}
                </p>
                <p className="mt-1 text-sm font-bold leading-snug text-(--on-surface)">
                  {getEvidenceTitle(
                    effectivePendingSolveSelection.means?.card,
                  )}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-(--deception-cyan)/35 bg-(--deception-cyan)/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-(--deception-cyan)">
              Manh mối
            </p>
            <div className="mt-2 flex items-center gap-3">
              <div className="relative h-18 w-12 shrink-0 overflow-hidden rounded-md border border-(--deception-cyan)/45 bg-black/45">
                <Image
                  src={effectivePendingSolveSelection.clue!.imageUrl}
                  alt={
                    effectivePendingSolveSelection.clue?.card.vietnamese ||
                    effectivePendingSolveSelection.clue?.card.english ||
                    "Clue"
                  }
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-(--deception-cyan)">
                  #
                  {String(
                    effectivePendingSolveSelection.clue!.id,
                  ).padStart(2, "0")}
                </p>
                <p className="mt-1 text-sm font-bold leading-snug text-(--on-surface)">
                  {getEvidenceTitle(
                    effectivePendingSolveSelection.clue?.card,
                  )}
                </p>
              </div>
            </div>
          </article>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="deception-btn-outline py-3 text-xs font-black uppercase tracking-[0.15em]"
          >
            Xem lại
          </button>
          <button
            onClick={onConfirm}
            className="deception-btn-red py-3 text-xs font-black uppercase tracking-[0.15em]"
          >
            Xác nhận tố cáo
          </button>
        </div>
      </section>
    </div>
  );
}
