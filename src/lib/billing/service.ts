import { supabaseAdmin } from "@/lib/supabase";
import { PLANS } from "@/lib/billing";

export type PaymentProvider = 'stripe' | 'paymob';
export type EntitlementSource = 'stripe' | 'paymob' | 'ltd_code' | 'admin';

export interface WebhookEvent {
  provider: PaymentProvider;
  eventType: string;
  eventId: string;
  payload: any;
}

export class BillingService {
  /**
   * Idempotency Check: Log the event and return true if new
   */
  static async startProcessing(event: WebhookEvent): Promise<boolean> {
    const { data: existing } = await supabaseAdmin
      .from('webhook_logs')
      .select('id')
      .eq('event_id', event.eventId)
      .single();

    if (existing) return false;

    await supabaseAdmin.from('webhook_logs').insert({
      provider: event.provider,
      event_type: event.eventType,
      event_id: event.eventId,
      payload: event.payload,
    });

    return true;
  }

  static async finishProcessing(eventId: string) {
    await supabaseAdmin
      .from('webhook_logs')
      .update({ processed: true })
      .eq('event_id', eventId);
  }

  /**
   * Activate Entitlement (The Source of Truth)
   */
  static async activateEntitlement(params: {
    companyId: string;
    planId: string;
    type: 'subscription' | 'ltd';
    source: EntitlementSource;
    startAt: Date;
    endAt?: Date | null;
  }) {
    // 1. Update company record (legacy support)
    await supabaseAdmin
      .from('companies')
      .update({ 
        plan_id: params.planId,
        subscription_status: 'active'
      })
      .eq('id', params.companyId);

    // 2. Insert/Update Entitlement
    // We maintain a history, but the "active" status determines current access
    await supabaseAdmin
      .from('user_entitlements')
      .update({ status: 'expired' }) // Expire existing active ones
      .eq('company_id', params.companyId)
      .eq('status', 'active');

    await supabaseAdmin.from('user_entitlements').insert({
      company_id: params.companyId,
      type: params.type,
      plan_id: params.planId,
      status: 'active',
      start_at: params.startAt.toISOString(),
      end_at: params.endAt?.toISOString() || null,
      source: params.source,
    });
  }

  /**
   * Record a payment (The Ledger)
   */
  static async recordPayment(params: {
    companyId: string;
    provider: PaymentProvider;
    providerPaymentId: string;
    amount: number;
    currency: string;
    status: string;
    planId?: string;
    billingCycle?: string;
  }) {
    await supabaseAdmin.from('payments').insert({
        company_id: params.companyId,
        provider: params.provider,
        provider_payment_id: params.providerPaymentId,
        amount: params.amount,
        currency: params.currency,
        status: params.status,
        plan_id: params.planId,
        billing_cycle: params.billingCycle,
    });
  }

  /**
   * Determine the current plan based on hierarchy (LTD > Sub > Free)
   */
  static async getCurrentTier(companyId: string): Promise<string> {
    const { data: entitlements } = await supabaseAdmin
      .from('user_entitlements')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .order('type', { ascending: false }); // LTD comes before Subscription alphabetically

    if (!entitlements || entitlements.length === 0) return 'free';

    // Prioritize LTD
    const ltd = entitlements.find(e => e.type === 'ltd');
    if (ltd) return ltd.plan_id;

    // Then regular sub
    const sub = entitlements.find(e => e.type === 'subscription');
    if (sub) {
        // Check expiration
        if (sub.end_at && new Date(sub.end_at) < new Date()) {
            return 'free'; // Should have been cron-expired, but safe check
        }
        return sub.plan_id;
    }

    return 'free';
  }
}
