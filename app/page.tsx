import React from "react";
import Link from "next/link";
import { Manrope, Newsreader } from "next/font/google";

const bodyFont = Manrope({ subsets: ["latin"], weight: ["400", "500", "600"] });
const displayFont = Newsreader({ subsets: ["latin"], weight: ["400", "600"] });

export default function StartPage() {
  return (
    <main className={`${bodyFont.className} min-h-screen bg-[#f2efe9] text-slate-900`}>
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
        <div className="pointer-events-none absolute -left-40 top-6 h-96 w-96 rounded-full bg-[#e6b07a] opacity-28 blur-[160px]" />
        <div className="pointer-events-none absolute -right-32 bottom-10 h-96 w-96 rounded-full bg-[#88bfb5] opacity-28 blur-[160px]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(30,41,59,0.06),_transparent_55%)]" />

        <div className="relative flex w-full max-w-2xl flex-col items-center gap-6 text-center">
          <div className="flex items-center gap-3 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#2e5d57]" />
            Planner beta
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
              Wardrobe Studio
            </p>
            <h1
              className={`${displayFont.className} mt-4 text-4xl font-semibold text-slate-900 sm:text-5xl`}
            >
              Design your wardrobe.
            </h1>
            <p className="mt-3 text-base text-slate-600 sm:text-lg">
              A calm, modular space to plan storage that fits real life.
            </p>
          </div>

          <div className="mt-2 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/templates"
              className="rounded-full bg-[#2e5d57] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#274f4a]"
            >
              Start with template
            </Link>
            <Link
              href="/designer"
              className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300"
            >
              Start from scratch
            </Link>
          </div>

          <p className="text-xs text-slate-500">
            You can save later. No login required.
          </p>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-12 w-48 items-end justify-between rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-sm">
              <div className="h-6 w-6 rounded-md bg-[#2e5d57]" />
              <div className="h-9 w-6 rounded-md bg-[#e6b07a]" />
              <div className="h-7 w-6 rounded-md bg-[#88bfb5]" />
              <div className="h-10 w-6 rounded-md bg-[#2e5d57]" />
            </div>
            <div className="text-left text-xs text-slate-500">
              <p className="font-semibold text-slate-700">Modular blocks</p>
              <p>Stack, swap, refine.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
            <Link href="/login" className="text-slate-700">
              Log in to save projects
            </Link>
            <Link href="/pricing" className="text-slate-700">
              Pricing
            </Link>
            <Link href="/projects" className="text-slate-700">
              Projects
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
