"use client";

import { Repository } from "./types";
import { RepositoryCard } from "./repository-card";

interface RepositoryGridProps {
  repositories: Repository[];
  onOpenRepository?: (
    repository: Repository
  ) => void;
  onDeleteRepository?: (
    repository: Repository
  ) => Promise<void>;
}

export function RepositoryGrid({
  repositories,
  onOpenRepository,
  onDeleteRepository,
}: RepositoryGridProps) {
  if (repositories.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {repositories.map((repository) => (
        <RepositoryCard
          key={repository.id}
          repository={repository}
          onOpen={onOpenRepository}
          onDelete={onDeleteRepository}
        />
      ))}
    </div>
  );
}