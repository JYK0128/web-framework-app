import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

import { closeSupportChat, openSupportChat } from '#/lib/support-chat-state';

function joinSupportRoom(socket: ReturnType<typeof io>, roomId: string, onJoined: () => void): void {
  socket.emit('support.join', { roomId }, (joinedRoomId: string | null) => {
    if (joinedRoomId) onJoined();
  });
}

export function useSupportSocket(roomId: string | null, enabled: boolean, onEvent: (event: string) => void): void {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  useEffect(() => {
    if (!enabled || !roomId) return;
    openSupportChat(roomId);
    const socket = io('/support', { path: '/api/v1/socket.io', withCredentials: true, transports: ['websocket'], autoConnect: false });
    socket.on('connect', () => joinSupportRoom(socket, roomId, () => onEventRef.current('support.connected')));
    socket.on('support.message.created', () => onEventRef.current('support.message.created'));
    socket.on('support.room.status.changed', () => onEventRef.current('support.room.status.changed'));
    socket.connect();
    return () => {
      socket.disconnect();
      closeSupportChat(roomId);
    };
  }, [roomId, enabled]);
}
