import { randomUUID } from 'node:crypto';

import { PublishCommand, type PublishInput, SNSClient } from '@aws-sdk/client-sns';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import type { IPushAdapter, PushAdapterResult, PushMessage } from '#/infra/notification/channels/push/push.interface';
import { NOTIFICATION_MODULE_OPTIONS, type NotificationModuleOptions } from '#/infra/notification/notification.interface';

/**
 * AWS SNS Mobile Push 연동 어댑터 (@aws-sdk/client-sns 공식 라이브러리 사용)
 */
@Injectable()
export class AwsSnsPushAdapter implements IPushAdapter {
  readonly providerName = 'aws-sns-push';
  private readonly logger = new Logger(AwsSnsPushAdapter.name);
  private readonly region: string;
  private readonly accessKeyId?: string;
  private readonly secretAccessKey?: string;
  private readonly platformApplicationArn?: string;
  private readonly topicArn?: string;
  private readonly snsClient?: SNSClient;

  constructor(
    @Inject(NOTIFICATION_MODULE_OPTIONS)
    options: NotificationModuleOptions,
  ) {
    const region = options.push?.sns?.region || process.env.AWS_REGION;
    if (!region) {
      throw new Error('AWS SNS region is required');
    }
    this.region = region;
    this.accessKeyId = options.push?.sns?.accessKeyId || process.env.AWS_ACCESS_KEY_ID;
    this.secretAccessKey = options.push?.sns?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;
    this.platformApplicationArn = options.push?.sns?.platformApplicationArn || process.env.AWS_SNS_PLATFORM_APPLICATION_ARN;
    this.topicArn = options.push?.sns?.topicArn || process.env.AWS_SNS_TOPIC_ARN;

    if (this.accessKeyId && this.secretAccessKey) {
      this.snsClient = new SNSClient({
        region: this.region,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
      });
    }
  }

  async send(message: PushMessage): Promise<PushAdapterResult> {
    if (!message.token) {
      return {
        success: false,
        error: 'Target device token or endpoint ARN is required',
      };
    }

    this.logger.log(`[AWS SNS Push] 푸시 발송 요청 (token: ${message.token})`);

    // AWS 자격 증명이 없는 경우 모의(Mock) 발송으로 안전하게 처리
    if (!this.snsClient) {
      this.logger.warn('[AWS SNS Push] AWS 자격증명(accessKeyId, secretAccessKey)이 설정되지 않아 모의 발송 모드로 처리합니다.');
      const messageId = `mock-aws-push-${Date.now()}-${randomUUID()}`;
      this.logger.log(`[AWS SNS Push] 푸시 발송 성공 (messageId: ${messageId})`);
      return {
        success: true,
        messageId,
      };
    }

    try {
      const isArn = message.token.startsWith('arn:aws:sns:');
      let messageContent = message.body;
      let messageStructure: string | undefined;

      if (message.title) {
        messageStructure = 'json';
        messageContent = JSON.stringify({
          default: message.body,
          GCM: JSON.stringify({
            notification: {
              title: message.title,
              body: message.body,
              ...(message.imageUrl ? { image: message.imageUrl } : {}),
            },
            data: message.data,
          }),
          APNS: JSON.stringify({
            aps: {
              alert: {
                title: message.title,
                body: message.body,
              },
              sound: 'default',
            },
            ...message.data,
          }),
        });
      }

      let destination: { TargetArn: string } | { TopicArn: string };
      if (isArn) {
        destination = { TargetArn: message.token };
      }
      else if (this.topicArn) {
        destination = { TopicArn: this.topicArn };
      }
      else {
        destination = { TargetArn: message.token };
      }

      const input: PublishInput = {
        Message: messageContent,
        ...(message.title ? { Subject: message.title } : {}),
        ...(messageStructure ? { MessageStructure: messageStructure } : {}),
        ...destination,
      };

      const command = new PublishCommand(input);
      const response = await this.snsClient.send(command);
      const messageId = response.MessageId || `aws-sns-${Date.now()}`;

      this.logger.log(`[AWS SNS Push] 푸시 발송 성공 (messageId: ${messageId})`);
      return {
        success: true,
        messageId,
      };
    }
    catch (err) {
      const error = ApplicationError.from(err, 'PUSH_SEND_FAILED').message;
      this.logger.error(`[AWS SNS Push] Push send error: ${error}`);
      return {
        success: false,
        error,
      };
    }
  }
}
