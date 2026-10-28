"use client";

import { useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileEdit,
  GitBranch,
  GitCommit,
  Loader2,
  RotateCw,
  ShieldCheck,
} from "lucide-react";
import { commitDocumentationVersion } from "../documentation-api";
import type { CommitDocumentationResult } from "../types";

interface DraftReviewCardProps {
  projectId: number;
  versionId: number;
  repositoryName: string;
  defaultBranch?: string;
  modelName?: string | null;
  onFocusEditor?: () => void;
  onRegenerate?: () => void;
}

export function DraftReviewCard({
  projectId,
  versionId,
  repositoryName,
  defaultBranch = "main",
  modelName = "qwen2.5-coder:7b",
  onFocusEditor,
  onRegenerate,
}: DraftReviewCardProps) {
  const [commitMessage, setCommitMessage] = useState(
    "docs: update README.md via RegForge AI"
  );
  const [filePath, setFilePath] = useState("README.md");
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<CommitDocumentationResult | null>(null);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [showTelemetry, setShowTelemetry] = useState(true);
  const [isConfirmingRegenerate, setIsConfirmingRegenerate] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const sanitizedPath = filePath.trim().replace(/^\/+/, "") || "README.md";

  const handleCommit = async () => {
    if (!commitMessage.trim()) return;
    setIsCommitting(true);
    setCommitError(null);

    try {
      const result = await commitDocumentationVersion(projectId, versionId, {
        commit_message: commitMessage.trim(),
        file_path: sanitizedPath,
        branch: defaultBranch,
      });
      setCommitResult(result);
    } catch (err) {
      setCommitError(
        err instanceof Error ? err.message : "Failed to commit documentation to GitHub."
      );
    } finally {
      setIsCommitting(false);
    }
  };

  const handleRegenerateClick = () => {
    if (!isConfirmingRegenerate) {
      setIsConfirmingRegenerate(true);
      return;
    }
    setIsRegenerating(true);
    onRegenerate?.();
  };

  return (
    <div className="space-y-4">
      {/* Main Draft Review Card */}
      <section className="overflow-hidden rounded-2xl border border-[#EAE8F0] bg-white p-5 shadow-[0_2px_12px_rgba(35,25,65,0.04)]">
        {/* Header: Cyan dot + Draft Review + RegForge Agent Badge (clean, no star icon) */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#06B6D4]" />
            <h2 className="text-sm font-semibold text-[#191725]">Draft Review</h2>
          </div>

          <span className="inline-flex items-center gap-1 rounded-full bg-[#F0EAFF] px-2.5 py-0.5 text-[11px] font-semibold text-[#7547E8]">
            <ShieldCheck className="h-3 w-3 text-[#7547E8]" />
            RegForge Agent
          </span>
        </div>

        {/* Synthesis Banner */}
        <div className="mt-4 rounded-xl border border-[#EAE4F8] bg-[#F9F7FD] p-3.5">
          <div className="flex items-start gap-2.5">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EFE9FD] text-[#7547E8]">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
            <p className="text-xs leading-relaxed text-[#595368]">
              <strong className="font-semibold text-[#191725]">RegForge AI</strong> has synthesized complete markdown documentation for{" "}
              <span className="font-semibold text-[#7547E8]">{repositoryName}</span>. Review and finalize your commit.
            </p>
          </div>
        </div>

        {/* Commit Message Box */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label
              htmlFor="commit-msg-input"
              className="flex items-center gap-1.5 font-semibold text-[#191725]"
            >
              <GitCommit className="h-3.5 w-3.5 text-[#7547E8]" />
              Commit Message (Editable)
            </label>
            <span className="font-mono text-[10px] font-medium text-[#9A96A6]">
              Conventional
            </span>
          </div>

          <textarea
            id="commit-msg-input"
            rows={3}
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            disabled={isCommitting || !!commitResult}
            className="w-full resize-none rounded-xl border border-[#EAE8F0] bg-[#FAF8FF] p-3 font-mono text-xs leading-relaxed text-[#29213F] outline-none transition focus:border-[#7547E8] focus:bg-white focus:ring-1 focus:ring-[#7547E8] disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="docs(architecture): generate documentation"
          />
        </div>

        {/* Commit Feedback Alert */}
        {commitError && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
            {commitError}
          </div>
        )}

        {commitResult && (
          <div className="mt-3 rounded-lg border border-[#D1FAE5] bg-[#F0FDF4] p-3 text-xs text-[#065F46]">
            <div className="flex items-center gap-1.5 font-semibold">
              <Check className="h-4 w-4 text-[#10B981]" />
              Committed to GitHub successfully!
            </div>
            <p className="mt-1 font-mono text-[11px] text-[#047857]">
              SHA: {commitResult.commit_sha.slice(0, 7)} · /{commitResult.file_path}
            </p>
            {commitResult.html_url && (
              <a
                href={commitResult.html_url}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 font-medium text-[#7547E8] hover:underline"
              >
                View on GitHub <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}

        {/* Three Action Buttons */}
        <div className="mt-4 space-y-2">
          {/* Button 1: Solid Purple Button (Approve & Commit Changes) */}
          <button
            type="button"
            disabled={isCommitting || !commitMessage.trim()}
            onClick={handleCommit}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7547E8] px-4 py-2.5 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(117,71,232,0.25)] transition hover:bg-[#6335D1] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCommitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Committing to GitHub...
              </>
            ) : commitResult ? (
              <>
                <Check className="h-4 w-4" />
                Committed to {defaultBranch}
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Approve & Commit Changes
              </>
            )}
          </button>

          {/* Button 2: Soft Purple Button (Focus Document Editor) */}
          <button
            type="button"
            onClick={onFocusEditor}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F0EAFF] px-4 py-2 text-xs font-semibold text-[#7547E8] transition hover:bg-[#E5DBFF]"
          >
            <FileEdit className="h-3.5 w-3.5" />
            Focus Document Editor
          </button>

          {/* Button 3: Red Button (Revise Document / Regenerate with AI) */}
          <button
            type="button"
            disabled={isRegenerating}
            onClick={handleRegenerateClick}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRegenerating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Queueing new generation...
              </>
            ) : isConfirmingRegenerate ? (
              <>
                <RotateCw className="h-3.5 w-3.5 animate-spin" />
                Confirm Regenerate with AI?
              </>
            ) : (
              <>
                <RotateCw className="h-3.5 w-3.5" />
                Revise Document (Regenerate with AI)
              </>
            )}
          </button>
        </div>

        {/* TARGET DESTINATION Section */}
        <div className="mt-5 border-t border-[#F1EFF8] pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9A96A6]">
            TARGET DESTINATION
          </p>

          <div className="mt-2.5 rounded-xl border border-[#EAE4F8] bg-[#F9F7FD] p-3 text-xs">
            <div className="flex items-center justify-between py-1">
              <span className="text-[#6F6B7D]">Target Branch</span>
              <span className="inline-flex items-center gap-1 font-mono font-medium text-[#191725]">
                <GitBranch className="h-3.5 w-3.5 text-[#7547E8]" />
                {defaultBranch}
              </span>
            </div>

            <div className="border-t border-[#F0EDF8] pt-2 pb-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="target-file-input" className="text-[#6F6B7D]">
                  Destination File
                </label>
                <span className="font-mono text-[10px] font-medium text-[#7547E8]">
                  repo root (/)
                </span>
              </div>
              <div className="mt-1 flex items-center rounded-lg border border-[#EAE4F8] bg-white px-2.5 py-1.5 shadow-sm focus-within:border-[#7547E8] focus-within:ring-1 focus-within:ring-[#7547E8]">
                <span className="select-none font-mono text-xs text-[#9A96A6]">/</span>
                <input
                  id="target-file-input"
                  type="text"
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  disabled={isCommitting || !!commitResult}
                  placeholder="README.md"
                  className="w-full bg-transparent pl-1 font-mono text-xs font-semibold text-[#191725] outline-none placeholder:text-[#9A96A6] disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#F0EDF8] py-1">
              <span className="text-[#6F6B7D]">Committer</span>
              <span className="inline-flex items-center gap-1 font-mono font-semibold text-[#7547E8]">
                @regforge
                <CheckCircle2 className="h-3.5 w-3.5 fill-[#7547E8] text-white" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* AGENT TELEMETRY Section (Collapsible) */}
      <section className="overflow-hidden rounded-2xl border border-[#EAE8F0] bg-white p-5 shadow-[0_2px_12px_rgba(35,25,65,0.04)]">
        <button
          type="button"
          onClick={() => setShowTelemetry((prev) => !prev)}
          className="flex w-full items-center justify-between text-left"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9A96A6]">
            AGENT TELEMETRY
          </p>
          {showTelemetry ? (
            <ChevronUp className="h-3.5 w-3.5 text-[#9A96A6]" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-[#9A96A6]" />
          )}
        </button>

        {showTelemetry && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-[#F0EDF8] bg-[#FAF8FF] px-3 py-2 text-xs">
              <span className="text-[#6F6B7D]">AI Model Engine</span>
              <span className="font-mono font-semibold text-[#191725]">
                {modelName} + AST
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[#F0EDF8] bg-[#FAF8FF] px-3 py-2 text-xs">
              <span className="text-[#6F6B7D]">Schema Parsing</span>
              <span className="font-mono font-semibold text-[#191725]">
                AST + Neo4j + Qdrant
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[#F0EDF8] bg-[#FAF8FF] px-3 py-2 text-xs">
              <span className="text-[#6F6B7D]">Output Target</span>
              <span className="font-mono font-semibold text-[#7547E8]">
                {sanitizedPath}
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
