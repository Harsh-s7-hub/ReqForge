"use client";

import { useEffect, useMemo, useState } from "react";

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

interface ProjectDetailsPageProps {
  projectId: number;
}

export function ProjectDetailsPage({
  projectId,
}: ProjectDetailsPageProps) {
  const [analysisId, setAnalysisId] =
    useState<number | null>(null);

  const [selectedCommitSha, setSelectedCommitSha] =
    useState<string | null>(null);

  const [selectedCommit, setSelectedCommit] =
    useState<Commit | null>(null);

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
    if (project?.currentAnalysisId) {
      setAnalysisId(
        project.currentAnalysisId,
      );
    } else {
      setAnalysisId(null);
      setSelectedCommitSha(null);
      setSelectedCommit(null);
    }
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
        <AnalyzeButton
          projectId={project.id}
          onAnalysisComplete={
            handleLatestAnalysis
          }
        />
      </ProjectHeader>

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
    </div>
  );
}