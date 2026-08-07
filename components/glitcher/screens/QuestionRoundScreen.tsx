"use client";

import { Check, CircleHelp, History, Radio, X } from "lucide-react";
import type {
  GlitcherClientState,
  GlitcherPublicPlayer,
} from "@/server/game/GlitcherTypes";
import GameTableFrame from "../GameTableFrame";
import PlayerRing from "../PlayerRing";
import type { EmitGlitcherAction } from "../gameTypes";

export default function QuestionRoundScreen({
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
  const round = gameState.questionRound;
  const targetPlayer = gameState.players.find(
    (player) => player.userId === round?.targetUserId,
  );
  const currentQuestioner = gameState.players.find(
    (player) => player.userId === round?.currentQuestionerUserId,
  );
  const selectedQuestion = gameState.questions.find(
    (question) => question.id === round?.selectedQuestionId,
  );

  const isTargetTurn = Boolean(me && me.userId === round?.targetUserId);
  const isQuestionerTurn = Boolean(
    me && me.userId === round?.currentQuestionerUserId,
  );
  const usedQuestions = new Set(round?.usedQuestionIds ?? []);
  const firstAvailableQuestionId = gameState.questions.find(
    (question) => !usedQuestions.has(question.id),
  )?.id;
  const isAnswering = round?.stage === "ANSWERING" && Boolean(selectedQuestion);
  const turnNumber = (round?.turnIndex ?? 0) + 1;
  const performerNumber = (round?.performerIndex ?? 0) + 1;
  const totalPerformers = round?.totalPerformers ?? gameState.players.length;

  const actionModal = (
    <section
      className="glitcher-question-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="glitcher-question-dialog-title"
      aria-describedby="glitcher-question-dialog-description"
    >
      <div className="glitcher-question-dialog__ambient" aria-hidden="true" />

      <header className="glitcher-question-dialog__header">
        <div className="glitcher-question-dialog__eyebrow">
          <span>Màn {String(gameState.sceneNumber).padStart(2, "0")}</span>
          <i aria-hidden="true" />
          <span>Người diễn {performerNumber}/{totalPerformers}</span>
          <i aria-hidden="true" />
          <span>Câu {turnNumber}/3</span>
        </div>

        <div className="glitcher-question-dialog__title-row">
          <div className="glitcher-question-dialog__symbol" aria-hidden="true">
            {isAnswering ? <Radio /> : <CircleHelp />}
          </div>
          <div>
            <span>{isAnswering ? "Phản hồi trực tiếp" : "Chọn tín hiệu thẩm vấn"}</span>
            <h1 id="glitcher-question-dialog-title">
              {isAnswering
                ? `${targetPlayer?.name ?? "Người diễn"}, hãy trả lời`
                : isQuestionerTurn
                  ? `Chọn câu hỏi cho ${targetPlayer?.name ?? "người diễn"}`
                  : `${currentQuestioner?.name ?? "Người chơi"} đang chọn câu hỏi`}
            </h1>
          </div>
        </div>

        <p id="glitcher-question-dialog-description">
          {isAnswering
            ? isTargetTurn
              ? "Chọn đúng một câu trả lời. Kết quả sẽ được công khai ngay cho cả bàn."
              : `Đang chờ ${targetPlayer?.name ?? "người diễn"} xác nhận câu trả lời.`
            : isQuestionerTurn
              ? "Câu đã dùng sẽ bị khóa. Hãy chọn câu giúp cả bàn đọc được màn trình diễn."
              : `Lượt này thuộc về ${currentQuestioner?.name ?? "người hỏi"}. Danh sách sẽ cập nhật ngay khi họ chọn.`}
        </p>
      </header>

      {isAnswering && selectedQuestion ? (
        <div className="glitcher-answer-stage">
          <div className="glitcher-answer-stage__question">
            <span>Câu hỏi từ {currentQuestioner?.name ?? "người hỏi"}</span>
            <blockquote>&ldquo;{selectedQuestion.text}&rdquo;</blockquote>
          </div>

          {isTargetTurn ? (
            <div className="glitcher-answer-stage__actions" aria-label="Chọn câu trả lời">
              <button
                type="button"
                autoFocus
                onClick={() => emitAction("answerQuestion", { answer: true })}
                className="glitcher-answer-choice is-yes"
              >
                <span className="glitcher-answer-choice__icon"><Check aria-hidden="true" /></span>
                <span>
                  <strong>Có</strong>
                  <small>Xác nhận đúng</small>
                </span>
              </button>

              <button
                type="button"
                onClick={() => emitAction("answerQuestion", { answer: false })}
                className="glitcher-answer-choice is-no"
              >
                <span className="glitcher-answer-choice__icon"><X aria-hidden="true" /></span>
                <span>
                  <strong>Không</strong>
                  <small>Xác nhận sai</small>
                </span>
              </button>
            </div>
          ) : (
            <div className="glitcher-question-dialog__waiting" role="status">
              <span aria-hidden="true" />
              <p><strong>{targetPlayer?.name ?? "Người diễn"}</strong> đang cân nhắc câu trả lời</p>
            </div>
          )}
        </div>
      ) : (
        <div className="glitcher-question-dialog__list" aria-label="Danh sách câu hỏi">
          {gameState.questions.map((question, index) => {
            const wasUsed = usedQuestions.has(question.id);
            return (
              <button
                key={question.id}
                type="button"
                autoFocus={isQuestionerTurn && question.id === firstAvailableQuestionId}
                onClick={() => emitAction("selectQuestion", { questionId: question.id })}
                disabled={!isQuestionerTurn || wasUsed}
                className={wasUsed ? "is-used" : undefined}
              >
                <span className="glitcher-question-dialog__number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <strong>{question.text}</strong>
                <small>{wasUsed ? "Đã dùng" : isQuestionerTurn ? "Chọn" : "Đang chờ"}</small>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );

  return (
    <GameTableFrame
      gameState={gameState}
      table={
        <PlayerRing
          players={gameState.players}
          viewerUserId={gameState.viewerUserId}
          questionerUserIds={round?.questionerUserIds}
          currentQuestionerUserId={round?.currentQuestionerUserId}
          emphasisUserId={round?.targetUserId}
        />
      }
      overlay={actionModal}
      onExit={onExit}
    >
      <div className="glitcher-question-context">
        <div className="glitcher-panel-heading">
          <span>Nhịp lượt hiện tại</span>
          <h2>Đang diễn: <strong>{targetPlayer?.name ?? "—"}</strong></h2>
        </div>

        <div className="glitcher-question-context__status">
          <Radio aria-hidden="true" />
          <div>
            <span>{isAnswering ? "Đang chờ phản hồi" : "Đang chọn câu hỏi"}</span>
            <strong>{isAnswering ? targetPlayer?.name : currentQuestioner?.name}</strong>
          </div>
        </div>

        <div className="glitcher-question-context__history">
          <div className="glitcher-question-context__history-title">
            <History aria-hidden="true" />
            <h3>Nhật ký hỏi & đáp</h3>
            <span>{gameState.answerLog.length}</span>
          </div>

          <div className="glitcher-question-context__history-list">
            {gameState.answerLog.length === 0 ? (
              <div className="glitcher-question-context__empty">
                <CircleHelp aria-hidden="true" />
                <p>Câu trả lời đầu tiên sẽ xuất hiện tại đây.</p>
              </div>
            ) : (
              [...gameState.answerLog].reverse().map((log) => (
                <article key={log.id} className={log.answer ? "is-yes" : "is-no"}>
                  <div>
                    <span>{log.targetName}</span>
                    <strong>{log.answer ? "Có" : "Không"}</strong>
                  </div>
                  <p>&ldquo;{log.questionText}&rdquo;</p>
                  <small>Hỏi bởi {log.questionerName}</small>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </GameTableFrame>
  );
}
