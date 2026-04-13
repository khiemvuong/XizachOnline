import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Shield, VenetianMask, Swords, Info, ScrollText, 
  Users, Gavel, Target, Eye, Flame, CloudFog, Wand2, Crosshair, Sparkles, type LucideIcon
} from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RulesModal({ isOpen, onClose }: RulesModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="avalon-rules-modal-shell avalon-theme fixed inset-0 z-120 flex items-center justify-center p-2 sm:p-4">
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
                     Ván đấu có 2 nhịp luật: <strong>Chế độ Cơ bản</strong> và <strong>Chế độ Nâng cao</strong>. Khi bật Nâng cao ở Lobby, game sẽ mở thêm phase kỹ năng, Athena, Mordred nguyền fail, Merlin Đồng Quy và bảng log kỹ năng cuối game.
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
                      desc="Biết phe Ác (trừ Mordred). Ở chế độ Nâng cao, trước Ám sát Merlin có thể chọn dùng Đồng Quy Vô Tận."
                    />
                    <RoleDetailCard 
                      icon={Eye} title="Percival" 
                      desc="Cơ bản: thấy cặp Merlin/Morgana mơ hồ. Nâng cao: có thể Truy Vết người đi quest theo kết quả CÓ/KHÔNG CÓ CHỨC NĂNG."
                    />
                    <RoleDetailCard
                      icon={Sparkles} title="Athena (Nâng Cao)"
                      desc="Lộ diện công khai khi dùng Đảo Thiên Kiền Khôn để đảo ngược kết quả nhiệm vụ sau khi lật phiếu."
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
                      desc="Cuối game có quyền Ám sát Merlin. Ở Nâng cao, Assassin còn có kỹ năng Soi Vai lên người trong đội quest."
                      isEvil
                    />
                    <RoleDetailCard 
                      icon={Flame} title="Morgana" 
                      desc="Đóng giả Merlin trong mắt Percival. Nâng cao: dùng Đêm Câm Lặng để khóa toàn bộ kỹ năng ở phase đó."
                      isEvil
                    />
                    <RoleDetailCard 
                      icon={VenetianMask} title="Mordred" 
                      desc="Tàng hình trước Merlin. Nâng cao: có thể Nguyền Thất Bại lên 1 người đi quest, kể cả khi Mordred không đi quest."
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
                    num="3" title="Phase Kỹ Năng (Khi Bật Nâng Cao)" icon={Sparkles}
                    desc="Trước khi vào vote nhiệm vụ, người liên quan sẽ chọn DÙNG/KHÔNG DÙNG kỹ năng theo role. Kết quả soi/truy vết là thông tin riêng tư; Athena là kỹ năng có hiệu ứng công khai khi kích hoạt."
                  />
                  <StepItem 
                    num="4" title="Thực Hiện Nhiệm Vụ" icon={Target}
                    desc="Những Kỵ sĩ trong đội đã được chốt sẽ thả phiếu vào nhiệm vụ. Phe Thiện bắt buộc thả THÀNH CÔNG. Phe Ác có thể thả THẤT BẠI hoặc THÀNH CÔNG để trà trộn."
                  />
                  <StepItem 
                    num="5" title="Ám Sát Merlin (Phút Chót)" icon={Crosshair}
                    desc="Nếu Phe Thiện thắng 3 nhiệm vụ, Assassin được ám sát. Nâng cao: Merlin có bước quyết định trước Ám sát; nếu đã kích hoạt Đồng Quy và bị ám sát trúng thì trận đấu kết thúc HÒA."
                  />
                </div>
              </section>

              {/* Section: Advanced Mode */}
              <section className="avalon-rules-section space-y-3 md:space-y-4">
                <h3 className="avalon-rules-heading font-headline text-(--secondary) tracking-widest uppercase text-base md:text-xl flex items-center gap-2 border-b border-(--outline-variant)/30 pb-2">
                  <Sparkles className="w-5 h-5" />
                  Chế Độ Nâng Cao (NEW)
                </h3>

                <div className="p-4 rounded-xl border border-(--primary)/30 bg-(--primary)/8">
                  <p className="text-xs md:text-sm text-(--on-surface-variant) leading-relaxed">
                    Bật trong Lobby để dùng bộ luật mở rộng: phase kỹ năng, Athena đảo mệnh, Minion Cha Cha Cha, Mordred nguyền fail và Merlin Đồng Quy trước ám sát.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <AdvancedSkillCard icon={Crosshair} title="Assassin - Soi Vai" desc="Soi 1 người trong đội quest, nhận kết quả CÓ/KHÔNG CÓ CHỨC NĂNG." />
                  <AdvancedSkillCard icon={Eye} title="Percival - Truy Vết" desc="Truy vết 1 người trong đội quest theo nhị phân chức năng." />
                  <AdvancedSkillCard icon={Flame} title="Morgana - Đêm Câm Lặng" desc="Khóa toàn bộ kỹ năng ở phase kỹ năng của quest đó." />
                  <AdvancedSkillCard icon={VenetianMask} title="Mordred - Nguyền Thất Bại" desc="Ép 1 người trong đội quest bị buộc thả FAIL." />
                  <AdvancedSkillCard icon={Sparkles} title="Athena - Đảo Thiên Kiền Khôn" desc="Lật kết quả quest sau khi lật phiếu và lộ diện công khai." />
                  <AdvancedSkillCard icon={Wand2} title="Merlin - Đồng Quy Vô Tận" desc="Quyết định trước Ám sát; nếu bị ám sát trúng khi đã kích hoạt thì ván đấu HÒA." />
                  <AdvancedSkillCard icon={Users} title="Quest Ẩn Minion" desc="Nếu 2 Minion cùng đi nhiệm vụ đủ 3 lần và trong đó thắng ít nhất 2 lần, cặp đó sẽ thấy mặt nhau." />
                </div>

                <div className="p-4 rounded-xl border border-amber-400/30 bg-amber-500/10 flex gap-3 items-start">
                  <Info className="w-5 h-5 shrink-0 mt-0.5 text-amber-300" />
                  <div className="text-xs md:text-sm text-amber-100/85 leading-relaxed">
                    Nếu có từ <strong>3 Minion trở lên</strong> cùng thỏa điều kiện Quest Ẩn, hệ thống sẽ <strong>random 2 Minion</strong> để kích hoạt hiệu ứng thấy mặt nhau cho ván đó.
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-cyan-400/30 bg-cyan-500/10 flex gap-3 items-start">
                  <Info className="w-5 h-5 shrink-0 mt-0.5 text-cyan-300" />
                  <div className="text-xs md:text-sm text-cyan-100/85 leading-relaxed">
                    Khi game kết thúc, góc trên bên trái sẽ có bảng <strong>Log Lịch Sử Kỹ Năng</strong> (bật/tắt được) để xem ai đã dùng kỹ năng nào, ở phase nào, và dùng lên ai.
                  </div>
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
                          <th className="py-3 px-2 font-bold text-amber-500/80">Q4 (7+ cần 2 Fail)</th>
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
                     <strong>(*) Lưu ý:</strong> Tại vòng 4 khi bàn có từ 7 người chơi trở lên, yêu cầu phải có <strong>2 phiếu THẤT BẠI (Fail)</strong> thì nhiệm vụ mới thất bại. Nếu chỉ có 1 phiếu Fail, nhiệm vụ vẫn tính THÀNH CÔNG cho phe Thiện.
                   </div>
                </div>
              </section>
            </div>
            
            {/* Floating close button — overlays content, doesn't take layout space */}
            <div className="pointer-events-none absolute bottom-4 right-4 z-20 flex justify-end">
              <button
                onClick={onClose}
                className="pointer-events-auto px-4 py-1.5 bg-primary-avalon/90 text-surface-dim-avalon text-xs font-bold font-headline uppercase tracking-widest rounded-full hover:brightness-110 transition-all shadow-[0_0_12px_rgba(131,195,163,0.4)] backdrop-blur-sm border border-white/10"
              >
                Đã rõ ✓
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Custom Micro components
function RoleDetailCard({ icon: Icon, title, desc, isEvil = false }: { icon: LucideIcon, title: string, desc: string, isEvil?: boolean }) {
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

function AdvancedSkillCard({ icon: Icon, title, desc }: { icon: LucideIcon, title: string, desc: string }) {
  return (
    <div className="p-3 md:p-4 rounded-xl border border-cyan-400/30 bg-cyan-500/10 hover:bg-cyan-500/15 transition-colors">
      <div className="flex items-center gap-2 text-cyan-200 font-headline uppercase tracking-widest">
        <Icon className="w-5 h-5" />
        <span className="font-bold text-xs md:text-sm">{title}</span>
      </div>
      <p className="mt-1 text-[11px] md:text-xs text-cyan-100/80 leading-relaxed font-sans">
        {desc}
      </p>
    </div>
  );
}

function StepItem({ num, title, icon: Icon, desc }: { num: string, title: string, icon: LucideIcon, desc: string }) {
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
