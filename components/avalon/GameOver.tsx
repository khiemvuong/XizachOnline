"use client";

import { AvalonRoom, AvalonPlayer } from '@/server/game/AvalonTypes';
import { Socket } from 'socket.io-client';
import Image from 'next/image';
import { Award, Skull, RefreshCw, ShieldCheck, ShieldAlert } from 'lucide-react';
import { getRoleImageSrcForViewer } from './roleImage';

export default function GameOver({ gameState, me, socket }: { gameState: AvalonRoom, me: AvalonPlayer, socket: Socket | null }) {
  const isHost = me.isHost;
  const goodWon = gameState.winner === 'Good';

   const isAbandoned = gameState.winner === 'Abandoned';

  // In Game Over, getSafeStateForPlayer exposes all roles
  
   return (
      <div className={`absolute inset-0 z-100 animate-in zoom-in-95 duration-700 overflow-y-auto ${goodWon ? 'castle-bg' : 'atmospheric-bg'}`}>
         <div className="min-h-full px-4 py-8 bg-black/45 backdrop-blur-sm">
            <div className="mx-auto flex w-full max-w-6xl flex-col items-center">
               <div className="text-center mb-8">
                  <p className={`text-xs uppercase tracking-[0.35em] font-label ${goodWon ? 'text-primary-avalon' : 'text-tertiary-avalon'}`}>
                     {isAbandoned ? 'Abandoned Match' : 'Final Decree'}
                  </p>
                  <h1 className={`mt-3 text-5xl md:text-7xl font-headline font-bold uppercase tracking-tight ${isAbandoned ? 'text-on-surface-variant' : (goodWon ? 'text-primary-avalon drop-shadow-[0_0_20px_rgba(186,200,220,0.35)]' : 'text-tertiary-avalon drop-shadow-[0_0_20px_rgba(226,82,64,0.3)]')}`}>
                     {isAbandoned ? 'Trận Bị Huỷ' : (goodWon ? 'Thiện Thắng' : 'Bóng Tối Chiến Thắng')}
                  </h1>
                  {gameState.assassinationTarget && (
                     <p className="text-sm md:text-base text-on-surface-variant mt-3">Ai đó đã bị ám sát trong đêm.</p>
                  )}
               </div>

               <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`rounded-xl p-5 backdrop-blur-md border-l-4 shadow-xl ${goodWon ? 'bg-primary-container/25 border-primary' : 'bg-tertiary-container/25 border-tertiary'}`}>
                     <h3 className={`font-headline text-xl uppercase tracking-widest mb-4 flex items-center gap-2 ${goodWon ? 'text-primary-avalon' : 'text-tertiary-avalon'}`}>
                        {goodWon ? <ShieldCheck className="w-5 h-5" /> : <Skull className="w-5 h-5" />}
                        {goodWon ? 'Lực Lượng Chính Nghĩa' : 'Phe Bóng Tối'}
                     </h3>
                     <div className="space-y-3">
                        {gameState.players.filter((p) => p.team === (goodWon ? 'Good' : 'Evil')).map((player) => (
                           <div key={player.userId} className="flex items-center justify-between bg-surface-container-lowest/40 p-3 rounded-lg">
                              <div className="flex items-center gap-3 min-w-0">
                                 <div className="relative h-10 w-10 overflow-hidden rounded-full border border-outline-variant/40">
                                    <Image src={getRoleImageSrcForViewer(player, me)} alt={`Role ${player.name}`} fill sizes="40px" className="object-cover" />
                                 </div>
                                 <div className="min-w-0">
                                    <p className="font-body font-bold text-on-surface truncate">{player.name}</p>
                                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant truncate">{player.role ? player.role.replace('_', ' ') : 'Unknown'}</p>
                                 </div>
                              </div>
                              {player.userId === gameState.assassinationTarget && <Award className="w-4 h-4 text-tertiary-avalon" />}
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className={`rounded-xl p-5 backdrop-blur-md border-l-4 shadow-xl ${goodWon ? 'bg-tertiary-container/20 border-tertiary' : 'bg-primary-container/20 border-primary'}`}>
                     <h3 className={`font-headline text-xl uppercase tracking-widest mb-4 flex items-center gap-2 ${goodWon ? 'text-tertiary-avalon' : 'text-primary-avalon'}`}>
                        {goodWon ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                        {goodWon ? 'Phe Bại Trận' : 'Những Người Chống Cự'}
                     </h3>
                     <div className="space-y-3">
                        {gameState.players.filter((p) => p.team === (goodWon ? 'Evil' : 'Good')).map((player) => (
                           <div key={player.userId} className="flex items-center justify-between bg-surface-container-lowest/35 p-3 rounded-lg">
                              <div className="flex items-center gap-3 min-w-0">
                                 <div className="relative h-10 w-10 overflow-hidden rounded-full border border-outline-variant/40">
                                    <Image src={getRoleImageSrcForViewer(player, me)} alt={`Role ${player.name}`} fill sizes="40px" className="object-cover" />
                                 </div>
                                 <div className="min-w-0">
                                    <p className="font-body font-bold text-on-surface truncate">{player.name}</p>
                                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant truncate">{player.role ? player.role.replace('_', ' ') : 'Unknown'}</p>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               {isHost ? (
                  <button
                     className="mt-8 bg-primary text-on-primary px-10 py-4 rounded-xl font-bold text-lg hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center gap-3"
                     onClick={() => socket?.emit('restartAvalonGame')}
                  >
                     <span>Play Again</span>
                     <RefreshCw className="w-5 h-5" />
                  </button>
               ) : (
                  <p className="mt-8 text-on-surface-variant text-sm uppercase tracking-wider">Chờ chủ phòng bắt đầu ván mới...</p>
               )}
            </div>
         </div>
      </div>
   );
}