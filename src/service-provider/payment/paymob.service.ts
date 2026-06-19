import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type PaymobCheckoutResult = {
  checkoutUrl: string | null;
  paymobOrderId: string | null;
  message: string;
};

@Injectable()
export class PaymobService {
  private readonly logger = new Logger(PaymobService.name);

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(
      this.configService.get<string>('PAYMOB_API_KEY') &&
        this.configService.get<string>('PAYMOB_INTEGRATION_ID'),
    );
  }

  /**
   * Phase 2 stub — returns a placeholder until Paymob credentials are configured.
   * When PAYMOB_API_KEY and PAYMOB_INTEGRATION_ID are set, this will initiate
   * a real Paymob payment session.
   */
  async createPromotionCheckout(input: {
    promotionId: string;
    amount: number;
    providerUserId: string;
    description: string;
  }): Promise<PaymobCheckoutResult> {
    if (!this.isConfigured()) {
      this.logger.warn(
        `Paymob not configured — promotion ${input.promotionId} awaiting manual payment confirmation`,
      );

      return {
        checkoutUrl: null,
        paymobOrderId: null,
        message:
          'Paymob integration pending. Use POST /provider/promotions/:id/confirm-payment after manual settlement.',
      };
    }

    // Placeholder for future Paymob REST integration
    const paymobOrderId = `paymob_stub_${input.promotionId}`;

    return {
      checkoutUrl: `${this.configService.get('APP_URL')}/payments/paymob/${paymobOrderId}`,
      paymobOrderId,
      message: 'Paymob checkout session created (stub)',
    };
  }

  async verifyPayment(_paymobOrderId: string): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    return true;
  }
}
