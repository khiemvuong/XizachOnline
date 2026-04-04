"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AvalonHome() {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      router.push(`/avalon/room/${roomId}`);
    }
  };

  const handleCreate = () => {
    // Generate a random 5-character room code matching typical board games
    const newRoomId = Math.random().toString(36).substring(2, 7).toUpperCase();
    router.push(`/avalon/room/${newRoomId}`);
  };

  return (
    <div className="avalon-theme min-h-screen flex items-center justify-center p-4">
      <div 
        className="avalon-glass max-w-md w-full p-8 shadow-2xl text-center" 
        style={{ borderRadius: '4px' }}
      >
        <h1 className="text-4xl font-serif mb-2 text-primary-avalon tracking-widest uppercase">The Round Table</h1>
        <p className="mb-8 text-[#768497] font-sans">Sự thật và dối trá. Bạn thuộc phe nào?</p>
        
        <div className="flex flex-col gap-6">
          <button 
            onClick={handleCreate}
            className="w-full p-4 text-surface-dim-avalon font-bold transition-transform active:scale-95 text-lg shadow-lg uppercase tracking-wider"
            style={{ backgroundColor: 'var(--primary)', borderRadius: '2px' }}
          >
            Tạo Phòng Kháng Chiến
          </button>

          <div className="relative flex py-2 items-center">
            <div className="grow border-t" style={{ borderColor: 'var(--outline-variant)' }}></div>
            <span className="shrink-0 mx-4 text-sm font-semibold uppercase text-[#768497]">Hoặc</span>
            <div className="grow border-t" style={{ borderColor: 'var(--outline-variant)' }}></div>
          </div>

          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Nhập Mã Phòng (VD: AVAL1)"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              className="p-4 border focus:outline-none focus:ring-1 text-xl font-bold text-center uppercase tracking-widest placeholder:tracking-normal placeholder:font-normal bg-transparent"
              style={{ borderColor: 'var(--outline-variant)', color: 'var(--on-surface)', borderRadius: '2px' }}
              required
            />
            <button 
              type="submit" 
              className="w-full p-4 text-secondary-avalon font-bold transition-transform active:scale-95 text-lg shadow-lg uppercase tracking-wider border"
              style={{ backgroundColor: 'transparent', borderColor: 'var(--outline-variant)', borderRadius: '2px' }}
            >
              Gia Nhập Lực Lượng
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
