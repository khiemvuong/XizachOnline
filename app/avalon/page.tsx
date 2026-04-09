"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Delete, Play } from 'lucide-react';
import { io } from 'socket.io-client';

function generateRoomId(): string {
  const value = new Uint16Array(1);
  window.crypto.getRandomValues(value);
  return (1000 + (value[0] % 9000)).toString();
}

export default function AvalonHome() {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleJoin = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (roomId.trim().length === 4) {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "";
      const socketio = io(`${socketUrl}/avalon`, { reconnection: false });
      
      socketio.emit("checkRoom", roomId.trim(), (exists: boolean) => {
        socketio.disconnect();
        if (exists) {
          router.push(`/avalon/room/${roomId.trim()}`);
        } else {
          setErrorMsg("Mã phòng không tồn tại hoặc đã bị giải tán!");
        }
      });
    }
  };

  const handleCreate = () => {
    const newRoomId = generateRoomId();
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "";
    const socketio = io(`${socketUrl}/avalon`, { reconnection: false });
    
    socketio.emit("createRoom", newRoomId, (success: boolean) => {
      socketio.disconnect();
      if (success) {
        router.push(`/avalon/room/${newRoomId}`);
      } else {
        handleCreate(); // retry if collision
      }
    });
  };

  const handleKeyPress = (num: string) => {
    if (roomId.length < 4) {
      setRoomId(prev => prev + num);
      setErrorMsg("");
    }
  };

  const handleBackspace = () => {
    setRoomId(prev => prev.slice(0, -1));
  };

  return (
    <div className="avalon-home-shell avalon-theme flex h-dvh items-center justify-center overflow-hidden p-4">
      <div 
        className="avalon-home-card avalon-glass mx-auto flex w-full max-w-md flex-col items-center justify-center gap-8 overflow-y-auto border border-(--outline-variant) p-6 text-center shadow-2xl landscape:max-w-4xl landscape:flex-row landscape:p-8 lg:max-w-5xl lg:flex-row lg:gap-16 lg:p-12"
        style={{ borderRadius: '24px' }}
      >
        
        {/* Left Section: Create Room */}
        <div className="flex w-full flex-1 flex-col items-center justify-center text-center">
          <h1 className="avalon-title-glow-primary avalon-home-title mb-2 font-serif text-4xl font-extrabold leading-tight uppercase tracking-[0.15em] text-(--primary) landscape:text-3xl lg:text-6xl">
            The Round Table
          </h1>
          <p className="avalon-home-subtitle mb-6 font-sans text-sm text-(--on-surface-variant) lg:text-lg">
            Sự thật và dối trá. Bạn thuộc phe nào?
          </p>
          
          <button 
            onClick={handleCreate}
            className="avalon-home-btn w-full max-w-70 rounded-xl bg-(--primary) p-4 font-bold uppercase tracking-wider text-surface-dim-avalon shadow-lg transition-transform hover:opacity-90 active:scale-95 lg:max-w-[320px] lg:py-5 lg:text-lg"
          >
            Tạo Hội Yến (Host)
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex w-full items-center landscape:h-48 landscape:w-auto landscape:flex-col lg:h-64 lg:w-auto lg:flex-col">
          <div className="grow border-t border-(--outline-variant) landscape:border-l landscape:border-t-0 lg:border-l lg:border-t-0"></div>
          <span className="mx-4 shrink-0 px-2 text-xs font-semibold uppercase tracking-widest text-(--on-surface-variant) landscape:mx-0 landscape:my-4 lg:mx-0 lg:my-6">Hoặc</span>
          <div className="grow border-t border-(--outline-variant) landscape:border-l landscape:border-t-0 lg:border-l lg:border-t-0"></div>
        </div>

        {/* Right Section: Join Room */}
        <div className="flex w-full flex-1 flex-col items-center justify-center px-1 lg:px-6">
          <div className="flex w-full max-w-[320px] flex-col gap-4 lg:max-w-95 lg:gap-6">
            {/* Display Code */}
            <div className="flex w-full justify-between gap-2 lg:gap-4">
              {[0, 1, 2, 3].map((index) => (
                <div 
                  key={index}
                  className={`flex aspect-4/5 flex-1 items-center justify-center rounded-xl border-2 text-3xl font-extrabold transition-colors lg:rounded-2xl lg:text-4xl ${
                    roomId[index] 
                      ? 'bg-(--primary)/10 border-(--primary) text-(--primary)' 
                      : 'border-(--outline-variant) bg-transparent text-transparent'
                  }`}
                >
                  {roomId[index] || ''}
                </div>
              ))}
            </div>

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-2 lg:gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleKeyPress(num.toString())}
                  className="flex aspect-[1.8] items-center justify-center rounded-xl border border-(--outline-variant) bg-(--surface-container) text-2xl font-bold text-(--on-surface) touch-manipulation transition-all hover:bg-(--surface-container-high) active:border-(--primary) active:bg-(--primary)/20 sm:aspect-auto sm:h-14 lg:h-16 lg:rounded-2xl"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={handleBackspace}
                className="flex items-center justify-center rounded-xl border border-(--outline-variant) bg-(--surface-container-high) text-(--error) touch-manipulation transition-all hover:brightness-110 active:border-(--error) active:bg-(--error)/20 sm:h-14 lg:h-16 lg:rounded-2xl"
              >
                <Delete className="h-6 w-6 lg:h-7 lg:w-7" />
              </button>
              <button
                onClick={() => handleKeyPress('0')}
                className="flex items-center justify-center rounded-xl border border-(--outline-variant) bg-(--surface-container) text-2xl font-bold text-(--on-surface) touch-manipulation transition-all hover:bg-(--surface-container-high) active:border-(--primary) active:bg-(--primary)/20 sm:h-14 lg:h-16 lg:rounded-2xl"
              >
                0
              </button>
              <button
                onClick={() => handleJoin()}
                disabled={roomId.length !== 4}
                className={`flex items-center justify-center rounded-xl touch-manipulation transition-all sm:h-14 lg:h-16 lg:rounded-2xl ${
                  roomId.length === 4 
                    ? 'shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)] bg-(--primary) text-surface-dim-avalon hover:brightness-110 active:scale-95' 
                    : 'cursor-not-allowed border border-(--outline-variant) bg-(--surface-container-high) text-(--on-surface)/30'
                }`}
              >
                <Play className="h-6 w-6 translate-x-0.5 fill-current lg:h-8 lg:w-8" />
              </button>
            </div>
            {/* Error Message */}
            {errorMsg && (
              <div className="mt-2 text-center text-sm font-medium text-(--error)">
                {errorMsg}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
