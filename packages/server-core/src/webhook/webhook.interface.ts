export type WebhookNotificationLevel = 'info' | 'warn' | 'error';

export interface WebhookField {
  label: string
  value: string
}

export interface WebhookMessage {
  type: 'SLACK' | 'DISCORD' | 'CHANNEL_TALK' | 'TEAMS'
  webhookUrl: string
  /** 웹훅 메시지 제목 */
  title: string
  /** 메시지 심각도 수준 ('info' | 'warn' | 'error', 기본값: 'info') */
  level?: WebhookNotificationLevel
  /** 기본 텍스트 메시지 */
  text?: string
  /** 1열(전체 너비)로 출력될 섹션 목록 */
  sections?: WebhookField[]
  /** 2열(그리드)로 출력될 필드 목록 */
  fields?: WebhookField[]
  /** 바로가기 링크 버튼/텍스트 */
  action?: {
    text: string
    url: string
  }
  /** 하단 부가 설명 푸터 */
  footer?: string
}

export interface IWebhookAdapter {
  readonly providerName: string
  send(message: WebhookMessage): Promise<void>
}

export const WEBHOOK_ADAPTER = Symbol('WEBHOOK_ADAPTER');
