"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Check,
  Circle,
  BrainCircuit,
  GitBranch,
  Rocket,
  ListChecks,
  ChevronRight,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

interface SetupStep {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel: string;
  href: string;
  completed: boolean;
}

interface QuickSetupGuideProps {
  githubConnected: boolean;
  hasRepository: boolean;
}

export function QuickSetupGuide({
  githubConnected,
  hasRepository,
}: QuickSetupGuideProps) {
  const pathname = usePathname();

  const username = pathname
    .split("/")
    .filter(Boolean)[0];

  const dashboardBasePath = username
    ? `/${username}`
    : "";

  /*
   * These two steps are not backed by database state yet.
   *
   * AI model configuration and first workflow execution
   * will become dynamic once their backend state exists.
   */
  const aiModelsConfigured = false;
  const firstWorkflowCompleted = false;

  const setupSteps: SetupStep[] = [
    {
      id: 1,
      title: "Connect GitHub",
      description:
        "Authorize RegForge to access your repositories.",
      icon: GitBranch,
      actionLabel: githubConnected
        ? "Connected"
        : "Connect",
      href: "/settings",
      completed: githubConnected,
    },
    {
      id: 2,
      title: "Configure AI Models",
      description:
        "Choose the models for documentation, reviews and tests.",
      icon: BrainCircuit,
      actionLabel: aiModelsConfigured
        ? "Configured"
        : "Configure",
      href: "/models",
      completed: aiModelsConfigured,
    },
    {
      id: 3,
      title: "Add a Repository",
      description:
        "Select a repository for your first AI workflow.",
      icon: GitBranch,
      actionLabel: hasRepository
        ? "Repositories"
        : "Add repository",
      href: "/repositories",
      completed: hasRepository,
    },
    {
      id: 4,
      title: "Run Your First Workflow",
      description:
        "Start generating documentation and reviewing code.",
      icon: Rocket,
      actionLabel: firstWorkflowCompleted
        ? "Completed"
        : "Get started",
      href: "/documentation",
      completed: firstWorkflowCompleted,
    },
  ];

  const completedCount = setupSteps.filter(
    (step) => step.completed,
  ).length;

  const progress =
    (completedCount / setupSteps.length) * 100;

  return (
    <section
      aria-label="Quick setup guide"
      className="overflow-hidden rounded-xl border border-[#EAE8F0] bg-white shadow-[0_2px_10px_rgba(25,23,37,0.025)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#EAE8F0] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F0EAFF]">
            <ListChecks
              size={17}
              className="text-[#7547E8]"
            />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-[#191725]">
              Quick Setup Guide
            </h2>

            <p className="mt-0.5 text-[11px] text-[#9692A1]">
              Get started with RegForge
            </p>
          </div>
        </div>

        <span className="rounded-full bg-[#F0EAFF] px-2.5 py-1 text-[10px] font-semibold text-[#7547E8]">
          {completedCount}/{setupSteps.length} completed
        </span>
      </div>

      {/* Progress */}
      <div className="px-5 pb-4 pt-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-medium text-[#6F6B7D]">
            Setup progress
          </span>

          <span className="text-[11px] font-semibold text-[#7547E8]">
            {Math.round(progress)}%
          </span>
        </div>

        <div
          className="h-1.5 overflow-hidden rounded-full bg-[#F0EEF4]"
          role="progressbar"
          aria-label="Setup progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <div
            className="h-full rounded-full bg-[#7547E8] transition-all duration-300"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>

      {/* Setup Steps */}
      <div className="space-y-1 px-5 pb-5">
        {setupSteps.map((step, index) => {
          const Icon = step.icon;

          const stepHref = `${dashboardBasePath}${step.href}`;

          return (
            <div
              key={step.id}
              className="relative flex gap-3"
            >
              {/* Step Indicator */}
              <div className="flex flex-col items-center">
                <div
                  aria-label={
                    step.completed
                      ? "Completed"
                      : "Not completed"
                  }
                  className={`mt-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                    step.completed
                      ? "border-[#2CA66F] bg-[#2CA66F] text-white"
                      : "border-[#E4E0EB] bg-white text-[#9692A1]"
                  }`}
                >
                  {step.completed ? (
                    <Check size={14} />
                  ) : (
                    <Circle size={12} />
                  )}
                </div>

                {index !== setupSteps.length - 1 && (
                  <div
                    className={`my-1 min-h-5 w-px flex-1 ${
                      step.completed
                        ? "bg-[#CDEBDD]"
                        : "bg-[#EAE8F0]"
                    }`}
                  />
                )}
              </div>

              {/* Step Content */}
              <div
                className={`mb-2 min-w-0 flex-1 rounded-lg border p-3 transition ${
                  step.completed
                    ? "border-[#EAE8F0] bg-[#FCFBFD]"
                    : "border-transparent bg-[#FAF9FC] hover:border-[#EAE8F0]"
                }`}
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white">
                    <Icon
                      size={14}
                      className={
                        step.completed
                          ? "text-[#2CA66F]"
                          : "text-[#7547E8]"
                      }
                    />
                  </div>

                  <div className="min-w-0">
                    <p
                      className={`text-xs font-semibold ${
                        step.completed
                          ? "text-[#9692A1]"
                          : "text-[#292637]"
                      }`}
                    >
                      {step.title}
                    </p>

                    <p className="mt-1 text-[10px] leading-4 text-[#8A8697]">
                      {step.description}
                    </p>
                  </div>
                </div>

                <Link
                  href={stepHref}
                  className={`mt-3 inline-flex items-center gap-1 text-[10px] font-semibold transition ${
                    step.completed
                      ? "text-[#6F6B7D] hover:text-[#7547E8]"
                      : "text-[#7547E8] hover:text-[#6335D1]"
                  }`}
                >
                  {step.actionLabel}
                  <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {completedCount === setupSteps.length && (
        <div className="border-t border-[#EAE8F0] bg-[#F7FCF9] px-5 py-3">
          <p className="flex items-center gap-2 text-xs font-medium text-[#238653]">
            <Check size={14} />
            All setup steps completed!
          </p>
        </div>
      )}
    </section>
  );
}