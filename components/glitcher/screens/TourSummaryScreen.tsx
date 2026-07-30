import type { GlitcherClientState, GlitcherPublicPlayer } from "@/server/game/GlitcherTypes";
import PlayerTile from "../PlayerTile";
import ResultSceneFrame from "../ResultSceneFrame";
import type { EmitGlitcherAction } from "../gameTypes";

export default function TourSummaryScreen({
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
  const summary = gameState.tourSummary;
  const winnerIds = new Set(summary?.winnerUserIds ?? []);
  const playerById = new Map(gameState.players.map((player) => [player.userId, player]));

  return (
    <ResultSceneFrame
      eyebrow={`Tour ${String(summary?.tourNumber ?? gameState.tourNumber).padStart(2, "0")}`}
      title="Bảng xếp hạng cuối tour"
      onExit={onExit}
    >
      {summary ? (
        <main className="glitcher-summary-layout">
          <section className="glitcher-summary-winner">
            <span>Dữ liệu ổn định nhất</span>
            <h2>
              {summary.rankedPlayers
                .filter((player) => winnerIds.has(player.userId))
                .map((player) => player.name)
                .join(" · ")}
            </h2>
            <p>
              {summary.winnerUserIds.length > 1
                ? "Tour kết thúc với nhiều người đồng chiến thắng."
                : "Người có tổng điểm cao nhất sau bốn scene."}
            </p>
          </section>

          <ol className="glitcher-ranking-list">
            {summary.rankedPlayers.map((rankedPlayer) => {
              const player = playerById.get(rankedPlayer.userId);
              if (!player) return null;

              return (
                <li key={rankedPlayer.userId} className={winnerIds.has(rankedPlayer.userId) ? "is-winner" : ""}>
                  <span className="glitcher-ranking-list__rank">
                    {String(rankedPlayer.rank).padStart(2, "0")}
                  </span>
                  <PlayerTile
                    player={player}
                    layout="ranking"
                    tone={winnerIds.has(rankedPlayer.userId) ? "winner" : "default"}
                  >
                    <span>{player.userId === me?.userId ? "Bạn" : `Ghế ${player.seatIndex + 1}`}</span>
                  </PlayerTile>
                  <strong>{rankedPlayer.totalScore} điểm</strong>
                </li>
              );
            })}
          </ol>

          <footer className="glitcher-summary-actions">
            {me?.isHost ? (
              <>
                <button
                  type="button"
                  onClick={() => emitAction("restartTour")}
                  className="glitcher-primary-button"
                >
                  Chơi tour mới
                </button>
                <button
                  type="button"
                  onClick={() => emitAction("returnToLobby")}
                  className="glitcher-secondary-button"
                >
                  Về phòng chờ
                </button>
              </>
            ) : (
              <p>Chủ phòng đang chọn hành trình tiếp theo.</p>
            )}
          </footer>
        </main>
      ) : (
        <div className="glitcher-result-loading" role="status">
          Đang tổng hợp bảng xếp hạng…
        </div>
      )}
    </ResultSceneFrame>
  );
}

