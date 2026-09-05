export type AlertNotificationLevel = 'info' | 'warn' | 'error';

export interface AlertField {
  label: string
  value: string
}

export interface AlertMessage {
  /** 얼럿 헤더 제목 */
  title: string
  /** 얼럿 심각도 수준 ('info' | 'warn' | 'error', 기본값: 'info') */
  level?: AlertNotificationLevel
  /** 기본 텍스트 메시지 */
  text?: string
  /** 1열(전체 너비)로 출력될 섹션 목록 */
  sections?: AlertField[]
  /** 2열(그리드)로 출력될 필드 목록 */
  fields?: AlertField[]
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

export interface AlertSendResult {
  success: boolean
  messageId?: string
  error?: string
}

export type AlertAdapterResult = AlertSendResult;

export interface IAlertAdapter {
  readonly providerName: string
  send(message: AlertMessage): Promise<AlertSendResult>
}

export const ALERT_ADAPTER = Symbol('ALERT_ADAPTER');
export const ALERT_MODULE_OPTIONS = Symbol('ALERT_MODULE_OPTIONS');

export interface SlackAlertConfig {
  webhookUrl: string
}

export interface DiscordAlertConfig {
  webhookUrl: string
}

export interface ChannelTalkAlertConfig {
  webhookUrl: string
}

export interface AlertModuleOptions {
  slack?: SlackAlertConfig
  discord?: DiscordAlertConfig
  channelTalk?: ChannelTalkAlertConfig
}
