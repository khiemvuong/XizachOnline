import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Clock3,
  Eye,
  Fingerprint,
  Search,
  Shield,
  Skull,
  Target,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FLOW_STEPS: Array<{ title: string; desc: string; icon: LucideIcon }> = [
  {
    title: "1. Chia Vai Và Nhận Bài",
    desc: "Mỗi ván luôn có Forensic Scientist và Murderer. Từ 6 người trở lên có thể bật thêm Accomplice/Witness trong lobby.",
    icon: Users,
  },
  {
    title: "2. Night Phase",
    desc: "Murderer bí mật chọn đúng 1 Means và 1 Clue trong bộ bài của mình. Đây là đáp án thật của vụ án.",
    icon: Skull,
  },
  {
    title: "3. Scene Setup",
    desc: "Forensic Scientist đặt marker lên từng scene tile để gợi ý gián tiếp. Từ round 2 có thể thay 1 ô evidence màu nâu.",
    icon: Fingerprint,
  },
  {
    title: "4. Discussion + Solve",
    desc: "Điều tra viên thảo luận theo timer. Ai còn badge có quyền tố cáo 1 nghi phạm kèm Means + Clue. Tố sai sẽ mất badge.",
    icon: Search,
  },
  {
    title: "5. Kết Quả Cuối",
    desc: "Nếu tố đúng và có Witness trong ván, Murderer được thêm pha Witness Hunt. Nếu không có Witness, phe Điều tra thắng ngay.",
    icon: Target,
  },
];

