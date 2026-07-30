import Image from "next/image";
import type { GlitcherClientState, GlitcherPublicPlayer } from "@/server/game/GlitcherTypes";
import { GLITCHER_ASSETS } from "@/utils/glitcherAssets";
import PlayerTile from "../PlayerTile";
import ResultSceneFrame from "../ResultSceneFrame";
import type { EmitGlitcherAction } from "../gameTypes";

export default function RevealScreen({
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
  const reveal = gameState.latestReveal;
  const glitchPlayer = gameState.players.find((player) => player.userId === reveal?.glitchUserId);
  const glitchScoreDelta = reveal?.scores.find((score) => score.userId === reveal.glitchUserId)?.delta ?? 0;

  return (
    <ResultSceneFrame
      eyebrow={`Scene ${String(gameState.sceneNumber).padStart(2, "0")}/${String(gameState.totalScenes).padStart(2, "0")}`}
      title="Dữ liệu đã được giải mã"
      onExit={onExit}
    >
      {reveal ? (
        <main className="glitcher-reveal-layout">
          <section className="glitcher-reveal-scenes">
            <article>
              <span>Hiện trường thật</span>
              <h2>{reveal.trueScene.title}</h2>
              <p>{reveal.trueScene.description}</p>
            </article>
            <article className="is-glitch-scene">
              <span>Hiện trường mồi</span>
              <h2>{reveal.glitchScene.title}</h2>
              <p>{reveal.glitchScene.description}</p>
            </article>
          </section>

          <section className="glitcher-reveal-identity" aria-labelledby="glitcher-revealed-player">
            <Image
              src={GLITCHER_ASSETS.raster.roseDataCore}
              alt=""
              aria-hidden="true"
              width={1254}
              height={1254}
              sizes="320px"
            />
            <span>Glitch là</span>
            <h2 id="glitcher-revealed-player">{reveal.glitchPlayerName}</h2>
            {glitchPlayer ? (
              <PlayerTile player={glitchPlayer} layout="ranking" tone="glitch">
                <span>Scene này +{glitchScoreDelta}</span>
              </PlayerTile>
            ) : null}
          </section>

          <section className="glitcher-reveal-breakdown">
            <div>
              <div className="glitcher-panel-heading">
                <span>Phiếu đã mở</span>
                <h2>Lựa chọn của cả nhóm</h2>
              </div>
              <ul className="glitcher-reveal-votes">
                {reveal.votes.map((vote) => (
                  <li key={vote.voterUserId}>
                    <span>{vote.voterName}</span>
                    <i aria-hidden="true">→</i>
                    <strong>{vote.targetName ?? (vote.timedOut ? "Hết giờ" : "Không có phiếu")}</strong>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="glitcher-panel-heading">
                <span>Điểm scene</span>
                <h2>Biến động dữ liệu</h2>
              </div>
              <ul className="glitcher-reveal-scores">
                {reveal.scores.map((score) => (
                  <li key={score.userId}>
                    <span>{score.playerName}</span>
                    <strong className={score.delta > 0 ? "is-positive" : ""}>+{score.delta}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <footer className="glitcher-reveal-actions">
            {me?.isHost ? (
              <button
                type="button"
                onClick={() => emitAction("nextScene")}
                className="glitcher-primary-button"
              >
                {gameState.sceneNumber >= gameState.totalScenes ? "Xem tổng kết tour" : "Scene tiếp theo"}
              </button>
            ) : (
              <p>Đang chờ chủ phòng mở dữ liệu tiếp theo…</p>
            )}
          </footer>
        </main>
      ) : (
        <div className="glitcher-result-loading" role="status">
          Đang đối chiếu phiếu và cộng điểm…
        </div>
      )}
    </ResultSceneFrame>
  );
}
