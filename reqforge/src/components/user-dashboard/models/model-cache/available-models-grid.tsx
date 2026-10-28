"use client";

import { HardDrive } from "lucide-react";
import type { CachedModelItem } from "../types";
import { ModelCardItem } from "./model-card-item";

interface AvailableModelsGridProps {
  models: CachedModelItem[];
  totalStorageGb: number;
  onSelectActive: (name: string) => void;
}

export function AvailableModelsGrid({
  models,
  totalStorageGb,
  onSelectActive,
}: AvailableModelsGridProps) {
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-[#191725]">
            Available Models in Local Cache
          </h3>
          <p className="text-xs text-[#6F6B7D]">
            All models locally stored in <code className="font-mono text-violet-700 bg-[#FAF9FC] px-1 py-0.5 rounded">~/.ollama/models</code> with zero network dependencies.
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-[#EAE8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#6F6B7D] shadow-2xs">
          <HardDrive className="h-3.5 w-3.5 text-[#7547E8]" />
          <span>Storage: <strong className="font-mono text-[#191725]">{totalStorageGb} GB</strong> Total Used</span>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {models.map((m) => (
          <ModelCardItem
            key={m.name}
            model={m}
            onSelectActive={onSelectActive}
          />
        ))}
      </div>
    </div>
  );
}
