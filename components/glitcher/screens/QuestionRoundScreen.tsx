import type { GlitcherClientState, GlitcherPublicPlayer } from "@/server/game/GlitcherTypes";
import GameTableFrame from "../GameTableFrame";
import GlitcherTimer from "../GlitcherTimer";
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
  const currentQuestioner = gameState.players.find(
    (player) => player.userId === round?.currentQuestionerUserId,
  );
  const selectedQuestion = gameState.questions.find(
    (question) => question.id === round?.selectedQuestionId,
  );
  const selectedQuestionIndex = selectedQuestion
    ? gameState.questions.findIndex((question) => question.id === selectedQuestion.id)
    : -1;
  const privateAnswer =
    selectedQuestionIndex >= 0 ? gameState.privateCard?.answers[selectedQuestionIndex] : undefined;
  const isMyTurn = Boolean(me && me.userId === round?.currentQuestionerUserId);
  const usedQuestions = new Set(round?.usedQuestionIds ?? []);
  const pausedPlayer = gameState.players.find(
    (player) => player.userId === round?.pausedForUserId,
  );

  return (
    <GameTableFrame
      gameState={gameState}
      timerLabel="Thời gian câu hỏi"
      onExit={onExit}
      table={
        <PlayerRing
          players={gameState.players}
          viewerUserId={gameState.viewerUserId}
          questionerUserIds={round?.questionerUserIds}
          currentQuestionerUserId={round?.currentQuestionerUserId}
        />
      }
    >
      <div className="glitcher-question-panel">
        <div className="glitcher-panel-heading">
          <span>
            Câu hỏi {(round?.turnIndex ?? 0) + 1}/3
          </span>
          <h1>{round?.stage === "ANSWERING" ? "Câu hỏi đã chọn" : "Chọn một câu hỏi"}</h1>
        </div>

        <p className="glitcher-question-panel__turn" aria-live="polite">
          {currentQuestioner ? (
            <>
              Lượt của <strong>{currentQuestioner.name}</strong>
            </>
          ) : (
            "Đang đồng bộ người hỏi…"
          )}
        </p>

        {round?.pausedForUserId ? (
          <div className="glitcher-question-pause" role="status">
            <div>
              <strong>Đang chờ {pausedPlayer?.name ?? "người hỏi"} kết nối lại</strong>
              <span>
                Đồng hồ câu hỏi đang giữ ở{" "}
                {Math.ceil((round.pausedQuestionRemainingMs ?? 0) / 1000)} giây.
              </span>
            </div>
            <GlitcherTimer
              startedAt={null}
              deadlineAt={round.reconnectGraceDeadlineAt}
              label="Thời gian chờ kết nối lại"
            />
          </div>
        ) : null}

        {round?.stage === "ANSWERING" && selectedQuestion ? (
          <div className="glitcher-selected-question">
            <blockquote>{selectedQuestion.text}</blockquote>

            <div className="glitcher-private-answer">
              <span>Đáp án trên máy của bạn</span>
              <strong className={privateAnswer ? "is-yes" : "is-no"}>
                {privateAnswer ? "Có — hãy giơ tay" : "Không — giữ tay xuống"}
              </strong>
            </div>

            <div className="glitcher-count-cue" aria-label="Cùng đếm một, hai, ba">
              <strong>1</strong>
              <i />
              <strong>2</strong>
              <i />
              <strong>3</strong>
            </div>

            {isMyTurn ? (
              <button
                type="button"
                onClick={() => emitAction("completeQuestion")}
                className="glitcher-primary-button"
              >
                Hoàn tất lượt hỏi
              </button>
            ) : (
              <p className="glitcher-waiting-note">Cùng trả lời ngoài đời và chờ người hỏi xác nhận.</p>
            )}
          </div>
        ) : (
          <div className="glitcher-question-list">
            {gameState.questions.map((question, index) => {
              const wasUsed = usedQuestions.has(question.id);
              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => emitAction("selectQuestion", { questionId: question.id })}
                  disabled={!isMyTurn || wasUsed}
                  className={wasUsed ? "is-used" : ""}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{question.text}</strong>
                  {wasUsed ? <small>Đã dùng</small> : null}
                </button>
              );
            })}

            {!isMyTurn ? (
              <p className="glitcher-waiting-note">Chờ {currentQuestioner?.name ?? "người hỏi"} chọn câu.</p>
            ) : null}
          </div>
        )}
      </div>
    </GameTableFrame>
  );
}
