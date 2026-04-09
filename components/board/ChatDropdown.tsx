// Board shim — delegates to shared ChatDropdown with board-specific theme + types
import SharedChatDropdown, {
    type ChatTheme,
    type ChatMessage,
    type ChatPeekRequest,
} from "@/components/shared/ChatDropdown";
import type { FormEvent } from "react";
import type { PeekRequest, Room } from "./types";

const BOARD_THEME: ChatTheme = {
    surface: "var(--panel-surface)",
    border: "var(--panel-border)",
    accent: "var(--accent-primary)",
    textPrimary: "var(--text-primary)",
    textMuted: "var(--text-muted)",
};

interface ChatDropdownProps {
    room: Room;
    userId: string;
    showChat: boolean;
    showPeekNotifications: boolean;
    chatText: string;
    onToggleChat: () => void;
    onCloseChat: () => void;
    onTogglePeekNotifications: () => void;
    onClosePeekNotifications: () => void;
    onChatTextChange: (value: string) => void;
    onSendChat: (event: FormEvent) => void;
    onApprovePeek: (requestId: string) => void;
    onRejectPeek: (requestId: string) => void;
}

export default function ChatDropdown({
    room,
    userId,
    showChat,
    showPeekNotifications,
    chatText,
    onToggleChat,
    onCloseChat,
    onTogglePeekNotifications,
    onClosePeekNotifications,
    onChatTextChange,
    onSendChat,
    onApprovePeek,
    onRejectPeek,
}: ChatDropdownProps) {
    const messages: ChatMessage[] = room.messages ?? [];
    const peekRequests: ChatPeekRequest[] = (room.peekRequests ?? []).map(
        (r: PeekRequest) => ({
            requestId: r.requestId,
            fromPlayerName: r.fromPlayerName,
            toUserId: r.toUserId,
        })
    );

    return (
        <SharedChatDropdown
            messages={messages}
            userId={userId}
            showChat={showChat}
            chatText={chatText}
            theme={BOARD_THEME}
            onToggleChat={onToggleChat}
            onCloseChat={onCloseChat}
            onChatTextChange={onChatTextChange}
            onSendChat={onSendChat}
            peekRequests={peekRequests}
            showPeekNotifications={showPeekNotifications}
            onTogglePeekNotifications={onTogglePeekNotifications}
            onClosePeekNotifications={onClosePeekNotifications}
            onApprovePeek={onApprovePeek}
            onRejectPeek={onRejectPeek}
        />
    );
}
