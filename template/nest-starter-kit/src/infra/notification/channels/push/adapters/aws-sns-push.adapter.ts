import { createHash, createHmac, randomUUID } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import type { IPushAdapter, PushAdapterResult, PushMessage } from '#/infra/notification/channels/push/push.interface';
import { NOTIFICATION_MODULE_OPTIONS, type NotificationModuleOptions } from '#/infra/notification/notification.interface';

/**
 * AWS SNS Mobile Push 연동 어댑터 (Zero-Dependency Native Fetch + AWS SigV4)
 * @aws-sdk 라이브러리 설치 없이 순수 Node.js crypto 및 fetch로 직접 통신합니다.
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

  constructor(
    @Inject(NOTIFICATION_MODULE_OPTIONS)
    options: NotificationModuleOptions,
  ) {
    this.region = options.push?.sns?.region || process.env.AWS_REGION || 'ap-northeast-2';
    this.accessKeyId = options.push?.sns?.accessKeyId || process.env.AWS_ACCESS_KEY_ID;
    this.secretAccessKey = options.push?.sns?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;
    this.platformApplicationArn = options.push?.sns?.platformApplicationArn || process.env.AWS_SNS_PLATFORM_APPLICATION_ARN;
    this.topicArn = options.push?.sns?.topicArn || process.env.AWS_SNS_TOPIC_ARN;
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
    if (!this.accessKeyId || !this.secretAccessKey) {
      this.logger.warn('[AWS SNS Push] AWS 자격증명(accessKeyId, secretAccessKey)이 설정되지 않아 모의 발송 모드로 처리합니다.');
      const messageId = `mock-aws-push-${Date.now()}-${randomUUID()}`;
      this.logger.log(`[AWS SNS Push] 푸시 발송 성공 (messageId: ${messageId})`);
      return {
        success: true,
        messageId,
      };
    }

    try {
      const endpoint = `https://sns.${this.region}.amazonaws.com/`;
      const url = new URL(endpoint);

      const params = new URLSearchParams();
      params.append('Action', 'Publish');
      params.append('Version', '2010-03-31');

      // ARN 또는 대상 엔드포인트 지정
      if (message.token.startsWith('arn:aws:sns:')) {
        params.append('TargetArn', message.token);
      }
      else if (this.topicArn) {
        params.append('TopicArn', this.topicArn);
      }
      else {
        params.append('TargetArn', message.token);
      }

      // 모바일 푸시 페이로드 구성 (FCM / APNs 멀티 플랫폼 지원)
      if (message.title) {
        params.append('Subject', message.title);
        const payload = JSON.stringify({
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
        params.append('MessageStructure', 'json');
        params.append('Message', payload);
      }
      else {
        params.append('Message', message.body);
      }

      const bodyString = params.toString();
      const headers = this.createSigV4Headers({
        method: 'POST',
        url,
        body: bodyString,
        region: this.region,
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      });

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers,
        body: bodyString,
        signal: AbortSignal.timeout(10000),
      });

      const responseText = await response.text();

      if (!response.ok) {
        const errorMessage = /<Message>(.*?)<\/Message>/.exec(responseText)?.[1]
          || /<Code>(.*?)<\/Code>/.exec(responseText)?.[1]
          || `HTTP ${response.status}: ${responseText}`;

        this.logger.error(`[AWS SNS Push] Push send error: ${errorMessage}`);
        return {
          success: false,
          error: `AWS SNS API Error: ${errorMessage}`,
        };
      }

      const messageId = /<MessageId>(.*?)<\/MessageId>/.exec(responseText)?.[1]
        || `aws-sns-${Date.now()}`;

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

  private createSigV4Headers(params: {
    method: string
    url: URL
    body: string
    region: string
    accessKeyId: string
    secretAccessKey: string
  }): Record<string, string> {
    const service = 'sns';
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);

    const contentType = 'application/x-www-form-urlencoded; charset=utf-8';
    const host = params.url.host;
    const payloadHash = createHash('sha256').update(params.body, 'utf8').digest('hex');

    const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = 'content-type;host;x-amz-date';

    const canonicalRequest = [
      params.method,
      params.url.pathname || '/',
      '',
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const canonicalRequestHash = createHash('sha256').update(canonicalRequest, 'utf8').digest('hex');
    const credentialScope = `${dateStamp}/${params.region}/${service}/aws4_request`;

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      canonicalRequestHash,
    ].join('\n');

    const kDate = createHmac('sha256', `AWS4${params.secretAccessKey}`).update(dateStamp).digest();
    const kRegion = createHmac('sha256', kDate).update(params.region).digest();
    const kService = createHmac('sha256', kRegion).update(service).digest();
    const kSigning = createHmac('sha256', kService).update('aws4_request').digest();
    const signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    const authorization = `AWS4-HMAC-SHA256 Credential=${params.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return {
      'Content-Type': contentType,
      'Host': host,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      'Authorization': authorization,
    };
  }
}
