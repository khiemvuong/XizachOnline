"use client";

import { AvalonRoom, AvalonPlayer } from '@/server/game/AvalonTypes';
import { Socket } from 'socket.io-client';
import Image from 'next/image';
import { type ReactNode } from 'react';
import { Crown, RefreshCw, ShieldCheck, ShieldAlert, ShieldX, Skull, Swords } from 'lucide-react';
import { getRoleImageSrcForViewer } from './roleImage';

export default function GameOver({ gameState, me, socket }: { gameState: AvalonRoom, me: AvalonPlayer, socket: Socket | null }) {
  const isHost = me.isHost;
  const myTeam = me.team;
  const goodWon = gameState.winner === 'Good';
   const isAbandoned = gameState.winner === 'Abandoned';
   const isGoodVictory = goodWon && !isAbandoned;
   const isEvilVictory = !goodWon && !isAbandoned;
   const didMyTeamWin = !isAbandoned && !!myTeam && myTeam === gameState.winner;
   const personalCase = isAbandoned
      ? 'abandoned'
      : myTeam === 'Good' && didMyTeamWin
         ? 'good-win'
         : myTeam === 'Good' && !didMyTeamWin
            ? 'good-lose'
            : myTeam === 'Evil' && didMyTeamWin
               ? 'evil-win'
               : 'evil-lose';

   const personalVisual = {
      abandoned: {
         icon: <Crown className="h-5 w-5" />,
         badgeClass: 'text-on-surface-variant border-outline-variant/50 bg-surface-container/60',
         auraClass: 'from-slate-300/6 via-slate-400/6 to-transparent',
         panelGlowClass: 'shadow-[0_0_24px_rgba(160,170,185,0.18)]',
      },
      'good-win': {
         icon: <ShieldCheck className="h-5 w-5" />,
         badgeClass: 'text-primary-avalon border-primary/45 bg-primary/15',
         auraClass: 'from-sky-300/12 via-blue-300/10 to-transparent',
         panelGlowClass: 'shadow-[0_0_30px_rgba(186,200,220,0.28)]',
      },
      'good-lose': {
         icon: <ShieldX className="h-5 w-5" />,
         badgeClass: 'text-tertiary-avalon border-tertiary/45 bg-tertiary/15',
         auraClass: 'from-rose-300/12 via-orange-300/10 to-transparent',
         panelGlowClass: 'shadow-[0_0_30px_rgba(255,180,168,0.24)]',
      },
      'evil-win': {
         icon: <Swords className="h-5 w-5" />,
         badgeClass: 'text-primary-avalon border-primary/45 bg-primary/15',
         auraClass: 'from-cyan-300/12 via-sky-300/10 to-transparent',
         panelGlowClass: 'shadow-[0_0_30px_rgba(186,200,220,0.28)]',
      },
      'evil-lose': {
         icon: <Skull className="h-5 w-5" />,
         badgeClass: 'text-primary-avalon border-primary/45 bg-primary/15',
         auraClass: 'from-cyan-300/12 via-sky-300/10 to-transparent',
         panelGlowClass: 'shadow-[0_0_30px_rgba(186,200,220,0.28)]',
      },
   } as const;

   const personalOutcomeCopy = isAbandoned
      ? {
           label: 'NO SIDE PREVAILED',
           title: 'Ván đấu kết thúc sớm',
           subtitle: 'Không phe nào giành chiến thắng trong trận này.',
           toneClass: 'text-on-surface-variant',
           panelClass: 'border-outline-variant/45 bg-surface-container-low/55',
           panelStyle: { backgroundColor: 'rgba(100, 116, 139, 0.18)', borderColor: 'rgba(148, 163, 184, 0.45)' },
        }
      : myTeam === 'Good' && didMyTeamWin
         ? {
              label: 'YOUR SIDE WON',
              title: 'Bạn là Phe Thiện và đã chiến thắng',
              subtitle: 'Camelot đứng vững. Kế hoạch của phe ác đã bị phá vỡ.',
              toneClass: 'text-primary-avalon',
              panelClass: 'border-sky-300/55 bg-sky-500/18',
              panelStyle: { backgroundColor: 'rgba(56, 189, 248, 0.2)', borderColor: 'rgba(125, 211, 252, 0.62)' },
           }
         : myTeam === 'Good' && !didMyTeamWin
            ? {
                 label: 'YOUR SIDE LOST',
                 title: 'Bạn là Phe Thiện và đã thất bại',
                 subtitle: 'Phe ác đã lật ngược cục diện ở hồi kết.',
                 toneClass: 'text-tertiary-avalon',
                 panelClass: 'border-rose-300/55 bg-rose-500/16',
                 panelStyle: { backgroundColor: 'rgba(251, 113, 133, 0.2)', borderColor: 'rgba(253, 164, 175, 0.62)' },
              }
            : myTeam === 'Evil' && didMyTeamWin
               ? {
                    label: 'YOUR SIDE WON',
                    title: 'Bạn là Phe Ác và đã chiến thắng',
                    subtitle: 'Bóng tối bao trùm bàn tròn. Kế hoạch đã hoàn tất.',
                    toneClass: 'text-primary-avalon',
                    panelClass: 'border-sky-300/55 bg-sky-500/18',
                    panelStyle: { backgroundColor: 'rgba(56, 189, 248, 0.2)', borderColor: 'rgba(125, 211, 252, 0.62)' },
                 }
               : {
                    label: 'YOUR SIDE LOST',
                    title: 'Bạn là Phe Ác và đã thất bại',
                    subtitle: 'Phe thiện đã bảo vệ thành công vương quốc.',
                    toneClass: 'text-primary-avalon',
                    panelClass: 'border-sky-300/55 bg-sky-500/16',
                    panelStyle: { backgroundColor: 'rgba(251, 113, 133, 0.2)', borderColor: 'rgba(253, 164, 175, 0.62)' },
                 };

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
   const winnerBackdropTintClass = isAbandoned
      ? 'from-slate-500/10 via-slate-500/5 to-transparent'
      : isEvilVictory
         ? 'from-rose-500/24 via-red-500/14 to-transparent'
         : '';

   return (
      <div className={`avalon-gameover-shell fixed inset-0 z-100 overflow-y-auto overflow-x-hidden overscroll-contain animate-in fade-in duration-700 ${isEvilVictory ? 'avalon-atmospheric-bg' : 'avalon-castle-bg'}`}>
         <div className="avalon-gameover-frame relative min-h-full px-4 py-8 md:px-6 lg:px-8 bg-black/35 backdrop-blur-sm">
                  {winnerBackdropTintClass && (
                     <div className={`pointer-events-none absolute inset-0 bg-linear-to-br ${winnerBackdropTintClass}`}></div>
                  )}
            <div className="avalon-gameover-content relative mx-auto flex w-full max-w-6xl flex-col items-center gap-8 md:gap-10">
               <div className="w-full max-w-4xl text-center">
                  <p className={`text-[10px] md:text-xs uppercase tracking-[0.4em] font-label ${isAbandoned ? 'text-on-surface-variant' : primaryToneClass}`}>
                     {headlineCopy.eyebrow}
                  </p>
                  <h1 className={`avalon-gameover-title mt-3 text-4xl sm:text-5xl md:text-7xl font-headline font-bold uppercase tracking-tight leading-[0.92] ${isAbandoned ? 'text-on-surface-variant' : `${primaryToneClass} ${titleGlow}`}`}>
                     {headlineCopy.title}
                  </h1>
                  <p className="mt-4 max-w-3xl mx-auto text-base md:text-xl font-headline italic text-on-surface-variant/90 leading-relaxed">
                     {headlineCopy.subtitle}
                  </p>
                  <div className={`mt-5 inline-flex max-w-3xl flex-col items-center rounded-xl border px-4 py-3 ${personalOutcomeCopy.panelClass} ${personalVisual[personalCase].panelGlowClass}`} style={personalOutcomeCopy.panelStyle}>
                     <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${personalVisual[personalCase].badgeClass}`}>
                        {personalVisual[personalCase].icon}
                        {personalOutcomeCopy.label}
                     </div>
                     <p className={`mt-1 text-sm md:text-base font-semibold ${personalOutcomeCopy.toneClass}`}>
                        {personalOutcomeCopy.title}
                     </p>
                     <p className="mt-1 text-xs md:text-sm text-on-surface-variant/90">
                        {personalOutcomeCopy.subtitle}
                     </p>
                  </div>
                  {gameState.assassinationTarget && (
                     <p className="mt-4 text-sm md:text-base text-tertiary-avalon font-body">
                        Đã có người bị ám sát trong đêm. Danh sách bên dưới đã đánh dấu mục tiêu.
                     </p>
                  )}
               </div>

               <div className="avalon-gameover-grid w-full grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
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
                        {isTarget && <Skull className="h-4 w-4 text-tertiary-avalon" />}
                        <span className={`text-[10px] uppercase tracking-[0.25em] ${isTarget ? 'text-tertiary-avalon' : muted ? 'text-on-surface-variant' : accentClass}`}>
                           {isTarget ? 'Assassinated' : player.status === 'disconnected' ? 'Lost' : 'Alive'}
                        </span>
                     </div>
                  </div>
               );
            })}
         </div>
      </div>
   );
}