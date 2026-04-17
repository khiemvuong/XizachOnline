"use client";

import { useRouter } from "next/navigation";

interface GameCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  players: string;
  time: string;
  difficulty: string;
  route: string;
  accentColor: string;
  glowColor: string;
  badge: string;
  tags: string[];
  hidden?: boolean;
  icon: React.ReactNode;
}

const SwordIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
    <path d="M13 19l6-6" />
    <path d="M16 16l4 4" />
    <path d="M19 21l2-2" />
  </svg>
);

const MagnifyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
    <path d="M11 8v6M8 11h6" />
  </svg>
);

const CardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <rect x="2" y="5" width="20" height="14" rx="3" />
    <path d="M2 10h20" />
  </svg>
);

const GAMES: GameCard[] = [
  {
    id: "avalon",
    title: "Avalon",
    subtitle: "The Resistance",
    description: "Trò chơi xã hội ẩn danh chiến lược. Phe Tốt và phe Evil đối đầu trong bóng tối. Ai là Merlin? Ai là Assassin?",
    players: "5–10",
    time: "30–60 phút",
    difficulty: "Trung bình",
    route: "/avalon",
    accentColor: "rgba(99, 102, 241, 1)",
    glowColor: "rgba(99, 102, 241, 0.25)",
    badge: "ĐANG CÓ",
    tags: ["Nhập vai", "Chiến lược", "Bluffing"],
    icon: <SwordIcon />,
  },
  {
    id: "deception",
    title: "Deception",
    subtitle: "Murder in Hong Kong",
    description: "Pháp y dẫn dắt điều tra. Kẻ sát nhân ẩn mình. Điều tra viên phải phá án trước khi hết giờ.",
    players: "4–12",
    time: "20–40 phút",
    difficulty: "Dễ học",
    route: "/deception",
    accentColor: "rgba(239, 68, 68, 1)",
    glowColor: "rgba(239, 68, 68, 0.25)",
    badge: "ĐANG CÓ",
    tags: ["Điều tra", "Suy luận", "Deduction"],
    icon: <MagnifyIcon />,
  },
  {
    id: "xizach",
    title: "Xì Dách",
    subtitle: "Blackjack Online",
    description: "Trò chơi bài kinh điển. Đừng vượt quá 21. Chơi cùng bạn bè với voice chat thời gian thực.",
    players: "2–8",
    time: "Tự do",
    difficulty: "Dễ",
    route: "/xizach",
    accentColor: "rgba(234, 179, 8, 1)",
    glowColor: "rgba(234, 179, 8, 0.2)",
    badge: "ĐANG CÓ",
    tags: ["Bài", "May mắn", "Voice Chat"],
    hidden: true,
    icon: <CardIcon />,
  },
];

