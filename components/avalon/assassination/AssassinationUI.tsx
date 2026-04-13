"use client";

import { AvalonRoom, AvalonPlayer } from "@/server/game/AvalonTypes";
import { Socket } from "socket.io-client";
import { AssassinView, EvilAdvisoryView, GoodWatchView } from ".";

export default function AssassinationUI({
  gameState,
  me,
  socket,
}: {
  gameState: AvalonRoom;
  me: AvalonPlayer;
  socket: Socket | null;
}) {
  if (me.role === "Assassin") {
    return <AssassinView gameState={gameState} me={me} socket={socket} />;
  }

  if (me.team === "Evil" && !me.isSpectator) {
    return <EvilAdvisoryView gameState={gameState} me={me} socket={socket} />;
  }

  return <GoodWatchView gameState={gameState} />;
}
