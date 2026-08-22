import type { INotificationProvider, NotificationProviderResult } from '#/common/services/notification/notification.interface';

export type MessengerNotificationLevel = 'info' | 'warn' | 'error';

export interface MessengerField {
  label: string
  value: string
}

export interface MessengerMessage {
  /** 알림 헤더 제목 */
  title: string
  /** 알림 수준 ('info' | 'warn' | 'error', 기본값: 'info') */
  level?: MessengerNotificationLevel
  /** 기본 텍스트 메시지 */
  text?: string
  /** 1열(전체 너비)로 출력될 섹션 목록 */
  sections?: MessengerField[]
  /** 2열(그리드)로 출력될 필드 목록 */
  fields?: MessengerField[]
  /** 바로가기 링크 버튼/텍스트 */
  action?: {
    text: string
    url: string
  }
  /** 하단 부가 설명 푸터 */
  footer?: string
  /** 개별 웹훅 URL (미지정 시 환경설정 기본값 사용) */
  webhookUrl?: string
}

export type MessengerProviderResult = NotificationProviderResult;

export interface IMessengerProvider extends INotificationProvider<MessengerMessage> {}

export const MESSENGER_PROVIDER = Symbol('MESSENGER_PROVIDER');
