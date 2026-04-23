"use client";

import { useState } from "react";
import type { Socket } from "socket.io-client";
import { ArrowLeft, Fingerprint } from "lucide-react";
import { usePreloadCardImages } from "@/hooks/usePreloadCardImages";
import type { ClueCard, DeceptionPlayer, DeceptionRoom, MeansCard } from "@/server/game/DeceptionTypes";
import { getMeansImageUrl, getClueImageUrl } from "@/utils/deceptionAssets";

// ── Role-specific screens ──────────────────────────────────────────────────────
import NightPhaseForensic    from "@/components/deception/NightPhaseForensic";
import NightPhaseInvestigator from "@/components/deception/NightPhaseInvestigator";
import NightPhaseAccomplice  from "@/components/deception/NightPhaseAccomplice";
import NightPhaseWitness     from "@/components/deception/NightPhaseWitness";

type SelectableCard = MeansCard | ClueCard;

// ─── Murderer card: fully image-driven, portrait, fills row height ────────────

function MurdererCard({
  card,
  selected,
  onSelect,
  tone,
  imageUrl,
}: {
  card: SelectableCard;
  selected: boolean;
  onSelect: () => void;
  tone: "means" | "clue";
  imageUrl: string;
}) {
  const isMeans = tone === "means";
  const accentColor = isMeans ? "#ef4444" : "#fbbf24";
  const accentBg    = isMeans ? "rgba(239, 68, 68, 0.15)" : "rgba(251, 191, 36, 0.14)";
  const accentRing  = isMeans ? "rgba(239, 68, 68, 0.5)"  : "rgba(251, 191, 36, 0.45)";
  const badgeClass  = isMeans ? "bg-[#451212] text-[#fca5a5]" : "bg-[#453205] text-[#fde047]";
  const accentTextClass = isMeans ? "text-[#ef4444]" : "text-[#fbbf24]";

  return (
    <button
      onClick={onSelect}
      className="group relative min-h-0 w-full overflow-hidden rounded-xl border transition-all duration-200"
      style={{
        borderColor: selected ? accentColor : "rgba(255,255,255,0.1)",
        background: selected ? accentBg : "rgba(255,255,255,0.03)",
        boxShadow: selected
          ? `0 0 0 2px ${accentRing}, 0 4px 16px rgba(0,0,0,0.5)`
          : "0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      {/* Full image */}
      {imageUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(180deg,rgba(8,13,23,0.85),rgba(7,10,18,0.96))]">
          <Fingerprint className={`h-8 w-8 ${accentTextClass} opacity-70`} />
        </div>
      )}

      {/* Dark gradient overlay — bottom half */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-[linear-gradient(to_top,rgba(5,7,14,0.96)_0%,rgba(5,7,14,0.6)_55%,transparent_100%)]" />

      {/* Top-left badge */}
      <div className={`pointer-events-none absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[7px] font-black uppercase tracking-widest ${badgeClass}`}>
        {isMeans ? "M" : "C"}
      </div>

      {/* Selected ring + checkmark */}
      {selected && (
        <div
          className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full"
          style={{ background: accentColor }}
        >
          <svg className="h-3 w-3 text-black" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {/* Text overlay */}
      <div className="absolute inset-x-0 bottom-0 p-1.5 sm:p-2">
        <p className="truncate text-[11px] font-black uppercase leading-tight tracking-wide text-white">
          {card.english}
        </p>
        <p className={`truncate text-[10px] uppercase leading-tight tracking-wide ${accentTextClass}`}>
          {card.vietnamese}
        </p>
      </div>
    </button>
  );
}

// ─── Section divider label ────────────────────────────────────────────────────

function SectionDivider({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <div className="h-px flex-1 bg-white/10" />
      <p className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>
        {label}
      </p>
      <div className="h-px flex-1 bg-white/10" />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function NightPhase({
  gameState,
  me,
  socket,
  onExit,
}: {
  gameState: DeceptionRoom;
  me?: DeceptionPlayer;
  socket: Socket | null;
  onExit: () => void;
}) {
  const [selectedMeansId, setSelectedMeansId] = useState<number | null>(null);
  const [selectedClueId,  setSelectedClueId]  = useState<number | null>(null);


  const isWitness    = me?.role === "Witness";
  const isAccomplice = me?.role === "Accomplice";
  const isInvestigator = me?.role === "Investigator";
  const isForensic   = me?.role === "ForensicScientist";

  // Preload own cards immediately when murderer enters night phase
  usePreloadCardImages(me ? [me] : []);

  // ── Route non-murderer roles to dedicated screens ──────────────────────────
  if (isForensic) {
    return <NightPhaseForensic gameState={gameState} me={me} onExit={onExit} />;
  }
  if (isInvestigator) {
    return <NightPhaseInvestigator gameState={gameState} me={me} onExit={onExit} />;
  }
  if (isAccomplice) {
    return <NightPhaseAccomplice gameState={gameState} me={me} onExit={onExit} />;
  }
  if (isWitness) {
    return <NightPhaseWitness gameState={gameState} me={me} onExit={onExit} />;
  }

  // ── Murderer layout (unchanged) ────────────────────────────────────────────
  const meansCards = me?.meansCards ?? [];
  const clueCards  = me?.clueCards  ?? [];
  const selectedMeans = me?.meansCards.find((c) => c.id === selectedMeansId);
  const selectedClue  = me?.clueCards.find((c) => c.id === selectedClueId);

  return (
    <div className="deception-room-bg deception-theme flex h-dvh flex-col overflow-hidden">
      {/* Compact header */}
      <header className="flex shrink-0 items-center justify-between gap-3 px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444]" />
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ef4444]">
            SỰ KIỆN TRONG ĐÊM
          </span>
          <span className="ml-1 text-[10px] uppercase tracking-[0.12em] text-white/40">
            · DÀN DỰNG HIỆN TRƯỜNG ÁN MẠNG
          </span>
        </div>
        <button onClick={onExit} className="deception-icon-btn h-7 w-7" title="Thoát về sảnh">
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
      </header>

      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(239,68,68,0.2),transparent_40%)]" />

      {/* Card grids — flex-1 with no scroll */}
      <main className="relative z-10 flex min-h-0 flex-1 flex-col gap-1.5 px-2 pb-1.5">
        {/* Means */}
        <SectionDivider label="HUNG KHÍ GÂY ÁN" color="#ef4444" />

        <div className="grid min-h-0 flex-1 grid-cols-4 gap-1.5">
          {meansCards.map((card) => (
            <MurdererCard
              key={card.id}
              card={card}
              selected={selectedMeansId === card.id}
              onSelect={() => setSelectedMeansId(card.id)}
              tone="means"
              imageUrl={getMeansImageUrl(card.id)}
            />
          ))}
        </div>

        {/* Clue */}
        <SectionDivider label="MANH MỐI LÀM LỆCH HƯỚNG" color="#fbbf24" />

        <div className="grid min-h-0 flex-1 grid-cols-4 gap-1.5">
          {clueCards.map((card) => (
            <MurdererCard
              key={card.id}
              card={card}
              selected={selectedClueId === card.id}
              onSelect={() => setSelectedClueId(card.id)}
              tone="clue"
              imageUrl={getClueImageUrl(card.id)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 pt-0.5">
          <p className="text-[9px] uppercase tracking-[0.14em] text-white/40">
            {selectedMeans && selectedClue
              ? `✓ ${selectedMeans.vietnamese} + ${selectedClue.vietnamese}`
              : "XÁC NHẬN CÔNG CỤ THEO ĐÚNG KẾ HOẠCH"}
          </p>
          <button
            onClick={() => {
              if (!selectedMeansId || !selectedClueId) return;
              socket?.emit("murdererSelect", { meansId: selectedMeansId, clueId: selectedClueId });
            }}
            disabled={!selectedMeansId || !selectedClueId}
            className="deception-btn-red px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-45"
          >
            CHỐT HIỆN TRƯỜNG GIẢ
          </button>
        </div>
      </main>
    </div>
  );
}
