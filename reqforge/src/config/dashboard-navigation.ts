
import type { ComponentType } from "react";

import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Code2,
  FlaskConical,
  BrainCircuit,
  Settings,
} from "lucide-react";

import { GithubIcon } from "@/components/icons/github-icon";

export type AppIcon = ComponentType<{
  className?: string;
}>;

export interface DashboardNavItem {
  label: string;
  href: string;
  icon: AppIcon;
  badge?: string;
  subtitle: string;
}

export interface DashboardNavGroup {
  title: string;
  items: DashboardNavItem[];
}

export const dashboardNavigation: DashboardNavGroup[] = [
  {
    title: "MY WORKSPACE",
    items: [
      {
        label: "Overview",
        href: "",
        icon: LayoutDashboard,
        subtitle: "Your engineering workspace at a glance.",
      },
      {
        label: "Projects",
        href: "/projects",
        icon: FolderKanban,
        subtitle: "Manage and organize your development projects.",
      },
      {
        label: "Repositories",
        href: "/repositories",
        icon: GithubIcon,
        subtitle: "Connect and manage your GitHub repositories.",
      },
    ],
  },
  {
    title: "AI ENGINEERING",
    items: [
      {
        label: "Documentation",
        href: "/documentation",
        icon: FileText,
        subtitle: "Generate and maintain project documentation with AI.",
      },
      {
        label: "Code Review",
        href: "/code-review",
        icon: Code2,
        badge: "AI",
        subtitle: "Review code quality and identify potential issues.",
      },
      {
        label: "Test Generation",
        href: "/tests",
        icon: FlaskConical,
        subtitle: "Generate tests for your repositories with AI.",
      },
    ],
  },
  {
    title: "CONFIGURATION",
    items: [
      {
        label: "AI Models",
        href: "/models",
        icon: BrainCircuit,
        subtitle: "Configure the AI models used across RegForge.",
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        subtitle: "Manage your workspace preferences.",
      },
    ],
  },
];
