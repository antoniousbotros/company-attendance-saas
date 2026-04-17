import crypto from 'crypto';

const PAYMOB_BASE_URL = 'https://accept.paymob.com/api';

export interface PayMobConfig {
  apiKey: string;
  integrationId: string;
  iframeId: string;
  hmacSecret: string;
}

export class PayMobClient {
  private config: PayMobConfig;
  private authToken: string | null = null;

  constructor(config: PayMobConfig) {
    this.config = config;
  }

  async authenticate() {
    const response = await fetch(`${PAYMOB_BASE_URL}/auth/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: this.config.apiKey }),
    });

    if (!response.ok) throw new Error('PayMob authentication failed');
    const data = await response.json();
    this.authToken = data.token;
    return data;
  }

  async createOrder(params: {
    authToken: string;
    amountCents: number;
    currency: string;
    merchantOrderId: string;
  }) {
    const response = await fetch(`${PAYMOB_BASE_URL}/ecommerce/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: params.authToken,
        delivery_needed: false,
        amount_cents: params.amountCents,
        currency: params.currency,
        merchant_order_id: params.merchantOrderId,
        items: [],
      }),
    });

    if (!response.ok) throw new Error('PayMob order creation failed');
    return response.json();
  }

  async getPaymentKey(params: {
    authToken: string;
    amountCents: number;
    orderId: number;
    currency: string;
    billingData: {
      first_name: string;
      last_name: string;
      email: string;
      phone_number: string;
      apartment: string;
      floor: string;
      street: string;
      building: string;
      shipping_method: string;
      postal_code: string;
      city: string;
      country: string;
      state: string;
    };
  }) {
    const response = await fetch(`${PAYMOB_BASE_URL}/acceptance/payment_keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: params.authToken,
        amount_cents: params.amountCents,
        expiration: 3600,
        order_id: params.orderId,
        billing_data: params.billingData,
        currency: params.currency,
        integration_id: Number(this.config.integrationId),
        lock_order_when_paid: true,
      }),
    });

    if (!response.ok) throw new Error('PayMob payment key generation failed');
    return response.json();
  }

  getIframeUrl(paymentToken: string): string {
    return `https://accept.paymob.com/api/acceptance/iframes/${this.config.iframeId}?payment_token=${paymentToken}`;
  }

  verifyHmac(data: any, receivedHmac: string): boolean {
    const hmacFields = [
      'amount_cents', 'created_at', 'currency', 'error_occured', 'has_parent_transaction',
      'id', 'integration_id', 'is_3d_secure', 'is_auth', 'is_capture', 'is_refunded',
      'is_standalone_payment', 'is_voided', 'order', 'owner', 'pending', 'source_data.pan',
      'source_data.sub_type', 'source_data.type', 'success',
    ];

    let concatenatedString = '';
    for (const field of hmacFields) {
      const keys = field.split('.');
      let value = data;
      for (const key of keys) value = (value as any)?.[key];
      if (value !== undefined && value !== null) concatenatedString += String(value);
    }

    const calculatedHmac = crypto
      .createHmac('sha512', this.config.hmacSecret)
      .update(concatenatedString)
      .digest('hex');

    return calculatedHmac === receivedHmac;
  }
}

export function getPayMobClient(): PayMobClient {
  return new PayMobClient({
    apiKey: process.env.PAYMOB_API_KEY || '',
    integrationId: process.env.PAYMOB_INTEGRATION_ID || '',
    iframeId: process.env.PAYMOB_IFRAME_ID || '',
    hmacSecret: process.env.PAYMOB_HMAC_SECRET || '',
  });
}
