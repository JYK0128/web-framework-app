import type { Socket } from 'socket.io-client';

import type { InquiryMessageItemDto } from '#/.generated/api/model';
import { SOCKET_ACK_TIMEOUT_MS } from '#/configs/realtime.config';

export function appendStreamMessage(
  previous: { key: string, items: InquiryMessageItemDto[] },
  streamKey: string,
  message: InquiryMessageItemDto,
): { key: string, items: InquiryMessageItemDto[] } {
  const previousItems = previous.key === streamKey ? previous.items : [];
  return previousItems.some((item) => item.id === message.id)
    ? previous
    : { key: streamKey, items: [...previousItems, message] };
}

export function joinInquiryRoom(
  socket: Socket,
  inquiryId: string,
  isAdmin: boolean,
  onResult: (success: boolean) => void,
) {
  socket.timeout(SOCKET_ACK_TIMEOUT_MS).emit('join-inquiry', { inquiryId, admin: isAdmin }, (error: Error | null) => {
    onResult(!error);
  });
}

export function emitSocketMessage(socket: Socket, content: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    socket.timeout(SOCKET_ACK_TIMEOUT_MS).emit('send-message', { content }, (error: Error | null) => {
      if (error) reject(error);
      else resolve();
    });
  });
}
