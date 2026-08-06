import type { GlitcherGameState } from "@/server/game/GlitcherTypes";

const PHASE_STEPS = [
  { label: "Xem vai", states: ["ROLE_REVEAL"] },
  { label: "Diễn & Hỏi", states: ["PERFORMANCE_AND_QUESTIONS"] },
  { label: "Thảo luận & Vote", states: ["DISCUSSION", "VOTING"] },
  { label: "Kết quả", states: ["REVEAL"] },
] as const;

export default function PhaseRail({ state }: { state: GlitcherGameState }) {
  const activeIndex = PHASE_STEPS.findIndex((step) =>
    (step.states as readonly string[]).includes(state),
  );

  return (
    <nav className="glitcher-phase-rail" aria-label="Tiến trình scene">
      <ol>
        {PHASE_STEPS.map((step, index) => {
          const status = index === activeIndex ? "active" : index < activeIndex ? "complete" : "future";
          return (
            <li key={step.label} className={`is-${status}`} aria-current={status === "active" ? "step" : undefined}>
              <span className="glitcher-phase-rail__dot" aria-hidden="true" />
              <span>{step.label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

