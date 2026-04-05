"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      router.push(`/room/${roomId}`);
    }
  };

  const handleCreate = () => {
    // Generate a random 6-character room code
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    router.push(`/room/${newRoomId}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 room-gradient">
      <div className="max-w-md w-full p-8 rounded-2xl shadow-2xl border text-center" style={{ backgroundColor: 'var(--panel-surface)', borderColor: 'var(--panel-border)' }}>
        <h1 className="text-4xl font-black mb-2" style={{ color: 'var(--accent-primary)' }}>Xì Dách Online</h1>
        <p className="mb-8" style={{ color: 'var(--text-muted)' }}>Đánh bài xì dách trực tuyến có voice chat</p>
        
        <div className="flex flex-col gap-6">
          <button 
            onClick={handleCreate}
            className="w-full p-4 text-white font-bold rounded-xl transition-transform active:scale-95 text-lg shadow-lg"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            ➕ Tạo Phòng Mới
          </button>

          <div className="relative flex py-2 items-center">
            <div className="grow border-t border-slate-600"></div>
            <span className="shrink-0 mx-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Hoac</span>
            <div className="grow border-t border-slate-600"></div>
          </div>

          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Nhập Mã Phòng (VD: X1A2B)"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              className="p-4 rounded-xl border focus:outline-none focus:ring-2 text-xl font-bold text-center uppercase tracking-widest placeholder:tracking-normal placeholder:font-normal"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--panel-border)', color: 'var(--text-primary)' }}
              required
            />
            <button 
              type="submit" 
              className="w-full p-4 text-white font-bold rounded-xl transition-transform active:scale-95 text-lg shadow-lg"
              style={{ backgroundColor: 'var(--accent-secondary)', color: '#1f1a10' }}
            >
              🎯 Vào Phòng
            </button>
          </form>

          <div className="border-t border-slate-600/50 pt-6 mt-2">
            <button 
              onClick={() => router.push('/avalon')}
              className="w-full p-4 font-bold rounded-xl transition-transform hover:scale-[1.02] active:scale-95 text-base shadow-md border"
              style={{ 
                backgroundColor: 'rgba(99, 102, 241, 0.05)', 
                borderColor: 'rgba(99, 102, 241, 0.3)',
                color: '#a5b4fc',
              }}
            >
              🌌 Vùng Đất Avalon (Trải Nghiệm Mới)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
