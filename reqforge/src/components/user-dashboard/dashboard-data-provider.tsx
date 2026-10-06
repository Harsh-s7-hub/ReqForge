"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { Project } from "@/components/user-dashboard/projects/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export interface GitHubAppInfo {
  installed: boolean;
  installationId: number | null;
  accountLogin: string | null;
  accountType: string | null;
  installationUrl: string;
}

export interface GitHubRepository {
  id: number;
  githubRepoId: number;
  name: string;
  fullName: string;
  ownerLogin: string;
  isPrivate: boolean;
  htmlUrl: string;
  defaultBranch: string;
  lastGithubActivityAt: string | null;
}

interface ApiGitHubRepository {
  id: number;
  github_repo_id: number;
  name: string;
  full_name: string;
  owner_login: string;
  is_private: boolean;
  html_url: string;
  default_branch: string | null;
  last_github_activity_at: string | null;
}

interface ApiProject {
  id: number;
  name: string;
  description: string | null;
  repository_id: number;
  repository_name: string;
  repository_url: string;
  repository_access_active?: boolean;
  current_analysis_id?: number | null;
  created_at?: string;
}

interface CreateProjectInput {
  name: string;
  repositoryId: number;
  description?: string;
}

interface DashboardDataContextValue {
  github: GitHubAppInfo;
  repositories: GitHubRepository[];
  projects: Project[];
  loading: boolean;
  refreshing: boolean;
  creatingProject: boolean;

  refreshDashboardData: () => Promise<void>;

  createProject: (
    data: CreateProjectInput,
  ) => Promise<Project>;

  deleteRepository: (
    repositoryId: number,
  ) => Promise<void>;

  updateProjectCurrentAnalysis: (
    projectId: number,
    analysisId: number,
  ) => void;
}

const defaultGitHub: GitHubAppInfo = {
  installed: false,
  installationId: null,
  accountLogin: null,
  accountType: null,
  installationUrl: "",
};

const DashboardDataContext =
  createContext<DashboardDataContextValue | null>(null);

export function DashboardDataProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [github, setGithub] =
    useState<GitHubAppInfo>(defaultGitHub);

  const [repositories, setRepositories] =
    useState<GitHubRepository[]>([]);

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [creatingProject, setCreatingProject] =
    useState(false);

  const loadDashboardData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const [
          githubResponse,
          repositoriesResponse,
          projectsResponse,
        ] = await Promise.all([
          fetch(`${API_URL}/api/github/app-info`, {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),

          fetch(`${API_URL}/api/github/repositories`, {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),

          fetch(`${API_URL}/api/projects/`, {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        if (!githubResponse.ok) {
          throw new Error(
            "Unable to fetch GitHub app information.",
          );
        }

        if (!repositoriesResponse.ok) {
          throw new Error(
            "Unable to fetch GitHub repositories.",
          );
        }

        if (!projectsResponse.ok) {
          throw new Error(
            "Unable to fetch projects.",
          );
        }

        const githubData =
          await githubResponse.json();

        const repositoriesData =
          await repositoriesResponse.json();

        const projectsData =
          await projectsResponse.json();

        setGithub({
          installed: githubData.installed ?? false,
          installationId:
            githubData.installation_id ?? null,
          accountLogin:
            githubData.account_login ?? null,
          accountType:
            githubData.account_type ?? null,
          installationUrl:
            githubData.installation_url ?? "",
        });

        const apiRepositories =
          (repositoriesData.repositories ??
            []) as ApiGitHubRepository[];

        setRepositories(
          apiRepositories.map((repository) => ({
            id: repository.id,
            githubRepoId:
              repository.github_repo_id,
            name: repository.name,
            fullName:
              repository.full_name,
            ownerLogin:
              repository.owner_login,
            isPrivate:
              repository.is_private,
            htmlUrl:
              repository.html_url,
            defaultBranch:
              repository.default_branch || "main",
            lastGithubActivityAt:
              repository.last_github_activity_at,
          })),
        );

        const apiProjects =
          (projectsData.projects ??
            []) as ApiProject[];

        setProjects(
          apiProjects.map((project) => ({
            id: project.id,
            name: project.name,
            description:
              project.description,
            repositoryId:
              project.repository_id,
            repositoryName:
              project.repository_name,
            repositoryUrl:
              project.repository_url,
            repositoryAccessActive:
              project.repository_access_active,

            currentAnalysisId:
              project.current_analysis_id ?? null,

            createdAt:
              project.created_at,
          })),
        );
      } catch (error) {
        console.error(
          "Failed to load dashboard data:",
          error,
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  const createProject = useCallback(
    async ({
      name,
      repositoryId,
      description,
    }: CreateProjectInput): Promise<Project> => {
      setCreatingProject(true);

      try {
        const response = await fetch(
          `${API_URL}/api/projects/`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name,
              repository_id: repositoryId,
              description:
                description?.trim() || null,
            }),
          },
        );

        let data: {
          success?: boolean;
          project?: ApiProject;
          detail?: string;
        };

        try {
          data = await response.json();
        } catch {
          throw new Error(
            "The server returned an invalid response.",
          );
        }

        if (!response.ok) {
          throw new Error(
            data.detail ||
              "Unable to create project.",
          );
        }

        if (!data.success || !data.project) {
          throw new Error(
            "Project creation returned an invalid response.",
          );
        }

        const apiProject =
          data.project;

        const newProject: Project = {
          id: apiProject.id,
          name: apiProject.name,
          description:
            apiProject.description,
          repositoryId:
            apiProject.repository_id,
          repositoryName:
            apiProject.repository_name,
          repositoryUrl:
            apiProject.repository_url,
          repositoryAccessActive:
            apiProject.repository_access_active ??
            true,

          currentAnalysisId:
            apiProject.current_analysis_id ?? null,

          createdAt:
            apiProject.created_at,
        };

        setProjects((currentProjects) => [
          newProject,
          ...currentProjects,
        ]);

        return newProject;
      } finally {
        setCreatingProject(false);
      }
    },
    [],
  );

  const updateProjectCurrentAnalysis =
    useCallback(
      (
        projectId: number,
        analysisId: number,
      ) => {
        setProjects((currentProjects) =>
          currentProjects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  currentAnalysisId:
                    analysisId,
                }
              : project,
          ),
        );
      },
      [],
    );

  const deleteRepository = useCallback(
    async (
      repositoryId: number,
    ): Promise<void> => {
      const response = await fetch(
        `${API_URL}/api/github/repositories/${repositoryId}`,
        {
          method: "DELETE",
          credentials: "include",
          cache: "no-store",
        },
      );

      let data: {
        success?: boolean;
        message?: string;
        detail?: string;
      };

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The backend returned an invalid response.",
        );
      }

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to remove the repository.",
        );
      }

      if (!data.success) {
        throw new Error(
          "Repository removal failed.",
        );
      }

      setRepositories(
        (currentRepositories) =>
          currentRepositories.filter(
            (repository) =>
              repository.id !== repositoryId,
          ),
      );
    },
    [],
  );

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <DashboardDataContext.Provider
      value={{
        github,
        repositories,
        projects,
        loading,
        refreshing,
        creatingProject,

        refreshDashboardData: () =>
          loadDashboardData(true),

        createProject,

        deleteRepository,

        updateProjectCurrentAnalysis,
      }}
    >
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData() {
  const context =
    useContext(DashboardDataContext);

  if (!context) {
    throw new Error(
      "useDashboardData must be used inside DashboardDataProvider.",
    );
  }

  return context;
}