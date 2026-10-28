"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useDashboardData } from "@/components/user-dashboard/dashboard-data-provider";

import { OverviewMetrics } from "./overview-metrics";
import { WorkspaceActions } from "./workspace-actions";
import { ProjectsPanel } from "../projects/projects-panel";
import { RepositoriesPanel } from "../repositories/repositories-panel";
import { AgentTelemetry, type AgentActivity } from "./right-sidebar/agent-telemetry";
import { QuickSetupGuide } from "./right-sidebar/quick-setup-guide";

interface OverviewTelemetryData {
  active_agents: number;
  total_executions: number;
  ai_models_configured: boolean;
  first_workflow_completed: boolean;
  recent_activities: AgentActivity[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export function OverviewDashboard() {
  const router = useRouter();

  const params = useParams<{
    "github-username": string;
  }>();

  const githubUsername = params["github-username"];

  const repositoriesRoute = githubUsername
    ? `/${githubUsername}/repositories`
    : "/repositories";

  const [telemetry, setTelemetry] = useState<OverviewTelemetryData | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch(`${API_URL}/api/overview/telemetry`, {
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Telemetry fetch failed");
        return res.json();
      })
      .then((data: OverviewTelemetryData) => {
        if (mounted) setTelemetry(data);
      })
      .catch((err) => {
        console.warn("Could not load overview telemetry:", err);
      });

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * Get GitHub and repository data from the shared
   * dashboard provider.
   *
   * This data survives navigation between dashboard
   * sections because the provider lives in the
   * [github-username] layout.
   */
  const {
    github,
    repositories,
    projects,
    loading,
  } = useDashboardData();

  const handleManageRepositories = () => {
    router.push(repositoriesRoute);
  };

  const githubInstalled = github.installed;

  return (
    <div className="w-full space-y-6">
      <OverviewMetrics
        repositoryCount={repositories.length}
        githubConnected={githubInstalled}
        projectsCount={projects.length}
        
      />

      <WorkspaceActions
        githubConnected={githubInstalled}
        repositoryCount={repositories.length}
        installationUrl={github.installationUrl}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="min-w-0 space-y-6 xl:col-span-2">
          <ProjectsPanel />

         <RepositoriesPanel
  variant="overview"
  onManageRepositories={handleManageRepositories}
/>
        </div>

        <aside className="min-w-0 space-y-5">
          <AgentTelemetry
            activities={telemetry?.recent_activities || []}
            activeAgents={telemetry?.active_agents || 0}
            totalExecutions={telemetry?.total_executions || 0}
          />

          <QuickSetupGuide
            githubConnected={githubInstalled}
            hasRepository={repositories.length > 0}
            aiModelsConfigured={telemetry?.ai_models_configured ?? false}
            firstWorkflowCompleted={
              telemetry?.first_workflow_completed ??
              projects.some((p) => Boolean(p.currentAnalysisId))
            }
          />
        </aside>
      </div>
    </div>
  );
}