const VISIBLE_GAMES = GAMES.filter((g) => !g.hidden);

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="hub-page">
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .hub-page {
          min-height: 100dvh;
          background: #06080f;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 20px;
          font-family: 'Inter', system-ui, sans-serif;
        }

        /* ── Header ── */
        .hub-header {
          text-align: center;
          margin-bottom: 36px;
        }
        .hub-logo {
          font-size: clamp(1.8rem, 5vw, 3rem);
          font-weight: 900;
          letter-spacing: 0.03em;
          background: linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.1;
          margin-bottom: 6px;
        }
        .hub-tagline {
          font-size: clamp(0.7rem, 2vw, 0.875rem);
          color: #475569;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 500;
        }

        /* ── Grid ── */
        .hub-grid {
          display: grid;
          grid-template-columns: repeat(${VISIBLE_GAMES.length}, minmax(0, 420px));
          gap: 20px;
          width: 100%;
          max-width: ${VISIBLE_GAMES.length === 2 ? "860px" : "1060px"};
        }

        /* Portrait mobile: 1 column */
        @media (max-width: 640px) {
          .hub-grid {
            grid-template-columns: 1fr;
            max-width: 400px;
          }
        }

        /* Landscape mobile (short viewport): compact 2-col */
        @media (orientation: landscape) and (max-height: 520px) {
          .hub-page { padding: 12px 16px; justify-content: flex-start; }
          .hub-header { margin-bottom: 12px; }
          .hub-logo { font-size: 1.4rem; }
          .hub-grid {
            grid-template-columns: repeat(${VISIBLE_GAMES.length}, minmax(0, 1fr));
            gap: 12px;
          }
          .game-card { padding: 14px 16px; gap: 8px; }
          .card-desc { display: none; }
          .card-meta { display: none; }
          .card-tags { display: none; }
          .card-icon-wrap { width: 40px; height: 40px; padding: 9px; border-radius: 10px; }
          .card-title { font-size: 1.1rem; }
          .card-cta { padding: 9px 0; font-size: 0.8rem; }
        }

        /* ── Card ── */
        .game-card {
          position: relative;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 22px;
          padding: 24px;
          cursor: pointer;
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .game-card:hover {
          transform: translateY(-5px);
          border-color: var(--card-accent);
          box-shadow: 0 0 48px var(--card-glow), 0 24px 48px rgba(0,0,0,0.5);
        }
        .game-card:active { transform: translateY(-2px) scale(0.99); }

        /* ── Card interior ── */
        .card-top {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .card-icon-wrap {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 11px;
          background: var(--card-glow);
          color: var(--card-accent);
        }
        .card-titles { flex: 1; min-width: 0; }
        .card-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: #f1f5f9;
          line-height: 1.1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .card-subtitle {
          font-size: 0.7rem;
          color: var(--card-accent);
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-top: 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .card-badge {
          font-size: 0.58rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          padding: 3px 8px;
          border-radius: 999px;
          background: var(--card-glow);
          color: var(--card-accent);
          border: 1px solid var(--card-accent);
          white-space: nowrap;
          flex-shrink: 0;
          align-self: flex-start;
        }

        .card-desc {
          font-size: 0.875rem;
          color: #94a3b8;
          line-height: 1.6;
        }

        .card-meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.72rem;
          color: #64748b;
          background: rgba(255,255,255,0.05);
          border-radius: 8px;
          padding: 4px 9px;
        }

        .card-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .tag {
          font-size: 0.68rem;
          font-weight: 600;
          color: var(--card-accent);
          background: var(--card-glow);
          border-radius: 6px;
          padding: 3px 8px;
        }

        .card-cta {
          margin-top: auto;
          width: 100%;
          padding: 12px 0;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          background: var(--card-accent);
          color: #06080f;
          border: none;
          cursor: pointer;
          transition: filter 0.18s, transform 0.15s;
          text-transform: uppercase;
        }
        .card-cta:hover { filter: brightness(1.1); transform: scale(1.02); }
        .card-cta:active { transform: scale(0.98); }

        .hub-footer {
          margin-top: 28px;
          font-size: 0.68rem;
          color: #1e293b;
          letter-spacing: 0.1em;
          text-align: center;
        }
      `}</style>

      <header className="hub-header">
        <h1 className="hub-logo">BoardGame</h1>
        <p className="hub-tagline">Chọn trò chơi để bắt đầu</p>
      </header>

      <div className="hub-grid">
        {VISIBLE_GAMES.map((game) => (
          <div
            key={game.id}
            className="game-card"
            style={{
              "--card-accent": game.accentColor,
              "--card-glow": game.glowColor,
            } as React.CSSProperties}
            onClick={() => router.push(game.route)}
          >
            <div className="card-top">
              <div className="card-icon-wrap">{game.icon}</div>
              <div className="card-titles">
                <h2 className="card-title">{game.title}</h2>
                <p className="card-subtitle">{game.subtitle}</p>
              </div>
              <span className="card-badge">{game.badge}</span>
            </div>

            <p className="card-desc">{game.description}</p>

            <div className="card-meta">
              <span className="meta-item">👥 {game.players} người</span>
              <span className="meta-item">⏱ {game.time}</span>
              <span className="meta-item">📊 {game.difficulty}</span>
            </div>

            <div className="card-tags">
              {game.tags.map((tag) => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>

            <button
              className="card-cta"
              onClick={(e) => { e.stopPropagation(); router.push(game.route); }}
            >
              Chơi ngay →
            </button>
          </div>
        ))}
      </div>

      <footer className="hub-footer">XizachOnline · Play with friends</footer>
    </div>
  );
}
