"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  Wand2,
  UserRound,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Socket } from "socket.io-client";
import {
  AvalonPlayer,
  AvalonRoom,
  AvalonSkillType,
} from "@/server/game/AvalonTypes";
import { getRoleImageSrcForViewer } from "./roleImage";
import Image from "next/image";
import { useSceneScale } from "@/hooks/useSceneScale";

type SkillMeta = {
  skillType: AvalonSkillType;
  label: string;
  description: string;
  requiresTarget: boolean;
};

const SKILL_SCENE_W = 1040;
const SKILL_SCENE_H = 640;

function getSkillMeta(room: AvalonRoom, me: AvalonPlayer): SkillMeta {
  if (!room.settings.advancedMode) {
    return {
      skillType: "none",
      label: "Không có kỹ năng",
      description: "Chế độ nâng cao đang tắt.",
      requiresTarget: false,
    };
  }

  switch (me.role) {
    case "Merlin":
      return {
        skillType: "merlinEternalBond",
        label: "Đồng Quy Vô Tận",
        description: "Nếu bị ám sát trúng khi đã kích hoạt, trận đấu sẽ hòa.",
        requiresTarget: false,
      };
    case "Assassin":
      return {
        skillType: "assassinInsight",
        label: "Mắt Tử Thần",
        description: "Soi 1 người đi chung quest có chức năng hay không.",
        requiresTarget: true,
      };
    case "Morgana":
      return {
        skillType: "morganaSilence",
        label: "Đêm Câm Lặng",
        description: "Khóa toàn bộ kỹ năng trong quest này.",
        requiresTarget: false,
      };
    case "Mordred":
      return {
        skillType: "mordredForceFail",
        label: "Bàn Tay Bóng Tối",
        description: "Ép 1 người đi quest bị buộc bỏ phiếu FAIL.",
        requiresTarget: true,
      };
    case "Athena":
      return {
        skillType: "athenaFateFlip",
        label: "Đảo Thiên Kiền Khôn",
        description: "Lật kết quả quest ở thời điểm kết toán.",
        requiresTarget: false,
      };
    case "Percival":
      return {
        skillType: "percivalTrace",
        label: "Truy Vết Chức Năng",
        description: "Kiểm tra 1 người có chức năng hay không.",
        requiresTarget: true,
      };
    case "Minion_Evil":
    case "Minion_Good":
      return {
        skillType: "minionChaCha",
        label: "Cha Cha Cha",
        description: "Kỹ năng vui có thông báo công khai.",
        requiresTarget: false,
      };
    default:
      return {
        skillType: "none",
        label: "Không có kỹ năng",
        description: "Vai trò của bạn không có kỹ năng chủ động ở phase này.",
        requiresTarget: false,
      };
  }
}

function ChoiceCard({
  title,
  subtitle,
  icon,
  selected,
  tone,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  selected: boolean;
  tone: "neutral" | "accent";
  onClick: () => void;
}) {
  const selectedClasses =
    tone === "accent"
      ? "border-(--tertiary)/70 bg-(--tertiary)/15 text-(--tertiary) shadow-[0_0_28px_rgba(255,180,168,0.24)]"
      : "border-(--primary)/70 bg-(--primary)/15 text-(--primary) shadow-[0_0_28px_rgba(186,200,220,0.24)]";

  const idleClasses =
    "border-(--outline-variant)/40 bg-surface-container-lowest/55 text-(--on-surface-variant) hover:border-(--primary)/45 hover:text-(--on-surface)";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition-all cursor-pointer min-h-24 flex items-center ${
        selected ? selectedClasses : idleClasses
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 shrink-0 rounded-xl border border-current/35 bg-black/20 flex items-center justify-center [&>svg]:w-6 [&>svg]:h-6">
          {icon}
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em]">{title}</p>
          <p className="text-[10px] sm:text-[11px] mt-0.5 opacity-80 leading-snug">{subtitle}</p>
        </div>
      </div>
    </button>
  );
}

