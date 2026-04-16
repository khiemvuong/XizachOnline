"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { Socket } from "socket.io-client";
import Image from "next/image";
import {
  ArrowLeft,
  CookingPot,
  FileText,
  Fingerprint,
  History,
  MessageSquareText,
  Search,
  SendHorizontal,
  ShieldAlert,
  X,
} from "lucide-react";
import type {
  ClueCard,
  DeceptionPlayer,
  DeceptionRoom,
  MeansCard,
} from "@/server/game/DeceptionTypes";
import SceneBoard from "@/components/deception/SceneBoard";
import ForensicClueBoard from "@/components/deception/ForensicClueBoard";
import SolvingWizard from "@/components/deception/SolvingWizard";
import TimerBar from "@/components/deception/TimerBar";
import DeceptionVoiceChatPanel from "@/components/deception/DeceptionVoiceChatPanel";
import { useSceneScale } from "@/hooks/useSceneScale";

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

function cardTiltClass(index: number) {
  return CARD_TILT_CLASSES[index % CARD_TILT_CLASSES.length];
}

function clampPlayerName(name: string, maxLength: number) {
  const normalized = name.trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(1, maxLength - 1))}…`;
}

type EvidenceCard = MeansCard | ClueCard;

function EvidencePreviewCard({
  card,
  tone,
  highlighted,
  rotationClass,
  evidenceNum,
}: {
  card: EvidenceCard;
  tone: "means" | "clue";
  highlighted: boolean;
  rotationClass: string;
  evidenceNum: string;
}) {
  const isMeans = tone === "means";
  const englishTitle = card.english?.trim();
  const vietnameseTitle = card.vietnamese?.trim();
  const title = englishTitle
    ? vietnameseTitle &&
      vietnameseTitle.toLowerCase() !== englishTitle.toLowerCase()
      ? `${englishTitle} (${vietnameseTitle})`
      : englishTitle
    : vietnameseTitle || "Unknown";

  const tonePlaceholder =
    tone === "means"
      ? "bg-[radial-gradient(circle_at_20%_18%,rgba(255,184,0,0.22),transparent_50%),linear-gradient(180deg,#27303a,#1b212a)]"
      : "bg-[radial-gradient(circle_at_20%_18%,rgba(0,212,255,0.22),transparent_50%),linear-gradient(180deg,#27303a,#1b212a)]";
  const tonePaperClass = isMeans
    ? "bg-[#e2e2e5]"
    : "bg-[#efe5bf] deception-paper-texture";
  const toneTagClass = isMeans
    ? "bg-[#f2a4ad] text-[#5f1f29]"
    : "bg-[#97e8ff] text-[#03384a]";
  const toneBadgeClass = isMeans
    ? "bg-[#392b17] text-[#ffcf7a]"
    : "bg-[#0a3948] text-[#9deeff]";
  const pinOuterClass = isMeans ? "bg-slate-300" : "bg-cyan-200";
  const pinInnerClass = isMeans ? "bg-slate-600" : "bg-cyan-700";
  const imageFilterClass = isMeans
    ? "object-cover grayscale-28 opacity-90 transition-all duration-300 group-hover:grayscale-0 group-hover:opacity-100"
    : "object-cover opacity-95 saturate-110 contrast-105 transition-all duration-300 group-hover:saturate-125 group-hover:contrast-110";

  return (
    <div
      className={`group relative h-full min-h-0 overflow-visible rounded-sm border p-1.5 shadow-[5px_5px_14px_rgba(0,0,0,0.45)] transition-transform duration-200 origin-top ${rotationClass} ${highlighted
          ? tone === "means"
            ? "border-(--deception-amber) bg-[rgba(255,184,0,0.12)] shadow-[0_0_0_1px_rgba(255,184,0,0.24),5px_5px_16px_rgba(0,0,0,0.5)]"
            : "border-(--deception-cyan) bg-[rgba(0,212,255,0.12)] shadow-[0_0_0_1px_rgba(0,212,255,0.22),5px_5px_16px_rgba(0,0,0,0.5)]"
          : "border-(--deception-border) bg-[rgba(10,14,22,0.5)]"
        }`}
    >
      <div
        className={`absolute left-1/2 top-1 z-10 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full shadow-inner ${pinOuterClass}`}
      >
        <div className={`h-1 w-1 rounded-full ${pinInnerClass}`} />
      </div>

      <div
        className={`grid h-full min-h-0 grid-rows-[5fr_auto] rounded-sm p-1 ${tonePaperClass}`}
      >
        <div className="relative mt-1 min-h-0 overflow-hidden rounded-sm border border-slate-900/15">
          <div
            className={`pointer-events-none absolute left-1 top-1 z-20 rounded px-1.5 py-0.5 text-[7px] font-black uppercase tracking-widest ${toneBadgeClass}`}
          >
            {isMeans ? "Means" : "Clue"}
          </div>

          {card.imageUrl ? (
            <Image
              src={card.imageUrl}
              alt={englishTitle || vietnameseTitle || "Evidence"}
              fill
              unoptimized
              sizes="160px"
              className={imageFilterClass}
            />
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center px-1 ${tonePlaceholder}`}
            >
              <div className="h-6 w-6 rounded-full border border-slate-300/45 bg-slate-100/12" />
            </div>
          )}
        </div>

        <div className="min-h-0 px-1 pb-0.5 pt-1 text-slate-900">
          <p
            className="w-full line-clamp-2 text-left text-[15px] font-semibold italic leading-tight text-slate-800"
            style={{
              fontFamily: "var(--font-cormorant), var(--font-headline), serif",
            }}
            title={title}
          >
            {title}
          </p>
        </div>
      </div>

      <div
        className={`pointer-events-none absolute -bottom-2 -right-2 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${toneTagClass}`}
      >
        {isMeans ? "Means" : "Clue"} #{evidenceNum}
      </div>

      {highlighted && (
        <>
          <div className="pointer-events-none absolute inset-0 rounded-sm ring-1 ring-inset ring-white/18" />
          <div className="pointer-events-none absolute left-0 top-1/2 h-5 w-full -translate-y-1/2 -rotate-12 scale-x-125 bg-[linear-gradient(90deg,rgba(255,61,96,0),rgba(255,61,96,0.32),rgba(255,61,96,0.58),rgba(255,61,96,0.32),rgba(255,61,96,0))] blur-[1.4px]" />
          <div className="pointer-events-none absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 -rotate-12 scale-x-125 bg-[#ff516e] shadow-[0_0_10px_rgba(255,81,110,0.55)]" />
        </>
      )}
    </div>
  );
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

