"use client";

import { useEffect, useState } from "react";
import { AlertCircle, LoaderCircle, RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  getProjectDocumentationStatus,
  requestDocumentationGeneration,
} from "./documentation-api";
import type { ProjectDocumentationStatus } from "./types";

interface GenerateDocumentationButtonProps {
  username: string;
  projectId: number;
  analysisId: number | null;
  onStatusChange?: (status: ProjectDocumentationStatus | null) => void;
}

export function GenerateDocumentationButton({
  username,
  projectId,
  analysisId,
  onStatusChange,
}: GenerateDocumentationButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docStatus, setDocStatus] = useState<ProjectDocumentationStatus | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadStatus() {
      try {
        const data = await getProjectDocumentationStatus(projectId);
        if (isMounted) {
          setDocStatus(data);
          onStatusChange?.(data);
        }
      } catch {
        // Status check failure is non-fatal
      }
    }
    loadStatus();
    return () => {
      isMounted = false;
    };
  }, [projectId, onStatusChange]);

  if (!analysisId) return null;

  async function handleGenerate() {
    if (analysisId === null) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const result = await requestDocumentationGeneration(projectId, analysisId);
      router.push(
        `/${encodeURIComponent(username)}/documentations/${result.documentation_id}?version=${result.version_id}&project=${projectId}`,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to queue documentation generation.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const isStale = docStatus?.is_stale ?? false;
  const hasDoc = docStatus?.has_documentation ?? false;
  const nextVersion = (docStatus?.version_number ?? 1) + 1;

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isSubmitting}
        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
          isStale
            ? "border border-amber-300 bg-amber-50 text-amber-900 shadow-sm hover:bg-amber-100"
            : hasDoc
            ? "border border-[#DCD0FF] bg-[#F6F1FF] text-[#6335D1] hover:bg-[#EEE5FF]"
            : "border border-[#DCD0FF] bg-[#F6F1FF] text-[#6335D1] hover:bg-[#EEE5FF]"
        }`}
      >
        {isSubmitting ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : isStale ? (
          <RotateCw className="h-3.5 w-3.5 text-amber-700 animate-spin-reverse" />
        ) : null}

        {isSubmitting ? (
          "Queueing..."
        ) : isStale ? (
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            Update Stale Document (v{nextVersion})
          </span>
        ) : hasDoc ? (
          "Regenerate Document"
        ) : (
          "Generate Documentation"
        )}
      </button>

      {isStale && !isSubmitting && (
        <span className="flex items-center gap-1 text-[11px] font-medium text-amber-700">
          <AlertCircle className="h-3 w-3" />
          Document is stale · update available
        </span>
      )}

      {error && <p className="max-w-xs text-right text-xs text-red-600">{error}</p>}
    </div>
  );
}
