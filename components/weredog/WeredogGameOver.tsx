"use client";

interface WeredogGameOverProps {
  winner: "Villager" | "Wolf" | "Cupid" | string;
  onRestart?: () => void;
}

export default function WeredogGameOver({ winner, onRestart }: WeredogGameOverProps) {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center p-6 text-center">
      <h2 className="font-gothic-heading text-3xl text-cyan-400 mb-4">Kết Thúc Trò Chơi</h2>
      <p className="font-gothic-body mb-6">
        Phe chiến thắng:{" "}
        <strong className="text-white">
          {winner === "Villager" ? "Dân Làng" : winner === "Wolf" ? "Chó Sói" : "Tình Nhân (Cupid)"}
        </strong>
      </p>
      {onRestart && (
        <button 
          onClick={onRestart}
          className="weredog-button py-2.5 px-6 rounded font-gothic-ui text-sm uppercase font-bold"
        >
          Chơi Lại
        </button>
      )}
    </div>
  );
}
