"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import type { ClueCard, DeceptionPlayer, MeansCard } from "@/server/game/DeceptionTypes";

type Step = 1 | 2 | 3 | 4;

export default function SolvingWizard({
  open,
  me,
  players,
  onClose,
  onSubmit,
}: {
  open: boolean;
  me?: DeceptionPlayer;
  players: DeceptionPlayer[];
  onClose: () => void;
  onSubmit: (payload: { accusedUserId: string; meansId: number; clueId: number }) => void;
}) {
  const [step, setStep] = useState<Step>(1);
  const [accusedUserId, setAccusedUserId] = useState("");
  const [meansId, setMeansId] = useState<number | null>(null);
  const [clueId, setClueId] = useState<number | null>(null);

  const candidates = useMemo(
    () =>
      players.filter(
        (player) =>
          !player.isSpectator &&
          player.userId !== me?.userId &&
          player.role !== "ForensicScientist",
      ),
    [players, me?.userId],
  );

  const accused = useMemo(
    () => players.find((player) => player.userId === accusedUserId),
    [players, accusedUserId],
  );

  const selectedMeans: MeansCard | undefined = accused?.meansCards.find((card) => card.id === meansId);
  const selectedClue: ClueCard | undefined = accused?.clueCards.find((card) => card.id === clueId);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm">
      <div className="flex h-dvh w-full items-stretch justify-center p-2 sm:p-4">
        <section className="deception-card flex h-full min-h-0 w-full max-w-4xl flex-col rounded-2xl p-4 sm:p-6">
        <header className="flex items-start justify-between gap-3 border-b border-(--deception-border) pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-(--deception-red-soft)">Solving Wizard</p>
            <h2 className="mt-1 text-2xl font-black uppercase tracking-[0.12em] text-(--on-surface)">
              {step === 1 && "Bạn tố cáo ai?"}
              {step === 2 && "Hung khí nào?"}
              {step === 3 && "Manh mối nào?"}
              {step === 4 && "Xác nhận phá án"}
            </h2>
          </div>
          <button onClick={onClose} className="deception-icon-btn" title="Đóng wizard">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1 sm:mt-5 sm:pr-2">
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {candidates.map((player) => {
                const selected = accusedUserId === player.userId;
                return (
                  <button
                    key={player.userId}
                    onClick={() => setAccusedUserId(player.userId)}
                    className={`rounded-lg border p-3 text-left transition ${
                      selected
                        ? "border-(--deception-red) bg-[rgba(255,45,85,0.12)]"
                        : "border-(--deception-border) bg-[rgba(255,255,255,0.03)] hover:border-(--deception-red-soft)"
                    }`}
                  >
                    <p className="text-sm font-black uppercase tracking-[0.08em] text-(--on-surface)">{player.name}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-(--on-surface-variant)">
                      {player.hasBadge ? "Có badge" : "Không badge"}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {accused?.meansCards.map((card) => {
                const selected = meansId === card.id;
                return (
                  <button
                    key={card.id}
                    onClick={() => setMeansId(card.id)}
                    className={`rounded-lg border p-3 text-left transition ${
                      selected
                        ? "border-(--deception-red) bg-[rgba(255,45,85,0.12)]"
                        : "border-(--deception-border) bg-[rgba(255,255,255,0.03)] hover:border-(--deception-red-soft)"
                    }`}
                  >
                    <p className="text-sm font-extrabold uppercase tracking-[0.08em] text-(--on-surface)">{card.vietnamese}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-(--on-surface-variant)">{card.english}</p>
                  </button>
                );
              })}
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {accused?.clueCards.map((card) => {
                const selected = clueId === card.id;
                return (
                  <button
                    key={card.id}
                    onClick={() => setClueId(card.id)}
                    className={`rounded-lg border p-3 text-left transition ${
                      selected
                        ? "border-(--deception-red) bg-[rgba(255,45,85,0.12)]"
                        : "border-(--deception-border) bg-[rgba(255,255,255,0.03)] hover:border-(--deception-red-soft)"
                    }`}
                  >
                    <p className="text-sm font-extrabold uppercase tracking-[0.08em] text-(--on-surface)">{card.vietnamese}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-(--on-surface-variant)">{card.english}</p>
                  </button>
                );
              })}
            </div>
          )}

          {step === 4 && (
            <div className="rounded-xl border border-(--deception-border) bg-[rgba(255,255,255,0.03)] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-(--deception-cyan)">Summary</p>
              <p className="mt-3 text-lg font-black uppercase tracking-[0.08em] text-(--on-surface)">
                {accused?.name || "?"}
              </p>
              <p className="mt-2 text-sm text-(--on-surface-variant)">
                đã dùng <span className="font-bold text-(--on-surface)">{selectedMeans?.vietnamese || "?"}</span>
                {" "}và để lại <span className="font-bold text-(--on-surface)">{selectedClue?.vietnamese || "?"}</span>.
              </p>
            </div>
          )}
        </div>

        <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-(--deception-border) pt-4 sm:mt-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-(--on-surface-variant)">
            Step {step}/4
          </div>

          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                onClick={() => setStep((prev) => (prev - 1) as Step)}
                className="deception-btn-outline px-3 py-2 text-xs uppercase tracking-[0.16em]"
              >
                <span className="inline-flex items-center gap-1.5">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Quay lại
                </span>
              </button>
            )}

            {step < 4 && (
              <button
                onClick={() => setStep((prev) => (prev + 1) as Step)}
                disabled={(step === 1 && !accusedUserId) || (step === 2 && !meansId) || (step === 3 && !clueId)}
                className="deception-btn-cyan px-3 py-2 text-xs font-black uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <span className="inline-flex items-center gap-1.5">
                  Tiếp theo
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            )}

            {step === 4 && (
              <button
                onClick={() => {
                  if (!accusedUserId || !meansId || !clueId) return;
                  onSubmit({ accusedUserId, meansId, clueId });
                }}
                className="deception-btn-red px-4 py-2 text-xs font-black uppercase tracking-[0.16em]"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  Gửi kết quả phá án
                </span>
              </button>
            )}
          </div>
        </footer>
        </section>
      </div>
    </div>
  );
}
