import type { GlitcherClientState } from "@/server/game/GlitcherTypes";
import GameTableFrame from "../GameTableFrame";
import PlayerRing from "../PlayerRing";

export default function DiscussionScreen({
  gameState,
  onExit,
}: {
  gameState: GlitcherClientState;
  onExit: () => void;
}) {
  return (
    <GameTableFrame
      gameState={gameState}
      timerLabel="Thời gian thảo luận"
      onExit={onExit}
      table={<PlayerRing players={gameState.players} viewerUserId={gameState.viewerUserId} />}
    >
      <div className="glitcher-discussion-panel">
        <div className="glitcher-panel-heading">
          <span>{gameState.discussionSeconds} giây</span>
          <h1>Đọc lỗi trong dữ liệu</h1>
        </div>

        <blockquote>
          Ai đang diễn một hiện trường gần giống, nhưng không thật sự thuộc về câu chuyện này?
        </blockquote>

        <div className="glitcher-discussion-panel__prompts">
          <span>So sánh cách hiểu vai</span>
          <span>Nhìn lại ba lần giơ tay</span>
          <span>Chú ý hành động lệch bối cảnh</span>
        </div>

        <p>
          Bạn được nói thật hoặc nói dối về vai của mình, nhưng không đưa màn hình cho người khác xem và không đọc
          nguyên văn toàn bộ thẻ.
        </p>
      </div>
    </GameTableFrame>
  );
}

