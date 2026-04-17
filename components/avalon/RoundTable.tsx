"use client";

import { AvalonPlayer, AvalonRoom } from '@/server/game/AvalonTypes';
import { useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import Image from 'next/image';
import { HelpCircle, Hand, ChevronUp, ChevronDown, Wifi, Crown } from 'lucide-react';
import CenterBoard from './CenterBoard';
import { getRoleImageSrcForViewer } from './roleImage';
import { useSceneScale } from '@/hooks/useSceneScale';

export default function RoundTable({ gameState, me, socket, roomId, isRoleHidden = false, isReadOnly = false, playerPings = {} }: { gameState: AvalonRoom, me: AvalonPlayer, socket: Socket | null, roomId: string, isRoleHidden?: boolean, isReadOnly?: boolean, playerPings?: Record<string, number> }) {
   const [isQuestHistoryOpen, setIsQuestHistoryOpen] = useState(false);
   const [isSpectatorPanelExpanded, setIsSpectatorPanelExpanded] = useState(true);
   const stageRef = useRef<HTMLDivElement | null>(null);
   const SCENE_BASE_WIDTH = 1120;
   const SCENE_BASE_HEIGHT = 560;
   const sceneScale = useSceneScale({
      viewportRef: stageRef,
      sceneWidth: SCENE_BASE_WIDTH,
      sceneHeight: SCENE_BASE_HEIGHT,
      padding: 20,
      minViewportWidth: 300,
   });
   // Keep disconnected players in the active pool so they don't lose their seats mid-game.
   const activePlayers = gameState.players.filter((p: AvalonPlayer) => !p.isSpectator);
   const spectators = gameState.players.filter((p: AvalonPlayer) => p.status === 'connected' && p.isSpectator);
   const raisedSpectatorsCount = spectators.filter((p) => p.isHandRaised).length;
   const numPlayers = activePlayers.length;
   const questParticipantsHistory = gameState.questParticipantsHistory ?? [];
   const showQuestParticipantsBoard = Boolean(gameState.settings?.showQuestParticipantsBoard);
   const playerNameById = new Map(gameState.players.map((player) => [player.userId, player.name]));
   const questRecordByNumber = new Map(
      questParticipantsHistory.map((record) => [record.questNumber, record]),
   );

   const myIndex = activePlayers.findIndex((p: AvalonPlayer) => p.userId === me.userId);
  
   const seatedPlayers: AvalonPlayer[] = [];
   const baseIndex = myIndex >= 0 ? myIndex : 0;
   for (let i = 0; i < numPlayers; i++) {
        // We push activePlayers in order so that seatedPlayers[0] is always 'Me' (if playing)
        const idx = (baseIndex + i) % numPlayers;
        seatedPlayers.push(activePlayers[idx]);
   }

   // -------------------------------------------------------------
   // LAYOUT LOGIC FOR BOX-BASED TABLE (App.tsx template clone)
   // -------------------------------------------------------------
   const getMapping = (n: number) => {
      switch (n) {
         case 5: return { bottom: [1, 0, 4], left: [], top: [2, 3], right: [] };
         case 6: return { bottom: [1, 0, 5], left: [2], top: [3], right: [4] };
         case 7: return { bottom: [1, 0, 6], left: [2], top: [3, 4], right: [5] };
         case 8: return { bottom: [1, 0, 7], left: [3, 2], top: [4, 5], right: [6] };
         case 9: return { bottom: [1, 0, 8], left: [3, 2], top: [4, 5, 6], right: [7] };
         case 10: return { bottom: [1, 0, 9], left: [3, 2], top: [4, 5, 6], right: [7, 8] };
         default: return { bottom: [0], left: [], top: [], right: [] };
      }
   };

   const layout = getMapping(numPlayers);

   // Responsive layout is now handled by useSceneScale

   return (
      <div
         ref={stageRef}
         className="avalon-table-stage flex-1 min-h-0 w-full relative flex flex-col items-center justify-center py-2 md:py-4 px-1 sm:px-2 overflow-hidden bg-transparent"
      >
         {/* Hidden priority images to warm Next.js image optimizer cache for mission splashes */}
         <Image src="/Image/mission_success.png" alt="" fill priority sizes="1px" className="opacity-0 pointer-events-none absolute w-px h-px" aria-hidden="true" unoptimized={false} />
         <Image src="/Image/mission_failed.png" alt="" fill priority sizes="1px" className="opacity-0 pointer-events-none absolute w-px h-px" aria-hidden="true" unoptimized={false} />
         <div className="absolute left-2 top-2 z-40 pointer-events-none flex flex-col items-start gap-2">
            <div className="flex items-center gap-2 pointer-events-auto">
               {showQuestParticipantsBoard && (
                  <button
                     type="button"
                     onClick={() => setIsQuestHistoryOpen(true)}
                     className="rounded-lg border border-(--tertiary)/45 bg-surface-container-low/85 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-(--tertiary) shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-colors hover:bg-surface-container cursor-pointer"
                  >
                     Lịch sử
                  </button>
               )}
               {me.isHost && (
                  <Crown className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_10px_rgba(252,211,77,0.7)]" />
               )}
               <div className="rounded-lg border border-(--outline-variant)/45 bg-surface-container-low/85 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-(--secondary)/80 shadow-[0_8px_24px_rgba(0,0,0,0.35)] flex items-center">
                  #{roomId.substring(0, 6)}
               </div>
            </div>
            
            {spectators.length > 0 && (
               <div className="rounded-lg border border-outline-variant/45 bg-surface-container-low/85 px-2 py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.35)] max-w-[80vw] sm:max-w-[40vw] pointer-events-auto">
                  <div className="flex items-center gap-2">
                     <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/70 pl-1 shrink-0 whitespace-nowrap">
                        Khán giả ({spectators.length})
                     </span>
                     {raisedSpectatorsCount > 0 && (
                        <span className="rounded-full border border-emerald-300/40 bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-200 whitespace-nowrap">
                           {raisedSpectatorsCount} dơ tay
                        </span>
                     )}
                     <button
                        type="button"
                        onClick={() => setIsSpectatorPanelExpanded((prev) => !prev)}
                        title={isSpectatorPanelExpanded ? 'Thu gọn khung khán giả' : 'Mở rộng khung khán giả'}
                        aria-label={isSpectatorPanelExpanded ? 'Thu gọn khung khán giả' : 'Mở rộng khung khán giả'}
                        className="ml-auto inline-flex items-center justify-center rounded-md border border-white/10 bg-surface-container p-1 text-on-surface-variant/80 transition-colors hover:bg-surface-container-high cursor-pointer"
                     >
                        {isSpectatorPanelExpanded ? (
                           <ChevronUp className="h-3.5 w-3.5 text-on-surface" />
                        ) : (
                           <ChevronDown className="h-3.5 w-3.5 text-on-surface" />
                        )}
                     </button>
                  </div>

                  {isSpectatorPanelExpanded && (
                     <div className="mt-1.5 flex items-center gap-1.5 overflow-x-auto custom-avalon-scrollbar">
                        {spectators.map(spec => (
                           <div
                              key={spec.userId}
                              className="flex items-center gap-1.5 bg-surface-container p-1 pr-2 rounded-full border border-white/5 shrink-0"
                              title={spec.isHandRaised ? 'Khán giả đang dơ tay' : 'Đang theo dõi ngoài màn hình'}
                           >
                              <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-800 shrink-0 relative opacity-60 grayscale mix-blend-luminosity">
                                 <Image
                                    src="/avalon_roles/cloneavatar.jpg"
                                    alt={spec.name}
                                    fill
                                    sizes="20px"
                                    className="object-cover"
                                 />
                              </div>
                              <span className="text-[10px] font-medium text-slate-300 truncate max-w-15 leading-none">{spec.name}</span>
                              {spec.isHandRaised && (
                                 <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.65)]">
                                    <Hand className="h-2.5 w-2.5" />
                                 </span>
                              )}
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            )}
         </div>

         {showQuestParticipantsBoard && (
               <>


                  {isQuestHistoryOpen && (
                     <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-3 pointer-events-auto backdrop-blur-sm"
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

                           <div className="mt-3 max-h-[55vh] space-y-2 overflow-y-auto pr-1 custom-avalon-scrollbar">
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

         {/* -------------------------------------------------------------
             MAIN TABLE LAYOUT (Responsive Grid mapping)
             ------------------------------------------------------------- */}
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
         <div
            className="avalon-table-scene relative flex flex-col justify-between items-center pointer-events-none"
            style={{
               width: `${SCENE_BASE_WIDTH}px`,
               height: `${SCENE_BASE_HEIGHT}px`,
               transform: `scale(${sceneScale})`,
               transformOrigin: 'center center',
            }}
         >
            
            {/* Top Row */}
            <div className="flex justify-around w-full px-20 h-24">
               {layout.top.map((idx) => {
                  const player = seatedPlayers[idx];
                  if (!player) return null;
                  return <PlayerCard key={player.userId} player={player} me={me} gameState={gameState} socket={socket} isRoleHidden={isRoleHidden} isReadOnly={isReadOnly} ping={playerPings[player.userId]} />;
               })}
            </div>

            {/* Middle Section */}
            <div className="flex items-center justify-between w-full flex-1 my-4 px-8">
               {/* Left Players */}
               <div className="flex flex-col justify-evenly h-full gap-8 w-24">
                  {layout.left.map((idx) => {
                     const player = seatedPlayers[idx];
                     if (!player) return null;
                     return <PlayerCard key={player.userId} player={player} me={me} gameState={gameState} socket={socket} isLeft isRoleHidden={isRoleHidden} isReadOnly={isReadOnly} ping={playerPings[player.userId]} />;
                  })}
               </div>

               {/* Central Board */}
               <div className="flex-1 flex justify-center items-center mx-4 pointer-events-auto">
                  <CenterBoard gameState={gameState} me={me} socket={socket} isReadOnly={isReadOnly} />
               </div>

               {/* Right Players */}
               <div className="flex flex-col justify-evenly h-full gap-8 w-24 items-end">
                  {layout.right.map((idx) => {
                     const player = seatedPlayers[idx];
                     if (!player) return null;
                     return <PlayerCard key={player.userId} player={player} me={me} gameState={gameState} socket={socket} isRight isRoleHidden={isRoleHidden} isReadOnly={isReadOnly} ping={playerPings[player.userId]} />;
                  })}
               </div>
            </div>

            {/* Bottom Row */}
            <div className="flex justify-around w-full px-20 h-24">
               {layout.bottom.map((idx) => {
                  const player = seatedPlayers[idx];
                  if (!player) return null;
                  return <PlayerCard key={player.userId} player={player} me={me} gameState={gameState} socket={socket} isRoleHidden={isRoleHidden} isReadOnly={isReadOnly} ping={playerPings[player.userId]} />;
               })}
            </div>
         </div>
         </div>
      </div>
   );
}

type PlayerCardProps = {
   player: AvalonPlayer;
   me: AvalonPlayer;
   gameState: AvalonRoom;
   socket: Socket | null;
   isLeft?: boolean;
   isRight?: boolean;
   isRoleHidden?: boolean;
   isReadOnly?: boolean;
   ping?: number;
};

function PlayerCard({ player, me, gameState, socket, isLeft, isRight, isRoleHidden = false, isReadOnly = false, ping }: PlayerCardProps) {
   void isLeft;
   void isRight;
   const isMe = player.userId === me.userId;
   const isLeader = gameState.players[gameState.leaderIndex]?.userId === player.userId;
   const isProposed = gameState.proposedTeam?.includes(player.userId) ?? false;
   const meIsLeader = gameState.players[gameState.leaderIndex]?.userId === me.userId;
   const isTeamBuilding = gameState.state === 'TEAM_BUILDING';
   const isClickable = isTeamBuilding && meIsLeader && !isReadOnly && !me.isSpectator;

   const shouldShowRoleAvatar =
      player.userId === me.userId ||
      Boolean(player.role) ||
      (me.role === 'Merlin' && player.team === 'Evil');

   // Privacy Shield: hide role-revealing info, keep leader crown
   const effectiveShowRole = isRoleHidden ? false : shouldShowRoleAvatar;
   const showEvilTag = !isRoleHidden && player.userId !== me.userId && player.team === 'Evil';
   const showMerlinTag = !isRoleHidden && player.userId !== me.userId && player.role === 'Merlin' && me.role === 'Percival';
   const publicFunctionTag = gameState.privateFunctionTagByTargetUserId?.[player.userId];

   let borderColor = "border-outline-variant/30";
   if (isProposed && isLeader) borderColor = "border-[#d39b2e]";
   else if (isProposed) borderColor = "border-(--primary)";
   else if (isLeader) borderColor = "border-[#d39b2e]";
   
   let shadowColor = "";
   if (isProposed) shadowColor = "shadow-[0_0_20px_rgba(131,195,163,0.3)]";
   else if (isLeader) shadowColor = "shadow-[0_0_15px_rgba(211,155,46,0.3)]";

   const isDisconnected = player.status === 'disconnected';

   return (
      <div 
         className={`relative group pointer-events-auto flex items-center justify-center transition-all duration-300 z-20 ${isClickable ? 'cursor-pointer hover:scale-105 hover:z-30' : ''}`}
         onClick={() => {
            if (isClickable) socket?.emit('toggleTeamSelection', player.userId);
         }}
      >
         {/* 'Me' Visibility badge */}
         {isMe && (
            <div className="absolute -left-2 -top-2 z-30 bg-(--primary) text-[#0b1320] p-1 rounded-full shadow-[0_0_10px_rgba(131,195,163,0.5)] border border-white/20 scale-100">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
            </div>
         )}

         {player.isHandRaised && !isDisconnected && (
            <div className="absolute -left-6 -bottom-2 z-60 rounded-full bg-emerald-500 p-2 text-white ring-2 ring-emerald-200 shadow-[0_8px_18px_rgba(16,185,129,0.65)]">
               <Hand className="w-4 h-4" />
            </div>
         )}
         
         <div className={`w-20 h-20 lg:w-24 lg:h-24 rounded-lg bg-[#0f172a]/90 backdrop-blur-md border-2 p-1 transition-all ${borderColor} ${shadowColor} ${isMe ? 'scale-110 ring-4 ring-(--primary)/20' : ''}`}>
            {effectiveShowRole ? (
               <div className={`relative w-full h-full rounded overflow-hidden bg-surface-container-low ${isDisconnected ? 'opacity-40 grayscale' : ''}`}>
                  <Image
                     src={getRoleImageSrcForViewer(player, me)}
                     alt={`Avatar`}
                     fill
                     sizes="96px"
                     className="object-cover"
                     unoptimized
                  />
               </div>
            ) : (
               <div className={`relative w-full h-full rounded overflow-hidden bg-slate-950 border border-slate-800/80 shadow-inner ${isDisconnected ? 'opacity-40 grayscale' : ''}`}>
                  <Image
                     src="/avalon_roles/cloneavatar.jpg"
                     alt="Unknown Identity"
                     fill
                     sizes="96px"
                     className="object-cover opacity-50 mix-blend-luminosity grayscale"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-linear-to-b from-transparent to-black/60 backdrop-blur-[1px]">
                     <span className="text-xl sm:text-2xl lg:text-3xl font-serif text-slate-400 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        ?
                     </span>
                  </div>
               </div>
            )}
            
            {isDisconnected && (
               <div className="absolute inset-0 flex items-center justify-center z-30 drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
                   <div className="bg-red-500/20 border border-red-500/50 backdrop-blur-sm px-1.5 py-0.5 rounded-sm flex items-center justify-center -rotate-12 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                     <span className="text-[6.5px] uppercase font-black tracking-widest text-red-100">Đứt cáp</span>
                   </div>
               </div>
            )}

            {publicFunctionTag && !isRoleHidden && !isDisconnected && (
               <div className="absolute inset-0 z-35 flex items-center justify-center pointer-events-none px-1">
                  <div className={`rounded-md border px-2 py-1 text-[7px] md:text-[8px] font-black uppercase tracking-widest text-center leading-none shadow-[0_8px_16px_rgba(0,0,0,0.55)] ${
                     publicFunctionTag === 'hasFunction'
                        ? 'border-cyan-300/65 bg-cyan-500/80 text-[#021925]'
                        : 'border-amber-200/70 bg-amber-500/80 text-[#261701]'
                  }`}>
                     {publicFunctionTag === 'hasFunction' ? 'CÓ CHỨC NĂNG' : 'KHÔNG CÓ CHỨC NĂNG'}
                  </div>
               </div>
            )}
         </div>

         {/* Good/Evil/Unknown Overlays */}
         {!effectiveShowRole && (
            <div className="absolute -top-3 right-0 flex flex-col items-end gap-1 z-30">
               <div className="bg-slate-800/95 text-slate-300 text-[6px] md:text-[7px] px-1 md:px-1.5 py-0.5 rounded font-bold uppercase tracking-widest shadow-[0_2px_10px_rgba(0,0,0,0.5)] border border-slate-600/50 whitespace-nowrap flex items-center gap-1">
                  <HelpCircle className="w-2 h-2" /> Lai Lịch Bí Ẩn
               </div>
            </div>
         )}
         {showEvilTag && (
            <div className="absolute -top-3 right-0 flex flex-col items-end gap-1 z-30">
               <div className="bg-(--tertiary) text-white text-[6px] md:text-[7px] px-1 md:px-1.5 py-0.5 rounded font-bold uppercase tracking-widest shadow-md border border-white/20 whitespace-nowrap">
                  {me.role === 'Merlin' ? 'Ác' : (player.role ? player.role.replace('_', ' ').toUpperCase() : 'Minion')}
               </div>
            </div>
         )}

         {showMerlinTag && (
            <div className="absolute -top-3 left-0 z-30">
               <div className="bg-(--primary) text-[#0b1320] text-[6px] md:text-[7px] px-1 md:px-1.5 py-0.5 rounded font-bold uppercase tracking-widest shadow-md border border-white/20 whitespace-nowrap">
                  Merlin (?)
               </div>
            </div>
         )}

         {isLeader && (
            <div className="absolute top-1 right-1 text-[#2a1e0b] z-40 rounded-full bg-[#d39b2e] p-1 border border-white/30 shadow-[0_0_14px_rgba(211,155,46,0.7)]">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                 <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
               </svg>
            </div>
         )}

         {/* MISSION Tag */}
         {isProposed && (
            <div className="absolute -left-12 top-1/2 -translate-y-1/2 bg-green-600 border border-green-400 px-3 py-1 rounded-full text-[9px] font-extrabold tracking-[0.2em] text-white shadow-[0_0_15px_rgba(34,197,94,0.7)] z-30 uppercase ring-1 ring-white/30">
               QUEST
            </div>
         )}

         {isMe && (
            <div className="absolute -right-16 -translate-x-1/2 bg-(--primary) text-[#0b1320] px-3 py-0.5 rounded-full text-[10px] font-extrabold tracking-widest shadow-[0_0_15px_rgba(131,195,163,0.5)] z-40 whitespace-nowrap">
               {"BẠN"}
            </div>
         )}

         {/* Name Label */}
         <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded text-[9px] font-headline tracking-widest border border-white/10 whitespace-nowrap z-50 flex flex-col items-center leading-none ${isLeader ? 'bg-[#d39b2e] text-[#2a1e0b] shadow-[0_4px_12px_rgba(211,155,46,0.4)]' : 'bg-[#1e293b] text-slate-300'} ${isMe ? 'border-(--primary)/50 px-4 shadow-lg ring-1 ring-(--primary)/30' : ''}`}>
            {isLeader && <span className="text-[5px] font-black tracking-[0.2em] opacity-80 mb-0.5 uppercase">LEADER</span>}
            <span className="font-bold">
               {player.name}
            </span>
         </div>

         {/* Ping Label */}
         {ping !== undefined && (
            <div className={`absolute -right-10 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full text-[8px] font-black font-mono tracking-tighter flex items-center gap-1 z-40 bg-black/60 backdrop-blur-md border border-white/10 shadow-[0_4px_10px_rgba(0,0,0,0.5)] ${ping < 150 ? 'text-emerald-400' : ping < 350 ? 'text-amber-400' : 'text-red-500'}`}>
               <Wifi className="w-2.5 h-2.5 opacity-80" />
               <span className="mt-px">{Math.min(999, ping)}ms</span>
            </div>
         )}
      </div>
   );
}