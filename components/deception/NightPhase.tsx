"use client";

import { useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { ArrowLeft, Fingerprint, MoonStar, ShieldAlert, UserSearch } from "lucide-react";
import { useSceneScale } from "@/hooks/useSceneScale";
import type { ClueCard, DeceptionPlayer, DeceptionRoom, MeansCard } from "@/server/game/DeceptionTypes";

const MURDERER_SCENE_WIDTH = 1320;
const MURDERER_SCENE_HEIGHT = 760;
const INFO_SCENE_WIDTH = 960;
const INFO_SCENE_HEIGHT = 620;

type SelectableCard = MeansCard | ClueCard;

function SelectableEvidenceCard({
  card,
  selected,
  onSelect,
  tone,
}: {
  card: SelectableCard;
  selected: boolean;
  onSelect: () => void;
  tone: "means" | "clue";
}) {
  const selectedClass = tone === "means"
    ? "border-(--deception-amber) bg-[rgba(255,184,0,0.14)] shadow-[0_0_20px_rgba(255,184,0,0.16)]"
    : "border-(--deception-cyan) bg-[rgba(0,212,255,0.14)] shadow-[0_0_20px_rgba(0,212,255,0.16)]";

  const idleClass = tone === "means"
    ? "hover:border-(--deception-amber)/70"
    : "hover:border-(--deception-cyan)/70";

  const accentTextClass = tone === "means" ? "text-(--deception-amber)" : "text-(--deception-cyan)";

  return (
    <button
      onClick={onSelect}
      className={`group relative flex min-h-0 overflow-hidden rounded-xl border transition ${
        selected
          ? selectedClass
          : `border-(--deception-border) bg-[rgba(255,255,255,0.03)] ${idleClass}`
      }`}
    >
      <div className="relative h-full w-26 shrink-0 border-r border-(--deception-border)">
        {card.imageUrl ? (
          <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${card.imageUrl})` }} />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.06),transparent_48%),linear-gradient(180deg,rgba(8,13,23,0.85),rgba(7,10,18,0.96))]">
            <Fingerprint className={`h-9 w-9 ${accentTextClass} opacity-80`} />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-3 text-left">
        <p className="truncate text-[1.2rem] font-black uppercase tracking-[0.045em] text-(--on-surface)">{card.english}</p>
        <p className={`mt-0.5 truncate text-[1rem] uppercase tracking-[0.14em] ${accentTextClass}`}>{card.vietnamese}</p>
      </div>
    </button>
  );
}

function roleLabel(role: DeceptionPlayer["role"]) {
  switch (role) {
    case "Murderer":
      return "Kẻ Giết Người";
    case "Accomplice":
      return "Đồng Phạm";
    case "Witness":
      return "Nhân Chứng";
    case "ForensicScientist":
      return "Pháp Y";
    case "Investigator":
      return "Điều Tra Viên";
    default:
      return "Ẩn danh";
  }
}

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
  const [selectedClueId, setSelectedClueId] = useState<number | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const isMurderer = me?.role === "Murderer";
  const isWitness = me?.role === "Witness";
  const isAccomplice = me?.role === "Accomplice";

  const sceneWidth = isMurderer ? MURDERER_SCENE_WIDTH : INFO_SCENE_WIDTH;
  const sceneHeight = isMurderer ? MURDERER_SCENE_HEIGHT : INFO_SCENE_HEIGHT;

  const scale = useSceneScale({
    viewportRef,
    sceneWidth,
    sceneHeight,
    padding: 16,
    minScale: 0.34,
    maxScale: 1,
    minViewportWidth: 300,
    minViewportHeight: 220,
  });

  const knownEvil = useMemo(
    () =>
      gameState.players.filter(
        (player) => player.userId !== me?.userId && (player.role === "Murderer" || player.role === "Accomplice"),
      ),
    [gameState.players, me?.userId],
  );

  const murderer = gameState.players.find((player) => player.role === "Murderer");

  const selectedMeans = me?.meansCards.find((card) => card.id === selectedMeansId);
  const selectedClue = me?.clueCards.find((card) => card.id === selectedClueId);

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
              width: `${sceneWidth}px`,
              height: `${sceneHeight}px`,
              transform: `translate(-50%, -50%) scale(${scale})`,
              transformOrigin: "center center",
            }}
          >
            {isMurderer ? (
              <section className="deception-card h-full w-full rounded-2xl px-8 py-6">
                <div className="flex h-full flex-col">
                  <div className="border-b border-(--deception-border) pb-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-(--deception-red-soft)">Night falls...</p>
                    <h1 className="mt-1 text-3xl font-black uppercase tracking-[0.11em] text-(--deception-red)">
                      Chọn hung khí và manh mối
                    </h1>
                    <p className="mt-2 text-base text-(--on-surface-variant)">
                      Chỉ bạn thấy lựa chọn này. Chọn chính xác 1 thẻ Hung Khí và 1 thẻ Manh Mối trong bộ bài của bạn.
                    </p>
                  </div>

                  <div className="mt-4 grid min-h-0 flex-1 grid-rows-[auto_1fr_auto_1fr] gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-px flex-1 bg-linear-to-r from-transparent via-(--deception-border) to-transparent opacity-70" />
                      <p className="text-sm font-bold uppercase tracking-[0.2em] text-(--deception-amber)">Means — Hung khí</p>
                      <div className="h-px flex-1 bg-linear-to-r from-transparent via-(--deception-border) to-transparent opacity-70" />
                    </div>

                    <div className="grid min-h-0 grid-cols-2 auto-rows-fr gap-3">
                      {(me?.meansCards ?? []).map((card) => (
                        <SelectableEvidenceCard
                          key={card.id}
                          card={card}
                          selected={selectedMeansId === card.id}
                          onSelect={() => setSelectedMeansId(card.id)}
                          tone="means"
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="h-px flex-1 bg-linear-to-r from-transparent via-(--deception-border) to-transparent opacity-70" />
                      <p className="text-sm font-bold uppercase tracking-[0.2em] text-(--deception-cyan)">Clue — Manh mối</p>
                      <div className="h-px flex-1 bg-linear-to-r from-transparent via-(--deception-border) to-transparent opacity-70" />
                    </div>

                    <div className="grid min-h-0 grid-cols-2 auto-rows-fr gap-3">
                      {(me?.clueCards ?? []).map((card) => (
                        <SelectableEvidenceCard
                          key={card.id}
                          card={card}
                          selected={selectedClueId === card.id}
                          onSelect={() => setSelectedClueId(card.id)}
                          tone="clue"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-4 border-t border-(--deception-border) pt-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-(--on-surface-variant)">
                      {selectedMeans && selectedClue
                        ? `Đã chọn: ${selectedMeans.english} + ${selectedClue.english}`
                        : "Murderer influence active"}
                    </p>
                    <button
                      onClick={() => {
                        if (!selectedMeansId || !selectedClueId) return;
                        socket?.emit("murdererSelect", {
                          meansId: selectedMeansId,
                          clueId: selectedClueId,
                        });
                      }}
                      disabled={!selectedMeansId || !selectedClueId}
                      className="deception-btn-red px-6 py-3 text-sm font-black uppercase tracking-[0.2em] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Confirm Solution
                    </button>
                  </div>
                </div>
              </section>
            ) : (
              <section className="deception-card h-full w-full rounded-2xl px-8 py-8">
                <div className="mx-auto flex h-full max-w-3xl flex-col justify-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(255,45,85,0.15)] text-(--deception-red)">
                    <MoonStar className="h-9 w-9" />
                  </div>
                  <h1 className="mt-5 text-center text-5xl font-black uppercase tracking-[0.16em] text-(--on-surface)">Đêm xuống...</h1>
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
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
