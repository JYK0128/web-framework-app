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
