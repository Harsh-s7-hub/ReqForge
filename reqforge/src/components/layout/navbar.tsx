"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { HeroActions } from "@/components/landing/hero-actions";
import { brand, mainNavigation } from "@/config/navigation";
import { cn } from "@/lib/utils";

function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg",
        "bg-gradient-to-br from-cyan-300/30 via-violet-500/40 to-indigo-700/50",
        "ring-1 ring-white/20",
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" className="h-5 w-5 text-white" fill="none">
        <path
          d="M8 22V10l8-4 8 4v12l-8 4-8-4Z"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.9"
        />
        <path
          d="M16 6v20M8 10l8 4 8-4M8 22l8-4 8 4"
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.7"
        />
      </svg>
    </span>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative z-50 mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6 lg:px-8">
      <nav
        aria-label="Primary"
        className={cn(
          "glass-panel relative flex items-center justify-between gap-3 rounded-full px-4 py-2.5 sm:px-6",
          "shadow-[0_10px_35px_rgba(0,0,0,0.4)]",
        )}
      >
        {/* Brand */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition-opacity hover:opacity-90"
        >
          <BrandMark />
          <span className="text-[15px] font-medium tracking-wide text-white sm:text-base">
            {brand.name}
          </span>
        </Link>

        {/* Desktop navigation */}
        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 lg:flex">
          {mainNavigation.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="rounded-full px-3.5 py-1.5 text-[13px] font-normal tracking-wide text-[#d2c7e0] transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop GitHub CTA */}
        <div className="hidden shrink-0 sm:block">
          <HeroActions className="[&>a]:h-9 [&>a]:min-w-0 [&>a]:px-4 [&>a]:text-xs" />
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen(!open)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 sm:hidden"
        >
          {open ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </nav>

      {/* Mobile navigation */}
      {open && (
        <div
          id="mobile-nav"
          className="glass-panel mt-3 overflow-hidden rounded-2xl sm:hidden"
        >
          <ul className="flex flex-col gap-1 p-3">
            {mainNavigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-xl px-3 py-2.5 text-sm text-[#c9bdd8] transition hover:bg-white/5 hover:text-white"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}

            {/* Mobile GitHub CTA */}
            <li className="pt-2">
              <HeroActions />
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
