"use client";

import { useState } from "react";
import { Brain, Download, Play, RefreshCw } from "lucide-react";
import type { ActiveModelDetails, GenerationHyperparameters as HyperparamsType } from "../types";
import { ModelSpecsStrip } from "./model-specs-strip";
import { GenerationHyperparameters } from "./generation-hyperparameters";
import { InferenceSandbox } from "./inference-sandbox";

interface ActiveEngineCardProps {
  model: ActiveModelDetails;
  initialHyperparams: HyperparamsType;
  onReloadWeights: () => void;
  onPullUpdates: () => void;
}

export function ActiveEngineCard({
  model,
  initialHyperparams,
  onReloadWeights,
  onPullUpdates,
}: ActiveEngineCardProps) {
  const [hyperparams, setHyperparams] = useState<HyperparamsType>(initialHyperparams);
  const [reloading, setReloading] = useState(false);
  const [evalTrigger, setEvalTrigger] = useState(0);

  function handleReload() {
    setReloading(true);
    onReloadWeights();
    setTimeout(() => setReloading(false), 1200);
  }

  return (
    <div className="rounded-2xl border border-[#EAE8F0] bg-white p-6 shadow-[0_2px_12px_rgba(35,25,65,0.03)] space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7547E8] text-white shadow-sm shrink-0">
            <Brain className="h-6 w-6" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-[#191725]">
                {model.display_name}
              </h2>
              <span className="rounded-md bg-[#7547E8] px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">
                {model.tag}
              </span>
              <span className="rounded-md border border-[#EAE8F0] bg-[#FAF9FC] px-2 py-0.5 font-mono text-[10px] font-medium text-[#6F6B7D]">
                q4_K_M
              </span>
            </div>

            <p className="max-w-2xl text-xs text-[#6F6B7D] leading-relaxed">
              {model.description}
            </p>
          </div>
        </div>

        {/* Top Right Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReload}
            disabled={reloading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#EAE8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#191725] transition hover:bg-[#FAF9FC] cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#6F6B7D] ${reloading ? "animate-spin" : ""}`} />
            <span>Reload Weights</span>
          </button>

          <button
            type="button"
            onClick={onPullUpdates}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#EAE8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#191725] transition hover:bg-[#FAF9FC] cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-[#6F6B7D]" />
            <span>Pull Updates</span>
          </button>

          <button
            type="button"
            onClick={() => setEvalTrigger((c) => c + 1)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#7547E8] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#6335D1] cursor-pointer shadow-xs"
          >
            <Play className="h-3 w-3 fill-white" />
            <span>Test Inference</span>
          </button>
        </div>
      </div>

      {/* Model Spec Strip */}
      <ModelSpecsStrip model={model} />

      {/* Split Grid: Hyperparameters vs Inference Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2 border-t border-[#EAE8F0]">
        <GenerationHyperparameters
          initialHyperparams={hyperparams}
          onChange={setHyperparams}
        />

        <InferenceSandbox
          modelName={model.name}
          hyperparameters={hyperparams}
          triggerEvaluation={evalTrigger}
        />
      </div>
    </div>
  );
}
