import { randomBytes } from 'node:crypto';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { type App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { type DecodedIdToken, getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';

import { env } from '#/env';

export interface PushNotificationPayload {
  token: string
  title: string
  body: string
  data?: Record<string, string>
}

export interface MulticastPushPayload {
  tokens: string[]
  title: string
  body: string
  data?: Record<string, string>
}

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private app: App | null = null;
  private isInitialized = false;

  onModuleInit() {
    this.initFirebase();
  }

  private initFirebase() {
    const projectId = env.FIREBASE_PROJECT_ID;
    const clientEmail = env.FIREBASE_CLIENT_EMAIL;
    const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      try {
        const apps = getApps();
        if (apps.length === 0) {
          this.app = initializeApp({
            credential: cert({
              projectId,
              clientEmail,
              privateKey,
            }),
          });
        }
        else {
          this.app = apps[0]!;
        }
        this.isInitialized = true;
        this.logger.log(`Firebase Admin SDK successfully initialized for project: ${projectId}`);
      }
      catch (error) {
        this.logger.error('Failed to initialize Firebase Admin SDK:', error);
      }
    }
    else {
      this.logger.warn(
        'Firebase credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) not found. Running in Mock Mode.',
      );
    }
  }

  get isReady(): boolean {
    return this.isInitialized && this.app !== null;
  }

  /**
   * Send single device push notification via FCM
   */
  async sendPushNotification(payload: PushNotificationPayload): Promise<boolean> {
    if (!this.isReady || !this.app) {
      this.logger.log(
        `[FCM Mock] Push sent to [${payload.token.slice(0, 10)}...]: "${payload.title}" - ${payload.body}`,
      );
      return true;
    }

    try {
      const messaging = getMessaging(this.app);
      const response = await messaging.send({
        token: payload.token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
      });
      this.logger.log(`[FCM] Push sent successfully: ${response}`);
      return true;
    }
    catch (error) {
      this.logger.error(`Failed to send FCM push to ${payload.token}:`, error);
      return false;
    }
  }

  /**
   * Send multicast push notification to multiple device tokens via FCM
   */
  async sendMulticastPush(payload: MulticastPushPayload): Promise<{ successCount: number, failureCount: number }> {
    if (!payload.tokens || payload.tokens.length === 0) {
      return { successCount: 0, failureCount: 0 };
    }

    if (!this.isReady || !this.app) {
      this.logger.log(
        `[FCM Mock] Multicast push sent to ${payload.tokens.length} devices: "${payload.title}" - ${payload.body}`,
      );
      return { successCount: payload.tokens.length, failureCount: 0 };
    }

    try {
      const messaging = getMessaging(this.app);
      const messages = payload.tokens.map((token) => ({
        token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
      }));

      const response = await messaging.sendEach(messages);
      this.logger.log(
        `[FCM] Multicast push finished: ${response.successCount} succeeded, ${response.failureCount} failed`,
      );
      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    }
    catch (error) {
      this.logger.error('Failed to send multicast FCM push:', error);
      return { successCount: 0, failureCount: payload.tokens.length };
    }
  }

  async verifyIdToken(idToken: string): Promise<DecodedIdToken | null> {
    if (!this.isReady || !this.app) return null;

    try {
      return await getAuth(this.app).verifyIdToken(idToken);
    }
    catch (error) {
      this.logger.warn(`Failed to verify Firebase ID token: ${String(error)}`);
      return null;
    }
  }

  /**
   * Generate Firebase Email Verification Link (returns link and oobCode)
   */
  async generateEmailVerificationLink(
    email: string,
    continueUrl?: string,
  ): Promise<{ link: string, oobCode: string }> {
    const defaultUrl = continueUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/onboarding/email`;

    if (!this.isReady || !this.app) {
      const mockCode = `fb_${randomBytes(8).toString('hex')}${Date.now().toString(36)}`;
      const mockLink = `${defaultUrl}?oobCode=${mockCode}`;
      this.logger.log(`[Firebase Email Mock] Verification link generated for ${email}: ${mockLink}`);
      return {
        link: mockLink,
        oobCode: mockCode,
      };
    }

    try {
      const auth = getAuth(this.app);
      const link = await auth.generateEmailVerificationLink(email, {
        url: defaultUrl,
        handleCodeInApp: true,
      });

      const parsedUrl = new URL(link);
      const oobCode = parsedUrl.searchParams.get('oobCode') || link;

      this.logger.log(`[Firebase Email] Verification link generated for ${email}`);
      return { link, oobCode };
    }
    catch (error) {
      this.logger.error(`Failed to generate Firebase email verification link for ${email}:`, error);
      const fallbackCode = `fb_fallback_${randomBytes(8).toString('hex')}`;
      return {
        link: `${defaultUrl}?oobCode=${fallbackCode}`,
        oobCode: fallbackCode,
      };
    }
  }
}
