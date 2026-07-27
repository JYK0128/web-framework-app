export type User = {
  id: string
  name: string
  avatar: string
  role: string
  status: 'online' | 'away' | 'offline'
};

export type ChatMessage = {
  id: string
  channelId: string
  sender: User
  content: string
  timestamp: string
  reactions?: { emoji: string, count: number, reacted: boolean }[]
  isAi?: boolean
};

export type Channel = {
  id: string
  name: string
  description: string
  unreadCount: number
  isPrivate?: boolean
};

export const CURRENT_USER: User = {
  id: 'user-me',
  name: '김개발 (Me)',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  role: 'Frontend Lead',
  status: 'online',
};

export const MOCK_USERS: User[] = [
  CURRENT_USER,
  {
    id: 'user-bot',
    name: 'Antigravity AI Assistant',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
    role: 'AI Coding Bot',
    status: 'online',
  },
  {
    id: 'user-alex',
    name: 'Alex Rivera',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    role: 'Backend Architect',
    status: 'online',
  },
  {
    id: 'user-sarah',
    name: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    role: 'DevOps Engineer',
    status: 'away',
  },
];

export const MOCK_CHANNELS: Channel[] = [
  { id: 'general', name: 'general', description: '전체 공지 및 잡담 채널', unreadCount: 0 },
  { id: 'dev-team', name: 'dev-team', description: '프론트엔드/백엔드 코딩 협업 채널', unreadCount: 3 },
  { id: 'ai-assistant', name: 'ai-assistant', description: 'AI 어시스턴트 자동응답 실시간 질의응답', unreadCount: 0 },
];

function getRandom(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 4294967296;
}

export function createInitialMessages(channelId: string): ChatMessage[] {
  const now = new Date();
  const formatTime = (minusMinutes: number) => {
    const d = new Date(now.getTime() - minusMinutes * 60 * 1000);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  if (channelId === 'ai-assistant') {
    return [
      {
        id: 'msg-1',
        channelId: 'ai-assistant',
        sender: MOCK_USERS[1],
        content: '안녕하세요! 무었이든 물어보세요. 코드 리팩토링 및 쿼리 캐싱 구현을 도와드립니다 🚀',
        timestamp: formatTime(15),
        isAi: true,
      },
    ];
  }

  return [
    {
      id: 'msg-101',
      channelId,
      sender: MOCK_USERS[2], // Alex
      content: '이번 TanStack Query v5 모듈화 작업 PR 올렸습니다! 리뷰 부탁드려요.',
      timestamp: formatTime(20),
      reactions: [{ emoji: '👍', count: 4, reacted: true }, { emoji: '🚀', count: 2, reacted: false }],
    },
    {
      id: 'msg-102',
      channelId,
      sender: MOCK_USERS[3], // Sarah
      content: '스테이징 환경 배포 파이프라인 무사히 통과했습니다! 🟢',
      timestamp: formatTime(12),
      reactions: [{ emoji: '🎉', count: 3, reacted: true }],
    },
    {
      id: 'msg-103',
      channelId,
      sender: CURRENT_USER,
      content: '확인했습니다! WebSocket / SSE 푸시 캐싱 구조도 아주 깔끔하네요.',
      timestamp: formatTime(5),
    },
  ];
}

const AI_RESPONSES = [
  'TanStack Query의 `queryClient.setQueryData`를 사용하면 소켓 푸시 수신 즉시 UI에 반응형으로 반영할 수 있습니다! ⚡',
  '좋은 질문입니다! 캐시 키 유효성 관리에는 `queryClient.invalidateQueries`를 활용해보세요.',
  '실시간 스트리밍에는 Cursor-based Delta Polling이나 SSE 연결을 권장합니다 🛠️',
  'React 19 훅 수명주기 표준에 맞춰 `setState` 호출 위치를 선언적으로 최적화했습니다 🎨',
];

/**
 * Simulates AI bot or teammate live response push over WebSocket
 */
export function simulateIncomingChatMessage(
  channelId: string,
  userMessageContent: string,
  onMessage: (msg: ChatMessage) => void,
): void {
  const isAiChannel = channelId === 'ai-assistant';
  const delay = Math.floor(getRandom() * 1000) + 1200;

  setTimeout(() => {
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    if (isAiChannel) {
      const responseText = AI_RESPONSES[Math.floor(getRandom() * AI_RESPONSES.length)];
      onMessage({
        id: `msg-${Date.now()}`,
        channelId,
        sender: MOCK_USERS[1], // AI Bot
        content: `[AI 답변]: "${userMessageContent.slice(0, 20)}..." 에 대한 답변입니다.\n${responseText}`,
        timestamp,
        isAi: true,
      });
    }
    else {
      onMessage({
        id: `msg-${Date.now()}`,
        channelId,
        sender: MOCK_USERS[2], // Alex
        content: '네, 피드백 반영 후 빠른 커밋 올리겠습니다! 👍',
        timestamp,
      });
    }
  }, delay);
}
