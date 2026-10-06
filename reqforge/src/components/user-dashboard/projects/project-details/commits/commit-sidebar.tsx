"use client";

import {
  CheckCircle2,
  ChevronRight,
  GitCommitHorizontal,
  History,
  Loader2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export interface Commit {
  sha: string;
  message: string;
  author: string;
  avatar_url?: string | null;
  created_at: string;
  html_url: string;
}

interface CommitSidebarProps {
  projectId: number;
  selectedCommitSha?: string | null;
  onCommitSelect?: (
    commit: Commit,
    analysisId: number,
  ) => void;
}

interface AnalyzeCommitResponse {
  id: number;
  project_id: number;
  commit_sha: string;
  analysis_number: number;
  status: string;
  existing?: boolean;
}

interface CommitResponse {
  sha: string;
  message?: string;
  author?:| string
    | {
    login?: string;
    avatar_url?: string;
  } | null;
  commit?: {
    message?: string;
    author?: {
      name?: string;
      date?: string;
    } | null;
  };
  html_url: string;
  created_at?: string;
}

export function CommitSidebar({
  projectId,
  selectedCommitSha,
  onCommitSelect,
}: CommitSidebarProps) {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(
    null,
  );

  const [analyzingSha, setAnalyzingSha] =
    useState<string | null>(null);

  const [analysisIds, setAnalysisIds] = useState<
    Record<string, number>
  >({});

  const loadCommits = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/api/projects/${projectId}/commits`,
        {
          credentials: "include",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load commits (${response.status})`,
        );
      }

      const data = await response.json();

      const rawCommits: CommitResponse[] =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.commits)
            ? data.commits
            : [];

      const normalizedCommits: Commit[] =
  rawCommits.map((commit) => ({
    sha: commit.sha,
    message:
      commit.commit?.message ??
      commit.message ??
      "No commit message",

    author:
      typeof commit.author === "string"
        ? commit.author
        : commit.author?.login ??
          commit.commit?.author?.name ??
          "Unknown author",

    avatar_url:
      typeof commit.author === "object" &&
      commit.author !== null
        ? commit.author.avatar_url ?? null
        : null,

    created_at:
      commit.created_at ??
      commit.commit?.author?.date ??
      "",

    html_url: commit.html_url,
  }));

      setCommits(normalizedCommits);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load commits.",
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadCommits();
  }, [loadCommits]);

  async function handleCommitClick(
    commit: Commit,
  ) {
    if (analyzingSha) {
      return;
    }

    setError(null);

    /*
     * If this commit was already analyzed during the
     * current component lifetime, simply switch to it.
     *
     * This avoids another API request.
     */
    const existingAnalysisId =
      analysisIds[commit.sha];

    if (existingAnalysisId) {
      onCommitSelect?.(
        commit,
        existingAnalysisId,
      );
      return;
    }

    setAnalyzingSha(commit.sha);

    try {
      const response = await fetch(
        `${API_URL}/api/projects/${projectId}/analyze-commit/${commit.sha}`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (!response.ok) {
        let message =
          `Failed to analyze commit (${response.status})`;

        try {
          const body = await response.json();

          if (typeof body?.detail === "string") {
            message = body.detail;
          }
        } catch {
          // Keep default error message.
        }

        throw new Error(message);
      }

      const analysis =
        (await response.json()) as AnalyzeCommitResponse;

      /*
       * Store the analysis ID against the commit SHA.
       *
       * This works for both:
       *   existing === true
       *   existing === false
       */
      setAnalysisIds((current) => ({
        ...current,
        [commit.sha]: analysis.id,
      }));

      onCommitSelect?.(
        commit,
        analysis.id,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to analyze commit.",
      );
    } finally {
      setAnalyzingSha(null);
    }
  }

  return (
    <aside className="flex h-[560px] min-h-0 flex-col overflow-hidden rounded-2xl border border-[#EAE8F0] bg-white">
      {/* Header */}
      <div className="shrink-0 border-b border-[#EAE8F0] px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <GitCommitHorizontal className="h-4 w-4 text-[#7547E8]" />

              <h2 className="text-sm font-semibold text-[#191725]">
                Commit History
              </h2>
            </div>

            <p className="mt-1 text-[11px] text-[#9A96A6]">
              Select a commit to analyze
            </p>
          </div>

          {!loading && (
            <span className="rounded-md bg-[#F1F3F7] px-2 py-1 text-[10px] font-semibold text-[#6F6B7D]">
              {commits.length}
            </span>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="shrink-0 border-b border-[#EAE8F0] bg-[#FFF8F8] px-4 py-3">
          <p className="text-xs leading-4 text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() => void loadCommits()}
            className="mt-2 text-[11px] font-semibold text-[#7547E8] hover:text-[#6335D1]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <div className="flex items-center gap-2 text-xs text-[#9A96A6]">
              <Loader2 className="h-4 w-4 animate-spin text-[#7547E8]" />
              Loading commits...
            </div>
          </div>
        ) : commits.length === 0 ? (
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
        ) : (
          <div className="divide-y divide-[#F0EEF4]">
            {commits.map((commit) => {
              const isSelected =
                selectedCommitSha === commit.sha;

              const isAnalyzing =
                analyzingSha === commit.sha;

              const analysisId =
                analysisIds[commit.sha];

              return (
                <button
                  key={commit.sha}
                  type="button"
                  onClick={() =>
                    void handleCommitClick(commit)
                  }
                  disabled={Boolean(analyzingSha)}
                  className={`group w-full px-4 py-3 text-left transition-colors ${
                    isSelected
                      ? "bg-[#F0EAFF]"
                      : "hover:bg-[#FAFAFC]"
                  } disabled:cursor-wait`}
                >
                  <div className="flex items-start gap-3">
                    {/* Commit icon */}
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

                      <div className="mt-1.5 flex items-center gap-2">
                        {commit.avatar_url ? (
                          <img
                            src={commit.avatar_url}
                            alt=""
                            className="h-4 w-4 rounded-full"
                          />
                        ) : (
                          <span className="h-4 w-4 rounded-full bg-[#E7E4EE]" />
                        )}

                        <span className="max-w-[100px] truncate text-[10px] text-[#6F6B7D]">
                          {commit.author}
                        </span>

                        <span className="text-[10px] text-[#C0BCC8]">
                          {formatRelativeDate(
                            commit.created_at,
                          )}
                        </span>
                      </div>

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
            })}
          </div>
        )}
      </div>
    </aside>
  );
}

function formatRelativeDate(
  value: string,
): string {
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

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 30) {
    return `${days}d ago`;
  }

  const months = Math.floor(days / 30);

  if (months < 12) {
    return `${months}mo ago`;
  }

  return `${Math.floor(months / 12)}y ago`;
}