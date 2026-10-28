"use client";

import { useEffect, useState } from "react";
import type { ModelsOverviewData } from "./types";
import { getModelsOverview, setActiveModel } from "./models-api";
import { ModelsHeader } from "./header/models-header";
import { ModelsKPICards } from "./metrics/models-kpi-cards";
import { ActiveEngineCard } from "./active-engine/active-engine-card";
import { AvailableModelsGrid } from "./model-cache/available-models-grid";
import { DaemonConnectionCard } from "./daemon-settings/daemon-connection-card";
import { TerminalHelperCard } from "./daemon-settings/terminal-helper-card";
import { PullModelDialog } from "./dialogs/pull-model-dialog";

export function ModelsPageContent() {
  const [data, setData] = useState<ModelsOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDialogOpen, setPullDialogOpen] = useState(false);

  function loadData() {
    return getModelsOverview()
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        console.error("Failed to fetch models overview:", err);
      });
  }

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    setTimeout(() => setRefreshing(false), 800);
  }

  async function handleSelectActive(modelName: string) {
    try {
      await setActiveModel(modelName);
      await loadData();
    } catch (err) {
      console.error("Failed to switch model:", err);
    }
  }

  if (loading && !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-sm text-[#6F6B7D]">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-violet-600/30 border-t-violet-600" />
          <span>Connecting to local Ollama inference daemon...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 text-center space-y-3">
        <h3 className="text-sm font-semibold text-red-900">
          Inference Daemon Unreachable
        </h3>
        <p className="text-xs text-red-700 max-w-md mx-auto">
          Ensure Ollama is running locally at <code>http://127.0.0.1:11434</code>.
        </p>
        <button
          type="button"
          onClick={handleRefresh}
          className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-y-auto hide-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-10 animate-in fade-in duration-150">
      {/* 1. Clean Header with Rescan & Pull Actions */}
      <ModelsHeader
        daemon={data.daemon}
        isRefreshing={refreshing}
        onRefresh={handleRefresh}
        onOpenPullDialog={() => setPullDialogOpen(true)}
      />

      {/* 2. Top 4 Metric KPI Cards */}
      <ModelsKPICards
        activeModel={data.active_model}
        daemon={data.daemon}
        kpis={data.kpis}
      />

      {/* 3. Primary Active Engine with Hyperparameters & Sandbox */}
      <ActiveEngineCard
        model={data.active_model}
        initialHyperparams={data.hyperparameters}
        onReloadWeights={handleRefresh}
        onPullUpdates={() => setPullDialogOpen(true)}
      />

      {/* 4. Available Models in Local Cache */}
      <AvailableModelsGrid
        models={data.cached_models}
        totalStorageGb={data.total_cache_size_gb}
        onSelectActive={handleSelectActive}
      />

      {/* 5. Daemon Connection & Terminal Helper */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DaemonConnectionCard endpoint={data.daemon.endpoint} />
        <TerminalHelperCard />
      </div>

      {/* Pull Model Dialog */}
      <PullModelDialog
        isOpen={pullDialogOpen}
        onClose={() => setPullDialogOpen(false)}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
