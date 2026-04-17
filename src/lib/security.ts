import crypto from "crypto";

/**
 * Enterprise HMAC SHA-512 Webhook Signature Verification
 * 
 * Protects public /api webhook endpoints from external spoofing or Man-in-the-Middle (MitM)
 * injection attacks by executing a secure timing-safe cryptographic comparison.
 * 
 * @param payload - The raw JSON stringified body from the incoming request.
 * @param signature - The signature hash provided in the HTTP headers (e.g., Paymob, Stripe, GitHub).
 * @param secret - The private HMAC secret key stored safely in environment variables.
 * @returns boolean - True if mathematically valid, False if spoofed or tampered.
 */
export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  if (!payload || !signature || !secret) return false;

  try {
    const computedHash = crypto
      .createHmac("sha512", secret)
      .update(payload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(computedHash),
      Buffer.from(signature)
    );
  } catch (err) {
    console.error("Webhook Verification Exception:", err);
    return false;
  }
}
