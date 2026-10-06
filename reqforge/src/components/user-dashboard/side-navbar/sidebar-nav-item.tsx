"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { DashboardNavItem } from "@/config/dashboard-navigation";

interface SidebarNavItemProps {
  item: DashboardNavItem;
  username: string;
  collapsed: boolean;
}

export function SidebarNavItem({
  item,
  username,
  collapsed,
}: SidebarNavItemProps) {
  const pathname = usePathname();

  const basePath = `/${username}`;
  const href = item.href ? `${basePath}${item.href}` : basePath;

  const isActive =
    item.href === ""
      ? pathname === basePath
      : pathname === href || pathname.startsWith(`${href}/`);

  const Icon = item.icon;

  return (
    <Link
      href={href}
      title={collapsed ? item.label : undefined}
      aria-label={item.label}
      aria-current={isActive ? "page" : undefined}
      className={`group relative flex h-11 items-center rounded-xl text-sm font-medium transition-all duration-200 ${
        collapsed
          ? "justify-center px-0"
          : "gap-3 px-3"
      } ${
        isActive
          ? "bg-[#F0EAFF] text-[#7547E8]"
          : "text-[#6F6B7D] hover:bg-[#F7F5FB] hover:text-[#7547E8]"
      }`}
    >
      {isActive && (
        <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-[#7547E8]" />
      )}

      <Icon className="h-[19px] w-[19px] shrink-0" />

      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 truncate">
            {item.label}
          </span>
        </>
      )}

      {collapsed && (
        <span className="pointer-events-none absolute left-[calc(100%+12px)] z-50 whitespace-nowrap rounded-md bg-[#29213F] px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          {item.label}
        </span>
      )}
    </Link>
  );
}