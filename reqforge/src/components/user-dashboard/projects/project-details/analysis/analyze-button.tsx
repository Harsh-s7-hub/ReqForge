"use client";

import { useState } from "react";

interface AnalyzeButtonProps {
  projectId: number;
  onAnalysisComplete?: (analysis: AnalysisResult) => void;
}

interface AnalysisResult {
  id: number;
  project_id: number;
  commit_sha: string;
  analysis_number: number;
  status: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export function AnalyzeButton({
  projectId,
  onAnalysisComplete,
}: AnalyzeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/api/projects/${projectId}/analyze`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || "Failed to analyze repository."
        );
      }

      onAnalysisComplete?.(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze repository."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleAnalyze}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-[#7547E8] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#6335D1] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        )}

        {loading ? "Analyzing..." : "Analyze Repository"}
      </button>

      {error && (
        <p className="max-w-xs text-right text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}