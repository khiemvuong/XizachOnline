"use client";

import React, { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { Socket } from "socket.io-client";
import type {
  ClueCard,
  DeceptionPlayer,
  DeceptionRoom,
  MeansCard,
} from "@/server/game/DeceptionTypes";
import SolvingAttemptModal from "@/components/deception/SolvingAttemptModal";
import DiscussionHeader from "./discussion/DiscussionHeader";
import ForensicSection from "./discussion/ForensicSection";
import NonForensicSection from "./discussion/NonForensicSection";
import SharedChatDropdownWrapper from "./discussion/SharedChatDropdownWrapper";
import IncorrectSolvingPopup from "./discussion/IncorrectSolvingPopup";
import SolvingHistoryModal from "./discussion/SolvingHistoryModal";
import ZoomedCardModal from "./discussion/ZoomedCardModal";
import SolveConfirmModal from "./discussion/SolveConfirmModal";
import ForensicClueBoardModal from "./discussion/ForensicClueBoardModal";

import { type ChatTheme } from "@/components/shared/ChatDropdown";
import { useSceneScale } from "@/hooks/useSceneScale";
import { usePreloadCardImages } from "@/hooks/usePreloadCardImages";
import {
  getResolvedClueImageUrl,
  getResolvedMeansImageUrl,
  getClueImageUrl,
  getMeansImageUrl,
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

export type RoleTone = {
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



export type HintTileView = {
  id: string;
  side: string;
  title: string;
  picked: string;
  accentColor: string;
  cardSurface: string;
  titleColor: string;
  pickedColor: string;
  dossierInk: string;
};

export type PlayerEvidenceView = {
  player: DeceptionPlayer;
  cardCount: number;
  means: { card: MeansCard; imageUrl: string; rotationClass: string }[];
  clues: { card: ClueCard; imageUrl: string; rotationClass: string }[];
};

export type SelectedEvidenceEntry<TCard extends MeansCard | ClueCard> = {
  id: number;
  card: TCard;
  imageUrl: string;
};

export type PendingSolveSelection = {
  accusedUserId: string;
  accusedName: string;
  means: SelectedEvidenceEntry<MeansCard> | null;
  clue: SelectedEvidenceEntry<ClueCard> | null;
};

function getEvidenceTitle(card: MeansCard | ClueCard | null | undefined) {
  if (!card) return "Chưa chọn";

  const english = card.english?.trim();
  const vietnamese = card.vietnamese?.trim();

  if (!english) return vietnamese || "Unknown";
  if (!vietnamese || vietnamese.toLowerCase() === english.toLowerCase()) {
    return english;
  }

  return `${english} (${vietnamese})`;
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
  voiceSlot,
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
  voiceSlot?: React.ReactNode;
}) {
  const [showChat, setShowChat] = useState(false);
  const [chatText, setChatText] = useState("");
  const [focusedPlayerUserId, setFocusedPlayerUserId] = useState("");
  const [showForensicClueBoard, setShowForensicClueBoard] = useState(false);
  const [showSolvingHistory, setShowSolvingHistory] = useState(false);
  const [isSolveSelectionDetailsOpen, setIsSolveSelectionDetailsOpen] =
    useState(false);
  const [pendingSolveSelection, setPendingSolveSelection] =
    useState<PendingSolveSelection | null>(null);
  const [showSolveConfirmModal, setShowSolveConfirmModal] = useState(false);
  const [zoomedCard, setZoomedCard] = useState<{
    card: MeansCard | ClueCard;
    tone: "means" | "clue";
    imageUrl: string;
  } | null>(null);

  const actualSolutionMeans = useMemo(() => {
    if (!gameState.murderSelection) return undefined;
    for (const p of gameState.players) {
      const card = p.meansCards.find(
        (c) => c.id === gameState.murderSelection!.meansId,
      );
      if (card) return card;
    }
    return undefined;
  }, [gameState.murderSelection, gameState.players]);

  const actualSolutionClue = useMemo(() => {
    if (!gameState.murderSelection) return undefined;
    for (const p of gameState.players) {
      const card = p.clueCards.find(
        (c) => c.id === gameState.murderSelection!.clueId,
      );
      if (card) return card;
    }
    return undefined;
  }, [gameState.murderSelection, gameState.players]);
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
  const canChat = true;
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
    () => activePlayers.filter((player) => player.role !== "ForensicScientist"),
    [activePlayers],
  );

  const solveTargetPlayers = useMemo(
    () =>
      isForensic
        ? selectableEvidencePlayers
        : selectableEvidencePlayers.filter(
            (player) => player.userId !== me?.userId,
          ),
    [isForensic, me?.userId, selectableEvidencePlayers],
  );

  const visibleChatMessages = useMemo(
    () => gameState.messages.filter((message) => message.senderId !== "system"),
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
  const hideRolesUi = roleMaskEnabled;

  const selectedMeansForensic =
    !hideRolesUi && gameState.murderSelection
      ? allMeans.get(gameState.murderSelection.meansId)
      : undefined;
  const selectedClueForensic =
    !hideRolesUi && gameState.murderSelection
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
        : selectableEvidencePlayers.find(
            (player) => player.userId === me?.userId,
          )?.userId) ||
      selectableEvidencePlayers[0]?.userId ||
      ""
    );
  }, [focusedPlayerUserId, isForensic, me?.userId, selectableEvidencePlayers]);

  const effectivePendingSolveSelection = useMemo(() => {
    if (!canOpenSolve || attempt || !pendingSolveSelection) return null;

    const accused = solveTargetPlayers.find(
      (player) => player.userId === pendingSolveSelection.accusedUserId,
    );

    if (!accused) return null;

    if (pendingSolveSelection.accusedName === accused.name) {
      return pendingSolveSelection;
    }

    return {
      ...pendingSolveSelection,
      accusedName: accused.name,
    };
  }, [canOpenSolve, attempt, pendingSolveSelection, solveTargetPlayers]);

  const pendingSolveAccused = useMemo(
    () =>
      effectivePendingSolveSelection
        ? solveTargetPlayers.find(
            (player) =>
              player.userId === effectivePendingSolveSelection.accusedUserId,
          )
        : undefined,
    [effectivePendingSolveSelection, solveTargetPlayers],
  );

  const isPendingSolveComplete = Boolean(
    effectivePendingSolveSelection?.means &&
    effectivePendingSolveSelection?.clue,
  );
  const selectedEvidenceCount =
    Number(Boolean(effectivePendingSolveSelection?.means)) +
    Number(Boolean(effectivePendingSolveSelection?.clue));

  const solveButtonTitle = !canOpenSolve
    ? "Bạn chưa thể tố cáo ở thời điểm này"
    : !effectivePendingSolveSelection
      ? "Chọn 1 hung khí và 1 manh mối trên cùng người chơi"
      : isPendingSolveComplete
        ? "Xác nhận thông tin tố cáo"
        : "Cần chọn đủ hung khí và manh mối trên cùng người chơi";

  const withAccusedSelectionBase = (
    accusedPlayer: DeceptionPlayer,
    updater: (base: PendingSolveSelection) => PendingSolveSelection,
  ) => {
    if (!canOpenSolve) return;

    setFocusedPlayerUserId(accusedPlayer.userId);
    setPendingSolveSelection((current) => {
      const base: PendingSolveSelection =
        current && current.accusedUserId === accusedPlayer.userId
          ? { ...current, accusedName: accusedPlayer.name }
          : {
              accusedUserId: accusedPlayer.userId,
              accusedName: accusedPlayer.name,
              means: null,
              clue: null,
            };

      return updater(base);
    });
  };

  const handleSelectMeansForSolve = (
    accusedPlayer: DeceptionPlayer,
    card: MeansCard,
    imageUrl: string,
  ) => {
    withAccusedSelectionBase(accusedPlayer, (base) => ({
      ...base,
      means: {
        id: card.id,
        card,
        imageUrl,
      },
    }));
  };

  const handleSelectClueForSolve = (
    accusedPlayer: DeceptionPlayer,
    card: ClueCard,
    imageUrl: string,
  ) => {
    withAccusedSelectionBase(accusedPlayer, (base) => ({
      ...base,
      clue: {
        id: card.id,
        card,
        imageUrl,
      },
    }));
  };

  const clearPendingSolveSelection = () => {
    setPendingSolveSelection(null);
    setShowSolveConfirmModal(false);
    setIsSolveSelectionDetailsOpen(false);
  };

  const submitDirectSolve = () => {
    if (
      !effectivePendingSolveSelection?.means ||
      !effectivePendingSolveSelection?.clue
    )
      return;

    socket?.emit("submitSolving", {
      accusedUserId: effectivePendingSolveSelection.accusedUserId,
      meansId: effectivePendingSolveSelection.means.id,
      clueId: effectivePendingSolveSelection.clue.id,
    });

    setShowSolveConfirmModal(false);
    setPendingSolveSelection(null);
    setIsSolveSelectionDetailsOpen(false);
  };

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
      const isPlayerWarmed = Boolean(playerReadyMap[player.userId]);
      const resolveMeansImage = isPlayerWarmed
        ? getResolvedMeansImageUrl
        : getMeansImageUrl;
      const resolveClueImage = isPlayerWarmed
        ? getResolvedClueImageUrl
        : getClueImageUrl;

      const means = player.meansCards.map((card, index) => ({
        card,
        imageUrl: resolveMeansImage(card.id),
        rotationClass: cardTiltClass(index),
      }));

      const clues = player.clueCards.map((card, index) => ({
        card,
        imageUrl: resolveClueImage(card.id),
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
  }, [activePlayers, playerReadyMap]);
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
          side: index % 2 === 0 ? "right" : "left",
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
  const shouldShowSolveSelectionDetails = Boolean(isSolveSelectionDetailsOpen);
  const selectedMeansTitle = getEvidenceTitle(
    effectivePendingSolveSelection?.means?.card,
  );
  const selectedClueTitle = getEvidenceTitle(
    effectivePendingSolveSelection?.clue?.card,
  );
  const canToggleDiscussionAudio = true;
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
      {!isForensic && (
        <DiscussionHeader
          gameState={gameState}
          bgmMuted={bgmMuted}
          onToggleBgm={onToggleBgm}
          onExit={onExit}
          hideRolesUi={hideRolesUi}
          onToggleRoleMask={onToggleRoleMask}
          canToggleDiscussionAudio={canToggleDiscussionAudio}
          isCompactViewport={isCompactViewport}
          openSolveConfirmModal={() => setShowSolveConfirmModal(true)}
          canOpenSolve={canOpenSolve}
          isPendingSolveComplete={isPendingSolveComplete}
          solveButtonTitle={solveButtonTitle}
          isSolveSelectionDetailsOpen={isSolveSelectionDetailsOpen}
          setIsSolveSelectionDetailsOpen={setIsSolveSelectionDetailsOpen}
          selectedEvidenceCount={selectedEvidenceCount}
          setShowForensicClueBoard={setShowForensicClueBoard}
          setShowSolvingHistory={setShowSolvingHistory}
          shouldShowSolveSelectionDetails={shouldShowSolveSelectionDetails}
          effectivePendingSolveSelection={effectivePendingSolveSelection}
          pendingSolveAccused={pendingSolveAccused}
          clearPendingSolveSelection={clearPendingSolveSelection}
          selectedMeansTitle={selectedMeansTitle}
          selectedClueTitle={selectedClueTitle}
          voiceSlot={voiceSlot}
        />
      )}

      <div className="relative flex min-h-0 flex-1">
        {isForensic ? (
          <ForensicSection
            gameState={gameState}
            me={me}
            socket={socket}
            playerPings={playerPings}
            bgmMuted={bgmMuted}
            onToggleBgm={onToggleBgm}
            onExit={onExit}
            hideRolesUi={hideRolesUi}
            onToggleRoleMask={onToggleRoleMask}
            canToggleDiscussionAudio={canToggleDiscussionAudio}
            forensicTab={forensicTab}
            setForensicTab={setForensicTab}
            setShowSolvingHistory={setShowSolvingHistory}
            selectedMeansForensic={selectedMeansForensic}
            selectedClueForensic={selectedClueForensic}
            forensicHintTiles={forensicHintTiles}
            activePlayers={activePlayers}
            accusationBadgeTone={accusationBadgeTone}
            resolvedFocusedPlayerUserId={resolvedFocusedPlayerUserId}
            setFocusedPlayerUserId={setFocusedPlayerUserId}
            clampPlayerName={clampPlayerName}
            isCompactViewport={isCompactViewport}
            roleToneByRole={roleToneByRole}
            playerEvidenceViews={playerEvidenceViews}
            playerReadyMap={playerReadyMap}
            warmProgressLabel={warmProgressLabel}
            setZoomedCard={setZoomedCard}
          />
        ) : (
          <NonForensicSection
            shouldScaleNonForensicLayout={shouldScaleNonForensicLayout}
            nonForensicViewportRef={nonForensicViewportRef}
            nonForensicSceneWidth={nonForensicSceneWidth}
            nonForensicSceneHeight={nonForensicSceneHeight}
            nonForensicScale={nonForensicScale}
            isDesktopWideViewport={isDesktopWideViewport}
            activePlayers={activePlayers}
            hideRolesUi={hideRolesUi}
            accusationBadgeTone={accusationBadgeTone}
            resolvedFocusedPlayerUserId={resolvedFocusedPlayerUserId}
            me={me}
            clampPlayerName={clampPlayerName}
            isCompactViewport={isCompactViewport}
            effectivePendingSolveSelection={effectivePendingSolveSelection}
            roleToneByRole={roleToneByRole}
            playerPings={playerPings}
            roleLabel={roleLabel}
            setFocusedPlayerUserId={setFocusedPlayerUserId}
            selectableEvidencePlayers={selectableEvidencePlayers}
            playerEvidenceViews={playerEvidenceViews}
            playerReadyMap={playerReadyMap}
            playerCardsReady={playerCardsReady}
            warmProgressLabel={warmProgressLabel}
            isForensic={isForensic}
            knownMurderer={knownMurderer}
            revealedMurderSelection={revealedMurderSelection}
            handleSelectMeansForSolve={handleSelectMeansForSolve}
            setZoomedCard={setZoomedCard}
            handleSelectClueForSolve={handleSelectClueForSolve}
            forensicHints={forensicHints}
          />
        )}

        <SharedChatDropdownWrapper
          showChat={showChat}
          setShowChat={setShowChat}
          visibleChatMessages={visibleChatMessages}
          chatText={chatText}
          setChatText={setChatText}
          handleSendChat={handleSendChat}
          DECEPTION_CHAT_THEME={DECEPTION_CHAT_THEME}
          me={me}
          canChat={canChat}
        />
      </div>

      {showSolveConfirmModal && pendingSolveAccused && effectivePendingSolveSelection?.means?.card && effectivePendingSolveSelection?.clue?.card && (
        <SolveConfirmModal
          pendingSolveAccused={pendingSolveAccused}
          effectivePendingSolveSelection={effectivePendingSolveSelection}
          getEvidenceTitle={getEvidenceTitle}
          onConfirm={submitDirectSolve}
          onCancel={() => setShowSolveConfirmModal(false)}
        />
      )}

      {zoomedCard && (
        <ZoomedCardModal
          zoomedCard={zoomedCard}
          onClose={() => setZoomedCard(null)}
        />
      )}

      {showForensicClueBoard && !isForensic && (
        <ForensicClueBoardModal
          forensicHintTiles={forensicHintTiles}
          onClose={() => setShowForensicClueBoard(false)}
        />
      )}

      {solvingResolutionNotice && (
        <IncorrectSolvingPopup solvingResolutionNotice={solvingResolutionNotice} />
      )}

      {attempt && (
        <SolvingAttemptModal
          attempt={attempt}
          attemptAccused={attemptAccused}
          attemptMeans={attemptMeans}
          attemptClue={attemptClue}
          actualSolutionMeans={actualSolutionMeans}
          actualSolutionClue={actualSolutionClue}
          isForensic={isForensic}
          autoSolvingResult={autoSolvingResult}
          onConfirm={() => socket?.emit("resolveSolving")}
        />
      )}

      {showSolvingHistory && (
        <SolvingHistoryModal
          solvingAttempts={gameState.solvingAttempts}
          allMeans={allMeans}
          allClues={allClues}
          getEvidenceTitle={getEvidenceTitle}
          onClose={() => setShowSolvingHistory(false)}
        />
      )}
    </div>
  );
}
