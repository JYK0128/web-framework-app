import { MessageChannel } from '#/entities/templates/message-channel.enum';

export interface TemplateVariableMetadata {
  key: string
  label: string
  description: string
  required: boolean
  sampleValue: string
}

export interface CatalogChannelTemplate {
  channel: MessageChannel
  defaultTitle: string | null
  defaultBody: string
  priority: number
}

export interface MessageTemplateCatalogItem {
  code: string
  name: string
  description: string
  isSystem: boolean
  variables: TemplateVariableMetadata[]
  channels: CatalogChannelTemplate[]
}

export const MESSAGE_TEMPLATE_CATALOG: MessageTemplateCatalogItem[] = [
  // 1. 이메일 인증 (AUTH_VERIFY_EMAIL)
  {
    code: 'AUTH_VERIFY_EMAIL',
    name: '이메일 인증 링크 발송',
    description: '회원가입 및 이메일 변경 시 본인 확인용 인증 링크 및 번호를 전송하는 템플릿입니다.',
    isSystem: true,
    variables: [
      {
        key: 'targetLink',
        label: '인증 완료 링크',
        description: '클릭 시 인증이 처리되는 보안 링크 URL',
        required: true,
        sampleValue: 'https://example.com/verify-email?code=123456',
      },
      {
        key: 'minutes',
        label: '유효 시간(분)',
        description: '인증 토큰의 만료 제한 시간 (분 단위)',
        required: true,
        sampleValue: '10',
      },
      {
        key: 'code',
        label: '인증 코드',
        description: '6자리 숫자 인증 코드 또는 검증 토큰',
        required: false,
        sampleValue: '123456',
      },
      {
        key: 'challengeId',
        label: '챌린지 식별자',
        description: '인증 시도 트랜잭션의 고유 식별자',
        required: false,
        sampleValue: 'ch_01JG9ABCXYZ',
      },
    ],
    channels: [
      {
        channel: MessageChannel.EMAIL,
        defaultTitle: '[{{brand.appName}}] 이메일 인증 안내',
        defaultBody: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;">
  <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin-bottom: 16px;">이메일 인증 안내</h2>
  <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
    안녕하세요. <strong>{{brand.appName}}</strong> 이메일 소유권 확인을 위한 안내 메일입니다.<br/>
    아래의 버튼을 클릭하시면 이메일 인증이 즉시 완료됩니다.
  </p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="{{targetLink}}" style="background-color: #2563eb; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block;">
      이메일 인증 완료하기
    </a>
  </div>
  <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
    * 이 인증 링크는 <strong>{{minutes}}분</strong> 동안 유효합니다.<br/>
    * 본인이 요청하지 않은 경우 이 메일을 무시하셔도 됩니다.<br/>
    * 버튼이 작동하지 않는 경우 아래 링크를 브라우저에 직접 붙여넣어 주세요:<br/>
    <a href="{{targetLink}}" style="color: #2563eb; word-break: break-all; font-size: 12px;">{{targetLink}}</a>
  </p>
</div>`,
        priority: 1,
      },
      {
        channel: MessageChannel.SMS,
        defaultTitle: null,
        defaultBody: '[{{brand.appName}}] 인증번호 [{{code}}]를 입력해 주세요. ({{minutes}}분 내 유효)',
        priority: 2,
      },
    ],
  },
  // 2. 비밀번호 재설정 (AUTH_RESET_PASSWORD)
  {
    code: 'AUTH_RESET_PASSWORD',
    name: '비밀번호 재설정 링크 발송',
    description: '비밀번호 분실 시 재설정 링크를 전송하는 템플릿입니다.',
    isSystem: true,
    variables: [
      {
        key: 'userName',
        label: '사용자 이름',
        description: '비밀번호를 재설정하는 사용자 이름',
        required: false,
        sampleValue: '홍길동',
      },
      {
        key: 'targetLink',
        label: '재설정 링크 URL',
        description: '클릭 시 비밀번호 재설정 화면으로 이동하는 보안 링크',
        required: true,
        sampleValue: 'https://example.com/reset-password?challengeId=ch_123&token=abc',
      },
      {
        key: 'minutes',
        label: '유효 시간(분)',
        description: '재설정 링크 만료 제한 시간 (분 단위)',
        required: true,
        sampleValue: '15',
      },
      {
        key: 'token',
        label: '재설정 토큰',
        description: '보안 검증 토큰',
        required: false,
        sampleValue: 'xyz789token',
      },
      {
        key: 'challengeId',
        label: '챌린지 식별자',
        description: '재설정 시도 트랜잭션의 고유 식별자',
        required: false,
        sampleValue: 'ch_01JG9ABCXYZ',
      },
    ],
    channels: [
      {
        channel: MessageChannel.EMAIL,
        defaultTitle: '[{{brand.appName}}] 비밀번호 재설정 안내',
        defaultBody: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;">
  <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin-bottom: 16px;">비밀번호 재설정 안내</h2>
  <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
    안녕하세요{{#if userName}} <strong>{{userName}}</strong>님{{/if}}.<br/>
    <strong>{{brand.appName}}</strong> 비밀번호 재설정을 위한 안내 메일입니다.<br/>
    아래의 버튼을 클릭하시면 새로운 비밀번호를 설정하실 수 있습니다.
  </p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="{{targetLink}}" style="background-color: #2563eb; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block;">
      비밀번호 재설정하기
    </a>
  </div>
  <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
    * 이 재설정 링크는 <strong>{{minutes}}분</strong> 동안 유효합니다.<br/>
    * 본인이 요청하지 않은 경우 이 메일을 무시하시거나 고객센터로 문의해 주세요.<br/>
    * 버튼이 작동하지 않는 경우 아래 링크를 브라우저에 직접 붙여넣어 주세요:<br/>
    <a href="{{targetLink}}" style="color: #2563eb; word-break: break-all; font-size: 12px;">{{targetLink}}</a>
  </p>
</div>`,
        priority: 1,
      },
      {
        channel: MessageChannel.SMS,
        defaultTitle: null,
        defaultBody: '[{{brand.appName}}] 비밀번호 재설정 링크: {{targetLink}} ({{minutes}}분 내 유효)',
        priority: 2,
      },
    ],
  },
  // 3. 새 공지사항 등록 알림 (NOTICE_CREATED)
  {
    code: 'NOTICE_CREATED',
    name: '새 공지사항 등록 알림',
    description: '새로운 공지사항이 게시되었을 때 회원에게 전송되는 옴니채널 알림 템플릿입니다.',
    isSystem: true,
    variables: [
      {
        key: 'title',
        label: '공지사항 제목',
        description: '게시된 공지사항의 제목 텍스트',
        required: true,
        sampleValue: '시스템 정기 점검 및 업데이트 안내',
      },
      {
        key: 'id',
        label: '공지사항 ID',
        description: '공지사항 게시글의 고유 ULID',
        required: false,
        sampleValue: '01JGTESTNOTICEID',
      },
      {
        key: 'linkUrl',
        label: '이동 링크 URL',
        description: '공지사항 상세 페이지 바로가기 링크',
        required: false,
        sampleValue: '/notices/01JGTESTNOTICEID',
      },
    ],
    channels: [
      {
        channel: MessageChannel.IN_APP,
        defaultTitle: '📢 새 공지사항',
        defaultBody: '{{title}}',
        priority: 1,
      },
      {
        channel: MessageChannel.EMAIL,
        defaultTitle: '[공지] {{title}}',
        defaultBody: `<p>새로운 공지사항이 등록되었습니다.</p><h3>{{title}}</h3><p><a href="{{linkUrl}}">자세히 보기</a></p>`,
        priority: 2,
      },
    ],
  },
  // 4. 1:1 문의 답변 등록 알림 (INQUIRY_REPLY)
  {
    code: 'INQUIRY_REPLY',
    name: '1:1 문의 답변 등록 고객 알림',
    description: '고객의 1:1 문의에 관리자가 답변을 남겼을 때 고객에게 전송되는 알림 템플릿입니다.',
    isSystem: true,
    variables: [
      {
        key: 'title',
        label: '문의 제목',
        description: '고객이 작성했던 문의 제목',
        required: true,
        sampleValue: '결제 취소 및 환불 절차 문의',
      },
      {
        key: 'inquiryId',
        label: '문의 ID',
        description: '해당 1:1 문의의 고유 식별자',
        required: false,
        sampleValue: '01JGTESTINQUIRYID',
      },
      {
        key: 'linkUrl',
        label: '문의 상세 링크',
        description: '고객 마이페이지 내 문의 상세 바로가기 링크',
        required: false,
        sampleValue: '/inquiries/01JGTESTINQUIRYID',
      },
    ],
    channels: [
      {
        channel: MessageChannel.IN_APP,
        defaultTitle: '1:1 문의 답변 등록',
        defaultBody: '\'{{title}}\' 문의에 운영자의 답변이 등록되었습니다.',
        priority: 1,
      },
      {
        channel: MessageChannel.ALIMTALK,
        defaultTitle: '1:1 문의 답변 안내',
        defaultBody: '[1:1 문의 답변 완료]\n안녕하세요 고객님, 접수해 주신 \'{{title}}\' 문의에 답변이 등록되었습니다.\n자세한 내용은 사이트에서 확인해 주세요.',
        priority: 2,
      },
      {
        channel: MessageChannel.SMS,
        defaultTitle: null,
        defaultBody: '[알림] \'{{title}}\' 문의에 답변이 등록되었습니다: {{linkUrl}}',
        priority: 3,
      },
    ],
  },
  // 5. 1:1 문의 사용자 새 메시지 알림 (INQUIRY_MESSAGE)
  {
    code: 'INQUIRY_MESSAGE',
    name: '1:1 문의 새 고객 메시지 관리자 알림',
    description: '고객이 추가 메시지를 보냈을 때 담당 관리자에게 전송되는 알림 템플릿입니다.',
    isSystem: true,
    variables: [
      {
        key: 'title',
        label: '문의 제목',
        description: '고객이 작성했던 문의 제목',
        required: true,
        sampleValue: '영수증 재발행 요청',
      },
      {
        key: 'inquiryId',
        label: '문의 ID',
        description: '해당 1:1 문의의 고유 식별자',
        required: false,
        sampleValue: '01JGTESTINQUIRYID',
      },
      {
        key: 'linkUrl',
        label: '관리 상세 링크',
        description: '관리자용 문의 상세 바로가기 링크',
        required: false,
        sampleValue: '/inquiries/01JGTESTINQUIRYID',
      },
    ],
    channels: [
      {
        channel: MessageChannel.IN_APP,
        defaultTitle: '1:1 문의 새 메시지',
        defaultBody: '\'{{title}}\' 문의에 새로운 고객 메시지가 도착했습니다.',
        priority: 1,
      },
      {
        channel: MessageChannel.SLACK,
        defaultTitle: '1:1 문의 고객 추가 메시지',
        defaultBody: '고객 추가 메시지가 도착했습니다.\n*문의*: {{title}}\n*바로가기*: {{linkUrl}}',
        priority: 2,
      },
    ],
  },
  // 6. 새 문의 접수 관리자 알림 (SLACK_INQUIRY_CREATED)
  {
    code: 'SLACK_INQUIRY_CREATED',
    name: '새 문의 접수 관리자 알림',
    description: '고객이 1:1 문의를 등록했을 때 사내 채널로 발송되는 알림 템플릿입니다.',
    isSystem: true,
    variables: [
      {
        key: 'title',
        label: '문의 제목',
        description: '신규 접수된 1:1 문의 제목',
        required: true,
        sampleValue: '로그인이 지속적으로 실패합니다',
      },
      {
        key: 'category',
        label: '문의 카테고리',
        description: '고객이 선택한 문의 분류 카테고리',
        required: true,
        sampleValue: '계정/로그인',
      },
      {
        key: 'author',
        label: '작성자 이름',
        description: '문의를 작성한 고객명 또는 이메일',
        required: true,
        sampleValue: '홍길동',
      },
      {
        key: 'inquiryId',
        label: '문의 ID',
        description: '해당 1:1 문의의 고유 식별자',
        required: false,
        sampleValue: '01JGTESTINQUIRYID',
      },
      {
        key: 'linkUrl',
        label: '관리 바로가기 링크',
        description: '관리자 페이지 내 해당 문의 상세 링크',
        required: false,
        sampleValue: 'https://admin.example.com/inquiries/01JGTESTINQUIRYID',
      },
    ],
    channels: [
      {
        channel: MessageChannel.SLACK,
        defaultTitle: '새 1:1 문의 접수',
        defaultBody: '새로운 1:1 문의가 등록되었습니다.\n*제목*: {{title}}\n*카테고리*: {{category}}\n*작성자*: {{author}}',
        priority: 1,
      },
      {
        channel: MessageChannel.IN_APP,
        defaultTitle: '새 1:1 문의 접수',
        defaultBody: '새로운 1:1 문의가 등록되었습니다: {{title}}',
        priority: 2,
      },
    ],
  },
  // 7. 슬랙 미응답 문의 리마인더 알림 (SLACK_INQUIRY_UNANSWERED)
  {
    code: 'SLACK_INQUIRY_UNANSWERED',
    name: '미응답 문의 리마인더 알림',
    description: '운영시간 중 문의가 10분 이상 미응답 상태일 때 발송되는 리마인더 알림 템플릿입니다.',
    isSystem: true,
    variables: [
      {
        key: 'title',
        label: '문의 제목',
        description: '미응답 상태인 문의 제목',
        required: true,
        sampleValue: '결제 취소 처리 요청',
      },
      {
        key: 'category',
        label: '문의 카테고리',
        description: '문의 분류 카테고리',
        required: true,
        sampleValue: '결제/환불',
      },
      {
        key: 'assignee',
        label: '담당 관리자',
        description: '배정된 운영자 이름 또는 미지정',
        required: false,
        sampleValue: '김운영',
      },
      {
        key: 'elapsedMinutes',
        label: '경과 시간(분)',
        description: '마지막 고객 메시지 이후 경과된 분',
        required: true,
        sampleValue: '15',
      },
      {
        key: 'inquiryId',
        label: '문의 ID',
        description: '해당 1:1 문의의 고유 식별자',
        required: false,
        sampleValue: '01JGTESTINQUIRYID',
      },
      {
        key: 'linkUrl',
        label: '관리 바로가기 링크',
        description: '관리자 페이지 내 해당 문의 상세 링크',
        required: false,
        sampleValue: 'https://admin.example.com/inquiries/01JGTESTINQUIRYID',
      },
    ],
    channels: [
      {
        channel: MessageChannel.SLACK,
        defaultTitle: '미응답 문의 알림',
        defaultBody: '사용자의 마지막 메시지 이후 {{elapsedMinutes}}분이 경과했습니다. 빠른 답변을 부탁드립니다.\n*제목*: {{title}}\n*카테고리*: {{category}}\n*담당자*: {{assignee}}',
        priority: 1,
      },
    ],
  },
];
