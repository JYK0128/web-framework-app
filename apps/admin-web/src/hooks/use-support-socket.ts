import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

import { axios } from '#/lib/axios';

async function joinSupportRoom(socket: ReturnType<typeof io>, roomId: string, isCancelled: () => boolean, onJoined: () => void): Promise<void> {
  try {
    const { ticket } = await axios<{ ticket: string }>({ url: `/api/v1/support/rooms/${encodeURIComponent(roomId)}/socket-ticket`, method: 'POST', data: {} });
    if (isCancelled() || !socket.connected) return;
    socket.emit('support.join', { ticket }, (result: { ok: boolean }) => {
      if (result.ok) onJoined();
    });
  }
  catch {
    return;
  }
}

export function useSupportSocket(roomId: string, enabled: boolean, onEvent: (event: string) => void): void {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  useEffect(() => {
    if (!enabled) return;
    const socket = io('/support', { path: '/api/v1/socket.io', withCredentials: true, transports: ['websocket'], autoConnect: false });
    let cancelled = false;
    socket.on('connect', () => void joinSupportRoom(socket, roomId, () => cancelled, () => onEventRef.current('support.connected')));
    socket.on('support.message.created', () => onEventRef.current('support.message.created'));
    socket.on('support.room.status.changed', () => onEventRef.current('support.room.status.changed'));
    socket.connect();
    return () => {
      cancelled = true;
      socket.disconnect();
    };
  }, [roomId, enabled]);
}
