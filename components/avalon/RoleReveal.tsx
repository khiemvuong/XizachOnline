"use client";

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AvalonPlayer, AvalonRoom } from '@/server/game/AvalonTypes';
import { Fingerprint, CheckCircle2, Eye, AlertTriangle, Swords } from 'lucide-react';
import { getRoleImageSrcForViewer, getVisibleRoleLabelForViewer } from './roleImage';

export default function RoleReveal({ gameState, me, onReady, roomId }: { gameState: AvalonRoom, me: AvalonPlayer, onReady: () => void, roomId: string }) {
  const [isRevealing, setIsRevealing] = useState(false);
  const [leftScale, setLeftScale] = useState(1);
  const [autoFitLeft, setAutoFitLeft] = useState(false);
  const [rightScale, setRightScale] = useState(1);
  const [autoFitRight, setAutoFitRight] = useState(false);
  const leftViewportRef = useRef<HTMLElement | null>(null);
  const leftContentRef = useRef<HTMLDivElement | null>(null);
  const rightViewportRef = useRef<HTMLElement | null>(null);
  const rightContentRef = useRef<HTMLDivElement | null>(null);
  const isEvil = me.team === 'Evil';
  const colorTheme = isEvil ? 'tertiary' : 'primary';
  const factionName = isEvil ? 'Thế Lực Hắc Ám' : 'Hiệp Sĩ Bàn Tròn';
  
  // Find visible players based on obfuscation rules from the engine
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
  const maskedRoleLabel = 'Danh tính đang được phong ấn';
  const maskedRoleDesc = 'Giữ ở khung bên phải để tạm mở danh tính của bạn.';

  useEffect(() => {
    const compact = () => window.matchMedia('(pointer: coarse) and (orientation: landscape) and (max-width: 1100px)').matches;

    const updateLeftScale = () => {
      if (!leftViewportRef.current || !leftContentRef.current) return;
      const isCompact = compact();
      setAutoFitLeft(isCompact);
      if (!isCompact) { setLeftScale(1); return; }
      
      const el = leftContentRef.current;
      const prevTransform = el.style.transform;
      const prevWidth = el.style.width;
      el.style.transform = '';
      el.style.width = '100%';

      const vh = leftViewportRef.current.clientHeight;
      const nh = el.scrollHeight;

      if (vh <= 0 || nh <= 0) { setLeftScale(1); return; }
      setLeftScale(Math.max(0.62, Math.min(1, vh / nh)));

      el.style.transform = prevTransform;
      el.style.width = prevWidth;
    };

    const updateRightScale = () => {
      if (!rightViewportRef.current || !rightContentRef.current) return;
      const isCompact = compact();
      setAutoFitRight(isCompact);
      if (!isCompact) { setRightScale(1); return; }

      const el = rightContentRef.current;
      const prevTransform = el.style.transform;
      const prevWidth = el.style.width;
      el.style.transform = '';
      el.style.width = '100%';

      const vh = rightViewportRef.current.clientHeight;
      const nh = el.scrollHeight;

      if (vh <= 0 || nh <= 0) { setRightScale(1); return; }
      setRightScale(Math.max(0.55, Math.min(1, vh / nh)));

      el.style.transform = prevTransform;
      el.style.width = prevWidth;
    };

    const update = () => { updateLeftScale(); updateRightScale(); };
    update();

    const obs = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    if (obs) {
      [leftViewportRef, rightViewportRef].forEach(r => {
        if (r.current) obs.observe(r.current);
      });
    }
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      obs?.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, [gameState, me.role, me.isReady, isRevealing]);

  const leftScaleStyle = autoFitLeft && leftScale < 0.999
    ? { transform: `scale(${leftScale})`, transformOrigin: 'top left', width: `${100 / leftScale}%` }
    : undefined;

  const rightScaleStyle = autoFitRight && rightScale < 0.999
    ? { transform: `scale(${rightScale})`, transformOrigin: 'top left', width: `${100 / rightScale}%` }
    : undefined;

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto relative px-2 sm:px-4 py-3 z-0 h-full min-h-0 overflow-hidden">
      
      {/* Faction Ambient Spotlight (Background) */}
      <div 
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 rounded-full blur-[120px] -z-10 pointer-events-none transition-all duration-1000"
        style={{ backgroundColor: `var(--color-${colorTheme}-avalon, var(--${colorTheme}))`, opacity: isRevealing ? 0.1 : 0 }}
      ></div>

      <div className="avalon-role-reveal-grid grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-10 h-full items-stretch">
        <section
          ref={leftViewportRef}
          className={`avalon-role-reveal-left min-h-0 lg:pr-4 pr-1 ${autoFitLeft ? 'overflow-hidden' : 'overflow-y-auto custom-avalon-scrollbar'}`}
        >
          <div
            ref={leftContentRef}
            className="avalon-role-reveal-left-content space-y-4 lg:space-y-6"
            style={leftScaleStyle}
          >
          <div className="avalon-role-reveal-intro text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className={`${isRevealing ? `text-(--${colorTheme})` : 'text-(--on-surface-variant)/60'} font-headline tracking-[0.3em] text-[10px] uppercase block transition-colors duration-500`}>
                Màn Đêm Buông Xuống
              </span>
              <span className="text-[10px] font-headline text-(--secondary)/50 tracking-wider">#{roomId.substring(0,6)}</span>
            </div>
            <h2 className={`avalon-role-reveal-title text-3xl lg:text-5xl font-headline font-bold text-(--on-surface) tracking-tight transition-all duration-500 ${isRevealing ? (isEvil ? 'avalon-title-glow-tertiary text-(--tertiary)' : 'avalon-title-glow-primary') : 'avalon-title-glow-neutral'}`}>Danh Tính Bí Mật</h2>
            <p className="text-(--on-surface-variant) font-body text-xs lg:text-sm italic opacity-85">
              &quot;Giữ lấy sự thật trong bóng tối của Camelot.&quot;
            </p>
          </div>

          <div className="avalon-role-reveal-summary rounded-xl border border-(--outline-variant)/40 bg-(--surface-container-low)/70 p-4 lg:p-5 backdrop-blur-md">
            <p className="text-[11px] uppercase tracking-[0.2em] text-(--on-surface-variant)">Vai trò của bạn</p>
            <p className={`mt-1 text-xl lg:text-2xl font-headline uppercase tracking-widest transition-colors duration-500 ${isRevealing ? `text-(--${colorTheme})` : 'text-(--on-surface-variant)/60'}`}>
              {isRevealing ? (me.role?.replace('_', ' ') ?? 'Unknown') : maskedRoleLabel}
            </p>
            <p className="mt-2 text-sm text-(--on-surface-variant)">
              {isRevealing ? roleDetails.desc : maskedRoleDesc}
            </p>
          </div>

          <div className="avalon-role-reveal-ready w-full">
            {me.isReady ? (
              <div className="w-full bg-transparent border border-(--outline-variant) text-(--secondary) py-4 rounded-xl font-bold font-headline text-xs tracking-widest uppercase text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-(--primary)" />
                Chờ các kỵ sĩ khác...
              </div>
            ) : (
              <button 
                className="w-full bg-primary-avalon text-surface-dim-avalon py-4 rounded-xl font-headline font-bold text-sm tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_20px_rgba(186,200,220,0.3)] disabled:opacity-50"
                onClick={onReady}
                disabled={isRevealing}
              >
                {isRevealing ? 'Buông Tay Bổn Tọa...' : 'Nắm Rõ Bí Mật'}
              </button>
            )}
          </div>
          </div>
        </section>

        {/* Interactive Reveal Area */}
        <section
          ref={rightViewportRef}
          className="relative group w-full select-none touch-none min-h-0 overflow-hidden"
          onPointerUp={() => setIsRevealing(false)} 
          onPointerLeave={() => setIsRevealing(false)}
          onPointerCancel={() => setIsRevealing(false)}
          onContextMenu={(e) => e.preventDefault()}
        >

        {/* The Card Layer */}
        <div 
          ref={rightContentRef}
          className={`bg-(--surface-container-low) backdrop-blur-xl rounded-xl p-6 lg:p-8 border flex flex-col items-center text-center transition-all duration-300 w-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] ${isRevealing ? '' : 'blur-md opacity-40 scale-95'}`}
          style={{ 
            borderColor: `color-mix(in srgb, var(--color-${colorTheme}-avalon, var(--${colorTheme})) 20%, transparent)`,
            ...rightScaleStyle
          }}
        >
          {/* Fallback when role is not assigned */}
          {!me.role && (
            <div className="flex flex-col items-center gap-5 py-6 w-full">
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl border-2 border-slate-700/60 overflow-hidden bg-slate-900/80 shadow-2xl flex items-center justify-center">
                <span className="text-5xl select-none">?</span>
                <div className="absolute inset-0 shadow-[inset_0_0_24px_rgba(0,0,0,0.7)] pointer-events-none rounded-2xl" />
              </div>
              <div className="space-y-1 text-center px-4">
                <h3 className="text-lg font-headline uppercase tracking-widest text-slate-400">Danh Tính Bí Ẩn</h3>
                <p className="text-xs text-slate-500 italic leading-relaxed">
                  Bạn chưa được giao vai trò trong ván này.
                </p>
              </div>
            </div>
          )}

          {me.role && (
            <div className="space-y-6 w-full flex flex-col items-center">
              {/* Role Avatar/Image */}
              <div className="relative mt-2">
                <div 
                  className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-2xl border-2 flex items-center justify-center relative overflow-hidden shadow-2xl"
                  style={{ 
                    borderColor: `color-mix(in srgb, var(--color-${colorTheme}-avalon, var(--${colorTheme})) 40%, transparent)`,
                    background: `linear-gradient(to bottom, color-mix(in srgb, var(--color-${colorTheme}-avalon, var(--${colorTheme})) 20%, transparent), var(--surface-container-high))`
                  }}
                >
                  <Image
                    src={roleImageSrc}
                    alt={`Role ${me.role ?? 'Unknown'}`}
                    fill
                    sizes="192px"
                    className="object-cover pointer-events-none select-none"
                    draggable={false}
                    onDragStart={(event) => event.preventDefault()}
                    style={{ WebkitTouchCallout: 'none', userSelect: 'none' }}
                    priority
                  />
                  {/* Subtle vignette instead of heavy fade */}
                  <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.6)] pointer-events-none rounded-2xl"></div>
                </div>
                <div 
                  className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-5 py-1.5 text-[10px] lg:text-[11px] font-bold tracking-widest uppercase rounded-full shadow-lg whitespace-nowrap border border-white/10 z-10"
                  style={{ backgroundColor: `var(--color-${colorTheme}-avalon, var(--${colorTheme}))`, color: isEvil ? '#fff' : '#061423' }}
                >
                  {factionName}
                </div>
              </div>

              {/* Title & Desc */}
              <div className="space-y-1">
                <h3 
                  className="text-2xl font-headline tracking-widest uppercase"
                  style={{ color: `var(--color-${colorTheme}-avalon, var(--${colorTheme}))` }}
                >
                  {me.role.replace('_', ' ')}
                </h3>
                <p className="text-(--on-surface-variant) text-xs font-medium px-4">
                  {roleDetails.desc}
                </p>
              </div>

              <div className="w-full h-px bg-linear-to-r from-transparent via-(--outline-variant)/30 to-transparent my-4"></div>

              {/* Information Section */}
              <div className="w-full text-left space-y-4">
                
                {/* Merlin's Vision */}
                {me.role === 'Merlin' && (
                  <>
                    <div className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-(--tertiary)" />
                      <h4 className="text-xs font-headline font-bold text-(--tertiary) uppercase tracking-widest">Kẻ Thù Lộ Diện</h4>
                    </div>
                    {visibleEvil.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {visibleEvil.map(p => (
                          <div key={p.userId} className="bg-(--surface-container-high) rounded-lg p-3 border-l-2 border-(--tertiary)/50 shadow-sm flex items-center gap-2">
                            <div className="relative h-9 w-9 overflow-hidden rounded-md border border-(--outline-variant)/35">
                              <Image
                                src={getRoleImageSrcForViewer(p, me)}
                                alt={`Avatar ${p.name}`}
                                fill
                                sizes="36px"
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-(--on-surface) font-bold truncate">{p.name}</p>
                              <p className="text-[10px] text-(--on-surface-variant) uppercase tracking-tighter">{getVisibleRoleLabelForViewer(p, me)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-(--on-surface-variant) italic">Không phát hiện bóng tối... hoặc bạn đang đơn độc.</p>
                    )}
                  </>
                )}

                {/* Evil Team's Vision */}
                {isEvil && me.role !== 'Oberon' && (
                  <>
                    <div className="flex items-center gap-2">
                      <Swords className="w-5 h-5 text-(--tertiary)" />
                      <h4 className="text-xs font-headline font-bold text-(--tertiary) uppercase tracking-widest">Đồng Bọn Hắc Ám</h4>
                    </div>
                    {visibleEvil.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {visibleEvil.map(p => (
                          <div key={p.userId} className="bg-(--surface-container-high) rounded-lg p-3 border-l-2 border-(--tertiary)/50 shadow-sm flex items-center gap-2">
                            <div className="relative h-9 w-9 overflow-hidden rounded-md border border-(--outline-variant)/35">
                              <Image
                                src={getRoleImageSrcForViewer(p, me)}
                                alt={`Avatar ${p.name}`}
                                fill
                                sizes="36px"
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-(--on-surface) font-bold truncate">{p.name}</p>
                              <p className="text-[10px] text-(--on-surface-variant) uppercase tracking-tighter truncate">{getVisibleRoleLabelForViewer(p, me)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-(--on-surface-variant) italic">Bạn hoàn toàn đơn độc. Không có đồng minh nào.</p>
                    )}
                  </>
                )}

                {/* Percival's Vision */}
                {me.role === 'Percival' && (
                  <>
                    <div className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-(--primary)" />
                      <h4 className="text-xs font-headline font-bold text-(--primary) uppercase tracking-widest">Mục Tiêu Thám Thính</h4>
                    </div>
                    <p className="text-[10px] text-(--on-surface-variant) mb-2">Một trong số họ là Merlin, kẻ còn lại là Morgana.</p>
                    {visibleMerlinLikes.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {visibleMerlinLikes.map(p => (
                          <div key={p.userId} className="bg-(--surface-container-high) rounded-lg p-3 border-l-2 border-(--primary)/50 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="relative h-9 w-9 overflow-hidden rounded-md border border-(--outline-variant)/35">
                                <Image
                                  src={getRoleImageSrcForViewer(p, me)}
                                  alt={`Avatar ${p.name}`}
                                  fill
                                  sizes="36px"
                                  className="object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                              <p className="text-xs text-(--on-surface) font-bold truncate">{p.name}</p>
                              <p className="text-[10px] text-(--on-surface-variant) uppercase tracking-tighter">{getVisibleRoleLabelForViewer(p, me)}</p>
                              </div>
                            </div>
                            <AlertTriangle className="w-4 h-4 text-(--primary)/50" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-(--on-surface-variant) italic">Không có bóng dáng Merlin hay Morgana.</p>
                    )}
                  </>
                )}

                {/* No Vision Roles */}
                {(me.role === 'Minion_Good' || me.role === 'Minion_Evil' || me.role === 'Oberon') && (
                  <div className="bg-(--surface-container-high) rounded-lg p-4 border border-(--outline-variant)/30 text-center mt-4">
                    <p className="text-xs leading-relaxed text-(--on-surface-variant) italic">
                      &quot;Trong đôi mắt của bạn chỉ có màn đêm. Hãy lắng nghe, hãy quan sát hội đồng để tìm ra sự thật.&quot;
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

          {/* Mask Overlay */}
        {!isRevealing && (
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl rounded-xl z-20 flex flex-col items-center justify-center p-5 sm:p-8 text-center cursor-pointer select-none touch-none border border-(--outline-variant)/50 shadow-2xl"
            onPointerDown={() => setIsRevealing(true)}
          >
              <div className="w-25 h-25 rounded-full border-2 border-(--outline-variant)/30 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(0,0,0,0.5)] pointer-events-none select-none">
                <Fingerprint className="w-20 h-20 pointer-events-none select-none" />
            </div>
              <h3 className="text-xl font-headline mb-4 uppercase tracking-wider text-(--on-surface) select-none pointer-events-none">Giữ Để Xác Minh Danh Tính</h3>
              <p className="mt-8 text-[10px] text-(--on-surface-variant) uppercase tracking-widest opacity-50 select-none pointer-events-none">
              Tuyệt Mật • Chỉ Dành Cho Mắt Bạn
            </p>
          </div>
        )}
        </section>
      </div>
    </div>
  );
}