export default function RulesModal({ isOpen, onClose }: RulesModalProps) {
  const canUseDOM = typeof document !== "undefined";

  useEffect(() => {
    if (!canUseDOM || !isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [canUseDOM, isOpen]);

  if (!canUseDOM) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="deception-rules-modal-shell deception-theme fixed inset-0 flex h-dvh w-full p-0"
          style={{ zIndex: 2147483000 }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", damping: 24, stiffness: 280 }}
            className="deception-rules-modal-frame relative flex h-full w-full max-h-none max-w-none flex-col overflow-hidden rounded-none border-0"
          >
            <header className="deception-rules-modal-header relative shrink-0 border-b border-(--deception-border) px-4 py-4 sm:px-6 sm:py-5">
              <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-(--deception-red)/20 via-(--deception-red)/8 to-transparent" />

              <button
                onClick={onClose}
                className="absolute right-3 top-3 rounded-full border border-(--deception-border) bg-black/20 p-2 text-(--on-surface-variant) transition hover:text-(--on-surface) sm:right-5 sm:top-5"
                aria-label="Đóng luật chơi"
              >
                <X className="h-4 w-4" />
              </button>

              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-(--deception-cyan)">
                DECEPTION // FIELD MANUAL
              </p>
              <h2 className="mt-1 pr-10 text-lg font-black uppercase tracking-[0.12em] text-(--deception-red) sm:text-2xl">
                Luật Chơi Deception
              </h2>
              <p className="mt-1 max-w-3xl text-xs text-(--on-surface-variant) sm:text-sm">
                Bản rút gọn theo đúng logic game hiện tại: 3 round thảo luận, hệ thống badge tố cáo,
                và pha Witness Hunt ở cuối ván.
              </p>
            </header>

            <div className="deception-rules-scroll flex-1 space-y-6 overflow-y-auto px-4 py-4 pb-24 sm:space-y-8 sm:px-6 sm:py-6 sm:pb-24">
              <section className="rounded-xl border border-(--deception-border) bg-[rgba(255,255,255,0.03)] p-3 sm:p-4">
                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-(--deception-cyan)">
                  <Shield className="h-4 w-4" />
                  Vai Trò Và Mục Tiêu
                </h3>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <RoleCard
                    icon={Eye}
                    title="Forensic Scientist"
                    team="Thông tin trung lập"
                    desc="Không chat trong game, chỉ được gợi ý bằng marker trên scene tiles và xác nhận kết quả phá án."
                  />
                  <RoleCard
                    icon={Skull}
                    title="Murderer"
                    team="Phe Murderer"
                    desc="Chọn đáp án thật ở Night Phase. Thắng nếu đối phương không phá án kịp hoặc săn đúng Witness ở cuối."
                    tone="evil"
                  />
                  <RoleCard
                    icon={Users}
                    title="Investigator"
                    team="Phe Investigator"
                    desc="Thảo luận và tố cáo bằng badge. Muốn thắng phải tố đúng người + đúng Means + đúng Clue."
                  />
                  <RoleCard
                    icon={AlertTriangle}
                    title="Accomplice (tuỳ chọn)"
                    team="Phe Murderer"
                    desc="Bật trong lobby (6+ người). Hỗ trợ gây nhiễu suy luận trong thảo luận."
                    tone="evil"
                  />
                  <RoleCard
                    icon={Target}
                    title="Witness (tuỳ chọn)"
                    team="Phe Investigator"
                    desc="Bật trong lobby (6+ người). Nếu phe Điều tra phá án đúng, Murderer có thể săn Witness để lật kèo."
                  />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-(--deception-cyan)">
                  <Clock3 className="h-4 w-4" />
                  Trình Tự Ván Đấu
                </h3>

                <div className="grid gap-3">
                  {FLOW_STEPS.map((step) => (
                    <StepCard key={step.title} title={step.title} desc={step.desc} icon={step.icon} />
                  ))}
                </div>
              </section>

              <section className="grid gap-3 lg:grid-cols-2">
                <article className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 sm:p-4">
                  <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-200 sm:text-sm">
                    <BadgeCheck className="h-4 w-4" />
                    Điều Tra Viên Thắng Khi
                  </h4>
                  <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-emerald-100/90 sm:text-sm">
                    <li>Tố đúng Murderer và đúng cặp Means + Clue.</li>
                    <li>Không có Witness trong ván, hoặc Murderer săn Witness thất bại.</li>
                  </ul>
                </article>

                <article className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 sm:p-4">
                  <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-rose-200 sm:text-sm">
                    <Skull className="h-4 w-4" />
                    Murderer Thắng Khi
                  </h4>
                  <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-rose-100/90 sm:text-sm">
                    <li>Hết tối đa 3 round mà phe Điều tra chưa phá án thành công.</li>
                    <li>Phe Điều tra phá án đúng nhưng Murderer săn trúng Witness.</li>
                    <li>Tất cả badge tố cáo đã bị dùng hết sau các lần tố sai.</li>
                  </ul>
                </article>
              </section>

              <section className="rounded-xl border border-(--deception-border) bg-[rgba(0,212,255,0.08)] p-3 sm:p-4">
                <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-(--deception-cyan) sm:text-sm">
                  <Fingerprint className="h-4 w-4" />
                  Cài Đặt Lobby Cần Lưu Ý
                </h3>
                <div className="mt-2 grid gap-2 text-xs text-(--on-surface-variant) sm:grid-cols-2 sm:text-sm">
                  <p>
                    <span className="font-bold text-(--on-surface)">Discussion Time:</span> 60-600 giây.
                  </p>
                  <p>
                    <span className="font-bold text-(--on-surface)">Scene Difficulty:</span> Easy (dễ) hoặc Hard (gốc).
                  </p>
                  <p>
                    <span className="font-bold text-(--on-surface)">Accomplice:</span> chỉ có tác dụng khi đủ người chơi.
                  </p>
                  <p>
                    <span className="font-bold text-(--on-surface)">Witness:</span> tạo thêm pha săn nhân chứng cuối game.
                  </p>
                </div>
              </section>
            </div>

            <div className="absolute bottom-4 right-4">
              <button
                onClick={onClose}
                className="rounded-full border border-white/10 bg-(--deception-red)/90 px-4 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-white shadow-[0_0_16px_rgba(255,45,85,0.35)] transition hover:brightness-110"
              >
                Yeh Bro
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function RoleCard({
  icon: Icon,
  title,
  team,
  desc,
  tone = "good",
}: {
  icon: LucideIcon;
  title: string;
  team: string;
  desc: string;
  tone?: "good" | "evil";
}) {
  const accentClass = tone === "evil" ? "text-rose-300" : "text-cyan-200";
  const panelClass = tone === "evil" ? "border-rose-400/30 bg-rose-500/10" : "border-cyan-400/25 bg-cyan-500/10";

  return (
    <article className={`rounded-xl border p-3 ${panelClass}`}>
      <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] ${accentClass}`}>
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.11em] text-(--on-surface-variant)">{team}</p>
      <p className="mt-2 text-xs leading-relaxed text-(--on-surface-variant)">{desc}</p>
    </article>
  );
}

function StepCard({ title, desc, icon: Icon }: { title: string; desc: string; icon: LucideIcon }) {
  return (
    <article className="rounded-xl border border-(--deception-border) bg-[rgba(255,255,255,0.03)] p-3 sm:p-4">
      <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-(--on-surface) sm:text-sm">
        <Icon className="h-4 w-4 text-(--deception-red-soft)" />
        {title}
      </h4>
      <p className="mt-1.5 text-xs leading-relaxed text-(--on-surface-variant) sm:text-sm">{desc}</p>
    </article>
  );
}
