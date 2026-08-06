import Image from "next/image";
import type { CSSProperties } from "react";
import type { GlitcherPublicPlayer } from "@/server/game/GlitcherTypes";
import { GLITCHER_ASSETS } from "@/utils/glitcherAssets";
import PlayerTile, { type PlayerTileTone } from "./PlayerTile";

type RingSelection = {
  selectedUserId: string | null;
  disabledUserIds: ReadonlySet<string>;
  onSelect: (userId: string) => void;
};

export default function PlayerRing({
  players,
  viewerUserId,
  questionerUserIds = [],
  currentQuestionerUserId = null,
  emphasisUserId = null,
  selection,
}: {
  players: GlitcherPublicPlayer[];
  viewerUserId: string | null;
  questionerUserIds?: string[];
  currentQuestionerUserId?: string | null;
  emphasisUserId?: string | null;
  selection?: RingSelection;
}) {
  const seatedPlayers = [...players].sort((left, right) => left.seatIndex - right.seatIndex);
  const markerByUserId = new Map(questionerUserIds.map((userId, index) => [userId, index + 1]));

  return (
    <div className="glitcher-player-ring">
      <div className="glitcher-player-ring__route" aria-hidden="true" />
      <Image
        src={GLITCHER_ASSETS.raster.roseDataCore}
        alt=""
        aria-hidden="true"
        width={1254}
        height={1254}
        sizes="340px"
        className="glitcher-player-ring__core"
      />

      {seatedPlayers.map((player, index) => {
        const angle = -Math.PI / 2 + (index / Math.max(1, seatedPlayers.length)) * Math.PI * 2;
        const left = 50 + Math.cos(angle) * 42;
        const top = 50 + Math.sin(angle) * 40;
        const marker = markerByUserId.get(player.userId);
        const isSelected = selection?.selectedUserId === player.userId;
        const isDisabled =
          player.status !== "connected" || Boolean(selection?.disabledUserIds.has(player.userId));

        let tone: PlayerTileTone = player.userId === viewerUserId ? "viewer" : "default";
        if (marker) tone = "questioner";
        if (player.userId === currentQuestionerUserId) tone = "questioner";
        if (isSelected) tone = "selected";
        if (player.userId === emphasisUserId) tone = "glitch";

        const tile = (
          <PlayerTile player={player} layout="ring" tone={tone}>
            <span>
              {player.userId === viewerUserId ? "Bạn" : `Ghế ${String(player.seatIndex + 1).padStart(2, "0")}`}
            </span>
          </PlayerTile>
        );

        return (
          <div
            key={player.userId}
            className="glitcher-player-ring__seat"
            style={{ "--seat-left": `${left}%`, "--seat-top": `${top}%` } as CSSProperties}
          >
            {marker ? (
              <span
                className={`glitcher-question-marker ${
                  player.userId === currentQuestionerUserId ? "is-current" : ""
                }`}
                aria-label={`Người hỏi lượt ${marker}`}
              >
                {marker}
              </span>
            ) : null}

            {selection ? (
              <button
                type="button"
                onClick={() => selection.onSelect(player.userId)}
                disabled={isDisabled}
                className="glitcher-player-ring__select"
                aria-pressed={isSelected}
                aria-label={`Bỏ phiếu cho ${player.name}`}
              >
                {tile}
              </button>
            ) : (
              tile
            )}
          </div>
        );
      })}
    </div>
  );
}

