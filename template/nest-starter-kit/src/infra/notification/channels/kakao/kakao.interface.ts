import type { INotificationAdapter, NotificationAdapterResult } from '#/infra/notification/notification.interface';

export interface KakaoMessage {
  recipientPhone: string
  templateCode?: string
  templateArgs?: Record<string, string | number>
  message: string
  title?: string
  buttonUrl?: string
}

export type KakaoAdapterResult = NotificationAdapterResult;

export interface IKakaoAdapter extends INotificationAdapter<KakaoMessage> {}

export const KAKAO_ADAPTER = Symbol('KAKAO_ADAPTER');
