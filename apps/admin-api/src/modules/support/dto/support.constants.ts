export const SupportRoomStatus = { OPEN: 'open', IN_PROGRESS: 'in_progress', CLOSED: 'closed' } as const;

export type SupportRoomStatus = (typeof SupportRoomStatus)[keyof typeof SupportRoomStatus];

export const SupportMessageSenderType = { USER: 'user', AGENT: 'agent', SYSTEM: 'system' } as const;

export type SupportMessageSenderType = (typeof SupportMessageSenderType)[keyof typeof SupportMessageSenderType];
