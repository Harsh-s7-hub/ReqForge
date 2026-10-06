"use client";

interface SidebarFooterProps {
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  profileUrl?: string | null;
  collapsed: boolean;
}

export function SidebarFooter({
  username,
  displayName,
  avatarUrl,
  profileUrl,
  collapsed,
}: SidebarFooterProps) {
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="border-t border-[#EAE8F0] p-3">
      <a
        href={profileUrl || `https://github.com/${username}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open ${displayName}'s GitHub profile`}
        className={`group flex items-center rounded-xl py-2 transition-colors duration-200 hover:bg-[#F0EAFF] ${
          collapsed ? "justify-center" : "gap-3 px-2"
        }`}
      >
        {/* GitHub Avatar */}
        {avatarUrl?.trim() ? (
          <img
            src={avatarUrl}
            alt={`${displayName}'s GitHub avatar`}
            width={36}
            height={36}
            referrerPolicy="no-referrer"
            className="h-9 w-9 shrink-0 rounded-full border border-[#EAE8F0] object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F0EAFF] text-xs font-bold text-[#7547E8]">
            {initials || "RF"}
          </div>
        )}

        {/* User Information */}
        {!collapsed && (
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-xs font-semibold text-[#29213F] transition-colors duration-200 group-hover:text-[#7547E8]">
              {displayName}
            </span>

            <span className="truncate text-[10px] text-[#9691A6] transition-colors duration-200 group-hover:text-[#7547E8]">
              @{username}
            </span>
          </div>
        )}
      </a>
    </div>
  );
}