"use client";

interface WeredogDayStartProps {
  onStartVoting?: () => void;
}

export default function WeredogDayStart({ onStartVoting }: WeredogDayStartProps) {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center p-6 text-center">
      <h2 className="font-gothic-heading text-2xl text-amber-400 mb-4">Bình Minh Lên</h2>
      <p className="font-gothic-body mb-6">Kết quả đêm qua...</p>
      {onStartVoting && (
        <button 
          onClick={onStartVoting}
          className="weredog-button py-2.5 px-6 rounded font-gothic-ui text-sm uppercase font-bold"
        >
          Bỏ Phiếu
        </button>
      )}
    </div>
  );
}
