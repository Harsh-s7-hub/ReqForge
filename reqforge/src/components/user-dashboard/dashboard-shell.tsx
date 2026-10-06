"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";

import { AppSidebar } from "./side-navbar/app-sidebar";
import { DashboardHeader } from "./dashboard-header/dashboard-header";
interface DashboardShellProps {
  children: ReactNode;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  profileUrl?: string | null;
}

export function DashboardShell({
  children,
  username,
  displayName,
  avatarUrl,
  profileUrl,
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Keyboard shortcut: Ctrl + Shift + S (Windows/Linux)
  // Cmd + Shift + S (Mac)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isToggleShortcut =
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === "s";

      if (!isToggleShortcut) return;

      // Avoid triggering while typing.
      const target = event.target as HTMLElement;

      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      event.preventDefault();
      setCollapsed((previous) => !previous);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F7FB]">
      <AppSidebar
        username={username}
        displayName={displayName}
        avatarUrl={avatarUrl}
        profileUrl={profileUrl}
        collapsed={collapsed}
        onToggle={() => setCollapsed((previous) => !previous)}
      />

      <main
  className={`min-h-screen transition-[padding] duration-300 ease-in-out ${
    collapsed ? "pl-[72px]" : "pl-[240px]"
  }`}
>
  <DashboardHeader />

  <div className="min-h-screen p-6">
    {children}
  </div>
</main>
    </div>
  );
}