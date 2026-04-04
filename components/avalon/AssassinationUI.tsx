"use client";
import { AvalonRoom, AvalonPlayer } from "@/server/game/AvalonTypes";
import { Socket } from "socket.io-client";
export default function AssassinationUI({
  gameState,
  me,
  socket,
}: {
  gameState: AvalonRoom;
  me: AvalonPlayer;
  socket: Socket | null;
}) {
  const isAssassin = me.role === "Assassin";
  const goodPlayers = gameState.players.filter(
    (p: AvalonPlayer) => p.team !== "Evil" && p.status === "connected",
  );
  return (
    <div className="absolute inset-0 z-50 flex flex-col p-4 bg-surface-dim-avalon/90 backdrop-blur-md animate-in fade-in duration-500 overflow-y-auto">
      {" "}
      <div className="flex flex-col items-center justify-center min-h-full py-8 m-auto w-full">
        {" "}
        <div className="text-center mb-8">
          {" "}
          <h2 className="text-4xl font-serif text-[#e46962] uppercase st mb-2 avalon-glow-red inline-block px-4 py-1 border border-[#e46962] rounded-sm">
            {" "}
            Ám Sát{" "}
          </h2>{" "}
          <p className="text-primary-avalon text-lg font-sans max-w-md mx-auto">
            {" "}
            {isAssassin
              ? "Nhiệm vụ đã thành công, nhưng cơ hội cuối cùng cho phe Ác. Hãy tìm ra Merlin và tiêu diệt hắn!"
              : "Cái ác đang chùn bước. Assassin đang tìm kiếm Merlin..."}{" "}
          </p>{" "}
        </div>{" "}
        {isAssassin && (
          <div className="flex flex-wrap gap-4 justify-center max-w-4xl">
            {" "}
            {goodPlayers.map((player: AvalonPlayer) => (
              <button
                key={player.userId}
                className="w-32 p-4 avalon-glass border-2 flex flex-col items-center justify-center transition-transform hover:scale-105 active:scale-95 group"
                style={{
                  borderColor: "var(--outline-variant)",
                  borderRadius: "4px",
                }}
                onClick={() => socket?.emit("assassinate", player.userId)}
              >
                {" "}
                <div className="w-16 h-16 rounded-full border-2 border-(--outline-variant) flex items-center justify-center bg-surface-dim-avalon mb-4 group-hover:border-[#e46962] transition-colors shadow-lg">
                  {" "}
                  <span className="text-xl font-bold group-hover:text-[#e46962]">
                    {player.name.charAt(0).toUpperCase()}
                  </span>{" "}
                </div>{" "}
                <span className="text-(--on-surface) font-sans text-sm font-bold truncate w-full text-center group-hover:text-[#e46962]">
                  {" "}
                  {player.name}{" "}
                </span>{" "}
              </button>
            ))}{" "}
          </div>
        )}{" "}
      </div>{" "}
    </div>
  );
}
