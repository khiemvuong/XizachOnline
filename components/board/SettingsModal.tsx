import { Settings2, X } from "lucide-react";

interface SettingsModalProps {
    isOpen: boolean;
    sfxEnabled: boolean;
    noiseSuppressionEnabled: boolean;
    onClose: () => void;
    onToggleSfx: () => void;
    onToggleNoiseSuppression: () => void;
}

export default function SettingsModal({
    isOpen,
    sfxEnabled,
    noiseSuppressionEnabled,
    onClose,
    onToggleSfx,
    onToggleNoiseSuppression,
}: SettingsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div
                className="w-full max-w-md rounded-3xl border shadow-2xl"
                style={{ backgroundColor: "var(--panel-surface)", borderColor: "var(--panel-border)" }}
            >
                <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--panel-border)" }}>
                    <div className="flex items-center gap-2">
                        <Settings2 className="h-5 w-5 text-(--accent-primary)" />
                        <p className="text-sm font-black uppercase tracking-wider text-(--text-primary)">Cài đặt âm thanh</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1 transition hover:bg-black/10"
                        aria-label="Đóng cài đặt"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="space-y-3 px-4 py-4">
                    <button
                        onClick={onToggleSfx}
                        className="flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left"
                        style={{ borderColor: "var(--panel-border)", backgroundColor: "var(--surface)" }}
                    >
                        <div>
                            <p className="text-sm font-bold text-(--text-primary)">Hiệu ứng âm thanh trong ván</p>
                            <p className="text-xs text-(--text-muted)">Âm rút bài, chia bài và bắt đầu lượt</p>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${sfxEnabled ? "bg-emerald-500/20 text-emerald-700" : "bg-black/10 text-(--text-muted)"}`}>
                            {sfxEnabled ? "Bật" : "Tắt"}
                        </span>
                    </button>

                    <button
                        onClick={onToggleNoiseSuppression}
                        className="flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left"
                        style={{ borderColor: "var(--panel-border)", backgroundColor: "var(--surface)" }}
                    >
                        <div>
                            <p className="text-sm font-bold text-(--text-primary)">Lọc tiếng ồn microphone</p>
                            <p className="text-xs text-(--text-muted)">Giảm tiếng quạt, nhạc nền, tạp âm xung quanh</p>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${noiseSuppressionEnabled ? "bg-indigo-500/20 text-indigo-700" : "bg-black/10 text-(--text-muted)"}`}>
                            {noiseSuppressionEnabled ? "Bật" : "Tắt"}
                        </span>
                    </button>

                    <p className="rounded-xl bg-black/5 px-3 py-2 text-[11px] text-(--text-muted)">
                        Gợi ý: Khi dùng loa ngoài, nên bật lọc tiếng ồn để tránh âm thanh máy lọt vào mic.
                    </p>
                </div>
            </div>
        </div>
    );
}
