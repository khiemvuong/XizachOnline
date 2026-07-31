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
    <div 
      className="relative min-h-dvh w-full overflow-hidden flex flex-col justify-between py-6 px-4 sm:px-8 bg-cover bg-center select-none"
      style={{ backgroundImage: "url('/werewolf/weredog-lobby-bg.jpeg')" }}
    >
      {/* Dark gothic vignette overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/50 to-black/85 pointer-events-none z-0" />

      {/* Back to home */}
      <button
        onClick={() => router.push("/")}
        className="absolute left-4 top-4 z-50 flex items-center gap-1.5 border border-[#cda372]/30 bg-[#222a2f]/90 px-3 py-2 text-xs font-bold uppercase tracking-widest text-[#e1c7a5] hover:text-white hover:border-[#cda372]/60 hover:bg-[#3b1c26]/60 transition-all active:scale-95 font-gothic-ui pointer-events-auto cursor-pointer shadow-md rounded"
        aria-label="Quay về trang chủ"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Home
      </button>

      {/* Decorative Ornate Borders */}
      <div className="pointer-events-none absolute inset-4 border border-[#cda372]/15 border-double rounded-md z-10" />

      <main className="relative z-20 flex flex-col items-center justify-center my-auto w-full">
        <div className="weredog-card p-5 sm:p-10 landscape:p-6 max-w-4xl w-full grid grid-cols-1 landscape:grid-cols-2 sm:grid-cols-2 gap-6 sm:gap-10 relative rounded-xl border border-[#cda372]/30 bg-[#111318]/90 backdrop-blur-md shadow-[0_15px_50px_rgba(0,0,0,0.95)]">
          {/* Divider line for desktop and landscape */}
          <div className="hidden landscape:block sm:block absolute left-1/2 top-8 bottom-8 w-px bg-[#cda372]/20 -translate-x-1/2" />

          {/* Left section: Info & Create */}
          <section className="flex flex-col items-center justify-center text-center space-y-4 landscape:space-y-3 sm:space-y-6">
            <div className="space-y-2 landscape:space-y-1 sm:space-y-3">
              <h1 className="font-gothic-heading text-3xl sm:text-5xl font-black tracking-wider text-transparent bg-clip-text bg-linear-to-r from-red-600 via-[#e1c7a5] to-red-600 drop-shadow-[0_2.5px_6px_rgba(0,0,0,0.95)]">
                WEREDOG
              </h1>
              <p className="font-gothic-label text-[9px] sm:text-xs uppercase tracking-[0.25em] text-[#829ea2]/60">
                Gothic Fairytale Edition
              </p>
            </div>

            <div className="w-full flex justify-center">
              <button
                onClick={handleCreate}
                disabled={isBusy}
                className="w-full max-w-xs py-2.5 sm:py-3.5 px-6 rounded text-sm sm:text-base font-bold tracking-widest uppercase bg-linear-to-r from-[#5a1d2e] via-[#7c253c] to-[#5a1d2e] hover:from-[#7c253c] hover:to-[#5a1d2e] border border-red-500/30 text-white disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(239,68,68,0.25)] hover:shadow-[0_0_25px_rgba(239,68,68,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                {isBusy ? "Khởi tạo..." : "Tạo Phòng Mới"}
              </button>
            </div>

            <p className="font-gothic-body text-xs sm:text-sm italic max-w-xs text-[#829ea2]/80 leading-relaxed">
              &quot;Khi trăng máu lên cao, bầy sói thức giấc tìm mồi. Liệu bạn sẽ sống sót hay bị nuốt chửng bởi bóng tối?&quot;
            </p>
          </section>

          {/* Right section: Join Room */}
          <section className="flex flex-col items-center justify-center space-y-4 landscape:space-y-3 sm:space-y-6">
            <div className="bg-[#3b1c26]/30 border border-[#5a1d2e]/40 rounded-full px-4 py-1 text-[9px] sm:text-xs font-gothic-label uppercase tracking-widest text-[#e1c7a5]/90 shadow-sm">
              Nhập Mã Phòng
            </div>

            {/* Display Code Box */}
            <div className="flex justify-center gap-3">
              {codeChars.map((char, index) => {
                const filled = char !== "-";
                return (
                  <div
                    key={index}
                    className={`flex h-11 w-10 sm:h-14 sm:w-12 items-center justify-center border rounded text-xl sm:text-2xl font-gothic-heading font-black transition-all ${
                      filled
                        ? "border-[#cda372] bg-[#222a2f] text-[#e1c7a5] shadow-[0_0_12px_rgba(205,163,114,0.3)]"
                        : "border-[#445257] bg-[#0b0d11]/40 text-[#445257]/50"
                    }`}
                  >
                    {char}
                  </div>
                );
              })}
            </div>

            {/* Custom Keypad */}
            <div className="grid grid-cols-3 gap-2 w-full max-w-60 sm:max-w-xs font-gothic-ui">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleKeyPress(digit)}
                  disabled={isBusy}
                  className="flex h-9 sm:h-12 items-center justify-center border border-[#445257]/60 bg-[#222a2f]/50 hover:bg-[#3b1c26]/60 hover:border-[#cda372]/50 rounded text-[#cdd6d8] hover:text-white font-serif font-black text-base sm:text-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  {digit}
                </button>
              ))}

              <button
                onClick={handleBackspace}
                disabled={isBusy}
                className="flex h-9 sm:h-12 items-center justify-center border border-red-900/40 bg-red-950/20 text-red-400 rounded hover:bg-red-950/40 hover:text-red-300 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Delete className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>

              <button
                onClick={() => handleKeyPress("0")}
                disabled={isBusy}
                className="flex h-9 sm:h-12 items-center justify-center border border-[#445257]/60 bg-[#222a2f]/50 hover:bg-[#3b1c26]/60 hover:border-[#cda372]/50 rounded text-[#cdd6d8] hover:text-white font-serif font-black text-base sm:text-lg transition-all disabled:opacity-50 cursor-pointer"
              >
                0
              </button>

              <button
                onClick={handleJoin}
                disabled={roomId.length !== 4 || isBusy}
                className={`flex h-9 sm:h-12 items-center justify-center rounded transition-all cursor-pointer ${
                  roomId.length === 4 && !isBusy
                    ? "bg-[#5a1d2e] border border-amber-500/60 text-amber-200 hover:text-white hover:bg-amber-600 hover:border-white shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse"
                    : "bg-[#222a2f]/20 border border-[#445257]/45 text-[#445257]/60 cursor-not-allowed"
                }`}
              >
                <LogIn className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-red-400 font-gothic-ui text-center mt-1 animate-bounce">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="text-center font-gothic-label text-[8px] sm:text-[10px] tracking-[0.2em] text-[#829ea2]/30 select-none z-20 mt-4">
        WEREDOG MULTIPLAYER ONLINE // DESIGNED WITH GOTHIC FAIRYTALE AESTHETICS
      </footer>
    </div>
  );
}
