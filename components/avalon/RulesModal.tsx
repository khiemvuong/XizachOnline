import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Shield, VenetianMask, Swords, Info, ScrollText, 
  Users, Gavel, Target, Eye, Flame, CloudFog, Wand2, Crosshair 
} from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RulesModal({ isOpen, onClose }: RulesModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="avalon-rules-modal-shell fixed inset-0 z-120 flex items-center justify-center p-2 sm:p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="avalon-rules-modal-frame avalon-glass relative w-full max-w-4xl max-h-[88dvh] overflow-hidden rounded-2xl border border-(--primary)/30 shadow-[0_10px_50px_rgba(0,0,0,0.8)] flex flex-col bg-[#0b1320]"
          >
            {/* Header */}
            <div className="avalon-rules-modal-header relative p-4 md:p-6 border-b border-(--outline-variant)/50 shrink-0 overflow-hidden">
               <div className="absolute inset-0 bg-linear-to-r from-(--primary)/10 to-transparent pointer-events-none"></div>
               <button 
                 onClick={onClose}
                 className="absolute top-3 right-3 md:top-6 md:right-6 text-(--primary)/60 hover:text-(--primary) hover:bg-(--primary)/10 p-2 rounded-full transition-colors z-10"
               >
                 <X className="w-5 h-5" />
               </button>
               <h2 className="avalon-rules-modal-title text-xl md:text-2xl font-serif text-(--primary) tracking-widest uppercase flex items-center gap-2 md:gap-3 pr-10">
                 <ScrollText className="w-6 h-6" />
                 Lệnh Bài Luật Lệ
               </h2>
               <p className="avalon-rules-modal-subtitle text-[10px] md:text-xs text-(--on-surface-variant) uppercase tracking-[0.2em] mt-1.5 md:mt-2 font-headline">
                 Nắm rõ luật lệ để sinh tồn tại Vương Quốc Avalon
               </p>
            </div>

            {/* Scrollable Content */}
            <div className="avalon-rules-modal-content p-4 md:p-8 overflow-y-auto custom-avalon-scrollbar space-y-8 md:space-y-10 flex-1">
              
              {/* Giới thiệu */}
              <section className="avalon-rules-section space-y-3 md:space-y-4">
                <div className="avalon-rules-intro p-4 md:p-5 rounded-xl border border-(--primary)/30 bg-(--primary)/5 backdrop-blur-md">
                   <p className="text-xs md:text-sm font-sans text-gray-300 leading-relaxed">
                     Ác quỷ đang tràn lan trong vương quốc. Vua Arthur vĩ đại tựa như một lời hứa về sự thịnh vượng, nhưng lẩn giấu trong số những chiến binh dũng cảm là tay sai máu lạnh của Mordred. 
                     <br/><br/>
                     Dù ít ỏi, <strong>Phe Ác</strong> có thể nhận ra nhau và ẩn mình với tất cả, ngoại trừ vị pháp sư già <strong>Merlin</strong>.
                   </p>
                </div>
              </section>

              {/* Giải Thích Nhân Vật */}
              <section className="avalon-rules-section space-y-5 md:space-y-6">
                <h3 className="avalon-rules-heading font-headline text-(--secondary) tracking-widest uppercase text-base md:text-xl flex items-center gap-2 border-b border-(--outline-variant)/30 pb-2">
                  <Shield className="w-6 h-6" /> Ý Nghĩa Các Phe
                </h3>

                {/* Phe Thiện */}
                <div className="space-y-3">
                  <h4 className="font-bold text-(--primary) uppercase tracking-wider flex items-center gap-2 text-xs md:text-sm">
                     Phe Thiện (Trung thành với Arthur)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <RoleDetailCard 
                      icon={Wand2} title="Merlin" 
                      desc="Biết thân phận của tất cả thành viên phe Ác (trừ Mordred). Phải ẩn mình để tránh bị Ám sát cuối game."
                    />
                    <RoleDetailCard 
                      icon={Eye} title="Percival" 
                      desc="Nhìn thấy 2 người: một là Merlin, một là Morgana giả mạo. Phải tinh ý nhận ra ai là Merlin thật."
                    />
                  </div>
                </div>

                {/* Phe Ác */}
                <div className="space-y-3 mt-6">
                  <h4 className="font-bold text-(--tertiary) uppercase tracking-wider flex items-center gap-2 text-xs md:text-sm">
                     Phe Ác (Tay sai của Mordred)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <RoleDetailCard 
                      icon={Crosshair} title="Assassin (Sát thủ)" 
                      desc="Nếu Phe Thiện thắng 3 vòng, Assassin sẽ tung đòn chí mạng chỉ ra ai là Merlin. Trúng thì Phe Ác đổi bại thành thắng!"
                      isEvil
                    />
                    <RoleDetailCard 
                      icon={Flame} title="Morgana" 
                      desc="Đóng giả làm Merlin trong mắt Percival để thao túng niềm tin."
                      isEvil
                    />
                    <RoleDetailCard 
                      icon={VenetianMask} title="Mordred" 
                      desc="Kẻ đầu sỏ. Tàng hình hoàn toàn trước pháp nhãn của Merlin."
                      isEvil
                    />
                    <RoleDetailCard 
                      icon={CloudFog} title="Oberon" 
                      desc="Cô độc: Không biết đồng bọn phe Ác là ai, và phe Ác cũng không biết Oberon."
                      isEvil
                    />
                  </div>
                </div>
              </section>

              {/* Cách Chơi */}
              <section className="avalon-rules-section space-y-5 md:space-y-6">
                <h3 className="avalon-rules-heading font-headline text-(--secondary) tracking-widest uppercase text-base md:text-xl flex items-center gap-2 border-b border-(--outline-variant)/30 pb-2">
                  <Swords className="w-6 h-6" /> Trình Tự Ván Đấu
                </h3>

                <div className="avalon-rules-steps space-y-4 md:space-y-6 relative before:absolute before:inset-y-0 before:left-4.25 before:w-0.5 before:bg-(--outline-variant)/30">
                  <StepItem 
                    num="1" title="Lập Đội (Đội Trưởng Đề Xuất)" icon={Users}
                    desc="Mỗi hiệp có 1 Đội Trưởng. Người này sẽ chọn ra đủ số lượng thành viên yêu cầu để đi Nhiệm vụ. Đội trưởng có thể tự chọn bản thân mình vào đội."
                  />
                  <StepItem 
                    num="2" title="Tiến Hành Biểu Quyết" icon={Gavel}
                    desc="Mọi người trong phòng (dù có được chọn đi nhiệm vụ hay không) đều bình bầu ẤN DANH: Tán Thành (Approve) hoặc Phản Đối (Reject). Nếu đa số Tán thành, đội được chốt đi làm nhiệm vụ. Nếu bị Phản đối (hoặc Hòa), vai trò Đội Trưởng chuyển sang người tiếp theo. LUẬT CỨNG: Nếu 5 lần đề xuất đội liên tiếp bị Phản đối, PHE ÁC THẮNG NGAY LẬP TỨC."
                  />
                  <StepItem 
                    num="3" title="Thực Hiện Nhiệm Vụ" icon={Target}
                    desc="Những Kỵ sĩ trong đội đã được chốt sẽ thả phiếu vào nhiệm vụ. Phe Thiện bắt buộc phải thả THÀNH CÔNG. Phe Ác có quyền thả THẤT BẠI hoặc THÀNH CÔNG để trà trộn. Chỉ cần có 1 phiếu THẤT BẠI đưa ra, nhiệm vụ coi như thất bại cho phe Thiện."
                  />
                  <StepItem 
                    num="4" title="Ám Sát Merlin (Phút Chót)" icon={Crosshair}
                    desc="Nếu Phe Thiện thắng trọn vẹn 3 nhiệm vụ, Phe Ác được hội ý lật ngược thế cờ. Assassin sẽ chĩa gươm vào 1 người tình nghi nhất. Nếu đó đúng là Merlin, Phe Ác chiến thắng cuối cùng!"
                  />
                </div>
              </section>


              {/* Section: Role Distribution */}
              <section className="avalon-rules-section space-y-3 md:space-y-4">
                <h3 className="avalon-rules-heading font-headline text-(--secondary) tracking-widest uppercase text-base md:text-xl flex items-center gap-2 border-b border-(--outline-variant)/30 pb-2">
                  <VenetianMask className="w-5 h-5" />
                  Bảng Phân Bổ Lực Lượng
                </h3>
                <div className="avalon-rules-table rounded-xl border border-(--outline-variant)/30 overflow-hidden bg-[#0f172a]/40 backdrop-blur-md">
                  <table className="w-full text-center border-collapse">
                    <thead>
                      <tr className="border-b border-(--outline-variant)/30 text-(--on-surface-variant) font-headline uppercase text-[10px] sm:text-xs tracking-widest bg-black/20">
                        <th className="py-3 px-4 font-bold">Số Hiệp Sĩ</th>
                        <th className="py-3 px-4 font-bold text-(--primary)">Phe Thiện (Good)</th>
                        <th className="py-3 px-4 font-bold text-(--tertiary)">Phe Ác (Evil)</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-sans tracking-wide divide-y divide-(--outline-variant)/20">
                      {[ 
                        { count: 5, good: 3, evil: 2 },
                        { count: 6, good: 4, evil: 2 },
                        { count: 7, good: 4, evil: 3 },
                        { count: 8, good: 5, evil: 3 },
                        { count: 9, good: 6, evil: 3 },
                        { count: 10, good: 6, evil: 4 },
                      ].map((row, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 font-bold text-(--on-surface)">{row.count}</td>
                          <td className="py-3 px-4 text-(--primary) drop-shadow-md">{row.good}</td>
                          <td className="py-3 px-4 text-(--tertiary) drop-shadow-md">{row.evil}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Section: Quest Participants */}
              <section className="avalon-rules-section space-y-3 md:space-y-4">
                <h3 className="avalon-rules-heading font-headline text-(--secondary) tracking-widest uppercase text-base md:text-xl flex items-center gap-2 border-b border-(--outline-variant)/30 pb-2">
                  <Target className="w-5 h-5" />
                  Bảng Yêu Cầu Nhiệm Vụ
                </h3>
                <div className="avalon-rules-table rounded-xl border border-(--outline-variant)/30 overflow-hidden bg-[#0f172a]/40 backdrop-blur-md">
                  <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse">
                      <thead>
                        <tr className="border-b border-(--outline-variant)/30 text-(--on-surface-variant) font-headline uppercase text-[10px] sm:text-xs tracking-widest bg-black/20">
                          <th className="py-3 px-2 font-bold whitespace-nowrap min-w-20">Hiệp Sĩ</th>
                          <th className="py-3 px-2 font-bold">Q1</th>
                          <th className="py-3 px-2 font-bold">Q2</th>
                          <th className="py-3 px-2 font-bold">Q3</th>
                          <th className="py-3 px-2 font-bold text-amber-500/80">Q4 (Phase Đêm)</th>
                          <th className="py-3 px-2 font-bold">Q5</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm font-sans tracking-wide divide-y divide-(--outline-variant)/20">
                        {[
                          { count: 5, q: [2, 3, 2, 3, 3] },
                          { count: 6, q: [2, 3, 4, 3, 4] },
                          { count: 7, q: [2, 3, 3, "4*", 4] },
                          { count: 8, q: [3, 4, 4, "5*", 5] },
                          { count: 9, q: [3, 4, 4, "5*", 5] },
                          { count: 10, q: [3, 4, 4, "5*", 5] },
                        ].map((row, idx) => (
                          <tr key={idx} className="hover:bg-white/5 transition-colors">
                            <td className="py-3 px-2 font-bold text-(--on-surface)">{row.count}</td>
                            {row.q.map((val, i) => (
                              <td key={i} className={`py-3 px-2 ${i === 3 && typeof val === 'string' ? 'text-amber-400 font-bold' : 'text-(--primary)/90'}`}>
                                {val}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3 text-amber-200/80 items-start">
                   <Info className="w-5 h-5 shrink-0 mt-0.5" />
                   <div className="text-sm leading-relaxed font-sans">
                     <strong>(*) Lưu ý:</strong> Tại vòng 4 khi bàn có từ 7 người chơi trở lên, yêu cầu phải có <strong>2 phiếu THẤT BẠI (Fail)</strong> thì nhiệm vụ mới bị phá. Nếu chỉ có 1 phiếu Fail, nhiệm vụ đó vẫn được tính là THÀNH CÔNG cho phe Thiện.
                   </div>
                </div>
              </section>
            </div>
            
            {/* Footer */}
            <div className="avalon-rules-modal-footer p-4 md:p-6 border-t border-(--outline-variant)/30 shrink-0 bg-black/20 text-center">
              <button 
                onClick={onClose}
                className="avalon-rules-close-btn px-8 py-3 bg-primary-avalon text-surface-dim-avalon font-bold font-headline uppercase tracking-widest rounded-xl hover:brightness-110 transition-colors shadow-[0_0_15px_rgba(131,195,163,0.3)]"
              >
                Đã Rõ Luật
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Custom Micro components
function RoleDetailCard({ icon: Icon, title, desc, isEvil = false }: { icon: any, title: string, desc: string, isEvil?: boolean }) {
  const colorClass = isEvil ? "text-(--tertiary)" : "text-(--primary)";
  const bgClass = isEvil ? "bg-(--tertiary)/10 border-(--tertiary)/30" : "bg-(--primary)/10 border-(--primary)/30";
  return (
    <div className={`avalon-rules-role-card p-3 md:p-4 rounded-xl border ${bgClass} flex flex-col gap-1.5 md:gap-2 hover:bg-white/5 transition-colors`}>
      <div className={`flex items-center gap-2 font-headline uppercase tracking-widest ${colorClass}`}>
        <Icon className="w-5 h-5" />
        <span className="font-bold text-xs md:text-sm">{title}</span>
      </div>
      <p className="text-gray-300 text-[11px] md:text-xs font-sans leading-relaxed">
        {desc}
      </p>
    </div>
  );
}

function StepItem({ num, title, icon: Icon, desc }: { num: string, title: string, icon: any, desc: string }) {
  return (
    <div className="avalon-rules-step-item relative pl-12 flex flex-col gap-1">
       {/* Circle marker */}
       <div className="absolute left-0 top-0 w-9 h-9 rounded-full bg-(--primary)/20 border-2 border-(--primary) flex items-center justify-center font-bold text-(--primary) font-headline">
         {num}
       </div>
       <div className="flex items-center gap-2 text-(--on-surface) font-headline uppercase tracking-widest text-xs md:text-sm pt-2 pb-1">
         <Icon className="w-4 h-4 text-(--primary)" /> {title}
       </div>
       <p className="text-gray-400 text-xs md:text-sm font-sans leading-relaxed">
         {desc}
       </p>
    </div>
  );
}
