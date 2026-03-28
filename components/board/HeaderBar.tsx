import { LogOut, Mic, MicOff, Settings2, SkipForward } from "lucide-react";
import { formatGameState, type Player, type Room } from "./types";

interface HeaderBarProps {
    room: Room;
    roomId: string;
    compact: boolean;
    me?: Player;
    isMicOn: boolean;
    onToggleMic: () => void;
    onOpenSettings: () => void;
    onToggleSkip: () => void;
    onLeave: () => void;
}

export default function HeaderBar({
    room,
    roomId,
    compact,
    me,
    isMicOn,
    onToggleMic,
    onOpenSettings,
    onToggleSkip,
    onLeave,
}: HeaderBarProps) {
    const roomCode = roomId.toUpperCase();

    return (
        <header
            className="relative z-20 flex shrink-0 items-center justify-between border-b px-3 backdrop-blur-md sm:px-5"
            style={{
                height: compact
                    ? "var(--room-header-height-mobile)"
                    : "var(--room-header-height)",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                borderColor: "var(--panel-border)",
                boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.12)",
            }}
        >
            <div className="min-w-0 space-y-1">
                <div className="flex min-w-0 items-center gap-2">
                    <span
                        className="shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em]"
                        style={{
                            borderColor: "rgba(31, 122, 103, 0.35)",
                            backgroundColor: "rgba(31, 122, 103, 0.12)",
                            color: "var(--accent-primary)",
                        }}
                    >
                        Mã phòng
                    </span>
                    <h1
                        className="truncate text-base font-black uppercase tracking-[0.05em] sm:text-2xl"
                        style={{
                            color: "var(--text-primary)",
                            textShadow: "0 0 12px rgba(31, 122, 103, 0.18)",
                        }}
                    >
                        {roomCode}
                    </h1>
                </div>

                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] sm:text-xs" style={{ color: "var(--text-muted)" }}>
                    {formatGameState(room.state)}
                </p>

                {room.pendingBankerUserId && room.state !== "IDLE" && (
                    <p className="truncate text-[10px] font-bold uppercase tracking-wider sm:text-[11px]" style={{ color: "var(--accent-primary)" }}>
                        Cái ván sau: {room.players.find((player) => player.userId === room.pendingBankerUserId)?.name ?? "Đang chờ"}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={onToggleMic}
                    className="rounded-xl border p-2 transition-all"
                    style={{
                        backgroundColor: "var(--panel-surface)",
                        borderColor: "var(--panel-border)",
                        color: "var(--text-primary)",
                    }}
                    aria-label="Bật tắt microphone"
                >
                    {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </button>

                <button
                    onClick={onOpenSettings}
                    className="rounded-xl border p-2"
                    style={{
                        backgroundColor: "var(--panel-surface)",
                        borderColor: "var(--panel-border)",
                        color: "var(--text-primary)",
                    }}
                    aria-label="Mở cài đặt âm thanh"
                    title="Cài đặt âm thanh"
                >
                    <Settings2 className="h-4 w-4" />
                </button>

                {room.state === "IDLE" && me && !me.isBanker && (
                    <button
                        onClick={onToggleSkip}
                        className="hidden rounded-xl border px-3 py-2 text-xs font-bold uppercase md:flex"
                        style={{
                            backgroundColor: "var(--panel-surface)",
                            borderColor: "var(--panel-border)",
                            color: "var(--text-primary)",
                        }}
                    >
                        <SkipForward className="mr-1 h-4 w-4" />
                        {me.isSpectator ? "Đã bỏ lượt" : "Nghỉ 1 ván"}
                    </button>
                )}

                <button
                    onClick={onLeave}
                    className="rounded-xl border p-2"
                    style={{
                        backgroundColor: "var(--panel-surface)",
                        borderColor: "var(--panel-border)",
                        color: "var(--text-primary)",
                    }}
                    aria-label="Rời phòng"
                >
                    <LogOut className="h-4 w-4" />
                </button>
            </div>
        </header>
    );
}
