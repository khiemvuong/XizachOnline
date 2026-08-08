"use client";

import Image from "next/image";
import { ArrowRight, BookOpenText, Fingerprint, RotateCcw, ShieldCheck, Vote } from "lucide-react";
import type { GlitcherClientState, GlitcherPublicPlayer } from "@/server/game/GlitcherTypes";
import { getGlitcherAvatarSrc, GLITCHER_ASSETS } from "@/utils/glitcherAssets";
import ResultSceneFrame from "../ResultSceneFrame";
import type { EmitGlitcherAction } from "../gameTypes";

const OUTCOME_COPY = {
  GLITCH_WIN: {
    title: "Glitch thắng",
    description: "Kẻ giả mạo đã đánh lạc hướng cả nhóm và sống sót qua lượt bỏ phiếu cuối cùng.",
    tone: "glitch",
  },
  NORMAL_WIN: {
    title: "Dân thắng",
    description: "Cả nhóm đã đọc đúng những sai lệch và tìm ra chính xác người giữ vai Glitch.",
    tone: "normal",
  },
  TIE: {
    title: "Ván đấu hòa",
    description: "Lượt bỏ phiếu cao nhất bị chia đều và Glitch vẫn nằm trong nhóm bị nghi ngờ.",
    tone: "tie",
  },
} as const;

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
  const glitchUserIds = reveal?.glitchUserIds ?? (reveal ? [reveal.glitchUserId] : []);
  const glitchPlayers = gameState.players.filter((player) => glitchUserIds.includes(player.userId));

  if (!reveal) {
    return (
      <ResultSceneFrame eyebrow="Kết quả giải mã" title="Kết quả ván đấu" onExit={onExit}>
        <div className="glitcher-reveal-loading" role="status">
          <span aria-hidden="true" />
          <strong>Đang tổng hợp phiếu bầu</strong>
          <p>Kết quả sẽ xuất hiện ngay khi máy chủ hoàn tất đối chiếu.</p>
        </div>
      </ResultSceneFrame>
    );
  }

  const outcome = OUTCOME_COPY[reveal.outcome];
  const submittedVotes = reveal.votes.filter((vote) => vote.targetUserId !== null).length;
  const votesAgainstGlitch = reveal.votes.filter((vote) =>
    vote.targetUserId !== null && glitchUserIds.includes(vote.targetUserId),
  ).length;

  return (
    <ResultSceneFrame eyebrow={`Hiện trường ${reveal.sceneNumber}`} title="Kết quả ván đấu" onExit={onExit}>
      <main className={`glitcher-reveal is-${outcome.tone}`}>
        <section className="glitcher-reveal__hero" aria-labelledby="glitcher-outcome-title">
          <div className="glitcher-reveal__outcome">
            <span className="glitcher-reveal__kicker">
              <ShieldCheck aria-hidden="true" />
              Kết quả chung cuộc
            </span>
            <h1 id="glitcher-outcome-title">{outcome.title}</h1>
            <p>{outcome.description}</p>

            <dl className="glitcher-reveal__metrics" aria-label="Tóm tắt lượt bỏ phiếu">
              <div>
                <dt>Phiếu chỉ đúng Glitch</dt>
                <dd>{votesAgainstGlitch}</dd>
              </div>
              <div>
                <dt>Phiếu hợp lệ</dt>
                <dd>{submittedVotes}/{reveal.votes.length}</dd>
              </div>
            </dl>
          </div>

          <aside className="glitcher-reveal__identity" aria-labelledby="glitcher-identity-title">
            <Image
              src={GLITCHER_ASSETS.raster.roseDataCore}
              alt=""
              aria-hidden="true"
              width={260}
              height={260}
              className="glitcher-reveal__identity-art"
            />
            <div className="glitcher-reveal__identity-heading">
              <Fingerprint aria-hidden="true" />
              <span>Danh tính thật sự</span>
            </div>
            {glitchPlayers.map((glitchPlayer, index) => (
              <div className="glitcher-reveal__identity-person" key={glitchPlayer.userId}>
                <Image
                  src={getGlitcherAvatarSrc(glitchPlayer.seatIndex)}
                  alt={`Ảnh đại diện của ${glitchPlayer.name}`}
                  width={70}
                  height={70}
                />
                <div>
                  <h2 id={index === 0 ? "glitcher-identity-title" : undefined}>{glitchPlayer.name}</h2>
                  <span>Vai Glitch{glitchPlayers.length > 1 ? ` ${index + 1}` : ""}</span>
                </div>
              </div>
            ))}
          </aside>
        </section>

        <div className="glitcher-reveal__details">
          <section className="glitcher-reveal__scenes" aria-labelledby="glitcher-scenes-title">
            <header>
              <span>Dữ kiện sau cùng</span>
              <h2 id="glitcher-scenes-title">Hai hiện trường đã được đối chiếu</h2>
            </header>
            <div>
              <article className="is-true-scene">
                <span>Hiện trường thật · Dân</span>
                <h3>{reveal.trueScene.title}</h3>
                <p>{reveal.trueScene.description}</p>
              </article>
              <article className="is-glitch-scene">
                <span>Hiện trường mồi · Glitch</span>
                <h3>{reveal.glitchScene.title}</h3>
                <p>{reveal.glitchScene.description}</p>
              </article>
            </div>
          </section>

          <aside className="glitcher-reveal__votes" aria-labelledby="glitcher-votes-title">
            <header>
              <Vote aria-hidden="true" />
              <div>
                <span>Đối chiếu quyết định</span>
                <h2 id="glitcher-votes-title">Phiếu của từng người</h2>
              </div>
            </header>
            <ul>
              {reveal.votes.map((vote) => {
                const foundGlitch = vote.targetUserId !== null && glitchUserIds.includes(vote.targetUserId);
                return (
                  <li key={vote.voterUserId} className={foundGlitch ? "is-correct" : undefined}>
                    <span title={vote.voterName}>{vote.voterName}</span>
                    <ArrowRight aria-hidden="true" />
                    <strong title={vote.targetName ?? "Không có phiếu"}>
                      {vote.targetName ?? "Không có phiếu"}
                    </strong>
                  </li>
                );
              })}
            </ul>
          </aside>
        </div>

        <footer className="glitcher-reveal__footer">
          {gameState.privateCard ? (
            <section className="glitcher-reveal__my-role" aria-labelledby="glitcher-my-role-title">
              <BookOpenText aria-hidden="true" />
              <div>
                <span>Vai của bạn</span>
                <h2 id="glitcher-my-role-title">{gameState.privateCard.role.name}</h2>
              </div>
              <p>{gameState.privateCard.role.action}</p>
            </section>
          ) : null}
          {me?.isHost ? (
            <div className="glitcher-reveal__actions">
              <button
                type="button"
                onClick={() => emitAction("returnToLobby")}
                className="glitcher-secondary-button"
              >
                Về lobby
              </button>
              <button
                type="button"
                onClick={() => emitAction("startTour")}
                className="glitcher-primary-button"
              >
                <RotateCcw aria-hidden="true" />
                Chơi ván mới
              </button>
            </div>
          ) : (
            <p>Đang chờ chủ phòng chọn ván tiếp theo hoặc trở về lobby.</p>
          )}
        </footer>
      </main>
    </ResultSceneFrame>
  );
}
