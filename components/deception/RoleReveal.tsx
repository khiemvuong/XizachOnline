"use client";

import { useMemo, useState, useEffect, useRef, useCallback, type CSSProperties } from "react";
import { ArrowLeft, Check, Fingerprint, ShieldCheck } from "lucide-react";
import type { DeceptionPlayer, DeceptionRole, DeceptionRoom } from "@/server/game/DeceptionTypes";
import { getRoleImageUrl } from "@/utils/deceptionAssets";

const ROLE_META: Record<
  DeceptionRole,
  {
    color: string;
    team: string;
    title: string;
    quote: string;
    image: string;
  }
> = {
  ForensicScientist: {
    color: "var(--deception-cyan)",
    team: "PHE ĐIỀU TRA",
    title: "PHÁP Y",
    quote: '"Xác chết không bao giờ nói dối, chỉ có kẻ thủ ác mới chối cãi."',
    image: getRoleImageUrl("forensic"),
  },
  Murderer: {
    color: "var(--deception-red)",
    team: "PHE SÁT NHÂN",
    title: "SÁT NHÂN",
    quote: '"Một tội ác hoàn hảo không tồn tại, chỉ là thám tử chưa đủ vĩ đại."',
    image: getRoleImageUrl("murderer"),
  },
  Accomplice: {
    color: "var(--deception-red)",
    team: "PHE SÁT NHÂN",
    title: "ĐỒNG PHẠM",
    quote: '"Bóng tối là đồng minh tốt nhất, và sự thật là kẻ thù phải bị che khuất."',
    image: getRoleImageUrl("accomplice"),
  },
  Witness: {
    color: "#10b981",
    team: "PHE ĐIỀU TRA",
    title: "NHÂN CHỨNG",
    quote: '"Đôi mắt tôi đã thấy những gì không nên thấy, sự im lặng là cái giá của sinh tồn."',
    image: getRoleImageUrl("witness"),
  },
  Investigator: {
    color: "#10b981",
    team: "PHE ĐIỀU TRA",
    title: "ĐIỀU TRA VIÊN",
    quote: '"Khi ta loại trừ những điều không thể, phần còn lại, dù khó tin đến đâu, cũng là sự thật."',
    image: getRoleImageUrl("investigator"),
  },
};

type RelatedIntelEntry = {
  userId: string;
  name: string;
  roleTitle: string;
};

