"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { Socket } from "socket.io-client";
import {
  ArrowLeft,
  BadgeCheck,
  CookingPot,
  EyeOff,
  FileText,
  Fingerprint,
  History,
  Volume2,
  VolumeX,
  Lock,
  Search,
  ShieldAlert,
} from "lucide-react";
import type {
  ClueCard,
  DeceptionPlayer,
  DeceptionRoom,
  MeansCard,
} from "@/server/game/DeceptionTypes";
import SceneBoard from "@/components/deception/SceneBoard";
import ForensicClueBoard from "@/components/deception/ForensicClueBoard";
import SolvingAttemptModal from "@/components/deception/SolvingAttemptModal";
import SolvingWizard from "@/components/deception/SolvingWizard";
import EvidencePreviewCard from "@/components/deception/EvidencePreviewCard";
import TimerBar from "@/components/deception/TimerBar";
import SharedChatDropdown, { type ChatTheme } from "@/components/shared/ChatDropdown";
import { useSceneScale } from "@/hooks/useSceneScale";
import { usePreloadCardImages } from "@/hooks/usePreloadCardImages";
import {
  getResolvedClueImageUrl,
  getResolvedMeansImageUrl,
} from "@/utils/deceptionAssets";

const NON_FORENSIC_SCENE_WIDTH = 1820;
const NON_FORENSIC_SCENE_HEIGHT = 860;
const COMPACT_NON_FORENSIC_SCENE_WIDTH = 1500;
const COMPACT_NON_FORENSIC_SCENE_HEIGHT = 780;
const CARD_TILT_CLASSES = [
  "-rotate-1",
  "rotate-1",
  "-rotate-2",
  "rotate-2",
] as const;

const DECEPTION_CHAT_THEME: ChatTheme = {
  surface: "rgba(10,12,18,0.96)",
  border: "color-mix(in srgb, var(--deception-cyan) 22%, transparent)",
  accent: "var(--deception-cyan)",
  textPrimary: "var(--on-surface)",
  textMuted: "var(--on-surface-variant)",
};

function cardTiltClass(index: number) {
  return CARD_TILT_CLASSES[index % CARD_TILT_CLASSES.length];
}

