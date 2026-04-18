"use client";

import type { SceneTile } from "@/server/game/DeceptionTypes";

type SceneBoardVariant = "default" | "forensicNotes";

type SceneBoardProps = {
  tiles: SceneTile[];
  readOnly: boolean;
  replacedTileIndex?: number | null;
  onSelectOption?: (tileId: string, optionIndex: number) => void;
  variant?: SceneBoardVariant;
};

const NOTE_ROTATIONS = [
  "rotate-[-1deg]",
  "rotate-[1.2deg]",
  "rotate-[-0.5deg]",
  "rotate-[0.8deg]",
  "rotate-[-1.5deg]",
  "rotate-[0.5deg]",
];

const NOTE_PIN_POSITIONS = [
  "-top-3 left-1/2 -translate-x-1/2",
  "-top-3 left-1/4 -translate-x-1/2",
  "-top-3 right-6",
  null,
  "-top-3 left-4",
  null,
] as const;

function tileTheme(tile: SceneTile) {
  if (tile.type === "mandatory_purple") {
    return {
      accent: "var(--deception-purple)",
      bg: "rgba(139,92,246,0.14)",
      paperBg: "#2d1b4d",
      paperText: "#d8b4fe",
      paperItemText: "#f3e8ff",
      paperBorder: "#9d6aff",
    };
  }
  if (tile.type === "mandatory_green") {
    return {
      accent: "#4ade80",
      bg: "rgba(74,222,128,0.12)",
      paperBg: "#1b3a2a",
      paperText: "#b9f6ca",
      paperItemText: "#d1fae5",
      paperBorder: "#4ade80",
    };
  }
  return {
    accent: "#b45309",
    bg: "rgba(180,83,9,0.14)",
    paperBg: "#3d2b1f",
    paperText: "#fed7aa",
    paperItemText: "#ffedd5",
    paperBorder: "#b45309",
  };
}

export default function SceneBoard({
  tiles,
  readOnly,
  replacedTileIndex,
  onSelectOption,
  variant = "default",
}: SceneBoardProps) {
  if (tiles.length === 0) {
    return (
      <div className="rounded-xl border border-(--deception-border) p-5 text-center text-sm text-(--on-surface-variant)">
        Chưa có scene tiles.
      </div>
    );
  }

  if (variant === "forensicNotes") {
    return (
      <div className="deception-scene-grid-forensic-notes grid grid-cols-2 items-start gap-2.5 sm:grid-cols-3 sm:gap-3 lg:gap-4">
        {tiles.map((tile, tileIndex) => {
          const theme = tileTheme(tile);
          const rotation = NOTE_ROTATIONS[tileIndex % NOTE_ROTATIONS.length];
          const pinPos = NOTE_PIN_POSITIONS[tileIndex % NOTE_PIN_POSITIONS.length];

          return (
            <article
              key={tile.id}
              className={`deception-paper-texture deception-scene-forensic-note-tile relative min-h-0 border-t-4 p-2.5 shadow-2xl sm:p-3 lg:p-4 ${rotation}`}
              style={{
                backgroundColor: theme.paperBg,
                borderTopColor: theme.paperBorder,
              }}
            >
              {pinPos && (
                <div className={`absolute ${pinPos} flex h-6 w-6 items-center justify-center rounded-full bg-slate-300 shadow-inner`}>
                  <div className="h-2 w-2 rounded-full bg-slate-500" />
                </div>
              )}

              <header className="mb-3 border-b pb-2" style={{ borderColor: "color-mix(in srgb, white 25%, transparent)" }}>
                <div className="flex items-center justify-between gap-2">
                  <h3
                    className="text-sm font-black uppercase tracking-[0.14em]"
                    style={{ color: theme.paperText }}
                  >
                    {tile.nameVi}
                  </h3>
                  {replacedTileIndex === tileIndex && (
                    <span className="rounded-sm bg-(--deception-amber) px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#2f2300]">
                      Mới
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[10px] uppercase tracking-[0.16em]" style={{ color: "color-mix(in srgb, white 62%, transparent)" }}>
                  {tile.name}
                </p>
              </header>

              <ul className="space-y-1.5">
                {tile.options.map((option, optionIndex) => {
                  const selected = tile.markerIndex === optionIndex;
                  return (
                    <li key={`${tile.id}-${optionIndex}`}>
                      <button
                        disabled={readOnly}
                        onClick={() => onSelectOption?.(tile.id, optionIndex)}
                        className={`flex w-full items-center justify-between px-2 py-1.5 text-left transition ${
                          selected
                            ? "bg-[rgba(255,81,103,0.22)]"
                            : "hover:bg-white/10"
                        } ${readOnly ? "cursor-default" : "cursor-pointer"}`}
                      >
                        <span className="truncate text-[13px] sm:text-sm" style={{ color: theme.paperItemText }}>{option.textVi}</span>
                        <span
                          className="h-4 w-4 rounded-full border-2 transition"
                          style={{
                            borderColor: theme.paperBorder,
                            backgroundColor: selected ? theme.paperBorder : "transparent",
                          }}
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </div>
    );
  }

  return (
    <div className="deception-scene-grid grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {tiles.map((tile, tileIndex) => {
        const theme = tileTheme(tile);
        return (
          <article
            key={tile.id}
            className="deception-scene-tile flex min-h-0 flex-col rounded-xl border p-2.5 sm:p-3"
            style={{
              borderColor: "var(--deception-border)",
              background: theme.bg,
            }}
          >
            <div className="deception-scene-tile-head mb-2 border-b pb-1.5" style={{ borderColor: "color-mix(in srgb, var(--deception-border) 75%, transparent)" }}>
              <div className="flex items-center justify-between gap-2">
                <h3
                  className="text-xs font-black uppercase tracking-[0.12em] sm:text-sm"
                  style={{ color: theme.accent }}
                >
                  {tile.nameVi}
                </h3>
                {replacedTileIndex === tileIndex && (
                  <span className="rounded-md bg-(--deception-amber) px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#2f2300]">
                    Mới
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-(--on-surface-variant)">{tile.name}</p>
            </div>

            <ul className="deception-scene-options min-h-0 space-y-1 overflow-auto pr-1">
              {tile.options.map((option, optionIndex) => {
                const selected = tile.markerIndex === optionIndex;
                return (
                  <li key={`${tile.id}-${optionIndex}`}>
                    <button
                      disabled={readOnly}
                      onClick={() => onSelectOption?.(tile.id, optionIndex)}
                      className={`deception-scene-option flex w-full items-center justify-between rounded-md border px-2 py-1.5 text-left text-xs transition sm:px-2.5 sm:py-2 sm:text-sm ${
                        selected
                          ? "border-(--deception-red) bg-[rgba(255,45,85,0.12)] text-(--on-surface)"
                          : "border-(--deception-border) bg-[rgba(255,255,255,0.03)] text-(--on-surface-variant)"
                      } ${readOnly ? "cursor-default" : "hover:border-(--deception-cyan)"}`}
                    >
                      <span className="truncate">{option.textVi}</span>
                      <span className="ml-2 text-xs uppercase tracking-[0.08em]">{selected ? "●" : "○"}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </article>
        );
      })}
    </div>
  );
}
