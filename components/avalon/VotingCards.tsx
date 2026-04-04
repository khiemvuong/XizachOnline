"use client";

import { AvalonPlayer, AvalonRoom } from "@/server/game/AvalonTypes";
import { Shield, Skull, Sparkles, HeartCrack } from "lucide-react";
import { Socket } from "socket.io-client";

export default function VotingCards({
  gameState,
  me,
  socket,
}: {
  gameState: AvalonRoom;
  me: AvalonPlayer;
  socket: Socket | null;
}) {
  const isVoting = gameState.state === "VOTING";
  const isQuest = gameState.state === "QUEST";
  const canVoteQuest = isQuest && gameState.proposedTeam.includes(me.userId);
  const isGoodTeamMember = me.team === "Good";
  const failCardLocked = canVoteQuest && isGoodTeamMember;
  const showCards = (isVoting && !me.hasVoted) || (canVoteQuest && !me.hasVoted);

  if (!showCards) {
    if (isVoting || isQuest) {
      return (
        <div className="absolute top-8 left-1/2 z-50 -translate-x-1/2 pointer-events-none">
          <div className="avalon-glass px-6 py-3 rounded-full border border-(--outline-variant)">
            <span className="text-primary-avalon text-sm uppercase st font-bold">
              Cố gắng giấu nhẹm nụ cười tà ác... (Chờ kết quả)
            </span>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm animate-in fade-in duration-300 px-4">
      <div className="w-full max-w-6xl">
        <div className="mb-6 text-center">
          <h2 className="font-headline text-3xl lg:text-4xl tracking-widest text-primary-avalon drop-shadow-[0_4px_4px_rgba(0,0,0,0.45)]">
            The Council Decides
          </h2>
          <p className="font-label text-[11px] uppercase tracking-[0.28em] text-on-surface-variant/80 mt-1">
            {isVoting ? "Vote Team" : "Quest Decision"}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 lg:gap-12 items-center justify-center">
          {isVoting ? (
            <>
              <button
                className="group relative w-full max-w-75 aspect-2/3 bg-surface-container-high rounded-xl overflow-hidden transition-all duration-500 hover:-translate-y-3 card-glow-primary border border-primary/15"
                onClick={() => socket?.emit("voteTeam", "approve")}
              >
                <div className="absolute inset-0 bg-linear-to-b from-primary/12 to-transparent opacity-60"></div>
                <div className="relative h-full flex flex-col items-center justify-between p-7 py-10">
                  <div className="w-full flex items-start justify-between">
                    <span className="font-headline text-2xl text-primary/40">A</span>
                    <Sparkles className="text-primary/30 w-7 h-7" />
                  </div>
                  <div className="flex flex-col items-center gap-5">
                    <div className="relative">
                      <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full"></div>
                      <Shield className="w-20 h-20 text-primary relative fill-current opacity-85" />
                    </div>
                    <h3 className="font-headline text-2xl tracking-widest text-primary uppercase">
                      Approve
                    </h3>
                  </div>
                  <div className="w-full flex items-end justify-between rotate-180">
                    <span className="font-headline text-2xl text-primary/40">A</span>
                    <Sparkles className="text-primary/30 w-7 h-7" />
                  </div>
                </div>
              </button>

              <button
                className="group relative w-full max-w-75 aspect-2/3 bg-surface-container-high rounded-xl overflow-hidden transition-all duration-500 hover:-translate-y-3 card-glow-tertiary border border-tertiary/15"
                onClick={() => socket?.emit("voteTeam", "reject")}
              >
                <div className="absolute inset-0 bg-linear-to-b from-tertiary/10 to-transparent opacity-60"></div>
                <div className="relative h-full flex flex-col items-center justify-between p-7 py-10">
                  <div className="w-full flex items-start justify-between">
                    <span className="font-headline text-2xl text-tertiary/40">R</span>
                    <Skull className="text-tertiary/30 w-7 h-7" />
                  </div>
                  <div className="flex flex-col items-center gap-5">
                    <div className="relative">
                      <div className="absolute inset-0 blur-2xl bg-tertiary/16 rounded-full"></div>
                      <HeartCrack className="w-20 h-20 text-tertiary relative opacity-85" />
                    </div>
                    <h3 className="font-headline text-2xl tracking-widest text-tertiary uppercase">
                      Reject
                    </h3>
                  </div>
                  <div className="w-full flex items-end justify-between rotate-180">
                    <span className="font-headline text-2xl text-tertiary/40">R</span>
                    <Skull className="text-tertiary/30 w-7 h-7" />
                  </div>
                </div>
              </button>
            </>
          ) : (
            <>
              <button
                className="group relative w-full max-w-75 aspect-2/3 border flex flex-col items-center justify-center transition-transform hover:-translate-y-3 shadow-2xl"
                style={{
                  backgroundColor: "#0f172a",
                  borderColor: "#1e293b",
                  borderRadius: "12px",
                }}
                onClick={() => socket?.emit("voteQuest", "success")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="60"
                  height="60"
                  viewBox="0 0 24 24"
                  fill="#bac8dc"
                  className="mb-6 opacity-90 group-hover:opacity-100 transition-opacity"
                >
                  <path d="M23 12l-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 3 8.6 1.54 6.71 4.72l-3.61.81.34 3.68L1 12l2.44 2.78-.34 3.69 3.61.82 1.89 3.18L12 21l3.4 1.46 1.89-3.18 3.61-.82-.34-3.68L23 12zm-13 5l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                </svg>
                <h2 className="text-primary-avalon font-serif uppercase tracking-widest text-2xl mb-2 opacity-90 drop-shadow-md">
                  Success
                </h2>
                <p className="text-[#64748b] text-[9px] uppercase tracking-[0.2em] font-sans font-bold">
                  Giữ Vững Lời Thề
                </p>
              </button>

              <button
                className={`group relative w-full max-w-75 aspect-2/3 border flex flex-col items-center justify-center shadow-2xl ${failCardLocked ? "cursor-not-allowed opacity-45 saturate-60" : "transition-transform hover:-translate-y-3 cursor-pointer"}`}
                style={{
                  backgroundColor: "#3f0f0f",
                  borderColor: "#450a0a",
                  borderRadius: "12px",
                }}
                onClick={() => {
                  if (!failCardLocked) {
                    socket?.emit("voteQuest", "fail");
                  }
                }}
                disabled={failCardLocked}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="60"
                  height="60"
                  viewBox="0 0 24 24"
                  fill="#ffb4a8"
                  className="mb-6 opacity-90 group-hover:opacity-100 transition-opacity drop-shadow-md"
                >
                  <path d="M12,2C7.58,2 4,5.58 4,10C4,13.32 6.05,16.17 9,17.42V20H11V18H13V20H15V17.42C17.95,16.17 20,13.32 20,10C20,5.58 16.42,2 12,2M8,9C9.1,9 10,9.9 10,11C10,12.1 9.1,13 8,13C6.9,13 6,12.1 6,11C6,9.9 6.9,9 8,9M16,9C17.1,9 18,9.9 18,11C18,12.1 17.1,13 16,13C14.9,13 14,12.1 14,11C14,9.9 14.9,9 16,9Z" />
                </svg>
                <h2 className="text-tertiary-avalon font-serif uppercase tracking-widest text-2xl mb-2 opacity-90 drop-shadow-md">
                  Fail
                </h2>
                <p className="text-[#991b1b] text-[9px] uppercase tracking-[0.2em] font-sans font-bold">
                  Gieo Rắc Bóng Tối
                </p>
                {failCardLocked && (
                  <p className="mt-3 rounded-md border border-rose-300/35 bg-rose-950/35 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-rose-200">
                    Phe Thiện bị khóa lá này
                  </p>
                )}
              </button>
            </>
          )}
        </div>

        {canVoteQuest && isGoodTeamMember && (
          <p className="mt-4 text-center text-xs uppercase tracking-[0.16em] text-primary-avalon/90">
            Lưu ý: Phe tốt không được vote Thất bại.
          </p>
        )}
      </div>
    </div>
  );
}
