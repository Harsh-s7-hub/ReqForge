"use client";

import { FolderPlus, Plus } from "lucide-react";

interface ProjectEmptyStateProps {
  onCreateProject?: () => void;
}

export function ProjectEmptyState({
  onCreateProject,
}: ProjectEmptyStateProps) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#DCD9E5] bg-white px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0EAFF] text-[#7547E8]">
        <FolderPlus size={25} strokeWidth={1.8} />
      </div>

      <h3 className="mt-5 text-[17px] font-semibold text-[#191725]">
        No projects yet
      </h3>

      <p className="mt-2 max-w-md text-[13px] leading-5 text-[#6F6B7D]">
        Create your first project by connecting a repository and configuring
        how RegForge should analyze and maintain it.
      </p>

      {onCreateProject && (
        <button
          type="button"
          onClick={onCreateProject}
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-[#7547E8] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#6335D1]"
        >
          <Plus size={16} />
          Create Project
        </button>
      )}
    </div>
  );
}