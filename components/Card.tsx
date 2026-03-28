"use client";

import { Diamond } from "lucide-react";



export default function Card({ suit, rank, hidden = false }: { suit: string, rank: string, hidden?: boolean }) {
  if (hidden) {
    return (
      <div 
        className="w-10 h-14 sm:w-16 sm:h-24 rounded-lg sm:rounded-xl border flex items-center justify-center transform -rotate-3 transition-all duration-300"
        style={{
          background: "linear-gradient(140deg, var(--table-felt), var(--table-felt-inner))",
          borderColor: "rgba(255, 235, 190, 0.35)",
          boxShadow: "0 0 20px rgba(34, 197, 94, 0.6), 0 0 40px rgba(34, 197, 94, 0.3), 0 0 60px rgba(34, 197, 94, 0.2), inset 0 0 15px rgba(255, 255, 255, 0.1)",
        }}
      >
        <div className="w-6 h-10 sm:w-12 sm:h-20 border rounded flex items-center justify-center bg-white/10">
          <Diamond className="h-3 w-3 sm:h-5 sm:w-5 text-(--table-ring)/90" />
        </div>
      </div>
    );
  }

  const isRed = suit === 'hearts' || suit === 'diamonds';
  const colorClass = isRed ? 'text-rose-600' : 'text-slate-800';
  
  const getSuitSymbol = (s: string) => {
    switch(s) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return s;
    }
  };

  return (
    <div 
      className={`w-10 h-14 sm:w-16 sm:h-24 bg-white rounded-lg sm:rounded-xl border border-slate-300 flex flex-col justify-between p-1 sm:p-2 font-bold ${colorClass} cursor-default transition-all duration-300 transform hover:-translate-y-2 hover:-rotate-2 hover:z-50 shadow-lg`}
      style={{
        boxShadow: isRed 
          ? "0 0 15px rgba(225, 29, 72, 0.5), 0 0 30px rgba(225, 29, 72, 0.3), 0 0 45px rgba(225, 29, 72, 0.15), 0 8px 20px rgba(0, 0, 0, 0.2)"
          : "0 0 15px rgba(51, 65, 85, 0.5), 0 0 30px rgba(51, 65, 85, 0.3), 0 0 45px rgba(51, 65, 85, 0.15), 0 8px 20px rgba(0, 0, 0, 0.2)"
      }}
    >
      <div className="text-[10px] sm:text-lg leading-none font-bold">{rank}</div>
      <div className="text-lg sm:text-3xl text-center flex-1 flex items-center justify-center opacity-90 drop-shadow-sm">{getSuitSymbol(suit)}</div>
      <div className="text-[10px] sm:text-lg leading-none text-right rotate-180 font-bold">{rank}</div>
    </div>
  );
}
