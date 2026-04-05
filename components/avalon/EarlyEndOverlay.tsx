"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle, RotateCw, Shield, Skull } from "lucide-react";
import { type Socket } from "socket.io-client";
import { type AvalonRoom } from "@/server/game/AvalonTypes";

type VoteChoice = boolean;

type EarlyEndOverlayProps = {
  gameState: AvalonRoom;
  userId: string;
  socket: Socket | null;
};

export default function EarlyEndOverlay({ gameState, userId, socket }: EarlyEndOverlayProps) {
  const hasVoted = Boolean(gameState.earlyEndVotes?.includes(userId));
  const connectedCount = gameState.players.filter((player) => player.status === "connected").length;
  const voteCount = gameState.earlyEndVotes?.length || 0;
  const [localChoice, setLocalChoice] = useState<VoteChoice | null>(null);
  const [showRetryChoices, setShowRetryChoices] = useState(false);

  const showSuccess = localChoice !== null || (hasVoted && !showRetryChoices);

  const handleVote = (choice: VoteChoice) => {
    setShowRetryChoices(false);
    setLocalChoice(choice);
    socket?.emit("voteEarlyEnd", choice);
  };

  const handleVoteAgain = () => {
    setLocalChoice(null);
    setShowRetryChoices(true);
  };

  return (
    <div
      className="avalon-earlyend-shell fixed left-0 right-0 z-100 overflow-y-auto overflow-x-hidden avalon-atmospheric-bg px-4 py-8 md:px-6 md:py-10"
      style={{
        top: 'var(--avalon-shell-top-offset, 0px)',
        height: 'calc(100dvh - var(--avalon-shell-top-offset, 0px))',
      }}
    >
      <div className="avalon-earlyend-center min-h-full flex items-center justify-center">
        <div className="avalon-earlyend-frame w-full max-w-6xl">
          <div className="avalon-earlyend-hero mx-auto w-full max-w-4xl text-center mb-8 md:mb-10">
            <p className="text-[10px] md:text-xs uppercase tracking-[0.4em] font-label text-tertiary-avalon mb-3">
              THE FINAL DECREE
            </p>
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 animate-pulse text-tertiary-avalon drop-shadow-[0_0_18px_rgba(255,180,168,0.25)] md:h-14 md:w-14" />
            <h2 className="avalon-earlyend-title font-headline text-4xl font-bold uppercase tracking-tight leading-[0.92] text-tertiary-avalon drop-shadow-[0_0_24px_rgba(255,180,168,0.28)] sm:text-5xl md:text-7xl">
              Ritual of Termination
            </h2>
            <p className="avalon-earlyend-subtitle mx-auto mt-4 max-w-3xl text-base leading-relaxed font-headline italic text-on-surface-variant/90 md:text-xl">
              The host has proposed to seal the match early. The archive can still be kept alive.
            </p>
          </div>

          {showSuccess ? (
            <VoteSuccessPanel
              choice={localChoice}
              voteCount={voteCount}
              connectedCount={connectedCount}
              onVoteAgain={handleVoteAgain}
            />
          ) : (
            <div className="avalon-earlyend-grid mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 lg:gap-8 md:grid-cols-2">
              <VoteChoiceCard
                title={voteOptions.keep.title}
                subtitle={voteOptions.keep.subtitle}
                accentClass="text-primary-avalon"
                panelClass="bg-primary-container/20 border-primary/15 hover:border-primary/35"
                icon={<Shield className="h-12 w-12 fill-current text-primary-avalon opacity-85 md:h-14 md:w-14" />}
                onClick={() => handleVote(false)}
                disabled={showSuccess}
                isPrimary
              />

              <VoteChoiceCard
                title={voteOptions.cancel.title}
                subtitle={voteOptions.cancel.subtitle}
                accentClass="text-tertiary-avalon"
                panelClass="bg-tertiary-container/20 border-tertiary/15 hover:border-tertiary/35"
                icon={<Skull className="h-12 w-12 fill-current text-tertiary-avalon opacity-85 md:h-14 md:w-14" />}
                onClick={() => handleVote(true)}
                disabled={showSuccess}
              />
            </div>
          )}

          <div className="mx-auto mt-8 flex w-full max-w-4xl flex-col items-center gap-3 text-center md:mt-10">
            <div className="flex gap-2">
              <div className="h-1.5 w-8 rounded-full bg-primary shadow-[0_0_10px_rgba(186,200,220,0.45)]"></div>
              <div className="h-1.5 w-8 rounded-full bg-tertiary shadow-[0_0_10px_rgba(255,180,168,0.45)]"></div>
              <div className="h-1.5 w-8 rounded-full bg-surface-container-highest"></div>
              <div className="h-1.5 w-8 rounded-full bg-surface-container-highest"></div>
            </div>

            <p className="text-xs uppercase tracking-[0.28em] text-on-surface-variant font-label">
              {voteCount} / {connectedCount} votes recorded
            </p>

            {showSuccess ? (
              <div className="flex flex-col items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant/35 bg-surface-container-low/75 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.28em] text-on-surface-variant shadow-[0_0_30px_rgba(0,0,0,0.35)]">
                  <span className={`h-2 w-2 rounded-full shadow-[0_0_8px_rgba(255,180,168,0.45)] ${localChoice === true ? "bg-tertiary" : localChoice === false ? "bg-primary" : "bg-on-surface-variant"}`}></span>
                  Bạn đã vote thành công
                </div>
                <button
                  onClick={handleVoteAgain}
                  className="inline-flex items-center gap-2 rounded-full border border-outline-variant/40 bg-surface-container-low/70 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.28em] text-on-surface-variant transition-all hover:border-primary/30 hover:text-on-surface active:scale-[0.98]"
                >
                  <RotateCw className="h-4 w-4" />
                  Quay lại vote lại
                </button>
              </div>
            ) : (
              <p className="text-[10px] uppercase tracking-[0.24em] text-on-surface-variant/70">
                Chạm một lựa chọn để xác nhận phiếu của bạn.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function VoteChoiceCard({
  title,
  subtitle,
  accentClass,
  panelClass,
  icon,
  onClick,
  disabled,
  isPrimary = false,
}: {
  title: string;
  subtitle: string;
  accentClass: string;
  panelClass: string;
  icon: ReactNode;
  onClick: () => void;
  disabled: boolean;
  isPrimary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`avalon-earlyend-choice-card group relative flex min-h-80 flex-col items-center justify-center overflow-hidden rounded-[28px] border p-2 text-center transition-all duration-500 active:scale-[0.98] ${panelClass} ${disabled ? "cursor-default opacity-90" : "hover:-translate-y-1 hover:shadow-[0_0_50px_rgba(0,0,0,0.38)]"}`}
    >
      <div className="absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-90"></div>
      <div className="relative z-10 flex flex-col items-center px-6 py-10 md:py-12">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container-lowest/70 shadow-[0_0_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10 transition-transform group-hover:scale-105">
          {icon}
        </div>
        <h3 className={`mb-3 font-headline text-2xl uppercase tracking-[0.2em] md:text-3xl ${accentClass}`}>
          {title}
        </h3>
        <p className="max-w-70 text-sm leading-relaxed text-on-surface-variant md:text-base">
          {subtitle}
        </p>
      </div>
      <div className={`absolute bottom-0 left-0 h-1 w-full ${isPrimary ? "bg-primary/35" : "bg-tertiary/35"}`}></div>
    </button>
  );
}

const voteOptions = {
  keep: {
    title: "Từ Chối",
    subtitle: "Giữ ván đấu tiếp diễn cho đến khi phe nào đó giành chiến thắng thật sự.",
  },
  cancel: {
    title: "Đồng Ý Huỷ",
    subtitle: "Khóa lại trận đấu hiện tại và chấm dứt mọi diễn biến còn dang dở.",
  },
};

function VoteSuccessPanel({
  choice,
  voteCount,
  connectedCount,
  onVoteAgain,
}: {
  choice: VoteChoice | null;
  voteCount: number;
  connectedCount: number;
  onVoteAgain: () => void;
}) {
  const toneClass = choice === true ? "text-tertiary-avalon" : "text-primary-avalon";
  const icon = choice === null ? (
    <AlertTriangle className="h-10 w-10 text-on-surface-variant" />
  ) : choice ? (
    <Skull className="h-10 w-10 fill-current text-tertiary-avalon opacity-85" />
  ) : (
    <Shield className="h-10 w-10 fill-current text-primary-avalon opacity-85" />
  );

  return (
    <div className="avalon-earlyend-success mx-auto w-full max-w-4xl avalon-ending-panel rounded-[28px] border border-outline-variant/35 p-6 text-center shadow-[0_0_50px_rgba(0,0,0,0.45)] md:p-8">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container-lowest/70 shadow-[0_0_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10">
        {icon}
      </div>
      <p className="text-[10px] uppercase tracking-[0.4em] text-on-surface-variant font-label mb-3">VOTE REGISTERED</p>
      <h3 className={`avalon-earlyend-success-title font-headline text-3xl md:text-5xl uppercase tracking-[0.18em] mb-4 ${toneClass}`}>
        Bạn đã vote thành công
      </h3>
      <p className="mx-auto max-w-2xl text-sm md:text-lg leading-relaxed text-on-surface-variant">
        {choice === null
          ? "Lựa chọn của bạn đã được ghi nhận. Nếu muốn đổi ý, bạn có thể quay lại để vote lại ngay."
          : `Lựa chọn của bạn đã được ghi nhận cho ${choice ? voteOptions.cancel.title.toLowerCase() : voteOptions.keep.title.toLowerCase()}. Nếu muốn đổi ý, bạn có thể quay lại để vote lại ngay.`}
      </p>

      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-outline-variant/35 bg-surface-container-low/75 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.28em] text-on-surface-variant shadow-[0_0_30px_rgba(0,0,0,0.35)]">
        {voteCount} / {connectedCount} votes recorded
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <button
          onClick={onVoteAgain}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-on-primary transition-all hover:brightness-110 active:scale-[0.98]"
        >
          <RotateCw className="h-4 w-4" />
          Quay lại vote lại
        </button>
        <p className="text-[10px] uppercase tracking-[0.24em] text-on-surface-variant/70">
          Chạm nút để mở lại hai lựa chọn.
        </p>
      </div>
    </div>
  );
}