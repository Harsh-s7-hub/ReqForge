"use client";

import { Download, RefreshCw } from "lucide-react";
import type { DaemonStatus } from "../types";

interface ModelsHeaderProps {
  daemon?: DaemonStatus;
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenPullDialog: () => void;
}

export function ModelsHeader({
  isRefreshing,
  onRefresh,
  onOpenPullDialog,
}: ModelsHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-2xl font-bold tracking-tight text-[#191725]">
        AI Models & Inference Engines
      </h1>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-[#EAE8F0] bg-white px-4 py-2.5 text-sm font-medium text-[#191725] transition hover:bg-[#F9F8FB] hover:border-[#D6D3E6] disabled:opacity-60 cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 text-[#6F6B7D] ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Rescan Daemon</span>
        </button>

        <button
          type="button"
          onClick={onOpenPullDialog}
          className="inline-flex items-center gap-2 rounded-lg bg-[#7547E8] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#6335D1] shadow-xs cursor-pointer"
        >
          <Download className="h-4 w-4" />
          <span>Pull New Model</span>
        </button>
      </div>
    </div>
  );
}
