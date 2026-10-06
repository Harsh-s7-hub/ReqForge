"use client";

import { useState } from "react";

import {
  Plus,
  LayoutDashboard,
  Network,
  BrainCircuit,
  ArrowRight,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { useDashboardData } from "@/components/user-dashboard/dashboard-data-provider";

import { CreateProjectDialog } from "./create-project-dialog";
import { ProjectEmptyState } from "./project-empty-state";
import { ProjectGrid } from "./project-grid";
import type { Project } from "./types";

interface ProjectBlueprint {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  iconBackground: string;
}

const blueprints: ProjectBlueprint[] = [
  {
    title: "Full-Stack Web",
    description: "Next.js + FastAPI + AST",
    icon: LayoutDashboard,
    iconColor: "text-[#2878F0]",
    iconBackground: "bg-[#EAF2FF]",
  },
  {
    title: "Microservices",
    description: "K8s Mesh + gRPC scans",
    icon: Network,
    iconColor: "text-[#7547E8]",
    iconBackground: "bg-[#F0EAFF]",
  },
  {
    title: "AI Agent Mesh",
    description: "LangGraph & LlamaIndex",
    icon: BrainCircuit,
    iconColor: "text-[#0D9B83]",
    iconBackground: "bg-[#E7F9F1]",
  },
];

export function ProjectsPanel() {
  const router = useRouter();

  const params = useParams<{
    "github-username": string;
  }>();

  const username = params["github-username"];

  const { projects, loading } =
    useDashboardData();

  const [dialogOpen, setDialogOpen] =
    useState(false);

  const [selectedBlueprint, setSelectedBlueprint] =
    useState<string | undefined>(undefined);

  const projectCount = projects.length;

  const openCreateDialog = (
    blueprint?: string,
  ) => {
    setSelectedBlueprint(blueprint);
    setDialogOpen(true);
  };

  const closeCreateDialog = () => {
    setDialogOpen(false);
    setSelectedBlueprint(undefined);
  };

  const openProject = (project: Project) => {
    router.push(
      `/${encodeURIComponent(username)}/projects/${project.id}`,
    );
  };

  return (
    <>
      <section
        aria-label="Your projects"
        className="overflow-hidden rounded-2xl border border-[#EAE8F0] bg-white shadow-[0_2px_12px_rgba(35,25,65,0.04)]"
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-[#EAE8F0] px-5 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-[#191725]">
              Your Projects
            </h2>

            <span className="rounded-full bg-[#F1F3F7] px-2 py-1 text-[10px] font-medium text-[#6F6B7D]">
              {projectCount}{" "}
              {projectCount === 1
                ? "Project"
                : "Projects"}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              openCreateDialog()
            }
            disabled={loading}
            className="flex h-9 items-center gap-2 rounded-lg bg-[#7547E8] px-3.5 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-[#6335D1] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={14} />
            New Project
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="px-5 py-10">
            <div className="flex flex-col items-center justify-center">
              <div className="h-10 w-10 animate-pulse rounded-xl bg-[#F0EAFF]" />

              <div className="mt-4 h-3 w-32 animate-pulse rounded bg-[#F1F3F7]" />

              <div className="mt-2 h-2.5 w-52 animate-pulse rounded bg-[#F1F3F7]" />
            </div>
          </div>
        ) : projectCount === 0 ? (
          <>
            <div className="px-5 py-9">
              <ProjectEmptyState
                onCreateProject={() =>
                  openCreateDialog()
                }
              />
            </div>

            {/* Blueprint Divider */}
            <div className="px-5 pb-7">
              <div className="my-2 flex items-center gap-3">
                <div className="h-px flex-1 bg-[#EAE8F0]" />

                <span className="text-center text-[9px] font-semibold uppercase tracking-wide text-[#9691A6]">
                  Or bootstrap from project
                  blueprints
                </span>

                <div className="h-px flex-1 bg-[#EAE8F0]" />
              </div>

              {/* Project Blueprints */}
              <div className="mt-6 flex items-center justify-between">
                <span className="text-[10px] font-medium text-[#9691A6]">
                  Pre-configured project
                  templates
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {blueprints.map(
                  (blueprint) => {
                    const Icon =
                      blueprint.icon;

                    return (
                      <button
                        key={
                          blueprint.title
                        }
                        type="button"
                        onClick={() =>
                          openCreateDialog(
                            blueprint.title,
                          )
                        }
                        className="group flex min-w-0 items-center gap-2.5 rounded-xl border border-[#EAE8F0] p-3 text-left transition-all hover:border-[#D5C8F5] hover:bg-[#FAF9FC]"
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${blueprint.iconBackground} ${blueprint.iconColor}`}
                        >
                          <Icon size={16} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[10px] font-semibold text-[#191725]">
                            {
                              blueprint.title
                            }
                          </p>

                          <p className="mt-1 truncate text-[9px] text-[#9691A6]">
                            {
                              blueprint.description
                            }
                          </p>
                        </div>

                        <ArrowRight
                          size={13}
                          className="shrink-0 text-[#9691A6] opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                        />
                      </button>
                    );
                  },
                )}
              </div>
            </div>
          </>
        ) : (
          /* Project List */
          <div className="p-5">
            <ProjectGrid
              projects={projects}
              onOpenProject={openProject}
            />
          </div>
        )}
      </section>

      <CreateProjectDialog
        open={dialogOpen}
        blueprint={selectedBlueprint}
        onClose={closeCreateDialog}
      />
    </>
  );
}