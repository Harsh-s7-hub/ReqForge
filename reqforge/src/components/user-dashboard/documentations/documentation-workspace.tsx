"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDashboardData } from "@/components/user-dashboard/dashboard-data-provider";
import { DocumentMetadataCard } from "./document-metadata-card";
import {
  getDocumentationVersion,
  requestDocumentationGeneration,
  saveDocumentationContent,
} from "./documentation-api";
import { MarkdownEditor } from "./document-editor/markdown-editor";
import { MarkdownToolbar } from "./document-editor/markdown-toolbar";
import { GenerationStatusCard } from "./review-panel/generation-status-card";
import { DraftReviewCard } from "./review-panel/draft-review-card";
import type { DocumentationVersion } from "./types";

interface DocumentationWorkspaceProps {
  documentationId: number;
  projectId: number;
  versionId: number;
}

export function DocumentationWorkspace({
  documentationId,
  projectId,
  versionId,
}: DocumentationWorkspaceProps) {
  const router = useRouter();
  const params = useParams<{ "github-username"?: string }>();
  const username = params?.["github-username"];

  const { projects } = useDashboardData();
  const [version, setVersion] = useState<DocumentationVersion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("preview");

  const project = projects.find((item) => item.id === projectId);

  const load = useCallback(async () => {
    try {
      const data = await getDocumentationVersion(projectId, versionId);
      setVersion(data);
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load documentation.",
      );
    }
  }, [projectId, versionId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!version || !["queued", "generating"].includes(version.status)) return;
    const timer = window.setInterval(() => void load(), 4000);
    return () => window.clearInterval(timer);
  }, [version, load]);

  async function save(content: string) {
    const saved = await saveDocumentationContent(projectId, versionId, content);
    setVersion(saved);
  }

  const handleRegenerate = async () => {
    if (!version?.analysis_id) return;
    try {
      const result = await requestDocumentationGeneration(projectId, version.analysis_id);
      if (username) {
        router.push(
          `/${encodeURIComponent(username)}/documentations/${result.documentation_id}?version=${result.version_id}&project=${projectId}`
        );
      } else {
        window.location.href = `?project=${projectId}&version=${result.version_id}`;
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to trigger documentation regeneration."
      );
    }
  };

  const repositoryName =
    project?.repositoryName || `Documentation #${documentationId}`;

  const isReady = version?.status === "ready";

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
      {/* Metadata Overview Card */}
      <DocumentMetadataCard
        repositoryName={repositoryName}
        commitSha={version?.source_commit_sha ?? null}
        updatedAt={version?.updated_at ?? null}
      />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* Main Markdown Editor Area */}
          <section className="overflow-hidden rounded-2xl border border-[#EAE8F0] bg-white shadow-[0_2px_12px_rgba(35,25,65,0.04)]">
            {viewMode === "edit" && <MarkdownToolbar />}
            <MarkdownEditor
              key={`${versionId}-${version?.status}`}
              content={version?.content || ""}
              disabled={!isReady}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onSave={save}
            />
          </section>

          {/* Right Sidebar: Draft Review vs Generation Progress */}
          <aside className="space-y-5">
            {isReady ? (
              <DraftReviewCard
                projectId={projectId}
                versionId={versionId}
                repositoryName={repositoryName}
                modelName={version?.model_name || "qwen2.5-coder:7b"}
                onFocusEditor={() => setViewMode("edit")}
                onRegenerate={handleRegenerate}
              />
            ) : (
              <GenerationStatusCard
                status={version?.status || "queued"}
                failureReason={version?.failure_reason || null}
              />
            )}

            {/* Version Badge Card */}
            <section className="rounded-2xl border border-[#EAE8F0] bg-white p-5 shadow-[0_2px_12px_rgba(35,25,65,0.04)]">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#9A96A6]">
                  Version
                </p>
                <span className="rounded-md bg-[#FAF8FF] px-2 py-0.5 font-mono text-xs font-semibold text-[#7547E8]">
                  v{version?.version_number ?? "—"}
                </span>
              </div>
              <p className="mt-3 text-xs leading-5 text-[#6F6B7D]">
                Original AI output remains preserved when you save edits. You can revise or commit at any time.
              </p>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}

