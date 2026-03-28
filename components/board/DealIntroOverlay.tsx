import { Sparkles } from "lucide-react";
import type { Player } from "./types";

interface DealIntroOverlayProps {
    isVisible: boolean;
    dealStep: number;
    dealingTargetUserId: string | null;
    players: Player[];
}

export default function DealIntroOverlay({
    isVisible,
    dealStep,
    dealingTargetUserId,
    players,
}: DealIntroOverlayProps) {
    if (!isVisible) return null;

    const dealOrder = players.filter((player) => player.status === "playing");
    if (dealOrder.length === 0) return null;

    return (
        <div className="pointer-events-none absolute inset-0 z-55 flex items-center justify-center">
            <div className="w-[min(680px,94vw)] rounded-3xl border border-indigo-300/40 bg-slate-950/70 p-4 text-white shadow-[0_0_40px_rgba(99,102,241,0.35)] backdrop-blur-sm">
                <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-indigo-200" />
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-100">Đang chia bài</p>
                    </div>
                    <p className="text-[11px] font-semibold text-indigo-100/90">Lượt nhận: {dealStep}</p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                    {dealOrder.map((player, index) => {
                        const highlighted = player.userId === dealingTargetUserId;
                        return (
                            <div
                                key={`deal-${player.userId}-${index}`}
                                className={`rounded-2xl border px-3 py-2 transition ${highlighted ? "border-indigo-200 bg-indigo-400/30 shadow-[0_0_20px_rgba(129,140,248,0.35)]" : "border-white/20 bg-white/5"}`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <p className="truncate text-sm font-black">{player.name}</p>
                                    {player.isBanker && (
                                        <span className="rounded-full bg-amber-300/25 px-2 py-0.5 text-[10px] font-black uppercase text-amber-100">
                                                Cái
                                        </span>
                                    )}
                                </div>
                                <p className="mt-1 text-[11px] uppercase tracking-wider text-indigo-100/75">
                                        {highlighted ? "Đang nhận bài..." : "Đã xếp vị trí"}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
