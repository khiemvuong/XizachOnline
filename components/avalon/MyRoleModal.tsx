"use client";

import { useState } from 'react';
import Image from 'next/image';
import { AvalonPlayer, AvalonRoom } from '@/server/game/AvalonTypes';
import { Fingerprint, CheckCircle2, Shield, Eye, AlertTriangle, Swords, X } from 'lucide-react';
import { getRoleImageSrcForViewer, getVisibleRoleLabelForViewer } from './roleImage';
import { AnimatePresence, motion } from 'framer-motion';

export default function MyRoleModal({ isOpen, onClose, gameState, me }: { isOpen: boolean, onClose: () => void, gameState: AvalonRoom, me: AvalonPlayer }) {
  const [isRevealing, setIsRevealing] = useState(false);
  const isEvil = me.team === 'Evil';
  const colorTheme = isEvil ? 'tertiary' : 'primary';
  const factionName = isEvil ? 'Thế Lực Hắc Ám' : 'Hiệp Sĩ Bàn Tròn';
  
  if (!isOpen) return null;

  // Find visible players based on obfuscation rules from the engine
  const visibleGood = gameState.players.filter((p: AvalonPlayer) => p.team === 'Good' && p.userId !== me.userId);
  const visibleEvil = gameState.players.filter((p: AvalonPlayer) => p.team === 'Evil' && p.userId !== me.userId);
  // Percival sees Merlin and Morgana, but they are all returned as 'Merlin' to obfuscate.
  const visibleMerlinLikes = gameState.players.filter((p: AvalonPlayer) => p.role === 'Merlin' && p.userId !== me.userId); 

  const getRoleDetails = (role: string | null | undefined) => {
    switch(role) {
      case 'Merlin': return { desc: 'Phù thủy thông thái thấu hiểu vạn vật—nhưng phải giấu mình.' };
      case 'Percival': return { desc: 'Kỵ sĩ trung thành tìm kiếm người dẫn đường đích thực.' };
      case 'Morgana': return { desc: 'Phù thủy bóng tối. Đóng giả Merlin để lừa gạt Percival.' };
      case 'Assassin': return { desc: 'Lưỡi kiếm trong đêm. Truy sát Merlin nếu nhiệm vụ thất bại.' };
      case 'Mordred': return { desc: 'Kẻ tha hóa vĩ đại. Tàng hình trước con mắt của Merlin.' };
      case 'Oberon': return { desc: 'Kẻ ngoài rìa hỗn mang. Vô diện trước đồng minh.' };
      case 'Minion_Evil': return { desc: 'Tay sai trung thành của chúa tể Mordred.' };
      case 'Minion_Good': return { desc: 'Kỵ sĩ trung kiên của Bàn Tròn.' };
      default: return { desc: 'Một linh hồn chưa rõ nguồn gốc.' };
    }
  };

  const roleDetails = getRoleDetails(me.role);
  const roleImageSrc = getRoleImageSrcForViewer(me, me);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      >
        <div className="w-full max-w-lg relative flex flex-col items-center z-10">
          
          <button 
             onClick={onClose}
             className="absolute -top-12 right-0 p-2 text-(--on-surface-variant) hover:text-white bg-white/5 rounded-full backdrop-blur-md transition-colors border border-white/10 shadow-lg z-50 cursor-pointer"
          >
             <X className="w-6 h-6" />
          </button>

          {/* Faction Ambient Spotlight (Background) */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[100px] -z-10 pointer-events-none transition-colors duration-1000"
            style={{ backgroundColor: `var(--color-${colorTheme}-avalon, var(--${colorTheme}))`, opacity: 0.15 }}
          ></div>

          {/* Interactive Reveal Area */}
          <div 
            className="relative group w-full select-none touch-none"
            onPointerUp={() => setIsRevealing(false)} 
            onPointerLeave={() => setIsRevealing(false)}
            onPointerCancel={() => setIsRevealing(false)}
            onContextMenu={(e) => e.preventDefault()}
          >

            {/* The Card Layer */}
            <div 
              className={`bg-(--surface-container-low) backdrop-blur-xl rounded-xl p-6 lg:p-8 border flex flex-col items-center text-center transition-all duration-300 w-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] ${isRevealing ? '' : 'blur-md opacity-40 scale-95'}`}
              style={{ borderColor: `color-mix(in srgb, var(--color-${colorTheme}-avalon, var(--${colorTheme})) 20%, transparent)` }}
            >
              {me.role && (
                <div className="space-y-6 w-full flex flex-col items-center">
                  {/* Role Avatar/Image */}
                  <div className="relative mt-2">
                    <div 
                      className="w-32 h-32 lg:w-40 lg:h-40 rounded-2xl border-2 flex items-center justify-center relative overflow-hidden shadow-2xl"
                      style={{ 
                        borderColor: `color-mix(in srgb, var(--color-${colorTheme}-avalon, var(--${colorTheme})) 40%, transparent)`,
                        background: `linear-gradient(to bottom, color-mix(in srgb, var(--color-${colorTheme}-avalon, var(--${colorTheme})) 20%, transparent), var(--surface-container-high))`
                      }}
                    >
                      <Image
                        src={roleImageSrc}
                        alt={`Role ${me.role ?? 'Unknown'}`}
                        fill
                        sizes="160px"
                        className="object-cover"
                        priority
                        unoptimized
                      />
                      {/* Subtle vignette instead of heavy fade */}
                      <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.6)] pointer-events-none rounded-2xl"></div>
                    </div>
                    <div 
                      className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 text-[9px] lg:text-[10px] font-bold tracking-widest uppercase rounded-full shadow-lg whitespace-nowrap border border-white/10 z-10"
                      style={{ backgroundColor: `var(--color-${colorTheme}-avalon, var(--${colorTheme}))`, color: isEvil ? '#fff' : '#061423' }}
                    >
                      {factionName}
                    </div>
                  </div>

                  {/* Title & Desc */}
                  <div className="space-y-1">
                    <h3 
                      className="text-xl font-headline tracking-widest uppercase"
                      style={{ color: `var(--color-${colorTheme}-avalon, var(--${colorTheme}))` }}
                    >
                      {me.role.replace('_', ' ')}
                    </h3>
                    <p className="text-(--on-surface-variant) text-xs font-medium px-4">
                      {roleDetails.desc}
                    </p>
                  </div>

                  <div className="w-full h-px bg-linear-to-r from-transparent via-(--outline-variant)/30 to-transparent my-2"></div>

                  {/* Information Section */}
                  <div className="w-full text-left space-y-4 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                    
                    {/* Merlin's Vision */}
                    {me.role === 'Merlin' && (
                      <>
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-(--tertiary)" />
                          <h4 className="text-[10px] font-headline font-bold text-(--tertiary) uppercase tracking-widest">Kẻ Thù Lộ Diện</h4>
                        </div>
                        {visibleEvil.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            {visibleEvil.map(p => (
                              <div key={p.userId} className="bg-(--surface-container-high) rounded-lg p-2 border-l-2 border-(--tertiary)/50 shadow-sm flex items-center gap-2">
                                <div className="relative h-7 w-7 overflow-hidden rounded-md border border-(--outline-variant)/35 shrink-0">
                                  <Image
                                    src={getRoleImageSrcForViewer(p, me)}
                                    alt={`Avatar ${p.name}`}
                                    fill
                                    sizes="28px"
                                    className="object-cover"
                                    unoptimized
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[10px] text-(--on-surface) font-bold truncate">{p.name}</p>
                                  <p className="text-[8px] text-(--on-surface-variant) uppercase tracking-tighter">{getVisibleRoleLabelForViewer(p, me)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-(--on-surface-variant) italic">Không phát hiện bóng tối... hoặc bạn đang đơn độc.</p>
                        )}
                      </>
                    )}

                    {/* Evil Team's Vision */}
                    {isEvil && me.role !== 'Oberon' && (
                      <>
                        <div className="flex items-center gap-2">
                          <Swords className="w-4 h-4 text-(--tertiary)" />
                          <h4 className="text-[10px] font-headline font-bold text-(--tertiary) uppercase tracking-widest">Đồng Bọn Hắc Ám</h4>
                        </div>
                        {visibleEvil.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            {visibleEvil.map(p => (
                              <div key={p.userId} className="bg-(--surface-container-high) rounded-lg p-2 border-l-2 border-(--tertiary)/50 shadow-sm flex items-center gap-2">
                                <div className="relative h-7 w-7 overflow-hidden rounded-md border border-(--outline-variant)/35 shrink-0">
                                  <Image
                                    src={getRoleImageSrcForViewer(p, me)}
                                    alt={`Avatar ${p.name}`}
                                    fill
                                    sizes="28px"
                                    className="object-cover"
                                    unoptimized
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[10px] text-(--on-surface) font-bold truncate">{p.name}</p>
                                  <p className="text-[8px] text-(--on-surface-variant) uppercase tracking-tighter truncate">{getVisibleRoleLabelForViewer(p, me)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-(--on-surface-variant) italic">Bạn hoàn toàn đơn độc. Không có đồng minh nào.</p>
                        )}
                      </>
                    )}

                    {/* Percival's Vision */}
                    {me.role === 'Percival' && (
                      <>
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-(--primary)" />
                          <h4 className="text-[10px] font-headline font-bold text-(--primary) uppercase tracking-widest">Mục Tiêu Thám Thính</h4>
                        </div>
                        <p className="text-[9px] text-(--on-surface-variant) mb-1">Một trong số họ là Merlin, kẻ còn lại là Morgana.</p>
                        {visibleMerlinLikes.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            {visibleMerlinLikes.map(p => (
                              <div key={p.userId} className="bg-(--surface-container-high) rounded-lg p-2 border-l-2 border-(--primary)/50 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="relative h-7 w-7 overflow-hidden rounded-md border border-(--outline-variant)/35 shrink-0">
                                    <Image
                                      src={getRoleImageSrcForViewer(p, me)}
                                      alt={`Avatar ${p.name}`}
                                      fill
                                      sizes="28px"
                                      className="object-cover"
                                      unoptimized
                                    />
                                  </div>
                                  <div className="min-w-0">
                                  <p className="text-[10px] text-(--on-surface) font-bold truncate">{p.name}</p>
                                  <p className="text-[8px] text-(--on-surface-variant) uppercase tracking-tighter">{getVisibleRoleLabelForViewer(p, me)}</p>
                                  </div>
                                </div>
                                <AlertTriangle className="w-3 h-3 text-(--primary)/50 shrink-0" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-(--on-surface-variant) italic">Không có bóng dáng Merlin hay Morgana.</p>
                        )}
                      </>
                    )}

                    {/* No Vision Roles */}
                    {(me.role === 'Minion_Good' || me.role === 'Minion_Evil' || me.role === 'Oberon') && (
                      <div className="bg-(--surface-container-high) rounded-lg p-3 border border-(--outline-variant)/30 text-center mt-2">
                        <p className="text-[10px] leading-relaxed text-(--on-surface-variant) italic">
                          "Trong mắt của bạn chỉ có màn đêm. Hãy lắng nghe, hãy quan sát hội đồng để tìm ra sự thật."
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>

            {/* The Overlaid "Hold to Reveal" Mask */}
            {!isRevealing && (
              <div 
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl rounded-xl z-20 flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none touch-none border border-(--outline-variant)/50 shadow-2xl"
                onPointerDown={() => setIsRevealing(true)}
              >
                <div className="w-16 h-16 rounded-full border-2 border-(--outline-variant)/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                   <Fingerprint className="w-8 h-8 text-(--primary) animate-pulse" />
                </div>
                
                <h3 className="text-lg font-headline mb-3 uppercase tracking-wider text-(--on-surface)">Nhắc Nhở Danh Tính</h3>
                
                <div className="bg-primary-avalon text-surface-dim-avalon px-6 py-3 rounded-xl font-headline font-bold text-xs tracking-widest uppercase shadow-[0_4px_20px_rgba(186,200,220,0.2)]">
                  Chạm & Giữ Để Xem
                </div>
                <p className="mt-6 text-[8px] text-(--on-surface-variant) uppercase tracking-widest opacity-50">
                  Tuyệt Mật • Chỉ Dành Cho Mắt Bạn
                </p>
              </div>
            )}
          </div>
          
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
