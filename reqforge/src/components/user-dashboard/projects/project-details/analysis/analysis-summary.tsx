"use client";

import { useEffect, useState } from "react";

import { AnalysisStatus } from "./analysis-status";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8001";

interface AnalysisSummaryProps {
  projectId: number;
  analysisId: number | null;
}

interface AnalysisResponse {
  id: number;
  project_id: number;
  commit_sha: string;
  analysis_number: number;
  parent_analysis_id: number | null;
  status: string;
  files_scanned: number;
  files_parsed: number;
  files_failed: number;
  unsupported_files: number;
  parse_errors: number;
  started_at: string | null;
  completed_at: string | null;
}

export function AnalysisSummary({
  projectId,
  analysisId,
}: AnalysisSummaryProps) {
  const [analysis, setAnalysis] =
    useState<AnalysisResponse | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!analysisId) {
      setAnalysis(null);
      return;
    }

    let cancelled = false;

    async function loadAnalysis() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_URL}/api/projects/${projectId}/analysis/${analysisId}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error(
            "Unable to load analysis details.",
          );
        }

        const data =
          (await response.json()) as AnalysisResponse;

        if (!cancelled) {
          setAnalysis(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load analysis details.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAnalysis();

    return () => {
      cancelled = true;
    };
  }, [projectId, analysisId]);

  if (!analysisId) {
    return (
      <section className="rounded-2xl border border-[#EAE8F0] bg-white px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#9A96A6]">
              Analysis
            </p>

            <p className="mt-1 text-sm font-semibold text-[#191725]">
              No analysis available
            </p>
          </div>

          <AnalysisStatus
            analysisId={null}
          />
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-[#EAE8F0] bg-white px-5 py-4">
        <div className="animate-pulse">
          <div className="h-3 w-20 rounded bg-[#F1F3F7]" />
          <div className="mt-3 h-5 w-32 rounded bg-[#F1F3F7]" />

          <div className="mt-5 grid grid-cols-4 gap-4">
            <div className="h-10 rounded bg-[#F1F3F7]" />
            <div className="h-10 rounded bg-[#F1F3F7]" />
            <div className="h-10 rounded bg-[#F1F3F7]" />
            <div className="h-10 rounded bg-[#F1F3F7]" />
          </div>
        </div>
      </section>
    );
  }

  if (error || !analysis) {
    return (
      <section className="rounded-2xl border border-[#EAE8F0] bg-white px-5 py-4">
        <p className="text-sm font-semibold text-[#191725]">
          Analysis unavailable
        </p>

        <p className="mt-1 text-xs text-[#9A96A6]">
          {error ??
            "Unable to load this analysis."}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[#EAE8F0] bg-white px-5 py-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#9A96A6]">
            Analysis Summary
          </p>

          <div className="mt-1 flex items-center gap-3">
            <h2 className="text-sm font-semibold text-[#191725]">
              Analysis #{analysis.analysis_number}
            </h2>

            <AnalysisStatus
              analysisId={analysis.id}
              status={analysis.status}
            />
          </div>
        </div>

        <span className="rounded-lg bg-[#F0EAFF] px-2.5 py-1 font-mono text-[11px] font-medium text-[#7547E8]">
          {analysis.commit_sha.slice(0, 7)}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-5 gap-4">
        <Metric
          label="Scanned"
          value={analysis.files_scanned}
        />

        <Metric
          label="Parsed"
          value={analysis.files_parsed}
        />

        <Metric
          label="Failed"
          value={analysis.files_failed}
        />

        <Metric
          label="Unsupported"
          value={analysis.unsupported_files}
        />

        <Metric
          label="Parse Errors"
          value={analysis.parse_errors}
        />
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-[#F1F3F7] px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#9A96A6]">
        {label}
      </p>

      <p className="mt-1 text-lg font-semibold text-[#191725]">
        {value}
      </p>
    </div>
  );
}