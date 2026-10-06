"use client";

import {
  Braces,
  Box,
  FileCode2,
  FolderGit2,
  GitBranch,
} from "lucide-react";

const legendItems = [
  {
    label: "Project",
    icon: FolderGit2,
    iconColor: "text-[#7547E8]",
    background: "bg-[#F0EAFF]",
  },
  {
    label: "Analysis",
    icon: GitBranch,
    iconColor: "text-[#1394A8]",
    background: "bg-[#EFFBFD]",
  },
  {
    label: "File",
    icon: FileCode2,
    iconColor: "text-[#6F6B7D]",
    background: "bg-[#F7F7F9]",
  },
  {
    label: "Class",
    icon: Box,
    iconColor: "text-[#5279B9]",
    background: "bg-[#F3F7FD]",
  },
  {
    label: "Function",
    icon: Braces,
    iconColor: "text-[#8057AE]",
    background: "bg-[#F7F3FD]",
  },
];

export function GraphLegend() {
  return (
    <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-xl border border-[#EAE8F0] bg-white px-3 py-2 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9A96A6]">
          Legend
        </span>

        {legendItems.map(
          ({
            label,
            icon: Icon,
            iconColor,
            background,
          }) => (
            <div
              key={label}
              className="flex items-center gap-1.5"
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-md ${background}`}
              >
                <Icon
                  className={`h-3.5 w-3.5 ${iconColor}`}
                />
              </span>

              <span className="text-[10px] font-medium text-[#6F6B7D]">
                {label}
              </span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}