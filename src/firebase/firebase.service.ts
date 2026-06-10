import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging, SendResponse } from 'firebase-admin/messaging';

export type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private enabled = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    this.initFirebase();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async sendToTokens(tokens: string[], payload: PushPayload): Promise<string[]> {
    if (!this.enabled || tokens.length === 0) {
      return [];
    }

    const response = await getMessaging().sendEachForMulticast({
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data ?? {},
      webpush: {
        fcmOptions: { link: '/' },
        notification: {
          title: payload.title,
          body: payload.body,
        },
      },
    });

    const invalidTokens: string[] = [];

    response.responses.forEach((result: SendResponse, index: number) => {
      if (result.success) {
        return;
      }

      const code = result.error?.code;
      if (
        code === 'messaging/invalid-registration-token' ||
        code === 'messaging/registration-token-not-registered'
      ) {
        invalidTokens.push(tokens[index]);
      }

      this.logger.warn(
        `FCM failed for token ${tokens[index].slice(0, 12)}...: ${result.error?.message}`,
      );
    });

    this.logger.log(
      `FCM sent: ${response.successCount}/${tokens.length} success`,
    );

    return invalidTokens;
  }

  private initFirebase(): void {
    if (getApps().length > 0) {
      this.enabled = true;
      return;
    }

    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.resolvePrivateKey(
      this.configService.get<string>('FIREBASE_PRIVATE_KEY'),
    );

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn(
        'Firebase not configured — push notifications disabled. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.',
      );
      return;
    }

    try {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      this.enabled = true;
      this.logger.log(`Firebase initialized (project: ${projectId})`);
    } catch (error) {
      this.logger.error('Failed to initialize Firebase', error);
    }
  }

  private resolvePrivateKey(raw?: string): string | undefined {
    if (!raw) {
      return undefined;
    }

    return raw.replace(/\\n/g, '\n');
  }
}
