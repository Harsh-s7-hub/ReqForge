"use client";

import { useEffect, useRef, useState } from "react";

import {
  ExternalLink,
  FolderKanban,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

import { GithubIcon } from "@/components/icons/github-icon";

import { Project } from "./types";

interface ProjectCardProps {
  project: Project;
  onOpen?: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

function formatDate(date?: string) {
  if (!date) return "Recently created";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Recently created";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ProjectCard({
  project,
  onOpen,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, [menuOpen]);

  const handleOpen = () => {
    onOpen?.(project);
  };

  const handleCardKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleOpen();
    }

    if (event.key === " ") {
      event.preventDefault();
      handleOpen();
    }
  };

  const handleEdit = () => {
    setMenuOpen(false);
    onEdit?.(project);
  };

  const handleDelete = () => {
    setMenuOpen(false);
    onDelete?.(project);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleCardKeyDown}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-[#EAE8F0] bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#DCD5F5] hover:shadow-[0_8px_30px_rgba(42,35,70,0.08)] focus:outline-none focus:ring-2 focus:ring-[#F0EAFF]"
    >
      {/* Top section */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3 text-left">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0EAFF] text-[#7547E8]">
            <FolderKanban
              size={21}
              strokeWidth={1.9}
            />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold text-[#191725]">
              {project.name}
            </h3>

            <p className="mt-0.5 truncate text-[12px] text-[#9A96A6]">
              Project
            </p>
          </div>
        </div>

        {/* Project actions */}
        <div
          ref={menuRef}
          className="relative shrink-0"
          onClick={(event) =>
            event.stopPropagation()
          }
          onKeyDown={(event) =>
            event.stopPropagation()
          }
        >
          <button
            type="button"
            aria-label="Project options"
            aria-expanded={menuOpen}
            onClick={() => {
              setMenuOpen(
                (current) => !current,
              );
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              menuOpen
                ? "bg-[#F1EFF8] text-[#191725]"
                : "text-[#9A96A6] hover:bg-[#F1F3F7] hover:text-[#191725]"
            }`}
          >
            <MoreHorizontal size={18} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-10 z-50 w-36 overflow-hidden rounded-xl border border-[#EAE8F0] bg-white p-1.5 shadow-[0_10px_35px_rgba(35,25,65,0.12)]">
              {/* Edit */}
              <button
                type="button"
                onClick={handleEdit}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[12px] font-medium text-[#4F4B5C] transition-colors hover:bg-[#F7F6FA] hover:text-[#191725]"
              >
                <Pencil
                  size={14}
                  strokeWidth={1.8}
                />

                <span>Edit</span>
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={handleDelete}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[12px] font-medium text-[#D94A4A] transition-colors hover:bg-[#FFF1F1]"
              >
                <Trash2
                  size={14}
                  strokeWidth={1.8}
                />

                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="mt-5 min-h-[40px] line-clamp-2 text-[13px] leading-5 text-[#6F6B7D]">
        {project.description ||
          "No project description added yet."}
      </p>

      {/* Repository */}
      <div className="mt-5 flex items-center gap-2 rounded-xl bg-[#F7F6FA] px-3 py-2.5">
        <GithubIcon className="rounded-xl bg-[#000000]" />

        <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-[#191725]">
          {project.repositoryName}
        </span>

        {project.repositoryAccessActive ===
          false && (
          <span className="shrink-0 rounded-md bg-[#FFF1F1] px-2 py-1 text-[10px] font-medium text-[#D94A4A]">
            Access lost
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-[#F0EEF4] pt-4">
        <span className="text-[11px] text-[#9A96A6]">
          Created {formatDate(project.createdAt)}
        </span>

        <a
          href={project.repositoryUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(event) =>
            event.stopPropagation()
          }
          className="flex items-center gap-1.5 text-[11px] font-medium text-[#7547E8] transition-colors hover:text-[#6335D1]"
        >
          Repository
          <ExternalLink size={13} />
        </a>
      </div>
    </div>
  );
}