export default function SkillDecisionOverlay({
  gameState,
  me,
  socket,
  isReadOnly = false,
}: {
  gameState: AvalonRoom;
  me: AvalonPlayer;
  socket: Socket | null;
  isReadOnly?: boolean;
}) {
  const isSkillDecision = gameState.state === "SKILL_DECISION";
  const skillPhase = gameState.skillDecisionState?.phase ?? "quest";
  const participantUserIds =
    gameState.skillDecisionState?.participantUserIds ?? gameState.proposedTeam;
  const isParticipant = participantUserIds.includes(me.userId);
  const hasSubmitted = Boolean(me.hasVoted);
  const skillMeta = useMemo(() => getSkillMeta(gameState, me), [gameState, me]);
  const alreadyUsed = Boolean(gameState.skillUsedByUserId?.[me.userId]);
  const isReusableSkill = skillMeta.skillType === "minionChaCha";
  const isMerlinFinalPhase = skillPhase === "preAssassination";
  const skillAllowedInCurrentPhase =
    skillMeta.skillType !== "merlinEternalBond" || isMerlinFinalPhase;
  const canUseSkill =
    skillMeta.skillType !== "none" &&
    skillAllowedInCurrentPhase &&
    (!alreadyUsed || isReusableSkill) &&
    !isReadOnly &&
    !me.isSpectator;

  const [useSkill, setUseSkill] = useState(false);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const publicAnnouncements =
    gameState.skillDecisionState?.publicAnnouncements ?? [];
  const targetCandidates = gameState.players.filter(
    (player) =>
      gameState.proposedTeam.includes(player.userId) && player.userId !== me.userId,
  );

  const selectedTargetBadgeLabel =
    skillMeta.skillType === "percivalTrace"
      ? "Đang truy vết"
      : skillMeta.skillType === "assassinInsight"
      ? "Đang soi"
      : "Đã chọn";

  const canConfirm =
    isParticipant &&
    !hasSubmitted &&
    (!useSkill || !skillMeta.requiresTarget || Boolean(targetUserId));

  const scale = useSceneScale({
    viewportRef,
    sceneWidth: SKILL_SCENE_W,
    sceneHeight: SKILL_SCENE_H,
    padding: 18,
    minScale: 0.25,
    maxScale: 1,
    minViewportWidth: 300,
    minViewportHeight: 220,
    active: isSkillDecision,
  });

  if (!isSkillDecision) return null;

  const handleConfirm = () => {
    if (!socket || !canConfirm) return;
    socket.emit("submitSkillDecision", {
      useSkill: useSkill && canUseSkill,
      targetUserId: useSkill && skillMeta.requiresTarget ? targetUserId : null,
    });
  };

  const phaseSubtitle = isMerlinFinalPhase
    ? "Merlin chọn dùng hay không dùng trước khi chuyển sang phase ám sát."
    : "Bạn chỉ cần chọn DÙNG hoặc KHÔNG DÙNG. Nếu dùng thì chọn mục tiêu rồi xác nhận.";

  return (
    <div className="fixed inset-0 z-80 bg-black/78 backdrop-blur-sm animate-in fade-in duration-200 overflow-hidden">
      <div ref={viewportRef} className="relative h-dvh w-full overflow-hidden p-2 sm:p-3">
        <div
          className="absolute left-1/2 top-1/2 pointer-events-auto"
          style={{
            width: `${SKILL_SCENE_W}px`,
            height: `${SKILL_SCENE_H}px`,
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          <div className="h-full w-full rounded-3xl border border-(--outline-variant)/40 bg-surface-container-low/95 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.55)] flex flex-col gap-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-(--secondary)">
                  {isMerlinFinalPhase
                    ? "Advanced Mode • Merlin Final Decision"
                    : "Advanced Mode • Skill Decision"}
                </p>
                <h3 className="mt-1 font-headline text-3xl uppercase tracking-wider text-(--primary)">
                  {isMerlinFinalPhase
                    ? "Lựa Chọn Cuối Của Merlin"
                    : "Quyết Định Kỹ Năng"}
                </h3>
                <p className="mt-1 text-sm text-(--on-surface-variant)">
                  {phaseSubtitle}
                </p>
              </div>
              <div className="rounded-full border border-(--primary)/40 bg-(--primary)/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-(--primary)">
                {hasSubmitted ? "ĐÃ XÁC NHẬN" : "CHỜ XÁC NHẬN"}
              </div>
            </div>

            {publicAnnouncements.length > 0 && (
              <div className="rounded-xl border border-(--tertiary)/35 bg-(--tertiary)/10 px-4 py-2 text-xs text-(--tertiary)">
                {publicAnnouncements.map((line, index) => (
                  <p key={`${line}-${index}`}>{line}</p>
                ))}
              </div>
            )}

            {!isParticipant ? (
              <div className="flex-1 rounded-2xl border border-(--outline-variant)/30 bg-surface-container-lowest/45 p-5 text-sm text-(--on-surface-variant)">
                {isMerlinFinalPhase
                  ? "Đang chờ Merlin đưa ra quyết định cuối trước phase ám sát."
                  : "Bạn không thuộc nhóm thao tác ở lượt quyết định này."}
              </div>
            ) : isReadOnly || me.isSpectator ? (
              <div className="flex-1 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-5 text-sm text-amber-200">
                Chế độ khán giả: chỉ theo dõi phase kỹ năng.
              </div>
            ) : hasSubmitted ? (
              <div className="flex-1 rounded-2xl border border-emerald-400/35 bg-emerald-500/10 p-5 text-sm text-emerald-200">
                Bạn đã xác nhận. Đang chờ những người còn lại.
              </div>
            ) : (
              <div className="flex-1 min-h-0 flex flex-col gap-4">
                <div className="rounded-2xl border border-(--outline-variant)/35 bg-surface-container-lowest/45 p-4">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-(--primary)" />
                    <p className="text-sm font-bold uppercase tracking-[0.14em] text-(--on-surface)">
                      {skillMeta.label}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-(--on-surface-variant)">
                    {skillMeta.description}
                  </p>
                  {alreadyUsed && !isReusableSkill && (
                    <p className="mt-2 text-[11px] uppercase tracking-wider text-amber-300">
                      Kỹ năng này đã dùng trước đó. Chọn không dùng và xác nhận.
                    </p>
                  )}
                </div>

                {canUseSkill ? (
                  <div className="grid grid-cols-2 gap-4">
                    <ChoiceCard
                      title="Không Dùng"
                      subtitle="Bỏ qua kỹ năng lượt này"
                      icon={<XCircle className="w-10 h-10" />}
                      selected={!useSkill}
                      tone="neutral"
                      onClick={() => {
                        setUseSkill(false);
                        setTargetUserId(null);
                      }}
                    />
                    <ChoiceCard
                      title="Dùng Kỹ Năng"
                      subtitle={skillMeta.label}
                      icon={<CheckCircle2 className="w-10 h-10" />}
                      selected={useSkill}
                      tone="accent"
                      onClick={() => setUseSkill(true)}
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-(--outline-variant)/35 bg-surface-container-lowest/45 p-4 text-sm text-(--on-surface-variant)">
                    Vai trò của bạn ở lượt này không có kỹ năng chủ động để dùng.
                  </div>
                )}

                {useSkill && skillMeta.requiresTarget && (
                  <div className="rounded-2xl border border-(--outline-variant)/35 bg-surface-container-lowest/45 p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-(--on-surface-variant)">
                      Chọn mục tiêu
                    </p>

                    <div className="mt-2 grid grid-cols-2 lg:grid-cols-3 gap-2 overflow-y-auto pr-1 custom-avalon-scrollbar">
                      {targetCandidates.map((player) => (
                        <button
                          key={player.userId}
                          type="button"
                          onClick={() => setTargetUserId(player.userId)}
                          className={`relative flex items-center gap-3 rounded-lg border p-2 transition-all cursor-pointer ${
                            targetUserId === player.userId
                              ? "border-(--primary)/55 bg-(--primary)/15 text-(--primary) shadow-[0_0_14px_rgba(186,200,220,0.25)]"
                              : "border-(--outline-variant)/35 bg-surface-container-lowest/60 text-(--on-surface-variant) hover:border-(--primary)/45"
                          }`}
                        >
                          <div className="relative w-10 h-10 shrink-0 rounded-md overflow-hidden border border-(--outline-variant)/35 bg-black/25">
                            <Image
                              src={getRoleImageSrcForViewer(player, me)}
                              alt={player.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/50" />
                          </div>
                          
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-1.5 opacity-90">
                              <UserRound className="w-4 h-4 shrink-0" />
                              <span className="text-[13px] font-black uppercase tracking-wider truncate">
                                {player.name}
                              </span>
                            </div>
                            {targetUserId === player.userId && (
                              <div className="mt-0.5 inline-block rounded-sm border border-cyan-400/40 bg-cyan-500/20 px-1 py-0.5 leading-none text-[8px] font-bold uppercase tracking-widest text-[#a8f8ff]">
                                {selectedTargetBadgeLabel}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!canConfirm && useSkill && skillMeta.requiresTarget && (
                  <div className="flex items-center gap-2 text-xs text-amber-300">
                    <AlertTriangle className="w-4 h-4" />
                    Chọn mục tiêu trước khi xác nhận.
                  </div>
                )}

                <div className="mt-auto flex justify-end">
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={!canConfirm}
                    className="px-6 py-3 rounded-xl bg-primary-avalon text-surface-dim-avalon text-sm font-black uppercase tracking-[0.16em] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
