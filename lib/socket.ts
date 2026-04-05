import { io, Socket } from 'socket.io-client';

let socket: Socket | undefined;

export const getSocket = () => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "", {
      autoConnect: false // We'll connect manually in the component
    });
  }
  return socket;
};
