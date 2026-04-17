"use client";
/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, Delete, LogIn, ArrowLeft } from "lucide-react";
import { io } from "socket.io-client";

function generateRoomId(): string {
  const value = new Uint16Array(1);
  window.crypto.getRandomValues(value);
  return (1000 + (value[0] % 9000)).toString();
}

export default function DeceptionHome() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const codeChars = [0, 1, 2, 3].map((index) => roomId[index] ?? "-");

  const goToRoom = (targetRoomId: string) => {
    router.push(`/deception/room/${targetRoomId}`);
  };

  const handleCreate = () => {
    if (isBusy) return;
    setIsBusy(true);
    setErrorMsg("");

    const newRoomId = generateRoomId();
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "";
    const socketio = io(`${socketUrl}/deception`, { reconnection: false });

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
    const socketio = io(`${socketUrl}/deception`, { reconnection: false });

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
    <div className="deception-theme deception-home deception-home-shell relative h-dvh w-full overflow-hidden bg-(--deception-bg)">
      <div className="deception-entry-pattern pointer-events-none absolute inset-0 opacity-70" />

      {/* Back to home */}
      <button
        onClick={() => router.push("/")}
        className="pointer-events-auto absolute left-4 top-4 z-50 flex items-center gap-1.5 border border-(--deception-border) bg-(--deception-surface)/90 px-3 py-2 text-xs font-bold uppercase tracking-widest text-(--on-surface-variant) transition-all hover:bg-(--deception-surface) hover:text-(--on-surface) active:scale-95"
        aria-label="Quay về trang chủ"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Home
      </button>

      <main className="deception-entry-stage relative z-10 flex h-full items-center justify-center px-0 pb-20 pt-6 sm:px-6 sm:pb-24 sm:pt-8 md:px-12 md:pb-12 md:pt-24">
        <div className="pointer-events-none absolute inset-0 z-0 opacity-10">
          <img
            className="h-full w-full object-cover grayscale"
            alt="Gritty urban street in Hong Kong at night with neon lights and dark rainy asphalt"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAtNs5Vjpa2U3b5S_UD1pyiaE1oEzvfpQI7hIZBZ-wVe9HvsT6s8yO9zpPCfjMC3DoXPj420OE-1nxQAXWVcqj7baqfhxzfJX3aElFw-aD5zU6KUvldFn1OL4JDp5SAW5xTeH7leRrrs6YP6d7eAATrfYx-w-6SF8XDWL6jWwNEmEwPxzTI07a-tgMKgTQ5dtST2ixboDW1P-e41BGyjK9eTW3CLXNOP4IedljTP7j5hVgJLFEE7aKoI_jPOiUSJOpDz3maZCZiBv8O"
          />
        </div>

        <div className="deception-entry-card relative z-10 grid w-full max-w-6xl grid-cols-1 landscape:grid-cols-2 md:grid-cols-2">
          <div className="absolute bottom-0 left-1/2 top-0 z-20 hidden w-0.5 -translate-x-1/2 bg-(--deception-red) shadow-[0_0_15px_rgba(255,45,85,0.8)] landscape:block md:block">
            <div className="absolute left-1/2 top-10 h-3 w-3 -translate-x-1/2 rounded-full border border-slate-600 bg-slate-400 shadow-lg" />
            <div className="absolute bottom-10 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border border-slate-600 bg-slate-400 shadow-lg" />
          </div>

          <section className="deception-entry-left flex flex-col items-center justify-center space-y-5 p-5 text-center landscape:p-8 md:p-12 lg:p-24">
            <div className="space-y-2">
              <h1 className="deception-entry-title deception-title-glow font-headline font-black uppercase text-(--deception-red)">
                Deception
              </h1>
              <p className="font-headline text-xs font-medium uppercase tracking-[0.34em] text-(--on-surface-variant) sm:text-sm">
                Murder in Hong Kong
              </p>
            </div>

            <div className="group relative mt-1">
              <div className="absolute -left-4 -top-4 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-500 bg-slate-300 shadow-md">
                <div className="h-1.5 w-1.5 rounded-full bg-slate-800" />
              </div>

              <button
                onClick={handleCreate}
                disabled={isBusy}
                className="relative w-full max-w-76 overflow-hidden whitespace-nowrap bg-[#2a3444] px-7 py-2.5 font-headline text-xl font-black uppercase tracking-[0.12em] text-[#e7edf8] shadow-[10px_10px_0px_rgba(0,0,0,0.4)] transition-all duration-200 hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:brightness-90 disabled:cursor-not-allowed disabled:opacity-60 sm:max-w-80 sm:px-8 sm:py-3 sm:text-2xl"
              >
                {isBusy ? "Creating..." : "Create Room"}
                <div className="absolute left-0 top-0 h-px w-full bg-[#7f8a9c]/40" />
              </button>
            </div>

            <p className="deception-entry-quote max-w-md text-[clamp(0.95rem,2.2vw,1.25rem)] italic leading-relaxed text-(--on-surface-variant)/80">
              &quot;As the Forensic Scientist, you hold the truth. Guide the investigators before the murderer strikes
              again.&quot;
            </p>
          </section>

          <div className="deception-entry-divider-mobile my-1 flex w-full items-center landscape:my-0 landscape:w-auto landscape:flex-col md:hidden">
            <div className="grow border-t border-(--deception-border) landscape:border-l landscape:border-t-0" />
            <span className="mx-4 shrink-0 px-2 text-xs font-semibold uppercase tracking-[0.22em] text-(--on-surface-variant) landscape:mx-0 landscape:my-4">
              Join
            </span>
            <div className="grow border-t border-(--deception-border) landscape:border-l landscape:border-t-0" />
          </div>

          <section className="deception-entry-right flex flex-col items-center justify-center space-y-4 p-5 landscape:p-8 md:p-12 lg:p-24">
            <div className="mb-1 -rotate-1 bg-[#ffcf61] px-6 py-2 text-sm font-headline font-bold uppercase tracking-[0.16em] text-[#2e2010]">
              Access Code Required
            </div>

            <div className="deception-entry-code mb-3 flex items-center justify-center gap-2 sm:gap-3 md:gap-3">
              {codeChars.map((char, index) => {
                const filled = char !== "-";
                return (
                  <div
                    key={index}
                    className={`flex h-12 w-10 items-center justify-center border-b-4 text-2xl font-headline font-black uppercase transition-colors sm:h-14 sm:w-12 sm:text-3xl md:h-20 md:w-16 md:text-4xl ${
                      filled
                        ? "border-(--deception-cyan) bg-(--deception-surface)/70 text-(--deception-cyan)"
                        : "border-(--deception-border) bg-(--deception-surface) text-(--on-surface-variant)/55"
                    }`}
                  >
                    {char}
                  </div>
                );
              })}
            </div>

            <div className="deception-entry-keypad grid w-full max-w-68 grid-cols-3 gap-2 sm:max-w-76 sm:gap-3 md:max-w-84">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleKeyPress(digit)}
                  disabled={isBusy}
                  className="flex h-12 items-center justify-center border border-(--deception-border) bg-(--deception-surface-soft) text-xl font-headline font-bold text-(--on-surface) touch-manipulation transition-all hover:bg-(--deception-surface) active:bg-(--deception-cyan) active:text-[#042030] disabled:cursor-not-allowed disabled:opacity-60 sm:h-14 md:h-16"
                >
                  {digit}
                </button>
              ))}

              <button
                onClick={handleBackspace}
                disabled={isBusy}
                className="flex h-12 items-center justify-center border border-(--error)/40 bg-(--error)/18 text-(--error) touch-manipulation transition-all hover:bg-(--error)/30 disabled:cursor-not-allowed disabled:opacity-60 sm:h-14 md:h-16"
              >
                <Delete className="h-5 w-5" />
              </button>

              <button
                onClick={() => handleKeyPress("0")}
                disabled={isBusy}
                className="flex h-12 items-center justify-center border border-(--deception-border) bg-(--deception-surface-soft) text-xl font-headline font-bold text-(--on-surface) touch-manipulation transition-all hover:bg-(--deception-surface) active:bg-(--deception-cyan) active:text-[#042030] disabled:cursor-not-allowed disabled:opacity-60 sm:h-14 md:h-16"
              >
                0
              </button>

              <button
                onClick={handleJoin}
                disabled={roomId.length !== 4 || isBusy}
                className={`flex h-12 items-center justify-center touch-manipulation transition-all sm:h-14 md:h-16 ${
                  roomId.length === 4 && !isBusy
                    ? "bg-(--deception-cyan) text-[#042030] shadow-[0_0_20px_rgba(0,212,255,0.45)] hover:brightness-110 active:scale-95"
                    : "cursor-not-allowed border border-(--deception-border) bg-(--deception-surface) text-(--on-surface-variant)/55"
                }`}
              >
                <LogIn className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && <p className="text-sm text-(--deception-red-soft)">{errorMsg}</p>}
          </section>
        </div>

        <div className="absolute bottom-8 left-6 hidden w-48 -rotate-12 border border-(--deception-border) bg-(--deception-surface)/90 p-3 opacity-85 shadow-2xl xl:block">
          <img
            className="mb-2 h-40 w-full object-cover grayscale"
            alt="Forensic photo of shattered window glass with red reflection"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0nfGyrJGcvLLTba2Cgpk-XRUuwLepr_FRrvlOEwFO90yTFunsAlkZY6K2swPGJ7PQ9bNZKe0eVSASvCUXSFYgK-2XSq0wfyKiO2bM-YvTk7EUnfKwoThuuDobW5SaDfZD_VYW8rUdXLNh2S1A8V8ATVOJNtMvsbq6FRbE42PB2UX19q9xsEvv4y3kP0KOpvkJdmaXo0kcSis8esqHaqEq__6VU1M6ecT_iiL6cvbWfN1akrIN-UG1ik7OZwOwYfEtloh9ayjwvi4Q"
          />
          <p className="text-[10px] uppercase leading-tight tracking-[0.08em] text-(--on-surface-variant)">
            Exhibit A: L-402
            <br />
            Crime Scene Perimeter
          </p>
        </div>

        <div className="absolute right-6 top-8 hidden w-64 rotate-[5deg] border-l-4 border-(--deception-red) bg-[#fdfaf1] p-4 opacity-90 shadow-xl xl:block">
          <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-[0.12em] text-slate-900">
            <span>Incident Report</span>
            <AlertTriangle className="h-3.5 w-3.5" />
          </div>
          <p className="mb-1 text-[10px] leading-relaxed text-slate-700">Suspects seen near Victoria Peak at 22:45 hours.</p>
          <p className="text-[10px] leading-relaxed text-slate-700">
            Murder weapon still unidentified. Traces of blue silk found at entry point.
          </p>
        </div>
      </main>

      <footer className="deception-entry-footer pointer-events-none fixed bottom-0 left-0 w-full px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-end justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse bg-(--deception-red)" />
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--deception-red-soft)">
                Secure Connection Active
              </p>
            </div>
            <p className="text-[9px] uppercase tracking-[0.08em] text-(--on-surface-variant)">
              Hong Kong Police Force Digital Evidence Unit // V 2.0.42
            </p>
          </div>

          <div className="pointer-events-auto hidden gap-8 sm:flex">
            <button className="text-xs text-(--on-surface-variant) transition-colors hover:text-(--on-surface)">How To Play</button>
            <button className="text-xs text-(--on-surface-variant) transition-colors hover:text-(--on-surface)">
              Server Status: <span className="text-(--deception-cyan)">Online</span>
            </button>
          </div>

          <div className="pointer-events-auto text-right sm:hidden">
            <button className="text-[10px] uppercase tracking-[0.08em] text-(--on-surface-variant) transition-colors hover:text-(--on-surface)">
              Server: <span className="text-(--deception-cyan)">Online</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
