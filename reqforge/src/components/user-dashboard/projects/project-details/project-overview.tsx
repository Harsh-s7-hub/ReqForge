"use client";

import type { Project } from "../types";

interface ProjectOverviewProps {
  project: Project;
  analysisId: number | null;
  selectedCommitSha: string | null;
}

export function ProjectOverview({
  project,
  analysisId,
  selectedCommitSha,
}: ProjectOverviewProps) {
  const accessActive =
    project.repositoryAccessActive ?? true;

  const analysisLabel = analysisId
    ? `Analysis #${analysisId}`
    : "Not analyzed";

  const commitLabel = selectedCommitSha
    ? `${selectedCommitSha.slice(0, 7)}`
    : "No commit selected";

  return (
    <section className="grid grid-cols-4 gap-4">
      {/* Repository */}
      <div className="rounded-2xl border border-[#EAE8F0] bg-white px-5 py-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#9A96A6]">
          Repository
        </p>

        <p
          className="mt-2 truncate text-sm font-semibold text-[#191725]"
          title={project.repositoryName}
        >
          {project.repositoryName}
        </p>

        <p className="mt-1 text-xs text-[#9A96A6]">
          GitHub repository
        </p>
      </div>

      {/* Current Analysis */}
      <div className="rounded-2xl border border-[#EAE8F0] bg-white px-5 py-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#9A96A6]">
          Analysis
        </p>

        <p className="mt-2 text-sm font-semibold text-[#191725]">
          {analysisLabel}
        </p>

        <p className="mt-1 text-xs text-[#9A96A6]">
          {analysisId
            ? "Source graph available"
            : "Run an analysis to begin"}
        </p>
      </div>

      {/* Selected Commit */}
      <div className="rounded-2xl border border-[#EAE8F0] bg-white px-5 py-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#9A96A6]">
          Commit
        </p>

        <p
          className="mt-2 truncate font-mono text-sm font-semibold text-[#191725]"
          title={selectedCommitSha ?? undefined}
        >
          {commitLabel}
        </p>

        <p className="mt-1 text-xs text-[#9A96A6]">
          Selected version
        </p>
      </div>

      {/* Repository Access */}
      <div className="rounded-2xl border border-[#EAE8F0] bg-white px-5 py-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#9A96A6]">
          Access
        </p>

        <div className="mt-2 flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              accessActive
                ? "bg-[#16CFEA]"
                : "bg-[#9A96A6]"
            }`}
          />

          <p className="text-sm font-semibold text-[#191725]">
            {accessActive
              ? "Connected"
              : "Unavailable"}
          </p>
        </div>

        <p className="mt-1 text-xs text-[#9A96A6]">
          Project #{project.id}
        </p>
      </div>
    </section>
  );
}