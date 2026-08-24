/**
 * 백엔드 전역 Redis Key 및 Pub/Sub Topic 중앙 빌더 (SSOT)
 */
export const RedisKey = {
  /**
   * 1:1 문의 도메인 Redis 키/토픽
   */
  inquiry: {
    /** 미답변 알림 중복 발송 방지 쿨다운 락 키 */
    unansweredAlertCooldown: (inquiryId: string) => `inquiry:unanswered-alert:${inquiryId}`,
  },

  /**
   * Pub/Sub 브로드캐스트 및 이벤트 채널 토픽
   */
  topic: {
    /** 도메인 CQRS 이벤트 브로드캐스트 토픽 */
    domainEvent: (eventName: string) => `events:domain:${eventName}`,
    /** Socket.IO 분산 룸 브로드캐스트 토픽 */
    socketRoom: (room: string) => `socket:room:${room}`,
  },
} as const;
