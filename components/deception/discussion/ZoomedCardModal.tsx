import React from "react";
import Image from "next/image";
import type { MeansCard, ClueCard } from "@/server/game/DeceptionTypes";

interface ZoomedCardModalProps {
  zoomedCard: {
    card: MeansCard | ClueCard;
    tone: "means" | "clue";
    imageUrl: string;
  };
  onClose: () => void;
}

export default function ZoomedCardModal({ zoomedCard, onClose }: ZoomedCardModalProps) {
  return (
    <div
      className="fixed inset-0 z-80 flex flex-col items-center justify-center bg-black/85 p-4 backdrop-blur-md select-none touch-none"
      onPointerUp={onClose}
      onPointerCancel={onClose}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className="pointer-events-none relative flex w-full flex-col items-center gap-3 sm:gap-4 animate-in fade-in zoom-in duration-200"
      >
        {/* Image Container */}
        <div
          className={`relative aspect-square h-[min(82vw,52dvh)] shrink-0 overflow-hidden rounded-2xl border-2 shadow-[0_20px_50px_rgba(0,0,0,0.8)] ${zoomedCard.tone === "means" ? "border-(--deception-amber)" : "border-(--deception-cyan)"}`}
        >
          <Image
            src={zoomedCard.imageUrl}
            alt={
              zoomedCard.card.vietnamese ||
              zoomedCard.card.english ||
              "Card"
            }
            fill
            unoptimized
            className="object-cover"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(to_top,rgba(0,0,0,0.9),transparent)]" />
          <div className="absolute inset-x-0 bottom-0 p-4 text-center">
            <p
              className={`text-[10px] font-black uppercase tracking-widest ${zoomedCard.tone === "means" ? "text-(--deception-amber)" : "text-(--deception-cyan)"}`}
            >
              {zoomedCard.tone === "means" ? "Hung khí" : "Manh mối"}
            </p>
            <h3 className="mt-1 text-lg font-bold uppercase leading-tight text-white drop-shadow-md">
              {zoomedCard.card.vietnamese || zoomedCard.card.english}
            </h3>
          </div>
        </div>

        {/* Description Container */}
        {zoomedCard.card.description && (
          <div
            className={`w-full max-w-xs sm:max-w-sm rounded-xl border p-3 sm:p-4 text-center backdrop-blur-sm ${zoomedCard.tone === "means" ? "border-(--deception-amber)/30 bg-(--deception-amber)/10 text-(--deception-amber-soft)" : "border-(--deception-cyan)/30 bg-(--deception-cyan)/10 text-(--deception-cyan-soft)"}`}
          >
            <p className="text-sm italic leading-relaxed">
              &quot;{zoomedCard.card.description}&quot;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
