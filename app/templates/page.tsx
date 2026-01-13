"use client";

import React from "react";
import Link from "next/link";

const templates = [
  {
    name: "Bedroom Classic",
    description: "Two-bay wardrobe with drawers and hanging rail.",
    tags: ["Wardrobe", "Bedroom", "Classic"],
  },
  {
    name: "Living Storage",
    description: "Low storage with open shelving and soft doors.",
    tags: ["Storage", "Living Room", "Low profile"],
  },
  {
    name: "Kitchen Cabinet",
    description: "Tall pantry with adjustable shelves.",
    tags: ["Kitchen", "Pantry", "Tall unit"],
  },
];

export default function TemplatesPage() {
  return (
    <main className="min-h-screen bg-[#f2efe9] text-slate-900">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-[#e6b07a] opacity-28 blur-[120px]" />
        <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-[#88bfb5] opacity-28 blur-[120px]" />

        <div className="relative mx-auto max-w-5xl px-6 py-12">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                Templates
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
                Start with a proven layout.
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Choose a template to jump straight into the designer.
              </p>
            </div>
            <Link
              href="/designer"
              className="rounded-full bg-[#2e5d57] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#274f4a]"
            >
              Open designer
            </Link>
          </header>

          <section className="mt-8 grid gap-5 md:grid-cols-2">
            {templates.map((template) => (
              <div
                key={template.name}
                className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur"
              >
                <div className="rounded-2xl bg-slate-100 px-4 py-8 text-center text-xs text-slate-500">
                  Template preview
                </div>
                <h2 className="mt-4 text-lg font-semibold text-slate-900">
                  {template.name}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {template.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-5 flex gap-3">
                  <Link
                    href="/designer"
                    className="rounded-full bg-[#2e5d57] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#274f4a]"
                  >
                    Use template
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Save later
                  </Link>
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
