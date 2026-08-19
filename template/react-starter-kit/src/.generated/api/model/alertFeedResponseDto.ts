import type { AlertItemDto } from './alertItemDto';

export interface AlertFeedResponseDto {
  items: AlertItemDto[];
  total: number;
  unreadCount: number;
}
