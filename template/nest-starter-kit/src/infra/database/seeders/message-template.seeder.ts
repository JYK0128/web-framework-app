import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { MessageChannel, MessageTemplate } from '#/entities/templates/message-template.entity';

interface TemplateSeedItem {
  code: string
  channel: MessageChannel
  name: string
  title: string | null
  body: string
  variables: string[]
  description: string
}

const TEMPLATE_SEEDS: TemplateSeedItem[] = [
  // 1. 이메일 인증 (EMAIL)
  {
    code: 'AUTH_VERIFY_EMAIL',
    channel: MessageChannel.EMAIL,
    name: '이메일 인증 링크 발송',
    title: '[{{appName}}] 이메일 인증 안내',
    body: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;">
  <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin-bottom: 16px;">이메일 인증 안내</h2>
  <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
    안녕하세요. <strong>{{appName}}</strong> 이메일 소유권 확인을 위한 안내 메일입니다.<br/>
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
    variables: ['appName', 'targetLink', 'minutes', 'code', 'challengeId'],
    description: '회원가입 및 이메일 변경 시 인증 링크를 전송하는 이메일 템플릿입니다.',
  },
  {
    code: 'AUTH_VERIFY_EMAIL',
    channel: MessageChannel.EMAIL,
    name: 'Email Verification Link',
    title: '[{{appName}}] Email Verification',
    body: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;">
  <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin-bottom: 16px;">Verify Your Email</h2>
  <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
    Hello. Please verify your email address to continue using <strong>{{appName}}</strong>.<br/>
    Click the button below to complete verification.
  </p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="{{targetLink}}" style="background-color: #2563eb; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block;">
      Verify Email Now
    </a>
  </div>
  <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
    * This verification link expires in <strong>{{minutes}} minutes</strong>.<br/>
    * If you did not request this, please ignore this email.<br/>
    * If the button does not work, copy and paste this link into your browser:<br/>
    <a href="{{targetLink}}" style="color: #2563eb; word-break: break-all; font-size: 12px;">{{targetLink}}</a>
  </p>
</div>`,
    variables: ['appName', 'targetLink', 'minutes', 'code', 'challengeId'],
    description: 'Email template sent to users for verifying email address.',
  },

  // 2. 새 공지사항 등록 알림 (IN_APP)
  {
    code: 'NOTICE_CREATED',
    channel: MessageChannel.IN_APP,
    name: '새 공지사항 등록 인앱 알림',
    title: '📢 새 공지사항',
    body: '{{title}}',
    variables: ['title', 'id', 'linkUrl'],
    description: '새로운 공지사항이 게시되었을 때 전체 회원에게 전송되는 인앱 알림 템플릿입니다.',
  },
  {
    code: 'NOTICE_CREATED',
    channel: MessageChannel.IN_APP,
    name: 'New Announcement In-App Alert',
    title: '📢 New Announcement',
    body: '{{title}}',
    variables: ['title', 'id', 'linkUrl'],
    description: 'In-app notification sent to users when a new announcement is posted.',
  },

  // 3. 1:1 문의 답변 등록 알림 (IN_APP)
  {
    code: 'INQUIRY_REPLY',
    channel: MessageChannel.IN_APP,
    name: '1:1 문의 답변 등록 고객 알림',
    title: '1:1 문의 답변 등록',
    body: '\'{{title}}\' 문의에 운영자의 답변이 등록되었습니다.',
    variables: ['title', 'inquiryId', 'linkUrl'],
    description: '고객의 1:1 문의에 관리자가 답변을 남겼을 때 고객에게 전송되는 알림 템플릿입니다.',
  },
  {
    code: 'INQUIRY_REPLY',
    channel: MessageChannel.IN_APP,
    name: 'Inquiry Reply In-App Alert',
    title: 'New Reply on Your Inquiry',
    body: 'An admin has replied to your inquiry \'{{title}}\'.',
    variables: ['title', 'inquiryId', 'linkUrl'],
    description: 'In-app notification sent to user when an admin replies to their inquiry.',
  },

  // 4. 1:1 문의 사용자 새 메시지 알림 (IN_APP)
  {
    code: 'INQUIRY_MESSAGE',
    channel: MessageChannel.IN_APP,
    name: '1:1 문의 새 고객 메시지 관리자 알림',
    title: '1:1 문의 새 메시지',
    body: '\'{{title}}\' 문의에 새로운 고객 메시지가 도착했습니다.',
    variables: ['title', 'inquiryId', 'linkUrl'],
    description: '고객이 추가 메시지를 보냈을 때 담당 관리자에게 전송되는 알림 템플릿입니다.',
  },
  {
    code: 'INQUIRY_MESSAGE',
    channel: MessageChannel.IN_APP,
    name: 'New Customer Message Admin Alert',
    title: 'New Customer Message',
    body: 'A new message has arrived for inquiry \'{{title}}\'.',
    variables: ['title', 'inquiryId', 'linkUrl'],
    description: 'In-app notification sent to admin when a customer sends a new message.',
  },

  // 5. 슬랙 새 문의 접수 알림 (SLACK)
  {
    code: 'SLACK_INQUIRY_CREATED',
    channel: MessageChannel.SLACK,
    name: '슬랙 새 문의 접수 알림',
    title: '새 1:1 문의 접수',
    body: '새로운 1:1 문의가 등록되었습니다.\n*제목*: {{title}}\n*카테고리*: {{category}}\n*작성자*: {{author}}',
    variables: ['title', 'category', 'author', 'linkUrl', 'inquiryId'],
    description: '고객이 1:1 문의를 등록했을 때 사내 슬랙 채널로 발송되는 웹훅 알림 템플릿입니다.',
  },
  {
    code: 'SLACK_INQUIRY_CREATED',
    channel: MessageChannel.SLACK,
    name: 'Slack New Inquiry Notification',
    title: 'New Inquiry Submitted',
    body: 'A new 1:1 inquiry has been registered.\n*Title*: {{title}}\n*Category*: {{category}}\n*Author*: {{author}}',
    variables: ['title', 'category', 'author', 'linkUrl', 'inquiryId'],
    description: 'Slack webhook message sent when a new inquiry is submitted.',
  },

  // 6. 슬랙 미응답 문의 알림 (SLACK)
  {
    code: 'SLACK_INQUIRY_UNANSWERED',
    channel: MessageChannel.SLACK,
    name: '슬랙 미응답 문의 리마인더 알림',
    title: '미응답 문의 알림',
    body: '사용자의 마지막 메시지 이후 {{elapsedMinutes}}분이 경과했습니다. 빠른 답변을 부탁드립니다.\n*제목*: {{title}}\n*카테고리*: {{category}}\n*담당자*: {{assignee}}',
    variables: ['title', 'category', 'assignee', 'elapsedMinutes', 'linkUrl', 'inquiryId'],
    description: '운영시간 중 문의가 10분 이상 미응답 상태일 때 슬랙으로 발송되는 리마인더 알림 템플릿입니다.',
  },
  {
    code: 'SLACK_INQUIRY_UNANSWERED',
    channel: MessageChannel.SLACK,
    name: 'Slack Unanswered Inquiry Alert',
    title: 'Unanswered Inquiry Reminder',
    body: '{{elapsedMinutes}} minutes have passed since the last user message. Please reply promptly.\n*Title*: {{title}}\n*Category*: {{category}}\n*Assignee*: {{assignee}}',
    variables: ['title', 'category', 'assignee', 'elapsedMinutes', 'linkUrl', 'inquiryId'],
    description: 'Slack reminder message sent when an inquiry has remained unanswered for more than 10 minutes.',
  },
];

export class MessageTemplateSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    for (const seed of TEMPLATE_SEEDS) {
      let template = await em.findOne(MessageTemplate, {
        code: seed.code,
      });

      if (!template) {
        template = em.create(MessageTemplate, {
          code: seed.code,
          channel: seed.channel,
          name: seed.name,
          title: seed.title,
          body: seed.body,
          variables: seed.variables,
          description: seed.description,
          isActive: true,
        });
        em.persist(template);
      }
    }
    await em.flush();
  }
}
