"use client";

import { useMemo, useState } from "react";
import {
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  Settings2,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { useDashboardData } from "@/components/user-dashboard/dashboard-data-provider";

import { Repository } from "./types";
import { RepositoryGrid } from "./repository-grid";
import { RepositoryEmptyState } from "./repository-empty-state";

type ViewVariant = "overview" | "full";

interface RepositoriesPanelProps {
  variant?: ViewVariant;
  onInstallGitHub?: () => void;
  onManageRepositories?: () => void;
}

export function RepositoriesPanel({
  variant = "overview",
  onInstallGitHub,
  onManageRepositories,
}: RepositoriesPanelProps) {
  const router = useRouter();

  const {
    github,
    repositories: dashboardRepositories,
    loading,
    refreshing,
    refreshDashboardData,
    deleteRepository,
  } = useDashboardData();

  const [searchQuery, setSearchQuery] = useState("");

  const isOverview = variant === "overview";

  /*
   * Convert the shared dashboard repository shape
   * into the Repository shape used by the UI.
   */
  const repositories: Repository[] = useMemo(
    () =>
      dashboardRepositories.map((repository) => ({
        id: repository.id,
        githubRepoId: repository.githubRepoId,
        name: repository.name,
        fullName: repository.fullName,
        ownerLogin: repository.ownerLogin,
        isPrivate: repository.isPrivate,
        htmlUrl: repository.htmlUrl,
        defaultBranch: repository.defaultBranch,
        lastGithubActivityAt:
          repository.lastGithubActivityAt,
      })),
    [dashboardRepositories],
  );

  const filteredRepositories = useMemo(() => {
    const normalizedQuery = searchQuery
      .trim()
      .toLowerCase();

    if (!normalizedQuery) {
      return repositories;
    }

    return repositories.filter((repository) => {
      return (
        repository.name
          .toLowerCase()
          .includes(normalizedQuery) ||
        repository.fullName
          .toLowerCase()
          .includes(normalizedQuery) ||
        repository.ownerLogin
          ?.toLowerCase()
          .includes(normalizedQuery)
      );
    });
  }, [repositories, searchQuery]);

  const visibleRepositories = useMemo(() => {
    if (!isOverview) {
      return filteredRepositories;
    }

    return filteredRepositories.slice(0, 3);
  }, [filteredRepositories, isOverview]);

  const handleInstallGitHub = () => {
    if (onInstallGitHub) {
      onInstallGitHub();
      return;
    }

    if (github.installationUrl) {
      window.location.href = github.installationUrl;
    }
  };

  const handleRefresh = () => {
    void refreshDashboardData();
  };

  const handleDeleteRepository = async (
    repository: Repository,
  ) => {
    await deleteRepository(Number(repository.id));
  };

  return (
    <section className="w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-[#191725]">
              Repositories
            </h2>

            {!loading && (
              <span
                className="
                  rounded-full
                  bg-[#F0EAFF]
                  px-2
                  py-0.5
                  text-[10px]
                  font-semibold
                  text-[#7547E8]
                "
              >
                {repositories.length}
              </span>
            )}
          </div>

          <p className="mt-1 text-[12px] text-[#9A96A6]">
            {isOverview
              ? "Your recently used GitHub repositories."
              : "Manage the repositories connected to RegForge."}
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {/* Full repositories page */}
          {!isOverview && (
            <>
              {/* Add Repository */}
              {github.installed &&
              github.installationUrl ? (
                <a
                  href={github.installationUrl}
                  className="
                    inline-flex
                    h-9
                    items-center
                    gap-2
                    rounded-lg
                    bg-[#7547E8]
                    px-3.5
                    text-[11px]
                    font-semibold
                    text-white
                    transition-colors
                    hover:bg-[#6335D1]
                  "
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Repository
                </a>
              ) : (
                <button
                  type="button"
                  onClick={handleInstallGitHub}
                  disabled={loading}
                  className="
                    inline-flex
                    h-9
                    items-center
                    gap-2
                    rounded-lg
                    bg-[#7547E8]
                    px-3.5
                    text-[11px]
                    font-semibold
                    text-white
                    transition-colors
                    hover:bg-[#6335D1]
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Repository
                </button>
              )}

              {/* Refresh */}
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="
                  inline-flex
                  h-9
                  items-center
                  gap-2
                  rounded-lg
                  border
                  border-[#EAE8F0]
                  bg-white
                  px-3
                  text-[11px]
                  font-medium
                  text-[#6F6B7D]
                  transition-colors
                  hover:border-[#DCD7EB]
                  hover:bg-[#F9F8FB]
                  hover:text-[#191725]
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />

                Refresh
              </button>
            </>
          )}

          {/* Overview Manage button */}
          {isOverview &&
            repositories.length > 0 && (
              <button
                type="button"
                onClick={onManageRepositories}
                className="
                  inline-flex
                  h-9
                  items-center
                  gap-2
                  rounded-lg
                  border
                  border-[#EAE8F0]
                  bg-white
                  px-3
                  text-[11px]
                  font-medium
                  text-[#6F6B7D]
                  transition-colors
                  hover:border-[#DCD7EB]
                  hover:bg-[#F9F8FB]
                  hover:text-[#191725]
                "
              >
                <Settings2 className="h-3.5 w-3.5" />
                Manage
              </button>
            )}
        </div>
      </div>

      {/* Search - full page only */}
      {!isOverview && repositories.length > 0 && (
        <div className="mt-5">
          <div className="relative max-w-md">
            <Search
              className="
                pointer-events-none
                absolute
                left-3
                top-1/2
                h-4
                w-4
                -translate-y-1/2
                text-[#9A96A6]
              "
            />

            <input
              type="text"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Search repositories..."
              className="
                h-10
                w-full
                rounded-xl
                border
                border-[#EAE8F0]
                bg-white
                pl-9
                pr-4
                text-[12px]
                text-[#191725]
                outline-none
                placeholder:text-[#AAA6B5]
                focus:border-[#CFC5EA]
                focus:ring-2
                focus:ring-[#F0EAFF]
              "
            />
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="
                h-[190px]
                animate-pulse
                rounded-2xl
                border
                border-[#EAE8F0]
                bg-white
              "
            />
          ))}
        </div>
      ) : repositories.length === 0 ? (
        <div className="mt-5">
          <RepositoryEmptyState
            onAction={handleInstallGitHub}
          />
        </div>
      ) : visibleRepositories.length === 0 ? (
        <div
          className="
            mt-5
            flex
            min-h-[220px]
            items-center
            justify-center
            rounded-2xl
            border
            border-[#EAE8F0]
            bg-white
          "
        >
          <div className="text-center">
            <Search className="mx-auto h-5 w-5 text-[#9A96A6]" />

            <p className="mt-3 text-[13px] font-medium text-[#191725]">
              No repositories found
            </p>

            <p className="mt-1 text-[12px] text-[#9A96A6]">
              Try a different repository name or owner.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-5">
            <RepositoryGrid
              repositories={visibleRepositories}
              onDeleteRepository={
                handleDeleteRepository
              }
            />
          </div>

          {isOverview &&
            repositories.length >
              visibleRepositories.length && (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={onManageRepositories}
                  className="
                    inline-flex
                    items-center
                    gap-1.5
                    text-[11px]
                    font-semibold
                    text-[#7547E8]
                    transition-colors
                    hover:text-[#6335D1]
                  "
                >
                  View all repositories

                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            )}
        </>
      )}
    </section>
  );
}