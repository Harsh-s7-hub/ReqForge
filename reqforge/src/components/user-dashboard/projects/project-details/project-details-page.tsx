"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { useDashboardData } from "@/components/user-dashboard/dashboard-data-provider";

import { AnalysisSummary } from "./analysis/analysis-summary";
import { AnalyzeButton } from "./analysis/analyze-button";
import { CommitDetails } from "./commits/commit-details";
import {
  CommitSidebar,
  type Commit,
} from "./commits/commit-sidebar";
import { SourceGraph } from "./graph/source-graph";
import { ProjectHeader } from "./project-header";
import { ProjectOverview } from "./project-overview";
import { GenerateDocumentationButton } from "@/components/user-dashboard/documentations/generate-documentation-button";
import { GitHubActionDialog } from "./github-action-dialog";
import type { ProjectDocumentationStatus } from "@/components/user-dashboard/documentations/types";

interface ProjectDetailsPageProps {
  projectId: number;
}

export function ProjectDetailsPage({
  projectId,
}: ProjectDetailsPageProps) {
  const params = useParams<{ "github-username": string }>();
  const [analysisId, setAnalysisId] =
    useState<number | null>(null);

  const [selectedCommitSha, setSelectedCommitSha] =
    useState<string | null>(null);

  const [selectedCommit, setSelectedCommit] =
    useState<Commit | null>(null);

  const [docStatus, setDocStatus] =
    useState<ProjectDocumentationStatus | null>(null);

  const [actionDialogOpen, setActionDialogOpen] =
    useState<boolean>(false);

  const {
    projects,
    loading,
    updateProjectCurrentAnalysis,
  } = useDashboardData();

  const project = useMemo(
    () =>
      projects.find(
        (item) => item.id === projectId,
      ),
    [projects, projectId],
  );

  /*
   * When entering the project page, show the
   * project's latest/current analysis.
   */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (project?.currentAnalysisId) {
        setAnalysisId(project.currentAnalysisId);
      } else {
        setAnalysisId(null);
        setSelectedCommitSha(null);
        setSelectedCommit(null);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [project?.currentAnalysisId]);

  if (loading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <div className="rounded-xl border border-[#EAE8F0] bg-white px-6 py-4 text-sm text-[#6F6B7D]">
          Loading project...
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <div className="rounded-xl border border-[#EAE8F0] bg-white px-6 py-5 text-center">
          <p className="text-sm font-semibold text-[#191725]">
            Project not found
          </p>

          <p className="mt-1 text-xs text-[#9A96A6]">
            This project may have been removed or
            you may not have access to it.
          </p>
        </div>
      </div>
    );
  }

  /*
   * Latest/current analysis.
   *
   * This updates the project's current analysis
   * because the normal Analyze action analyzes
   * the latest repository commit.
   */
  function handleLatestAnalysis(
    analysis: {
      id: number;
      project_id: number;
      commit_sha: string;
      analysis_number: number;
      status: string;
    },
  ) {
    setAnalysisId(analysis.id);
    setSelectedCommitSha(
      analysis.commit_sha,
    );

    /*
     * Keep the selected commit in sync with
     * the newly created latest analysis.
     *
     * CommitSidebar will also be able to resolve
     * the commit when it is loaded.
     */
    setSelectedCommit((currentCommit) => {
      if (
        currentCommit?.sha ===
        analysis.commit_sha
      ) {
        return currentCommit;
      }

      return null;
    });

    updateProjectCurrentAnalysis(
      analysis.project_id,
      analysis.id,
    );
  }

  /*
   * Historical commit selection.
   *
   * IMPORTANT:
   * We intentionally do NOT call
   * updateProjectCurrentAnalysis() here.
   *
   * Historical analysis should change what is
   * displayed without changing the project's
   * current/latest analysis.
   */
  function handleCommitSelect(
    commit: Commit,
    selectedAnalysisId: number,
  ) {
    setSelectedCommit(commit);
    setSelectedCommitSha(commit.sha);
    setAnalysisId(selectedAnalysisId);
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto pr-1">
      {/* Project Header */}
      <ProjectHeader project={project}>
        <div className="flex items-start gap-3">
          <GenerateDocumentationButton
            username={params["github-username"]}
            projectId={project.id}
            analysisId={analysisId}
            onStatusChange={setDocStatus}
          />
          <AnalyzeButton projectId={project.id} onAnalysisComplete={handleLatestAnalysis} />
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={() => setActionDialogOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-[#EAE8F0] bg-white px-4 py-2.5 text-sm font-medium text-[#191725] transition hover:bg-[#FAF9FC] hover:border-[#D6D3E6]"
              title="Configure GitHub Actions CI & Automation"
            >
              <svg
                className="h-4 w-4 shrink-0 text-[#57606a]"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z" />
              </svg>
              <span>Actions</span>
            </button>
          </div>
        </div>
      </ProjectHeader>

      {/* Stale Documentation Alert Banner */}
      {docStatus?.is_stale && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-5 py-3.5 text-xs text-amber-900 shadow-sm backdrop-blur">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
            <p>
              <strong className="font-semibold text-amber-950">Documentation is Stale:</strong>{" "}
              New repository commits have been analyzed since version {docStatus.version_number ?? 1} was generated.
            </p>
          </div>
          <span className="font-mono text-[11px] font-medium text-amber-800">
            Current: {docStatus.current_commit_sha?.slice(0, 7) ?? "latest"} · Doc: {docStatus.source_commit_sha?.slice(0, 7) ?? "v1"}
          </span>
        </div>
      )}

      {/* Project Overview */}
      <ProjectOverview
        project={project}
        analysisId={analysisId}
        selectedCommitSha={
          selectedCommitSha
        }
      />

      {/* Analysis Summary */}
      <AnalysisSummary
        projectId={project.id}
        analysisId={analysisId}
      />

      {/* Source Graph + Commit History */}
      <div className="grid min-h-[560px] grid-cols-[minmax(0,1fr)_320px] gap-5">
        <SourceGraph
          projectId={project.id}
          analysisId={analysisId}
        />

        <CommitSidebar
          projectId={project.id}
          selectedCommitSha={
            selectedCommitSha
          }
          onCommitSelect={
            handleCommitSelect
          }
        />
      </div>

      {/* Selected Commit Details */}
      <CommitDetails
        commit={selectedCommit}
        analysisId={analysisId}
         isCurrent={
    analysisId === project.currentAnalysisId
  }
      />

      {/* GitHub Actions CI Setup Dialog */}
      <GitHubActionDialog
        projectId={project.id}
        projectName={project.name}
        repositoryName={project.repositoryName}
        isOpen={actionDialogOpen}
        onClose={() => setActionDialogOpen(false)}
      />
    </div>
  );
}
