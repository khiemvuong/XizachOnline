"use client";

import { useRouter } from "next/navigation";
import useScreenWakeLock from "@/hooks/useScreenWakeLock";
import { getBackgroundUrl } from "@/utils/deceptionAssets";

const AVALON_BG = getBackgroundUrl("avalon");
const DECEPTION_BG = getBackgroundUrl("deception");
const WEREWOLF_BG = "/werewolf/werewolf_poster.jpeg";
const GLITCHER_BG = "/glitcher/raster/rose-hero.png";

export default function HomePage() {
  const router = useRouter();

  useScreenWakeLock({
    enabled: true,
    mobileOnly: true,
  });

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-[#0b0d11] text-[#e2e2e5] antialiased selection:bg-red-500 selection:text-white md:flex-row">
      
      {/* 1. Avalon Section */}
      <section
        className="group relative flex h-1/4 w-full cursor-pointer flex-row items-center justify-start overflow-hidden border-b border-[#cda372]/15 bg-[#091624] transition-colors duration-500 hover:bg-[#0e2136] md:h-full md:w-1/4 md:flex-col md:items-stretch md:border-b-0 md:border-r"
        onClick={() => router.push("/avalon")}
      >
        {/* 1:1 Poster Image - Full-bleed width on desktop, full-bleed height on mobile */}
        <div 
          className="h-full w-auto md:w-full md:h-auto aspect-square overflow-hidden shrink-0 border-r md:border-r-0 md:border-b border-[#cda372]/15 relative"
        >
          <div
            className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105"
            style={{
              backgroundImage: `url('${AVALON_BG}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          {/* subtle blue gradient overlay on the image */}
          <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />
        </div>

        {/* Content Box */}
        <div className="flex-1 flex flex-col justify-center items-start md:items-center text-left md:text-center p-4 sm:p-6 md:p-8 space-y-1 sm:space-y-2 select-none">
          {/* Game Title */}
          <h2 
            className="font-serif text-xl sm:text-2xl md:text-3xl font-black tracking-wide text-[#e1c7a5] transition-all duration-300 group-hover:text-white"
            style={{ 
              fontFamily: "var(--font-cinzel-decorative), serif",
              textShadow: "0 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(225,199,165,0.2)"
            }}
          >
            AVALON
          </h2>

          {/* Description */}
          <p className="font-serif text-[10px] sm:text-xs text-[#829ea2] italic max-w-70 leading-relaxed">
            Cuộc chiến thiện ác thời trung cổ. Tìm kiếm gián điệp của Mordred hoặc trung thành với Arthur.
          </p>
        </div>
      </section>

      {/* 2. Deception Section */}
      <section
        className="group relative flex h-1/4 w-full cursor-pointer flex-row items-center justify-start overflow-hidden border-b border-[#cda372]/15 bg-[#1c0707] transition-colors duration-500 hover:bg-[#2a0b0b] md:h-full md:w-1/4 md:flex-col md:items-stretch md:border-b-0 md:border-r"
        onClick={() => router.push("/deception")}
      >
        {/* 1:1 Poster Image */}
        <div 
          className="h-full w-auto md:w-full md:h-auto aspect-square overflow-hidden shrink-0 border-r md:border-r-0 md:border-b border-[#cda372]/15 relative"
        >
          <div
            className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105"
            style={{
              backgroundImage: `url('${DECEPTION_BG}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          {/* subtle red gradient overlay on the image */}
          <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />
        </div>

        {/* Content Box */}
        <div className="flex-1 flex flex-col justify-center items-start md:items-center text-left md:text-center p-4 sm:p-6 md:p-8 space-y-1 sm:space-y-2 select-none">
          {/* Game Title */}
          <h2 
            className="font-serif text-xl sm:text-2xl md:text-3xl font-black tracking-wide text-red-500 transition-all duration-300 group-hover:text-red-400"
            style={{ 
              textShadow: "0 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(239,68,68,0.2)"
            }}
          >
            DECEPTION
          </h2>

          {/* Description */}
          <p className="font-serif text-[10px] sm:text-xs text-[#829ea2] italic max-w-70 leading-relaxed">
            Vạch trần hung thủ ẩn mình trong tổ điều tra. Giải mã manh mối từ nhà giám định pháp y.
          </p>
        </div>
      </section>

      {/* 3. Werewolf Section */}
      <section
        className="group relative flex h-1/4 w-full cursor-pointer flex-row items-center justify-start overflow-hidden border-b border-[#cda372]/15 bg-[#1b081c] transition-colors duration-500 hover:bg-[#2b0c2c] md:h-full md:w-1/4 md:flex-col md:items-stretch md:border-b-0 md:border-r"
        onClick={() => router.push("/weredog")}
      >
        {/* 1:1 Poster Image */}
        <div 
          className="h-full w-auto md:w-full md:h-auto aspect-square overflow-hidden shrink-0 border-r md:border-r-0 md:border-b border-[#cda372]/15 relative"
        >
          <div
            className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105"
            style={{
              backgroundImage: `url('${WEREWOLF_BG}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          {/* subtle purple gradient overlay on the image */}
          <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />
        </div>

        {/* Content Box */}
        <div className="flex-1 flex flex-col justify-center items-start md:items-center text-left md:text-center p-4 sm:p-6 md:p-8 space-y-1 sm:space-y-2 select-none">
          {/* Game Title */}
          <h2 
            className="font-gothic-heading text-xl sm:text-2xl md:text-3xl font-black tracking-wide text-transparent bg-clip-text bg-linear-to-r from-red-600 via-amber-300 to-red-600 transition-all duration-300 group-hover:scale-[1.02]"
            style={{ 
              textShadow: "0 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(217,119,6,0.2)"
            }}
          >
            WEREWOLF
          </h2>

          {/* Description */}
          <p className="font-serif text-[10px] sm:text-xs text-[#829ea2] italic max-w-70 leading-relaxed">
            Đêm trăng máu nhuốm đỏ ngôi làng. Bầy sói săn lùng dân lành hay dân lành treo cổ sói hung ác?
          </p>
        </div>
      </section>

      {/* 4. The Glitcher Section */}
      <section
        className="group relative flex h-1/4 w-full cursor-pointer flex-row items-center justify-start overflow-hidden bg-[#070a0d] transition-colors duration-500 hover:bg-[#10171c] md:h-full md:w-1/4 md:flex-col md:items-stretch"
        onClick={() => router.push("/glitcher")}
      >
        <div className="relative h-full w-auto shrink-0 overflow-hidden border-r border-[#8be0d0]/15 bg-[#070a0d] aspect-square md:h-auto md:w-full md:border-b md:border-r-0">
          <div
            className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105"
            style={{
              backgroundImage: `url('${GLITCHER_BG}')`,
              backgroundSize: "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(71,215,215,0.04)_1px,transparent_1px)] bg-size-[100%_4px] opacity-40" />
        </div>

        <div className="flex flex-1 select-none flex-col items-start justify-center space-y-1 p-4 text-left sm:space-y-2 sm:p-6 md:items-center md:p-8 md:text-center">
          <h2
            className="text-xl font-black uppercase tracking-[0.08em] text-[#ff8a82] transition-all duration-300 group-hover:text-[#f5eee8] sm:text-2xl md:text-3xl"
            style={{
              fontFamily: "var(--font-glitcher-display), sans-serif",
              textShadow: "2px 0 rgba(71,215,215,0.35), -2px 0 rgba(255,116,111,0.3)",
            }}
          >
            The Glitcher
          </h2>
          <p className="max-w-70 text-[10px] leading-relaxed text-[#8be0d0]/70 sm:text-xs">
            Diễn không lời, đọc dữ liệu lệch và tìm người đang sống trong một hiện trường khác.
          </p>
        </div>
      </section>

    </div>
  );
}
