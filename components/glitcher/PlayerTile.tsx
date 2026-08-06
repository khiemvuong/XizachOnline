import Image from "next/image";
import type { ReactNode } from "react";
import type { GlitcherPublicPlayer } from "@/server/game/GlitcherTypes";
import { getGlitcherAvatarSrc } from "@/utils/glitcherAssets";

export type PlayerTileTone =
  | "default"
  | "viewer"
  | "questioner"
  | "selected"
  | "glitch"
  | "winner";

export default function PlayerTile({
  player,
  layout,
  tone = "default",
  children,
  className = "",
}: {
  player: GlitcherPublicPlayer;
  layout: "lobby" | "ring" | "ranking";
  tone?: PlayerTileTone;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`glitcher-player-tile glitcher-player-tile--${layout} is-${tone} ${className}`}>
      <div className="glitcher-player-tile__avatar">
        <Image
          src={getGlitcherAvatarSrc(player.seatIndex)}
          alt=""
          aria-hidden="true"
          fill
          sizes={layout === "lobby" ? "96px" : "72px"}
          className="object-cover"
        />
        <span className={`glitcher-player-tile__connection is-${player.status}`} aria-hidden="true" />
      </div>

      <div className="glitcher-player-tile__copy">
        <div className="glitcher-player-tile__name-row">
          <strong title={player.name}>{player.name}</strong>
          {player.isHost ? <span className="glitcher-player-tile__host">Chủ phòng</span> : null}
        </div>
        {children ? <div className="glitcher-player-tile__meta">{children}</div> : null}
      </div>
    </div>
  );
}

