"use client";

import Image from "next/image";
import { ArrowLeft, Copy, Play, UsersRound } from "lucide-react";
import type { GlitcherClientState, GlitcherPublicPlayer } from "@/server/game/GlitcherTypes";
import { GLITCHER_ASSETS } from "@/utils/glitcherAssets";
import BrandMark from "../BrandMark";
import PlayerTile from "../PlayerTile";
import type { EmitGlitcherAction } from "../gameTypes";

export default function GlitcherLobby({
  gameState,
  me,
  emitAction,
  onExit,
}: {
  gameState: GlitcherClientState;
  me?: GlitcherPublicPlayer;
  emitAction: EmitGlitcherAction;
  onExit: () => void;
}) {
  const connectedPlayers = gameState.players
    .filter((player) => player.status === "connected")
    .sort((left, right) => left.seatIndex - right.seatIndex);
  const readyCount = connectedPlayers.filter((player) => player.isReady).length;
  const allReady = connectedPlayers.length > 0 && readyCount === connectedPlayers.length;
  const enoughPlayers = connectedPlayers.length >= gameState.settings.minPlayers;
  const canStart = Boolean(me?.isHost && enoughPlayers && allReady);

  const copyRoomCode = () => {
    navigator.clipboard?.writeText(gameState.roomId).catch(() => undefined);
  };

  return (
    <div className="glitcher-lobby">
      <div className="glitcher-glitch-overlay" aria-hidden="true" />
      <Image
        src={GLITCHER_ASSETS.raster.roseCorner}
        alt=""
        aria-hidden="true"
        width={1448}
        height={1086}
        sizes="42vw"
        className="glitcher-lobby__rose"
      />

      <header className="glitcher-lobby__header">
        <BrandMark compact />

        <div className="glitcher-room-facts">
          <div className="glitcher-room-code">
            <span>Phòng</span>
            <strong>{gameState.roomId}</strong>
          </div>
          <div className="glitcher-room-count">
            <UsersRound aria-hidden="true" />
            <strong>{connectedPlayers.length} người</strong>
          </div>
          <button type="button" onClick={copyRoomCode} className="glitcher-secondary-button">
            <Copy aria-hidden="true" />
            <span>Sao chép mã</span>
          </button>
        </div>

        <button type="button" onClick={onExit} className="glitcher-icon-button" aria-label="Rời phòng">
          <ArrowLeft aria-hidden="true" />
        </button>
      </header>

      <main className="glitcher-lobby__main">
        <section className="glitcher-lobby__roster" aria-labelledby="glitcher-roster-heading">
          <div className="glitcher-panel-heading">
            <span>Tour {String(gameState.tourNumber).padStart(2, "0")}</span>
            <h1 id="glitcher-roster-heading">Đội hình hiện tại</h1>
          </div>

          <div className="glitcher-lobby__players">
            {connectedPlayers.map((player) => (
              <PlayerTile
                key={player.userId}
                player={player}
                layout="lobby"
                tone={player.userId === me?.userId ? "viewer" : "default"}
              >
                <span className={`glitcher-ready-pill ${player.isReady ? "is-ready" : ""}`}>
                  {player.isReady ? "Sẵn sàng" : "Chưa sẵn sàng"}
                </span>
              </PlayerTile>
            ))}
          </div>
        </section>

        <aside className="glitcher-lobby__ready-panel" aria-labelledby="glitcher-ready-heading">
          <div className="glitcher-ready-score">
            <strong>
              {readyCount}
              <span>/{connectedPlayers.length}</span>
            </strong>
            <h2 id="glitcher-ready-heading">Sẵn sàng</h2>
          </div>

          <Image
            src={GLITCHER_ASSETS.vector.divider}
            alt=""
            aria-hidden="true"
            width={640}
            height={24}
            unoptimized
            className="glitcher-ready-divider"
          />

          <p>
            {enoughPlayers
              ? allReady
                ? "Cả nhóm đã sẵn sàng."
                : `Đang chờ ${connectedPlayers.length - readyCount} người xác nhận.`
              : `Cần thêm ${gameState.settings.minPlayers - connectedPlayers.length} người để bắt đầu.`}
          </p>

          <div className="glitcher-lobby__actions">
            <button
              type="button"
              onClick={() => emitAction("toggleReady")}
              className={`glitcher-primary-button ${me?.isReady ? "is-confirmed" : ""}`}
            >
              {me?.isReady ? "Hủy sẵn sàng" : "Sẵn sàng"}
            </button>

            {me?.isHost ? (
              <button
                type="button"
                onClick={() => emitAction("startTour")}
                disabled={!canStart}
                className="glitcher-secondary-button glitcher-start-button"
              >
                <Play aria-hidden="true" />
                <span>Bắt đầu tour</span>
              </button>
            ) : (
              <span className="glitcher-lobby__host-note">Chủ phòng sẽ bắt đầu khi cả nhóm đã sẵn sàng.</span>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}

