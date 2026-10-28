"use client";

import Link from "next/link";
import { FileText, FolderGit2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getDocumentationCatalog } from "../documentation-api";
import type { DocumentationCatalogItem } from "../types";

interface DocumentationCatalogProps { username: string; }

function relativeTime(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  return minutes < 60 ? `${minutes}m ago` : minutes < 1440 ? `${Math.floor(minutes / 60)}h ago` : `${Math.floor(minutes / 1440)}d ago`;
}

export function DocumentationCatalog({ username }: DocumentationCatalogProps) {
  const [documents, setDocuments] = useState<DocumentationCatalogItem[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { void getDocumentationCatalog().then(setDocuments).catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load documentation.")); }, []);
  const filtered = useMemo(() => documents.filter((document) => `${document.project_name} ${document.repository_name} ${document.title}`.toLowerCase().includes(query.toLowerCase())), [documents, query]);
  const versionCount = documents.reduce((total, document) => total + document.versions.length, 0);
  return <div className="mx-auto max-w-[1440px] space-y-7">
    <header className="flex flex-wrap items-end justify-between gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7547E8]">Multi-project registry · {documents.length} canonical docs</p>
        <h1 className="mt-1 text-[18px] font-semibold tracking-[-0.02em] text-[#191725]">Documentation Catalog</h1>
       </div>
        <label className="flex h-10 w-full max-w-sm items-center gap-2 rounded-lg border border-[#EAE8F0] bg-white px-3 text-sm text-[#6F6B7D]"><Search className="h-4 w-4" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter project or repository..." className="w-full bg-transparent outline-none" /></label></header><section className="grid gap-4 sm:grid-cols-3"><Metric label="Canonical docs" value={documents.length} /><Metric label="Document versions" value={versionCount} /><Metric label="Projects represented" value={new Set(documents.map((document) => document.project_id)).size} /></section>{error ? <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : <div className="space-y-6">{filtered.map((document) => <CatalogCard key={document.id} username={username} document={document} />)}{!documents.length && <p className="rounded-2xl border border-dashed border-[#DCD8E8] bg-white p-10 text-center text-sm text-[#6F6B7D]">No generated documentation yet. Analyse a project, then generate its first document.</p>}</div>}</div>;
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl border border-[#EAE8F0] bg-white p-5"><p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#9A96A6]">{label}</p><p className="mt-2 text-2xl font-semibold text-[#191725]">{value}</p></div>; }

function CatalogCard({ username, document }: { username: string; document: DocumentationCatalogItem }) {
  const current = document.versions.find((version) => version.status === "ready") ?? document.versions[0];
  return <section className="rounded-2xl border border-[#EAE8F0] bg-white p-6 shadow-[0_2px_12px_rgba(35,25,65,0.04)]"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EAFF] text-[#7547E8]"><FolderGit2 className="h-5 w-5" /></span><div className="min-w-0"><h2 className="truncate text-lg font-semibold text-[#191725]">{document.project_name}</h2><p className="truncate font-mono text-xs text-[#6F6B7D]">{document.repository_name}</p></div></div><span className="rounded-md bg-[#F0EAFF] px-2 py-1 text-xs font-semibold text-[#6335D1]">{document.versions.length} version{document.versions.length === 1 ? "" : "s"}</span></div><div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"><div><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-[#7547E8]" /><h3 className="font-semibold text-[#191725]">{document.title}</h3></div><div className="mt-4 space-y-2">{document.versions.map((version) => { const isCurrent = version.id === current?.id; const href = isCurrent ? `/${username}/documentations/${document.id}?version=${version.id}&project=${document.project_id}` : `/${username}/documentations/${document.id}/versions/${version.id}`; return <Link key={version.id} href={href} className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 transition ${isCurrent ? "border-[#CDBDFF] bg-[#FAF8FF]" : "border-transparent hover:border-[#EAE8F0] hover:bg-[#F7F5FB]"}`}><span className="flex min-w-0 items-center gap-2"><span className={`h-2 w-2 rounded-full ${isCurrent ? "bg-[#7547E8]" : "bg-[#9A96A6]"}`} /><span className="font-mono text-sm font-semibold text-[#191725]">v{version.version_number}</span><span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${isCurrent ? "bg-[#7547E8] text-white" : "bg-[#F1EFF8] text-[#6F6B7D]"}`}>{isCurrent ? "Current" : "Historical"}</span></span><span className="shrink-0 text-xs text-[#9A96A6]">{relativeTime(version.created_at)}</span></Link>; })}</div></div><aside className="rounded-xl bg-[#F7F3FF] p-5"><p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#9A96A6]">Current version</p>{current ? <><p className="mt-2 font-mono text-lg font-semibold text-[#191725]">v{current.version_number}</p><p className="mt-2 font-mono text-xs text-[#6F6B7D]">{current.source_commit_sha.slice(0, 7)}</p><p className="mt-4 text-sm text-[#6F6B7D]">{current.word_count.toLocaleString()} words · {current.line_count.toLocaleString()} lines</p></> : <p className="mt-2 text-sm text-[#6F6B7D]">No version is ready.</p>}</aside></div></section>;
}
