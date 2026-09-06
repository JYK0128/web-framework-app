import { Inject, Injectable, Logger } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import { type App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

import type { IPushAdapter, PushAdapterResult, PushMessage } from '#/infra/notification/channels/push/push.interface';
import { NOTIFICATION_MODULE_OPTIONS, type NotificationModuleOptions } from '#/infra/notification/notification.interface';

@Injectable()
export class FirebaseFcmAdapter implements IPushAdapter {
  readonly providerName = 'firebase-fcm';
  private readonly logger = new Logger(FirebaseFcmAdapter.name);
  private readonly projectId?: string;
  private readonly clientEmail?: string;
  private readonly privateKey?: string;
  private readonly firebaseApp?: App;

  constructor(
    @Inject(NOTIFICATION_MODULE_OPTIONS)
    options: NotificationModuleOptions,
  ) {
    this.projectId = options.push?.fcm?.projectId;
    this.clientEmail = options.push?.fcm?.clientEmail;
    this.privateKey = options.push?.fcm?.privateKey;
    if (this.projectId && this.clientEmail && this.privateKey) {
      try {
        this.firebaseApp = getApps()[0] ?? initializeApp({
          credential: cert({
            projectId: this.projectId,
            clientEmail: this.clientEmail,
            privateKey: this.privateKey.replace(/\\n/g, '\n'),
          }),
        });
        this.logger.log('[FCM] Firebase Admin App initialized successfully.');
      }
      catch (error) {
        this.logger.error(`[FCM] Firebase Admin App initialization failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  async send(message: PushMessage): Promise<PushAdapterResult> {
    if (!message.token) {
      return {
        success: false,
        error: 'Target device token is required',
      };
    }

    try {
      this.logger.log(`[FCM] 푸시 발송 요청 (token: ${message.token})`);
      if (!this.firebaseApp) throw new Error('FCM service account is not configured');
      const messageId = await getMessaging(this.firebaseApp).send({
        token: message.token,
        notification: { title: message.title, body: message.body, ...(message.imageUrl ? { imageUrl: message.imageUrl } : {}) },
        ...(message.data ? { data: message.data } : {}),
      });
      this.logger.log(`[FCM] 푸시 발송 성공 (messageId: ${messageId})`);
      return {
        success: true,
        messageId,
      };
    }
    catch (err) {
      const error = ApplicationError.from(err, 'FCM_PUSH_FAILED').message;
      this.logger.error(`[FCM] Push send error: ${error}`);
      return {
        success: false,
        error,
      };
    }
  }
}
