"use client";

import { useRouter } from "next/navigation";
import { Fingerprint, Search, Settings, Shield, Swords, User } from "lucide-react";
import useScreenWakeLock from "@/hooks/useScreenWakeLock";

const AVALON_BG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAzM7hbSAjzAjxRKWC0uk-8VKxpa8pv9R4xLgOAEEbMuNXfcpwoUy6s0qrLB87iLmaUM7w_zm6BWPauSQrtbjowYmpYYoxSc0O5FZ76VJWzFwC5GHWugqwijm63Cljh1w9Z_XMrVhM_zajZiDljO8ylGQ4SgvYNomqZiAN8WFiXntyKTQBsGs3GJr2R3OzxnTCWucb70fmfbKWqQ5kqqh6kCxjqbuyF2IzNdbY41B9O824WcOI8PcE2lBC87x7DHRpcBjJq_dvJhA1G";

const DECEPTION_BG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCI8V8mtn_yhTd76gbeXp-8g4vSNqH_CZ7Uh21SFxh01Jin9W3aggTnH_-6x2k9bWvkUkXhap6aSM4_bq3BiboHEyzgLR5Uw5m7tMN6cPBvNFhH7BytBz5_mdLdIqiriWJSDzazhuVr9tQXSa4s2hHKa2jQrXINnNY2mv9L8fyjXZ03fxsfprO_iLB1oEIjOQ7Wrj1QT6WkFj36-kivptKyL1QJ_HlY0lEYyczgtwaZ-RS922flBQ9mmH345cffEkaFSkYObe6JFmYO";

