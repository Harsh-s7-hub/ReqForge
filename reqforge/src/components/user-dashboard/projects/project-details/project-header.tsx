"use client";

import type { ReactNode } from "react";

import type { Project } from "../types";

interface ProjectHeaderProps {
  project: Project;
  children?: ReactNode;
}

export function ProjectHeader({
  project,
  children,
}: ProjectHeaderProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#EAE8F0] bg-white px-6 py-5">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold text-[#191725]">
          {project.name}
        </h1>

        <p className="mt-1 truncate text-sm text-[#6F6B7D]">
          {project.repositoryName}
        </p>

        {project.description && (
          <p className="mt-2 max-w-2xl text-sm text-[#9A96A6]">
            {project.description}
          </p>
        )}
      </div>

      {children}
    </div>
  );
}