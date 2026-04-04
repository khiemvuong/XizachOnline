"use client";

import { AvalonPlayer, AvalonRoom } from '@/server/game/AvalonTypes';
import { useState } from 'react';
import { Socket } from 'socket.io-client';
import Image from 'next/image';
import CenterBoard from './CenterBoard';
import { getRoleImageSrcForViewer } from './roleImage';

export default function RoundTable({ gameState, me, socket }: { gameState: AvalonRoom, me: AvalonPlayer, socket: Socket | null }) {
   const [isQuestHistoryOpen, setIsQuestHistoryOpen] = useState(false);
  const activePlayers = gameState.players.filter((p: AvalonPlayer) => p.status === 'connected');
  const numPlayers = activePlayers.length;
   const questParticipantsHistory = gameState.questParticipantsHistory ?? [];
   const showQuestParticipantsBoard = Boolean(gameState.settings?.showQuestParticipantsBoard);
   const playerNameById = new Map(gameState.players.map((player) => [player.userId, player.name]));
   const questRecordByNumber = new Map(
      questParticipantsHistory.map((record) => [record.questNumber, record]),
   );

  const myIndex = activePlayers.findIndex((p: AvalonPlayer) => p.userId === me.userId);
  
  const seatedPlayers = [];
  for (let i = 0; i < numPlayers; i++) {
     const idx = (myIndex + i) % numPlayers;
     seatedPlayers.push(activePlayers[idx]);
  }

  return (
   <div className="flex-1 w-full min-h-100 h-full relative flex items-center justify-center py-4 px-2">
       <CenterBoard gameState={gameState} me={me} socket={socket} />

          {showQuestParticipantsBoard && (
               <>
                  <button
                     type="button"
                     onClick={() => setIsQuestHistoryOpen(true)}
                     className="absolute left-2 top-2 z-30 pointer-events-auto rounded-lg border border-(--tertiary)/45 bg-surface-container-low/85 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-(--tertiary) shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-colors hover:bg-surface-container"
                  >
                     Lịch sử nhiệm vụ
                  </button>

                  {isQuestHistoryOpen && (
                     <div
                        className="absolute inset-0 z-40 flex items-center justify-center bg-black/55 px-3 pointer-events-auto"
                        onClick={() => setIsQuestHistoryOpen(false)}
                     >
                        <div
                           className="w-full max-w-lg rounded-xl border border-(--outline-variant)/45 bg-surface-container-low/95 p-4 backdrop-blur-md shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
                           onClick={(event) => event.stopPropagation()}
                        >
                           <div className="flex items-center justify-between gap-3">
                              <p className="text-xs uppercase tracking-[0.22em] font-headline text-(--tertiary)">
                                 Lịch Sử Đi Nhiệm Vụ
                              </p>
                              <button
                                 type="button"
                                 onClick={() => setIsQuestHistoryOpen(false)}
                                 className="rounded-md border border-(--outline-variant)/55 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-(--on-surface-variant) transition-colors hover:bg-surface-container-high cursor-pointer"
                              >
                                 Đóng
                              </button>
                           </div>

                           <div className="mt-3 max-h-[55vh] space-y-2 overflow-y-auto pr-1">
                              {gameState.questHistory.map((quest, index) => {
                                 const questNumber = index + 1;
                                 const record = questRecordByNumber.get(questNumber);
                                 const participantNames = record
                                    ? record.participantUserIds.map((id) => playerNameById.get(id) ?? 'Ẩn danh')
                                    : [];

                                 return (
                                    <div key={questNumber} className="rounded-lg border border-(--outline-variant)/30 bg-surface-container-lowest/50 p-2">
                                       <div className="flex items-center justify-between gap-2">
                                          <p className="text-[10px] uppercase tracking-[0.18em] text-(--on-surface)">
                                             Phase {questNumber}
                                          </p>
                                          <span className={`text-[10px] uppercase tracking-[0.12em] ${quest.status === 'success' ? 'text-(--primary)' : quest.status === 'fail' ? 'text-(--tertiary)' : 'text-(--on-surface-variant)'}`}>
                                             {quest.status === 'pending' ? 'Chưa chạy' : quest.status === 'success' ? 'Thành công' : 'Thất bại'}
                                          </span>
                                       </div>
                                       <p className="mt-1 text-[11px] text-(--on-surface-variant)">
                                          {participantNames.length > 0 ? participantNames.join(', ') : 'Chưa có người đi nhiệm vụ'}
                                       </p>
                                    </div>
                                 );
                              })}
                           </div>
                        </div>
                     </div>
                  )}
               </>
          )}

       {/* Players Circle constraint to fit in viewport strictly minus breathing room */}
       {/* Players Circle constraint to fit in viewport strictly minus breathing room */}
       <div className="absolute inset-0 max-w-7xl mx-auto w-full h-full pointer-events-none">
          {seatedPlayers.map((player, index) => {
             const rightCount = Math.ceil(numPlayers / 2);
             const leftCount = numPlayers - rightCount;
             
             const isRight = index < rightCount;
             const maxAngle = Math.PI * 0.35; // 63 degrees
             
             let x = 0;
             let y = 0;
             const rx = 40; // 40% of container width from center
             const ry = 42; // 42% of container height from center
             
             if (isRight) {
                 const i = index;
                 let angle = 0;
                 if (rightCount > 1) {
                     angle = -maxAngle + (i / (rightCount - 1)) * (2 * maxAngle);
                 }
                 x = Math.cos(angle) * rx;
                 y = Math.sin(angle) * ry;
             } else {
                 const i = index - rightCount;
                 let angle = Math.PI;
                 if (leftCount > 1) {
                     angle = (Math.PI - maxAngle) + (i / (leftCount - 1)) * (2 * maxAngle);
                 }
                 x = Math.cos(angle) * rx;
                 y = Math.sin(angle) * ry;
             }
             
             const isMe = player.userId === me.userId;
             const isLeader = gameState.leaderIndex !== undefined && gameState.players[gameState.leaderIndex]?.userId === player.userId;
             const isProposed = gameState.proposedTeam.includes(player.userId);
             
             const meIsLeader = gameState.players[gameState.leaderIndex]?.userId === me.userId;
             const isTeamBuilding = gameState.state === 'TEAM_BUILDING';
             const isClickable = isTeamBuilding && meIsLeader;
                   const shouldShowRoleAvatar =
                      player.userId === me.userId ||
                      Boolean(player.role) ||
                      (me.role === 'Merlin' && player.team === 'Evil');

             return (
                <div 
                   key={player.userId}
                   className={`absolute w-28 md:w-32 flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 pointer-events-auto ${isClickable ? 'cursor-pointer hover:scale-105' : ''}`}
                   style={{
                      left: `calc(50% + ${x}%)`,
                      top: `calc(50% + ${y}%)`,
                      zIndex: isProposed ? 25 : 20
                   }}
                   onClick={() => {
                      if (isClickable) {
                         socket?.emit('toggleTeamSelection', player.userId);
                      }
                   }}
                >
                   {/* Avatar/Badge Container */}
                   <div className="relative">
                      {/* Special Vision Tags */}
                      {player.userId !== me.userId && player.team === 'Evil' && (
                         <div className="absolute -top-3 -right-2 bg-[#e46962] text-surface-dim-avalon text-[9px] font-bold px-1.5 py-0.5 rounded-sm z-30 shadow-md">
                           {me.role === 'Merlin' ? 'Ác' : (player.role ? player.role.replace('_', ' ').toUpperCase() : 'Đồng bọn')}
                         </div>
                      )}
                      
                      {player.userId !== me.userId && player.role === 'Merlin' && me.role === 'Percival' && (
                         <div className="absolute -top-3 -right-2 bg-primary-avalon text-surface-dim-avalon text-[9px] font-bold px-1.5 py-0.5 rounded-sm z-30 shadow-md">
                           Merlin (?)
                         </div>
                      )}

                      {/* Your Own Role Tag To Not Forget */}
                      {isMe && (
                         <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-max bg-[#83c3a3] text-surface-dim-avalon text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-sm z-30 shadow-md">
                           {me.role?.replace('_', ' ')}
                         </div>
                      )}

                      <div 
                         className={`w-14 h-14 md:w-16 md:h-16 rounded-full border-2 flex items-center justify-center bg-surface-dim-avalon transition-all relative ${isLeader ? 'avalon-glow-secondary z-10' : 'z-10'}`}
                         style={{ 
                            borderColor: isLeader ? 'var(--accent-secondary)' : (isMe ? 'var(--primary)' : 'var(--outline-variant)'),
                            boxShadow: isProposed ? '0 0 20px var(--primary)' : (isLeader ? '0 0 15px var(--accent-secondary)' : 'none')
                         }}
                      >
                                     {shouldShowRoleAvatar ? (
                                        <div className="relative h-full w-full overflow-hidden rounded-full">
                                           <Image
                                              src={getRoleImageSrcForViewer(player, me)}
                                              alt={`Role avatar ${player.name}`}
                                              fill
                                              sizes="64px"
                                              className="object-cover"
                                           />
                                        </div>
                                     ) : (
                                        <span className="text-xl md:text-2xl">{player.name.charAt(0).toUpperCase()}</span>
                                     )}
                      </div>
                   </div>
                   
                   {/* Name and Tags */}
                   <div className={`mt-1 md:mt-2 text-center p-1 rounded-sm backdrop-blur-md ${isProposed ? 'bg-(--primary)/20 border border-(--primary)' : ''}`}>
                      <span className="block font-sans text-xs md:text-sm font-bold truncate px-1 max-w-24 md:max-w-full" style={{ color: isProposed ? '#bac8dc' : 'var(--on-surface)' }}>
                         {player.name}
                      </span>
                      <div className="flex gap-1 justify-center mt-1 flex-wrap">
                         {isLeader && <span className="text-[9px] md:text-[10px] uppercase font-bold text-[#d39b2e] bg-[#2a1e0b] px-1 rounded-sm border border-[#d39b2e]">Thủ Lĩnh</span>}
                         {isMe && <span className="text-[9px] md:text-[10px] uppercase font-bold text-primary-avalon bg-[#1a2531] px-1 rounded-sm border border-primary-avalon">Bạn</span>}
                      </div>
                   </div>
                </div>
             );
          })}
       </div>
    </div>
  );
}