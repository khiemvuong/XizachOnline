"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { ArrowLeft, Check, Fingerprint, ShieldCheck } from "lucide-react";
import type { DeceptionPlayer, DeceptionRole, DeceptionRoom } from "@/server/game/DeceptionTypes";
import forensicRoleImage from "@/public/deception_roles/forensic.jpeg";
import murdererRoleImage from "@/public/deception_roles/murderer.jpeg";
import accompliceRoleImage from "@/public/deception_roles/accomplice.jpeg";
import witnessRoleImage from "@/public/deception_roles/witness.jpeg";
import investigatorRoleImage from "@/public/deception_roles/investigator.jpeg";

const ROLE_META: Record<
  DeceptionRole,
  {
    color: string;
    team: string;
    title: string;
    desc: string;
    image: string;
  }
> = {
  ForensicScientist: {
    color: "var(--deception-cyan)",
    team: "PHE ĐIỀU TRA",
    title: "PHÁP Y",
    desc: "Bạn là Nhà Khoa Học Pháp Y. Dẫn dắt điều tra bằng dấu hiện trường.",
    image: forensicRoleImage.src,
  },
  Murderer: {
    color: "var(--deception-red)",
    team: "PHE SÁT NHÂN",
    title: "SÁT NHÂN",
    desc: "Bạn là Kẻ Giết Người. Chọn hung khí và manh mối để che giấu tội ác.",
    image: murdererRoleImage.src,
  },
  Accomplice: {
    color: "var(--deception-purple)",
    team: "PHE SÁT NHÂN",
    title: "ĐỒNG PHẠM",
    desc: "Bạn là Đồng Phạm. Hỗ trợ hung thủ và đánh lạc hướng điều tra.",
    image: accompliceRoleImage.src,
  },
  Witness: {
    color: "var(--deception-witness)",
    team: "PHE ĐIỀU TRA",
    title: "NHÂN CHỨNG",
    desc: "Bạn là Nhân Chứng. Biết hung thủ, nhưng phải sống sót để chiến thắng.",
    image: witnessRoleImage.src,
  },
  Investigator: {
    color: "var(--deception-amber)",
    team: "PHE ĐIỀU TRA",
    title: "ĐIỀU TRA VIÊN",
    desc: "Bạn là Điều Tra Viên. Phân tích dữ kiện, truy tìm hung thủ.",
    image: investigatorRoleImage.src,
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
  onReady,
  onExit,
}: {
  gameState: DeceptionRoom;
  me?: DeceptionPlayer;
  onReady: () => void;
  onExit: () => void;
}) {
  const [isRevealing, setIsRevealing] = useState(false);
  const [failedImageSource, setFailedImageSource] = useState<string | null>(null);

  const connectedPlayers = gameState.players.filter(
    (player) => player.status === "connected" && !player.isSpectator,
  );
  const readyCount = connectedPlayers.filter((player) => player.isReady).length;

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
  } as CSSProperties;

  return (
    <div className="deception-room-bg deception-role-reveal-shell flex h-dvh flex-col overflow-hidden">
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
          className="deception-role-centered-wrap deception-role-fit-wrap relative w-full max-w-4xl select-none touch-none"
          style={roleStyle}
          onPointerUp={() => setIsRevealing(false)}
          onPointerLeave={() => setIsRevealing(false)}
          onPointerCancel={() => setIsRevealing(false)}
          onContextMenu={(event) => event.preventDefault()}
        >
          <div className="deception-role-centered-glow" aria-hidden />

          <div className="deception-card deception-role-centered-card deception-role-fit-card relative z-10 rounded-2xl border border-(--deception-border) p-4 sm:p-5 transition-all duration-300">
            <div className="deception-role-dossier-head">
              <span className="deception-role-dossier-chip">Authentic Dossier</span>
              <ShieldCheck className="h-5 w-5 text-(--deception-role-accent)/70" />
            </div>

            <p className="deception-role-security-note mt-2">
              Press & Hold To Declassify
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
                    <div className="deception-role-reveal-image relative mx-auto aspect-square w-full max-w-none overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={roleImageSource}
                        alt={myRole || "Unknown role"}
                        loading="eager"
                        decoding="async"
                        draggable={false}
                        className={`deception-role-portrait h-full w-full object-cover transition-all duration-200 ${
                          isRevealing
                            ? ""
                            : "scale-[1.08] blur-xl saturate-0 brightness-[0.08] contrast-50"
                        }`}
                        onError={() => setFailedImageSource(roleImageSource || "__unknown__")}
                      />
                    </div>
                  ) : (
                    <div className="deception-role-reveal-image mx-auto flex aspect-square w-full max-w-none flex-col items-center justify-center gap-2 text-center text-(--deception-cyan)">
                      <Fingerprint className="h-14 w-14 opacity-70" />
                      <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-(--on-surface-variant)">
                        Không thể tải ảnh vai trò
                      </p>
                    </div>
                  )}

                  {!isRevealing && (
                    <div className="deception-role-mask-overlay">
                      <span className="deception-role-seal-stamp">SEALED</span>

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
                    <h1 className="deception-role-reveal-title text-[clamp(1.28rem,2.2vw,1.95rem)] leading-[0.95] font-black uppercase tracking-[0.05em] wrap-break-word">
                      {meta?.title || "UNKNOWN"}
                    </h1>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-(--on-surface-variant)">
                      {meta?.team || "Đang xác thực vai trò"}
                    </p>
                    <p className="mt-2 text-xs leading-snug text-(--on-surface-variant)">
                      {meta?.desc || "Đang chờ máy chủ cấp quyền vai trò..."}
                    </p>
                  </div>

                  {!isRevealing && (
                    <div className="deception-role-mask-overlay p-3">
                      <span className="deception-role-seal-stamp deception-role-seal-stamp-sm">SEALED</span>
                    </div>
                  )}
                </section>

                <section
                  className="deception-role-related-card relative overflow-hidden rounded-lg border border-(--deception-border) bg-[rgba(0,0,0,0.22)] p-3"
                  onPointerDown={() => setIsRevealing(true)}
                  onPointerUp={() => setIsRevealing(false)}
                  onPointerLeave={() => setIsRevealing(false)}
                  onPointerCancel={() => setIsRevealing(false)}
                >
                  <div
                    className={`deception-role-related-content transition-all duration-200 ${
                      isRevealing ? "" : "blur-[10px] opacity-20"
                    }`}
                  >
                    <p className="text-[10px] uppercase tracking-[0.2em] text-(--deception-cyan)">Related Parties</p>
                    {relatedIntel.length === 0 ? (
                      <p className="mt-1 text-xs leading-snug text-(--on-surface-variant)">Chưa có dữ kiện liên quan ở giai đoạn này.</p>
                    ) : (
                      <ul className="deception-role-related-list mt-1.5 space-y-1.5">
                        {relatedIntel.map((intel) => (
                          <li key={intel.userId} className="rounded-md border border-(--deception-border) bg-[rgba(255,255,255,0.02)] px-2 py-1.5">
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="truncate font-semibold text-(--on-surface)">{intel.name}</span>
                              <span className="shrink-0 uppercase tracking-[0.14em] text-(--deception-cyan)">{intel.roleTitle}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {!isRevealing && (
                    <div className="deception-role-mask-overlay p-3">
                      <span className="deception-role-seal-stamp deception-role-seal-stamp-sm">SEALED</span>
                    </div>
                  )}
                </section>

                <div className="deception-role-action-row">
                  <span className="deception-role-status-pill">{readyCount}/{connectedPlayers.length}</span>
                  <button
                    onClick={onReady}
                    disabled={!me || me.isReady}
                    className="deception-btn-cyan deception-role-reveal-ready deception-role-ready-compact flex-1 px-4 py-2.5 text-sm font-black uppercase tracking-[0.2em] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <span>{me?.isReady ? "Đôn" : "Oke dzô"}</span>
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              </aside>
            </div>

            <footer className="deception-role-foot flex items-center justify-between gap-3 border-t border-[rgba(255,255,255,0.08)] pt-2 text-[9px] uppercase tracking-[0.18em] text-(--on-surface-variant)">
              <span>Case Ref: #{gameState.id}-HK</span>
              <span>Access: Level 5</span>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}
