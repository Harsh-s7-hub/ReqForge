"use client";

import Link from "next/link";
import { ArrowLeft, Clock3, FileLock2, GitCommitHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { getCatalogDocumentVersion } from "./documentation-api";
import type { DocumentationVersion } from "./types";

interface HistoricalDocumentationViewProps { username: string; documentationId: number; versionId: number; }

export function HistoricalDocumentationView({ username, documentationId, versionId }: HistoricalDocumentationViewProps) {
  const [version, setVersion] = useState<DocumentationVersion | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { void getCatalogDocumentVersion(documentationId, versionId).then(setVersion).catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load historical version.")); }, [documentationId, versionId]);
  if (error) return <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>;
  if (!version) return <div className="rounded-2xl border border-[#EAE8F0] bg-white p-8 text-sm text-[#6F6B7D]">Loading historical documentation...</div>;
  const content = version.content || version.ai_generated_content || "No saved content is available for this version.";
  return <div className="mx-auto max-w-[1240px] space-y-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="inline-flex items-center gap-2 rounded-md bg-[#F1EFF8] px-2 py-1 text-xs font-semibold text-[#6F6B7D]"><FileLock2 className="h-3.5 w-3.5" />Historical version · Read only</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#191725]">Documentation version v{version.version_number}</h1><p className="mt-2 text-sm text-[#6F6B7D]">This archived snapshot cannot be edited.</p></div><Link href={`/${username}/documentations/${documentationId}`} className="inline-flex items-center gap-2 rounded-lg bg-[#7547E8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6335D1]"><ArrowLeft className="h-4 w-4" />Open current document</Link></div><section className="grid gap-4 sm:grid-cols-3"><HistoricalMeta icon={GitCommitHorizontal} label="Source commit" value={version.source_commit_sha.slice(0, 7)} mono /><HistoricalMeta icon={Clock3} label="Generated" value={new Date(version.created_at).toLocaleString()} /><HistoricalMeta icon={FileLock2} label="Status" value="Historical snapshot" /></section><article className="rounded-2xl border border-[#EAE8F0] bg-white shadow-[0_2px_12px_rgba(35,25,65,0.04)]"><div className="border-b border-[#EAE8F0] px-6 py-4"><p className="font-mono text-xs font-semibold text-[#7547E8]">READ-ONLY MARKDOWN</p></div><pre className="whitespace-pre-wrap break-words px-7 py-7 font-mono text-sm leading-7 text-[#29213F]">{content}</pre></article></div>;
}

function HistoricalMeta({ icon: Icon, label, value, mono = false }: { icon: typeof Clock3; label: string; value: string; mono?: boolean }) { return <div className="rounded-xl border border-[#EAE8F0] bg-white p-4"><Icon className="h-4 w-4 text-[#7547E8]" /><p className="mt-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[#9A96A6]">{label}</p><p className={`mt-1 text-sm font-semibold text-[#191725] ${mono ? "font-mono" : ""}`}>{value}</p></div>; }
