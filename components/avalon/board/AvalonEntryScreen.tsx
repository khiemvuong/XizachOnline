import { Edit2, ChevronsRight } from "lucide-react";

export default function AvalonEntryScreen({
  playerName,
  setPlayerName,
  onJoin,
  onRulesClick,
}: {
  playerName: string;
  setPlayerName: (name: string) => void;
  onJoin: () => void;
  onRulesClick: () => void;
}) {
  return (
    <div className="avalon-entry-screen font-body text-primary-avalon h-dvh overflow-hidden flex items-center justify-center relative z-0 p-4">
      {/* Background Atmospheric Elements */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: "url('/avalon_roles/background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "scroll",
        }}
      >
        <div className="absolute inset-0 bg-surface-dim-avalon/70 backdrop-blur-[2px]"></div>
      </div>
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-(--primary) opacity-10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-(--tertiary) opacity-10 blur-[120px] rounded-full"></div>
      </div>

      {/* Renders external RulesModal if parent state shows rules, handled by parent component */}

      <div className="avalon-entry-card w-full max-w-md avalon-glass rounded-3xl border border-(--outline-variant) shadow-2xl overflow-y-auto max-h-full landscape:max-w-4xl lg:max-w-4xl relative z-10 custom-avalon-scrollbar">
        <div className="avalon-entry-grid grid grid-cols-1 landscape:grid-cols-[1.05fr_1fr] lg:grid-cols-[1.05fr_1fr] gap-4 md:gap-6 p-5 sm:p-1 md:p-8 items-stretch">
          <div className="avalon-entry-copy rounded-2xl border border-(--outline-variant)/25 bg-(--surface-container-low)/50 p-4 sm:p-5 flex flex-col justify-between">
            <div className="text-center md:text-left space-y-2">
              <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.28em] text-(--secondary)">
                The Illuminated Archive
              </p>
              <h2 className="text-(--primary) font-extrabold font-serif text-2xl sm:text-3xl landscape:text-2xl lg:text-4xl tracking-wider uppercase avalon-title-glow-primary">
                Căn Phòng Ánh Sáng
              </h2>
              <p className="text-(--on-surface-variant) text-sm italic">
                Hãy chọn danh xưng để hội ngộ các Kỵ sĩ.
              </p>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-(--primary)/10 border-l-2 border-(--primary)/40 relative">
              <p className="text-(--on-surface-variant) text-xs italic leading-relaxed text-center md:text-left">
                &quot;Một cuộc chiến trường kỳ cần sự tin tưởng. Nhưng cẩn thận,
                không phải ai nấy đều là Kỵ Sĩ trung tuyến...&quot;
              </p>
            </div>
            
            <button
               onClick={onRulesClick}
               className="mt-4 self-center md:self-start text-xs text-(--secondary) underline hover:text-(--primary) cursor-pointer"
            >
              Đọc Hiến thư (Luật chơi)
            </button>
          </div>

          <div className="avalon-entry-form rounded-2xl border border-(--outline-variant)/25 bg-[#0f172a]/45 p-4 sm:p-5 flex flex-col justify-center space-y-4">
            <label className="block text-(--secondary) text-xs sm:text-sm uppercase tracking-tighter text-center">
              Tên của bạn
            </label>
            <div className="relative group">
              <input
                className="w-full bg-[#0f172a]/80 border border-(--outline-variant) focus:ring-1 focus:ring-(--primary) rounded-xl py-3 sm:py-4 px-5 text-white placeholder:text-slate-500 font-sans text-center font-bold tracking-widest text-base sm:text-lg outline-none transition-colors"
                placeholder="Nhập tên..."
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={12}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && playerName.trim()) {
                    onJoin();
                  }
                }}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                <Edit2 className="w-4 h-4 sm:w-5 sm:h-5 text-(--primary)/50" />
              </div>
            </div>

            <button
              onClick={() => {
                if (playerName.trim()) onJoin();
              }}
              disabled={!playerName.trim()}
              className={`px-12 py-3.5 rounded-xl font-headline font-extrabold text-sm transform transition-all tracking-widest uppercase flex items-center justify-center gap-3 w-full
                  ${
                    playerName.trim()
                      ? "bg-primary-avalon hover:bg-white text-surface-dim-avalon shadow-[0_10px_30px_rgba(186,200,220,0.2)] active:scale-95 cursor-pointer"
                      : "bg-[#1e2b3b] text-[#768497] cursor-not-allowed border border-[#44474c]/50"
                  }`}
            >
              Gia Nhập
              <ChevronsRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
