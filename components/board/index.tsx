"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
    Crown,
    Eye,
    EyeOff,
    Loader2,
    Mic,
    PlayCircle,
    RotateCw,
    UserRound,
    type LucideIcon,
} from "lucide-react";
import { getSocket } from "../../lib/socket";
import Card from "../Card";
import VoiceChat from "../VoiceChat";
import ChatDropdown from "./ChatDropdown";
import DealIntroOverlay from "./DealIntroOverlay";
import HeaderBar from "./HeaderBar";
import SettingsModal from "./SettingsModal";
import SystemNotice from "./SystemNotice";
import {
    AVATAR_ICON_POOL,
    AVATAR_THEME_POOL,
    formatPlayerStatus,
    getDesktopSeatPosition,
    getHandStats,
    getStatusFromViewerPerspective,
    hashString,
    orderPlayersForDesktopSeats,
    type GameState,
    type Player,
    type Room,
} from "./types";

export default function GameBoard({ roomId }: { roomId: string }) {
    const router = useRouter();
    const socket = getSocket();

    const [room, setRoom] = useState<Room | null>(null);
    const [joined, setJoined] = useState(false);
    const [playerName, setPlayerName] = useState("");
    const [myPeerId, setMyPeerId] = useState("");
    const [userId] = useState(() => {
        if (typeof window === "undefined") return "";
        let storedUserId = localStorage.getItem("xz_userId");
        if (!storedUserId) {
            storedUserId = Math.random().toString(36).substring(2, 10);
            localStorage.setItem("xz_userId", storedUserId);
        }
        return storedUserId;
    });
    const [isMicOn, setIsMicOn] = useState(false);
    const [noiseSuppressionEnabled, setNoiseSuppressionEnabled] = useState(true);
    const [sfxEnabled, setSfxEnabled] = useState(true);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [isDealIntroVisible, setIsDealIntroVisible] = useState(false);
    const [dealStep, setDealStep] = useState(0);
    const [dealingTargetUserId, setDealingTargetUserId] = useState<string | null>(null);
    const [roundAvatarSeed, setRoundAvatarSeed] = useState(0);
    const [systemNotice, setSystemNotice] = useState<string | null>(null);
    const [showChat, setShowChat] = useState(false);
    const [chatText, setChatText] = useState("");
    const [activeBubbles, setActiveBubbles] = useState<Record<string, string>>(
        {},
    );
    const [isMobileLayout, setIsMobileLayout] = useState(false);
    const [isPortrait, setIsPortrait] = useState(false);
    const [showPeekNotifications, setShowPeekNotifications] = useState(false);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const lastMessageCountRef = useRef(0);
    const hasHydratedMessageSnapshotRef = useRef(false);
    const bubbleTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>(
        {},
    );
    const sfxContextRef = useRef<AudioContext | null>(null);
    const lastRoomStateRef = useRef<GameState | null>(null);
    const prevCardCountRef = useRef<Record<string, number>>({});
    const dealTimelineRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const introHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const introStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const systemNoticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const ensureSfxContext = useCallback(() => {
        if (typeof window === "undefined") return null;
        if (!sfxContextRef.current) {
            sfxContextRef.current = new window.AudioContext();
        }
        if (sfxContextRef.current.state === "suspended") {
            void sfxContextRef.current.resume();
        }
        return sfxContextRef.current;
    }, []);

    const playTone = useCallback((frequency: number, duration: number, type: OscillatorType, volume: number) => {
        if (!sfxEnabled) return;
        const ctx = ensureSfxContext();
        if (!ctx) return;

        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = type;
        oscillator.frequency.value = frequency;

        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + duration + 0.02);
    }, [ensureSfxContext, sfxEnabled]);

    const playDrawSfx = useCallback(() => {
        playTone(610, 0.08, "square", 0.05);
    }, [playTone]);

    const playDealIntroSfx = useCallback(() => {
        playTone(260, 0.12, "triangle", 0.045);
        setTimeout(() => playTone(390, 0.1, "triangle", 0.04), 80);
    }, [playTone]);

    const playRoundStartSfx = useCallback(() => {
        playTone(420, 0.12, "sine", 0.045);
        setTimeout(() => playTone(520, 0.12, "sine", 0.04), 90);
    }, [playTone]);

    const clearDealIntroRuntime = useCallback(() => {
        if (dealTimelineRef.current) {
            clearInterval(dealTimelineRef.current);
            dealTimelineRef.current = null;
        }
        if (introStartTimeoutRef.current) {
            clearTimeout(introStartTimeoutRef.current);
            introStartTimeoutRef.current = null;
        }
        if (introHideTimeoutRef.current) {
            clearTimeout(introHideTimeoutRef.current);
            introHideTimeoutRef.current = null;
        }
    }, []);

    useEffect(() => {
        const updateViewportState = () => {
            setIsMobileLayout(window.matchMedia("(max-width: 1024px)").matches);
            setIsPortrait(window.matchMedia("(orientation: portrait)").matches);
        };

        updateViewportState();
        window.addEventListener("resize", updateViewportState);
        window.addEventListener("orientationchange", updateViewportState);

        return () => {
            window.removeEventListener("resize", updateViewportState);
            window.removeEventListener("orientationchange", updateViewportState);
        };
    }, []);

    useEffect(() => {
        socket.on("gameState", (data: Room) => setRoom(data));
        return () => {
            socket.off("gameState");
        };
    }, [socket]);

    useEffect(() => {
        return () => {
            clearDealIntroRuntime();
            if (sfxContextRef.current) {
                void sfxContextRef.current.close();
                sfxContextRef.current = null;
            }
            if (systemNoticeTimeoutRef.current) {
                clearTimeout(systemNoticeTimeoutRef.current);
                systemNoticeTimeoutRef.current = null;
            }
        };
    }, [clearDealIntroRuntime]);

    useEffect(() => {
        if (!room) return;

        const previousState = lastRoomStateRef.current;
        const stateChanged = previousState !== room.state;

        if (stateChanged && room.state === "DEALING") {
            const activeDealOrder = room.players
                .filter((player) => player.status === "playing")
                .map((player) => player.userId);

            if (activeDealOrder.length > 0) {
                clearDealIntroRuntime();
                introStartTimeoutRef.current = setTimeout(() => {
                    setRoundAvatarSeed((prev) => prev + 1);
                    setIsDealIntroVisible(true);
                    setDealStep(0);
                    setDealingTargetUserId(activeDealOrder[0]);
                    playDealIntroSfx();

                    let nextStep = 0;
                    const maxSteps = activeDealOrder.length * 2;
                    dealTimelineRef.current = setInterval(() => {
                        const currentTarget = activeDealOrder[nextStep % activeDealOrder.length];
                        setDealStep(nextStep + 1);
                        setDealingTargetUserId(currentTarget);
                        playDrawSfx();

                        nextStep += 1;
                        if (nextStep >= maxSteps) {
                            if (dealTimelineRef.current) {
                                clearInterval(dealTimelineRef.current);
                                dealTimelineRef.current = null;
                            }
                            introHideTimeoutRef.current = setTimeout(() => {
                                setIsDealIntroVisible(false);
                                setDealingTargetUserId(null);
                                introHideTimeoutRef.current = null;
                            }, 350);
                        }
                    }, 280);
                    introStartTimeoutRef.current = null;
                }, 0);
            }
        }

        if (stateChanged && previousState === "DEALING" && room.state !== "DEALING") {
            clearDealIntroRuntime();
            introStartTimeoutRef.current = setTimeout(() => {
                setIsDealIntroVisible(false);
                setDealingTargetUserId(null);
                introStartTimeoutRef.current = null;
            }, 0);
        }

        if (stateChanged && previousState === "DEALING" && room.state === "PLAYER_TURN") {
            playRoundStartSfx();
        }

        if (stateChanged && previousState === "DEALING" && room.state === "GAME_OVER") {
            const banker = room.players.find((player) => player.isBanker);
            if (banker) {
                const bankerStats = getHandStats(banker.cards, true);
                if (bankerStats.isXiBang || bankerStats.isXiDach) {
                    const noticeText = bankerStats.isXiBang
                        ? "Nhà cái Xì Bàng: Lật bài ngay và xét kết quả"
                        : "Nhà cái Xì Dách: Lật bài ngay và xét kết quả";

                    setTimeout(() => {
                        setSystemNotice(noticeText);
                        if (systemNoticeTimeoutRef.current) {
                            clearTimeout(systemNoticeTimeoutRef.current);
                        }
                        systemNoticeTimeoutRef.current = setTimeout(() => {
                            setSystemNotice(null);
                            systemNoticeTimeoutRef.current = null;
                        }, 3500);
                    }, 0);
                }
            }
        }

        const currentCounts: Record<string, number> = {};
        let hasCardDrawnOutsideIntro = false;

        room.players.forEach((player) => {
            currentCounts[player.userId] = player.cards.length;
            const previousCount = prevCardCountRef.current[player.userId] ?? 0;
            if (player.cards.length > previousCount && room.state !== "DEALING") {
                hasCardDrawnOutsideIntro = true;
            }
        });

        if (hasCardDrawnOutsideIntro) {
            playDrawSfx();
        }

        prevCardCountRef.current = currentCounts;
        lastRoomStateRef.current = room.state;
    }, [clearDealIntroRuntime, playDealIntroSfx, playDrawSfx, playRoundStartSfx, room]);

    useEffect(() => {
        hasHydratedMessageSnapshotRef.current = false;
        lastMessageCountRef.current = 0;

        Object.values(bubbleTimersRef.current).forEach((timer) => clearTimeout(timer));
        bubbleTimersRef.current = {};

        const clearBubblesTimer = setTimeout(() => {
            setActiveBubbles({});
        }, 0);

        return () => {
            clearTimeout(clearBubblesTimer);
        };
    }, [room?.id]);

    useEffect(() => {
        if (!room?.messages) return;

        if (!hasHydratedMessageSnapshotRef.current) {
            hasHydratedMessageSnapshotRef.current = true;
            lastMessageCountRef.current = room.messages.length;
            return;
        }

        if (room.messages.length > lastMessageCountRef.current) {
            const newMessages = room.messages.slice(lastMessageCountRef.current);

            newMessages.forEach((msg) => {
                setActiveBubbles((prev) => ({ ...prev, [msg.senderId]: msg.text }));

                if (bubbleTimersRef.current[msg.senderId]) {
                    clearTimeout(bubbleTimersRef.current[msg.senderId]);
                }

                bubbleTimersRef.current[msg.senderId] = setTimeout(() => {
                    setActiveBubbles((prev) => {
                        const copy = { ...prev };
                        delete copy[msg.senderId];
                        return copy;
                    });
                }, 4000);
            });
        }

        lastMessageCountRef.current = room.messages.length;
    }, [room?.messages]);

    useEffect(() => {
        if (showChat) {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [room?.messages, showChat]);

    const peekApprovedFor = useMemo(() => {
        return new Set(room?.peekApprovals ?? []);
    }, [room?.peekApprovals]);

    const me = room?.players.find((p) => p.userId === userId);
    const myTurn =
        room?.state === "PLAYER_TURN" &&
        room.players[room.currentPlayerIndex]?.userId === userId;
    const bankerTurn = room?.state === "BANKER_TURN" && me?.isBanker;
    const isMyTurn = Boolean(myTurn || bankerTurn);

    const banker = room?.players.find((p) => p.isBanker);
    const nonBankers = useMemo(
        () => room?.players.filter((p) => !p.isBanker) ?? [],
        [room?.players],
    );
    const playingPlayers = useMemo(
        () => nonBankers.filter((p) => !p.isSpectator || room?.state === "IDLE"),
        [nonBankers, room?.state],
    );
    const spectators = useMemo(
        () => nonBankers.filter((p) => p.isSpectator && room?.state !== "IDLE"),
        [nonBankers, room?.state],
    );
    const myPlayer = playingPlayers.find((p) => p.userId === userId) ?? null;
    const otherActivePlayers = playingPlayers.filter((p) => p.userId !== userId);
    const activePlayersCount = useMemo(
        () => room?.players.filter((p) => !p.isSpectator && p.status !== "disconnected").length ?? 0,
        [room?.players],
    );
    const seatedPlayers = useMemo(
        () => orderPlayersForDesktopSeats(playingPlayers, userId),
        [playingPlayers, userId],
    );

    const playerAvatarMap = useMemo(() => {
        const avatars: Record<string, { Icon: LucideIcon; themeIndex: number }> = {};
        const players = room?.players ?? [];

        players.forEach((player, index) => {
            const hash = hashString(`${player.userId}-${roundAvatarSeed}-${index}`);
            const iconIndex = hash % AVATAR_ICON_POOL.length;
            avatars[player.userId] = {
                Icon: AVATAR_ICON_POOL[iconIndex],
                themeIndex: iconIndex,
            };
        });

        return avatars;
    }, [room?.players, roundAvatarSeed]);

    const myStats = useMemo(() => {
        if (!me) return null;
        return getHandStats(me.cards, me.isBanker);
    }, [me]);

    const canCenterStay = Boolean(
        me &&
            !me.isBanker &&
            isMyTurn &&
            (me.status === "playing" || me.status === "busted") &&
            myStats?.canStay,
    );

    const canCenterSettleAll = Boolean(
        me && me.isBanker && room?.state === "BANKER_TURN" && myStats?.canStay,
    );

    const canCenterStartGame = Boolean(
        room?.state === "IDLE" && me?.isBanker && activePlayersCount >= 2,
    );

    const canCenterNextRound = Boolean(
        room?.state === "GAME_OVER" && me?.isBanker,
    );

    const handleJoin = (event: FormEvent) => {
        event.preventDefault();
        if (!playerName.trim() || !userId) return;

        socket.connect();
        socket.emit("joinRoom", {
            roomId,
            playerName: playerName.trim(),
            peerId: myPeerId,
            userId,
        });
        setJoined(true);
    };

    const handleLeave = () => {
        socket.emit("explicitLeave");
        router.push("/");
    };

    const handleSendChat = (event: FormEvent) => {
        event.preventDefault();
        if (!chatText.trim()) return;

        socket.emit("chatMessage", chatText.trim());
        setChatText("");
    };

    const handleDrawFromDeck = () => {
        if (!me || !isMyTurn || me.status !== "playing" || me.cards.length >= 5) return;
        socket.emit("drawCard");
    };

    const handleNextRound = () => {
        socket.emit("nextRound");
    };

    const renderCenterControlPanel = (compact: boolean) => {
        if (!room || !me) return null;

        const actions: Array<{
            key: string;
            label: string;
            onClick: () => void;
            disabled?: boolean;
            tone: "primary" | "secondary";
        }> = [];

        if (!me.isBanker && isMyTurn && (me.status === "playing" || me.status === "busted")) {
            actions.push({
                key: "stay",
                label: "Dằn",
                onClick: () => socket.emit("stay"),
                disabled: !canCenterStay,
                tone: "secondary",
            });
        }

        if (me.isBanker && room.state === "BANKER_TURN") {
            actions.push({
                key: "settle-all",
                label: "Xét hết",
                onClick: () => socket.emit("settleAll"),
                disabled: !canCenterSettleAll,
                tone: "primary",
            });
        }

        if (canCenterStartGame) {
            actions.push({
                key: "start-game",
                label: "Bắt đầu",
                onClick: () => socket.emit("startGame"),
                tone: "primary",
            });
        }

        if (canCenterNextRound) {
            actions.push({
                key: "next-round",
                label: "Ván tiếp theo",
                onClick: handleNextRound,
                tone: "primary",
            });
        }

        if (actions.length === 0) return null;

        const buttonClass = `${compact ? "w-24 h-16" : "w-32 h-20"} rounded-md border-2 px-2 py-2 text-xs font-black uppercase shadow-lg disabled:opacity-40`;

        return (
            <div className={`flex items-center ${actions.length > 1 ? "gap-2" : "gap-0"}`}>
                {actions.map((action) => (
                    <button
                        key={action.key}
                        onClick={action.onClick}
                        disabled={action.disabled}
                        className={`${buttonClass} ${action.tone === "primary" ? "text-white" : "text-slate-900"}`}
                        style={
                            action.tone === "primary"
                                ? {
                                      backgroundColor: "var(--accent-primary)",
                                      borderColor: "rgba(186, 230, 253, 0.55)",
                                      boxShadow: "0 8px 22px rgba(0, 0, 0, 0.22)",
                                  }
                                : {
                                      backgroundColor: "var(--accent-secondary)",
                                      borderColor: "rgba(250, 204, 21, 0.55)",
                                      boxShadow: "0 8px 22px rgba(0, 0, 0, 0.22)",
                                  }
                        }
                    >
                        {action.label}
                    </button>
                ))}
            </div>
        );
    };

    const renderCenterMyHand = (compact: boolean) => {
        if (!myPlayer) return null;
        const cardsToShow = myPlayer.cards;

        if (cardsToShow.length === 0) return null;

        return (
            <div className={`flex items-center justify-center ${compact ? "min-w-28" : "min-w-34"}`}>
                {cardsToShow.map((card, index) => (
                    <div
                        key={`center-my-hand-${index}-${card.rank}-${card.suit}`}
                        className={`${index > 0 ? "-ml-4 sm:-ml-6" : ""} relative`}
                        style={{ zIndex: index + 1 }}
                    >
                        <Card suit={card.suit} rank={card.rank} hidden={false} />
                    </div>
                ))}
            </div>
        );
    };

    const renderHandCards = (player: Player, compact: boolean) => {
        const isCurrentUser = player.userId === userId;
        const stats = getHandStats(player.cards, player.isBanker);
        const isSettled = player.status === "win" || player.status === "lose" || player.status === "draw";
        const alwaysReveal = stats.isXiBang || stats.isXiDach || room?.state === "GAME_OVER" || isSettled;
        const peekApproved = me && peekApprovedFor.has(`${me.userId}|${player.userId}`);
        const revealedIndexes = new Set(player.revealedCardIndexes ?? []);
        const canManageReveal =
            isCurrentUser &&
            player.status !== "disconnected" &&
            player.cards.length > 0;

        return (
            <div
                className={`flex w-full items-center justify-center ${compact ? "min-h-16.5" : "min-h-23"} filter drop-shadow-2xl`}
                style={{
                    filter: player.cards.length > 0 
                        ? "drop-shadow(0 0 12px rgba(100, 200, 255, 0.4)) drop-shadow(0 0 25px rgba(100, 200, 255, 0.2))"
                        : undefined
                }}
            >
                {player.cards.length === 0 && (
                    <p className="text-xs italic text-(--text-muted)">
                        Chờ chia bài...
                    </p>
                )}
                {player.cards.map((card, index) => (
                    <div
                        key={`${player.userId}-${index}`}
                        className={`${index > 0 ? "-ml-4 sm:-ml-6" : ""} relative transition-transform duration-200 hover:-translate-y-2 hover:drop-shadow-2xl`}
                        style={{ zIndex: index + 1 }}
                    >
                        <Card
                            suit={card.suit}
                            rank={card.rank}
                            hidden={
                                !isCurrentUser &&
                                !alwaysReveal &&
                                !peekApproved &&
                                !revealedIndexes.has(index) &&
                                player.status !== "disconnected" &&
                                player.cards.length > 0
                            }
                        />

                        {canManageReveal && (
                            <button
                                type="button"
                                onClick={() => socket.emit("toggleCardReveal", index)}
                                className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase shadow-sm"
                                style={{
                                    backgroundColor: revealedIndexes.has(index)
                                        ? "rgba(14, 165, 233, 0.92)"
                                        : "rgba(15, 23, 42, 0.9)",
                                    borderColor: revealedIndexes.has(index)
                                        ? "rgba(186, 230, 253, 0.95)"
                                        : "rgba(148, 163, 184, 0.85)",
                                    color: "#f8fafc",
                                }}
                                title={revealedIndexes.has(index) ? "Đang khoe lá này" : "Khoe lá này cho cả phòng"}
                            >
                                {revealedIndexes.has(index) ? <Eye className="h-2.5 w-2.5" /> : <EyeOff className="h-2.5 w-2.5" />}
                                {revealedIndexes.has(index) ? "Úp lại" : "Khoe"}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const renderPlayerPanel = (player: Player, compact: boolean) => {
        const isCurrentUser = player.userId === userId;
        const isCurrentUserBanker = Boolean(me?.isBanker);
        const avatarEntry =
            playerAvatarMap[player.userId] ??
            ({ Icon: UserRound, themeIndex: 0 } as { Icon: LucideIcon; themeIndex: number });
        const avatarTheme = AVATAR_THEME_POOL[avatarEntry.themeIndex % AVATAR_THEME_POOL.length];
        const AvatarIcon = avatarEntry.Icon;
        const isHiddenHand =
            !isCurrentUser &&
            room?.state !== "GAME_OVER" &&
            player.status !== "disconnected" &&
            player.cards.length > 0;
        const currentTurnUser = room?.players[room.currentPlayerIndex]?.userId;
        const isCurrentTurn =
            (room?.state === "PLAYER_TURN" && currentTurnUser === player.userId) ||
            (room?.state === "BANKER_TURN" && player.isBanker);
        const isPendingNextBanker = Boolean(
            room?.state !== "IDLE" && room?.pendingBankerUserId === player.userId,
        );
        const isDealTarget = Boolean(
            isDealIntroVisible && dealingTargetUserId === player.userId,
        );

        const pointsMeta = getHandStats(player.cards, player.isBanker);
        const peekApproved = me && peekApprovedFor.has(`${me.userId}|${player.userId}`);
        const perspectiveStatus = getStatusFromViewerPerspective(
            player.status,
            isCurrentUserBanker,
            player.isBanker,
        );
        const isSensitiveStatus = player.status === "busted" || player.status === "stay";
        const shouldConcealStatus = Boolean(isHiddenHand && isSensitiveStatus && !peekApproved);
        const displayStatus = shouldConcealStatus
            ? formatPlayerStatus("playing")
            : formatPlayerStatus(perspectiveStatus);
        const isQuac = !shouldConcealStatus && player.status === "busted";
        const isDan = !shouldConcealStatus && player.status === "stay";
        const isWin = !shouldConcealStatus && perspectiveStatus === "win";
        const isLose = !shouldConcealStatus && perspectiveStatus === "lose";
        const isSettled = player.status === "win" || player.status === "lose" || player.status === "draw";
        const bankerCanSettlePerPlayer = Boolean(
            me?.isBanker &&
                myStats &&
                ((me.cards.length === 2 && myStats.points >= 15) ||
                    (me.cards.length >= 3 && myStats.points >= 16)),
        );
        const canSettleThisPlayer =
            room?.state === "BANKER_TURN" &&
            isCurrentUserBanker &&
            bankerCanSettlePerPlayer &&
            !player.isBanker &&
            !isSettled &&
            player.status !== "waiting" &&
            player.status !== "disconnected";
        const canTransferBanker = Boolean(
            me?.isBanker &&
                !player.isBanker &&
                !player.isSpectator &&
                player.status !== "disconnected",
        );
        const roleTopPadding = isCurrentUser || player.isBanker ? "pt-7" : "pt-5";
                const panelBorderColor = isCurrentUser
              ? "rgba(34, 211, 238, 0.7)"
              : player.isBanker
                ? "rgba(251, 191, 36, 0.8)"
                : "var(--panel-border)";

        return (
            <div
                key={player.userId || player.id}
                className={`relative flex flex-col gap-2 rounded-3xl border px-3 py-2 shadow-lg backdrop-blur ${compact ? "w-45" : "w-55"} ${roleTopPadding} ${isCurrentUser ? "ring-2 ring-cyan-300/70 shadow-[0_0_35px_rgba(34,211,238,0.42)]" : ""} ${player.isBanker ? "shadow-[0_0_35px_rgba(234,179,8,0.35)]" : ""} ${isDealTarget ? "ring-2 ring-indigo-300/80 shadow-[0_0_26px_rgba(129,140,248,0.45)]" : ""} ${player.status === "disconnected" ? "opacity-60" : ""}`}
                style={{
                    backgroundColor: "var(--panel-surface)",
                    borderColor: panelBorderColor,
                }}
            >
                {isCurrentTurn && (
                    <div
                        className="pointer-events-none absolute -inset-1 rounded-3xl"
                        style={{
                            boxShadow:
                                "0 0 18px rgba(16, 185, 129, 0.62), 0 0 36px rgba(16, 185, 129, 0.34)",
                        }}
                    />
                )}

                <div
                    className="absolute -top-4 left-3 flex items-center justify-center rounded-2xl border p-2 shadow-lg"
                    style={{
                        background: avatarTheme.bg,
                        borderColor: "rgba(255,255,255,0.45)",
                        boxShadow: `0 0 18px ${avatarTheme.glow}`,
                    }}
                    title="Avatar ngẫu nhiên theo ván"
                >
                    <AvatarIcon className="h-4 w-4 text-white" />
                </div>

                {isCurrentUser && (
                    <div
                        className="absolute -top-4 left-15 flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-50 shadow-lg"
                        style={{
                            background: "linear-gradient(120deg, #0e7490, #06b6d4, #22d3ee)",
                            borderColor: "rgba(125, 211, 252, 0.95)",
                            boxShadow: "0 0 18px rgba(34, 211, 238, 0.55)",
                        }}
                    >
                        <UserRound className="h-3.5 w-3.5" />
                        Bạn
                    </div>
                )}

                {player.isBanker && (
                    <div
                        className="absolute -top-4 right-3 flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-950 shadow-[0_0_18px_rgba(245,158,11,0.6)]"
                        style={{
                            background: "linear-gradient(120deg, #fde68a, #f59e0b, #facc15)",
                            borderColor: "rgba(251, 191, 36, 0.95)",
                        }}
                    >
                        <Crown className="h-3.5 w-3.5" />
                        Nhà cái
                    </div>
                )}
                {isCurrentUser && (
                    <div className="pointer-events-none absolute inset-0 rounded-3xl bg-linear-to-br from-cyan-300/8 to-transparent" />
                )}
                {player.isBanker && (
                    <div className="pointer-events-none absolute inset-0 rounded-3xl bg-linear-to-br from-amber-300/10 to-transparent" />
                )}
                {isPendingNextBanker && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-indigo-300/70 bg-indigo-500 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow-lg">
                        Cái ván sau
                    </div>
                )}

                {activeBubbles[player.userId] && (
                    <div className="absolute -top-11 left-1/2 w-44 -translate-x-1/2 rounded-xl bg-white px-2 py-1 text-center text-xs font-semibold text-slate-800 shadow-lg line-clamp-2 wrap-break-word">
                        {activeBubbles[player.userId]}
                    </div>
                )}

                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 truncate">
                        <div className="truncate text-sm font-black text-(--text-primary)">
                            {player.name}
                        </div>
                        {player.isSpeaking ? (
                            <div className="shrink-0 rounded-full bg-linear-to-r from-green-400 to-emerald-500 p-1 shadow-lg animate-pulse">
                                <Mic className="h-2.5 w-2.5 text-white" />
                            </div>
                        ) : player.isMicOn ? (
                            <div className="shrink-0 rounded-full bg-linear-to-r from-blue-400 to-blue-500 p-1 shadow-md">
                                <Mic className="h-2.5 w-2.5 text-white" />
                            </div>
                        ) : null}
                    </div>
                    <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            isQuac
                                ? "bg-red-500/15 text-red-600"
                                : isWin
                                  ? "bg-emerald-500/18 text-emerald-700"
                                  : isLose
                                    ? "bg-rose-500/18 text-rose-700"
                                    : isDan
                                      ? "bg-amber-500/20 text-amber-700"
                                      : "bg-black/10 text-(--text-muted)"
                        }`}
                    >
                        {displayStatus}
                    </span>
                </div>

                {isCurrentTurn && (
                    <div className="-mt-1 text-[10px] font-black uppercase tracking-wider text-emerald-600">
                        Đang rút bài
                    </div>
                )}

                {(isCurrentUser || peekApproved || room?.state === "GAME_OVER" || isSettled || pointsMeta.isXiBang || pointsMeta.isXiDach) &&
                    player.cards.length > 0 && (
                        <div className={`w-fit rounded-full px-2 py-0.5 text-xs font-bold ${pointsMeta.isBusted ? "bg-red-500/15 text-red-600" : "bg-(--accent-primary)/10 text-(--accent-primary)"}`}>
                            {pointsMeta.isXiBang
                                ? "Xì bàng"
                                : pointsMeta.isXiDach
                                  ? "Xì dách"
                                  : pointsMeta.isNgulinh
                                    ? "Ngũ linh"
                                    : pointsMeta.isBusted
                                      ? "Quắc"
                                      : `${pointsMeta.points} điểm`}
                        </div>
                    )}

                {renderHandCards(player, compact)}

                {canSettleThisPlayer && (
                    <div className="mt-1 border-t border-black/10 pt-2">
                        <button
                            onClick={() => socket.emit("settlePlayer", player.userId)}
                            className="w-full rounded-xl px-2 py-2 text-xs font-black uppercase text-white"
                            style={{ backgroundColor: "var(--accent-primary)" }}
                        >
                            Xét bài
                        </button>
                    </div>
                )}

                {canTransferBanker && (
                    <div className="mt-1 border-t border-black/10 pt-2">
                        <button
                            onClick={() => socket.emit("transferBanker", player.userId)}
                            disabled={Boolean(room?.state !== "IDLE" && room?.pendingBankerUserId === player.userId)}
                            className="w-full rounded-xl border px-2 py-2 text-xs font-black uppercase text-(--text-primary) disabled:opacity-40"
                            style={{ borderColor: "var(--panel-border)", backgroundColor: "var(--surface)" }}
                        >
                            {room?.state === "IDLE"
                                ? "Chuyển quyền cái"
                                : room?.pendingBankerUserId === player.userId
                                  ? "Đã đặt cái ván sau"
                                  : "Đặt cái ván sau"}
                        </button>
                    </div>
                )}

                {!isCurrentUser && !player.isSpectator && !player.isBanker && me && !me.isBanker && (
                    <div className="mt-1 border-t border-black/10 pt-2">
                        <button
                            onClick={() => socket.emit("sendPeekRequest", player.userId)}
                            className="w-full rounded-xl px-2 py-2 text-xs font-black uppercase text-white disabled:opacity-40 transition-all active:scale-95 hover:scale-102 hover:shadow-lg"
                            style={{ 
                                backgroundColor: peekApprovedFor.has(`${me.userId}|${player.userId}`)
                                    ? "rgba(34, 197, 94, 0.9)"
                                    : "rgba(139, 92, 246, 0.9)",
                                boxShadow: peekApprovedFor.has(`${me.userId}|${player.userId}`)
                                    ? "0 0 12px rgba(34, 197, 94, 0.5)"
                                    : "0 0 12px rgba(139, 92, 246, 0.5)"
                            }}
                            disabled={peekApprovedFor.has(`${me.userId}|${player.userId}`)}
                            title={peekApprovedFor.has(`${me.userId}|${player.userId}`) ? "Đã xem bài ván này" : "Gửi yêu cầu xem bài"}
                        >
                            {peekApprovedFor.has(`${me.userId}|${player.userId}`) ? "Đã xem" : "Ngó"}
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderDeckStack = (compact: boolean) => {
        const canDraw = Boolean(me && isMyTurn && me.status === "playing" && me.cards.length < 5);
        const stackSizeClass = compact ? "h-16 w-12" : "h-24 w-16";
        const backCard1OffsetX = compact ? 3.5 : 5.5;
        const backCard1OffsetY = compact ? 4.5 : 7;
        const backCard2OffsetX = compact ? 6.5 : 9;
        const backCard2OffsetY = compact ? 7.5 : 11;

        return (
            <button
                onClick={handleDrawFromDeck}
                disabled={!canDraw}
                className={`group relative rounded-2xl transition-all ${compact ? "h-18 w-16" : "h-28 w-20"} ${
                    canDraw ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                }`}
                title={canDraw ? "Bấm để rút bài" : "Chưa thể rút bài"}
                aria-label="Chồng bài rút"
            >
                <span
                    className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg border ${stackSizeClass}`}
                    style={{
                        zIndex: 10,
                        transform: `translate(calc(-50% + ${backCard2OffsetX}px), calc(-50% + ${backCard2OffsetY}px)) rotate(-7deg)`,
                        background:
                            "repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 3px, rgba(10,30,18,0.45) 3px, rgba(10,30,18,0.45) 8px)",
                        borderColor: "rgba(255, 235, 190, 0.28)",
                    }}
                />
                <span
                    className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg border ${stackSizeClass}`}
                    style={{
                        zIndex: 11,
                        transform: `translate(calc(-50% + ${backCard1OffsetX}px), calc(-50% + ${backCard1OffsetY}px)) rotate(-4deg)`,
                        background:
                            "repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 3px, rgba(12,40,24,0.5) 3px, rgba(12,40,24,0.5) 8px)",
                        borderColor: "rgba(255, 235, 190, 0.35)",
                    }}
                />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ zIndex: 20 }}>
                    <Card suit="spades" rank="A" hidden />
                </span>
                {canDraw && (
                    <span className="absolute -inset-1 rounded-2xl border border-emerald-300/60 opacity-0 transition group-hover:opacity-100" />
                )}
            </button>
        );
    };

    const renderDesktopLayout = () => {
        if (!room) return null;

        return (
            <div className="relative h-dvh w-full overflow-hidden room-gradient">
                <HeaderBar
                    room={room}
                    roomId={roomId}
                    compact={false}
                    me={me}
                    isMicOn={isMicOn}
                    onToggleMic={() => {
                        setIsMicOn((prev) => !prev);
                        socket.emit("toggleMic", !isMicOn);
                    }}
                    onOpenSettings={() => setShowSettingsModal(true)}
                    onToggleSkip={() => socket.emit("toggleSkip")}
                    onLeave={handleLeave}
                />

                <section
                    className="table-stage relative"
                    style={{ height: "calc(100dvh - var(--room-header-height))" }}
                >
                    <div className="absolute inset-6">
                        <div className="table-ellipse relative h-full w-full overflow-visible rounded-[46%]">
                            <div className="table-inner-ring absolute inset-[12%] rounded-[50%]" />

                            {banker && (
                                <div
                                    className="absolute"
                                    style={{
                                        left: "50%",
                                        top: "20%",
                                        transform: "translate(-50%, -50%)",
                                    }}
                                >
                                    {renderPlayerPanel(banker, false)}
                                </div>
                            )}

                            <div
                                className="pointer-events-none absolute"
                                style={{ left: "50%", top: "52%", transform: "translate(-50%, -50%)" }}
                            >
                                <div className="pointer-events-auto flex items-center gap-5">
                                    <div className="shrink-0">{renderCenterMyHand(false)}</div>
                                    <div className="shrink-0">{renderDeckStack(false)}</div>
                                    <div className="shrink-0">{renderCenterControlPanel(false)}</div>
                                </div>
                            </div>

                            {seatedPlayers.map((player, index) => (
                                <div
                                    key={player.userId || player.id}
                                    className="absolute"
                                    style={getDesktopSeatPosition(index, seatedPlayers.length)}
                                >
                                    {renderPlayerPanel(player, false)}
                                </div>
                            ))}

                            {spectators.length > 0 && (
                                <div
                                    className="absolute right-4 top-4 rounded-2xl border px-3 py-2 text-xs"
                                    style={{
                                        backgroundColor: "var(--panel-surface)",
                                        borderColor: "var(--panel-border)",
                                    }}
                                >
                                    <p className="mb-1 font-bold uppercase text-(--text-muted)">
                                        Khán giả
                                    </p>
                                    <div className="max-h-35 overflow-y-auto">
                                        {spectators.map((player) => (
                                            <p key={player.userId || player.id} className="truncate">
                                                {player.name}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <ChatDropdown
                        room={room}
                        userId={userId}
                        showChat={showChat}
                        showPeekNotifications={showPeekNotifications}
                        chatText={chatText}
                        onToggleChat={() => setShowChat((prev) => !prev)}
                        onCloseChat={() => setShowChat(false)}
                        onTogglePeekNotifications={() => setShowPeekNotifications((prev) => !prev)}
                        onClosePeekNotifications={() => setShowPeekNotifications(false)}
                        onChatTextChange={setChatText}
                        onSendChat={handleSendChat}
                        onApprovePeek={(requestId) => socket.emit("approvePeekRequest", { requestId })}
                        onRejectPeek={(requestId) => socket.emit("rejectPeekRequest", { requestId })}
                    />
                    <DealIntroOverlay
                        isVisible={isDealIntroVisible}
                        dealStep={dealStep}
                        dealingTargetUserId={dealingTargetUserId}
                        players={room.players}
                    />
                </section>

                <SettingsModal
                    isOpen={showSettingsModal}
                    sfxEnabled={sfxEnabled}
                    noiseSuppressionEnabled={noiseSuppressionEnabled}
                    onClose={() => setShowSettingsModal(false)}
                    onToggleSfx={() => setSfxEnabled((prev) => !prev)}
                    onToggleNoiseSuppression={() => setNoiseSuppressionEnabled((prev) => !prev)}
                />
                <SystemNotice message={systemNotice} />
            </div>
        );
    };

    const renderMobilePortraitNotice = () => (
        <div className="flex h-full w-full items-center justify-center p-6 room-gradient">
            <div
                className="max-w-sm rounded-3xl border p-6 text-center shadow-xl"
                style={{
                    backgroundColor: "var(--panel-surface)",
                    borderColor: "var(--panel-border)",
                }}
            >
                <RotateCw className="mx-auto mb-3 h-8 w-8 text-(--accent-primary)" />
                <h2 className="text-lg font-white">Vui lòng xoay ngang điện thoại</h2>
                <p className="mt-2 text-sm text-(--text-muted)">
                    Giao diện cho điện thoại chỉ hỗ trợ chế độ ngang trong phòng này.
                </p>
            </div>
        </div>
    );

    const renderMobileLandscapeLayout = () => {
        if (!room) return null;

        return (
            <div className="relative h-dvh w-full overflow-hidden room-gradient">
                <HeaderBar
                    room={room}
                    roomId={roomId}
                    compact
                    me={me}
                    isMicOn={isMicOn}
                    onToggleMic={() => {
                        setIsMicOn((prev) => !prev);
                        socket.emit("toggleMic", !isMicOn);
                    }}
                    onOpenSettings={() => setShowSettingsModal(true)}
                    onToggleSkip={() => socket.emit("toggleSkip")}
                    onLeave={handleLeave}
                />

                <section
                    className="relative flex flex-col"
                    style={{ height: "calc(100dvh - var(--room-header-height-mobile))" }}
                >
                    <div className="flex min-h-[36%] gap-2 overflow-x-auto px-3 py-2">
                        {otherActivePlayers.length > 0 ? (
                            otherActivePlayers.map((player) => (
                                <div key={player.userId || player.id}>
                                    {renderPlayerPanel(player, true)}
                                </div>
                            ))
                        ) : (
                            <div
                                className="w-full rounded-2xl border p-4 text-center text-xs"
                                style={{
                                    backgroundColor: "var(--panel-surface)",
                                    borderColor: "var(--panel-border)",
                                }}
                            >
                                Chưa có người chơi nào khác.
                            </div>
                        )}
                    </div>

                    <div className="mx-3 my-1 rounded-[40px] border p-3 table-ellipse">
                        <div className="mx-auto w-fit rounded-full bg-black/20 px-4 py-1 text-xs text-white">
                            Giữa bàn
                        </div>
                        <div className="mt-2 flex justify-center">
                            {renderDeckStack(true)}
                        </div>
                        <div className="mt-2 flex justify-center">{renderCenterControlPanel(true)}</div>
                        <div className="mt-2 flex justify-center">{renderCenterMyHand(true)}</div>
                        <div className="mt-2 flex justify-center">
                            {banker ? renderPlayerPanel(banker, true) : null}
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 px-3 pb-3 pt-2">
                        {myPlayer ? renderPlayerPanel(myPlayer, true) : null}
                    </div>

                    <ChatDropdown
                        room={room}
                        userId={userId}
                        showChat={showChat}
                        showPeekNotifications={showPeekNotifications}
                        chatText={chatText}
                        onToggleChat={() => setShowChat((prev) => !prev)}
                        onCloseChat={() => setShowChat(false)}
                        onTogglePeekNotifications={() => setShowPeekNotifications((prev) => !prev)}
                        onClosePeekNotifications={() => setShowPeekNotifications(false)}
                        onChatTextChange={setChatText}
                        onSendChat={handleSendChat}
                        onApprovePeek={(requestId) => socket.emit("approvePeekRequest", { requestId })}
                        onRejectPeek={(requestId) => socket.emit("rejectPeekRequest", { requestId })}
                    />
                    <DealIntroOverlay
                        isVisible={isDealIntroVisible}
                        dealStep={dealStep}
                        dealingTargetUserId={dealingTargetUserId}
                        players={room.players}
                    />
                </section>

                <SettingsModal
                    isOpen={showSettingsModal}
                    sfxEnabled={sfxEnabled}
                    noiseSuppressionEnabled={noiseSuppressionEnabled}
                    onClose={() => setShowSettingsModal(false)}
                    onToggleSfx={() => setSfxEnabled((prev) => !prev)}
                    onToggleNoiseSuppression={() => setNoiseSuppressionEnabled((prev) => !prev)}
                />
                <SystemNotice message={systemNotice} />
            </div>
        );
    };

    if (!joined) {
        return (
            <div className="room-gradient flex h-dvh w-full items-center justify-center p-4">
                <VoiceChat
                    roomPlayers={
                        room
                            ? room.players.map((player) => ({
                                id: player.id,
                                peerId: player.peerId,
                            }))
                            : []
                    }
                    mySocketId={socket.id || ""}
                    onReady={setMyPeerId}
                    isMicOn={isMicOn}
                    noiseSuppressionEnabled={noiseSuppressionEnabled}
                />

                <div
                    className="w-full max-w-md rounded-3xl border p-6 shadow-2xl"
                    style={{
                        backgroundColor: "var(--panel-surface)",
                        borderColor: "var(--panel-border)",
                    }}
                >
                    <h1
                        className="mb-5 text-center text-3xl font-black"
                        style={{ color: "var(--accent-primary)" }}
                    >
                        Vào phòng {roomId}
                    </h1>

                    <form onSubmit={handleJoin} className="space-y-4">
                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-(--text-muted)">
                                Tên hiển thị
                            </label>
                            <input
                                type="text"
                                value={playerName}
                                onChange={(event) => setPlayerName(event.target.value)}
                                placeholder="Nhập tên hiển thị"
                                className="w-full rounded-xl border bg-white/75 px-4 py-3 text-sm outline-none"
                                style={{ borderColor: "var(--panel-border)" }}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!myPeerId}
                            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-wide text-white disabled:opacity-50"
                            style={{ backgroundColor: "var(--accent-primary)" }}
                        >
                            {myPeerId ? (
                                <>
                                    <PlayCircle className="h-5 w-5" />
                                    Vào ván
                                </>
                            ) : (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Đang khởi tạo âm thanh
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (!room) {
        return (
            <div className="room-gradient flex h-dvh w-full items-center justify-center text-lg font-bold text-(--accent-primary)">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Đang đồng bộ phòng...
            </div>
        );
    }

    return (
        <>
            <VoiceChat
                roomPlayers={room.players.map((player) => ({
                    id: player.id,
                    peerId: player.peerId,
                }))}
                mySocketId={socket.id || ""}
                onReady={setMyPeerId}
                isMicOn={isMicOn}
                noiseSuppressionEnabled={noiseSuppressionEnabled}
            />

            {isMobileLayout
                ? isPortrait
                    ? renderMobilePortraitNotice()
                    : renderMobileLandscapeLayout()
                : renderDesktopLayout()}
        </>
    );
}
