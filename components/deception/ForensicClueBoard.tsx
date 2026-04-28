"use client";

import { X } from "lucide-react";
import type { SceneTile } from "@/server/game/DeceptionTypes";

const PAPER_ROTATIONS = [
  "sm:-rotate-1",
  "sm:rotate-1",
  "sm:-rotate-2",
  "sm:rotate-2",
  "sm:rotate-[1.5deg]",
  "sm:-rotate-[1.5deg]",
] as const;

function paperTone(type: SceneTile["type"]) {
  if (type === "mandatory_purple") {
    return {
      paper:
        "bg-[linear-gradient(180deg,#eef2ff_0%,#e5ecff_100%)] border-[#c4d0f3] border-l-[#687ed6]",
      pin: "bg-[#6e82d9] shadow-[0_0_8px_rgba(104,126,214,0.65)]",
      meta: "text-[#627399]",
      metaStrong: "text-[#445680]",
      title: "text-[#1a2540]",
      divider: "border-[#bccae8]",
      sub: "text-[#5a6c8e]",
    };
  }

  if (type === "mandatory_green") {
    return {
      paper:
        "bg-[linear-gradient(180deg,#edf8f4_0%,#e3f3ed_100%)] border-[#bfded3] border-l-[#2d8b74]",
      pin: "bg-[#2e9379] shadow-[0_0_8px_rgba(45,139,116,0.65)]",
      meta: "text-[#547d72]",
      metaStrong: "text-[#2f5f52]",
      title: "text-[#133329]",
      divider: "border-[#b8d9cc]",
      sub: "text-[#4f7166]",
    };
  }

  return {
    paper:
      "bg-[linear-gradient(180deg,#f6f1e8_0%,#f0e8da_100%)] border-[#dccdb5] border-l-[#a87c46]",
    pin: "bg-[#b9874d] shadow-[0_0_8px_rgba(168,124,70,0.55)]",
    meta: "text-[#8a7657]",
    metaStrong: "text-[#675337]",
    title: "text-[#2a241b]",
    divider: "border-[#d8c7ab]",
    sub: "text-[#756247]",
  };
}

function selectedText(tile: SceneTile) {
  if (tile.markerIndex === null) {
    return {
      vi: "Chưa có dấu",
      en: "No marker yet",
      selected: false,
    };
  }

  const option = tile.options[tile.markerIndex];
  return {
    vi: option.textVi || option.text,
    en: option.text,
    selected: true,
  };
}

export default function ForensicClueBoard({
  tiles,
  showCloseButton = false,
  onClose,
}: {
  tiles: SceneTile[];
  showCloseButton?: boolean;
  onClose?: () => void;
}) {
  const snapshotTiles = tiles.slice(0, 6);

  return (
    <section className="deception-card relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-(--deception-border) bg-[radial-gradient(circle_at_center,rgba(28,34,46,0.85)_0%,rgba(12,15,22,0.94)_52%,rgba(8,10,16,0.98)_100%)]">
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="absolute right-2 top-2 z-90 inline-flex h-8 w-8 items-center justify-center rounded-md border border-cyan-300/70 bg-[rgba(9,16,28,0.94)] text-cyan-100 shadow-[0_10px_24px_rgba(0,0,0,0.56),0_0_0_1px_rgba(120,220,255,0.24)] backdrop-blur-md transition hover:bg-[rgba(24,53,84,0.96)] hover:text-white hover:shadow-[0_12px_28px_rgba(0,0,0,0.62),0_0_0_1px_rgba(120,220,255,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 sm:right-3 sm:top-3 sm:h-9 sm:w-9"
          title="Close Board"
        >
          <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.6} />
        </button>
      )}

      <div className={`relative min-h-0 flex-1 ${showCloseButton ? "pr-10 sm:pr-12" : ""}`}>
        <div className="pointer-events-none absolute left-[18%] top-[31%] z-20 h-0.5 w-[30%] -rotate-[9deg] bg-[#ff5167] shadow-[0_0_10px_rgba(255,81,103,0.5)] sm:left-[22%] sm:top-[40%] sm:w-48 sm:-rotate-15" />
        <div className="pointer-events-none absolute left-[50%] top-[34%] z-20 h-0.5 w-[32%] rotate-14 bg-[#ff5167] shadow-[0_0_10px_rgba(255,81,103,0.5)] sm:left-[55%] sm:top-[45%] sm:w-56 sm:rotate-25" />
        <div className="pointer-events-none absolute left-[47%] top-[58%] z-20 h-0.5 w-[20%] rotate-86 bg-[#ff5167] shadow-[0_0_10px_rgba(255,81,103,0.5)] sm:left-[65%] sm:top-[15%] sm:w-32 sm:rotate-110" />

        <div className="relative z-10 grid h-full min-h-0 auto-rows-fr grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3 lg:gap-4">
        {snapshotTiles.map((tile, index) => {
          const chosen = selectedText(tile);
          const tone = paperTone(tile.type);

          return (
            <article
              key={tile.id}
              className={`relative border border-l-[3px] p-2 text-[#141a24] shadow-[0_8px_18px_rgba(0,0,0,0.38)] transition-transform duration-200 hover:scale-[1.015] sm:border-l-4 sm:p-3 sm:shadow-[0_14px_28px_rgba(0,0,0,0.45)] ${tone.paper} ${PAPER_ROTATIONS[index % PAPER_ROTATIONS.length]}`}
              style={{
                clipPath:
                  "polygon(0% 0%,100% 0%,100% 95%,98% 97%,95% 94%,92% 98%,88% 94%,84% 97%,80% 95%,75% 98%,70% 94%,64% 97%,58% 95%,52% 98%,46% 94%,40% 97%,34% 95%,28% 98%,22% 94%,16% 97%,10% 95%,5% 98%,0% 95%)",
              }}
            >
              <span className={`absolute right-2.5 top-2.5 h-2 w-2 rounded-full sm:right-3 sm:top-3 sm:h-2.5 sm:w-2.5 ${tone.pin}`} />

              <p className={`text-[8px] font-extrabold uppercase tracking-wide sm:text-[10px] ${tone.meta}`}>
                <span className="font-black">Item #{String(index + 1).padStart(3, "0")}: </span>
                <span className={`font-black ${tone.metaStrong}`}>{tile.name}</span>
              </p>
              <h3 className={`pt-1 line-clamp-2 text-base font-black uppercase leading-tight sm:text-lg ${tone.title}`}>
                {chosen.vi}
              </h3>

              <p className={`mt-1.5 line-clamp-1 border-t pt-1.5 text-[10px] italic sm:mt-2 sm:line-clamp-2 sm:pt-2 sm:text-[11px] ${tone.divider} ${tone.sub}`}>
                {tile.nameVi}
              </p>

              <div className="mt-2 flex items-center justify-end sm:mt-3">
                <span
                  className={`rounded-md border px-2 py-0.5 text-[8px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(15,23,42,0.14)] sm:px-2.5 sm:text-[9px] ${
                    chosen.selected
                      ? "border-[#4d79bd] bg-[#1b3761] text-[#dbeafe]"
                      : "border-[#8f7146] bg-[#4c3b25] text-[#fbe4af]"
                  }`}
                >
                  {chosen.selected ? "Marked" : "Pending"}
                </span>
              </div>

              {chosen.selected && (
                <p className="mt-1 hidden line-clamp-1 text-[10px] text-[#3e4a5f] sm:mt-2 sm:block sm:line-clamp-2 sm:text-[11px]">
                  {chosen.en}
                </p>
              )}
            </article>
          );
        })}
        </div>
      </div>
    </section>
  );
}
