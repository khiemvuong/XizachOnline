"use client";

import { useRouter } from "next/navigation";
import useScreenWakeLock from "@/hooks/useScreenWakeLock";

const AVALON_BG =
  "https://raw.githubusercontent.com/khiemvuong/deception-assets/main/background/avalon.jpeg";

const DECEPTION_BG =
  "https://raw.githubusercontent.com/khiemvuong/deception-assets/main/background/deception.jpeg";

export default function HomePage() {
  const router = useRouter();

  useScreenWakeLock({
    enabled: true,
    mobileOnly: true,
  });

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-[#121416] text-[#e2e2e5] antialiased selection:bg-[#ff5167] selection:text-[#5b0015] md:flex-row">
      <section
        className="group relative flex h-1/2 w-full cursor-pointer overflow-hidden border-b border-[#5d3f40]/20 bg-[#1a1c1e] md:h-full md:w-1/2 md:border-b-0 md:border-r"
        onClick={() => router.push("/avalon")}
      >
        <div
          className="absolute inset-0 transition-transform duration-700 ease-in-out group-hover:scale-105"
          style={{
            backgroundImage: `url('${AVALON_BG}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-black/20 transition-colors duration-500 group-hover:bg-black/0" />
        <div className="absolute bottom-6 right-6 z-10 md:bottom-10 md:right-10">
          <span className="text-sm font-bold tracking-widest text-[#e2e2e5]/80 underline underline-offset-4 drop-shadow-md transition-all duration-300 group-hover:text-white md:text-base">
            TIẾN VÀO VƯƠNG QUỐC
          </span>
        </div>
      </section>

      <section
        className="group relative flex h-1/2 w-full cursor-pointer overflow-hidden bg-[#1e2022] md:h-full md:w-1/2"
        onClick={() => router.push("/deception")}
      >
        <div
          className="absolute inset-0 transition-transform duration-700 ease-in-out group-hover:scale-105"
          style={{
            backgroundImage: `url('${DECEPTION_BG}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-black/20 transition-colors duration-500 group-hover:bg-black/0" />
        <div className="absolute bottom-6 right-6 z-10 md:bottom-10 md:right-10">
          <span className="text-sm font-bold tracking-widest text-red-500 underline underline-offset-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] transition-all duration-300 group-hover:text-red-400 md:text-base">
            BẮT ĐẦU ĐIỀU TRA
          </span>
        </div>
      </section>
    </div>
  );
}
