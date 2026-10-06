"use client";

import { usePathname } from "next/navigation";

import { dashboardNavigation } from "@/config/dashboard-navigation";

import { PageHeading } from "./page-heading";
import { GlobalSearch } from "./global-search";
import { LiveSyncIndicator } from "./live-sync-indicator";
import { NotificationButton } from "./notification-button";

export function DashboardHeader() {
  const pathname = usePathname();

  const currentPage = pathname.split("/").filter(Boolean)[1] ?? "";

  const currentGroup = dashboardNavigation.find((group) =>
    group.items.some((item) => item.href === (currentPage ? `/${currentPage}` : ""))
  );

  const currentItem = currentGroup?.items.find(
    (item) => item.href === (currentPage ? `/${currentPage}` : "")
  );

  const section = currentGroup?.title ?? "MY WORKSPACE";
  const title = currentItem?.label ?? "Page Not Found";
  const subtitle = currentItem?.subtitle ?? "The requested dashboard page could not be found.";

  return (
    <header className="sticky top-0 z-30 border-b border-[#EAE8F0] bg-white/95 backdrop-blur-md">
      <div className="flex min-h-[76px] items-center justify-between gap-5 px-6">

        <PageHeading
          section={section}
          title={title}
          subtitle={subtitle}
        />

        <GlobalSearch />

        <div className="flex shrink-0 items-center gap-3">
          <LiveSyncIndicator status="synced" />
          <NotificationButton />
        </div>

      </div>
    </header>
  );
}