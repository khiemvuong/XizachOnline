import { Eye, MessageCircle, Send, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

export interface ChatMessage {
    senderId: string;
    senderName: string;
    text: string;
    timestamp: number;
}

export interface ChatPeekRequest {
    requestId: string;
    fromPlayerName: string;
    toUserId: string;
}

export interface ChatTheme {
    surface: string;
    border: string;
    accent: string;
    textPrimary: string;
    textMuted: string;
}

interface ChatDropdownProps {
    messages: ChatMessage[];
    userId: string;
    showChat: boolean;
    chatText: string;
    theme: ChatTheme;
    onToggleChat: () => void;
    onCloseChat: () => void;
    onChatTextChange: (value: string) => void;
    onSendChat: (event: FormEvent) => void;
    canSend?: boolean;
    sendBlockedMessage?: string;
    inputPlaceholder?: string;
    // Optional peek features (board only)
    peekRequests?: ChatPeekRequest[];
    showPeekNotifications?: boolean;
    onTogglePeekNotifications?: () => void;
    onClosePeekNotifications?: () => void;
    onApprovePeek?: (requestId: string) => void;
    onRejectPeek?: (requestId: string) => void;
}

export default function ChatDropdown({
    messages,
    userId,
    showChat,
    chatText,
    theme,
    onToggleChat,
    onCloseChat,
    onChatTextChange,
    onSendChat,
    canSend = true,
    sendBlockedMessage = "Bạn không được phép chat trong giai đoạn này.",
    inputPlaceholder = "Nhập tin nhắn...",
    peekRequests,
    showPeekNotifications,
    onTogglePeekNotifications,
    onClosePeekNotifications,
    onApprovePeek,
    onRejectPeek,
}: ChatDropdownProps) {
    const incomingRequests = (peekRequests ?? []).filter((r) => r.toUserId === userId);
    const hasPeekFeature = !!peekRequests;
    const chatListRef = useRef<HTMLDivElement>(null);
    const prevMessagesLength = useRef(messages?.length || 0);
    const [unreadCount, setUnreadCount] = useState(0);
    
    // Frontend Rate Limiting State
    const [rateLimitError, setRateLimitError] = useState("");
    const messageTimestamps = useRef<number[]>([]);

    const handleFormSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!canSend) {
            setRateLimitError(sendBlockedMessage);
            setTimeout(() => setRateLimitError(""), 3000);
            return;
        }

        if (chatText.length > 500) {
            setRateLimitError("Tin nhắn quá dài (tối đa 500 ký tự)");
            setTimeout(() => setRateLimitError(""), 3000);
            return;
        }

        const now = Date.now();
        const validStamps = messageTimestamps.current.filter((t) => now - t < 10000);

        if (validStamps.length >= 10) {
            setRateLimitError("Gửi quá nhanh! Đợi vài giây nhé.");
            setTimeout(() => setRateLimitError(""), 3000);
            return;
        }

        validStamps.push(now);
        messageTimestamps.current = validStamps;
        setRateLimitError("");

        onSendChat(e);
    };

    // Track unread messages
    useEffect(() => {
        const currentLen = messages?.length || 0;
        if (currentLen > prevMessagesLength.current) {
            const newMessages = currentLen - prevMessagesLength.current;
            if (!showChat) {
                setUnreadCount((prev) => prev + newMessages);
            }
        }
        prevMessagesLength.current = currentLen;
    }, [messages, showChat]);

    useEffect(() => {
        if (showChat && chatListRef.current) {
            chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
        }
    }, [messages, showChat]);

    const handleToggleChat = () => {
        if (!showChat) {
            setUnreadCount(0);
        }
        onToggleChat();
    };

    const handleCloseChat = () => {
        setUnreadCount(0);
        onCloseChat();
    };

    return (
        <div className="pointer-events-none fixed bottom-3 right-3 z-50 flex flex-col items-end gap-2">
            {showChat && (
                <div
                    className="pointer-events-auto w-[min(360px,92vw)] flex flex-col overflow-hidden rounded-2xl border shadow-2xl"
                    style={{
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        maxHeight: "calc(100vh - 100px)",
                    }}
                >
                    {/* Header */}
                    <div
                        className="flex shrink-0 items-center justify-between border-b px-3 py-2"
                        style={{ borderColor: theme.border }}
                    >
                        <div
                            className="flex items-center gap-2 text-sm font-bold"
                            style={{ color: theme.textPrimary }}
                        >
                            <MessageCircle className="h-4 w-4" />
                            Trò chuyện
                        </div>
                        <button
                            onClick={handleCloseChat}
                            className="rounded-full p-1 transition hover:bg-black/10 cursor-pointer"
                            style={{ color: theme.textMuted }}
                            aria-label="Đóng khung chat"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Message list */}
                    <div
                        ref={chatListRef}
                        className="flex-1 overflow-y-auto px-3 py-3 scroll-smooth"
                    >
                        {messages?.length ? (
                            <div className="flex flex-col gap-2">
                                {messages.map((message, index) => {
                                    const isMine = message.senderId === userId;
                                    return (
                                        <div
                                            key={`${message.senderId}-${message.timestamp}-${index}`}
                                            className={isMine ? "self-end" : "self-start"}
                                        >
                                            <div className={`mb-1 flex ${isMine ? "justify-end" : "justify-start"}`}>
                                                <span
                                                    className={`rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-widest shadow-sm backdrop-blur-sm border border-white/5 ${
                                                        isMine ? 'bg-white/20' : 'bg-white/10'
                                                    }`}
                                                    style={{ color: isMine ? '#ffffff' : theme.textPrimary }}
                                                >
                                                    {message.senderName}
                                                </span>
                                            </div>
                                            <div
                                                className="max-w-full rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap wrap-anywhere"
                                                style={{
                                                    backgroundColor: isMine
                                                        ? theme.accent
                                                        : "rgba(0,0,0,0.08)",
                                                    color: isMine ? "#ffffff" : theme.textPrimary,
                                                }}
                                            >
                                                {message.text}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p
                                className="text-center text-xs italic"
                                style={{ color: theme.textMuted }}
                            >
                                Chưa có tin nhắn nào.
                            </p>
                        )}
                    </div>

                    {/* Error Toast & Input Container */}
                    <div className="relative shrink-0 border-t" style={{ borderColor: theme.border }}>
                        {rateLimitError && (
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 rounded bg-red-500/90 px-3 py-1.5 text-[11px] font-bold text-white shadow-lg backdrop-blur animate-in fade-in slide-in-from-bottom-2 whitespace-nowrap z-50">
                                {rateLimitError}
                            </div>
                        )}
                        {canSend ? (
                            <form
                                onSubmit={handleFormSubmit}
                                className="flex items-center gap-2 p-2"
                            >
                                <input
                                    value={chatText}
                                    onChange={(e) => onChatTextChange(e.target.value)}
                                    placeholder={inputPlaceholder}
                                    maxLength={500}
                                    className="flex-1 rounded-xl border bg-black/20 px-3 py-2 text-sm outline-none placeholder:opacity-50"
                                    style={{ borderColor: theme.border, color: theme.textPrimary }}
                                />
                            <button
                                type="submit"
                                disabled={!chatText.trim()}
                                className="rounded-xl p-2 text-white transition disabled:opacity-40 cursor-pointer"
                                style={{ backgroundColor: theme.accent }}
                            >
                                    <Send className="h-4 w-4" />
                                </button>
                            </form>
                        ) : (
                            <div
                                className="m-2 rounded-xl border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em]"
                                style={{
                                    borderColor: theme.border,
                                    color: theme.textMuted,
                                    backgroundColor: "rgba(255,255,255,0.04)",
                                }}
                            >
                                {sendBlockedMessage}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Peek notifications (board-only, optional) */}
            {hasPeekFeature && showPeekNotifications && incomingRequests.length > 0 && (
                <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="pointer-events-auto w-[min(360px,90vw)] overflow-hidden rounded-2xl border shadow-2xl"
                        style={{
                            backgroundColor: theme.surface,
                            borderColor: theme.border,
                            maxHeight: "min(60vh,450px)",
                        }}
                    >
                        <div
                            className="flex items-center justify-between border-b px-3 py-2"
                            style={{ borderColor: theme.border }}
                        >
                            <p
                                className="text-xs font-black uppercase tracking-wider"
                                style={{ color: theme.textPrimary }}
                            >
                                Yêu cầu ngó bài ({incomingRequests.length})
                            </p>
                            <button
                                onClick={onClosePeekNotifications}
                                className="rounded p-1 hover:bg-black/10 transition-all active:scale-95 cursor-pointer"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                        <div className="max-h-[calc(60vh-40px)] overflow-y-auto">
                            {incomingRequests.map((request) => (
                                <div
                                    key={request.requestId}
                                    className="border-b p-3 last:border-b-0"
                                    style={{ borderColor: theme.border }}
                                >
                                    <p
                                        className="mb-2 text-xs font-semibold"
                                        style={{ color: theme.textPrimary }}
                                    >
                                        <span className="text-blue-500">{request.fromPlayerName}</span> muốn ngó bạn
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onApprovePeek?.(request.requestId)}
                                            className="flex-1 rounded-lg bg-emerald-500 px-2 py-1 text-[10px] font-black uppercase text-white hover:bg-emerald-600 transition-all active:scale-95 hover:scale-102 shadow-md cursor-pointer"
                                        >
                                            Cho
                                        </button>
                                        <button
                                            onClick={() => onRejectPeek?.(request.requestId)}
                                            className="flex-1 rounded-lg bg-red-500 px-2 py-1 text-[10px] font-black uppercase text-white hover:bg-red-600 transition-all active:scale-95 hover:scale-102 shadow-md cursor-pointer"
                                        >
                                            No
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Trigger buttons row */}
            <div className="flex gap-2">
                {hasPeekFeature && peekRequests && peekRequests.length > 0 && (
                    <button
                        onClick={onTogglePeekNotifications}
                        className="pointer-events-auto relative rounded-full border p-3 shadow-lg backdrop-blur cursor-pointer"
                        style={{
                            backgroundColor: theme.surface,
                            borderColor: theme.border,
                            color: theme.textPrimary,
                        }}
                        aria-label="Yêu cầu ngó bài"
                    >
                        <Eye className="h-5 w-5" />
                        <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                            {peekRequests.length}
                        </span>
                    </button>
                )}
                <button
                    onClick={handleToggleChat}
                    className="pointer-events-auto relative rounded-full border p-3 shadow-lg backdrop-blur cursor-pointer"
                    style={{
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        color: theme.textPrimary,
                    }}
                    aria-label="Mở khung chat"
                >
                    <MessageCircle className="h-5 w-5" />
                    {unreadCount > 0 && !showChat && (
                        <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-md transition-all animate-bounce">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
}
