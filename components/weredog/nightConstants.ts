"use client";

// ─── Player Circle Positions (Full circle, 12 slots max) ───

export const CIRCLE_POSITIONS = [
  { left: "50%", top: "18%" },   // 1. Top center
  { left: "33%", top: "19%" },   // 2. Top left
  { left: "67%", top: "19%" },   // 3. Top right
  { left: "19%", top: "32%" },   // 4. Upper left
  { left: "81%", top: "32%" },   // 5. Upper right
  { left: "9%",  top: "50%" },   // 6. Middle left
  { left: "91%", top: "50%" },   // 7. Middle right
  { left: "12%", top: "68%" },   // 8. Lower left
  { left: "88%", top: "68%" },   // 9. Lower right
  { left: "26%", top: "80%" },   // 10. Bottom left
  { left: "74%", top: "80%" },   // 11. Bottom right
  { left: "50%", top: "81%" },   // 12. Bottom center
];

// ─── Role Types ───

export type WeredogRoleName =
  | "Wolf"
  | "Bodyguard"
  | "Seer"
  | "Hunter"
  | "Cupid"
  | "Witch"
  | "Elder"
  | "Villager";

// ─── Role Display Config ───

export interface RoleDisplayConfig {
  nameVi: string;
  actionTitle: string;
  actionDesc: string;
  actionHeading: string; // Large centered Vietnamese title
  confirmLabel: string;
  highlightColor: string;
  glowColor: string;
  frameType: "shiba" | "wolf" | "cat" | "owl" | "rose" | "potion" | "shield" | "crown";
  icon: string;
}

export const ROLE_DISPLAY: Record<WeredogRoleName, RoleDisplayConfig> = {
  Wolf: {
    nameVi: "Sói",
    actionTitle: "Sói Cắn",
    actionDesc: "Cùng bầy sói chọn một nạn nhân đêm nay.",
    actionHeading: "SÓI...",
    confirmLabel: "Xác Nhận Cắn",
    highlightColor: "#dc2626",
    glowColor: "rgba(220, 38, 38, 0.4)",
    frameType: "wolf",
    icon: "🐺",
  },
  Bodyguard: {
    nameVi: "Bảo Vệ",
    actionTitle: "Bảo Vệ",
    actionDesc: "Chọn một người chơi để bảo vệ khỏi sói đêm nay.",
    actionHeading: "BẢO VỆ...",
    confirmLabel: "Xác Nhận Bảo Vệ",
    highlightColor: "#3b82f6",
    glowColor: "rgba(59, 130, 246, 0.4)",
    frameType: "shield",
    icon: "🛡️",
  },
  Seer: {
    nameVi: "Tiên Tri",
    actionTitle: "Tiên Tri Soi",
    actionDesc: "Chọn một người chơi để soi thân phận thực sự.",
    actionHeading: "TIÊN TRI...",
    confirmLabel: "Soi Thẻ",
    highlightColor: "#a78bfa",
    glowColor: "rgba(167, 139, 250, 0.4)",
    frameType: "owl",
    icon: "🔮",
  },
  Hunter: {
    nameVi: "Thợ Săn",
    actionTitle: "Phát Súng Cuối",
    actionDesc: "Nếu bạn chết, bạn sẽ được chọn một người còn sống để bắn ở khoảnh khắc bình minh.",
    actionHeading: "THỢ SĂN...",
    confirmLabel: "Bắn Mục Tiêu",
    highlightColor: "#f59e0b",
    glowColor: "rgba(245, 158, 11, 0.4)",
    frameType: "crown",
    icon: "🎯",
  },
  Cupid: {
    nameVi: "Cupid",
    actionTitle: "Cupid Xe Duyên",
    actionDesc: "Chọn hai người chơi để kết thành tình nhân. Nếu một người chết, người kia cũng theo.",
    actionHeading: "CUPID...",
    confirmLabel: "Xác Nhận Ghép Đôi",
    highlightColor: "#ec4899",
    glowColor: "rgba(236, 72, 153, 0.4)",
    frameType: "rose",
    icon: "💘",
  },
  Witch: {
    nameVi: "Phù Thủy",
    actionTitle: "Phù Thủy",
    actionDesc: "Sử dụng bình cứu hoặc bình giết. Chỉ được dùng tối đa 1 bình mỗi đêm.",
    actionHeading: "PHÙ THỦY...",
    confirmLabel: "Xác Nhận",
    highlightColor: "#10b981",
    glowColor: "rgba(16, 185, 129, 0.4)",
    frameType: "potion",
    icon: "🧪",
  },
  Elder: {
    nameVi: "Già Làng",
    actionTitle: "Già Làng",
    actionDesc: "Không có hành động ban đêm. Có 2 mạng chống sói cắn.",
    actionHeading: "GIÀ LÀNG...",
    confirmLabel: "",
    highlightColor: "#cda372",
    glowColor: "rgba(205, 163, 114, 0.4)",
    frameType: "crown",
    icon: "👴",
  },
  Villager: {
    nameVi: "Dân Làng",
    actionTitle: "Dân Làng",
    actionDesc: "Không có hành động ban đêm. Hãy ngủ ngon.",
    actionHeading: "DÂN LÀNG ĐANG NGỦ",
    confirmLabel: "",
    highlightColor: "#829ea2",
    glowColor: "rgba(130, 158, 162, 0.4)",
    frameType: "shiba",
    icon: "🐕",
  },
};

// ─── Night Player Interface ───

export interface NightPlayer {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  isAlive: boolean;
  isHost: boolean;
  isModerator: boolean;
  role?: WeredogRoleName;
  /** Visible role frame — only visible to self, seer (if inspected), and host */
  visibleFrameType?: RoleDisplayConfig["frameType"];
  avatarUrl?: string | null;
  elderLives?: number;
  isLover?: boolean;
  loverUserId?: string;
  isInspected?: boolean;
  isProtected?: boolean;
}

// ─── Role Frame SVG Paths (Placeholder decorative borders) ───

export const ROLE_FRAME_COLORS: Record<RoleDisplayConfig["frameType"], { border: string; glow: string }> = {
  shiba:  { border: "#cda372", glow: "rgba(205, 163, 114, 0.3)" },  // Dân - gold
  wolf:   { border: "#dc2626", glow: "rgba(220, 38, 38, 0.4)" },    // Sói - red
  cat:    { border: "#a78bfa", glow: "rgba(167, 139, 250, 0.3)" },  // Reserved
  owl:    { border: "#a78bfa", glow: "rgba(167, 139, 250, 0.4)" },  // Tiên tri - purple
  rose:   { border: "#ec4899", glow: "rgba(236, 72, 153, 0.3)" },   // Cupid - pink
  potion: { border: "#10b981", glow: "rgba(16, 185, 129, 0.3)" },   // Phù thủy - green
  shield: { border: "#3b82f6", glow: "rgba(59, 130, 246, 0.3)" },   // Bảo vệ - blue
  crown:  { border: "#f59e0b", glow: "rgba(245, 158, 11, 0.3)" },   // Thợ săn/Già làng - amber
};
