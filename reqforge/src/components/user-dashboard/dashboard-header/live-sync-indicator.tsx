import { RefreshCw } from "lucide-react";

interface LiveSyncIndicatorProps {
  status?: "synced" | "syncing" | "offline";
}

const statusConfig = {
  synced: {
    label: "Live Sync",
    container: "border-[#D9F3F5] bg-[#E6F9FA]",
    text: "text-[#188D99]",
    icon: "text-[#159BA8]",
    dot: "bg-[#16CFEA]",
  },
  syncing: {
    label: "Syncing",
    container: "border-[#E8E0FA] bg-[#F3EEFF]",
    text: "text-[#7547E8]",
    icon: "text-[#7547E8]",
    dot: "bg-[#7547E8]",
  },
  offline: {
    label: "Offline",
    container: "border-[#F1DADA] bg-[#FFF1F1]",
    text: "text-[#C65353]",
    icon: "text-[#C65353]",
    dot: "bg-[#C65353]",
  },
};

export function LiveSyncIndicator({
  status = "synced",
}: LiveSyncIndicatorProps) {
  const config = statusConfig[status];

  return (
    <div
      className={`flex h-9 items-center gap-2 rounded-full border px-3 ${config.container}`}
      role="status"
      aria-live="polite"
    >
      <RefreshCw
        size={14}
        className={`shrink-0 ${config.icon} ${
          status === "syncing"
            ? "animate-spin"
            : status === "synced"
              ? "animate-[spin_3s_linear_infinite]"
              : ""
        }`}
      />

      <span className={`text-[11px] font-semibold ${config.text}`}>
        {config.label}
      </span>

      <span className="relative ml-0.5 flex h-2 w-2">
        {status === "synced" && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full ${config.dot} opacity-50`}
          />
        )}

        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${config.dot}`}
        />
      </span>
    </div>
  );
}