export default function HomePage() {
  const router = useRouter();

  useScreenWakeLock({
    enabled: true,
    mobileOnly: true,
  });

  return (
    <div className="game-hub-root min-h-screen overflow-x-hidden bg-[#121416] text-[#e2e2e5] antialiased selection:bg-[#ff5167] selection:text-[#5b0015]">
      <style>{`
        .game-hub-root {
          --hub-topbar-height: 80px;
          font-family: "Work Sans", var(--font-body), sans-serif;
          height: 100dvh;
          overflow: hidden;
        }

        .game-hub-main {
          margin-top: var(--hub-topbar-height);
          height: calc(100dvh - var(--hub-topbar-height));
          min-height: 0;
        }

        .game-hub-title,
        .game-hub-logo {
          font-family: "Space Grotesk", var(--font-headline), sans-serif;
        }

        .game-hub-label {
          font-family: "Be Vietnam Pro", var(--font-body), sans-serif;
        }

        @media (max-width: 767px) {
          .game-hub-main {
            height: calc(100dvh - var(--hub-topbar-height));
            min-height: 0;
          }

          .game-hub-panel {
            height: calc((100dvh - var(--hub-topbar-height)) / 2);
            min-height: 0;
            padding: 1rem;
          }

          .game-hub-card {
            max-width: min(100%, 34rem);
            padding: 1rem;
          }

          .game-hub-title {
            font-size: 1.65rem;
            line-height: 1.08;
          }

          .game-hub-subtitle {
            margin-bottom: 0.45rem;
          }

          .game-hub-subdesc {
            margin-bottom: 0.8rem;
            font-size: 0.88rem;
            line-height: 1.35;
          }

          .game-hub-action-wrap {
            gap: 0.5rem;
          }

          .game-hub-action {
            font-size: 0.72rem;
            padding: 0.54rem 0.88rem;
          }
        }

        @media (max-width: 767px) and (orientation: landscape) {
          .game-hub-main {
            flex-direction: row;
          }

          .game-hub-panel {
            width: 50%;
            height: calc(100dvh - var(--hub-topbar-height));
          }

          .game-hub-panel:first-child {
            border-right: 1px solid rgba(93, 63, 64, 0.2);
            border-bottom: 0;
          }
        }

        @media (orientation: landscape) and (max-height: 520px) {
          .game-hub-root {
            --hub-topbar-height: 56px;
          }

          .game-hub-topbar {
            padding: 0.55rem 1rem;
          }

          .game-hub-logo {
            font-size: 1.2rem;
          }

          .game-hub-panel {
            min-height: calc(100dvh - 56px);
            padding: 0.9rem 1rem;
          }

          .game-hub-card {
            max-width: min(100%, 30rem);
            padding: 1rem;
          }

          .game-hub-title {
            font-size: 1.55rem;
            line-height: 1.05;
          }

          .game-hub-subtitle {
            margin-bottom: 0.55rem;
          }

          .game-hub-subdesc {
            margin-bottom: 0.9rem;
            font-size: 0.86rem;
            line-height: 1.42;
          }

          .game-hub-action-wrap {
            gap: 0.55rem;
          }

          .game-hub-action {
            font-size: 0.72rem;
            padding: 0.56rem 0.9rem;
          }
        }
      `}</style>

      <header className="game-hub-topbar fixed top-0 z-50 flex w-full items-center justify-between bg-linear-to-b from-black/40 to-transparent px-6 py-4 uppercase tracking-widest text-[#ff2d55]">
        <div className="game-hub-logo text-2xl font-black tracking-tight">ARCHIVE NEXUS</div>
        <div className="flex gap-4">
          <button
            type="button"
            className="cursor-pointer p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200"
            aria-label="Account"
          >
            <User className="h-6 w-6" />
          </button>
          <button
            type="button"
            className="cursor-pointer p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200"
            aria-label="Settings"
          >
            <Settings className="h-6 w-6" />
          </button>
        </div>
      </header>

      <main className="game-hub-main flex w-full flex-col md:flex-row">
        <section
          className="game-hub-panel group relative flex h-128 w-full cursor-pointer items-center justify-center overflow-hidden border-b border-[#5d3f40]/20 bg-[#1a1c1e] p-8 md:h-auto md:w-1/2 md:border-b-0 md:border-r lg:p-16"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(18, 20, 22, 0.4), rgba(18, 20, 22, 0.9)), url('${AVALON_BG}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          onClick={() => router.push("/avalon")}
        >
          <div className="game-hub-card relative z-10 w-full max-w-lg border-t border-[#5d3f40]/20 bg-[rgba(51,53,55,0.7)] p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-[20px] transition-transform duration-500 group-hover:-translate-y-2">
            <div className="mb-6 flex items-center gap-4">
              <Shield className="h-10 w-10 fill-current text-[#00d2fd]" />
              <h2 className="game-hub-title text-4xl font-bold tracking-tight text-[#e2e2e5] lg:text-5xl">
                AVALON
              </h2>
            </div>

            <p className="game-hub-subdesc mb-8 text-lg leading-relaxed text-[#e6bcbd]">
              The Resistance: A game of secret identities, deduction, and betrayal. Will the forces of good prevail,
              or will Mordred&apos;s minions sabotage the quest?
            </p>

            <div className="game-hub-action-wrap mt-auto flex flex-wrap gap-4">
              <button
                type="button"
                className="game-hub-action flex items-center gap-2 bg-[#00d2fd] px-6 py-3 font-bold uppercase tracking-wider text-[#001f27] transition-all hover:brightness-110"
                onClick={(event) => {
                  event.stopPropagation();
                  router.push("/avalon");
                }}
              >
                <span>Enter Kingdom</span>
                <Swords className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <section
          className="game-hub-panel group relative flex h-128 w-full cursor-pointer items-center justify-center overflow-hidden bg-[#1e2022] p-8 md:h-auto md:w-1/2 lg:p-16"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(18, 20, 22, 0.6), rgba(18, 20, 22, 0.95)), url('${DECEPTION_BG}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          onClick={() => router.push("/deception")}
        >
          <div className="game-hub-card relative z-10 w-full max-w-lg border-t border-[#5d3f40]/20 bg-[rgba(51,53,55,0.8)] p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-[20px] transition-transform duration-500 group-hover:-translate-y-2">
            <div className="absolute -left-4 -top-4 z-20 h-0.5 w-12 rotate-45 bg-[#ff2d55] shadow-[0_0_8px_rgba(255,45,85,0.6)]" />
            <div className="absolute right-4 top-0 h-2 w-2 rounded-full border border-[#5d3f40]/60 bg-[#37393b] shadow-md" />

            <div className="mb-6 flex items-center gap-4">
              <Fingerprint className="h-10 w-10 stroke-[1.5] text-[#ffb3b5]" />
              <h2 className="game-hub-title text-4xl font-black tracking-tight text-[#e2e2e5] lg:text-5xl">
                DECEPTION
              </h2>
            </div>

            <h3 className="game-hub-label game-hub-subtitle mb-4 inline-block border-b-2 border-[#5d3f40]/30 pb-2 text-sm font-bold uppercase tracking-widest text-[#ffb3b5]">
              Murder in Hong Kong
            </h3>

            <p className="game-hub-subdesc mb-8 text-lg leading-relaxed text-[#e6bcbd]">
              A forensic investigation game where the truth is hidden in plain sight. Uncover the murderer among your
              team before the trail goes cold.
            </p>

            <div className="game-hub-action-wrap mt-auto flex flex-wrap gap-4">
              <button
                type="button"
                className="game-hub-action flex items-center gap-2 bg-linear-to-br from-[#ffb3b5] to-[#ff5167] px-6 py-3 font-bold uppercase tracking-wider text-[#5b0015] transition-all hover:brightness-110"
                onClick={(event) => {
                  event.stopPropagation();
                  router.push("/deception");
                }}
              >
                <span>Investigate</span>
                <Search className="ml-2 h-4 w-4" />
              </button>

            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
