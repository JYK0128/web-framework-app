export const ALERT_MESSAGES = {
  NOTICE_CREATED_TITLE: '📢 새 공지사항',
  INQUIRY_REPLY_TITLE: '1:1 문의 답변 등록',
  INQUIRY_REPLY_CONTENT: (title: string) => `'${title}' 문의에 운영자의 답변이 등록되었습니다.`,
  INQUIRY_MESSAGE_TITLE: '1:1 문의 새 메시지',
  INQUIRY_MESSAGE_CONTENT: (title: string) => `'${title}' 문의에 새로운 고객 메시지가 도착했습니다.`,
} as const;

export const SLACK_ALERT_TEMPLATES = {
  INQUIRY_UNANSWERED: {
    TITLE: '미응답 문의 알림',
    ACTION_TEXT: '👉 문의 확인 및 답변하러 가기',
    FOOTER: (minutes: number) => `사용자의 마지막 메시지 이후 ${minutes}분이 경과했습니다. 빠른 답변을 부탁드립니다.`,
    LABELS: {
      TITLE: '문의 제목',
      CONTENT: '문의 내용',
      CATEGORY: '카테고리',
      ASSIGNEE: '담당자',
      RECEIVED_TIME: '접수 시간',
      ELAPSED_TIME: '미응답 시간',
      UNASSIGNED: '미지정',
    },
  },
  INQUIRY_CREATED: {
    TITLE: '새 1:1 문의 접수',
    ACTION_TEXT: '👉 문의 확인 및 답변하러 가기',
    FOOTER: '새로운 1:1 문의가 등록되었습니다.',
    LABELS: {
      TITLE: '문의 제목',
      CONTENT: '문의 내용',
      CATEGORY: '카테고리',
      AUTHOR: '작성자',
      UNKNOWN_AUTHOR: '알 수 없음',
    },
  },
} as const;
