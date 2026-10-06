"use client";

import {
  CalendarDays,
  CheckCircle2,
  GitCommitHorizontal,
  History,
  UserRound,
} from "lucide-react";

import type { Commit } from "./commit-sidebar";

interface CommitDetailsProps {
  commit: Commit | null;
  analysisId?: number | null;
  analyzing?: boolean;
  isCurrent?: boolean;
}

export function CommitDetails({
  commit,
  analysisId,
  analyzing = false,
  isCurrent = false,
}: CommitDetailsProps) {
  if (!commit) {
    return (
      <div className="rounded-2xl border border-[#EAE8F0] bg-white p-5">
        <div className="flex min-h-[180px] items-center justify-center text-center">
          <div>
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1F3F7]">
              <GitCommitHorizontal className="h-5 w-5 text-[#9A96A6]" />
            </div>

            <p className="mt-3 text-sm font-semibold text-[#191725]">
              No commit selected
            </p>

            <p className="mt-1 text-xs text-[#9A96A6]">
              Select a commit from the history to view
              its details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = formatCommitDate(
    commit.created_at,
  );

  const analyzed = Boolean(analysisId);

  return (
    <div className="rounded-2xl border border-[#EAE8F0] bg-white p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {commit.avatar_url ? (
            <img
              src={commit.avatar_url}
              alt=""
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F0EAFF]">
              <UserRound className="h-4 w-4 text-[#7547E8]" />
            </div>
          )}

          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#191725]">
              {commit.author}
            </p>

            <p className="mt-0.5 text-[11px] text-[#9A96A6]">
              Commit author
            </p>
          </div>
        </div>

        {/* Analysis status */}
        {analyzing ? (
          <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#F0EAFF] px-2.5 py-1.5">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#DCD3F8] border-t-[#7547E8]" />

            <span className="text-[10px] font-semibold text-[#7547E8]">
              Analyzing
            </span>
          </div>
        ) : isCurrent ? (
          <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#EFFBFD] px-2.5 py-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#16AFC5]" />

            <span className="text-[10px] font-semibold text-[#1394A8]">
              Current Analysis
            </span>
          </div>
        ) : analyzed ? (
          <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#F7F3FD] px-2.5 py-1.5">
            <History className="h-3.5 w-3.5 text-[#8057AE]" />

            <span className="text-[10px] font-semibold text-[#8057AE]">
              Historical
            </span>
          </div>
        ) : (
          <div className="shrink-0 rounded-lg bg-[#F1F3F7] px-2.5 py-1.5">
            <span className="text-[10px] font-semibold text-[#6F6B7D]">
              Not analyzed
            </span>
          </div>
        )}
      </div>

      {/* Commit message */}
      <div className="mt-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9A96A6]">
          Commit Message
        </p>

        <p className="mt-1.5 text-sm font-semibold leading-5 text-[#191725]">
          {commit.message}
        </p>
      </div>

      {/* Metadata */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <MetadataItem
          icon={GitCommitHorizontal}
          label="SHA"
          value={commit.sha.slice(0, 12)}
          mono
        />

        <MetadataItem
          icon={CalendarDays}
          label="Created"
          value={formattedDate}
        />
      </div>

      {/* Analysis information */}
      {analysisId && (
        <div className="mt-3 rounded-xl bg-[#F1F3F7] px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#9A96A6]">
                Analysis ID
              </p>

              <p className="mt-1 font-mono text-xs font-semibold text-[#191725]">
                #{analysisId}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#9A96A6]">
                Version
              </p>

              <p className="mt-1 text-xs font-semibold text-[#191725]">
                {isCurrent
                  ? "Current"
                  : "Historical"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* GitHub link */}
      <a
        href={commit.html_url}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center text-xs font-medium text-[#7547E8] transition-colors hover:text-[#6335D1]"
      >
        View commit on GitHub
      </a>
    </div>
  );
}

function MetadataItem({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: typeof GitCommitHorizontal;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl bg-[#F1F3F7] px-3 py-2.5">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-[#9A96A6]" />

        <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#9A96A6]">
          {label}
        </span>
      </div>

      <p
        className={`mt-1.5 truncate text-xs font-semibold text-[#191725] ${
          mono ? "font-mono" : ""
        }`}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

function formatCommitDate(
  value: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}