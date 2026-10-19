import { useSocket } from '@pkg/web-core/hooks';
import { useRef } from 'react';
import { io } from 'socket.io-client';

const openSupportRooms = new Set<string>();

export function openSupportChat(roomId: string): void {
  openSupportRooms.add(roomId);
}

export function closeSupportChat(roomId: string): void {
  openSupportRooms.delete(roomId);
}

export function isSupportChatOpen(roomId: string): boolean {
  return openSupportRooms.has(roomId);
}

function joinSupportRoom(socket: ReturnType<typeof io>, roomId: string, onJoined: () => void): void {
  socket.emit('support.join', { roomId }, (joinedRoomId: string | null) => {
    if (joinedRoomId) onJoined();
  });
}

export function useSupportSocket(roomId: string | null, enabled: boolean, onEvent: (event: string) => void): void {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useSocket({
    enabled: enabled && roomId !== null,
    connectionKey: roomId,
    createSocket: () => io('/support', { path: '/api/v1/socket.io', withCredentials: true, transports: ['websocket'], autoConnect: false }),
    setupSocket: (socket) => {
      if (!roomId) return;
      openSupportChat(roomId);
      socket.on('connect', () => joinSupportRoom(socket, roomId, () => onEventRef.current('support.connected')));
      socket.on('support.message.created', () => onEventRef.current('support.message.created'));
      socket.on('support.room.status.changed', () => onEventRef.current('support.room.status.changed'));
      return () => closeSupportChat(roomId);
    },
  });
}
