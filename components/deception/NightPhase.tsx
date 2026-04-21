"use client";

import { useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { ArrowLeft, Fingerprint, EyeOff, ShieldAlert, UserSearch } from "lucide-react";
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
  // Thematic colors: Crimson Red for Means, Vintage Amber for Clue
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

  // ── Non-murderer info layout (scale-based, unchanged) ──────────────────────
  return (
    <div className="deception-room-bg deception-theme flex h-dvh flex-col overflow-hidden">
      <header className="deception-topbar">
        <div className="deception-brand">
          <span className="deception-logo-dot" />
          <span className="deception-brand-text">MÀN ĐÊM BUÔNG XUỐNG</span>
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
                  <EyeOff className="h-9 w-9" />
                </div>
                <h1 className="mt-5 text-center text-4xl sm:text-5xl font-black uppercase tracking-[0.16em] text-(--on-surface)">
                  Sương mù che lấp Luân Đôn...
                </h1>
                <p className="mx-auto mt-4 max-w-[56ch] text-center text-lg leading-relaxed text-(--on-surface-variant)">
                  Hãy nhắm mắt. Kẻ thủ ác đang âm thầm dàn dựng hiện trường tội ác trong bóng tối.
                </p>

                {isWitness && (
                  <div className="relative mt-8 rounded-xl border border-(--deception-red) bg-[rgba(255,45,85,0.08)] p-5">
                    {/* Corner accents */}
                    <div className="absolute -left-px -top-px h-3 w-3 border-l-2 border-t-2 border-(--deception-red)" />
                    <div className="absolute -right-px -bottom-px h-3 w-3 border-b-2 border-r-2 border-(--deception-red)" />
                    
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-(--deception-red-soft)">Báo cáo mật: Mục tiêu cần đề phòng</p>
                    {knownEvil.length === 0 ? (
                      <p className="mt-3 text-base text-(--on-surface-variant)">Hồ sơ rỗng. Không có kẻ tình nghi.</p>
                    ) : (
                      <ul className="mt-4 space-y-3">
                        {knownEvil.map((player) => (
                          <li key={player.userId} className="flex items-center justify-between rounded-md border border-(--deception-border) bg-black/40 px-4 py-3">
                            <span className="text-lg font-bold uppercase tracking-[0.08em] text-(--on-surface)">{player.name}</span>
                            <span className="text-sm font-black uppercase tracking-[0.16em] text-(--deception-red-soft)">{roleLabel(player.role)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-(--deception-red-soft)">
                      Giấu kín danh tính của mình. Bọn chúng sẽ tẩu thoát nếu phát hiện ra bạn.
                    </p>
                  </div>
                )}

                {isAccomplice && (
                  <div className="relative mt-8 rounded-xl border border-(--deception-purple) bg-[rgba(139,92,246,0.12)] p-5">
                    <div className="absolute -left-px -top-px h-3 w-3 border-l-2 border-t-2 border-(--deception-purple)" />
                    <div className="absolute -right-px -bottom-px h-3 w-3 border-b-2 border-r-2 border-(--deception-purple)" />

                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-(--deception-purple)">Chỉ lệnh đồng lõa: Hỗ trợ kẻ thủ ác</p>
                    <p className="mt-3 text-base text-(--on-surface)">
                      Kẻ Chủ Mưu: <span className="font-bold uppercase tracking-[0.08em] text-(--deception-purple-light)">{murderer?.name || "Đang xác định"}</span>
                    </p>
                    <p className="mt-3 text-xs uppercase tracking-[0.14em] text-(--on-surface-variant)">
                      Chờ kẻ chủ mưu chốt phương án gây án. Hãy bảo vệ hắn trước điều tra viên.
                    </p>
                  </div>
                )}

                {!isWitness && !isAccomplice && (
                  <div className="relative mt-8 flex items-center justify-center gap-3 rounded-lg border border-(--deception-border) p-5 text-sm uppercase tracking-[0.16em] text-(--on-surface-variant)">
                    <div className="absolute -left-px -top-px h-3 w-3 border-l-2 border-t-2 border-(--deception-border)" />
                    <div className="absolute -right-px -bottom-px h-3 w-3 border-b-2 border-r-2 border-(--deception-border)" />

                    <ShieldAlert className="h-5 w-5 text-(--deception-cyan)" />
                    Giữ im lặng. Mọi bí ẩn sẽ được định đoạt khi bình minh lên.
                  </div>
                )}

                <div className="mt-10 flex justify-center">
                  <span className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-(--deception-cyan)">
                    <UserSearch className="h-4 w-4" />
                    Đang chờ sát nhân hành động...
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