function clampPlayerName(name: string, maxLength: number) {
  const normalized = name.trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(1, maxLength - 1))}…`;
}

function roleLabel(player: DeceptionPlayer | undefined) {
  if (!player?.role) return "Ẩn danh";
  switch (player.role) {
    case "ForensicScientist":
      return "Pháp Y";
    case "Murderer":
      return "Kẻ Giết Người";
    case "Accomplice":
      return "Đồng Phạm";
    case "Witness":
      return "Nhân Chứng";
    case "Investigator":
      return "Điều Tra Viên";
    default:
      return player.role;
  }
}

type RoleTone = {
  idleCardClass: string;
  activeCardClass: string;
  avatarClass: string;
  chipClass: string;
  dotClass: string;
};

function roleToneByRole(role: DeceptionPlayer["role"] | undefined): RoleTone {
  switch (role) {
    case "ForensicScientist":
      return {
        idleCardClass:
          "border-[#2d94a8]/55 bg-[linear-gradient(135deg,rgba(11,80,95,0.32),rgba(9,24,38,0.22))] hover:border-[#45d4ef]",
        activeCardClass:
          "border-[#48d8f1] bg-[linear-gradient(135deg,rgba(18,110,131,0.42),rgba(10,32,48,0.3))] shadow-[0_0_0_1px_rgba(72,216,241,0.35)]",
        avatarClass:
          "border-[#65dfee] text-[#adf5ff] bg-[radial-gradient(circle_at_30%_30%,rgba(75,216,240,0.34),rgba(8,34,49,0.5))]",
        chipClass: "border-[#4bd0e6] bg-[rgba(17,110,129,0.26)] text-[#a7f3ff]",
        dotClass: "bg-[#4eddf7]",
      };
    case "Murderer":
      return {
        idleCardClass:
          "border-[#a5354d]/55 bg-[linear-gradient(135deg,rgba(100,23,39,0.34),rgba(34,10,17,0.24))] hover:border-[#ff5a78]",
        activeCardClass:
          "border-[#ff5f80] bg-[linear-gradient(135deg,rgba(130,27,49,0.44),rgba(50,10,21,0.32))] shadow-[0_0_0_1px_rgba(255,95,128,0.36)]",
        avatarClass:
          "border-[#ff6f8d] text-[#ffd0db] bg-[radial-gradient(circle_at_30%_30%,rgba(255,99,129,0.34),rgba(58,13,25,0.56))]",
        chipClass: "border-[#ff6788] bg-[rgba(133,34,57,0.28)] text-[#ffd1db]",
        dotClass: "bg-[#ff6f90]",
      };
    case "Accomplice":
      return {
        idleCardClass:
          "border-[#a86c22]/55 bg-[linear-gradient(135deg,rgba(92,58,16,0.36),rgba(35,22,8,0.24))] hover:border-[#ffb54a]",
        activeCardClass:
          "border-[#ffb74d] bg-[linear-gradient(135deg,rgba(116,74,18,0.46),rgba(43,27,10,0.32))] shadow-[0_0_0_1px_rgba(255,183,77,0.35)]",
        avatarClass:
          "border-[#ffc266] text-[#ffe3ba] bg-[radial-gradient(circle_at_30%_30%,rgba(255,190,94,0.34),rgba(60,35,10,0.56))]",
        chipClass: "border-[#ffbc5e] bg-[rgba(126,81,23,0.3)] text-[#ffe5be]",
        dotClass: "bg-[#ffc367]",
      };
    case "Witness":
      return {
        idleCardClass:
          "border-[#7648b9]/55 bg-[linear-gradient(135deg,rgba(62,33,108,0.36),rgba(24,12,46,0.24))] hover:border-[#b489ff]",
        activeCardClass:
          "border-[#b78dff] bg-[linear-gradient(135deg,rgba(80,44,136,0.44),rgba(31,15,57,0.32))] shadow-[0_0_0_1px_rgba(183,141,255,0.35)]",
        avatarClass:
          "border-[#be97ff] text-[#ead9ff] bg-[radial-gradient(circle_at_30%_30%,rgba(180,138,255,0.34),rgba(33,18,64,0.56))]",
        chipClass: "border-[#be94ff] bg-[rgba(77,47,131,0.3)] text-[#ebddff]",
        dotClass: "bg-[#c3a0ff]",
      };
    case "Investigator":
      return {
        idleCardClass:
          "border-[#3668b0]/55 bg-[linear-gradient(135deg,rgba(24,56,109,0.35),rgba(11,24,49,0.24))] hover:border-[#5aa2ff]",
        activeCardClass:
          "border-[#69adff] bg-[linear-gradient(135deg,rgba(33,74,145,0.44),rgba(15,33,67,0.32))] shadow-[0_0_0_1px_rgba(105,173,255,0.35)]",
        avatarClass:
          "border-[#76b8ff] text-[#d2ebff] bg-[radial-gradient(circle_at_30%_30%,rgba(95,169,255,0.34),rgba(14,33,66,0.56))]",
        chipClass: "border-[#74b5ff] bg-[rgba(34,79,149,0.3)] text-[#d6ecff]",
        dotClass: "bg-[#82c0ff]",
      };
    default:
      return {
        idleCardClass:
          "border-(--deception-border) bg-[rgba(255,255,255,0.03)] hover:border-(--deception-cyan)",
        activeCardClass:
          "border-(--deception-cyan) bg-[rgba(0,212,255,0.12)] shadow-[0_0_0_1px_rgba(0,212,255,0.2)]",
        avatarClass:
          "border-(--deception-border) text-(--deception-cyan) bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),rgba(255,255,255,0.03))]",
        chipClass:
          "border-(--deception-border) bg-[rgba(255,255,255,0.05)] text-(--on-surface-variant)",
        dotClass: "bg-(--on-surface-variant)",
      };
  }
}

function accusationBadgeTone(hasBadge: boolean) {
  if (hasBadge) {
    return {
      label: "Tố cáo",
      title: "Người chơi còn lượt tố cáo",
      chipClass:
        "border-amber-300/80 bg-[radial-gradient(circle_at_30%_28%,rgba(255,226,140,0.35),rgba(132,84,14,0.62))] text-amber-50 shadow-[0_0_12px_rgba(255,199,85,0.3)]",
      iconClass: "text-amber-200",
    };
  }

  return {
    label: "Tố cáo",
    title: "Người chơi đã mất lượt tố cáo",
    chipClass:
      "border-slate-600/70 bg-[rgba(55,63,80,0.32)] text-slate-300 opacity-80",
    iconClass: "text-slate-400",
  };
}

export default function DiscussionBoard({
  gameState,
  me,
  socket,
  playerPings,
  roleMaskEnabled,
  bgmMuted,
  onToggleRoleMask,
  onToggleBgm,
  onExit,
}: {
  gameState: DeceptionRoom;
  me?: DeceptionPlayer;
  socket: Socket | null;
  playerPings: Record<string, number>;
  roleMaskEnabled: boolean;
  bgmMuted: boolean;
  onToggleRoleMask: () => void;
  onToggleBgm: () => void;
  onExit: () => void;
}) {
  const [showChat, setShowChat] = useState(false);
  const [chatText, setChatText] = useState("");
  const [focusedPlayerUserId, setFocusedPlayerUserId] = useState("");
  const [showSolvingWizard, setShowSolvingWizard] = useState(false);
  const [showForensicClueBoard, setShowForensicClueBoard] = useState(false);
  const [solvingWizardVersion, setSolvingWizardVersion] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [forensicTab, setForensicTab] = useState<"hints" | "players">("hints");
  const nonForensicViewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const updateViewport = () => setViewportWidth(window.innerWidth);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const isForensic = me?.role === "ForensicScientist";
  const canChat = !isForensic;
  const {
    ready: playerCardsReady,
    priorityReady: selfCardsReady,
    playerReadyMap,
  } = usePreloadCardImages(gameState.players, {
    priorityUserId: me?.userId,
  });
  const canOpenSolve = Boolean(
    me &&
    !isForensic &&
    me.hasBadge &&
    selfCardsReady &&
    gameState.state === "DISCUSSION" &&
    !gameState.activeSolvingAttempt,
  );

  const activePlayers = useMemo(() => {
    const players = gameState.players.filter((player) => !player.isSpectator);
    const forensicIndex = players.findIndex(
      (player) => player.role === "ForensicScientist",
    );

    if (forensicIndex <= 0) return players;

    const [forensicPlayer] = players.splice(forensicIndex, 1);
    return [forensicPlayer, ...players];
  }, [gameState.players]);

  const selectableEvidencePlayers = useMemo(
    () =>
      activePlayers.filter(
        (player) => player.role !== "ForensicScientist",
      ),
    [activePlayers],
  );

  const visibleChatMessages = useMemo(
    () =>
      gameState.messages.filter(
        (message) => message.senderId !== "system",
      ),
    [gameState.messages],
  );

  const allMeans = useMemo(() => {
    const map = new Map<number, MeansCard>();
    gameState.players.forEach((player) => {
      player.meansCards.forEach((card) => map.set(card.id, card));
    });
    return map;
  }, [gameState.players]);

  const allClues = useMemo(() => {
    const map = new Map<number, ClueCard>();
    gameState.players.forEach((player) => {
      player.clueCards.forEach((card) => map.set(card.id, card));
    });
    return map;
  }, [gameState.players]);

  const attempt = gameState.activeSolvingAttempt;
  const attemptAccused = attempt
    ? gameState.players.find(
      (player) => player.userId === attempt.accusedUserId,
    )
    : undefined;
  const attemptMeans = attempt
    ? allMeans.get(attempt.selectedMeansId)
    : undefined;
  const attemptClue = attempt
    ? allClues.get(attempt.selectedClueId)
    : undefined;
  const autoSolvingResult: "correct" | "incorrect" | null =
    attempt?.result === "correct"
      ? "correct"
      : attempt?.result === "incorrect"
        ? "incorrect"
        : null;
  const solvingResolutionNotice = gameState.solvingResolutionNotice;
  const showIncorrectSolvingPopup = solvingResolutionNotice?.result === "incorrect";
  const hideRolesUi = roleMaskEnabled;

  const selectedMeansForensic = !hideRolesUi && gameState.murderSelection
    ? allMeans.get(gameState.murderSelection.meansId)
    : undefined;
  const selectedClueForensic = !hideRolesUi && gameState.murderSelection
    ? allClues.get(gameState.murderSelection.clueId)
    : undefined;

  const forensicHintTiles = useMemo(
    () => gameState.activeSceneTiles.slice(0, 6),
    [gameState.activeSceneTiles],
  );

  const resolvedFocusedPlayerUserId = useMemo(() => {
    if (
      focusedPlayerUserId &&
      selectableEvidencePlayers.some(
        (player) => player.userId === focusedPlayerUserId,
      )
    ) {
      return focusedPlayerUserId;
    }

    return (
      (isForensic
        ? selectableEvidencePlayers[0]?.userId
        : selectableEvidencePlayers.find((player) => player.userId === me?.userId)
          ?.userId) ||
      selectableEvidencePlayers[0]?.userId ||
      ""
    );
  }, [focusedPlayerUserId, isForensic, me?.userId, selectableEvidencePlayers]);
  const playerEvidenceViews = useMemo(() => {
    const views = new Map<
      string,
      {
        player: DeceptionPlayer;
        means: Array<{
          card: MeansCard;
          imageUrl: string;
          rotationClass: string;
        }>;
        clues: Array<{
          card: ClueCard;
          imageUrl: string;
          rotationClass: string;
        }>;
        cardCount: number;
      }
    >();

    activePlayers.forEach((player) => {
      const means = player.meansCards.map((card, index) => ({
        card,
        imageUrl: getResolvedMeansImageUrl(card.id),
        rotationClass: cardTiltClass(index),
      }));

      const clues = player.clueCards.map((card, index) => ({
        card,
        imageUrl: getResolvedClueImageUrl(card.id),
        rotationClass: cardTiltClass(index + 4),
      }));

      views.set(player.userId, {
        player,
        means,
        clues,
        cardCount: means.length + clues.length,
      });
    });

    return views;
  }, [activePlayers]);
  const warmedPlayersCount = useMemo(
    () =>
      activePlayers.reduce(
        (count, player) => count + (playerReadyMap[player.userId] ? 1 : 0),
        0,
      ),
    [activePlayers, playerReadyMap],
  );
  const warmProgressLabel = `${warmedPlayersCount}/${activePlayers.length}`;

  const canSeeMurderSelection =
    !hideRolesUi && (me?.role === "Murderer" || me?.role === "Accomplice");
  const knownMurderer = useMemo(
    () =>
      hideRolesUi
        ? undefined
        : activePlayers.find((player) => player.role === "Murderer"),
    [activePlayers, hideRolesUi],
  );
  const revealedMurderSelection = canSeeMurderSelection
    ? gameState.murderSelection
    : null;

  const forensicHints = useMemo(
    () =>
      gameState.activeSceneTiles.slice(0, 6).map((tile, index) => {
        const selectedOption =
          tile.markerIndex === null ? null : tile.options[tile.markerIndex];

        let accentColor = "rgba(182,141,95,0.78)";
        let cardSurface =
          "linear-gradient(160deg,rgba(60,44,31,0.88),rgba(34,26,20,0.94))";
        let titleColor = "#f3debe";
        let pickedColor = "#f6eee2";
        let dossierInk = "rgba(236,205,160,0.86)";

        if (tile.type === "mandatory_purple") {
          accentColor = "rgba(157,132,205,0.82)";
          cardSurface =
            "linear-gradient(160deg,rgba(55,43,76,0.9),rgba(34,28,47,0.95))";
          titleColor = "#e2d6f8";
          pickedColor = "#f1eafa";
          dossierInk = "rgba(201,187,231,0.88)";
        } else if (tile.type === "mandatory_green") {
          accentColor = "rgba(125,172,139,0.82)";
          cardSurface =
            "linear-gradient(160deg,rgba(37,68,52,0.9),rgba(24,46,36,0.95))";
          titleColor = "#d2ebdc";
          pickedColor = "#ebf7ef";
          dossierInk = "rgba(187,215,197,0.88)";
        }

        return {
          id: tile.id,
          side: index % 2 === 0 ? "left" : "right",
          title: tile.nameVi || tile.name,
          picked: selectedOption
            ? selectedOption.textVi || selectedOption.text
            : "Chưa có dấu",
          accentColor,
          cardSurface,
          titleColor,
          pickedColor,
          dossierInk,
        };
      }),
    [gameState.activeSceneTiles],
  );

  const shouldScaleNonForensicLayout =
    !isForensic && viewportWidth > 0 && viewportWidth <= 1200;
  const isCompactViewport = viewportWidth > 0 && viewportWidth <= 1200;
  const isDesktopWideViewport = viewportWidth > 1200;
  const canToggleDiscussionAudio = gameState.state === "DISCUSSION";
  const nonForensicSceneWidth = isCompactViewport
    ? COMPACT_NON_FORENSIC_SCENE_WIDTH
    : NON_FORENSIC_SCENE_WIDTH;
  const nonForensicSceneHeight = isCompactViewport
    ? COMPACT_NON_FORENSIC_SCENE_HEIGHT
    : NON_FORENSIC_SCENE_HEIGHT;

  const nonForensicScale = useSceneScale({
    viewportRef: nonForensicViewportRef,
    sceneWidth: nonForensicSceneWidth,
    sceneHeight: nonForensicSceneHeight,
    padding: 10,
    minScale: 0.24,
    maxScale: 1,
    minViewportWidth: 260,
    minViewportHeight: 300,
    active: shouldScaleNonForensicLayout,
  });

  const handleSendChat = (event: FormEvent) => {
    event.preventDefault();
    const text = chatText.trim();
    if (!text || !canChat) return;
    socket?.emit("chatMessage", text);
    setChatText("");
  };

  return (
    <div className="deception-room-bg deception-theme deception-phase-shell flex h-dvh flex-col overflow-hidden">
      <main
        className={`deception-phase-main relative flex min-h-0 flex-1 flex-col ${isCompactViewport ? "gap-2 p-2" : "gap-3 p-3"
          }`}
      >
        {!isForensic && (
          <section
            className={`deception-card rounded-xl ${isCompactViewport ? "p-2" : "p-2.5"}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <button
                  onClick={() => {
                    setSolvingWizardVersion((prev) => prev + 1);
                    setShowSolvingWizard(true);
                  }}
                  disabled={!canOpenSolve}
                  className={`deception-btn-cyan inline-flex items-center gap-1.5 font-black uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-45 ${isCompactViewport
                      ? "px-2 py-1.5 text-[10px]"
                      : "px-3 py-2 text-[11px]"
                    }`}
                  title="Tố cáo"
                >
                  <Search
                    className={isCompactViewport ? "h-3 w-3" : "h-3.5 w-3.5"}
                  />
                  Tố cáo
                </button>

                <button
                  onClick={() => setShowForensicClueBoard(true)}
                  className={`deception-btn-outline inline-flex items-center gap-1.5 font-black uppercase tracking-[0.14em] ${isCompactViewport
                      ? "px-2 py-1.5 text-[10px]"
                      : "px-3 py-2 text-[11px]"
                    }`}
                  title="Mở Scene Board"
                >
                  <FileText
                    className={isCompactViewport ? "h-3 w-3" : "h-3.5 w-3.5"}
                  />
                  Scene Board
                </button>

                <button
                  onClick={onToggleRoleMask}
                  className={`deception-btn-outline inline-flex items-center gap-1.5 font-black uppercase tracking-[0.14em] ${isCompactViewport
                      ? "px-2 py-1.5 text-[10px]"
                      : "px-3 py-2 text-[11px]"
                    }`}
                  title={hideRolesUi ? "Hiện lại role thật" : "Ẩn role thật"}
                >
                  <EyeOff
                    className={isCompactViewport ? "h-3 w-3" : "h-3.5 w-3.5"}
                  />
                  {hideRolesUi ? "Hiện Role" : "Ẩn Role"}
                </button>

                {canToggleDiscussionAudio && (
                  <button
                    onClick={onToggleBgm}
                    className={`deception-btn-outline inline-flex items-center gap-1.5 font-black uppercase tracking-[0.14em] ${isCompactViewport
                        ? "px-2 py-1.5 text-[10px]"
                        : "px-3 py-2 text-[11px]"
                      }`}
                    title={bgmMuted ? "Bật nhạc nền" : "Tắt nhạc nền"}
                  >
                    {bgmMuted ? (
                      <VolumeX className={isCompactViewport ? "h-3 w-3" : "h-3.5 w-3.5"} />
                    ) : (
                      <Volume2 className={isCompactViewport ? "h-3 w-3" : "h-3.5 w-3.5"} />
                    )}
                    {bgmMuted ? "Bật Nhạc" : "Tắt Nhạc"}
                  </button>
                )}
              </div>

              <div className="flex min-w-0 items-center gap-1.5">
                <div
                  className={isCompactViewport ? "origin-right scale-90" : ""}
                >
                  <TimerBar
                    currentRound={gameState.currentRound}
                    timerEndAt={gameState.timerEndAt}
                    timerPausedRemaining={gameState.timerPausedRemaining}
                    roundDurationSeconds={gameState.settings.discussionTimeSeconds}
                  />
                </div>

                <button
                  onClick={onExit}
                  className={`deception-btn-outline inline-flex items-center gap-1.5 font-black uppercase tracking-[0.14em] ${isCompactViewport
                      ? "px-2 py-1.5 text-[10px]"
                      : "px-3 py-2 text-[11px]"
                    }`}
                  title="Thoát về sảnh"
                >
                  <ArrowLeft
                    className={isCompactViewport ? "h-3 w-3" : "h-3.5 w-3.5"}
                  />
                  Quay về
                </button>
              </div>
            </div>
          </section>
        )}

        {isForensic ? (
          <div className="min-h-0 flex-1 space-y-2 overflow-auto sm:space-y-3">
            <section className="rounded-xl border border-white/10 bg-slate-900/82 p-3 shadow-2xl backdrop-blur-xl sm:p-4">
              <div className="flex flex-col gap-2.5 sm:gap-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1 rounded-lg border border-(--deception-border) bg-[rgba(255,255,255,0.02)] p-1">
                    <button
                      onClick={() => setForensicTab("hints")}
                      className={`rounded-md px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] transition sm:px-3 sm:text-[11px] ${forensicTab === "hints"
                          ? "bg-rose-600 text-white"
                          : "text-(--on-surface-variant) hover:bg-rose-500/15 hover:text-rose-200"
                        }`}
                    >
                      6 Viên Đạn
                    </button>

                    <button
                      onClick={() => setForensicTab("players")}
                      className={`rounded-md px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] transition sm:px-3 sm:text-[11px] ${forensicTab === "players"
                          ? "bg-cyan-600 text-white"
                          : "text-(--on-surface-variant) hover:bg-cyan-500/15 hover:text-cyan-200"
                        }`}
                    >
                      Người chơi
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={onToggleRoleMask}
                      className="deception-icon-btn"
                      title={hideRolesUi ? "Hiện lại role thật" : "Ẩn role thật"}
                    >
                      <EyeOff className="h-4 w-4" />
                    </button>

                    {canToggleDiscussionAudio && (
                      <button
                        onClick={onToggleBgm}
                        className="deception-icon-btn"
                        title={bgmMuted ? "Bật nhạc nền" : "Tắt nhạc nền"}
                      >
                        {bgmMuted ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </button>
                    )}

                    <button
                      onClick={onExit}
                      className="deception-icon-btn"
                      title="Thoát về sảnh"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="w-full rounded-md border-l-4 border-rose-500/60 bg-[rgba(255,255,255,0.04)] px-2.5 py-2 sm:px-3 sm:py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Solution
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-slate-100 sm:gap-2.5 sm:text-sm">
                    {hideRolesUi ? (
                      <span className="text-[10px] uppercase tracking-[0.14em] text-(--on-surface-variant) sm:text-[11px] sm:tracking-[0.16em]">
                        Ẩn theo chế độ ngụy trang
                      </span>
                    ) : (
                      <>
                        <span className="inline-flex min-w-0 items-center gap-1.5">
                          <CookingPot className="h-4 w-4 shrink-0 text-cyan-300" />
                          <span className="truncate">
                            {selectedMeansForensic
                              ? `${selectedMeansForensic.english} (${selectedMeansForensic.vietnamese})`
                              : "Đang chờ"}
                          </span>
                        </span>
                        <span className="text-slate-500">+</span>
                        <span className="inline-flex min-w-0 items-center gap-1.5">
                          <Fingerprint className="h-4 w-4 shrink-0 text-rose-300" />
                          <span className="truncate">
                            {selectedClueForensic
                              ? `${selectedClueForensic.english} (${selectedClueForensic.vietnamese})`
                              : "Đang chờ"}
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className={isCompactViewport ? "origin-left scale-90" : ""}>
                    <TimerBar
                      currentRound={gameState.currentRound}
                      timerEndAt={gameState.timerEndAt}
                      timerPausedRemaining={gameState.timerPausedRemaining}
                      roundDurationSeconds={gameState.settings.discussionTimeSeconds}
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {gameState.state === "DISCUSSION" &&
                      !gameState.timerEndAt && (
                        <button
                          onClick={() => socket?.emit("startDiscussion")}
                          className="deception-btn-cyan px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] sm:px-3 sm:py-2 sm:text-[11px] sm:tracking-[0.16em]"
                        >
                          Bắt đầu
                        </button>
                      )}

                    <button
                      onClick={() => setForensicTab("players")}
                      className="deception-icon-btn hidden lg:inline-flex"
                      title="Xem thẻ người chơi"
                    >
                      <History className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {forensicTab === "hints" ? (
              <section
                className={`deception-card rounded-xl ${isCompactViewport ? "p-2.5 pb-20" : "p-4"
                  }`}
              >
                <SceneBoard
                  tiles={forensicHintTiles}
                  variant="forensicNotes"
                  readOnly={gameState.state === "SOLVING_ATTEMPT"}
                  replacedTileIndex={gameState.replacedTileIndex}
                  onSelectOption={(tileId, optionIndex) => {
                    if (gameState.state === "SOLVING_ATTEMPT") return;
                    socket?.emit("placeMarker", {
                      tileId,
                      optionIndex,
                    });
                  }}
                />
              </section>
            ) : (
              <section
                className={`deception-card rounded-xl ${isCompactViewport ? "p-2.5 pb-20" : "p-3.5"
                  }`}
              >

                <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
                  {activePlayers.map((player) => {
                    const isForensicPlayer = player.role === "ForensicScientist";
                    const showForensicBadge = !hideRolesUi && isForensicPlayer;
                    const accusationTone = accusationBadgeTone(player.hasBadge);
                    const active =
                      player.userId === resolvedFocusedPlayerUserId;
                    const isSelf = player.userId === me?.userId;
                    const initial = (
                      player.name?.trim().charAt(0) || "?"
                    ).toUpperCase();
                    const displayName = clampPlayerName(
                      player.name,
                      isCompactViewport ? 11 : 14,
                    );
                    const roleTone = hideRolesUi
                      ? roleToneByRole(undefined)
                      : roleToneByRole(player.role);

                    return (
                      <button
                        key={player.userId}
                        disabled={isForensicPlayer}
                        onClick={() => {
                          if (isForensicPlayer) return;
                          setFocusedPlayerUserId(player.userId);
                        }}
                        title={
                          isForensicPlayer
                            ? hideRolesUi
                              ? "Không thể xem bộ thẻ này"
                              : "Pháp y không có 8 thẻ để xem"
                            : "Xem bộ thẻ người chơi"
                        }
                        className={`relative overflow-hidden rounded-lg border p-2 text-left transition ${active ? roleTone.activeCardClass : roleTone.idleCardClass} ${isForensicPlayer ? "cursor-not-allowed opacity-85" : ""}`}
                      >
                        {isForensicPlayer && (
                          <>
                            <span className="pointer-events-none absolute inset-0 z-10 bg-[repeating-linear-gradient(-24deg,rgba(255,255,255,0.02)_0,rgba(255,255,255,0.02)_8px,rgba(13,20,33,0.22)_8px,rgba(13,20,33,0.22)_16px)]" />
                            <span className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-0.5 w-[122%] -translate-x-1/2 -translate-y-1/2 rotate-[-22deg] bg-[rgba(255,110,130,0.9)] shadow-[0_0_9px_rgba(255,94,120,0.45)]" />
                            <span className="pointer-events-none absolute right-1.5 top-1.5 z-20 inline-flex items-center gap-1 rounded border border-rose-300/75 bg-[rgba(68,16,26,0.82)] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-rose-100">
                              <Lock className="h-2.5 w-2.5" />
                              {hideRolesUi ? "Khóa xem" : "Pháp y"}
                            </span>
                          </>
                        )}

                        <div className="flex items-center gap-2">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-black uppercase tracking-[0.08em] ${roleTone.avatarClass}`}>
                            {initial}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold uppercase tracking-[0.08em] text-(--on-surface)">
                              {displayName}
                              {playerPings[player.userId] !== undefined && (
                                <span className={`ml-1 text-[10px] font-black font-mono tracking-tighter ${
                                  playerPings[player.userId] < 150
                                    ? "text-emerald-400"
                                    : playerPings[player.userId] < 350
                                      ? "text-amber-400"
                                      : "text-red-500"
                                }`}>
                                  {Math.min(999, playerPings[player.userId])}ms
                                </span>
                              )}
                            </p>

                            <div className="mt-1 flex flex-wrap items-center gap-1">
                              <span className={`inline-flex max-w-full items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${roleTone.chipClass}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${roleTone.dotClass}`} />
                                <span className="truncate">
                                  {hideRolesUi ? "Người chơi" : roleLabel(player)}
                                </span>
                              </span>

                              {showForensicBadge && (
                                <span className="inline-flex items-center gap-1 rounded border border-cyan-300/75 bg-[radial-gradient(circle_at_30%_30%,rgba(70,220,255,0.35),rgba(12,68,102,0.58))] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-cyan-50 shadow-[0_0_10px_rgba(0,212,255,0.28)]">
                                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_8px_rgba(120,240,255,0.8)]" />
                                  Pháp y
                                </span>
                              )}

                              <span
                                title={accusationTone.title}
                                className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest ${accusationTone.chipClass}`}
                              >
                                <BadgeCheck className={`h-2.5 w-2.5 ${accusationTone.iconClass}`} />
                                <span>{accusationTone.label}</span>
                              </span>

                              {isSelf && (
                                <span className="rounded border border-cyan-300/70 bg-cyan-400/18 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-cyan-100">
                                  Bạn
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <article className="mt-3 min-h-0 rounded-xl border border-(--deception-border) bg-[rgba(255,255,255,0.02)] p-3">
                  <div className="relative min-h-48">
                    {selectableEvidencePlayers.map((player) => {
                      const view = playerEvidenceViews.get(player.userId);
                      if (!view) return null;

                      const isActive =
                        player.userId === resolvedFocusedPlayerUserId;
                      const playerIsForensicIdentity =
                        !hideRolesUi && view.player.role === "ForensicScientist";
                      const playerHasNoCards =
                        hideRolesUi && view.cardCount === 0;
                      const playerHasWarmCards = Boolean(playerReadyMap[player.userId]);
                      const playerNeedsWarmup =
                        !playerIsForensicIdentity &&
                        !playerHasNoCards &&
                        !playerHasWarmCards;

                      return (
                        <section
                          key={`forensic-players-view-${player.userId}`}
                          aria-hidden={!isActive}
                          className={
                            isActive
                              ? "relative transition-opacity duration-200"
                              : "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200"
                          }
                        >
                          {playerIsForensicIdentity || playerHasNoCards ? (
                            <div className="flex h-full items-center justify-center rounded-lg border border-(--deception-border) bg-[rgba(255,255,255,0.03)] p-4 text-center">
                              <p
                                className="text-base italic leading-tight text-(--on-surface-variant)"
                                style={{
                                  fontFamily:
                                    "var(--font-cormorant), var(--font-headline), serif",
                                }}
                              >
                                {playerIsForensicIdentity
                                  ? "Đây là pháp y nên không có 8 thẻ (4 hung khí + 4 manh mối)."
                                  : "Người chơi này không có bộ thẻ công khai."}
                              </p>
                            </div>
                          ) : playerNeedsWarmup ? (
                            <div className="flex h-full items-center justify-center rounded-lg border border-(--deception-border) bg-[rgba(255,255,255,0.03)] p-4 text-center">
                              <div>
                                <p
                                  className="text-base italic leading-tight text-(--on-surface-variant)"
                                  style={{
                                    fontFamily:
                                      "var(--font-cormorant), var(--font-headline), serif",
                                  }}
                                >
                                  Đang tải bộ chứng cứ của người chơi này. Dữ liệu người khác sẽ được nạp ngầm.
                                </p>
                                <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-(--on-surface-variant)">
                                  Tiến độ warm cache: {warmProgressLabel} người chơi
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="grid min-h-0 grid-cols-2 gap-3 md:grid-cols-4">
                              {view.means.map(({ card, imageUrl, rotationClass }) => (
                                <div
                                  className="h-48 md:h-56"
                                  key={`forensic-players-means-${player.userId}-${card.id}`}
                                >
                                  <EvidencePreviewCard
                                    card={card}
                                    tone="means"
                                    highlighted={false}
                                    rotationClass={rotationClass}
                                    evidenceNum={String(card.id).padStart(2, "0")}
                                    imageUrl={imageUrl}
                                  />
                                </div>
                              ))}

                              {view.clues.map(({ card, imageUrl, rotationClass }) => (
                                <div
                                  className="h-48 md:h-56"
                                  key={`forensic-players-clue-${player.userId}-${card.id}`}
                                >
                                  <EvidencePreviewCard
                                    card={card}
                                    tone="clue"
                                    highlighted={false}
                                    rotationClass={rotationClass}
                                    evidenceNum={String(card.id).padStart(2, "0")}
                                    imageUrl={imageUrl}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </section>
                      );
                    })}
                  </div>
                </article>
              </section>
            )}
          </div>
        ) : (
          <section
            ref={nonForensicViewportRef}
            className={`relative min-h-0 flex-1 ${shouldScaleNonForensicLayout ? "overflow-hidden" : "overflow-auto"}`}
          >
            <div
              className={`flex h-full w-full ${shouldScaleNonForensicLayout
                  ? "items-start justify-center overflow-hidden"
                  : "items-stretch justify-stretch"
                }`}
            >
              <div
                className={
                  shouldScaleNonForensicLayout
                    ? "flex shrink-0 flex-col gap-4"
                    : "flex h-full w-full flex-col gap-4"
                }
                style={
                  shouldScaleNonForensicLayout
                    ? {
                      width: `${nonForensicSceneWidth}px`,
                      height: `${nonForensicSceneHeight}px`,
                      transform: `scale(${nonForensicScale})`,
                      transformOrigin: "top center",
                    }
                    : undefined
                }
              >
                <section className="deception-card rounded-xl p-3">
                  <div
                    className={isDesktopWideViewport
                      ? "flex gap-1.5 overflow-x-auto pr-1"
                      : "grid grid-cols-3 gap-2 md:grid-cols-4 xl:grid-cols-6"}
                  >
                    {activePlayers.map((player) => {
                      const isForensicPlayer = player.role === "ForensicScientist";
                      const showForensicBadge = !hideRolesUi && isForensicPlayer;
                      const accusationTone = accusationBadgeTone(player.hasBadge);
                      const active =
                        player.userId === resolvedFocusedPlayerUserId;
                      const isSelf = player.userId === me?.userId;
                      const initial = (
                        player.name?.trim().charAt(0) || "?"
                      ).toUpperCase();
                      const displayName = clampPlayerName(
                        player.name,
                        isDesktopWideViewport ? 11 : isCompactViewport ? 11 : 14,
                      );
                      const roleTone = hideRolesUi
                        ? roleToneByRole(undefined)
                        : roleToneByRole(player.role);

                      return (
                        <button
                          key={player.userId}
                          disabled={isForensicPlayer}
                          onClick={() => {
                            if (isForensicPlayer) return;
                            setFocusedPlayerUserId(player.userId);
                          }}
                          title={
                            isForensicPlayer
                              ? hideRolesUi
                                ? "Không thể xem bộ thẻ này"
                                : "Pháp y không có 8 thẻ để xem"
                              : "Xem bộ thẻ người chơi"
                          }
                          className={`relative overflow-hidden rounded-lg border text-left transition ${active ? roleTone.activeCardClass : roleTone.idleCardClass} ${isForensicPlayer ? "cursor-not-allowed opacity-85" : ""} ${isDesktopWideViewport ? "min-w-[10.8rem] p-1.5" : "p-2"}`}
                        >
                          {isForensicPlayer && (
                            <>
                              <span className="pointer-events-none absolute inset-0 z-10 bg-[repeating-linear-gradient(-24deg,rgba(255,255,255,0.02)_0,rgba(255,255,255,0.02)_8px,rgba(13,20,33,0.22)_8px,rgba(13,20,33,0.22)_16px)]" />
                              <span className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-0.5 w-[122%] -translate-x-1/2 -translate-y-1/2 rotate-[-22deg] bg-[rgba(255,110,130,0.9)] shadow-[0_0_9px_rgba(255,94,120,0.45)]" />
                              <span className="pointer-events-none absolute right-1.5 top-1.5 z-20 inline-flex items-center gap-1 rounded border border-rose-300/75 bg-[rgba(68,16,26,0.82)] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-rose-100">
                                <Lock className="h-2.5 w-2.5" />
                                {hideRolesUi ? "Khóa xem" : "Pháp y"}
                              </span>
                            </>
                          )}

                          <div className="flex items-center gap-2">
                            <div className={`flex shrink-0 items-center justify-center rounded-full border font-black uppercase tracking-[0.08em] ${roleTone.avatarClass} ${isDesktopWideViewport ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm"}`}>
                              {initial}
                            </div>

                            <div className="min-w-0">
                              <p className={`truncate font-bold uppercase tracking-[0.08em] text-(--on-surface) ${isDesktopWideViewport ? "text-xs" : "text-sm"}`}>
                                {displayName}
                                {playerPings[player.userId] !== undefined && (
                                  <span className={`ml-1 text-[10px] font-black font-mono tracking-tighter ${
                                    playerPings[player.userId] < 150
                                      ? "text-emerald-400"
                                      : playerPings[player.userId] < 350
                                        ? "text-amber-400"
                                        : "text-red-500"
                                  }`}>
                                    {Math.min(999, playerPings[player.userId])}ms
                                  </span>
                                )}
                              </p>

                              <div className="mt-1 flex flex-wrap items-center gap-1">
                                <span className={`inline-flex max-w-full items-center gap-1 rounded border font-black uppercase tracking-widest ${roleTone.chipClass} ${isDesktopWideViewport ? "px-1 py-0.5 text-[8px]" : "px-1.5 py-0.5 text-[9px]"}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${roleTone.dotClass}`} />
                                  <span className="truncate">
                                    {hideRolesUi ? "Người chơi" : roleLabel(player)}
                                  </span>
                                </span>

                                {showForensicBadge && (
                                  <span className={`inline-flex items-center gap-1 rounded border border-cyan-300/75 bg-[radial-gradient(circle_at_30%_30%,rgba(70,220,255,0.35),rgba(12,68,102,0.58))] font-black uppercase tracking-widest text-cyan-50 shadow-[0_0_10px_rgba(0,212,255,0.28)] ${isDesktopWideViewport ? "px-1 py-0.5 text-[8px]" : "px-1.5 py-0.5 text-[8px]"}`}>
                                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_8px_rgba(120,240,255,0.8)]" />
                                    Pháp y
                                  </span>
                                )}

                                <span
                                  title={accusationTone.title}
                                  className={`inline-flex items-center gap-1 rounded border font-black uppercase tracking-widest ${accusationTone.chipClass} ${isDesktopWideViewport ? "px-1 py-0.5 text-[8px]" : "px-1.5 py-0.5 text-[8px]"}`}
                                >
                                  <BadgeCheck className={`h-2.5 w-2.5 ${accusationTone.iconClass}`} />
                                  <span>{accusationTone.label}</span>
                                </span>

                                {isSelf && (
                                  <span className={`rounded border border-cyan-300/70 bg-cyan-400/18 font-black uppercase tracking-widest text-cyan-100 ${isDesktopWideViewport ? "px-1 py-0.5 text-[8px]" : "px-1.5 py-0.5 text-[8px]"}`}>
                                    Bạn
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className={`grid min-h-0 flex-1 ${isDesktopWideViewport ? "gap-3 grid-cols-[minmax(0,1fr)_22rem]" : "gap-4 grid-cols-[minmax(0,1fr)_21rem]"}`}>
                  <article className="deception-card min-h-0 overflow-visible rounded-xl p-3">
                    <div className="relative h-full min-h-0">
                      {selectableEvidencePlayers.map((player) => {
                        const view = playerEvidenceViews.get(player.userId);
                        if (!view) return null;

                        const isActive =
                          player.userId === resolvedFocusedPlayerUserId;
                        const playerIsForensicIdentity =
                          !hideRolesUi && view.player.role === "ForensicScientist";
                        const playerHasNoCards = hideRolesUi && view.cardCount === 0;
                        const playerHasWarmCards = Boolean(playerReadyMap[player.userId]);
                        const playerNeedsWarmup =
                          !playerIsForensicIdentity &&
                          !playerHasNoCards &&
                          !playerHasWarmCards;
                        const playerIsKnownMurderer = Boolean(
                          knownMurderer && player.userId === knownMurderer.userId,
                        );

                        return (
                          <section
                            key={`discussion-players-view-${player.userId}`}
                            aria-hidden={!isActive}
                            className={
                              isActive
                                ? "relative h-full transition-opacity duration-200"
                                : "pointer-events-none absolute inset-0 h-full opacity-0 transition-opacity duration-200"
                            }
                          >
                            {playerIsForensicIdentity || playerHasNoCards ? (
                              <div className="flex h-full items-center justify-center rounded-lg border border-(--deception-border) bg-[rgba(255,255,255,0.03)] p-4 text-center">
                                <p
                                  className="text-base italic leading-tight text-(--on-surface-variant)"
                                  style={{
                                    fontFamily:
                                      "var(--font-cormorant), var(--font-headline), serif",
                                  }}
                                >
                                  {playerIsForensicIdentity
                                    ? "Đây là pháp y nên không có 8 thẻ (4 hung khí + 4 manh mối)."
                                    : "Người chơi này không có bộ thẻ công khai."}
                                </p>
                              </div>
                            ) : playerNeedsWarmup ? (
                              <div className="flex h-full items-center justify-center rounded-lg border border-(--deception-border) bg-[rgba(255,255,255,0.03)] p-4 text-center">
                                <div>
                                  <p
                                    className="text-base italic leading-tight text-(--on-surface-variant)"
                                    style={{
                                      fontFamily:
                                        "var(--font-cormorant), var(--font-headline), serif",
                                    }}
                                  >
                                    Đang nạp dữ liệu chứng cứ cho người chơi này. Chuyển tab chỉ đổi view sau khi cache hoàn tất.
                                  </p>
                                  <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-(--on-surface-variant)">
                                    {playerCardsReady
                                      ? "Toàn bộ dữ liệu đã sẵn sàng"
                                      : `Tiến độ warm cache: ${warmProgressLabel} người chơi`}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="grid h-full min-h-0 grid-cols-4 auto-rows-fr gap-3 overflow-visible">
                                {view.means.map(({ card, imageUrl, rotationClass }) => {
                                  const isMurderMeans =
                                    playerIsKnownMurderer &&
                                    Boolean(revealedMurderSelection) &&
                                    card.id === revealedMurderSelection?.meansId;

                                  return (
                                    <EvidencePreviewCard
                                      key={`means-${player.userId}-${card.id}`}
                                      card={card}
                                      tone="means"
                                      highlighted={isMurderMeans}
                                      rotationClass={rotationClass}
                                      evidenceNum={String(card.id).padStart(2, "0")}
                                      imageUrl={imageUrl}
                                    />
                                  );
                                })}

                                {view.clues.map(({ card, imageUrl, rotationClass }) => {
                                  const isMurderClue =
                                    playerIsKnownMurderer &&
                                    Boolean(revealedMurderSelection) &&
                                    card.id === revealedMurderSelection?.clueId;

                                  return (
                                    <EvidencePreviewCard
                                      key={`clue-${player.userId}-${card.id}`}
                                      card={card}
                                      tone="clue"
                                      highlighted={isMurderClue}
                                      rotationClass={rotationClass}
                                      evidenceNum={String(card.id).padStart(2, "0")}
                                      imageUrl={imageUrl}
                                    />
                                  );
                                })}
                              </div>
                            )}
                          </section>
                        );
                      })}
                    </div>
                  </article>

                  <aside
                    className={`deception-card min-h-0 overflow-hidden rounded-xl border-[rgba(133,103,70,0.42)] bg-[radial-gradient(circle_at_20%_14%,rgba(133,103,70,0.16),transparent_42%),linear-gradient(180deg,rgba(18,15,12,0.97),rgba(10,9,8,0.98))] ${isCompactViewport ? "p-2.5" : "p-3.5"} flex flex-col`}
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-[rgba(188,155,117,0.24)] pb-2">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#dcc09a]">
                        6 gợi ý của pháp y
                      </p>
                      <span className="rounded border border-[rgba(188,155,117,0.36)] bg-[rgba(86,59,34,0.26)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#c6ab87]">
                        Case Board
                      </span>
                    </div>

                    <div className="relative mt-2.5 min-h-0 flex-1">
                      <div className="pointer-events-none absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-[linear-gradient(180deg,rgba(214,182,143,0),rgba(214,182,143,0.52),rgba(214,182,143,0.2),rgba(214,182,143,0))]" />

                      <div
                        className="relative grid h-full min-h-0 grid-cols-1 gap-1.5"
                        style={{
                          gridTemplateRows: `repeat(${Math.max(1, forensicHints.length)}, minmax(0, 1fr))`,
                        }}
                      >
                        {forensicHints.map((hint, index) => {
                          const rightAligned = hint.side === "right";

                          return (
                            <div
                              key={hint.id}
                              className={`relative min-h-0 flex ${rightAligned ? "justify-end pl-4" : "justify-start pr-4"}`}
                            >
                              <span className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(214,182,143,0.75)] bg-[rgba(67,44,27,0.95)] shadow-[0_0_0_2px_rgba(11,10,8,0.8)]" />

                              <span
                                className={`pointer-events-none absolute top-1/2 h-px w-4 -translate-y-1/2 bg-[rgba(214,182,143,0.44)] ${rightAligned ? "left-[calc(50%+0.31rem)]" : "right-[calc(50%+0.31rem)]"}`}
                              />

                              <article
                                className="relative flex h-full min-h-0 w-[86%] flex-col justify-center overflow-hidden rounded-md border px-3.5 py-2.5 shadow-[0_6px_16px_rgba(0,0,0,0.36),inset_0_0_0_1px_rgba(255,236,206,0.05)]"
                                style={{
                                  borderColor: hint.accentColor,
                                  background: hint.cardSurface,
                                }}
                              >
                                <span
                                  className={`pointer-events-none absolute bottom-1 rounded border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] opacity-75 z-0 ${
                                    rightAligned ? "left-2" : "right-2"
                                  }`}
                                  style={{
                                    color: hint.dossierInk,
                                    borderColor: hint.accentColor,
                                    background: "rgba(14,11,9,0.34)",
                                  }}
                                >
                                  #{String(index + 1).padStart(2, "0")}
                                </span>

                                <span
                                  className={`absolute top-2 h-1.5 w-6 rounded-full ${rightAligned ? "left-2" : "right-2"}`}
                                  style={{ backgroundColor: hint.accentColor }}
                                />

                                <p
                                  className={`relative z-10 truncate text-[11px] font-bold uppercase tracking-widest ${rightAligned ? "text-right" : "text-left"}`}
                                  style={{ color: hint.titleColor }}
                                  title={hint.title}
                                >
                                  {hint.title}
                                </p>

                                <p
                                  className={`relative z-10 mt-1 line-clamp-1 text-[clamp(1.12rem,2.05vh,1.4rem)] font-bold leading-[1.06] wrap-break-word ${rightAligned ? "text-right" : "text-left"}`}
                                  style={{ color: hint.pickedColor }}
                                  title={hint.picked}
                                >
                                  {hint.picked}
                                </p>
                              </article>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </aside>
                </section>
              </div>
            </div>
          </section>
        )}
      </main>

      {showForensicClueBoard && !isForensic && (
        <div className="fixed inset-0 z-60 bg-black/70 p-1.5 backdrop-blur-sm sm:p-4">
          <div className="mx-auto h-full w-full max-w-6xl overflow-hidden pt-1.5 sm:pt-6">
            <ForensicClueBoard
              tiles={forensicHintTiles}
              showCloseButton
              onClose={() => setShowForensicClueBoard(false)}
            />
          </div>
        </div>
      )}

      {me && (
        <SharedChatDropdown
          messages={visibleChatMessages}
          userId={me.userId}
          showChat={showChat}
          chatText={chatText}
          theme={DECEPTION_CHAT_THEME}
          onToggleChat={() => setShowChat((prev) => !prev)}
          onCloseChat={() => setShowChat(false)}
          onChatTextChange={(value) => setChatText(value.slice(0, 500))}
          onSendChat={handleSendChat}
          canSend={canChat}
          sendBlockedMessage="Pháp y không được chat trong ván chơi."
        />
      )}

      <SolvingWizard
        key={solvingWizardVersion}
        open={showSolvingWizard}
        me={me}
        players={activePlayers}
        onClose={() => setShowSolvingWizard(false)}
        onSubmit={(payload) => {
          socket?.emit("submitSolving", payload);
          setShowSolvingWizard(false);
        }}
      />

      {showIncorrectSolvingPopup && (
        <div className="fixed inset-0 z-75 flex items-center justify-center bg-[radial-gradient(circle_at_50%_20%,rgba(255,55,95,0.22),rgba(0,0,0,0.82)_55%)] p-3 backdrop-blur-md sm:p-6">
          <section className="deception-card relative w-full max-w-2xl overflow-hidden rounded-3xl border border-[rgba(255,95,130,0.48)] bg-[linear-gradient(180deg,rgba(19,12,20,0.98),rgba(10,11,17,0.98))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.72),0_0_0_1px_rgba(255,95,130,0.2)] sm:p-8">
            <div className="pointer-events-none absolute -left-16 top-0 h-42 w-42 rounded-full bg-[radial-gradient(circle,rgba(255,84,122,0.36),transparent_70%)] blur-2xl" />
            <div className="pointer-events-none absolute -right-18 bottom-0 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(255,84,122,0.22),transparent_72%)] blur-2xl" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,transparent,rgba(255,110,146,0.92),transparent)]" />

            <div className="relative z-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(255,112,148,0.62)] bg-[radial-gradient(circle_at_35%_30%,rgba(255,120,154,0.38),rgba(84,18,34,0.48))] text-(--deception-red) shadow-[0_0_30px_rgba(255,90,125,0.34)] sm:h-20 sm:w-20">
                <ShieldAlert className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>

              <p className="mt-4 text-center text-[10px] font-black uppercase tracking-[0.24em] text-[rgba(255,186,202,0.78)]">
                Alert • Solving Result
              </p>

              <h2 className="mt-2 text-center text-3xl font-black uppercase tracking-[0.16em] text-[#ff5f85] sm:text-5xl sm:tracking-[0.18em]">
                Phá Án Sai
              </h2>

              <div className="mt-5 rounded-2xl border border-[rgba(255,110,146,0.3)] bg-[linear-gradient(145deg,rgba(255,95,130,0.1),rgba(255,95,130,0.02))] p-4 sm:mt-6 sm:p-5">
                <p className="text-center text-sm leading-relaxed text-(--on-surface-variant) sm:text-base">
                  <span className="font-black uppercase tracking-[0.08em] text-(--on-surface)">
                    {solvingResolutionNotice?.investigatorName || "Một điều tra viên"}
                  </span>{" "}
                  đã tố cáo sai
                  {solvingResolutionNotice?.accusedName
                    ? ` ${solvingResolutionNotice.accusedName}`
                    : ""}
                  .
                </p>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:mt-4 sm:grid-cols-2">
                <div className="rounded-xl border border-[rgba(255,95,130,0.38)] bg-[rgba(255,95,130,0.14)] px-3 py-2 text-center">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[rgba(255,193,207,0.88)]">
                    Kết quả
                  </p>
                  <p className="mt-1 text-sm font-black uppercase tracking-[0.12em] text-[#ff7a9b]">
                    Incorrect
                  </p>
                </div>

                <div className="rounded-xl border border-[rgba(255,95,130,0.38)] bg-[rgba(255,95,130,0.14)] px-3 py-2 text-center">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[rgba(255,193,207,0.88)]">
                    Badge
                  </p>
                  <p className="mt-1 text-sm font-black uppercase tracking-[0.12em] text-[#ffd2dc]">
                    Revoked
                  </p>
                </div>
              </div>

              <p className="mt-4 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-(--on-surface-variant) sm:mt-5 sm:text-xs">
                Huy hiệu của người tố cáo đã bị thu hồi. Cuộc điều tra tiếp tục.
              </p>
            </div>
          </section>
        </div>
      )}

      {attempt && (
        <SolvingAttemptModal
          attempt={attempt}
          attemptAccused={attemptAccused}
          attemptMeans={attemptMeans}
          attemptClue={attemptClue}
          isForensic={isForensic}
          autoSolvingResult={autoSolvingResult}
          onConfirm={() => socket?.emit("resolveSolving")}
        />
      )}

    </div>
  );
}
