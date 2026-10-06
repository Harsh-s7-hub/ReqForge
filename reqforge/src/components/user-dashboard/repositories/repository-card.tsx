"use client";

import {
  ExternalLink,
  GitBranch,
  Globe,
  LockKeyhole,
  MoreHorizontal,
  Trash2,
} from "lucide-react";

import { useState } from "react";

import { GithubIcon } from "@/components/icons/github-icon";

import { Repository } from "./types";

interface RepositoryCardProps {
  repository: Repository;
  onOpen?: (repository: Repository) => void;
  onDelete?: (repository: Repository) => Promise<void>;
}

function formatActivityTime(date?: string | null) {
  if (!date) {
    return "No recent activity";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "No recent activity";
  }

  const now = Date.now();
  const difference =
    now - parsed.getTime();

  const minutes = Math.floor(
    difference / (1000 * 60)
  );

  const hours = Math.floor(
    difference / (1000 * 60 * 60)
  );

  const days = Math.floor(
    difference / (1000 * 60 * 60 * 24)
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  if (days < 7) {
    return `${days}d ago`;
  }

  return parsed.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}

export function RepositoryCard({
  repository,
  onOpen,
  onDelete,
}: RepositoryCardProps) {
  const [menuOpen, setMenuOpen] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Remove "${repository.name}" from RegForge?\n\nThe GitHub repository itself will not be deleted.`
    );

    if (!confirmed) {
      return;
    }

    if (!onDelete) {
      return;
    }

    try {
      setDeleting(true);
      setMenuOpen(false);

      await onDelete(repository);
    } catch (error) {
      console.error(
        "Failed to delete repository:",
        error
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to remove the repository."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="group relative overflow-visible rounded-2xl border border-[#EAE8F0] bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#DCD5F5] hover:shadow-[0_8px_30px_rgba(42,35,70,0.08)]"
    >
      {/* Top section */}
      <div className="flex items-start justify-between gap-4">
        <button
          type="button"
          onClick={() =>
            onOpen?.(repository)
          }
          className="flex min-w-0 items-center gap-3 text-left"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#191725]">
            <GithubIcon className="h-6 w-6 text-white" />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold text-[#191725]">
              {repository.name}
            </h3>

            <p className="mt-0.5 truncate text-[12px] text-[#9A96A6]">
              {repository.fullName}
            </p>
          </div>
        </button>

        {/* Options */}
        <div className="relative shrink-0">
          <button
            type="button"
            aria-label="Repository options"
            aria-expanded={menuOpen}
            disabled={deleting}
            onClick={() =>
              setMenuOpen((open) => !open)
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9A96A6] transition-colors hover:bg-[#F1F3F7] hover:text-[#191725] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MoreHorizontal size={18} />
          </button>

          {menuOpen && (
            <>
              {/* Click-away layer */}
              <button
                type="button"
                aria-label="Close menu"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() =>
                  setMenuOpen(false)
                }
              />

              {/* Dropdown */}
              <div className="absolute right-0 top-10 z-50 w-44 overflow-hidden rounded-xl border border-[#EAE8F0] bg-white p-1.5 shadow-[0_10px_35px_rgba(42,35,70,0.14)]">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[12px] font-medium text-[#D94A4A] transition-colors hover:bg-[#FFF1F1]"
                >
                  <Trash2 size={15} />

                  <span>
                    Delete Repository
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="mt-5 min-h-[40px] line-clamp-2 text-[13px] leading-5 text-[#6F6B7D]">
        {repository.description ||
          "No repository description available."}
      </p>

      {/* Repository metadata */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-lg bg-[#F1F3F7] px-2.5 py-1.5 text-[11px] font-medium text-[#6F6B7D]">
          {repository.isPrivate ? (
            <LockKeyhole size={13} />
          ) : (
            <Globe size={13} />
          )}

          {repository.isPrivate
            ? "Private"
            : "Public"}
        </span>

        {repository.defaultBranch && (
          <span className="flex items-center gap-1.5 rounded-lg bg-[#F1F3F7] px-2.5 py-1.5 text-[11px] font-medium text-[#6F6B7D]">
            <GitBranch size={13} />

            {repository.defaultBranch}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-[#F0EEF4] pt-4">
        <span className="text-[11px] text-[#9A96A6]">
          {formatActivityTime(
            repository.lastGithubActivityAt
          )}
        </span>

        <a
          href={repository.htmlUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(event) =>
            event.stopPropagation()
          }
          className="flex items-center gap-1.5 text-[11px] font-medium text-[#7547E8] transition-colors hover:text-[#6335D1]"
        >
          GitHub

          <ExternalLink size={13} />
        </a>
      </div>
    </div>
  );
}