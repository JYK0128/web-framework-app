import { useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';

export type UseSocketOptions = {
  enabled: boolean
  connectionKey?: string | null
  createSocket: () => Socket
  setupSocket?: (socket: Socket) => (() => void) | void
};

export function useSocket({ enabled, connectionKey, createSocket, setupSocket }: UseSocketOptions): void {
  const createSocketRef = useRef(createSocket);
  const setupSocketRef = useRef(setupSocket);
  createSocketRef.current = createSocket;
  setupSocketRef.current = setupSocket;

  useEffect(() => {
    if (!enabled) return;

    const socket = createSocketRef.current();
    const cleanup = setupSocketRef.current?.(socket);
    socket.connect();

    return () => {
      cleanup?.();
      socket.disconnect();
    };
  }, [enabled, connectionKey]);
}
