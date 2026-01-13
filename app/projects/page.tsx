"use client";

import React from "react";
import Link from "next/link";

const projects = [
  {
    name: "Starter Bedroom",
    room: "Bedroom",
    updated: "Today",
  },
  {
    name: "Studio Entry",
    room: "Hallway",
    updated: "Yesterday",
  },
];

const quickActions = [
  {
    label: "Create empty wardrobe",
    href: "/designer",
  },
  {
    label: "Start from template",
    href: "/templates",
  },
  {
    label: "Combine wardrobes",
    href: "/designer",
    hint: "Coming soon",
  },
];

const templatePreview = [
  { name: "Bedroom Classic", tone: "Warm oak" },
  { name: "Living Storage", tone: "Soft white" },
  { name: "Kitchen Cabinet", tone: "Graphite" },
];

export default function ProjectsPage() {
  return (
    <main className="min-h-screen bg-[#f2efe9] text-slate-900">
      <div className="relative">
        <div className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-[#e6b07a] opacity-28 blur-[140px]" />
        <div className="pointer-events-none absolute -right-32 bottom-10 h-80 w-80 rounded-full bg-[#88bfb5] opacity-28 blur-[150px]" />

        <div className="relative mx-auto max-w-6xl px-6 pb-12 pt-8">
          <header className="flex flex-col gap-3 border-b border-slate-200/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-slate-900 text-white">
                <span className="flex h-full w-full items-center justify-center text-xs font-semibold">
                  WS
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Wardrobe Studio
                </p>
                <p className="text-xs text-slate-500">Projects</p>
              </div>
            </div>
            <nav className="flex flex-wrap items-center gap-3 text-sm">
              <Link href="/projects" className="font-semibold text-slate-900">
                Projects
              </Link>
              <Link href="/templates" className="text-slate-600 hover:text-slate-900">
                Templates
              </Link>
              <Link href="/pricing" className="text-slate-600 hover:text-slate-900">
                Pricing
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:border-slate-300"
              >
                Log in
              </Link>
            </nav>
          </header>

          <section className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
            <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold text-slate-900">Projects</h1>
                <Link
                  href="/designer"
                  className="rounded-full bg-[#2e5d57] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#274f4a]"
                >
                  + New Project
                </Link>
              </div>

              <div className="mt-4 grid gap-3">
                {projects.map((project) => (
                  <div
                    key={project.name}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {project.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {project.room} · Updated {project.updated}
                      </p>
                    </div>
                    <Link
                      href="/designer"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Open →
                    </Link>
                  </div>
                ))}
                <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-4 text-sm text-slate-500">
                  No projects yet — create your first wardrobe.
                </div>
              </div>
            </div>

            <aside className="flex flex-col gap-4">
              <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900">Quick start</h2>
                <div className="mt-3 flex flex-col gap-2">
                  {quickActions.map((action) => (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300"
                    >
                      <span>{action.label}</span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                        {action.hint ?? "Open"}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Templates preview
                  </h2>
                  <Link
                    href="/templates"
                    className="text-xs font-semibold text-slate-600"
                  >
                    Browse all →
                  </Link>
                </div>
                <div className="mt-3 grid gap-3">
                  {templatePreview.map((template) => (
                    <div
                      key={template.name}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-900">
                          {template.name}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {template.tone}
                        </span>
                      </div>
                      <div className="mt-2 h-14 rounded-lg bg-slate-100" />
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </section>
        </div>
      </div>
    </main>
  );
}
