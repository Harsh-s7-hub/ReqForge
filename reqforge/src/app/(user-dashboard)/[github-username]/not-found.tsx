"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GitBranch, ArrowLeft, Home } from "lucide-react";

export default function DashboardNotFound() {
  const pathname = usePathname();
  const username = pathname.split("/")[1] || "";

  return (
    <div className="flex min-h-[calc(100vh-48px)] items-center justify-center">
      <div className="w-full max-w-lg text-center">

        <div className="relative mx-auto mb-8 flex h-40 w-40 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#F0EAFF]" />
          <div className="absolute inset-4 rounded-full border border-dashed border-[#C9B8F5]" />

          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-lg shadow-[#7547E8]/10">
            <GitBranch size={42} className="text-[#7547E8]" />
          </div>

          <span className="absolute -right-1 top-5 rounded-lg bg-[#7547E8] px-3 py-1.5 text-sm font-bold text-white shadow-md">
            404
          </span>
        </div>

        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#7547E8]">
          Page not found
        </p>

        <h1 className="text-4xl font-bold tracking-tight text-[#29213F]">
          Lost in the workflow?
        </h1>

        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-[#6F6B7D]">
          The page you're looking for doesn't exist or may have been moved.
          Let's get you back to your workspace.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href={`/${encodeURIComponent(username)}`}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#7547E8] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#6335D1]"
          >
            <Home size={16} />
            Back to Overview
          </Link>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#EAE8F0] bg-white px-5 text-sm font-semibold text-[#6F6B7D] transition-colors hover:bg-[#F7F5FB]"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>

        <p className="mt-12 text-xs text-[#9A96A6]">
          RegForge · AI Engineering Platform
        </p>
      </div>
    </div>
  );
}