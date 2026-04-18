"use client";

import { useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { ArrowLeft, Fingerprint, MoonStar, ShieldAlert, UserSearch } from "lucide-react";
import { useSceneScale } from "@/hooks/useSceneScale";
import { usePreloadCardImages } from "@/hooks/usePreloadCardImages";
import type { ClueCard, DeceptionPlayer, DeceptionRoom, MeansCard } from "@/server/game/DeceptionTypes";
import { getMeansImageUrl, getClueImageUrl } from "@/utils/deceptionAssets";

const INFO_SCENE_WIDTH = 960;
const INFO_SCENE_HEIGHT = 620;

type SelectableCard = MeansCard | ClueCard;

// ─── Card for non-murderer info screen (unchanged) ───────────────────────────

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
  const accentColor = isMeans ? "#ffb84a" : "#00d4ff";
  const accentBg    = isMeans ? "rgba(255,184,0,0.15)" : "rgba(0,212,255,0.14)";
  const accentRing  = isMeans ? "rgba(255,184,0,0.5)"  : "rgba(0,212,255,0.45)";
  const badgeClass  = isMeans ? "bg-[#392b17] text-[#ffcf7a]" : "bg-[#0a3948] text-[#9deeff]";
  const accentTextClass = isMeans ? "text-[#ffb84a]" : "text-[#00d4ff]";

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

// ─── Role labels ──────────────────────────────────────────────────────────────

function roleLabel(role: DeceptionPlayer["role"]) {
  switch (role) {
    case "Murderer":     return "Kẻ Giết Người";
    case "Accomplice":   return "Đồng Phạm";
    case "Witness":      return "Nhân Chứng";
    case "ForensicScientist": return "Pháp Y";
    case "Investigator": return "Điều Tra Viên";
    default:             return "Ẩn danh";
  }
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
  const viewportRef = useRef<HTMLDivElement>(null);

  const isMurderer = me?.role === "Murderer";
  const isWitness = me?.role === "Witness";
  const isAccomplice = me?.role === "Accomplice";

  // Preload own cards immediately when murderer enters night phase
  usePreloadCardImages(me ? [me] : []);

  // Info-screen (non-murderer) still uses scale-based scene
  const scale = useSceneScale({
    viewportRef,
    sceneWidth:  INFO_SCENE_WIDTH,
    sceneHeight: INFO_SCENE_HEIGHT,
    padding: 16,
    minScale: 0.34,
    maxScale: 1,
    minViewportWidth: 300,
    minViewportHeight: 220,
    active: !isMurderer,
  });

  const knownEvil = useMemo(
    () =>
      gameState.players.filter(
        (p) => p.userId !== me?.userId && (p.role === "Murderer" || p.role === "Accomplice"),
      ),
    [gameState.players, me?.userId],
  );

  const murderer = gameState.players.find((p) => p.role === "Murderer");
  const selectedMeans = me?.meansCards.find((c) => c.id === selectedMeansId);
  const selectedClue  = me?.clueCards.find((c) => c.id === selectedClueId);

  const meansCards = me?.meansCards ?? [];
  const clueCards  = me?.clueCards  ?? [];

  // ── Murderer layout ─────────────────────────────────────────────────────────
  if (isMurderer) {
    return (
      <div className="deception-room-bg deception-theme flex h-dvh flex-col overflow-hidden">
        {/* Compact header */}
        <header className="flex shrink-0 items-center justify-between gap-3 px-3 py-1.5">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff3d60]" />
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ff3d60]">
              Night Phase
            </span>
            <span className="ml-1 text-[10px] uppercase tracking-[0.12em] text-white/40">
              · Chọn hung khí &amp; manh mối
            </span>
          </div>
          <button onClick={onExit} className="deception-icon-btn h-7 w-7" title="Thoát về sảnh">
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
        </header>

        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,45,85,0.16),transparent_40%)]" />

        {/* Card grids — flex-1 with no scroll */}
        <main className="relative z-10 flex min-h-0 flex-1 flex-col gap-1.5 px-2 pb-1.5">
          {/* Means */}
          <SectionDivider label="Means — Hung khí" color="#ffb84a" />

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
          <SectionDivider label="Clue — Manh mối" color="#00d4ff" />

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
                ? `✓ ${selectedMeans.english} + ${selectedClue.english}`
                : "Chọn 1 hung khí và 1 manh mối"}
            </p>
            <button
              onClick={() => {
                if (!selectedMeansId || !selectedClueId) return;
                socket?.emit("murdererSelect", { meansId: selectedMeansId, clueId: selectedClueId });
              }}
              disabled={!selectedMeansId || !selectedClueId}
              className="deception-btn-red px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-45"
            >
              Confirm Solution
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ── Non-murderer info layout (scale-based, unchanged) ──────────────────────
  return (
    <div className="deception-room-bg deception-theme flex h-dvh flex-col overflow-hidden">
      <header className="deception-topbar">
        <div className="deception-brand">
          <span className="deception-logo-dot" />
          <span className="deception-brand-text">Night Phase</span>
        </div>
        <button onClick={onExit} className="deception-icon-btn" title="Thoát về sảnh">
          <ArrowLeft className="h-4 w-4" />
        </button>
      </header>

      <main className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-3 py-3">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(255,45,85,0.2),transparent_42%),radial-gradient(circle_at_50%_85%,rgba(0,0,0,0.7),transparent_48%)]" />

        <div ref={viewportRef} className="relative z-10 h-full w-full overflow-hidden">
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              width: `${INFO_SCENE_WIDTH}px`,
              height: `${INFO_SCENE_HEIGHT}px`,
              transform: `translate(-50%, -50%) scale(${scale})`,
              transformOrigin: "center center",
            }}
          >
            <section className="deception-card h-full w-full rounded-2xl px-8 py-8">
              <div className="mx-auto flex h-full max-w-3xl flex-col justify-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(255,45,85,0.15)] text-(--deception-red)">
                  <MoonStar className="h-9 w-9" />
                </div>
                <h1 className="mt-5 text-center text-5xl font-black uppercase tracking-[0.16em] text-(--on-surface)">
                  Đêm xuống...
                </h1>
                <p className="mx-auto mt-4 max-w-[56ch] text-center text-lg leading-relaxed text-(--on-surface-variant)">
                  Nhắm mắt lại. Đang chờ kẻ sát nhân chọn hung khí và manh mối.
                </p>

                {isWitness && (
                  <div className="mt-8 rounded-xl border border-(--deception-red) bg-[rgba(255,45,85,0.08)] p-5">
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-(--deception-red-soft)">Intel: Witness</p>
                    {knownEvil.length === 0 ? (
                      <p className="mt-3 text-base text-(--on-surface-variant)">Chưa xác định được phe sát nhân.</p>
                    ) : (
                      <ul className="mt-4 space-y-3">
                        {knownEvil.map((player) => (
                          <li key={player.userId} className="flex items-center justify-between rounded-md border border-(--deception-border) px-4 py-3">
                            <span className="text-lg font-bold uppercase tracking-[0.08em] text-(--on-surface)">{player.name}</span>
                            <span className="text-sm uppercase tracking-[0.16em] text-(--deception-red-soft)">{roleLabel(player.role)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-4 text-xs uppercase tracking-[0.14em] text-(--deception-red-soft)">
                      Giữ bí mật. Nếu lộ thân phận, bạn sẽ bị truy sát ở Witness Hunt.
                    </p>
                  </div>
                )}

                {isAccomplice && (
                  <div className="mt-8 rounded-xl border border-(--deception-purple) bg-[rgba(139,92,246,0.12)] p-5">
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-(--deception-purple)">Intel: Accomplice</p>
                    <p className="mt-3 text-base text-(--on-surface)">
                      Kẻ giết người: <span className="font-bold uppercase tracking-[0.08em]">{murderer?.name || "Đang xác định"}</span>
                    </p>
                    <p className="mt-3 text-xs uppercase tracking-[0.14em] text-(--on-surface-variant)">
                      Chờ hung thủ xác nhận bộ lời giải để chuyển sang Scene Setup.
                    </p>
                  </div>
                )}

                {!isWitness && !isAccomplice && (
                  <div className="mt-8 flex items-center justify-center gap-3 rounded-lg border border-(--deception-border) p-4 text-sm uppercase tracking-[0.16em] text-(--on-surface-variant)">
                    <ShieldAlert className="h-5 w-5 text-(--deception-cyan)" />
                    Giữ im lặng và quan sát. Cuộc điều tra sẽ bắt đầu ngay sau đêm tối.
                  </div>
                )}

                <div className="mt-8 flex justify-center">
                  <span className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-(--deception-cyan)">
                    <UserSearch className="h-4 w-4" />
                    Chờ murderer hành động...
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
