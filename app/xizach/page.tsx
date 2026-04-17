"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

function generateRoomId(): string {
  const value = new Uint16Array(1);
  window.crypto.getRandomValues(value);
  return (1000 + (value[0] % 9000)).toString();
}

export default function XizachHome() {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      router.push(`/room/${roomId.trim()}`);
    }
  };

  const handleCreate = () => {
    const newRoomId = generateRoomId();
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
            <span className="shrink-0 mx-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Hoặc</span>
            <div className="grow border-t border-slate-600"></div>
          </div>

          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Nhập Mã Phòng (VD: 1234)"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="p-4 rounded-xl border focus:outline-none focus:ring-2 text-xl font-bold text-center tracking-widest placeholder:tracking-normal placeholder:font-normal"
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
        </div>
      </div>
    </div>
  );
}
