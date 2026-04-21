import Image from "next/image";
import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import type { ClueCard, MeansCard } from "@/server/game/DeceptionTypes";

type EvidenceCard = MeansCard | ClueCard;

interface EvidencePreviewCardProps {
  card: EvidenceCard;
  tone: "means" | "clue";
  highlighted: boolean;
  selected?: boolean;
  rotationClass: string;
  evidenceNum: string;
  imageUrl: string;
  onLongPress?: (card: EvidenceCard, tone: "means" | "clue", imageUrl: string) => void;
  onLongPressEnd?: () => void;
  onSelect?: (card: EvidenceCard, tone: "means" | "clue", imageUrl: string) => void;
}

export default function EvidencePreviewCard({
  card,
  tone,
  highlighted,
  selected = false,
  rotationClass,
  evidenceNum,
  imageUrl,
  onLongPress,
  onLongPressEnd,
  onSelect,
}: EvidencePreviewCardProps) {
  const isMeans = tone === "means";
  const englishTitle = card.english?.trim();
  const vietnameseTitle = card.vietnamese?.trim();
  const title = englishTitle
    ? vietnameseTitle &&
      vietnameseTitle.toLowerCase() !== englishTitle.toLowerCase()
      ? `${englishTitle} (${vietnameseTitle})`
      : englishTitle
    : vietnameseTitle || "Unknown";

  const tonePlaceholder =
    tone === "means"
      ? "bg-[radial-gradient(circle_at_20%_18%,rgba(255,184,0,0.22),transparent_50%),linear-gradient(180deg,#27303a,#1b212a)]"
      : "bg-[radial-gradient(circle_at_20%_18%,rgba(0,212,255,0.22),transparent_50%),linear-gradient(180deg,#27303a,#1b212a)]";
  const tonePaperClass = isMeans
    ? "bg-[#e2e2e5]"
    : "bg-[#efe5bf] deception-paper-texture";
  const toneTagClass = isMeans
    ? "bg-[#f2a4ad] text-[#5f1f29]"
    : "bg-[#97e8ff] text-[#03384a]";
  const toneBadgeClass = isMeans
    ? "bg-[#392b17] text-[#ffcf7a]"
    : "bg-[#0a3948] text-[#9deeff]";
  const pinOuterClass = isMeans ? "bg-slate-300" : "bg-cyan-200";
  const pinInnerClass = isMeans ? "bg-slate-600" : "bg-cyan-700";
  const imageFilterClass = isMeans
    ? "object-cover grayscale-28 opacity-90 transition-all duration-300 group-hover:grayscale-0 group-hover:opacity-100"
    : "object-cover opacity-95 saturate-110 contrast-105 transition-all duration-300 group-hover:saturate-125 group-hover:contrast-110";

  const LONG_PRESS_MS = 260;
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);
  const loadedImageSrcRef = useRef(imageUrl);

  useEffect(() => {
    loadedImageSrcRef.current = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    return () => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
      }
      longPressTriggeredRef.current = false;
    };
  }, []);

  const startPress = () => {
    if (!onLongPress && !onSelect) return;

    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }

    longPressTriggeredRef.current = false;

    if (!onLongPress) {
      return;
    }

    pressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      onLongPress(card, tone, loadedImageSrcRef.current || imageUrl);
    }, LONG_PRESS_MS);
  };

  const cancelPress = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const finishPress = () => {
    cancelPress();
    const wasLongPress = longPressTriggeredRef.current;
    if (wasLongPress && onLongPressEnd) {
      onLongPressEnd();
    }
    longPressTriggeredRef.current = false;
    return wasLongPress;
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.currentTarget.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    startPress();
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.currentTarget.releasePointerCapture) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const wasLongPress = finishPress();
    if (wasLongPress || !onSelect) return;

    onSelect(card, tone, loadedImageSrcRef.current || imageUrl);
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.releasePointerCapture) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Ignore if capture was already released
      }
    }
    finishPress();
  };

  const handlePointerLeave = () => {
    if (longPressTriggeredRef.current) {
      // If modal is already open, do not close it untill they release the pointer
      return;
    }
    cancelPress();
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerLeave}
      onContextMenu={(e) => {
        // Prevent default context menu on long press for touch devices to allow custom long press
        if (onLongPress) e.preventDefault();
      }}
      style={{ WebkitTouchCallout: "none", WebkitUserSelect: "none" }}
      className={`group relative h-full min-h-0 overflow-visible rounded-sm border p-1 md:p-1.5 shadow-[5px_5px_14px_rgba(0,0,0,0.45)] transition-transform duration-200 origin-top select-none ${rotationClass} ${
        highlighted
          ? tone === "means"
            ? "border-(--deception-amber) bg-[rgba(255,184,0,0.12)] shadow-[0_0_0_1px_rgba(255,184,0,0.24),5px_5px_16px_rgba(0,0,0,0.5)]"
            : "border-(--deception-cyan) bg-[rgba(0,212,255,0.12)] shadow-[0_0_0_1px_rgba(0,212,255,0.22),5px_5px_16px_rgba(0,0,0,0.5)]"
          : "border-(--deception-border) bg-[rgba(10,14,22,0.5)]"
      } ${selected
          ? isMeans
            ? "ring-2 ring-(--deception-amber) shadow-[0_0_0_1px_rgba(255,184,0,0.46),0_0_16px_rgba(255,184,0,0.3),5px_5px_16px_rgba(0,0,0,0.5)]"
            : "ring-2 ring-(--deception-cyan) shadow-[0_0_0_1px_rgba(0,212,255,0.42),0_0_16px_rgba(0,212,255,0.3),5px_5px_16px_rgba(0,0,0,0.5)]"
          : ""
        }`}
    >
      <div
        className={`absolute left-1/2 top-0.5 md:top-1 z-10 flex h-3 w-3 md:h-4 md:w-4 -translate-x-1/2 items-center justify-center rounded-full shadow-inner ${pinOuterClass}`}
      >
        <div className={`h-1 w-1 rounded-full ${pinInnerClass}`} />
      </div>

      <div
        className={`grid h-full min-h-0 grid-rows-[4.5fr_auto] md:grid-rows-[5fr_auto] rounded-sm p-0.5 md:p-1 ${tonePaperClass}`}
      >
        <div className="relative mt-0.5 md:mt-1 min-h-0 overflow-hidden rounded-sm border border-slate-900/15">
          <div
            className={`pointer-events-none absolute left-0.5 top-0.5 md:left-1 md:top-1 z-20 rounded px-1 py-0 md:px-1.5 md:py-0.5 text-[5px] md:text-[7px] font-black uppercase tracking-widest ${toneBadgeClass}`}
          >
            {isMeans ? "Means" : "Clue"}
          </div>

          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={englishTitle || vietnameseTitle || "Evidence"}
              fill
              unoptimized
              sizes="160px"
              onLoad={(event) => {
                const currentSrc = event.currentTarget.currentSrc || event.currentTarget.src;
                if (currentSrc) {
                  loadedImageSrcRef.current = currentSrc;
                }
              }}
              className={`${imageFilterClass} pointer-events-none select-none`}
            />
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center px-1 ${tonePlaceholder}`}
            >
              <div className="h-6 w-6 rounded-full border border-slate-300/45 bg-slate-100/12" />
            </div>
          )}
        </div>

        <div className="min-h-0 px-1 pb-0.5 pt-1 md:pb-0.5 md:pt-1 text-slate-900">
          <p
            className="w-full line-clamp-2 text-left text-[12px] leading-[1.15] font-bold italic md:text-[15px] md:leading-tight md:font-semibold text-slate-800"
            style={{
              fontFamily: "var(--font-cormorant), var(--font-headline), serif",
            }}
            title={title}
          >
            {title}
          </p>
        </div>
      </div>

      <div
        className={`pointer-events-none absolute -bottom-1.5 -right-1 md:-bottom-2 md:-right-2 px-1 py-0 md:px-2 md:py-0.5 text-[6px] md:text-[8px] font-black uppercase tracking-widest shadow-sm ${toneTagClass}`}
      >
        {isMeans ? "Means" : "Clue"} #{evidenceNum}
      </div>

      {selected && (
        <div
          className={`pointer-events-none absolute -left-1 -top-1 z-25 rounded-md border px-1 md:px-1.5 py-0 md:py-0.5 text-[6px] md:text-[8px] font-black uppercase tracking-[0.12em] ${
            isMeans
              ? "border-(--deception-amber) bg-(--deception-amber) text-black"
              : "border-(--deception-cyan) bg-(--deception-cyan) text-black"
          }`}
        >
          Đã chọn
        </div>
      )}

      {highlighted && (
        <>
          <div className="pointer-events-none absolute inset-0 rounded-sm ring-1 ring-inset ring-white/18" />
          <div className="pointer-events-none absolute left-0 top-1/2 h-5 w-full -translate-y-1/2 -rotate-12 scale-x-125 bg-[linear-gradient(90deg,rgba(255,61,96,0),rgba(255,61,96,0.32),rgba(255,61,96,0.58),rgba(255,61,96,0.32),rgba(255,61,96,0))] blur-[1.4px]" />
          <div className="pointer-events-none absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 -rotate-12 scale-x-125 bg-[#ff516e] shadow-[0_0_10px_rgba(255,81,110,0.55)]" />
        </>
      )}
    </div>
  );
}
