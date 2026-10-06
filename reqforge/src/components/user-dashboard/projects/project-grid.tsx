"use client";

import { Project } from "./types";
import { ProjectCard } from "./project-card";

interface ProjectGridProps {
  projects: Project[];
  onOpenProject?: (project: Project) => void;
}

export function ProjectGrid({
  projects,
  onOpenProject,
}: ProjectGridProps) {
  if (projects.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onOpen={onOpenProject}
        />
      ))}
    </div>
  );
}