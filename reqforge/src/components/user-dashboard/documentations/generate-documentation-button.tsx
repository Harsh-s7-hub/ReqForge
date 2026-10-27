"use client";

import { LoaderCircle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { requestDocumentationGeneration } from "./documentation-api";

interface GenerateDocumentationButtonProps {
  username: string;
  projectId: number;
  analysisId: number | null;
}

export function GenerateDocumentationButton({
  username,
  projectId,
  analysisId,
}: GenerateDocumentationButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isSubmitting}
        className="inline-flex items-center gap-2 rounded-lg border border-[#DCD0FF] bg-[#F6F1FF] px-4 py-2.5 text-sm font-semibold text-[#6335D1] transition hover:bg-[#EEE5FF] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          null
        )}
        {isSubmitting ? "Queueing..." : "Generate Documentation"}
      </button>
      {error && <p className="max-w-xs text-right text-xs text-red-600">{error}</p>}
    </div>
  );
}
