"use client";

import { Diamond } from "lucide-react";
import Image from "next/image";

const Pips = ({ rank, symbol }: { rank: string, symbol: string }) => {
  const S = () => <span className="leading-none text-[10px] sm:text-[16px]">{symbol}</span>;
  const SF = () => <span className="leading-none text-[10px] sm:text-[16px] rotate-180">{symbol}</span>;

  // Standard playing card pip arrangements
  switch(rank) {
    case 'A': return <div className="absolute inset-0 flex items-center justify-center text-[32px] sm:text-[48px] pb-1">{symbol}</div>;
    case '2': return <div className="absolute inset-0 flex flex-col items-center justify-between"><S/><SF/></div>;
    case '3': return <div className="absolute inset-0 flex flex-col items-center justify-between"><S/><S/><SF/></div>;
    case '4': return <div className="absolute inset-0 flex justify-between"><div className="flex flex-col justify-between"><S/><SF/></div><div className="flex flex-col justify-between"><S/><SF/></div></div>;
    case '5': return <div className="absolute inset-0 flex justify-between"><div className="flex flex-col justify-between"><S/><SF/></div><div className="absolute inset-0 flex items-center justify-center"><S/></div><div className="flex flex-col justify-between"><S/><SF/></div></div>;
    case '6': return <div className="absolute inset-0 flex justify-between"><div className="flex flex-col justify-between"><S/><S/><SF/></div><div className="flex flex-col justify-between"><S/><S/><SF/></div></div>;
    case '7': return <div className="absolute inset-0 flex justify-between"><div className="flex flex-col justify-between"><S/><S/><SF/></div><div className="absolute inset-0 flex flex-col items-center justify-start pt-[30%]"><S/></div><div className="flex flex-col justify-between"><S/><S/><SF/></div></div>;
    case '8': return <div className="absolute inset-0 flex justify-between"><div className="flex flex-col justify-between"><S/><S/><SF/></div><div className="absolute inset-0 flex flex-col items-center justify-between py-[30%]"><S/><SF/></div><div className="flex flex-col justify-between"><S/><S/><SF/></div></div>;
    case '9': return <div className="absolute inset-0 flex justify-between"><div className="flex flex-col justify-between"><S/><S/><SF/><SF/></div><div className="absolute inset-0 flex items-center justify-center"><S/></div><div className="flex flex-col justify-between"><S/><S/><SF/><SF/></div></div>;
    case '10': return <div className="absolute inset-0 flex justify-between"><div className="flex flex-col justify-between"><S/><S/><SF/><SF/></div><div className="absolute inset-0 flex flex-col items-center justify-between py-[22%]"><S/><SF/></div><div className="flex flex-col justify-between"><S/><S/><SF/><SF/></div></div>;
    default: return <div className="absolute inset-0 flex items-center justify-center text-[24px] sm:text-[36px]">{symbol}</div>;
  }
};

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

  const isFaceCard = ['J', 'Q', 'K'].includes(rank);
  const getFaceImage = (r: string) => {
    switch(r) {
      case 'J': return '/faces/jack.png';
      case 'Q': return '/faces/queen.png';
      case 'K': return '/faces/king.png';
      default: return '';
    }
  };

  return (
    <div 
      className={`relative w-10 h-14 sm:w-16 sm:h-24 bg-white rounded-lg sm:rounded-[10px] border border-slate-300 ${colorClass} cursor-default transition-all duration-300 transform hover:-translate-y-2 hover:-rotate-2 hover:z-50 shadow-lg overflow-hidden select-none`}
      style={{
        boxShadow: isRed 
          ? "0 0 15px rgba(225, 29, 72, 0.5), 0 0 30px rgba(225, 29, 72, 0.3), 0 0 45px rgba(225, 29, 72, 0.15), 0 8px 20px rgba(0, 0, 0, 0.2)"
          : "0 0 15px rgba(51, 65, 85, 0.5), 0 0 30px rgba(51, 65, 85, 0.3), 0 0 45px rgba(51, 65, 85, 0.15), 0 8px 20px rgba(0, 0, 0, 0.2)"
      }}
    >
      {/* Top Left Label */}
      <div className="absolute top-[3px] left-[4px] sm:top-1 sm:left-[6px] flex flex-col items-center leading-none">
        <span className="text-[11px] sm:text-[16px] font-normal tracking-tight">{rank}</span>
        <span className="text-[8px] sm:text-[11px] leading-none mt-px">{getSuitSymbol(suit)}</span>
      </div>

      {/* Center Play Area */}
      <div className="absolute top-[14px] bottom-[14px] left-[10px] right-[10px] sm:top-[20px] sm:bottom-[20px] sm:left-[14px] sm:right-[14px] flex items-center justify-center pointer-events-none">
        {isFaceCard ? (
          <Image src={getFaceImage(rank)} alt={rank} fill sizes="(max-width: 640px) 40px, 64px" className="object-cover opacity-95 select-none rounded-[4px]" />
        ) : (
          <Pips rank={rank} symbol={getSuitSymbol(suit)} />
        )}
      </div>

      {/* Bottom Right Label */}
      <div className="absolute bottom-[3px] right-[4px] sm:bottom-1 sm:right-[6px] flex flex-col items-center leading-none rotate-180">
        <span className="text-[11px] sm:text-[16px] font-normal tracking-tight">{rank}</span>
        <span className="text-[8px] sm:text-[11px] leading-none mt-px">{getSuitSymbol(suit)}</span>
      </div>
    </div>
  );
}
