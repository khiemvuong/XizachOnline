import { Eye, MessageCircle, Send, X } from "lucide-react";
import type { FormEvent, RefObject } from "react";
import type { PeekRequest, Room } from "./types";

interface ChatDropdownProps {
    room: Room;
    userId: string;
    showChat: boolean;
    showPeekNotifications: boolean;
    chatText: string;
    chatEndRef: RefObject<HTMLDivElement | null>;
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
    chatEndRef,
    onToggleChat,
    onCloseChat,
    onTogglePeekNotifications,
    onClosePeekNotifications,
    onChatTextChange,
    onSendChat,
    onApprovePeek,
    onRejectPeek,
}: ChatDropdownProps) {
    const incomingRequests = (room.peekRequests || []).filter((r) => r.toUserId === userId);

    return (
        <div className="pointer-events-none absolute bottom-3 right-3 z-40 flex flex-col items-end gap-2">
            {showChat && (
                <div
                    className="pointer-events-auto w-[min(360px,92vw)] overflow-hidden rounded-2xl border shadow-2xl"
                    style={{
                        backgroundColor: "var(--panel-surface)",
                        borderColor: "var(--panel-border)",
                        maxHeight: "min(52vh, 430px)",
                    }}
                >
                    <div
                        className="flex items-center justify-between border-b px-3 py-2"
                        style={{ borderColor: "var(--panel-border)" }}
                    >
                        <div className="flex items-center gap-2 text-sm font-bold text-(--text-primary)">
                            <MessageCircle className="h-4 w-4" />
                            Trò chuyện
                        </div>
                        <button
                            onClick={onCloseChat}
                            className="rounded-full p-1 text-(--text-muted) transition hover:bg-black/10"
                            aria-label="Đóng khung chat"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div
                        className="overflow-y-auto px-3 py-3"
                        style={{ maxHeight: "calc(min(52vh, 430px) - 96px)" }}
                    >
                        {room.messages?.length ? (
                            <div className="flex flex-col gap-2">
                                {room.messages.map((message, index) => {
                                    const mine = message.senderId === userId;
                                    return (
                                        <div
                                            key={`${message.senderId}-${message.timestamp}-${index}`}
                                            className={mine ? "self-end" : "self-start"}
                                        >
                                            <p className="mb-1 text-[10px] font-semibold uppercase text-(--text-muted)">
                                                {message.senderName}
                                            </p>
                                            <div
                                                className="max-w-full rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap wrap-anywhere"
                                                style={{
                                                    backgroundColor: mine
                                                        ? "var(--accent-primary)"
                                                        : "rgba(0,0,0,0.08)",
                                                    color: mine ? "#ffffff" : "var(--text-primary)",
                                                }}
                                            >
                                                {message.text}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={chatEndRef} />
                            </div>
                        ) : (
                            <p className="text-center text-xs italic text-(--text-muted)">
                                Chưa có tin nhắn nào.
                            </p>
                        )}
                    </div>

                    <form
                        onSubmit={onSendChat}
                        className="flex items-center gap-2 border-t p-2"
                        style={{ borderColor: "var(--panel-border)" }}
                    >
                        <input
                            value={chatText}
                            onChange={(event) => onChatTextChange(event.target.value)}
                            placeholder="Nhập tin nhắn"
                            className="flex-1 rounded-xl border bg-white/70 px-3 py-2 text-sm outline-none"
                            style={{ borderColor: "var(--panel-border)" }}
                        />
                        <button
                            type="submit"
                            disabled={!chatText.trim()}
                            className="rounded-xl p-2 text-white transition disabled:opacity-40"
                            style={{ backgroundColor: "var(--accent-primary)" }}
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </form>
                </div>
            )}

            {showPeekNotifications && incomingRequests.length > 0 && (
                <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="pointer-events-auto w-[min(360px,90vw)] overflow-hidden rounded-2xl border shadow-2xl"
                        style={{
                            backgroundColor: "var(--panel-surface)",
                            borderColor: "var(--panel-border)",
                            maxHeight: "min(60vh, 450px)",
                        }}
                    >
                        <div
                            className="flex items-center justify-between border-b px-3 py-2"
                            style={{ borderColor: "var(--panel-border)" }}
                        >
                            <p className="text-xs font-black uppercase tracking-wider text-(--text-primary)">
                                Yêu cầu ngó bài ({incomingRequests.length})
                            </p>
                            <button
                                onClick={onClosePeekNotifications}
                                className="rounded p-1 hover:bg-black/10 transition-all active:scale-95"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                        <div className="max-h-[calc(60vh-40px)] overflow-y-auto">
                            {incomingRequests.map((request: PeekRequest) => (
                                <div
                                    key={request.requestId}
                                    className="border-b border-black/10 p-3 last:border-b-0"
                                    style={{ borderColor: "var(--panel-border)" }}
                                >
                                    <p className="mb-2 text-xs font-semibold text-(--text-primary)">
                                        <span className="text-blue-500">{request.fromPlayerName}</span> muốn ngó bạn
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onApprovePeek(request.requestId)}
                                            className="flex-1 rounded-lg bg-emerald-500 px-2 py-1 text-[10px] font-black uppercase text-white hover:bg-emerald-600 transition-all active:scale-95 hover:scale-102 shadow-md"
                                        >
                                            Cho
                                        </button>
                                        <button
                                            onClick={() => onRejectPeek(request.requestId)}
                                            className="flex-1 rounded-lg bg-red-500 px-2 py-1 text-[10px] font-black uppercase text-white hover:bg-red-600 transition-all active:scale-95 hover:scale-102 shadow-md"
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

            <div className="flex gap-2">
                {(room.peekRequests && room.peekRequests.length > 0) && (
                    <button
                        onClick={onTogglePeekNotifications}
                        className="pointer-events-auto relative rounded-full border p-3 text-(--text-primary) shadow-lg backdrop-blur"
                        style={{
                            backgroundColor: "var(--panel-surface)",
                            borderColor: "var(--panel-border)",
                        }}
                        aria-label="Yêu cầu ngó bài"
                    >
                        <Eye className="h-5 w-5" />
                        <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                            {room.peekRequests.length}
                        </span>
                    </button>
                )}
                <button
                    onClick={onToggleChat}
                    className="pointer-events-auto rounded-full border p-3 text-(--text-primary) shadow-lg backdrop-blur"
                    style={{
                        backgroundColor: "var(--panel-surface)",
                        borderColor: "var(--panel-border)",
                    }}
                    aria-label="Mở khung chat"
                >
                    <MessageCircle className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}
