"use client";

import { useEffect, useState } from "react";
import { AvalonRoom, AvalonPlayer } from "@/server/game/AvalonTypes";
import { Music, Eye } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function MinionCinematicOverlays({ gameState, me }: { gameState: AvalonRoom, me: AvalonPlayer }) {
  // --- Cha Cha Cha Logic ---
  const [hiddenChaChaQuest, setHiddenChaChaQuest] = useState<number | null>(null);
  const currentChaChaQuest = gameState.skillDecisionState?.questNumber ?? null;

  const showChaCha = Boolean(
    gameState.state === "QUEST" && 
    gameState.skillDecisionState?.successfulChaChaUserIds?.includes(me.userId) &&
    hiddenChaChaQuest !== currentChaChaQuest
  );

  useEffect(() => {
    if (showChaCha && currentChaChaQuest !== null) {
      const t = setTimeout(() => {
        setHiddenChaChaQuest(currentChaChaQuest);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [showChaCha, currentChaChaQuest]);

  // --- Soulmate Logic ---
  const hasSoulmate = Boolean(gameState.minionSoulmates?.includes(me.userId));
  const [soulmateHidden, setSoulmateHidden] = useState(false);

  const otherMinionId = hasSoulmate ? gameState.minionSoulmates!.find(id => id !== me.userId) : null;
  const otherMinion = otherMinionId ? gameState.players.find(p => p.userId === otherMinionId) : null;
  const soulmatePopupTarget = (hasSoulmate && !soulmateHidden && otherMinion) ? otherMinion.name : null;

  useEffect(() => {
    if (soulmatePopupTarget) {
      const t = setTimeout(() => {
        setSoulmateHidden(true);
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [soulmatePopupTarget]);

  return (
    <AnimatePresence>
      {showChaCha && (
        <motion.div
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 1, scale: 1 }}
           exit={{ opacity: 0, scale: 1.1 }}
           className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-none p-4 text-center"
        >
          <div className="flex flex-col items-center gap-6">
            <motion.div 
               animate={{ rotate: 360 }} 
               transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
               className="w-24 h-24 rounded-full bg-pink-500/20 border-2 border-pink-500 flex items-center justify-center shadow-[0_0_50px_rgba(236,72,153,0.4)]"
            >
               <Music className="w-12 h-12 text-pink-400" />
            </motion.div>
            <h1 className="text-4xl sm:text-5xl font-headline font-extrabold text-pink-400 tracking-widest uppercase drop-shadow-[0_4px_10px_rgba(236,72,153,0.5)]">
              ĐANG NHẢY CHA CHA CHA
            </h1>
          </div>
        </motion.div>
      )}

      {soulmatePopupTarget && (
        <motion.div
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 1, scale: 1 }}
           exit={{ opacity: 0, scale: 1.1 }}
           className="fixed inset-0 z-100 flex items-center justify-center bg-black/85 backdrop-blur-md pointer-events-none p-4 text-center"
        >
          <div className="flex flex-col items-center gap-6">
            <motion.div 
               animate={{ scale: [1, 1.1, 1] }} 
               transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
               className="w-24 h-24 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.4)]"
            >
               <Eye className="w-12 h-12 text-amber-400" />
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-headline font-bold text-(--on-surface-variant) tracking-widest uppercase">
              Người anh em của tôi chính là...
            </h1>
            <p className="text-5xl sm:text-7xl font-black text-amber-400 tracking-[0.2em] shadow-black drop-shadow-2xl mt-4">
              {soulmatePopupTarget}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
