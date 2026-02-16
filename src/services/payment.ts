/**
 * Payment Service - 支付服务
 * 支持多种支付方式：GrabPay, Stripe, 微信, Alipay
 */

import { Env } from '../types';

export type PaymentProvider = 'stripe' | 'grabpay' | 'wechat' | 'alipay' | 'mock';
export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded';

export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  checkoutUrl?: string;
  error?: string;
}

export interface PaymentWebhook {
  paymentId: string;
  orderId: string;
  status: PaymentStatus;
  transactionId?: string;
  paidAt?: string;
}

export class PaymentService {
  private env: Env;
  private providers: Map<PaymentProvider, any>;

  constructor(env: Env) {
    this.env = env;
    this.providers = new Map();
    this.initProviders();
  }

  private initProviders() {
    // 初始化已配置的支付提供商
    if (this.env.STRIPE_SECRET_KEY) {
      this.providers.set('stripe', this.createStripeProvider());
    }
    if (this.env.GRABPAY_MERCHANT_ID) {
      this.providers.set('grabpay', this.createGrabPayProvider());
    }
    // _mock_ 始终可用
    this.providers.set('mock', this.createMockProvider());
  }

  /**
   * 创建支付订单
   */
  async createPayment(req: PaymentRequest): Promise<PaymentResult> {
    const provider = this.providers.get(req.provider);
    if (!provider) {
      return { success: false, error: `Provider ${req.provider} not configured` };
    }

    try {
      return await provider.createPayment(req);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 查询支付状态
   */
  async getPaymentStatus(paymentId: string, provider: PaymentProvider): Promise<PaymentStatus> {
    const p = this.providers.get(provider);
    if (!p) return 'failed';
    
    try {
      return await p.getPaymentStatus(paymentId);
    } catch {
      return 'failed';
    }
  }

  /**
   * 处理 Webhook 回调
   */
  async handleWebhook(provider: PaymentProvider, payload: any): Promise<PaymentWebhook> {
    const p = this.providers.get(provider);
    if (!p) {
      throw new Error(`Provider ${provider} not configured`);
    }
    return p.handleWebhook(payload);
  }

  // ==================== Stripe Provider ====================
  
  private createStripeProvider() {
    return {
      async createPayment(req: PaymentRequest): Promise<PaymentResult> {
        // Stripe - TODO: 配置 STRIPE_SECRET_KEY 后启用
        return { success: false, error: 'Stripe not configured' };
      },
      async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
        return 'failed';
      },
      async handleWebhook(payload: any): Promise<PaymentWebhook> {
        return { paymentId: '', orderId: '', status: 'failed' };
      },
    };
  }

  // ==================== GrabPay Provider ====================
  
  private createGrabPayProvider() {
    return {
      async createPayment(req: PaymentRequest): Promise<PaymentResult> {
        // GrabPay OAuth + Create Payment API
        const token = await this.getGrabPayToken();
        
        const response = await fetch('https://openapi.grab.com/pay/v2/payment', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Game-Id': this.env.GRABPAY_MERCHANT_ID,
          },
          body: JSON.stringify({
            amount: req.amount,
            currency: req.currency,
            merchantID: this.env.GRABPAY_MERCHANT_ID,
            merchantRedirectURL: `${this.env.PAYMENT_SUCCESS_URL}?order_id=${req.orderId}`,
            description: `Order ${req.orderId}`,
          }),
        });

        const data = await response.json();
        return {
          success: true,
          paymentId: data.paymentID,
          checkoutUrl: data.webRedirectURL,
        };
      },

      async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
        const token = await this.getGrabPayToken();
        const response = await fetch(`https://openapi.grab.com/pay/v2/payment/${paymentId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        return data.status === 'SUCCESS' ? 'paid' : 'pending';
      },

      async getGrabPayToken(): Promise<string> {
        // GrabPay OAuth
        const response = await fetch('https://openapi.grab.com/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: this.env.GRABPAY_CLIENT_ID,
            client_secret: this.env.GRABPAY_CLIENT_SECRET,
            grant_type: 'client_credentials',
            scope: 'payment',
          }),
        });
        const data = await response.json();
        return data.access_token;
      },

      async handleWebhook(payload: any): Promise<PaymentWebhook> {
        return {
          paymentId: payload.paymentID,
          orderId: payload.merchantReferenceID,
          status: payload.status === 'SUCCESS' ? 'paid' : 'pending',
          transactionId: payload.externalPaymentID,
        };
      },
    };
  }

  // ==================== Mock Provider (For Testing) ====================
  
  private createMockProvider() {
    return {
      payments: new Map<string, { status: PaymentStatus; amount: number }>(),

      async createPayment(req: PaymentRequest): Promise<PaymentResult> {
        const paymentId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.payments.set(paymentId, { status: 'pending', amount: req.amount });
        
        return {
          success: true,
          paymentId,
          checkoutUrl: `/payment/mock/${paymentId}`,
        };
      },

      async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
        return this.payments.get(paymentId)?.status || 'failed';
      },

      async handleWebhook(payload: any): Promise<PaymentWebhook> {
        const { paymentId, status } = payload;
        this.payments.set(paymentId, { status, amount: 0 });
        
        return {
          paymentId,
          orderId: payload.orderId,
          status,
          transactionId: `txn_${paymentId}`,
        };
      },
    };
  }
}
