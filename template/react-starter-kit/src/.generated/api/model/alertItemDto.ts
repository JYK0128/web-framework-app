import type { AlertItemDtoType } from './alertItemDtoType';

export interface AlertItemDto {
  id: string;
  type: AlertItemDtoType;
  title: string;
  content: string;
  linkUrl: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}
