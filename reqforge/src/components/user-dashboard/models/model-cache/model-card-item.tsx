"use client";

import { Activity, Check, Info, Trash2 } from "lucide-react";
import type { CachedModelItem } from "../types";

interface ModelCardItemProps {
  model: CachedModelItem;
  onSelectActive: (name: string) => void;
}

export function ModelCardItem({ model, onSelectActive }: ModelCardItemProps) {
  const isDefault = model.status === "Active Default";
  const isEmbedder = model.is_embedder;

  return (
    <div
      className={`rounded-2xl border p-4.5 space-y-4 transition ${
        isDefault
          ? "border-violet-200 bg-violet-50/20 shadow-xs"
          : "border-[#EAE8F0] bg-white hover:border-[#D6D3E6]"
      }`}
    >
      {/* Top Badge & Size */}
      <div className="flex items-center justify-between">
        <span
          className={`rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
            isDefault
              ? "bg-[#7547E8] text-white"
              : isEmbedder
              ? "bg-cyan-100 text-cyan-800"
              : "bg-[#F1EFF8] text-[#6F6B7D]"
          }`}
        >
          {model.status}
        </span>

        <span className="font-mono text-xs font-semibold text-[#6F6B7D]">
          {model.size_gb < 1
            ? `${Math.round(model.size_gb * 1024)} MB`
            : `${model.size_gb} GB`}
        </span>
      </div>

      {/* Title & Subtitle */}
      <div className="space-y-0.5">
        <h4 className="font-mono text-sm font-bold text-[#191725] truncate">
          {model.name}
        </h4>
        <p className="text-[11px] text-[#6F6B7D] truncate">
          {model.subtitle}
        </p>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
        <span className="rounded-md border border-[#EAE8F0] bg-[#FAF9FC] px-1.5 py-0.5 font-medium text-[#6F6B7D]">
          {model.quantization}
        </span>
        <span className="rounded-md border border-[#EAE8F0] bg-[#FAF9FC] px-1.5 py-0.5 font-medium text-[#6F6B7D]">
          {model.context_length >= 1000
            ? `${model.context_length / 1000}k ctx`
            : `${model.context_length} ctx`}
        </span>
        <span
          className={`rounded-md px-1.5 py-0.5 font-medium ${
            model.execution_mode.includes("GPU") || model.execution_mode === "Warm"
              ? "bg-cyan-50 text-cyan-700 border border-cyan-100"
              : "bg-gray-100 text-gray-600 border border-gray-200"
          }`}
        >
          {model.execution_mode}
        </span>
      </div>

      {/* Footer Action */}
      <div className="flex items-center justify-between border-t border-[#F1EFF8] pt-3 text-xs">
        {isDefault ? (
          <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Primary
          </span>
        ) : isEmbedder ? (
          <span className="text-[11px] font-medium text-[#6F6B7D]">
            Default Embeddings
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onSelectActive(model.name)}
            className="font-semibold text-violet-600 hover:text-violet-800 transition"
          >
            {model.name.includes("coder") ? "Set as Reviewer" : "Switch to Active"}
          </button>
        )}

        <div className="flex items-center gap-2 text-[#9A96A6]">
          {isEmbedder ? (
            <Info className="h-3.5 w-3.5 cursor-pointer hover:text-[#191725]" />
          ) : (
            <>
              <Activity className="h-3.5 w-3.5 cursor-pointer hover:text-violet-600" />
              {!isDefault && (
                <Trash2 className="h-3.5 w-3.5 cursor-pointer hover:text-red-500" />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
