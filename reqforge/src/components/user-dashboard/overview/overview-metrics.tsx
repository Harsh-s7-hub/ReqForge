import {
  FolderKanban,
  Bot,
  ShieldCheck,
} from "lucide-react";

import { MetricCard } from "./metric-card";
import { GithubIcon } from "@/components/icons/github-icon";

interface OverviewMetricsProps {
  repositoryCount: number;
  githubConnected: boolean;
  projectsCount: number;
}


export function OverviewMetrics({
  repositoryCount,
  projectsCount,
  githubConnected,
}: OverviewMetricsProps) {
  return (
    <section
      aria-label="Workspace metrics"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <MetricCard
        title="Active Projects"
        value={projectsCount}
        detail="Projects in your workspace"
        icon={FolderKanban}
        iconColor="text-[#7547E8]"
        iconBackground="bg-[#F0EAFF]"
        badge="Getting started"
        badgeColor="bg-[#F0EAFF] text-[#7547E8]"
      />

      <MetricCard
        title="Connected Repositories"
        value={repositoryCount}
        detail={
          githubConnected
            ? "Repositories connected to GitHub"
            : "Connect GitHub to sync repositories"
        }
        icon={GithubIcon}
        iconColor="text-[#2878F0]"
        iconBackground="bg-[#EAF2FF]"
        badge={
          githubConnected
            ? "Connected"
            : "Not connected"
        }
        badgeColor={
          githubConnected
            ? "bg-[#E7F9F1] text-[#238653]"
            : "bg-[#FFF4DE] text-[#D97706]"
        }
      />

      <MetricCard
        title="AI Code Reviews"
        value={0}
        detail="No pull requests reviewed yet"
        icon={Bot}
        iconColor="text-[#7547E8]"
        iconBackground="bg-[#F0EAFF]"
        badge="No activity"
        badgeColor="bg-[#F1F3F7] text-[#6F6B7D]"
      />

      <MetricCard
        title="Security & Compliance"
        value="—"
        detail="Run your first security scan"
        icon={ShieldCheck}
        iconColor="text-[#059669]"
        iconBackground="bg-[#E7F9F1]"
        badge="Not scanned"
        badgeColor="bg-[#FFF4DE] text-[#B7791F]"
      />
    </section>
  );
}