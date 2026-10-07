"use client";

import {
  CheckCircle2,
  ChevronRight,
  GitCommitHorizontal,
  History,
  Loader2,
} from "lucide-react";

import type { Commit } from "./commit-sidebar";

interface CommitItemProps {
  commit: Commit;
  isSelected: boolean;
  isAnalyzing: boolean;
  analysisId?: number;
  disabled?: boolean;
  onClick: (commit: Commit) => void;
}

export function CommitItem({
  commit,
  isSelected,
  isAnalyzing,
  analysisId,
  disabled = false,
  onClick,
}: CommitItemProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(commit)}
      disabled={disabled}
      className={`group w-full px-4 py-3 text-left transition-colors ${
        isSelected
          ? "bg-[#F0EAFF]"
          : "hover:bg-[#FAFAFC]"
      } disabled:cursor-wait`}
    >
      <div className="flex items-start gap-3">
        {/* Commit status */}
        <div
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
            isSelected
              ? "bg-[#7547E8]"
              : "bg-[#F1F3F7]"
          }`}
        >
          {isAnalyzing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
          ) : analysisId ? (
            isSelected ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
            ) : (
              <History className="h-3.5 w-3.5 text-[#8057AE]" />
            )
          ) : (
            <GitCommitHorizontal
              className={`h-3.5 w-3.5 ${
                isSelected
                  ? "text-white"
                  : "text-[#7547E8]"
              }`}
            />
          )}
        </div>

        {/* Commit content */}
        <div className="min-w-0 flex-1">
          <p
            className={`line-clamp-2 text-xs font-semibold leading-4 ${
              isSelected
                ? "text-[#6335D1]"
                : "text-[#191725]"
            }`}
            title={commit.message}
          >
            {commit.message}
          </p>

          {/* Author */}
          <div className="mt-1.5 flex items-center gap-2">
            {commit.avatar_url ? (
              <img
                src={commit.avatar_url}
                alt={`${commit.author} avatar`}
                className="h-4 w-4 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#E7E4EE]">
                <span className="text-[7px] font-semibold text-[#7547E8]">
                  {getInitial(commit.author)}
                </span>
              </div>
            )}

            <span
              className="max-w-[110px] truncate text-[10px] text-[#6F6B7D]"
              title={commit.author}
            >
              {commit.author}
            </span>

            <span className="text-[10px] text-[#C0BCC8]">
              {formatRelativeDate(
                commit.created_at,
              )}
            </span>
          </div>

          {/* SHA + analysis */}
          <div className="mt-1.5 flex items-center gap-2">
            <span className="font-mono text-[9px] text-[#9A96A6]">
              {commit.sha.slice(0, 7)}
            </span>

            {analysisId && (
              <span
                className={`text-[9px] font-semibold ${
                  isSelected
                    ? "text-[#6335D1]"
                    : "text-[#8057AE]"
                }`}
              >
                Analysis #{analysisId}
              </span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight
          className={`mt-1 h-4 w-4 shrink-0 transition-transform ${
            isSelected
              ? "translate-x-0 text-[#7547E8]"
              : "text-[#C5C1CC] group-hover:translate-x-0.5 group-hover:text-[#7547E8]"
          }`}
        />
      </div>
    </button>
  );
}

function getInitial(author: string): string {
  const value = author.trim();

  if (!value) {
    return "?";
  }

  return value.charAt(0).toUpperCase();
}

function formatRelativeDate(value: string): string {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  const diff =
    Date.now() - date.getTime();

  const minutes = Math.floor(
    diff / (1000 * 60),
  );

  if (minutes < 1) {
    return "just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(
    minutes / 60,
  );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(
    hours / 24,
  );

  if (days < 30) {
    return `${days}d ago`;
  }

  const months = Math.floor(
    days / 30,
  );

  if (months < 12) {
    return `${months}mo ago`;
  }

  return `${Math.floor(months / 12)}y ago`;
}