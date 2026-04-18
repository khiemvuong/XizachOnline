"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import type { ClueCard, DeceptionPlayer, MeansCard } from "@/server/game/DeceptionTypes";
import {
  getResolvedClueImageUrl,
  getResolvedMeansImageUrl,
} from "@/utils/deceptionAssets";
import EvidenceImageCard from "./EvidenceImageCard";

type Step = 1 | 2 | 3 | 4;

// ─── Mini card used in step 2/3 selection grids ───

function SelectableCard({
  id,
  english,
  vietnamese,
  imageUrl,
  tone,
  selected,
  onClick,
}: {
  id: number;
  english?: string;
  vietnamese?: string;
  imageUrl: string;
  tone: "means" | "clue";
  selected: boolean;
  onClick: () => void;
}) {
  const isMeans = tone === "means";
  const accentColor = isMeans ? "#ffb84a" : "#00d4ff";
  const accentBg   = isMeans ? "rgba(255,184,0,0.13)"  : "rgba(0,212,255,0.12)";
  const badgeClass = isMeans
    ? "bg-[#392b17] text-[#ffcf7a]"
    : "bg-[#0a3948] text-[#9deeff]";

  return (
    // aspect-square so the card is always 1:1
    <button
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-xl border text-left transition-all duration-200 focus:outline-none"
      style={{
        aspectRatio: "1 / 1",
        borderColor: selected ? accentColor : "rgba(255,255,255,0.1)",
        background: selected ? accentBg : "rgba(255,255,255,0.03)",
        boxShadow: selected
          ? `0 0 0 2px ${accentColor}55, 0 8px 24px rgba(0,0,0,0.45)`
          : "0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      {/* Image — only backgroundImage, NO background shorthand conflict */}
      <div
        className="absolute inset-0 transition-transform duration-300 group-hover:scale-105"
        style={{
          backgroundImage: imageUrl
            ? `url(${imageUrl})`
            : isMeans
            ? "radial-gradient(circle at 30% 30%, rgba(255,184,0,0.18), rgba(30,20,10,0.5))"
            : "radial-gradient(circle at 30% 30%, rgba(0,212,255,0.18), rgba(10,20,30,0.5))",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Gradient overlay — bottom 60% */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-[linear-gradient(to_top,rgba(5,7,14,0.95)_0%,rgba(5,7,14,0.5)_55%,transparent_100%)]" />

      {/* Badge */}
      <div className={`pointer-events-none absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[7px] font-black uppercase tracking-widest ${badgeClass}`}>
        {isMeans ? "Means" : "Clue"} #{String(id).padStart(2, "0")}
      </div>

      {/* Selected checkmark */}
      {selected && (
        <div
          className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full"
          style={{ background: accentColor }}
        >
          <Check className="h-3 w-3 text-black" />
        </div>
      )}

      {/* Text overlay */}
      <div className="absolute inset-x-0 bottom-0 p-1.5 sm:p-2">
        <p
          className="line-clamp-2 text-[12px] font-semibold leading-tight text-white"
          style={{ fontFamily: "var(--font-cormorant), var(--font-headline), serif" }}
        >
          {english || vietnamese || "Unknown"}
        </p>
        {vietnamese && vietnamese.toLowerCase() !== (english || "").toLowerCase() && (
          <p className="mt-0.5 line-clamp-1 text-[10px] font-medium leading-tight text-white/60">
            {vietnamese}
          </p>
        )}
      </div>
    </button>
  );
}

// ─── Main wizard ───

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

  const selectedMeans: MeansCard | undefined = accused?.meansCards.find((c) => c.id === meansId);
  const selectedClue: ClueCard | undefined  = accused?.clueCards.find((c) => c.id === clueId);

  if (!open) return null;

  const stepLabels = ["Tố cáo ai?", "Hung khí nào?", "Manh mối nào?", "Xác nhận phá án"];

  return (
    <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-sm">
      <div className="flex h-dvh w-full items-stretch justify-center p-1.5 sm:p-4">
        <section className="deception-card flex h-full min-h-0 w-full max-w-4xl flex-col rounded-2xl p-3">

          {/* Header — compact on mobile */}
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-(--deception-border) pb-2 sm:pb-3">
            <div>
              <div className="flex items-center gap-1.5">
                {([1, 2, 3, 4] as Step[]).map((s) => (
                  <div
                    key={s}
                    className="h-0.5 w-6 rounded-full transition-all duration-300 sm:h-1 sm:w-8"
                    style={{
                      background: s <= step
                        ? "linear-gradient(90deg, #ff3d60, #ff6b85)"
                        : "rgba(255,255,255,0.12)",
                    }}
                  />
                ))}
              </div>
              <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-(--deception-red-soft)">
                Solving Wizard · Bước {step}/4
              </p>
              <h2 className="mt-0.5 text-base font-black uppercase tracking-widest text-(--on-surface) sm:text-xl">
                {stepLabels[step - 1]}
              </h2>
            </div>
            <button onClick={onClose} className="deception-icon-btn shrink-0" title="Đóng">
              <X className="h-4 w-4" />
            </button>
          </header>

          {/* Body — always scrollable; aspect-square cards are self-sizing */}
          <div className="mt-2 min-h-0 flex-1 overflow-y-auto pr-1 sm:mt-3 sm:pr-2">

            {/* Step 1: Chọn người */}
            {step === 1 && (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {candidates.map((player) => {
                  const selected = accusedUserId === player.userId;
                  const initial = (player.name?.trim().charAt(0) || "?").toUpperCase();
                  return (
                    <button
                      key={player.userId}
                      onClick={() => setAccusedUserId(player.userId)}
                      className="relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-200"
                      style={{
                        borderColor: selected ? "#ff5a78" : "rgba(255,255,255,0.1)",
                        background: selected
                          ? "rgba(255,45,85,0.12)"
                          : "rgba(255,255,255,0.03)",
                        boxShadow: selected
                          ? "0 0 0 2px rgba(255,90,120,0.4), 0 8px 24px rgba(0,0,0,0.4)"
                          : "none",
                      }}
                    >
                      {selected && (
                        <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#ff5a78]">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-lg font-black text-white">
                        {initial}
                      </div>
                      <p className="mt-3 text-sm font-black uppercase tracking-[0.08em] text-(--on-surface)">
                        {player.name}
                      </p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-(--on-surface-variant)">
                        {player.hasBadge ? "✦ Có badge" : "Không badge"}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 2: Chọn hung khí — 1:1 cards in 4-col grid */}
            {step === 2 && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {accused?.meansCards.map((card) => (
                  <SelectableCard
                    key={card.id}
                    id={card.id}
                    english={card.english}
                    vietnamese={card.vietnamese}
                    imageUrl={getResolvedMeansImageUrl(card.id)}
                    tone="means"
                    selected={meansId === card.id}
                    onClick={() => setMeansId(card.id)}
                  />
                ))}
              </div>
            )}

            {/* Step 3: Chọn manh mối — 1:1 cards in 4-col grid */}
            {step === 3 && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {accused?.clueCards.map((card) => (
                  <SelectableCard
                    key={card.id}
                    id={card.id}
                    english={card.english}
                    vietnamese={card.vietnamese}
                    imageUrl={getResolvedClueImageUrl(card.id)}
                    tone="clue"
                    selected={clueId === card.id}
                    onClick={() => setClueId(card.id)}
                  />
                ))}
              </div>
            )}

            {/* Step 4: Summary — fill height like image steps */}
            {step === 4 && (
              <div className="flex h-full min-h-0 flex-col gap-2">
                {/* Compact accused banner */}
                <div className="flex shrink-0 items-center gap-3 rounded-lg border border-white/10 bg-[rgba(255,45,85,0.06)] px-3">
                  <p className="text-[9px] uppercase tracking-[0.16em] text-(--deception-red-soft)">Tố cáo</p>
                  <p className="text-base font-black uppercase tracking-[0.08em] text-(--on-surface)">
                    {accused?.name || "?"}
                  </p>
                </div>

                {/* Cards — fill remaining height, dynamic ratio for landscape compatibility */}
                <div className="grid min-h-0 flex-1 grid-cols-2 gap-3" style={{ gridAutoRows: "1fr" }}>
                  <EvidenceImageCard
                    id={selectedMeans?.id}
                    tone="means"
                    english={selectedMeans?.english}
                    vietnamese={selectedMeans?.vietnamese}
                  />
                  <EvidenceImageCard
                    id={selectedClue?.id}
                    tone="clue"
                    english={selectedClue?.english}
                    vietnamese={selectedClue?.vietnamese}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer — compact */}
          <footer className="my-2 flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-(--deception-border)">
            <div className="text-[10px] uppercase tracking-[0.14em] text-(--on-surface-variant)">
              {step === 1 && "Chọn người bị tình nghi"}
              {step === 2 && accused && `Thẻ của ${accused.name}`}
              {step === 3 && accused && `Manh mối của ${accused.name}`}
              {step === 4 && "Kiểm tra lại trước khi gửi"}
            </div>

            <div className="flex items-center gap-2">
              {step > 1 && (
                <button
                  onClick={() => setStep((prev) => (prev - 1) as Step)}
                  className="deception-btn-outline px-2.5 py-1.5 text-[10px] uppercase tracking-[0.14em]"
                >
                  <span className="inline-flex items-center gap-1">
                    <ArrowLeft className="h-3 w-3" />
                    Quay lại
                  </span>
                </button>
              )}

              {step < 4 && (
                <button
                  onClick={() => setStep((prev) => (prev + 1) as Step)}
                  disabled={
                    (step === 1 && !accusedUserId) ||
                    (step === 2 && !meansId) ||
                    (step === 3 && !clueId)
                  }
                  className="deception-btn-cyan px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <span className="inline-flex items-center gap-1">
                    Tiếp theo
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </button>
              )}

              {step === 4 && (
                <button
                  onClick={() => {
                    if (!accusedUserId || !meansId || !clueId) return;
                    onSubmit({ accusedUserId, meansId, clueId });
                  }}
                  className="deception-btn-red px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em]"
                >
                  <span className="inline-flex items-center gap-1">
                    <Check className="h-3 w-3" />
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
