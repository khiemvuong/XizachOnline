import type { Socket } from "socket.io-client";

export function emitExplicitLeave(socket: Socket | null, onComplete: () => void) {
  if (!socket?.connected) {
    onComplete();
    return;
  }

  let completed = false;
  const finish = () => {
    if (completed) return;
    completed = true;
    window.clearTimeout(fallbackTimer);
    onComplete();
  };
  const fallbackTimer = window.setTimeout(finish, 700);
  socket.emit("explicitLeave", finish);
}