export default function DiscussionBoard({
  gameState,
  me,
  socket,
  onExit,
}: {
  gameState: DeceptionRoom;
  me?: DeceptionPlayer;
  socket: Socket | null;
  onExit: () => void;
}) {
  const [showChat, setShowChat] = useState(false);
  const [chatText, setChatText] = useState("");
  const [focusedPlayerUserId, setFocusedPlayerUserId] = useState("");
  const [showSolvingWizard, setShowSolvingWizard] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showForensicClueBoard, setShowForensicClueBoard] = useState(false);
  const [solvingWizardVersion, setSolvingWizardVersion] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [forensicTab, setForensicTab] = useState<"hints" | "players">("hints");
  const [forensicHintsAsideHeight, setForensicHintsAsideHeight] = useState(0);
  const nonForensicViewportRef = useRef<HTMLDivElement | null>(null);
  const forensicHintsAsideRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const updateViewport = () => setViewportWidth(window.innerWidth);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const isForensic = me?.role === "ForensicScientist";
  const canChat = !isForensic;
  const canOpenSolve = Boolean(
    me &&
    !isForensic &&
    me.hasBadge &&
    gameState.state === "DISCUSSION" &&
    !gameState.activeSolvingAttempt,
  );

  useEffect(() => {
    if (isForensic) return;
    const asideElement = forensicHintsAsideRef.current;
    if (!asideElement) return;

    const updateHeight = () => {
      setForensicHintsAsideHeight(asideElement.clientHeight);
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      updateHeight();
    });

    observer.observe(asideElement);
    return () => observer.disconnect();
  }, [isForensic, viewportWidth]);

  const activePlayers = useMemo(
    () => gameState.players.filter((player) => !player.isSpectator),
    [gameState.players],
  );

  const connectedVoicePlayers = useMemo(
    () =>
      activePlayers
        .filter((player) => player.status === "connected")
        .map((player) => ({
          userId: player.userId,
          name: player.name,
        })),
    [activePlayers],
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

  const selectedMeansForensic = gameState.murderSelection
    ? allMeans.get(gameState.murderSelection.meansId)
    : undefined;
  const selectedClueForensic = gameState.murderSelection
    ? allClues.get(gameState.murderSelection.clueId)
    : undefined;

  const forensicHintTiles = useMemo(
    () => gameState.activeSceneTiles.slice(0, 6),
    [gameState.activeSceneTiles],
  );

  const resolvedFocusedPlayerUserId = useMemo(() => {
    if (
      focusedPlayerUserId &&
      activePlayers.some((player) => player.userId === focusedPlayerUserId)
    ) {
      return focusedPlayerUserId;
    }

    return (
      (isForensic
        ? activePlayers.find((player) => player.role !== "ForensicScientist")
          ?.userId
        : activePlayers.find((player) => player.userId === me?.userId)
          ?.userId) ||
      activePlayers[0]?.userId ||
      ""
    );
  }, [activePlayers, focusedPlayerUserId, isForensic, me?.userId]);

  const focusedPlayer = useMemo(
    () =>
      activePlayers.find(
        (player) => player.userId === resolvedFocusedPlayerUserId,
      ),
    [activePlayers, resolvedFocusedPlayerUserId],
  );

  const canSeeMurderSelection =
    me?.role === "Murderer" || me?.role === "Accomplice";
  const knownMurderer = useMemo(
    () => activePlayers.find((player) => player.role === "Murderer"),
    [activePlayers],
  );
  const focusedIsKnownMurderer = Boolean(
    focusedPlayer &&
    knownMurderer &&
    focusedPlayer.userId === knownMurderer.userId,
  );
  const revealedMurderSelection = canSeeMurderSelection
    ? gameState.murderSelection
    : null;

  const forensicHints = useMemo(
    () =>
      gameState.activeSceneTiles.slice(0, 6).map((tile) => {
        const selectedOption =
          tile.markerIndex === null ? null : tile.options[tile.markerIndex];

        let cardClass =
          "border-[rgba(177,139,99,0.48)] bg-[linear-gradient(135deg,rgba(123,89,51,0.30),rgba(67,44,26,0.26))]";
        let titleClass = "text-[#f2d2a9]";

        if (tile.type === "mandatory_purple") {
          cardClass =
            "border-[rgba(169,140,255,0.58)] bg-[linear-gradient(135deg,rgba(110,77,194,0.34),rgba(56,34,102,0.30))]";
          titleClass = "text-[#decbff]";
        } else if (tile.type === "mandatory_green") {
          cardClass =
            "border-[rgba(127,214,173,0.56)] bg-[linear-gradient(135deg,rgba(59,128,95,0.35),rgba(28,77,53,0.30))]";
          titleClass = "text-[#caf8df]";
        }

        return {
          id: tile.id,
          title: tile.nameVi || tile.name,
          picked: selectedOption
            ? selectedOption.textVi || selectedOption.text
            : "Chưa có dấu",
          cardClass,
          titleClass,
        };
      }),
    [gameState.activeSceneTiles],
  );

  const shouldScaleNonForensicLayout =
    !isForensic && viewportWidth > 0 && viewportWidth <= 1200;
  const isCompactViewport = viewportWidth > 0 && viewportWidth <= 1200;
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

  const forensicHintSizing = useMemo(() => {
    const hintCount = Math.max(1, forensicHints.length);
    const panelHeight =
      forensicHintsAsideHeight || (isCompactViewport ? 460 : 560);
    const gap = Math.max(4, Math.min(10, Math.floor(panelHeight / 105)));

    const availableHeight = Math.max(
      240,
      panelHeight - (isCompactViewport ? 44 : 52) - gap * (hintCount - 1),
    );

    const rowHeight = Math.max(
      isCompactViewport ? 48 : 58,
      Math.floor(availableHeight / hintCount),
    );
    const titleSize = Math.max(9, Math.min(12, Math.round(rowHeight * 0.17)));
    const pickedSize = Math.max(12, Math.min(19, Math.round(rowHeight * 0.34)));
    const cardPaddingY = Math.max(
      5,
      Math.min(10, Math.round(rowHeight * 0.14)),
    );
    const cardPaddingX = Math.max(8, Math.min(14, Math.round(rowHeight * 0.2)));

    return {
      gap,
      titleSize,
      pickedSize,
      cardPaddingY,
      cardPaddingX,
    };
  }, [forensicHints.length, forensicHintsAsideHeight, isCompactViewport]);

  const requestExitConfirmation = () => {
    setShowExitConfirm(true);
  };

  const confirmExitToLobby = () => {
    setShowExitConfirm(false);
    onExit();
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
                  onClick={() => setShowChat((prev) => !prev)}
                  className={`deception-btn-outline inline-flex items-center gap-1.5 font-black uppercase tracking-[0.14em] ${isCompactViewport
                      ? "px-2 py-1.5 text-[10px]"
                      : "px-3 py-2 text-[11px]"
                    }`}
                  title="Bật/tắt khung chat"
                >
                  <MessageSquareText
                    className={isCompactViewport ? "h-3 w-3" : "h-3.5 w-3.5"}
                  />
                  {showChat ? "Ẩn chat" : "Hiện chat"}
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
                  onClick={requestExitConfirmation}
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setForensicTab("hints")}
                    className={`rounded-md px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] transition ${forensicTab === "hints"
                        ? "bg-rose-600 text-white"
                        : "border border-(--deception-border) text-(--on-surface-variant) hover:border-rose-400 hover:text-rose-200"
                      }`}
                  >
                    6 Viên Đạn
                  </button>

                  <button
                    onClick={() => setForensicTab("players")}
                    className={`rounded-md px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] transition ${forensicTab === "players"
                        ? "bg-cyan-600 text-white"
                        : "border border-(--deception-border) text-(--on-surface-variant) hover:border-cyan-400 hover:text-cyan-200"
                      }`}
                  >
                    Người chơi
                  </button>
                </div>

                <div className="order-3 w-full rounded-md border-l-4 border-rose-500/60 bg-[rgba(255,255,255,0.04)] px-3 py-2 md:order-0 md:w-auto">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Solution
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2.5 text-sm font-bold uppercase tracking-[0.08em] text-slate-100">
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
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
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

                  {gameState.state === "DISCUSSION" &&
                    !gameState.timerEndAt && (
                      <button
                        onClick={() => socket?.emit("startDiscussion")}
                        className="deception-btn-cyan px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em]"
                      >
                        Bắt đầu
                      </button>
                    )}

                  <button
                    onClick={() => setForensicTab("players")}
                    className="deception-icon-btn"
                    title="Xem thẻ người chơi"
                  >
                    <History className="h-4 w-4" />
                  </button>

                  <button
                    onClick={requestExitConfirmation}
                    className="deception-icon-btn"
                    title="Thoát về sảnh"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
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
                  variant="template4"
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
                    const roleTone = roleToneByRole(player.role);

                    return (
                      <button
                        key={player.userId}
                        onClick={() => setFocusedPlayerUserId(player.userId)}
                        className={`rounded-lg border p-2 text-left transition ${active ? roleTone.activeCardClass : roleTone.idleCardClass}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-black uppercase tracking-[0.08em] ${roleTone.avatarClass}`}>
                            {initial}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold uppercase tracking-[0.08em] text-(--on-surface)">
                              {displayName}
                            </p>

                            <div className="mt-1 flex flex-wrap items-center gap-1">
                              <span className={`inline-flex max-w-full items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${roleTone.chipClass}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${roleTone.dotClass}`} />
                                <span className="truncate">{roleLabel(player)}</span>
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
                  {focusedPlayer?.role === "ForensicScientist" ? (
                    <div className="flex h-full items-center justify-center rounded-lg border border-(--deception-border) bg-[rgba(255,255,255,0.03)] p-4 text-center">
                      <p
                        className="text-base italic leading-tight text-(--on-surface-variant)"
                        style={{
                          fontFamily:
                            "var(--font-cormorant), var(--font-headline), serif",
                        }}
                      >
                        Đây là pháp y nên không có 8 thẻ (4 hung khí + 4 manh
                        mối).
                      </p>
                    </div>
                  ) : (
                    <div className="grid min-h-0 grid-cols-2 gap-3 md:grid-cols-4">
                      {focusedPlayer?.meansCards.map((card, index) => (
                        <div
                          className="h-48 md:h-56"
                          key={`forensic-players-means-${card.id}`}
                        >
                          <EvidencePreviewCard
                            card={card}
                            tone="means"
                            highlighted={false}
                            rotationClass={cardTiltClass(index)}
                            evidenceNum={String(card.id).padStart(2, "0")}
                          />
                        </div>
                      ))}

                      {focusedPlayer?.clueCards.map((card, index) => (
                        <div
                          className="h-48 md:h-56"
                          key={`forensic-players-clue-${card.id}`}
                        >
                          <EvidencePreviewCard
                            card={card}
                            tone="clue"
                            highlighted={false}
                            rotationClass={cardTiltClass(index + 4)}
                            evidenceNum={String(card.id).padStart(2, "0")}
                          />
                        </div>
                      ))}
                    </div>
                  )}
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
                  <div className="grid grid-cols-3 gap-2 md:grid-cols-4 xl:grid-cols-6">
                    {activePlayers.map((player) => {
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
                      const roleTone = roleToneByRole(player.role);

                      return (
                        <button
                          key={player.userId}
                          onClick={() => setFocusedPlayerUserId(player.userId)}
                          className={`rounded-lg border p-2 text-left transition ${active ? roleTone.activeCardClass : roleTone.idleCardClass}`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-black uppercase tracking-[0.08em] ${roleTone.avatarClass}`}>
                              {initial}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold uppercase tracking-[0.08em] text-(--on-surface)">
                                {displayName}
                              </p>

                              <div className="mt-1 flex flex-wrap items-center gap-1">
                                <span className={`inline-flex max-w-full items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${roleTone.chipClass}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${roleTone.dotClass}`} />
                                  <span className="truncate">{roleLabel(player)}</span>
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
                </section>

                <section className="grid min-h-0 flex-1 gap-4 grid-cols-[minmax(0,1fr)_21rem]">
                  <article className="deception-card min-h-0 overflow-visible rounded-xl p-3">
                    {focusedPlayer?.role === "ForensicScientist" ? (
                      <div className="flex h-full items-center justify-center rounded-lg border border-(--deception-border) bg-[rgba(255,255,255,0.03)] p-4 text-center">
                        <p
                          className="text-base italic leading-tight text-(--on-surface-variant)"
                          style={{
                            fontFamily:
                              "var(--font-cormorant), var(--font-headline), serif",
                          }}
                        >
                          Đây là pháp y nên không có 8 thẻ (4 hung khí + 4 manh
                          mối).
                        </p>
                      </div>
                    ) : (
                      <div className="grid h-full min-h-0 grid-cols-4 auto-rows-fr gap-3 overflow-visible">
                        {focusedPlayer?.meansCards.map((card, index) => {
                          const isMurderMeans =
                            focusedIsKnownMurderer &&
                            Boolean(revealedMurderSelection) &&
                            card.id === revealedMurderSelection?.meansId;

                          return (
                            <EvidencePreviewCard
                              key={`means-${card.id}`}
                              card={card}
                              tone="means"
                              highlighted={isMurderMeans}
                              rotationClass={cardTiltClass(index)}
                              evidenceNum={String(card.id).padStart(2, "0")}
                            />
                          );
                        })}

                        {focusedPlayer?.clueCards.map((card, index) => {
                          const isMurderClue =
                            focusedIsKnownMurderer &&
                            Boolean(revealedMurderSelection) &&
                            card.id === revealedMurderSelection?.clueId;

                          return (
                            <EvidencePreviewCard
                              key={`clue-${card.id}`}
                              card={card}
                              tone="clue"
                              highlighted={isMurderClue}
                              rotationClass={cardTiltClass(index + 4)}
                              evidenceNum={String(card.id).padStart(2, "0")}
                            />
                          );
                        })}
                      </div>
                    )}
                  </article>

                  <aside
                    ref={forensicHintsAsideRef}
                    className={`deception-card min-h-0 overflow-hidden rounded-xl ${isCompactViewport ? "p-2.5" : "p-3.5"} flex flex-col`}
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-(--deception-red-soft)">
                      6 gợi ý của pháp y
                    </p>

                    <div
                      className="mt-2.5 grid min-h-0 flex-1 grid-cols-1"
                      style={{
                        gap: `${forensicHintSizing.gap}px`,
                        gridTemplateRows: `repeat(${Math.max(1, forensicHints.length)}, minmax(0, 1fr))`,
                      }}
                    >
                      {forensicHints.map((hint) => (
                        <div
                          key={hint.id}
                          className={`min-h-0 overflow-hidden rounded-md border ${hint.cardClass}`}
                          style={{
                            padding: `${forensicHintSizing.cardPaddingY}px ${forensicHintSizing.cardPaddingX}px`,
                          }}
                        >
                          <p
                            className={`truncate font-bold uppercase tracking-[0.12em] ${hint.titleClass}`}
                            style={{
                              fontSize: `${forensicHintSizing.titleSize}px`,
                            }}
                            title={hint.title}
                          >
                            {hint.title}
                          </p>
                          <p
                            className="mt-0.5 line-clamp-2 font-semibold leading-tight text-(--on-surface)"
                            style={{
                              fontSize: `${forensicHintSizing.pickedSize}px`,
                            }}
                            title={hint.picked}
                          >
                            {hint.picked}
                          </p>
                        </div>
                      ))}
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

      {showChat && (
        <aside className="deception-chat-panel fixed inset-x-3 bottom-3 top-22 z-50 flex flex-col rounded-xl border border-(--deception-border) bg-[rgba(10,12,18,0.96)] p-3 backdrop-blur-md md:inset-y-20 md:left-auto md:right-4 md:w-88">
          <div className="mb-3 flex items-center justify-between gap-2 border-b border-(--deception-border) pb-2">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-(--deception-cyan)">
              Investigation Log
            </p>
            <button
              onClick={() => setShowChat(false)}
              className="deception-icon-btn"
              title="Đóng chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {gameState.messages.length === 0 ? (
              <p className="text-sm text-(--on-surface-variant)">
                Chưa có tin nhắn.
              </p>
            ) : (
              gameState.messages.slice(-30).map((message, index) => (
                <div
                  key={`${message.timestamp}-${index}`}
                  className="rounded-md border border-(--deception-border) p-2"
                >
                  <p className="text-[10px] uppercase tracking-[0.14em] text-(--deception-red-soft)">
                    {message.senderName}
                  </p>
                  <p className="mt-1 text-sm text-(--on-surface)">
                    {message.text}
                  </p>
                </div>
              ))
            )}
          </div>

          {canChat ? (
            <form
              className="mt-3 flex items-center gap-2"
              onSubmit={(event: FormEvent) => {
                event.preventDefault();
                const text = chatText.trim();
                if (!text) return;
                socket?.emit("chatMessage", text);
                setChatText("");
              }}
            >
              <input
                value={chatText}
                onChange={(event) =>
                  setChatText(event.target.value.slice(0, 500))
                }
                className="deception-input min-w-0 flex-1"
                placeholder="Nhập tin nhắn..."
              />
              <button
                type="submit"
                className="deception-icon-btn h-10 w-10"
                title="Gửi"
              >
                <SendHorizontal className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <div className="mt-3 rounded-md border border-(--deception-border) bg-[rgba(255,255,255,0.03)] p-2.5 text-[11px] uppercase tracking-[0.14em] text-(--on-surface-variant)">
              Pháp y không được chat trong ván chơi.
            </div>
          )}
        </aside>
      )}

      {me && (
        <DeceptionVoiceChatPanel
          roomId={gameState.id}
          userId={me.userId}
          playerName={me.name}
          players={connectedVoicePlayers}
          micAllowed={!isForensic}
          hideLauncher={isForensic && isCompactViewport}
          socket={socket}
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
        <div className="fixed inset-0 z-75 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <section className="deception-card w-full max-w-md rounded-2xl p-5 sm:p-6">
            <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-full bg-[rgba(255,45,85,0.16)] text-(--deception-red)">
              <ShieldAlert className="h-7 w-7" />
            </div>

            <h2 className="mt-4 text-center text-2xl font-black uppercase tracking-[0.14em] text-(--deception-red)">
              Phá án sai
            </h2>

            <p className="mt-3 text-center text-sm text-(--on-surface-variant)">
              <span className="font-bold text-(--on-surface)">
                {solvingResolutionNotice?.investigatorName || "Một điều tra viên"}
              </span>{" "}
              đã tố cáo sai
              {solvingResolutionNotice?.accusedName
                ? ` ${solvingResolutionNotice.accusedName}`
                : ""}
              .
            </p>

            <p className="mt-2 text-center text-[11px] uppercase tracking-[0.14em] text-(--on-surface-variant)">
              Huy hiệu của người tố cáo đã bị thu hồi.
            </p>
          </section>
        </div>
      )}

      {showExitConfirm && (
        <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/72 p-4 backdrop-blur-sm">
          <section className="deception-card w-full max-w-md rounded-2xl p-5 sm:p-6">
            <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-full bg-[rgba(255,45,85,0.15)] text-(--deception-red)">
              <ArrowLeft className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-center text-2xl font-black uppercase tracking-[0.14em] text-(--on-surface)">
              Quay về sảnh?
            </h2>

            <p className="mt-3 text-center text-sm text-(--on-surface-variant)">
              Bạn có chắc muốn rời phòng hiện tại và quay về sảnh không?
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="deception-btn-outline px-4 py-3 text-xs font-black uppercase tracking-[0.16em]"
              >
                Ở lại
              </button>

              <button
                onClick={confirmExitToLobby}
                className="deception-btn-cyan px-4 py-3 text-xs font-black uppercase tracking-[0.16em]"
              >
                Quay về
              </button>
            </div>
          </section>
        </div>
      )}

      {attempt && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/72 p-4 backdrop-blur-sm">
          <section className="deception-card relative w-full max-w-xl overflow-visible rounded-2xl p-5 sm:p-6">
            <div className="pointer-events-none absolute -left-4 -top-3 z-20 h-7 w-28 -rotate-12 rounded-xs border border-[rgba(255,210,198,0.42)] bg-[linear-gradient(180deg,rgba(255,186,170,0.32),rgba(255,160,140,0.2))] shadow-[0_6px_14px_rgba(0,0,0,0.28)]" />

            <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-full bg-[rgba(255,45,85,0.15)] text-(--deception-red)">
              <ShieldAlert className="h-7 w-7" />
            </div>

            <h2 className="mt-4 text-center text-2xl font-black uppercase tracking-[0.14em] text-(--on-surface)">
              Solving Attempt
            </h2>

            <div className="mt-4 rounded-lg border border-(--deception-border) bg-[rgba(255,255,255,0.03)] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-(--deception-red-soft)">
                {attempt.investigatorName} đang tố cáo{" "}
                {attemptAccused?.name || attempt.accusedName}
              </p>
              <p className="mt-2 text-sm text-(--on-surface)">
                Hung khí:{" "}
                <span className="font-bold">
                  {attemptMeans?.vietnamese || attempt.selectedMeansId}
                </span>
              </p>
              <p className="mt-1 text-sm text-(--on-surface)">
                Manh mối:{" "}
                <span className="font-bold">
                  {attemptClue?.vietnamese || attempt.selectedClueId}
                </span>
              </p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-(--on-surface-variant)">
                Vai trò bị tố: {roleLabel(attemptAccused)}
              </p>
            </div>

            {isForensic ? (
              <div className="mt-5 space-y-3">
                <p
                  className={`text-center text-xs font-bold uppercase tracking-[0.14em] ${
                    autoSolvingResult === "correct"
                      ? "text-(--deception-cyan)"
                      : "text-(--deception-red-soft)"
                  }`}
                >
                  {autoSolvingResult === null
                    ? "Kết quả hệ thống: Đang đối chiếu"
                    : autoSolvingResult === "correct"
                    ? "Kết quả hệ thống: Đúng"
                    : "Kết quả hệ thống: Sai"}
                </p>

                <button
                  onClick={() => socket?.emit("resolveSolving")}
                  className="deception-btn-cyan w-full px-4 py-3 text-xs font-black uppercase tracking-[0.16em]"
                >
                  Xác nhận kết quả
                </button>
              </div>
            ) : (
              <p className="mt-5 text-center text-xs uppercase tracking-[0.16em] text-(--on-surface-variant)">
                Chờ Pháp y xác nhận kết quả hệ thống...
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
