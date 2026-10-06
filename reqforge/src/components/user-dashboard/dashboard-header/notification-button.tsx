"use client";

import { Bell } from "lucide-react";

export function NotificationButton() {
  return (
    <button
      type="button"
      aria-label="Notifications"
      title="Notifications"
      className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[#858092] transition-colors hover:bg-[#F0EAFF] hover:text-[#7547E8]"
    >
      <Bell size={19} />

      <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#7547E8]" />
    </button>
  );
}