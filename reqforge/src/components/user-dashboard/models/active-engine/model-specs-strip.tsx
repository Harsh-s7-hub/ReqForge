"use client";

import type { ActiveModelDetails } from "../types";

interface ModelSpecsStripProps {
  model: ActiveModelDetails;
}

export function ModelSpecsStrip({ model }: ModelSpecsStripProps) {
  const specs = [
    {
      label: "PARAMETER COUNT",
      value: model.parameter_count,
      sub: "Dense Architecture",
    },
    {
      label: "QUANTIZATION",
      value: "4-bit",
      sub: "q4_K_Medium Symmetric",
    },
    {
      label: "CONTEXT WINDOW",
      value: model.context_window.toLocaleString(),
      sub: "Native 128k supported",
    },
    {
      label: "VRAM FOOTPRINT",
      value: `${model.vram_footprint_gb} GB`,
      sub: "100% GPU Offloaded",
    },
    {
      label: "ENDPOINT URI",
      value: "/api/generate",
      sub: "POST JSON Stream",
    },
    {
      label: "EXECUTION MODE",
      value: "● Metal (MPS)",
      sub: "Apple Silicon / CUDA GPU",
      isLive: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 rounded-xl border border-[#EAE8F0] bg-[#FAF9FC] p-4">
      {specs.map((s, idx) => (
        <div key={idx} className="space-y-1">
          <span className="text-[10px] font-semibold tracking-wider text-[#6F6B7D] uppercase">
            {s.label}
          </span>
          <div
            className={`text-sm font-bold tracking-tight ${
              s.isLive ? "text-emerald-700" : "text-[#191725]"
            }`}
          >
            {s.value}
          </div>
          <p className="text-[10px] text-[#9A96A6] truncate">{s.sub}</p>
        </div>
      ))}
    </div>
  );
}
