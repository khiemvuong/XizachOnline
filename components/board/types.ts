import type { CSSProperties } from "react";
import {
    Bird,
    Bug,
    Cat,
    Dog,
    Panda,
    Rabbit,
    Rat,
    Squirrel,
    Turtle,
    PiggyBank,
    type LucideIcon,
} from "lucide-react";

export const AVATAR_ICON_POOL: LucideIcon[] = [
    PiggyBank,
    Cat,
    Dog,
    Bird,
    Panda,
    Rabbit,
    Squirrel,
    Turtle,
    Rat,
    Bug,
];

export const AVATAR_THEME_POOL = [
    { bg: "linear-gradient(135deg, #0ea5e9, #22d3ee)", glow: "rgba(34, 211, 238, 0.45)" },
    { bg: "linear-gradient(135deg, #8b5cf6, #ec4899)", glow: "rgba(236, 72, 153, 0.42)" },
    { bg: "linear-gradient(135deg, #f97316, #facc15)", glow: "rgba(250, 204, 21, 0.4)" },
    { bg: "linear-gradient(135deg, #22c55e, #14b8a6)", glow: "rgba(20, 184, 166, 0.4)" },
    { bg: "linear-gradient(135deg, #ef4444, #f97316)", glow: "rgba(249, 115, 22, 0.42)" },
    { bg: "linear-gradient(135deg, #6366f1, #a855f7)", glow: "rgba(99, 102, 241, 0.42)" },
    { bg: "linear-gradient(135deg, #f43f5e, #fb7185)", glow: "rgba(244, 63, 94, 0.42)" },
    { bg: "linear-gradient(135deg, #14b8a6, #0ea5e9)", glow: "rgba(20, 184, 166, 0.42)" },
    { bg: "linear-gradient(135deg, #84cc16, #22c55e)", glow: "rgba(132, 204, 22, 0.42)" },
    { bg: "linear-gradient(135deg, #fb923c, #ef4444)", glow: "rgba(251, 146, 60, 0.42)" },
];

