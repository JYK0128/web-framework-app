export type AlertItemDtoType = typeof AlertItemDtoType[keyof typeof AlertItemDtoType];

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const AlertItemDtoType = {
  inquiry_reply: 'inquiry_reply',
  inquiry_message: 'inquiry_message',
  notice: 'notice',
  system: 'system',
} as const;
