"use client";

import { SidebarHeader } from "./sidebar-header";
import { SidebarNavGroups } from "./sidebar-nav-groups";
import { SidebarFooter } from "./sidebar-footer";

interface AppSidebarProps {
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  profileUrl?: string | null;
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({
  username,
  displayName,
  avatarUrl,
  profileUrl,
  collapsed,
  onToggle,
}: AppSidebarProps) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[#EAE8F0] bg-white transition-[width] duration-300 ease-in-out ${
        collapsed ? "w-[72px]" : "w-[240px]"
      }`}
    >
      <SidebarHeader
        collapsed={collapsed}
        onToggle={onToggle}
      />

      <SidebarNavGroups
        username={username}
        collapsed={collapsed}
      />

      <SidebarFooter
        username={username}
        displayName={displayName}
        avatarUrl={avatarUrl}
        profileUrl={profileUrl}
        collapsed={collapsed}
      />
    </aside>
  );
}