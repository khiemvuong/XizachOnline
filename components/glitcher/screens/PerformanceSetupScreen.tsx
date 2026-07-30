import type { GlitcherClientState } from "@/server/game/GlitcherTypes";
import GameTableFrame from "../GameTableFrame";
import PlayerRing from "../PlayerRing";

export default function PerformanceSetupScreen({
  gameState,
  onExit,
}: {
  gameState: GlitcherClientState;
  onExit: () => void;
}) {
  return (
    <GameTableFrame
      gameState={gameState}
      timerLabel="Thời gian sắp vị trí"
      onExit={onExit}
      table={<PlayerRing players={gameState.players} viewerUserId={gameState.viewerUserId} />}
    >
      <div className="glitcher-instruction-panel">
        <div className="glitcher-panel-heading">
          <span>Chuẩn bị diễn</span>
          <h1>Sắp vị trí</h1>
        </div>
        <strong className="glitcher-instruction-panel__number">15</strong>
        <p>Đứng hoặc ngồi sao cho mọi người có thể nhìn thấy nhau rõ ràng.</p>
        <ul>
          <li>Không trao đổi nội dung thẻ.</li>
          <li>Để điện thoại xuống sau khi nhớ vai.</li>
          <li>Giữ khoảng cách an toàn.</li>
        </ul>
      </div>
    </GameTableFrame>
  );
}

