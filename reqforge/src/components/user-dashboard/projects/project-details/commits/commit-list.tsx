"use client";

import {
  GitCommitHorizontal,
  Loader2,
} from "lucide-react";

import type { Commit } from "./commit-sidebar";
import { CommitItem } from "./commit-item";

interface CommitListProps {
  commits: Commit[];
  loading: boolean;
  analyzingSha: string | null;
  selectedCommitSha?: string | null;
  analysisIds: Record<string, number>;
  onCommitClick: (commit: Commit) => void;
}

export function CommitList({
  commits,
  loading,
  analyzingSha,
  selectedCommitSha,
  analysisIds,
  onCommitClick,
}: CommitListProps) {
  if (loading) {
    return (
      <div className="flex min-h-[220px] items-center justify-center">
        <div className="flex items-center gap-2 text-xs text-[#9A96A6]">
          <Loader2 className="h-4 w-4 animate-spin text-[#7547E8]" />
          Loading commits...
        </div>
      </div>
    );
  }

  if (commits.length === 0) {
    return (
      <div className="flex min-h-[220px] items-center justify-center px-5 text-center">
        <div>
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1F3F7]">
            <GitCommitHorizontal className="h-5 w-5 text-[#9A96A6]" />
          </div>

          <p className="mt-3 text-sm font-semibold text-[#191725]">
            No commits found
          </p>

          <p className="mt-1 text-xs leading-4 text-[#9A96A6]">
            This repository does not have any
            accessible commits yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
      <div className="divide-y divide-[#F0EEF4]">
        {commits.map((commit) => (
          <CommitItem
            key={commit.sha}
            commit={commit}
            isSelected={
              selectedCommitSha === commit.sha
            }
            isAnalyzing={
              analyzingSha === commit.sha
            }
            analysisId={
              analysisIds[commit.sha]
            }
            disabled={Boolean(analyzingSha)}
            onClick={onCommitClick}
          />
        ))}
      </div>
    </div>
  );
}