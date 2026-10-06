"use client";

import { dashboardNavigation } from "@/config/dashboard-navigation";
import { SidebarNavItem } from "./sidebar-nav-item";

interface SidebarNavGroupsProps {
  username: string;
  collapsed: boolean;
}

export function SidebarNavGroups({
  username,
  collapsed,
}: SidebarNavGroupsProps) {
  return (
    <nav className="flex-1 space-y-7 overflow-y-auto overflow-x-hidden px-3 py-6">
      {dashboardNavigation.map((group) => (
        <div key={group.title}>
          {!collapsed && (
            <h3 className="mb-3 px-2 text-[11px] font-bold tracking-[0.14em] text-[#9691A6]">
              {group.title}
            </h3>
          )}

          <div className="space-y-1">
            {group.items.map((item) => (
              <SidebarNavItem
                key={item.label}
                item={item}
                username={username}
                collapsed={collapsed}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}