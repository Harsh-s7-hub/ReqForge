"use client";

import { FileDown } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useDashboardData } from "@/components/user-dashboard/dashboard-data-provider";
import { DocumentMetadataCard } from "./document-metadata-card";
import { DocumentationBreadcrumbs } from "./documentation-breadcrumbs";
import { getDocumentationVersion, saveDocumentationContent } from "./documentation-api";
import { MarkdownEditor } from "./document-editor/markdown-editor";
import { MarkdownToolbar } from "./document-editor/markdown-toolbar";
import { GenerationStatusCard } from "./review-panel/generation-status-card";
import type { DocumentationVersion } from "./types";

interface DocumentationWorkspaceProps { documentationId: number; projectId: number; versionId: number; }

export function DocumentationWorkspace({ documentationId, projectId, versionId }: DocumentationWorkspaceProps) {
  const { projects } = useDashboardData();
  const [version, setVersion] = useState<DocumentationVersion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const project = projects.find((item) => item.id === projectId);
  const load = useCallback(async () => { try { const data = await getDocumentationVersion(projectId, versionId); setVersion(data); setError(null); } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to load documentation."); } }, [projectId, versionId]);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  useEffect(() => { if (!version || !["queued", "generating"].includes(version.status)) return; const timer = window.setInterval(() => void load(), 4000); return () => window.clearInterval(timer); }, [version, load]);
  async function save(content: string) { const saved = await saveDocumentationContent(projectId, versionId, content); setVersion(saved); }
  const repositoryName = project?.repositoryName || `Documentation #${documentationId}`;
  return <div className="mx-auto flex max-w-[1440px] flex-col gap-6"><DocumentationBreadcrumbs repositoryName={repositoryName} /><div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-semibold tracking-tight text-[#191725]">Documentation workspace</h1><p className="mt-1 text-sm text-[#6F6B7D]">Review and maintain repository documentation.</p></div><button type="button" disabled className="inline-flex items-center gap-2 rounded-lg border border-[#EAE8F0] bg-white px-3.5 py-2 text-sm font-semibold text-[#9A96A6]"><FileDown className="h-4 w-4" />Export Markdown</button></div><DocumentMetadataCard repositoryName={repositoryName} commitSha={version?.source_commit_sha ?? null} updatedAt={version?.updated_at ?? null} />{error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"><section className="overflow-hidden rounded-2xl border border-[#EAE8F0] bg-white shadow-[0_2px_12px_rgba(35,25,65,0.04)]"><MarkdownToolbar /><MarkdownEditor key={version?.id ?? versionId} content={version?.content || ""} disabled={version?.status !== "ready"} onSave={save} /></section><aside className="space-y-5"><GenerationStatusCard status={version?.status || "queued"} failureReason={version?.failure_reason || null} /><section className="rounded-2xl border border-[#EAE8F0] bg-white p-5"><p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#9A96A6]">Version</p><p className="mt-2 font-mono text-sm font-semibold text-[#191725]">v{version?.version_number ?? "—"}</p><p className="mt-4 text-xs leading-5 text-[#6F6B7D]">Original AI output remains preserved when you save edits.</p></section></aside></div>}</div>;
}