export function hashString(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
        hash = (hash << 5) - hash + input.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

export type GameState =
    | "IDLE"
    | "DEALING"
    | "PLAYER_TURN"
    | "BANKER_TURN"
    | "GAME_OVER";

export interface Player {
    id: string;
    userId: string;
    name: string;
    peerId?: string;
    cards: { suit: string; rank: string }[];
    revealedCardIndexes: number[];
    isBanker: boolean;
    isSpectator: boolean;
    status: string;
    isMicOn?: boolean;
    isSpeaking?: boolean;
}

export interface ChatMessage {
    senderId: string;
    senderName: string;
    text: string;
    timestamp: number;
}

export interface PeekRequest {
    fromUserId: string;
    fromPlayerName: string;
    toUserId: string;
    requestId: string;
    timestamp: number;
}

export interface Room {
    id: string;
    state: GameState;
    players: Player[];
    currentPlayerIndex: number;
    messages: ChatMessage[];
    peekRequests: PeekRequest[];
    peekApprovals: string[];
    pendingBankerUserId?: string;
}

export interface HandStats {
    points: number;
    canStay: boolean;
    isXiBang: boolean;
    isXiDach: boolean;
    isNgulinh: boolean;
    isBusted: boolean;
}

export function formatGameState(state: GameState) {
    switch (state) {
        case "IDLE":
            return "Sẵn sàng";
        case "DEALING":
            return "Đang chia bài";
        case "PLAYER_TURN":
            return "Lượt người chơi";
        case "BANKER_TURN":
            return "Lượt nhà cái";
        case "GAME_OVER":
            return "Kết thúc ván";
        default:
            return state;
    }
}

export function formatPlayerStatus(status: string) {
    switch (status) {
        case "playing":
            return "Đang chơi";
        case "busted":
            return "Quắc";
        case "stay":
            return "Dằn";
        case "win":
            return "Thắng";
        case "lose":
            return "Thua";
        case "draw":
            return "Hòa";
        case "waiting":
            return "Chờ";
        case "disconnected":
            return "Mất kết nối";
        default:
            return status;
    }
}

export function getStatusFromViewerPerspective(
    status: string,
    viewerIsBanker: boolean,
    targetIsBanker: boolean,
) {
    if (viewerIsBanker && !targetIsBanker) {
        if (status === "win") return "lose";
        if (status === "lose") return "win";
    }
    return status;
}

export function getHandStats(cards: { rank: string }[], isBanker: boolean): HandStats {
    let totalPoints = 0;
    let numAces = 0;
    let isXiBang = false;
    let isXiDach = false;
    let isNgulinh = false;

    if (cards.length === 2) {
        const aces = cards.filter((c) => c.rank === "A").length;
        const hasA = cards.some((c) => c.rank === "A");
        const hasFaceOrTen = cards.some((c) => ["10", "J", "Q", "K"].includes(c.rank));
        if (aces === 2) {
            isXiBang = true;
        } else if (hasA && hasFaceOrTen) {
            isXiDach = true;
        }
    }

    for (const card of cards) {
        if (["J", "Q", "K"].includes(card.rank)) totalPoints += 10;
        else if (card.rank === "A") numAces++;
        else totalPoints += parseInt(card.rank, 10);
    }

    for (let i = 0; i < numAces; i++) {
        if (cards.length === 2 || cards.length === 3) {
            if (totalPoints + 11 <= 21) totalPoints += 11;
            else if (totalPoints + 10 <= 21) totalPoints += 10;
            else totalPoints += 1;
        } else {
            totalPoints += 1;
        }
    }

    if (isXiBang || isXiDach) {
        return {
            points: isXiBang ? 20 : 21,
            canStay: true,
            isXiBang,
            isXiDach,
            isNgulinh: false,
            isBusted: false,
        };
    }

    if (cards.length === 5 && totalPoints <= 21) {
        isNgulinh = true;
    }

    const isBusted = totalPoints > 21;
    let canStay = false;
    if (isBusted || cards.length >= 5) canStay = true;
    else if (isBanker) {
        if (cards.length === 2 && totalPoints >= 15) canStay = true;
        else if (cards.length >= 3 && totalPoints >= 16) canStay = true;
    } else if (totalPoints >= 16) {
        canStay = true;
    }

    if (cards.length === 2) {
        const hasFaceOrTen = cards.some((c) => ["10", "J", "Q", "K"].includes(c.rank));
        if (numAces === 2) canStay = true;
        if (numAces === 1 && hasFaceOrTen) canStay = true;
    }

    return {
        points: totalPoints,
        canStay,
        isXiBang,
        isXiDach,
        isNgulinh,
        isBusted,
    };
}

export function getDesktopSeatPosition(index: number, total: number): CSSProperties {
    if (total <= 0) {
        return { left: "50%", top: "78%", transform: "translate(-50%, -50%) scale(1)" };
    }

    if (total === 1) {
        return { left: "50%", top: "79%", transform: "translate(-50%, -50%) scale(1)" };
    }

    const spread = Math.min(166, 128 + total * 5);
    const start = (180 - spread) / 2;
    const angle = start + (spread * index) / Math.max(total - 1, 1);
    const radians = (angle * Math.PI) / 180;

    const radiusX = 36;
    const radiusY = 21;
    const x = 50 + Math.cos(radians) * radiusX;
    const y = 57 + Math.sin(radians) * radiusY;

    const scale = Math.max(0.58, Math.min(1, 1.05 - (total - 1) * 0.055));

    return {
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: "center",
    };
}

export function orderPlayersForDesktopSeats(players: Player[], currentUserId: string): Player[] {
    if (players.length <= 2) return players;

    const myIndex = players.findIndex((p) => p.userId === currentUserId);
    if (myIndex === -1) return players;

    const targetIndex = Math.floor((players.length - 1) / 2);
    const shift = targetIndex - myIndex;

    return players.map((_, index) => {
        const sourceIndex = (index - shift + players.length) % players.length;
        return players[sourceIndex];
    });
}
