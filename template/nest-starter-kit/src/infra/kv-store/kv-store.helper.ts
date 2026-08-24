/**
 * 백엔드 전역 Key-Value Store Key 중앙 빌더 (SSOT)
 */
export const KvStoreKey = {
  /**
   * 1:1 문의 도메인 KV 키
   */
  inquiry: {
    /** 미답변 알림 중복 발송 방지 쿨다운 락 키 */
    unansweredAlertCooldown: (inquiryId: string) => `inquiry:unanswered-alert:${inquiryId}`,
  },
} as const;
