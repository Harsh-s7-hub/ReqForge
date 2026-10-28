"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  Clock,
  Cpu,
  Database,
  FileCode,
  FolderGit2,
  Loader2,
} from "lucide-react";
import type { DocumentationStatus } from "../types";

interface GenerationStatusCardProps {
  status: DocumentationStatus;
  failureReason: string | null;
}

interface StepItem {
  id: string;
  label: string;
  description: string;
  icon: typeof FolderGit2;
}

const PIPELINE_STEPS: StepItem[] = [
  {
    id: "queued",
    label: "Task Queued",
    description: "Scheduled in Celery queue",
    icon: Clock,
  },
  {
    id: "snapshot",
    label: "Repository Snapshot",
    description: "Fetching commit source tree",
    icon: FolderGit2,
  },
  {
    id: "indexing",
    label: "RAG & Graph Indexing",
    description: "Qdrant vectors & Neo4j graph",
    icon: Database,
  },
  {
    id: "generation",
    label: "AI Technical Writer",
    description: "Ollama (qwen2.5-coder:7b)",
    icon: Cpu,
  },
  {
    id: "persistence",
    label: "Markdown Assembly",
    description: "Validating & saving version",
    icon: FileCode,
  },
];

export function GenerationStatusCard({
  status,
  failureReason,
}: GenerationStatusCardProps) {
  const isReady = status === "ready";
  const isFailed = status === "failed";
  const isQueued = status === "queued";
  const isGenerating = status === "generating";
  const inProgress = isQueued || isGenerating;

  // Track elapsed seconds smoothly for the active session
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    if (!inProgress) {
      return;
    }

    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [inProgress]);

  // Compute realistic progress percentage based on status & elapsed time
  const progressPercent = isReady
    ? 100
    : isFailed
    ? 100
    : isQueued
    ? 15
    : Math.min(94, 25 + Math.floor(elapsedSeconds * 1.5));

  // Determine active step index
  const activeStepIndex = isReady
    ? 5
    : isFailed
    ? 1
    : isQueued
    ? 0
    : progressPercent < 45
    ? 1
    : progressPercent < 70
    ? 2
    : progressPercent < 90
    ? 3
    : 4;

  const formatElapsed = (sec: number) => {
    if (sec >= 3600) {
      const hrs = Math.floor(sec / 3600);
      const mins = Math.floor((sec % 3600) / 60);
      const remainingSecs = sec % 60;
      return `${hrs}:${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
    }
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-[#EAE8F0] bg-white p-5 shadow-[0_2px_12px_rgba(35,25,65,0.04)]">
      {/* Header with status badge & timer */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isReady
                ? "bg-[#10B981]"
                : isFailed
                ? "bg-red-500"
                : isQueued
                ? "bg-[#F59E0B] animate-pulse"
                : "bg-[#7547E8] animate-ping"
            }`}
          />
          <h2 className="text-sm font-semibold text-[#191725]">
            {isReady
              ? "Draft Ready"
              : isFailed
              ? "Generation Failed"
              : isQueued
              ? "Queued in Broker"
              : "Generating Documentation"}
          </h2>
        </div>

        {inProgress && (
          <span className="flex items-center gap-1 rounded-md bg-[#F4F1FA] px-2 py-0.5 font-mono text-[11px] font-medium text-[#6F6B7D]">
            <Clock className="h-3 w-3 text-[#9A96A6]" />
            {formatElapsed(elapsedSeconds)}
          </span>
        )}
      </div>

      {/* Progress Bar Section */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[#6F6B7D]">
            {isReady
              ? "Generation complete"
              : isFailed
              ? "Failed"
              : isQueued
              ? "Waiting for worker..."
              : "Synthesizing repository context..."}
          </span>
          <span
            className={`font-mono text-xs font-bold ${
              isReady
                ? "text-[#10B981]"
                : isFailed
                ? "text-red-500"
                : "text-[#7547E8]"
            }`}
          >
            {progressPercent}%
          </span>
        </div>

        {/* Outer bar track */}
        <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full bg-[#EAE8F0]">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              isReady
                ? "bg-[#10B981]"
                : isFailed
                ? "bg-red-500"
                : "bg-gradient-to-r from-[#7547E8] via-[#9E77ED] to-[#7547E8] bg-[length:200%_100%] animate-pulse"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Step Checklist */}
      <div className="mt-5 space-y-2.5 border-t border-[#F1EFF8] pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9A96A6]">
          Pipeline Steps
        </p>
        <div className="space-y-2">
          {PIPELINE_STEPS.map((step, idx) => {
            const isCompleted = isReady || activeStepIndex > idx;
            const isCurrent = inProgress && activeStepIndex === idx;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors ${
                  isCurrent
                    ? "border border-[#E0D7FA] bg-[#FAF8FF]"
                    : "border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                      isCompleted
                        ? "bg-[#ECFDF5] text-[#10B981]"
                        : isCurrent
                        ? "bg-[#F0EAFF] text-[#7547E8]"
                        : "bg-[#F4F3F7] text-[#B0ACB9]"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : isCurrent ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Icon className="h-3 w-3" />
                    )}
                  </span>
                  <div>
                    <p
                      className={`text-xs font-medium leading-none ${
                        isCompleted
                          ? "text-[#191725]"
                          : isCurrent
                          ? "font-semibold text-[#7547E8]"
                          : "text-[#9A96A6]"
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#9A96A6]">
                      {step.description}
                    </p>
                  </div>
                </div>

                {isCurrent && (
                  <span className="rounded bg-[#F0EAFF] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#7547E8]">
                    Active
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info Box */}
      <div
        className={`mt-4 rounded-xl p-3.5 text-xs leading-relaxed ${
          isReady
            ? "border border-[#D1FAE5] bg-[#F0FDF4] text-[#065F46]"
            : isFailed
            ? "border border-red-200 bg-red-50 text-red-700"
            : "border border-[#EAE8F0] bg-[#FAF8FF] text-[#6F6B7D]"
        }`}
      >
        {isReady ? (
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#10B981]" />
            <span>
              Your repository documentation is complete and ready for review or
              direct editing.
            </span>
          </div>
        ) : isFailed ? (
          <div className="flex items-start gap-2">
            <CircleAlert className="h-4 w-4 shrink-0 text-red-500" />
            <span>{failureReason || "The generation task could not complete."}</span>
          </div>
        ) : isQueued ? (
          <p>
            Task is scheduled in the <strong>Redis queue</strong>. It will begin
            processing as soon as the Celery documentation worker claims it.
          </p>
        ) : (
          <p>
            Synthesizing code context using Neo4j graph and Qdrant semantic
            embeddings. Ollama is generating your full technical documentation.
          </p>
        )}
      </div>
    </section>
  );
}
