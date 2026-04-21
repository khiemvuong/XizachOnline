import React from "react";
import ForensicClueBoard from "@/components/deception/ForensicClueBoard";
import type { SceneTile } from "@/server/game/DeceptionTypes";

interface ForensicClueBoardModalProps {
  forensicHintTiles: SceneTile[];
    onClose: () => void;
}

export default function ForensicClueBoardModal({
  forensicHintTiles,
  onClose,
}: ForensicClueBoardModalProps) {
  return (
    <div className="fixed inset-0 z-60 bg-black/70 p-1.5 backdrop-blur-sm sm:p-4">
      <div className="mx-auto h-full w-full max-w-6xl overflow-hidden pt-1.5 sm:pt-6">
        <ForensicClueBoard
          tiles={forensicHintTiles}
          showCloseButton
          onClose={onClose}
        />
      </div>
    </div>
  );
}
