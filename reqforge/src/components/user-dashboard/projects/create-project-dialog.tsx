"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";

import {
  useDashboardData,
} from "@/components/user-dashboard/dashboard-data-provider";

interface CreateProjectDialogProps {
  open: boolean;
  blueprint?: string;
  onClose: () => void;
}

export function CreateProjectDialog({
  open,
  blueprint,
  onClose,
}: CreateProjectDialogProps) {
  const {
    repositories,
    createProject,
    creatingProject,
  } = useDashboardData();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [repositoryId, setRepositoryId] = useState("");
  const [repositoryDropdownOpen, setRepositoryDropdownOpen] =
    useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(blueprint ?? "");
    setDescription("");
    setRepositoryId("");
    setRepositoryDropdownOpen(false);
    setError("");
  }, [open, blueprint]);

  if (!open) {
    return null;
  }

  const selectedRepository = repositories.find(
    (repository) =>
      String(repository.id) === repositoryId,
  );

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");

    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }

    if (!repositoryId) {
      setError("Please select a repository.");
      return;
    }

    try {
      await createProject({
        name: name.trim(),
        repositoryId: Number(repositoryId),
        description:
          description.trim() || undefined,
      });

      onClose();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to create project.",
      );
    }
  };

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/30
        px-4
        backdrop-blur-[2px]
      "
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="
          w-full
          max-w-lg
          overflow-visible
          rounded-2xl
          border
          border-[#EAE8F0]
          bg-white
          shadow-[0_20px_60px_rgba(35,25,65,0.16)]
        "
      >
        {/* Header */}
        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-[#EAE8F0]
            px-5
            py-4
          "
        >
          <div>
            <h2 className="text-sm font-bold text-[#191725]">
              Create Project
            </h2>

            <p className="mt-1 text-[11px] text-[#8A8697]">
              Create a RegForge engineering workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={creatingProject}
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              text-[#8A8697]
              transition-colors
              hover:bg-[#F5F3F8]
              hover:text-[#191725]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-5"
        >
          {/* Blueprint */}
          {blueprint && (
            <div
              className="
                rounded-xl
                border
                border-[#EAE8F0]
                bg-[#FAF9FC]
                px-3
                py-2.5
              "
            >
              <p className="text-[9px] font-semibold uppercase tracking-wide text-[#9691A6]">
                Blueprint
              </p>

              <p className="mt-1 text-xs font-semibold text-[#7547E8]">
                {blueprint}
              </p>
            </div>
          )}

          {/* Name */}
          <div>
            <label
              htmlFor="project-name"
              className="
                mb-1.5
                block
                text-[11px]
                font-semibold
                text-[#292637]
              "
            >
              Project name
            </label>

            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="e.g. RegForge Platform"
              maxLength={255}
              autoFocus
              disabled={creatingProject}
              className="
                h-10
                w-full
                rounded-lg
                border
                border-[#EAE8F0]
                bg-white
                px-3
                text-xs
                text-[#191725]
                outline-none
                placeholder:text-[#AAA6B5]
                transition-all
                focus:border-[#BBA8E8]
                focus:ring-2
                focus:ring-[#F0EAFF]
                disabled:cursor-not-allowed
                disabled:bg-[#F8F7FA]
              "
            />
          </div>

          {/* Repository */}
          <div>
            <label
              htmlFor="project-repository"
              className="
                mb-1.5
                block
                text-[11px]
                font-semibold
                text-[#292637]
              "
            >
              Repository
            </label>

            <div className="relative">
              <button
                type="button"
                id="project-repository"
                disabled={
                  creatingProject ||
                  repositories.length === 0
                }
                onClick={() =>
                  setRepositoryDropdownOpen(
                    (current) => !current,
                  )
                }
                className={`
                  flex
                  h-10
                  w-full
                  items-center
                  justify-between
                  rounded-lg
                  border
                  bg-white
                  px-3
                  text-left
                  text-xs
                  outline-none
                  transition-all
                  ${
                    repositoryDropdownOpen
                      ? "border-[#A88BEA] ring-2 ring-[#F0EAFF]"
                      : "border-[#EAE8F0] hover:border-[#D8CDEF]"
                  }
                  disabled:cursor-not-allowed
                  disabled:bg-[#F8F7FA]
                `}
              >
                <span
                  className={
                    selectedRepository
                      ? "truncate font-medium text-[#191725]"
                      : "truncate text-[#AAA6B5]"
                  }
                >
                  {selectedRepository
                    ? selectedRepository.fullName
                    : repositories.length === 0
                      ? "No repositories available"
                      : "Select a repository"}
                </span>

                <ChevronDown
                  size={15}
                  strokeWidth={1.8}
                  className={`
                    ml-2
                    shrink-0
                    text-[#8A8697]
                    transition-transform
                    duration-200
                    ${
                      repositoryDropdownOpen
                        ? "rotate-180 text-[#7547E8]"
                        : ""
                    }
                  `}
                />
              </button>

              {/* Custom Dropdown */}
              {repositoryDropdownOpen &&
                repositories.length > 0 && (
                  <div
                    className="
                      absolute
                      left-0
                      right-0
                      top-[calc(100%+6px)]
                      z-[100]
                      overflow-hidden
                      rounded-xl
                      border
                      border-[#EAE8F0]
                      bg-white
                      p-1
                      shadow-[0_14px_35px_rgba(42,35,70,0.14)]
                    "
                  >
                    <div className="max-h-56 overflow-y-auto">
                      {repositories.map(
                        (repository) => {
                          const selected =
                            String(repository.id) ===
                            repositoryId;

                          return (
                            <button
                              key={repository.id}
                              type="button"
                              onClick={() => {
                                setRepositoryId(
                                  String(repository.id),
                                );
                                setRepositoryDropdownOpen(
                                  false,
                                );
                                setError("");
                              }}
                              className={`
                                flex
                                w-full
                                items-center
                                justify-between
                                rounded-lg
                                px-3
                                py-2.5
                                text-left
                                transition-colors
                                ${
                                  selected
                                    ? "bg-[#F0EAFF]"
                                    : "hover:bg-[#F8F7FA]"
                                }
                              `}
                            >
                              <div className="min-w-0">
                                <p
                                  className={`
                                    truncate
                                    text-xs
                                    ${
                                      selected
                                        ? "font-semibold text-[#7547E8]"
                                        : "font-medium text-[#191725]"
                                    }
                                  `}
                                >
                                  {repository.name}
                                </p>

                                <p className="mt-0.5 truncate text-[10px] text-[#9691A6]">
                                  {repository.fullName}
                                </p>
                              </div>

                              {selected && (
                                <Check
                                  size={15}
                                  strokeWidth={2.2}
                                  className="
                                    ml-3
                                    shrink-0
                                    text-[#7547E8]
                                  "
                                />
                              )}
                            </button>
                          );
                        },
                      )}
                    </div>
                  </div>
                )}
            </div>

            <p className="mt-1.5 text-[10px] text-[#9691A6]">
              Select the repository this project will
              manage.
            </p>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="project-description"
              className="
                mb-1.5
                block
                text-[11px]
                font-semibold
                text-[#292637]
              "
            >
              Description
            </label>

            <textarea
              id="project-description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Describe what this project is responsible for..."
              maxLength={2000}
              rows={4}
              disabled={creatingProject}
              className="
                w-full
                resize-none
                rounded-lg
                border
                border-[#EAE8F0]
                bg-white
                px-3
                py-2.5
                text-xs
                leading-5
                text-[#191725]
                outline-none
                placeholder:text-[#AAA6B5]
                transition-all
                focus:border-[#BBA8E8]
                focus:ring-2
                focus:ring-[#F0EAFF]
                disabled:cursor-not-allowed
                disabled:bg-[#F8F7FA]
              "
            />

            <div className="mt-1 flex justify-end">
              <span className="text-[9px] text-[#AAA6B5]">
                {description.length}/2000
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="
                rounded-lg
                border
                border-[#F1D5D5]
                bg-[#FFF6F6]
                px-3
                py-2.5
                text-[11px]
                text-[#B94A48]
              "
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <div
            className="
              flex
              justify-end
              gap-2
              border-t
              border-[#EAE8F0]
              pt-4
            "
          >
            <button
              type="button"
              onClick={onClose}
              disabled={creatingProject}
              className="
                h-9
                rounded-lg
                border
                border-[#EAE8F0]
                bg-white
                px-4
                text-[11px]
                font-semibold
                text-[#6F6B7D]
                transition-colors
                hover:bg-[#F8F7FA]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                creatingProject ||
                repositories.length === 0
              }
              className="
                h-9
                rounded-lg
                bg-[#7547E8]
                px-4
                text-[11px]
                font-semibold
                text-white
                transition-colors
                hover:bg-[#6335D1]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {creatingProject
                ? "Creating..."
                : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}