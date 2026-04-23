import crypto from 'crypto';

export class WebhookSecurity {
  /**
   * Stripe signature verification is handled by the official SDK.
   * This is a placeholder for Paymob or custom provider HMAC logic.
   */
  static verifyPaymobHMAC(hmac: string, payload: any, secret: string) {
    if (!secret) return false;
    
    // Paymob HMAC calculation logic (simplified example)
    // You should use the exact fields required by Paymob documentation
    const fields = [
      payload.amount_cents,
      payload.created_at,
      payload.currency,
      payload.error_occured,
      payload.has_parent_transaction,
      payload.id,
      payload.integration_id,
      payload.is_3d_secure,
      payload.is_auth,
      payload.is_capture,
      payload.is_refunded,
      payload.is_standalone_payment,
      payload.is_voided,
      payload.order,
      payload.owner,
      payload.pending,
      payload.source_data_pan,
      payload.source_data_sub_type,
      payload.source_data_type,
      payload.success,
    ].join('');

    const hash = crypto.createHmac('sha512', secret).update(fields).digest('hex');
    return hash === hmac;
  }
}
