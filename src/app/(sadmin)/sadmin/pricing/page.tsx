"use client";

import React, { useEffect, useState } from "react";
import { Save, Plus, Trash2, RefreshCw, DollarSign, Users, Sparkles, CreditCard, Zap, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface PlanConfig {
  name: string;
  nameAr: string;
  price: number;
  employeeLimit: number;
  popular?: boolean;
}

interface PricingConfig {
  plans: Record<string, PlanConfig>;
  features: string[];
  features_ar: string[];
  extra_employee_cost: number;
  payment_gateway: "stripe" | "paymob";
}

export default function SadminPricing() {
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newFeature, setNewFeature] = useState("");
  const [newFeatureAr, setNewFeatureAr] = useState("");

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sadmin/pricing");
      const data = await res.json();
      if (data.ok) {
        setConfig({
          plans: data.config.plans,
          features: data.config.features,
          features_ar: data.config.features_ar,
          extra_employee_cost: data.config.extra_employee_cost,
          payment_gateway: data.config.payment_gateway ?? "stripe",
        });
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/sadmin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert("Failed to save: " + data.error);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
    setSaving(false);
  };

  const updatePlan = (planId: string, field: keyof PlanConfig, value: string | number | boolean) => {
    if (!config) return;
    setConfig({
      ...config,
      plans: {
        ...config.plans,
        [planId]: { ...config.plans[planId], [field]: value },
      },
    });
  };

  const addFeature = () => {
    if (!config || !newFeature.trim()) return;
    setConfig({
      ...config,
      features: [...config.features, newFeature.trim()],
      features_ar: [...config.features_ar, newFeatureAr.trim() || newFeature.trim()],
    });
    setNewFeature("");
    setNewFeatureAr("");
  };

  const removeFeature = (index: number) => {
    if (!config) return;
    setConfig({
      ...config,
      features: config.features.filter((_, i) => i !== index),
      features_ar: config.features_ar.filter((_, i) => i !== index),
    });
  };

  const updateFeature = (index: number, lang: "en" | "ar", value: string) => {
    if (!config) return;
    if (lang === "en") {
      const updated = [...config.features];
      updated[index] = value;
      setConfig({ ...config, features: updated });
    } else {
      const updated = [...config.features_ar];
      updated[index] = value;
      setConfig({ ...config, features_ar: updated });
    }
  };

  if (loading || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-500">
        Loading Pricing Config...
      </div>
    );
  }

  const planEntries = Object.entries(config.plans);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-1">
            Pricing Control
          </h1>
          <p className="text-zinc-400">
            Manage plans, prices, employee limits, features, and payment gateway.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadConfig}
            className="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* ── Payment Gateway Control ─────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-violet-400" />
          Payment Gateway
        </h2>
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 space-y-5">

          {/* Toggle */}
          <div className="flex gap-3">
            {(["stripe", "paymob"] as const).map((gw) => {
              const isActive = config.payment_gateway === gw;
              const label = gw === "stripe" ? "Stripe" : "PayMob";
              const desc = gw === "stripe"
                ? "Global cards, recurring subscriptions, hosted checkout"
                : "EGP payments, local Egyptian cards & wallets";
              const accent = gw === "stripe" ? "indigo" : "amber";
              return (
                <button
                  key={gw}
                  onClick={() => setConfig({ ...config, payment_gateway: gw })}
                  className={`flex-1 text-left p-4 rounded-xl border-2 transition-all ${
                    isActive
                      ? gw === "stripe"
                        ? "border-indigo-500 bg-indigo-500/10"
                        : "border-amber-500 bg-amber-500/10"
                      : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-bold text-sm ${
                      isActive
                        ? gw === "stripe" ? "text-indigo-300" : "text-amber-300"
                        : "text-zinc-400"
                    }`}>
                      {label}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? gw === "stripe"
                          ? "bg-indigo-500/20 text-indigo-300"
                          : "bg-amber-500/20 text-amber-300"
                        : "bg-zinc-800 text-zinc-500"
                    }`}>
                      {isActive ? "● ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">{desc}</p>
                </button>
              );
            })}
          </div>

          {/* Stripe status */}
          {config.payment_gateway === "stripe" && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Required Vercel Env Vars</p>
              {[
                ["STRIPE_SECRET_KEY", "sk_live_..."],
                ["STRIPE_WEBHOOK_SECRET", "whsec_..."],
                ["STRIPE_PRICE_STARTER", "price_..."],
                ["STRIPE_PRICE_PRO", "price_..."],
                ["STRIPE_PRICE_ENTERPRISE", "price_..."],
              ].map(([key, placeholder]) => (
                <div key={key} className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5">
                  <Zap className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                  <code className="text-xs text-indigo-300 font-mono flex-1">{key}</code>
                  <span className="text-[10px] text-zinc-600">{placeholder}</span>
                </div>
              ))}
              <p className="text-[10px] text-zinc-600 pt-1">
                Set these in Vercel → Project → Settings → Environment Variables. Webhook URL: <code className="text-indigo-400">https://www.yawmy.app/api/billing/webhook</code>
              </p>
            </div>
          )}

          {/* PayMob status */}
          {config.payment_gateway === "paymob" && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Required Env Vars</p>
              {[
                ["PAYMOB_API_KEY", "Your PayMob API key"],
                ["PAYMOB_INTEGRATION_ID", "Card integration ID"],
                ["PAYMOB_IFRAME_ID", "Payment iframe ID"],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5">
                  <Zap className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                  <code className="text-xs text-amber-300 font-mono flex-1">{key}</code>
                  <span className="text-[10px] text-zinc-600">{desc}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-start gap-2 bg-zinc-950 border border-zinc-800/50 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-zinc-400">
              Changing the active gateway takes effect immediately after saving. Existing subscriptions on the other gateway remain active until they expire.
            </p>
          </div>
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          Plans
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {planEntries.map(([planId, plan]) => (
            <div
              key={planId}
              className={`bg-zinc-900/50 border rounded-2xl p-5 space-y-4 ${
                plan.popular
                  ? "border-indigo-500/40 ring-1 ring-indigo-500/20"
                  : "border-zinc-800/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                  {planId}
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={plan.popular || false}
                    onChange={(e) =>
                      updatePlan(planId, "popular", e.target.checked)
                    }
                    className="w-3.5 h-3.5 rounded accent-indigo-500"
                  />
                  <span className="text-[10px] text-zinc-500">
                    <Sparkles className="w-3 h-3 inline" /> Popular
                  </span>
                </label>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                    Name (EN)
                  </label>
                  <input
                    type="text"
                    value={plan.name}
                    onChange={(e) =>
                      updatePlan(planId, "name", e.target.value)
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                    Name (AR)
                  </label>
                  <input
                    type="text"
                    value={plan.nameAr}
                    onChange={(e) =>
                      updatePlan(planId, "nameAr", e.target.value)
                    }
                    dir="rtl"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                    Price (EGP/mo)
                  </label>
                  <input
                    type="number"
                    value={plan.price}
                    onChange={(e) =>
                      updatePlan(planId, "price", Number(e.target.value))
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                    Employee Limit
                  </label>
                  <input
                    type="number"
                    value={plan.employeeLimit}
                    onChange={(e) =>
                      updatePlan(
                        planId,
                        "employeeLimit",
                        Number(e.target.value)
                      )
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Extra Employee Cost */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-amber-400" />
          Extra Employee Cost
        </h2>
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 max-w-xs">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">
            Per extra employee (EGP/month)
          </label>
          <input
            type="number"
            value={config.extra_employee_cost}
            onChange={(e) =>
              setConfig({
                ...config,
                extra_employee_cost: Number(e.target.value),
              })
            }
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50"
          />
        </div>
      </div>

      {/* Shared Features */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">
          Shared Features (included in all plans)
        </h2>
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 space-y-3">
          {config.features.map((feature, i) => (
            <div key={i} className="flex items-center gap-3">
              <input
                type="text"
                value={feature}
                onChange={(e) => updateFeature(i, "en", e.target.value)}
                placeholder="Feature (EN)"
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50"
              />
              <input
                type="text"
                value={config.features_ar[i] || ""}
                onChange={(e) => updateFeature(i, "ar", e.target.value)}
                placeholder="Feature (AR)"
                dir="rtl"
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50"
              />
              <button
                onClick={() => removeFeature(i)}
                className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Add new feature */}
          <div className="flex items-center gap-3 pt-2 border-t border-zinc-800/50">
            <input
              type="text"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder="New feature (EN)"
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50"
            />
            <input
              type="text"
              value={newFeatureAr}
              onChange={(e) => setNewFeatureAr(e.target.value)}
              placeholder="New feature (AR)"
              dir="rtl"
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50"
            />
            <button
              onClick={addFeature}
              disabled={!newFeature.trim()}
              className="p-2 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all disabled:opacity-30"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
