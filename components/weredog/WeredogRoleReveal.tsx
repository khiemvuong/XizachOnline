"use client";

interface WeredogRoleRevealProps {
  myRole: string;
  onReady?: () => void;
}

export default function WeredogRoleReveal({ myRole, onReady }: WeredogRoleRevealProps) {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center p-6 text-center">
      <h2 className="font-gothic-heading text-2xl mb-4">Hiện Vai Trò</h2>
      <p className="font-gothic-body mb-6">Bạn là: <span className="font-bold text-red-500">{myRole}</span></p>
      {onReady && (
        <button 
          onClick={onReady}
          className="weredog-button py-2.5 px-6 rounded font-gothic-ui text-sm uppercase font-bold"
        >
          Sẵn Sàng
        </button>
      )}
    </div>
  );
}
