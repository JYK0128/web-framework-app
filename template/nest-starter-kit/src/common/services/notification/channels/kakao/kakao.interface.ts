import type { INotificationProvider, NotificationProviderResult } from '#/common/services/notification/notification.interface';

export interface KakaoMessage {
  recipientPhone: string
  templateCode?: string
  templateArgs?: Record<string, string | number>
  message: string
  title?: string
  buttonUrl?: string
}

export type KakaoProviderResult = NotificationProviderResult;

export interface IKakaoProvider extends INotificationProvider<KakaoMessage> {}

export const KAKAO_PROVIDER = Symbol('KAKAO_PROVIDER');
