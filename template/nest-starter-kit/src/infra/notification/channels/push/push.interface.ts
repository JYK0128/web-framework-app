import type { INotificationAdapter, NotificationAdapterResult } from '#/infra/notification/notification.interface';

export interface PushMessage {
  /** 수신자 기기 토큰 (FCM Registration Token) */
  token: string
  /** 푸시 알림 제목 */
  title: string
  /** 푸시 알림 본문 */
  body: string
  /** 추가 커스텀 데이터 페이로드 */
  data?: Record<string, string>
  /** 이미지 URL */
  imageUrl?: string
}

export type PushAdapterResult = NotificationAdapterResult;

export interface IPushAdapter extends INotificationAdapter<PushMessage> {}

export const PUSH_ADAPTER = Symbol('PUSH_ADAPTER');
