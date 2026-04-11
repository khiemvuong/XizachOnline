"use client";

import { AvalonPlayer, AvalonRoom } from "@/server/game/AvalonTypes";
import { useEffect, useRef, useState } from "react";
import { Shield, Skull, HeartCrack, Trophy } from "lucide-react";
import { Socket } from "socket.io-client";
import { useSceneScale } from "@/hooks/useSceneScale";

// ── Image URLs from Template/src/App.tsx ──────────────────────────────────────
const IMG_APPROVE = "/card/approve.png";
const IMG_REJECT = "/card/reject.png";
const IMG_SUCCESS = "/card/success.png";
const IMG_FAIL = "/card/fail.png";

// ── Scene constants (all px, will be uniformly scaled down) ──────────────────
// Layout budget:  header=72  pill=100  cards=400  gapEtc=28  → 600
// Quest layout:   header=72             cards=400  gapEtc=28  → 500
const SCENE_W = 860;        // card 400*2 + gap 40 + side-padding 20
const SCENE_H_VOTE = 600;   // voting: header + pill row + cards
const SCENE_H_QUEST = 500;  // quest:  header         + cards
const CARD_W = 400;
const CARD_H = 400;         // 1:1 aspect — room for content, not too tall

// ── Cinematic Vote Card (px dimensions, scaled by parent) ───────────────────
interface VoteCardProps {
  label: string;
  subLabel?: string;
  imageUrl: string;
  icon: React.ReactNode;
  titleColorClass: string;
  gradientFrom: string;
  borderClass: string;
  glowClass: string;
  onClick: () => void;
  disabled?: boolean;
  lockedLabel?: string;
}

