"use client";

import Link from "next/link";
import {
  GitBranch,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

interface SidebarHeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function SidebarHeader({
  collapsed,
  onToggle,
}: SidebarHeaderProps) {
  return (
    <div
      className={`border-b border-[#EAE8F0] ${
        collapsed ? "p-3" : "px-4 py-5"
      }`}
    >
     {/* Brand Header */}
<div
  className={`flex h-12 items-center ${
    collapsed ? "justify-center" : "gap-2"
  }`}
>
  {/* Logo and Brand */}
  <div
    className={`group/logo relative flex min-w-0 items-center ${
      collapsed ? "justify-center" : "flex-1 gap-3"
    }`}
  >
    <Link
      href="/"
      aria-label="RegForge home"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#7547E8] text-white shadow-sm"
    >
      <GitBranch size={23} strokeWidth={2.2} />
    </Link>

    {!collapsed && (
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[19px] font-bold leading-tight tracking-tight text-[#29213F]">
          RegForge
        </span>

        
      </div>
    )}

    {collapsed && (
      <button
        type="button"
        onClick={onToggle}
        title="Expand sidebar"
        aria-label="Expand sidebar"
        className="absolute inset-0 flex items-center justify-center rounded-xl bg-[#29213F]/75 text-white opacity-0 transition-opacity duration-200 group-hover/logo:opacity-100 focus-visible:opacity-100"
      >
        <PanelLeftOpen size={19} />
      </button>
    )}
  </div>

  {/* Collapse Button */}
  {!collapsed && (
    <button
      type="button"
      onClick={onToggle}
      title="Collapse sidebar"
      aria-label="Collapse sidebar"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#858092] transition-colors duration-200 hover:bg-[#F0EAFF] hover:text-[#7547E8]"
    >
      <PanelLeftClose size={19} />
    </button>
  )}
</div>

      {/* Workspace Selector
      {!collapsed && (
        <button
          type="button"
          className="mt-5 flex w-full items-center justify-between rounded-xl border border-[#EAE8F0] bg-[#FAF9FC] px-3 py-2.5 text-left transition-colors duration-200 hover:bg-[#F7F5FB]"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F0EAFF] text-[#7547E8]">
              <GitBranch size={16} />
            </div>

            <div className="flex min-w-0 flex-col">
              <span className="truncate text-xs font-semibold text-[#29213F]">
                Personal Workspace
              </span>

              <span className="text-[10px] text-[#9691A2]">
                Free Plan
              </span>
            </div>
          </div>
        </button>
      )} */}
    </div>
  );
}