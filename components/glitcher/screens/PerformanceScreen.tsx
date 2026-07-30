import type { GlitcherClientState } from "@/server/game/GlitcherTypes";
import GameTableFrame from "../GameTableFrame";
import PlayerRing from "../PlayerRing";

export default function PerformanceScreen({
  gameState,
  onExit,
}: {
  gameState: GlitcherClientState;
  onExit: () => void;
}) {
  return (
    <GameTableFrame
      gameState={gameState}
      timerLabel="Thời gian diễn"
      onExit={onExit}
      table={<PlayerRing players={gameState.players} viewerUserId={gameState.viewerUserId} />}
    >
      <div className="glitcher-performance-panel">
        <div className="glitcher-panel-heading">
          <span>Phase diễn</span>
          <h1>Không một lời</h1>
        </div>

        <div className="glitcher-performance-panel__role">
          <span>Vai cần diễn</span>
          <strong>{gameState.privateCard?.role.name ?? "Đang giải mã…"}</strong>
          <p>{gameState.privateCard?.role.action}</p>
        </div>

        <div className="glitcher-performance-rules">
          <span>Tượng sống</span>
          <i>hoặc</i>
          <span>Chuyển động lặp</span>
        </div>

        <p className="glitcher-danger-note">Không nói, viết chữ, xô đẩy hoặc dùng vật nguy hiểm.</p>
      </div>
    </GameTableFrame>
  );
}