function VoteCard({
  label, subLabel, imageUrl, icon, titleColorClass, gradientFrom, borderClass, glowClass,
  onClick, disabled = false, lockedLabel,
}: VoteCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        group relative overflow-hidden rounded-2xl shadow-2xl flex flex-col
        transition-all duration-500 border shrink-0
        ${borderClass} ${glowClass}
        ${disabled
          ? "cursor-not-allowed opacity-40 saturate-0"
          : "cursor-pointer hover:-translate-y-3 hover:scale-[1.02] active:scale-95"
        }
      `}
      style={{ width: `${CARD_W}px`, height: `${CARD_H}px` }}
    >
      {/* Background photo */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
        style={{ backgroundImage: `url('${imageUrl}')` }}
      />

      {/* Gradient overlay — bottom-heavy */}
      <div className={`absolute inset-0 bg-linear-to-t ${gradientFrom} via-black/25 to-transparent`} />

      {/* Playing-card corner — top left */}
      <div className="absolute top-4 left-4 flex flex-col items-center gap-0.5 pointer-events-none">
        <span className={`font-headline text-xl font-bold leading-none ${titleColorClass} opacity-40`}>
          {label[0]}
        </span>
        <div className={`w-4 h-4 ${titleColorClass} opacity-25`}>{icon}</div>
      </div>

      {/* Playing-card corner — bottom right (rotated) */}
      <div className="absolute bottom-4 right-4 flex flex-col items-center gap-0.5 pointer-events-none rotate-180">
        <span className={`font-headline text-xl font-bold leading-none ${titleColorClass} opacity-40`}>
          {label[0]}
        </span>
        <div className={`w-4 h-4 ${titleColorClass} opacity-25`}>{icon}</div>
      </div>

      {/* Content — bottom aligned */}
      <div className="relative mt-auto px-6 pb-6 pt-4 flex flex-col items-start gap-1.5">
        <div className={`mb-1 drop-shadow-lg ${titleColorClass}`}>
          <div className="w-10 h-10">{icon}</div>
        </div>
        <h3 className={`font-headline text-3xl font-bold tracking-wider uppercase ${titleColorClass} drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]`}>
          {label}
        </h3>
        {subLabel && (
          <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-white/50">
            {subLabel}
          </p>
        )}
        {lockedLabel && disabled && (
          <span className="mt-1 rounded-md border border-rose-300/35 bg-rose-950/55 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-rose-200">
            {lockedLabel}
          </span>
        )}
      </div>
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function VotingCards({
  gameState, me, socket, isReadOnly = false,
}: {
  gameState: AvalonRoom;
  me: AvalonPlayer;
  socket: Socket | null;
  isReadOnly?: boolean;
}) {
  const isVoting = gameState.state === "VOTING";
  const isQuest = gameState.state === "QUEST";
  const isViewerLocked = isReadOnly || me.isSpectator;
  const canVoteTeam = isVoting && !isViewerLocked;
  const canVoteQuest = isQuest && !isViewerLocked && gameState.proposedTeam.includes(me.userId);
  const isGoodTeamMember = me.team === "Good";
  const failCardLocked = canVoteQuest && isGoodTeamMember;
  const [showBetrayalWarning, setShowBetrayalWarning] = useState(false);

  const handleFailQuestVote = () => {
    if (isViewerLocked) return;
    if (failCardLocked) {
      setShowBetrayalWarning(true);
      return;
    }
    socket?.emit("voteQuest", "fail");
  };

  useEffect(() => {
    if (!showBetrayalWarning) return;
    const timer = window.setTimeout(() => setShowBetrayalWarning(false), 2600);
    return () => window.clearTimeout(timer);
  }, [showBetrayalWarning]);

  const proposedTeamPlayers = gameState.proposedTeam
    .map((uid) => gameState.players.find((p) => p.userId === uid))
    .filter((p): p is AvalonPlayer => Boolean(p));

  const showCards = isViewerLocked
    ? isVoting
    : (canVoteTeam && !me.hasVoted) || (canVoteQuest && !me.hasVoted);

  // ── Scale logic: same "Measure-then-Apply" pattern as old code ─────────────
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const sceneH = isVoting ? SCENE_H_VOTE : SCENE_H_QUEST;
  const scale = useSceneScale({
    viewportRef,
    sceneWidth: SCENE_W,
    sceneHeight: sceneH,
    padding: 16,
    minScale: 0.3,
    minViewportWidth: 280,
    minViewportHeight: 200,
    active: showCards
  });

  // Waiting state
  if (!showCards) {
    if (isVoting || isQuest) {
      return (
        <div className="absolute top-8 left-1/2 z-50 -translate-x-1/2 pointer-events-none">
          <div className="avalon-vote-wait-pill avalon-glass px-6 py-3 rounded-full border border-(--outline-variant)">
            <span className="avalon-vote-wait-text text-primary-avalon text-sm uppercase font-bold">
              {isViewerLocked
                ? 'Khán giả đang theo dõi lượt hiện tại...'
                : 'Cố gắng giấu nhẹm nụ cười tà ác... (Chờ kết quả)'}
            </span>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300 overflow-hidden">
      {/* Viewport — fills the overlay */}
      <div ref={viewportRef} className="relative w-full h-full">
        {/* Scene — fixed base size, uniformly scaled */}
        <div
          className="absolute left-1/2 top-1/2 pointer-events-auto"
          style={{
            width: `${SCENE_W}px`,
            height: `${sceneH}px`,
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          <div className="h-full w-full flex flex-col items-center justify-center gap-0 px-4">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="text-center mb-5" style={{ height: "72px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <h2 className="font-headline text-4xl tracking-widest text-primary-avalon avalon-title-glow-primary">
                The Council Decides
              </h2>
              <p className="font-label text-[11px] uppercase tracking-[0.28em] text-on-surface-variant/80 mt-0.5">
                {isVoting ? "Vote Team" : "Quest Decision"}
              </p>
            </div>

            {/* ── Proposed team pill (voting only) ───────────────────────── */}
            {isVoting && (
              <div className="mb-5 w-full rounded-xl border border-primary/25 bg-surface-container-low/70 px-4 py-3 text-center" style={{ height: "100px" }}>
                <p className="text-[10px] uppercase tracking-[0.24em] text-primary-avalon font-bold">
                  Đội được đề cử đi nhiệm vụ
                </p>
                {proposedTeamPlayers.length > 0 ? (
                  <div className="mt-2 flex flex-wrap justify-center gap-2">
                    {proposedTeamPlayers.map((player) => (
                      <span
                        key={player.userId}
                        className="rounded-full border border-primary/35 bg-primary/12 px-3 py-1 text-xs font-semibold text-on-surface"
                      >
                        {player.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-on-surface-variant">Chưa có người được đề cử.</p>
                )}
              </div>
            )}

            {/* ── Cards row ──────────────────────────────────────────────── */}
            <div className="flex gap-10 items-end justify-center">
              {isVoting ? (
                <>
                  <VoteCard
                    label="Approve"
                    subLabel="Giữ Vững Lời Thề"
                    imageUrl={IMG_APPROVE}
                    icon={<Shield className="w-full h-full fill-current opacity-90" />}
                    titleColorClass="text-primary"
                    gradientFrom="from-primary-container/80"
                    borderClass="border-primary/30"
                    glowClass="shadow-[0_0_28px_rgba(186,200,220,0.18)] hover:shadow-[0_8px_44px_rgba(186,200,220,0.36)]"
                    onClick={() => { if (!isViewerLocked) socket?.emit("voteTeam", "approve"); }}
                    disabled={isViewerLocked}
                    lockedLabel={isViewerLocked ? "Khán giả chỉ xem" : undefined}
                  />
                  <VoteCard
                    label="Reject"
                    subLabel="Gieo Rắc Bóng Tối"
                    imageUrl={IMG_REJECT}
                    icon={<HeartCrack className="w-full h-full opacity-90" />}
                    titleColorClass="text-secondary"
                    gradientFrom="from-surface-container-high/90"
                    borderClass="border-secondary/30"
                    glowClass="shadow-[0_0_28px_rgba(198,199,195,0.10)] hover:shadow-[0_8px_44px_rgba(198,199,195,0.28)]"
                    onClick={() => { if (!isViewerLocked) socket?.emit("voteTeam", "reject"); }}
                    disabled={isViewerLocked}
                    lockedLabel={isViewerLocked ? "Khán giả chỉ xem" : undefined}
                  />
                </>
              ) : (
                <>
                  <VoteCard
                    label="Success"
                    subLabel="Giữ Vững Lời Thề"
                    imageUrl={IMG_SUCCESS}
                    icon={<Trophy className="w-full h-full fill-current opacity-90" />}
                    titleColorClass="text-primary"
                    gradientFrom="from-primary-container/80"
                    borderClass="border-primary/30"
                    glowClass="shadow-[0_0_28px_rgba(186,200,220,0.18)] hover:shadow-[0_8px_44px_rgba(186,200,220,0.36)]"
                    onClick={() => { if (!isViewerLocked) socket?.emit("voteQuest", "success"); }}
                    disabled={isViewerLocked}
                    lockedLabel={isViewerLocked ? "Khán giả chỉ xem" : undefined}
                  />
                  <VoteCard
                    label="Fail"
                    subLabel="Phản Bội Camelot"
                    imageUrl={IMG_FAIL}
                    icon={<Skull className="w-full h-full fill-current opacity-90" />}
                    titleColorClass="text-tertiary"
                    gradientFrom="from-tertiary-container/80"
                    borderClass="border-tertiary/30"
                    glowClass="shadow-[0_0_28px_rgba(255,180,168,0.16)] hover:shadow-[0_8px_44px_rgba(255,180,168,0.34)]"
                    onClick={handleFailQuestVote}
                    disabled={isViewerLocked}
                    lockedLabel={isViewerLocked ? "Khán giả chỉ xem" : undefined}
                  />
                </>
              )}
            </div>

            {/* ── Good-team note ─────────────────────────────────────────── */}
            {canVoteQuest && isGoodTeamMember && (
              <p className="mt-4 text-center text-xs uppercase tracking-[0.16em] text-primary-avalon/90">
                Lưu ý: Phe tốt không được vote Thất bại.
              </p>
            )}

            {showBetrayalWarning && (
              <div className="absolute inset-0 z-80 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in-95 duration-200">
                <div className="max-w-145 rounded-2xl border border-rose-400/45 bg-linear-to-b from-rose-950/95 via-red-950/95 to-black/95 px-7 py-6 text-center shadow-[0_0_80px_rgba(255,80,80,0.45)] backdrop-blur-xl">
                  <p className="text-[11px] uppercase tracking-[0.35em] text-rose-200/80 font-black">
                    PHIÊN TOA TRUNG THÀNH
                  </p>
                  <h3 className="mt-2 font-headline text-3xl uppercase tracking-widest text-rose-100">
                    muốn phản bội vua hả mà vote fail???
                  </h3>
                  <p className="mt-3 text-xs uppercase tracking-[0.2em] text-rose-300/85 font-bold">
                    Triều đình ghi nhận ý đồ bất trung. Danh dự kỵ sĩ đang bị đặt dấu hỏi!
                  </p>
                  <p className="mt-2 text-[11px] text-rose-100/75">
                    Ngồi xuống, giữ bình tĩnh và chọn lại cho đúng phe của mình.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
