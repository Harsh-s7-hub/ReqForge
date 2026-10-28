"use client";

import { Activity, Bot, Cpu, Layers } from "lucide-react";
import type { ActiveModelDetails, DaemonStatus, ModelKPIs } from "../types";

interface ModelsKPICardsProps {
  activeModel: ActiveModelDetails;
  daemon: DaemonStatus;
  kpis: ModelKPIs;
}

export function ModelsKPICards({
  activeModel,
  daemon,
  kpis,
}: ModelsKPICardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* 1. Active Default Model */}
      <div className="rounded-2xl border border-[#EAE8F0] bg-white p-5 shadow-[0_2px_12px_rgba(35,25,65,0.03)] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider text-[#6F6B7D] uppercase">
            Active Default Model
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600 border border-violet-100">
            <Bot className="h-4 w-4" />
          </div>
        </div>

        <div>
          <div className="text-xl font-bold tracking-tight text-[#191725]">
            {activeModel.display_name}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <span className="rounded-md bg-[#F0EAFF] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#7547E8]">
            {activeModel.name}
          </span>
          <span className="text-[11px] font-medium text-[#6F6B7D]">
            {daemon.execution_mode}
          </span>
        </div>
      </div>

      {/* 2. Inference Latency */}
      <div className="rounded-2xl border border-[#EAE8F0] bg-white p-5 shadow-[0_2px_12px_rgba(35,25,65,0.03)] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider text-[#6F6B7D] uppercase">
            Inference Latency
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100">
            <Activity className="h-4 w-4" />
          </div>
        </div>

        <div>
          <span className="text-xl font-bold tracking-tight text-[#191725]">
            {kpis.inference_latency_ms}
          </span>
          <span className="ml-1 text-xs font-medium text-[#6F6B7D]">ms/tok</span>
        </div>

        <div className="flex items-center gap-3 pt-1 text-xs">
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
            ↗ {kpis.throughput_tok_s} tok/s
          </span>
          <span className="text-[#9A96A6]">P99: 48.1ms</span>
        </div>
      </div>

      {/* 3. Daily Volume (Today) */}
      <div className="rounded-2xl border border-[#EAE8F0] bg-white p-5 shadow-[0_2px_12px_rgba(35,25,65,0.03)] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider text-[#6F6B7D] uppercase">
            Daily Volume (Today)
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600 border border-violet-100">
            <Layers className="h-4 w-4" />
          </div>
        </div>

        <div>
          <span className="text-xl font-bold tracking-tight text-[#191725]">
            {kpis.daily_volume_tokens >= 1000
              ? `${(kpis.daily_volume_tokens / 1000).toFixed(1)}k`
              : kpis.daily_volume_tokens.toLocaleString()}
          </span>
          <span className="ml-1 text-xs font-medium text-[#6F6B7D]">tokens</span>
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="h-1.5 w-full rounded-full bg-[#F1EFF8] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#7547E8] transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(8, Math.round((kpis.daily_volume_tokens / 50000) * 100)))}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-[#6F6B7D]">
            <span>
              {kpis.daily_prompts_count.toLocaleString()}{" "}
              {kpis.daily_prompts_count === 1 ? "Prompt" : "Prompts"}
            </span>
            <span className="text-[10px] text-[#9A96A6]">Daily Target 50k</span>
          </div>
        </div>
      </div>

      {/* 4. VRAM Utilization */}
      <div className="rounded-2xl border border-[#EAE8F0] bg-white p-5 shadow-[0_2px_12px_rgba(35,25,65,0.03)] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider text-[#6F6B7D] uppercase">
            VRAM Utilization
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600 border border-violet-100">
            <Cpu className="h-4 w-4" />
          </div>
        </div>

        <div>
          <span className="text-xl font-bold tracking-tight text-[#191725]">
            {daemon.vram_used_gb}
          </span>
          <span className="text-xs font-medium text-[#6F6B7D]">
            {" "}
            / {daemon.vram_total_gb} GB
          </span>
        </div>

        <div className="flex items-center gap-2 pt-1 text-xs">
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {kpis.vram_utilization_pct}% Bound
          </span>
          <span className="text-[#9A96A6] truncate">{daemon.execution_mode}</span>
        </div>
      </div>
    </div>
  );
}
