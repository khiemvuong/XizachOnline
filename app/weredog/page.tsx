"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Delete, LogIn, ArrowLeft, ShieldAlert } from "lucide-react";
import { io } from "socket.io-client";

function generateRoomId(): string {
  const value = new Uint16Array(1);
  window.crypto.getRandomValues(value);
  return (1000 + (value[0] % 9000)).toString();
}

export default function WeredogHome() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const codeChars = [0, 1, 2, 3].map((index) => roomId[index] ?? "-");

  const goToRoom = (targetRoomId: string) => {
    router.push(`/weredog/room/${targetRoomId}`);
  };

  const handleCreate = () => {
    if (isBusy) return;
    setIsBusy(true);
    setErrorMsg("");

    const newRoomId = generateRoomId();
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "";
    const socketio = io(`${socketUrl}/weredog`, { reconnection: false });

    socketio.emit("createRoom", newRoomId, (success: boolean) => {
      socketio.disconnect();
      if (success) {
        goToRoom(newRoomId);
        return;
      }
      setIsBusy(false);
      handleCreate();
    });
  };

  const handleJoin = () => {
    if (isBusy || roomId.trim().length !== 4) return;
    setIsBusy(true);
    setErrorMsg("");

    const targetRoomId = roomId.trim();
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "";
    const socketio = io(`${socketUrl}/weredog`, { reconnection: false });

    socketio.emit("checkRoom", targetRoomId, (exists: boolean) => {
      socketio.disconnect();
      setIsBusy(false);
      if (exists) {
        goToRoom(targetRoomId);
      } else {
        setErrorMsg("Mã phòng không tồn tại hoặc đã bị giải tán.");
      }
    });
  };

  const handleKeyPress = (num: string) => {
    if (roomId.length >= 4 || isBusy) return;
    setRoomId((prev) => prev + num);
    setErrorMsg("");
  };

  const handleBackspace = () => {
    if (isBusy || roomId.length === 0) return;
    setRoomId((prev) => prev.slice(0, -1));
  };

  return (
    <div className="weredog-theme weredog-vignette relative min-h-dvh w-full overflow-hidden flex flex-col justify-between py-8 px-4 sm:px-8">
      {/* Back to home */}
      <button
        onClick={() => router.push("/")}
        className="absolute left-4 top-4 z-50 flex items-center gap-1.5 border border-var(--weredog-border) bg-[#222a2f]/90 px-3 py-2 text-xs font-bold uppercase tracking-widest text-[#829ea2] transition-all hover:bg-[#222a2f] hover:text-white active:scale-95 font-gothic-ui"
        aria-label="Quay về trang chủ"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Home
      </button>

      {/* Decorative Ornate Borders */}
      <div className="pointer-events-none absolute inset-4 border border-[#445257]/30 border-double rounded-sm" />

      <main className="relative z-10 flex flex-col items-center justify-center my-auto">
        <div className="weredog-card p-8 sm:p-12 max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 relative rounded-lg">
          {/* Divider line for desktop */}
          <div className="hidden md:block absolute left-1/2 top-8 bottom-8 w-px bg-[#445257]/30 -translate-x-1/2" />

          {/* Left section: Info & Create */}
          <section className="flex flex-col items-center justify-center text-center space-y-6">
            <div className="space-y-3">
              <h1 className="font-gothic-heading text-4xl sm:text-5xl font-black tracking-wider text-[#829ea2] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                WEREDOG
              </h1>
              <p className="font-gothic-label text-xs uppercase tracking-[0.25em] text-[#829ea2]/60">
                Gothic Fairytale Edition
              </p>
            </div>

            <div className="w-full flex justify-center">
              <button
                onClick={handleCreate}
                disabled={isBusy}
                className="weredog-button w-full max-w-xs py-3.5 px-6 rounded font-gothic-heading text-lg font-bold tracking-widest uppercase disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(59,28,38,0.5)]"
              >
                {isBusy ? "Khởi tạo..." : "Tạo Phòng Mới"}
              </button>
            </div>

            <p className="font-gothic-body text-sm italic max-w-xs text-[#829ea2]/80 leading-relaxed">
              &quot;Khi trăng máu lên cao, bầy sói thức giấc tìm mồi. Liệu bạn sẽ sống sót hay bị nuốt chửng bởi bóng tối?&quot;
            </p>
          </section>

          {/* Right section: Join Room */}
          <section className="flex flex-col items-center justify-center space-y-6">
            <div className="bg-[#3b1c26]/20 border border-[#3b1c26]/50 rounded px-4 py-1.5 text-xs font-gothic-label uppercase tracking-widest text-[#829ea2]">
              Nhập Mã Phòng
            </div>

            {/* Display Code Box */}
            <div className="flex justify-center gap-3">
              {codeChars.map((char, index) => {
                const filled = char !== "-";
                return (
                  <div
                    key={index}
                    className={`flex h-14 w-12 items-center justify-center border rounded text-2xl font-gothic-heading font-black transition-all ${
                      filled
                        ? "border-[#829ea2] bg-[#222a2f] text-[#829ea2] shadow-[0_0_10px_rgba(130,158,162,0.3)]"
                        : "border-[#445257] bg-[#0b0d11]/40 text-[#445257]"
                    }`}
                  >
                    {char}
                  </div>
                );
              })}
            </div>

            {/* Custom Keypad */}
            <div className="grid grid-cols-3 gap-2.5 w-full max-w-xs font-gothic-ui">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleKeyPress(digit)}
                  disabled={isBusy}
                  className="flex h-12 items-center justify-center border border-[#445257]/60 bg-[#222a2f]/50 rounded text-[#cdd6d8] font-bold text-lg hover:bg-[#222a2f] active:bg-[#829ea2] active:text-[#0b0d11] transition-all disabled:opacity-50"
                >
                  {digit}
                </button>
              ))}

              <button
                onClick={handleBackspace}
                disabled={isBusy}
                className="flex h-12 items-center justify-center border border-red-900/40 bg-red-950/20 text-red-400 rounded hover:bg-red-950/40 transition-all disabled:opacity-50"
              >
                <Delete className="h-5 w-5" />
              </button>

              <button
                onClick={() => handleKeyPress("0")}
                disabled={isBusy}
                className="flex h-12 items-center justify-center border border-[#445257]/60 bg-[#222a2f]/50 rounded text-[#cdd6d8] font-bold text-lg hover:bg-[#222a2f] active:bg-[#829ea2] active:text-[#0b0d11] transition-all disabled:opacity-50"
              >
                0
              </button>

              <button
                onClick={handleJoin}
                disabled={roomId.length !== 4 || isBusy}
                className={`flex h-12 items-center justify-center rounded transition-all ${
                  roomId.length === 4 && !isBusy
                    ? "bg-[#3b1c26] border border-[#5a1d2e] text-white hover:bg-[#551c2e] active:scale-95 shadow-[0_0_10px_rgba(59,28,38,0.5)]"
                    : "bg-[#222a2f]/20 border border-[#445257]/40 text-[#445257]/60 cursor-not-allowed"
                }`}
              >
                <LogIn className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-1.5 text-xs text-red-400 font-gothic-ui">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="text-center font-gothic-label text-[10px] tracking-[0.2em] text-[#829ea2]/40 select-none">
        WEREDOG MULTIPLAYER ONLINE // DESIGNED WITH GOTHIC FAIRYTALE AESTHETICS
      </footer>
    </div>
  );
}
