"use client";

import { AvalonRoom, AvalonPlayer } from '@/server/game/AvalonTypes';
import { Socket } from 'socket.io-client';
import Image from 'next/image';
import { type ReactNode } from 'react';
import { Award, RefreshCw, ShieldCheck, ShieldAlert, Skull } from 'lucide-react';
import { getRoleImageSrcForViewer } from './roleImage';

export default function GameOver({ gameState, me, socket }: { gameState: AvalonRoom, me: AvalonPlayer, socket: Socket | null }) {
  const isHost = me.isHost;
  const goodWon = gameState.winner === 'Good';
   const isAbandoned = gameState.winner === 'Abandoned';
   const isGoodVictory = goodWon && !isAbandoned;
   const isEvilVictory = !goodWon && !isAbandoned;

   const headlineCopy = isAbandoned
      ? {
            eyebrow: 'ABANDONED MATCH',
            title: 'THE TABLE FALLS SILENT',
            subtitle: 'The round ends before either side can claim the crown.',
         }
      : isGoodVictory
         ? {
               eyebrow: 'QUEST COMPLETE',
               title: 'VICTORY FOR THE FORCES OF GOOD',
               subtitle: 'The darkness recedes as the kingdom is pulled back from betrayal.',
            }
         : {
               eyebrow: 'THE FINAL DECREE',
               title: 'THE SHADOWS TRIUMPH',
               subtitle: 'Mordred’s minions have corrupted the realm. Camelot falls into night.',
            };

   const primaryTeam = isGoodVictory ? 'Good' : 'Evil';
   const secondaryTeam = primaryTeam === 'Good' ? 'Evil' : 'Good';
   const primaryLabel = isGoodVictory ? 'Loyal Servants of Arthur' : 'Minions of Mordred';
   const secondaryLabel = isGoodVictory ? 'Minions of Mordred' : 'Loyal Servants of Arthur';
   const primaryToneClass = isGoodVictory ? 'text-primary-avalon' : 'text-tertiary-avalon';
   const secondaryToneClass = isGoodVictory ? 'text-tertiary-avalon' : 'text-primary-avalon';
   const titleGlow = isGoodVictory
      ? 'drop-shadow-[0_0_24px_rgba(186,200,220,0.35)]'
      : isEvilVictory
         ? 'drop-shadow-[0_0_24px_rgba(255,180,168,0.30)]'
         : 'drop-shadow-[0_0_18px_rgba(198,199,195,0.20)]';

   return (
      <div className={`absolute inset-0 z-100 overflow-y-auto overflow-x-hidden animate-in fade-in duration-700 ${isEvilVictory ? 'avalon-atmospheric-bg' : 'avalon-castle-bg'}`}>
         <div className="min-h-full px-4 py-8 md:px-6 lg:px-8 bg-black/35 backdrop-blur-sm">
            <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-8 md:gap-10">
               <div className="w-full max-w-4xl text-center pt-8 md:pt-14">
                  <p className={`text-[10px] md:text-xs uppercase tracking-[0.4em] font-label ${isAbandoned ? 'text-on-surface-variant' : primaryToneClass}`}>
                     {headlineCopy.eyebrow}
                  </p>
                  <h1 className={`mt-3 text-4xl sm:text-5xl md:text-7xl font-headline font-bold uppercase tracking-tight leading-[0.92] ${isAbandoned ? 'text-on-surface-variant' : `${primaryToneClass} ${titleGlow}`}`}>
                     {headlineCopy.title}
                  </h1>
                  <p className="mt-4 max-w-3xl mx-auto text-base md:text-xl font-headline italic text-on-surface-variant/90 leading-relaxed">
                     {headlineCopy.subtitle}
                  </p>
                  {gameState.assassinationTarget && (
                     <p className="mt-4 text-sm md:text-base text-on-surface-variant/90 font-body">
                        Ai đó đã bị ám sát trong đêm.
                     </p>
                  )}
               </div>

               <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  <EndingFactionCard
                     title={primaryLabel}
                     players={gameState.players.filter((player) => player.team === primaryTeam)}
                     me={me}
                     accentClass={primaryToneClass}
                     panelClass={isAbandoned ? 'bg-surface-container-low/70 border-outline-variant/40' : isGoodVictory ? 'bg-primary-container/25 border-primary' : 'bg-tertiary-container/25 border-tertiary'}
                     emphasisClass={isAbandoned ? '' : isGoodVictory ? 'ring-2 ring-primary/55 shadow-[0_0_44px_rgba(186,200,220,0.24)]' : 'ring-2 ring-tertiary/55 shadow-[0_0_44px_rgba(255,180,168,0.24)]'}
                     icon={primaryTeam === 'Good' ? <ShieldCheck className="h-5 w-5" /> : <Skull className="h-5 w-5" />}
                     assassinationTarget={gameState.assassinationTarget}
                     muted={isAbandoned}
                     resultLabel={isAbandoned ? 'NO RESULT' : 'WINNER'}
                  />

                  <EndingFactionCard
                     title={secondaryLabel}
                     players={gameState.players.filter((player) => player.team === secondaryTeam)}
                     me={me}
                     accentClass={secondaryToneClass}
                     panelClass={isAbandoned ? 'bg-surface-container-low/70 border-outline-variant/40' : isGoodVictory ? 'bg-tertiary-container/20 border-tertiary' : 'bg-primary-container/20 border-primary'}
                     emphasisClass={isAbandoned ? '' : 'opacity-72 saturate-60'}
                     icon={secondaryTeam === 'Good' ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                     assassinationTarget={gameState.assassinationTarget}
                     muted={!isAbandoned}
                     resultLabel={isAbandoned ? 'NO RESULT' : 'DEFEATED'}
                  />
               </div>

               <div className="pb-8 md:pb-12 pt-2">
                  {isHost ? (
                     <button
                        className="inline-flex items-center gap-3 rounded-xl bg-primary px-10 py-4 text-lg font-bold text-on-primary shadow-[0_0_20px_rgba(186,200,220,0.24)] transition-all hover:brightness-110 active:scale-95"
                        onClick={() => socket?.emit('restartAvalonGame')}
                     >
                        <span>Play Again</span>
                        <RefreshCw className="h-5 w-5" />
                     </button>
                  ) : (
                     <p className="text-sm uppercase tracking-[0.25em] text-on-surface-variant">
                        Chờ chủ phòng bắt đầu ván mới...
                     </p>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
}

function EndingFactionCard({
   title,
   players,
   me,
   accentClass,
   panelClass,
   emphasisClass,
   icon,
   assassinationTarget,
   muted = false,
   resultLabel,
}: {
   title: string;
   players: AvalonPlayer[];
   me: AvalonPlayer;
   accentClass: string;
   panelClass: string;
   emphasisClass?: string;
   icon: ReactNode;
   assassinationTarget?: string | null;
   muted?: boolean;
   resultLabel?: string;
}) {
   const factionLabel = players.length > 0 && players[0].team === 'Good' ? 'Servants of Arthur' : 'Minions of Mordred';

   return (
      <div className={`avalon-ending-panel rounded-2xl p-5 md:p-6 lg:p-7 border-l-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)] ${panelClass} ${emphasisClass ?? ''} ${muted ? 'opacity-90' : ''}`}>
         <div className="flex items-center gap-3 mb-5">
            <div className={`${accentClass} shrink-0`}>{icon}</div>
            <div>
               <p className={`text-[10px] uppercase tracking-[0.35em] font-label ${muted ? 'text-on-surface-variant' : accentClass}`}>
                  {title}
               </p>
               <h3 className={`mt-1 font-headline text-xl md:text-2xl uppercase tracking-[0.18em] ${muted ? 'text-on-surface' : accentClass}`}>
                  {factionLabel}
               </h3>
            </div>
            {resultLabel && (
               <span className={`ml-auto rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${resultLabel === 'WINNER' ? `${accentClass} border-current bg-surface-container-low/55` : 'text-on-surface-variant border-outline-variant/45 bg-surface-container-lowest/45'}`}>
                  {resultLabel}
               </span>
            )}
         </div>

         <div className="space-y-3">
            {players.map((player) => {
               const isTarget = player.userId === assassinationTarget;
               const isSelf = player.userId === me.userId;

               return (
                  <div key={player.userId} className="flex items-center justify-between gap-4 rounded-xl border border-outline-variant/25 bg-surface-container-lowest/45 p-3 md:p-4">
                     <div className="flex min-w-0 items-center gap-3 md:gap-4">
                        <div className="relative h-10 w-10 md:h-11 md:w-11 overflow-hidden rounded-full border border-outline-variant/40 bg-surface-container-low">
                           <Image src={getRoleImageSrcForViewer(player, me)} alt={`Role ${player.name}`} fill sizes="44px" className="object-cover" />
                        </div>
                        <div className="min-w-0">
                           <p className="truncate font-body text-sm md:text-base font-bold text-on-surface">
                              {player.name}
                              {isSelf ? ' (Bạn)' : ''}
                           </p>
                           <p className={`truncate text-[10px] uppercase tracking-[0.18em] ${muted ? 'text-on-surface-variant/80' : 'text-on-surface-variant'}`}>
                              {player.role ? player.role.replace('_', ' ') : 'Unknown'}
                           </p>
                        </div>
                     </div>

                     <div className="flex shrink-0 items-center gap-2">
                        {isTarget && <Award className="h-4 w-4 text-tertiary-avalon" />}
                        <span className={`text-[10px] uppercase tracking-[0.25em] ${muted ? 'text-on-surface-variant' : accentClass}`}>
                           {player.status === 'disconnected' ? 'Lost' : 'Alive'}
                        </span>
                     </div>
                  </div>
               );
            })}
         </div>
      </div>
   );
}