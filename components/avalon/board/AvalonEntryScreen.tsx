import { ChevronsRight, Settings } from "lucide-react";
import AvatarDisplay from "@/components/shared/AvatarDisplay";
import { type PlayerProfile } from "@/hooks/usePlayerProfile";

export default function AvalonEntryScreen({
  onJoin,
  onRulesClick,
  onOpenProfile,
  profile,
}: {
  onJoin: () => void;
  onRulesClick: () => void;
  onOpenProfile: () => void;
  profile: PlayerProfile;
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
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={onOpenProfile}
                className="group relative flex flex-col items-center gap-2 p-4 rounded-2xl border border-(--outline-variant)/30 bg-black/40 hover:bg-black/60 transition-all hover:border-(--primary)/50 cursor-pointer shadow-lg w-full"
              >
                <div className="absolute inset-0 bg-linear-to-br from-(--primary)/0 to-(--primary)/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="relative">
                  <AvatarDisplay 
                    avatarUrl={profile.avatarUrl} 
                    name={profile.name || "?"} 
                    size={64} 
                    className="border-2 border-(--primary)/40 group-hover:border-(--primary) transition-colors shadow-xl"
                  />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-(--primary) text-[#0f172a] flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <Settings className="w-4 h-4" />
                  </div>
                </div>
                
                <div className="text-center mt-2 w-full">
                  <div className="text-[10px] text-(--on-surface-variant)/70 uppercase tracking-widest mb-1">Danh xưng hiện tại</div>
                  <div className="text-(--primary) font-headline font-bold text-lg tracking-wider truncate w-full px-2">
                    {profile.name || "Chưa thiết lập"}
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={() => {
                if (profile.name.trim()) onJoin();
              }}
              disabled={!profile.name.trim()}
              className={`px-12 py-3.5 rounded-xl font-headline font-extrabold text-sm transform transition-all tracking-widest uppercase flex items-center justify-center gap-3 w-full
                  ${
                    profile.name.trim()
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
