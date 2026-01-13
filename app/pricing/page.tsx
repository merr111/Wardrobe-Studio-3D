"use client";

import React from "react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "€0",
    description: "For early exploration and simple spaces.",
    features: [
      "1 project, 1 room",
      "Basic wardrobe configurator",
      "Templates and basic materials",
      "Save and export disabled",
    ],
  },
  {
    name: "Pro",
    price: "€9.99 / mo",
    description: "For homeowners and serious planners.",
    features: [
      "Unlimited projects + rooms",
      "Combine wardrobes + advanced logic",
      "Save, load, and share links",
      "PDF export included",
    ],
    highlight: true,
  },
  {
    name: "Business",
    price: "Contact sales",
    description: "For studios and commercial teams.",
    features: [
      "Client projects + brand materials",
      "Advanced exports (JSON / BOM)",
      "Priority features",
      "Team access (coming soon)",
    ],
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#f2efe9] text-slate-900">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-[#e6b07a] opacity-28 blur-[120px]" />
        <div className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-[#88bfb5] opacity-28 blur-[120px]" />

        <div className="relative mx-auto max-w-5xl px-6 py-12">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                Pricing
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
                Upgrade when your project grows.
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Keep exploring for free. Step up only when you need advanced
                exports or multi-room planning.
              </p>
            </div>
            <Link
              href="/login"
              className="rounded-full bg-[#2e5d57] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#274f4a]"
            >
              Log in
            </Link>
          </header>

          <section className="mt-10 grid gap-5 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-3xl border p-6 shadow-lg ${
                  plan.highlight
                    ? "border-[#2e5d57] bg-[#2e5d57] text-white"
                    : "border-white/70 bg-white/80 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{plan.name}</h2>
                  {plan.highlight && (
                    <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-white">
                      Recommended
                    </span>
                  )}
                </div>
                <p
                  className={`mt-2 text-2xl font-semibold ${
                    plan.highlight ? "text-white" : "text-slate-900"
                  }`}
                >
                  {plan.price}
                </p>
                <p
                  className={`mt-2 text-sm ${
                    plan.highlight ? "text-slate-200" : "text-slate-500"
                  }`}
                >
                  {plan.description}
                </p>
                <ul className="mt-4 space-y-3 text-xs">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span
                        className={`mt-1 h-1.5 w-1.5 rounded-full ${
                          plan.highlight ? "bg-white" : "bg-slate-400"
                        }`}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className={`mt-6 w-full rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition ${
                    plan.highlight
                      ? "bg-white text-[#2e5d57] hover:bg-slate-100"
                      : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {plan.highlight ? "Upgrade to Pro" : "Choose plan"}
                </button>
              </div>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