export default function RoleReveal({
  gameState,
  me,
  socket,
  slackerNames,
  onSlackerDismiss,
  onReady,
  onExit,
}: {
  gameState: DeceptionRoom;
  me?: DeceptionPlayer;
  socket: import("socket.io-client").Socket | null;
  slackerNames: string[] | null;
  onSlackerDismiss: () => void;
  onReady: () => void;
  onExit: () => void;
}) {
  const [isRevealing, setIsRevealing] = useState(false);
  const [failedImageSource, setFailedImageSource] = useState<string | null>(null);
  const [holdProgress, setHoldProgress] = useState(0); // 0–100
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdRafRef = useRef<number | null>(null);
  const holdStartRef = useRef<number>(0);
  const HOLD_DURATION = 2000;

  const SLACKER_LINES = [
    "Lẹ cái tay lên!",
    "Ngủ gật hả??",
    "Đang làm gì vậy trời!",
    "Mấy con ma này đi đâu rồi?",
    "Cả phòng chờ mấy người đó!",
    "Tỉnh dậy đi cha!",
    "Nhanh lên không thì về nhà đi!",
  ];

  const startHold = useCallback(() => {
    holdStartRef.current = Date.now();
    setHoldProgress(0);

    const tick = () => {
      const elapsed = Date.now() - holdStartRef.current;
      const progress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setHoldProgress(progress);
      if (progress < 100) {
        holdRafRef.current = requestAnimationFrame(tick);
      }
    };
    holdRafRef.current = requestAnimationFrame(tick);

    holdTimerRef.current = setTimeout(() => {
      // Broadcast to server — server will emit back to all clients
      socket?.emit("slackerAlert");
      setHoldProgress(0);
    }, HOLD_DURATION);
  }, [socket]);

  const cancelHold = useCallback(() => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (holdRafRef.current) cancelAnimationFrame(holdRafRef.current);
    holdTimerRef.current = null;
    holdRafRef.current = null;
    setHoldProgress(0);
  }, []);
  
  // Prevent zooming on mobile and reset any stuck zoom state
  useEffect(() => {
    // Force viewport to reset zoom level and prevent future zooming
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    const originalContent = viewportMeta?.getAttribute("content") ?? "";
    const noZoomContent = "width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no";
    if (viewportMeta) {
      viewportMeta.setAttribute("content", noZoomContent);
    } else {
      const meta = document.createElement("meta");
      meta.name = "viewport";
      meta.content = noZoomContent;
      document.head.appendChild(meta);
    }

    // Safari iOS: gesturestart
    const handleGestureStart = (e: Event) => {
      e.preventDefault();
    };

    // Chrome Android / all browsers: block pinch-to-zoom via multi-touch
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Block double-tap zoom
    let lastTap = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTap < 300) {
        e.preventDefault();
      }
      lastTap = now;
    };

    document.addEventListener("gesturestart", handleGestureStart, { capture: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false, capture: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: false, capture: true });

    return () => {
      document.removeEventListener("gesturestart", handleGestureStart, { capture: true });
      document.removeEventListener("touchmove", handleTouchMove, { capture: true } as EventListenerOptions);
      document.removeEventListener("touchend", handleTouchEnd, { capture: true } as EventListenerOptions);

      // Restore original viewport meta
      if (viewportMeta && originalContent) {
        viewportMeta.setAttribute("content", originalContent);
      }
    };
  }, []);

  const connectedPlayers = gameState.players.filter(
    (player) => player.status === "connected" && !player.isSpectator,
  );
  const readyCount = connectedPlayers.filter((player) => player.isReady).length;

  // Auto-dismiss slacker popup after 5s
  useEffect(() => {
    if (!slackerNames) return;
    const t = setTimeout(() => onSlackerDismiss(), 3000);
    return () => clearTimeout(t);
  }, [slackerNames, onSlackerDismiss]);

  const randomSlackerLine = useMemo(
    () => SLACKER_LINES[Math.floor(Math.random() * SLACKER_LINES.length)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slackerNames],
  );

  const myRole = me?.role;
  const meta = myRole ? ROLE_META[myRole] : undefined;
  const roleImageSource = meta?.image || "";
  const imageFailed = Boolean(roleImageSource && failedImageSource === roleImageSource);

  const relatedIntel = useMemo(() => {
    if (!me) return [] as RelatedIntelEntry[];

    return gameState.players
      .filter((player): player is DeceptionPlayer & { role: DeceptionRole } => (
        player.userId !== me.userId && Boolean(player.role)
      ))
      .map((player) => ({
        userId: player.userId,
        name: player.name,
        roleTitle: ROLE_META[player.role].title,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "vi"))
      .slice(0, 3);
  }, [gameState.players, me]);

  const roleStyle = {
    "--deception-role-accent": meta?.color ?? "var(--deception-cyan)",
    WebkitTouchCallout: "none",
    WebkitUserSelect: "none",
  } as CSSProperties;

  return (
    <div className="deception-room-bg deception-role-reveal-shell flex h-dvh flex-col overflow-hidden touch-none">
      <div className="deception-role-backdrop-layer" aria-hidden />

      <button
        onClick={onExit}
        className="deception-icon-btn deception-role-floating-back absolute right-4 top-4 z-20"
        title="Thoát về sảnh"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      <main className="deception-role-reveal-stage relative z-10 flex min-h-0 flex-1 items-center justify-center px-3 py-2 sm:px-4 sm:py-2.5">
        <section
          className="deception-role-centered-wrap deception-role-fit-wrap relative w-full select-none touch-none"
          style={roleStyle}
          onPointerUp={() => setIsRevealing(false)}
          onPointerLeave={() => setIsRevealing(false)}
          onPointerCancel={() => setIsRevealing(false)}
          onContextMenu={(event) => event.preventDefault()}
        >
          <div className="deception-role-centered-glow" aria-hidden />

          <div className="deception-card deception-role-centered-card deception-role-fit-card relative z-10 rounded-2xl border border-(--deception-border) p-4 sm:p-5 transition-all duration-300">
            <div className="deception-role-dossier-head">
              <span className="deception-role-dossier-chip font-bold">HỒ SƠ TUYỆT MẬT</span>
              <ShieldCheck className="h-5 w-5 text-(--deception-role-accent)/70" />
            </div>

            <p className="deception-role-security-note mt-2 font-bold tracking-widest uppercase">
              Nhấn Giữ Để Giải Mật
            </p>

            <div className="deception-role-main mt-2 min-h-0">
              <div className="deception-role-visual-pane">
                <div
                  className="deception-role-reveal-image-wrap relative overflow-hidden rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)]"
                  onPointerDown={() => setIsRevealing(true)}
                  onPointerUp={() => setIsRevealing(false)}
                  onPointerLeave={() => setIsRevealing(false)}
                  onPointerCancel={() => setIsRevealing(false)}
                >
                  {!imageFailed && meta && roleImageSource ? (
                    <div className="deception-role-reveal-image relative mx-auto overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={roleImageSource}
                        alt={myRole || "Unknown role"}
                        loading="eager"
                        decoding="async"
                        draggable={false}
                        className={`deception-role-portrait pointer-events-none select-none h-full w-full object-cover transition-all duration-200 ${
                          isRevealing
                            ? ""
                            : "blur-xl saturate-0 brightness-[0.08] contrast-50"
                        }`}
                        onError={() => setFailedImageSource(roleImageSource || "__unknown__")}
                      />
                    </div>
                  ) : (
                    <div className="deception-role-reveal-image mx-auto flex flex-col items-center justify-center gap-2 text-center text-(--deception-cyan)">
                      <Fingerprint className="h-14 w-14 opacity-70" />
                      <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-(--on-surface-variant)">
                        Không thể tải ảnh vai trò
                      </p>
                    </div>
                  )}

                  {!isRevealing && (
                    <div className="deception-role-mask-overlay">
                      <span className="deception-role-seal-stamp">NIÊM PHONG</span>
                    </div>
                  )}

                  <span className="deception-role-corner deception-role-corner-tl" />
                  <span className="deception-role-corner deception-role-corner-br" />
                </div>
              </div>

              <aside className="deception-role-side-pane min-h-0">
                <section
                  className="deception-role-name-card relative overflow-hidden rounded-lg border border-(--deception-border) bg-[rgba(0,0,0,0.22)] p-3 sm:p-4"
                  onPointerDown={() => setIsRevealing(true)}
                  onPointerUp={() => setIsRevealing(false)}
                  onPointerLeave={() => setIsRevealing(false)}
                  onPointerCancel={() => setIsRevealing(false)}
                >
                  <div
                    className={`deception-role-name-content transition-all duration-200 ${
                      isRevealing ? "" : "blur-[10px] opacity-20"
                    }`}
                  >
                    <h1 className="deception-role-reveal-title text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[0.95] font-black uppercase tracking-[0.05em] wrap-break-word">
                      {meta?.title || "VÔ DANH"}
                    </h1>
                    <p className="mt-1.5 text-sm font-bold uppercase tracking-[0.25em] text-(--on-surface-variant)">
                      {meta?.team || "Đang xác thực hồ sơ..."}
                    </p>
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-bold italic leading-relaxed text-(--deception-role-accent)">
                        {meta?.quote || "Đang kết nối cơ sở dữ liệu tội phạm..."}
                      </p>
                    </div>
                  </div>

                  {!isRevealing && (
                    <div className="deception-role-mask-overlay p-3">
                      <span className="deception-role-seal-stamp deception-role-seal-stamp-sm">NIÊM PHONG</span>
                    </div>
                  )}
                </section>

                <section
                  className="deception-role-related-card relative overflow-hidden flex flex-col flex-1 rounded-lg border border-(--deception-border) bg-[rgba(0,0,0,0.22)] p-3"
                  onPointerDown={() => setIsRevealing(true)}
                  onPointerUp={() => setIsRevealing(false)}
                  onPointerLeave={() => setIsRevealing(false)}
                  onPointerCancel={() => setIsRevealing(false)}
                >
                  <div
                    className={`deception-role-related-content flex flex-col flex-1 min-h-0 transition-all duration-200 ${
                      isRevealing ? "" : "blur-[10px] opacity-20"
                    }`}
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-(--deception-cyan)">Liên Đới</p>
                    <ul className="deception-role-related-list mt-2 space-y-2 flex-1 overflow-y-auto min-h-0 pr-1">
                      {relatedIntel.map((intel) => (
                        <li key={intel.userId} className="rounded-md border border-(--deception-border) bg-[rgba(255,255,255,0.02)] px-2.5 py-2">
                          <div className="flex w-full items-center justify-between gap-2 text-sm">
                            <span className="min-w-0 flex-1 truncate font-bold text-(--on-surface)">{intel.name}</span>
                            <span className="shrink-0 text-[11px] font-black uppercase tracking-[0.18em] text-(--deception-cyan)">{intel.roleTitle}</span>
                          </div>
                        </li>
                      ))}
                      {/* Fill up to 3 items with placeholders for visual consistency */}
                      {Array.from({ length: Math.max(0, 3 - relatedIntel.length) }).map((_, idx) => (
                        <li key={`placeholder-${idx}`} className="rounded-md border border-dashed border-(--deception-border)/30 bg-transparent px-2.5 py-2 opacity-30">
                          <div className="flex w-full items-center justify-between gap-2 text-sm">
                            <span className="font-medium italic text-(--on-surface-variant)">Chưa xác định...</span>
                            <span className="text-[10px] uppercase tracking-widest text-(--on-surface-variant)/50">---</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {!isRevealing && (
                    <div className="deception-role-mask-overlay p-3">
                      <span className="deception-role-seal-stamp deception-role-seal-stamp-sm">NIÊM PHONG</span>
                    </div>
                  )}
                </section>

                <div className="deception-role-action-row">
                  {/* Ready count pill – hold 3s to see who's slacking */}
                  <span
                    className="deception-role-status-pill relative select-none cursor-pointer overflow-hidden"
                    title="Nhấn giữ 3 giây để xem ai chưa sẵn sàng"
                    onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); startHold(); }}
                    onPointerUp={cancelHold}
                    onPointerLeave={cancelHold}
                    onPointerCancel={cancelHold}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    {/* progress fill */}
                    {holdProgress > 0 && (
                      <span
                        className="pointer-events-none absolute inset-0 origin-left"
                        style={{
                          background: "rgba(var(--deception-cyan-rgb,0,210,211),0.25)",
                          transform: `scaleX(${holdProgress / 100})`,
                          transition: "transform 0.05s linear",
                        }}
                      />
                    )}
                    <span className="relative">{readyCount}/{connectedPlayers.length}</span>
                  </span>
                  <button
                    onClick={onReady}
                    disabled={!me || me.isReady}
                    className="deception-btn-cyan deception-role-reveal-ready deception-role-ready-compact flex-1 px-4 py-2.5 text-sm font-black uppercase tracking-[0.2em] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <span>{me?.isReady ? "Đôn" : "Oke dzô"}</span>
                    <Check className="h-4 w-4" />
                  </button>
                </div>

                {/* Slacker popup — driven by server broadcast */}
                {slackerNames !== null && (
                  <div
                    className="deception-slacker-overlay fixed inset-0 z-9999 flex flex-col items-center justify-center px-6 text-center"
                    style={{
                      background: "rgba(0,0,0,0.88)",
                      backdropFilter: "blur(16px) saturate(1.5)",
                      WebkitBackdropFilter: "blur(16px) saturate(1.5)",
                      animation: "deception-slacker-in 0.35s cubic-bezier(0.22,1,0.36,1) both",
                    }}
                    onClick={onSlackerDismiss}
                  >
                    <p className="deception-slacker-headline font-black uppercase tracking-[0.06em] leading-[1.05]">
                      {randomSlackerLine}
                    </p>

                    {slackerNames.length === 0 ? (
                      <p className="mt-3 text-lg font-bold text-emerald-400 tracking-widest uppercase">
                        Tất cả đã sẵn sàng ✓
                      </p>
                    ) : (
                      <ul className="deception-slacker-list mt-4 flex flex-col items-center gap-2 w-full max-w-sm">
                        {slackerNames.map((name,index) => (
                          <li
                            key={`${name}-${index}`}
                            className="w-full rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-2"
                            style={{ boxShadow: "0 0 20px rgba(239,68,68,0.15)" }}
                          >
                            <span className="deception-slacker-name font-black uppercase tracking-[0.12em]">
                              {name}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </aside>
            </div>

            <footer className="deception-role-foot flex items-center justify-between gap-3 border-t border-[rgba(255,255,255,0.08)] pt-2 text-[9px] font-bold uppercase tracking-[0.18em] text-(--on-surface-variant)">
              <span className="shrink-0">Mức Độ: Tối Cao</span>
              <span className="truncate">Chuyên án: #{gameState.id}-HK</span>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}
