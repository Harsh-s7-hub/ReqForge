"use client";

import {
  GitCommitHorizontal,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { CommitList } from "./commit-list";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8001";

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

  author?:
    | string
    | {
        login?: string;
        name?: string;
        avatar_url?: string;
      }
    | null;

  committer?:
    | string
    | {
        login?: string;
        name?: string;
        avatar_url?: string;
      }
    | null;

  commit?: {
    message?: string;

    author?: {
      name?: string;
      email?: string;
      date?: string;
    } | null;

    committer?: {
      name?: string;
      email?: string;
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
  const [commits, setCommits] =
    useState<Commit[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [analyzingSha, setAnalyzingSha] =
    useState<string | null>(null);

  const [analysisIds, setAnalysisIds] =
    useState<Record<string, number>>({});

  const loadCommits = useCallback(
    async () => {
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

        const data =
          await response.json();

        const rawCommits: CommitResponse[] =
          Array.isArray(data)
            ? data
            : Array.isArray(data?.commits)
              ? data.commits
              : [];

        const normalizedCommits =
          rawCommits.map(
            normalizeCommit,
          );

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
    },
    [projectId],
  );

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
     * If already analyzed during the
     * current component lifetime, just
     * switch to that analysis.
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
          const body =
            await response.json();

          if (
            typeof body?.detail ===
            "string"
          ) {
            message = body.detail;
          }
        } catch {
          // Keep default message.
        }

        throw new Error(message);
      }

      const analysis =
        (await response.json()) as AnalyzeCommitResponse;

      setAnalysisIds(
        (current) => ({
          ...current,
          [commit.sha]:
            analysis.id,
        }),
      );

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
            onClick={() =>
              void loadCommits()
            }
            className="mt-2 text-[11px] font-semibold text-[#7547E8] hover:text-[#6335D1]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Commit list */}
      <CommitList
        commits={commits}
        loading={loading}
        analyzingSha={analyzingSha}
        selectedCommitSha={
          selectedCommitSha
        }
        analysisIds={analysisIds}
        onCommitClick={
          handleCommitClick
        }
      />
    </aside>
  );
}

function normalizeCommit(
  commit: CommitResponse,
): Commit {
  const githubAuthor =
    normalizeGitHubUser(
      commit.author,
    );

  const githubCommitter =
    normalizeGitHubUser(
      commit.committer,
    );

  const author =
    githubAuthor?.login ??
    githubAuthor?.name ??
    githubCommitter?.login ??
    githubCommitter?.name ??
    commit.commit?.author?.name ??
    commit.commit?.committer?.name ??
    (typeof commit.author === "string"
      ? commit.author
      : null) ??
    "Unknown author";

  const avatarUrl =
    githubAuthor?.avatar_url ??
    githubCommitter?.avatar_url ??
    null;

  const createdAt =
    commit.created_at ??
    commit.commit?.author?.date ??
    commit.commit?.committer?.date ??
    "";

  return {
    sha: commit.sha,
    message:
      commit.commit?.message ??
      commit.message ??
      "No commit message",
    author,
    avatar_url: avatarUrl,
    created_at: createdAt,
    html_url: commit.html_url,
  };
}

function normalizeGitHubUser(
  value:
    | string
    | {
        login?: string;
        name?: string;
        avatar_url?: string;
      }
    | null
    | undefined,
) {
  if (!value || typeof value === "string") {
    return null;
  }

  return value;
}