"use client";

import { useParams, useRouter } from "next/navigation";

import { useDashboardData } from "@/components/user-dashboard/dashboard-data-provider";

import { OverviewMetrics } from "./overview-metrics";
import { WorkspaceActions } from "./workspace-actions";
import { ProjectsPanel } from "../projects/projects-panel";
import { RepositoriesPanel } from "../repositories/repositories-panel";
import { AgentTelemetry } from "./right-sidebar/agent-telemetry";
import { QuickSetupGuide } from "./right-sidebar/quick-setup-guide";

export function OverviewDashboard() {
  const router = useRouter();

  const params = useParams<{
    "github-username": string;
  }>();

  const githubUsername = params["github-username"];

  const repositoriesRoute = githubUsername
    ? `/${githubUsername}/repositories`
    : "/repositories";

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
          <AgentTelemetry />

          <QuickSetupGuide
            githubConnected={githubInstalled}
            hasRepository={repositories.length > 0}
          />
        </aside>
      </div>
    </div>
  );
}