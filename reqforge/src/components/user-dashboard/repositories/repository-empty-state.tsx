"use client";

import { FolderGit2, Plus } from "lucide-react";

interface RepositoryEmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function RepositoryEmptyState({
  title = "No repositories found",
  description = "Connect your GitHub account and select repositories to start using RegForge.",
  actionLabel = "Connect GitHub",
  onAction,
}: RepositoryEmptyStateProps) {
  return (
    <div
      className="
        flex
        min-h-[280px]
        flex-col
        items-center
        justify-center
        rounded-2xl
        border
        border-dashed
        border-[#DCD9E5]
        bg-white
        px-6
        py-10
        text-center
      "
    >
      <div
        className="
          flex
          h-12
          w-12
          items-center
          justify-center
          rounded-xl
          bg-[#F0EAFF]
          text-[#7547E8]
        "
      >
        <FolderGit2 className="h-5 w-5" />
      </div>

      <h3 className="mt-4 text-[15px] font-semibold text-[#191725]">
        {title}
      </h3>

      <p className="mt-2 max-w-md text-[13px] leading-5 text-[#6F6B7D]">
        {description}
      </p>

      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="
            mt-5
            inline-flex
            items-center
            gap-2
            rounded-lg
            bg-[#7547E8]
            px-4
            py-2.5
            text-[12px]
            font-semibold
            text-white
            transition-colors
            hover:bg-[#6335D1]
          "
        >
          <Plus className="h-3.5 w-3.5" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}