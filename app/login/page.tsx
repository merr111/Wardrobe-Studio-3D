"use client";

import React from "react";
import Link from "next/link";

const features = [
  "IKEA-style modular logic, built to fit real rooms",
  "Live validation prevents impossible designs",
  "Save, share, and export projects as you grow",
  "Plan entire rooms, not just a single wardrobe",
];

const plans = [
  {
    name: "Free",
    price: "€0",
    highlight: false,
    bullets: [
      "1 project, 1 room",
      "Basic wardrobe configurator",
      "Default templates + materials",
      "Save and export disabled",
    ],
  },
  {
    name: "Pro",
    price: "€9.99 / mo",
    highlight: true,
    bullets: [
      "Unlimited projects + rooms",
      "Combine wardrobes + advanced logic",
      "Save, load, and share links",
      "PDF export included",
    ],
  },
  {
    name: "Business",
    price: "Contact sales",
    highlight: false,
    bullets: [
      "Client projects + brand materials",
      "Advanced exports (JSON / BOM)",
      "Priority features",
      "Team access (coming soon)",
    ],
  },
];

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f2efe9] text-slate-900">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#e6b07a] opacity-28 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#88bfb5] opacity-28 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(30,41,59,0.06),_transparent_60%)]" />

        <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12 lg:flex-row lg:items-center lg:gap-12">
          <section className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
              Wardrobe Studio
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
              Design your wardrobe, your way.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-slate-600">
              Plan modular wardrobes with real-world logic. Save, customize, and
              grow your project room by room.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              {features.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-slate-900" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-2xl border border-white/70 bg-white/70 p-5 shadow-sm backdrop-blur">
              <p className="text-sm text-slate-600">
                Design freely. Create an account when you’re ready to save.
              </p>
              <button className="mt-4 inline-flex items-center justify-center rounded-full border border-slate-200 bg-[#2e5d57] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#274f4a]">
                Continue as Guest
              </button>
            </div>
          </section>

          <section className="flex-1">
            <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur">
              <div className="flex items-center gap-3 rounded-full bg-slate-100 p-1 text-sm font-medium">
                <button className="flex-1 rounded-full bg-white px-3 py-2 shadow-sm">
                  Log in
                </button>
                <button className="flex-1 rounded-full px-3 py-2 text-slate-500">
                  Create account
                </button>
              </div>

              <form className="mt-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="you@studio.com"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-slate-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-slate-300 focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Forgot password?</span>
                  <Link href="/login" className="text-slate-600">
                    Reset
                  </Link>
                </div>
                <button className="w-full rounded-2xl bg-[#2e5d57] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#274f4a]">
                  Log in
                </button>
              </form>

              <div className="mt-6">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Subscription overview
                </p>
                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  {plans.map((plan) => (
                    <div
                      key={plan.name}
                      className={`rounded-2xl border px-4 py-4 shadow-sm ${
                        plan.highlight
                          ? "border-[#2e5d57] bg-[#2e5d57] text-white"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">{plan.name}</p>
                          <p
                            className={`text-xs ${
                              plan.highlight ? "text-slate-200" : "text-slate-500"
                            }`}
                          >
                            {plan.price}
                          </p>
                        </div>
                        {plan.highlight && (
                          <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-white">
                            Recommended
                          </span>
                        )}
                      </div>
                      <ul className="mt-3 space-y-2 text-xs">
                        {plan.bullets.map((bullet) => (
                          <li key={bullet} className="flex items-start gap-2">
                            <span
                              className={`mt-1 h-1.5 w-1.5 rounded-full ${
                                plan.highlight ? "bg-white" : "bg-slate-400"
                              }`}
                            />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
              <span>Upgrade only when you need to export, collaborate, or scale.</span>
              <Link href="/pricing" className="text-slate-700">
                View pricing
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
