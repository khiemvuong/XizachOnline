"use client";

import React, { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type { Socket } from "socket.io-client";
import type { DeceptionPlayer, DeceptionRoom } from "@/server/game/DeceptionTypes";
import RulesModal from "@/components/deception/RulesModal";
import PingIndicator from "./PingIndicator";
import {
  ArrowLeft,
  Camera,
  Check,
  Clock3,
  Copy,
  Fingerprint,
  Gavel,
  MessageSquareText,
  Play,
  SendHorizontal,
  Share2,
  Shield,
  ScrollText,
  Star,
  UserPlus,
  UserRound,
} from "lucide-react";

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function DeceptionLobby({
  gameState,
  me,
  socket,
  roomId,
  playerPings,
  setPlayerPings,
  onBackHome,
  voiceChatNode,
}: {
  gameState: DeceptionRoom;
  me?: DeceptionPlayer;
  socket: Socket | null;
  roomId: string;
  playerPings: Record<string, number>;
  setPlayerPings: Dispatch<SetStateAction<Record<string, number>>>;
  onBackHome: () => void;
  voiceChatNode?: React.ReactNode;
}) {
  const [nameInput, setNameInput] = useState(me?.name || "");
  const [chatText, setChatText] = useState("");
  const [showRules, setShowRules] = useState(false);

  const isHost = Boolean(me?.isHost);
  const connectedActivePlayers = gameState.players.filter(
    (player) => player.status === "connected" && !player.isSpectator,
  );
  const connectedCount = connectedActivePlayers.length;
  const canStart = isHost && connectedCount >= 4 && connectedCount <= 12;

  const sortedPlayers = useMemo(
    () => [...gameState.players].sort((a, b) => Number(Boolean(b.isHost)) - Number(Boolean(a.isHost))),
    [gameState.players],
  );

  const visibleChatMessages = useMemo(
    () => gameState.messages.filter((message) => message.senderId !== "system"),
    [gameState.messages],
  );

  const openSlots = Math.min(4, Math.max(0, 12 - gameState.players.length));

  const copyRoomCode = () => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(roomId).catch(() => {
      // Clipboard can be blocked by browser policy; keep this action non-blocking.
    });
  };

  const saveNickname = () => {
    const normalized = nameInput.trim().slice(0, 14) || me?.name || "AGENT";
    setNameInput(normalized);
    localStorage.setItem("deception_playerName", normalized);
    socket?.emit("changeName", normalized);
  };

  return (
    <div className="deception-room-bg deception-lobby-shell flex h-dvh flex-col overflow-hidden">
      <header className="deception-lobby-topbar px-3 py-2.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <Fingerprint className="h-6 w-6 shrink-0 text-(--deception-red)" />
          <h1 className="deception-lobby-brand-title truncate text-base font-black uppercase tracking-[0.14em] text-(--deception-red) sm:text-2xl">
            Deception
          </h1>
        </div>

        <div className="deception-lobby-room-chip hidden min-w-0 items-center gap-2 md:flex">
          <span className="text-[10px] uppercase tracking-[0.18em] text-(--on-surface-variant)">Room Code</span>
          <span className="truncate text-sm font-black uppercase tracking-[0.14em] text-(--on-surface)">PHONG: {roomId}</span>
          <button onClick={copyRoomCode} className="deception-icon-btn h-8 w-8" title="Chia sẻ mã phòng">
            <Share2 className="h-4 w-4" />
          </button>
          <div className="ml-1">
            <PingIndicator socket={socket} userId={me?.userId} setPlayerPings={setPlayerPings} />
          </div>
        </div>

        <div className="deception-topbar-actions flex items-center gap-2">
          <button onClick={onBackHome} className="deception-icon-btn" title="Về /deception">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button onClick={copyRoomCode} className="deception-icon-btn md:hidden" title="Sao chép mã phòng">
            <Copy className="h-4 w-4" />
          </button>
          <button onClick={() => setShowRules(true)} className="deception-icon-btn" title="Luật chơi">
            <ScrollText className="h-4 w-4" />
          </button>
          {voiceChatNode && (
            <div className="ml-1 shrink-0">
              {voiceChatNode}
            </div>
          )}
        </div>
      </header>

      <main className="deception-lobby-main min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-2 sm:px-4 sm:pb-4 sm:pt-3">
        <div className="mx-auto grid w-full max-w-screen-2xl min-h-0 content-start gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="deception-card flex min-h-0 flex-col rounded-xl p-3 sm:p-4">
            <div className="deception-lobby-heading flex flex-wrap items-end justify-between gap-3 border-b border-(--deception-border) pb-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-(--deception-cyan)">Case #{roomId}</p>
                <h2 className="mt-1 text-lg font-black uppercase tracking-widest text-(--on-surface) sm:text-2xl">
                  Waiting For Investigators
                </h2>
                <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-(--deception-red-soft)">
                  {connectedCount} / 12 players ready
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  value={nameInput}
                  onChange={(event) => setNameInput(event.target.value.slice(0, 14))}
                  className="deception-input w-44"
                  placeholder="Mật danh"
                />
                <button
                  onClick={saveNickname}
                  className="deception-btn-outline px-3 py-2 text-[11px] uppercase tracking-[0.16em]"
                >
                  Lưu tên
                </button>
              </div>
            </div>

            <div className="deception-lobby-player-grid mt-3 grid min-h-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
              {sortedPlayers.map((player) => (
                <article
                  key={player.userId}
                  className={`deception-lobby-player-card flex min-h-28 flex-col rounded-xl border p-2.5 transition ${
                    player.isHost
                      ? "border-(--deception-red) bg-[rgba(255,45,85,0.11)]"
                      : player.isSpectator
                        ? "border-(--deception-amber) bg-[rgba(255,184,0,0.08)]"
                        : "border-(--deception-border) bg-[rgba(255,255,255,0.03)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="deception-avatar h-9 w-9 shrink-0">
                        {player.isSpectator ? <Camera className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold uppercase tracking-[0.08em] text-(--on-surface) sm:text-sm">
                          {player.name}
                          {player.userId === me?.userId ? " (Bạn)" : ""}
                          {playerPings[player.userId] !== undefined && (
                            <span className={`ml-1 text-[10px] font-black font-mono tracking-tighter ${
                              playerPings[player.userId] < 150
                                ? "text-emerald-400"
                                : playerPings[player.userId] < 350
                                  ? "text-amber-400"
                                  : "text-red-500"
                            }`}>
                              {Math.min(999, playerPings[player.userId])}ms
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-(--on-surface-variant)">
                          {player.status === "connected" ? "Connected" : "Disconnected"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {player.isHost && <Star className="h-4 w-4 text-(--deception-amber)" fill="currentColor" />}
                      {!player.isHost && isHost && player.status === "connected" && !player.isSpectator && (
                        <button
                          onClick={() => socket?.emit("transferHost", player.userId)}
                          className="deception-icon-btn h-8 w-8"
                          title="Chuyển host"
                        >
                          <Shield className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {player.userId === me?.userId && !player.isHost && (
                    <button
                      onClick={() => socket?.emit("toggleSpectatorLobby")}
                      className="mt-2 w-full rounded-lg border border-(--deception-border) px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-(--on-surface-variant) transition hover:border-(--deception-cyan)"
                    >
                      {player.isSpectator ? "Rời spectator" : "Vào spectator"}
                    </button>
                  )}
                </article>
              ))}

              {Array.from({ length: openSlots }).map((_, index) => (
                <article
                  key={`open-slot-${index}`}
                  className="deception-lobby-empty-slot flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border border-(--deception-border) p-2.5 opacity-60"
                >
                  <div className="flex h-10 w-10 items-center justify-center bg-[rgba(255,255,255,0.03)]">
                    <UserPlus className="h-5 w-5 text-(--on-surface-variant)" />
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-(--on-surface-variant)">Open Slot</p>
                </article>
              ))}
            </div>
          </section>

          <aside className="deception-lobby-side grid min-h-0 grid-rows-[auto_1fr] gap-3">
            <section className="deception-card rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="deception-lobby-badge-icon flex h-10 w-10 items-center justify-center border border-(--deception-red) bg-[rgba(255,45,85,0.1)]">
                  <Shield className="h-5 w-5 text-(--deception-red-soft)" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold uppercase tracking-[0.12em] text-(--on-surface)">
                    {me?.name || "Inspector"}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-(--on-surface-variant)">
                    {isHost ? "Host Control Online" : "Case Badge"}
                  </p>
                </div>
                <span className="ml-auto inline-flex items-center gap-1 rounded-md border border-(--deception-cyan) bg-[rgba(0,212,255,0.1)] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-(--deception-cyan)">
                  <Check className="h-3.5 w-3.5" />
                  Online
                </span>
              </div>
            </section>

            <section className="deception-card flex min-h-0 flex-col rounded-xl p-3 sm:p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-(--deception-cyan)">
                <MessageSquareText className="h-4 w-4" />
                Investigation Log
              </div>

              <div className="deception-lobby-chat-list min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {visibleChatMessages.length === 0 ? (
                  <p className="text-sm text-(--on-surface-variant)">Chưa có tin nhắn.</p>
                ) : (
                  visibleChatMessages.slice(-20).map((message, index) => {
                    const isMyMessage = message.senderId === me?.userId;
                    return (
                      <div
                        key={`${message.timestamp}-${index}`}
                        className={`rounded-lg border p-2 ${
                          isMyMessage
                            ? "border-(--deception-cyan) bg-[rgba(0,212,255,0.08)]"
                            : "border-(--deception-border) bg-[rgba(255,255,255,0.03)]"
                        }`}
                      >
                        <p
                          className={`text-[10px] uppercase tracking-[0.14em] ${
                            isMyMessage ? "text-(--deception-cyan)" : "text-(--deception-red-soft)"
                          }`}
                        >
                          {message.senderName}
                        </p>
                        <p className="mt-1 text-sm text-(--on-surface)">{message.text}</p>
                      </div>
                    );
                  })
                )}
              </div>

              <form
                className="mt-3 flex items-center gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const text = chatText.trim();
                  if (!text) return;
                  socket?.emit("chatMessage", text);
                  setChatText("");
                }}
              >
                <input
                  value={chatText}
                  onChange={(event) => setChatText(event.target.value.slice(0, 500))}
                  className="deception-input min-w-0 flex-1"
                  placeholder="Nhập tin nhắn..."
                />
                <button type="submit" className="deception-icon-btn h-10 w-10" title="Gửi">
                  <SendHorizontal className="h-4 w-4" />
                </button>
              </form>
            </section>
          </aside>
        </div>
      </main>

      <footer className="deception-lobby-bottom px-3 py-3 sm:px-4 sm:py-3.5">
        <div className="deception-lobby-bottom-inner mx-auto grid max-w-screen-2xl gap-2.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center lg:grid-cols-[minmax(0,1fr)_auto_auto]">
            <div className="rounded-lg border border-(--deception-border) bg-[rgba(255,255,255,0.02)] p-2.5">
              <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-(--on-surface-variant)">
                <span className="deception-lobby-slider-label inline-flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5" />
                  Discussion Time
                </span>
                <span className="font-bold text-(--deception-red-soft)">
                  {formatTime(gameState.settings.discussionTimeSeconds)}
                </span>
              </div>
              <input
                type="range"
                min={60}
                max={600}
                step={30}
                value={gameState.settings.discussionTimeSeconds}
                disabled={!isHost}
                onChange={(event) =>
                  socket?.emit("updateSettings", {
                    discussionTimeSeconds: Number(event.target.value),
                  })
                }
                className="w-full accent-(--deception-red) disabled:cursor-not-allowed"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-(--deception-border) px-3 py-2">
              <label
                className={`inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] ${
                  isHost ? "cursor-pointer" : "cursor-not-allowed opacity-70"
                }`}
              >
                <input
                  type="checkbox"
                  checked={gameState.settings.enableAccomplice}
                  disabled={!isHost}
                  onChange={() =>
                    socket?.emit("updateSettings", {
                      enableAccomplice: !gameState.settings.enableAccomplice,
                    })
                  }
                  className="h-4 w-4 accent-(--deception-red)"
                />
                Accomplice
              </label>

              <label
                className={`inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] ${
                  isHost ? "cursor-pointer" : "cursor-not-allowed opacity-70"
                }`}
              >
                <input
                  type="checkbox"
                  checked={gameState.settings.enableWitness}
                  disabled={!isHost}
                  onChange={() =>
                    socket?.emit("updateSettings", {
                      enableWitness: !gameState.settings.enableWitness,
                    })
                  }
                  className="h-4 w-4 accent-(--deception-red)"
                />
                Witness
              </label>

              {/* Compact difficulty toggle — visible on all screens < lg */}
              <div className="flex items-center gap-1.5 lg:hidden">
                <span className="text-[10px] uppercase tracking-[0.12em] text-(--on-surface-variant)">
                  Difficulty
                </span>
                <div className="flex items-center gap-0.5 rounded-md border border-(--deception-border) bg-[rgba(255,255,255,0.02)] p-0.5">
                  <button
                    disabled={!isHost}
                    onClick={() => socket?.emit("updateSettings", { sceneDifficulty: "easy" })}
                    className={`rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-widest transition disabled:cursor-not-allowed ${
                      gameState.settings.sceneDifficulty === "easy"
                        ? "bg-emerald-600 text-white"
                        : "text-(--on-surface-variant) hover:bg-emerald-600/20 hover:text-emerald-300 disabled:hover:bg-transparent disabled:hover:text-(--on-surface-variant)"
                    }`}
                    title="Easy — thẻ cụ thể, dễ suy luận"
                  >
                    Easy
                  </button>
                  <button
                    disabled={!isHost}
                    onClick={() => socket?.emit("updateSettings", { sceneDifficulty: "hard" })}
                    className={`rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-widest transition disabled:cursor-not-allowed ${
                      gameState.settings.sceneDifficulty === "hard"
                        ? "bg-rose-600 text-white"
                        : "text-(--on-surface-variant) hover:bg-rose-600/20 hover:text-rose-300 disabled:hover:bg-transparent disabled:hover:text-(--on-surface-variant)"
                    }`}
                    title="Hard — bản gốc board game"
                  >
                    Hard
                  </button>
                </div>
              </div>
            </div>

            <div className="hidden items-center gap-2 rounded-lg border border-(--deception-border) px-3 py-2 lg:flex">
              <Gavel className="h-4 w-4 text-(--deception-amber)" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-(--on-surface)">
                  Scene Difficulty
                </p>
                <p className="text-[11px] text-(--on-surface-variant)">
                  {gameState.settings.sceneDifficulty === "easy" ? "Easy — dễ suy luận" : "Hard — bản gốc"}
                </p>
              </div>
              <div className="ml-2 flex items-center gap-1 rounded-md border border-(--deception-border) bg-[rgba(255,255,255,0.02)] p-0.5">
                <button
                  disabled={!isHost}
                  onClick={() => socket?.emit("updateSettings", { sceneDifficulty: "easy" })}
                  className={`rounded px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] transition disabled:cursor-not-allowed ${
                    gameState.settings.sceneDifficulty === "easy"
                      ? "bg-emerald-600 text-white"
                      : "text-(--on-surface-variant) hover:bg-emerald-600/20 hover:text-emerald-300 disabled:hover:bg-transparent disabled:hover:text-(--on-surface-variant)"
                  }`}
                  title="Chế độ Easy — thẻ tình huống cụ thể, dễ suy luận"
                >
                  Easy
                </button>
                <button
                  disabled={!isHost}
                  onClick={() => socket?.emit("updateSettings", { sceneDifficulty: "hard" })}
                  className={`rounded px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] transition disabled:cursor-not-allowed ${
                    gameState.settings.sceneDifficulty === "hard"
                      ? "bg-rose-600 text-white"
                      : "text-(--on-surface-variant) hover:bg-rose-600/20 hover:text-rose-300 disabled:hover:bg-transparent disabled:hover:text-(--on-surface-variant)"
                  }`}
                  title="Chế độ Hard — thẻ tình huống bản gốc board game"
                >
                  Hard
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              disabled={!canStart}
              onClick={() => socket?.emit("startGame")}
              className="deception-btn-red deception-lobby-start-btn inline-flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>Start Investigation</span>
              <Play className="h-4 w-4" fill="currentColor" />
            </button>
            {!canStart && (
              <p className="text-[11px] uppercase tracking-[0.14em] text-(--on-surface-variant)">
                Cần 4-12 người chơi.
              </p>
            )}
          </div>
        </div>
      </footer>

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}
