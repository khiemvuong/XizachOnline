interface SystemNoticeProps {
    message: string | null;
}

export default function SystemNotice({ message }: SystemNoticeProps) {
    if (!message) return null;

    return (
        <div className="pointer-events-none fixed left-1/2 top-4 z-60 -translate-x-1/2">
            <div className="rounded-2xl border border-amber-300/60 bg-amber-500/90 px-4 py-2 text-xs font-black uppercase tracking-wide text-amber-950 shadow-xl">
                {message}
            </div>
        </div>
    );
}
