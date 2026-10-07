"use client";

import { useCallback, useEffect, useState } from "react";

import {
  GitBranch,
  Network,
} from "lucide-react";

import {
  ReactFlowProvider,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import { DependencyGraph } from "./dependency-graph";
import { StructuralGraph } from "./structural-graph";

interface SourceGraphProps {
  projectId: number;
  analysisId?: number | null;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8001";

export interface GraphResponse {
  project_id: number;
  analysis_id: number;
  commit_sha: string;
  status: string;
  nodes: GraphApiNode[];
  edges: GraphApiEdge[];
}

export interface GraphApiNode {
  id: string;
  labels: string[];
  properties: Record<string, unknown>;
}

export interface GraphApiEdge {
  source: string;
  target: string;
  type: string;
  properties: Record<string, unknown>;
}

type GraphMode =
  | "structure"
  | "dependencies";

export function SourceGraph({
  projectId,
  analysisId,
}: SourceGraphProps) {
  return (
    <ReactFlowProvider>
      <SourceGraphCanvas
        projectId={projectId}
        analysisId={analysisId}
      />
    </ReactFlowProvider>
  );
}

function SourceGraphCanvas({
  projectId,
  analysisId,
}: SourceGraphProps) {
  const [graphData, setGraphData] =
    useState<GraphResponse | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [graphMode, setGraphMode] =
    useState<GraphMode>("structure");

  const loadGraph = useCallback(
    async (signal?: AbortSignal) => {
      if (!analysisId) {
        setGraphData(null);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      /*
       * Clear the previous analysis immediately.
       *
       * This is important when switching between
       * different commits/analyses.
       */
      setGraphData(null);

      try {
        const response = await fetch(
          `${API_URL}/api/projects/${projectId}/analysis/${analysisId}/graph`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            signal,
          },
        );

        if (!response.ok) {
          let message =
            "Unable to load source graph.";

          try {
            const data =
              await response.json();

            if (
              typeof data.detail ===
              "string"
            ) {
              message = data.detail;
            }
          } catch {
            // Keep default error message.
          }

          throw new Error(message);
        }

        const data =
          (await response.json()) as GraphResponse;

        if (signal?.aborted) {
          return;
        }

        setGraphData(data);
      } catch (err) {
        if (
          err instanceof DOMException &&
          err.name === "AbortError"
        ) {
          return;
        }

        if (signal?.aborted) {
          return;
        }

        setGraphData(null);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load source graph.",
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [projectId, analysisId],
  );

  useEffect(() => {
    const controller =
      new AbortController();

    void loadGraph(
      controller.signal,
    );

    return () => {
      controller.abort();
    };
  }, [loadGraph]);

  /*
   * Reset to Structure whenever the analysis
   * changes.
   *
   * This prevents a dependency view from one
   * analysis being carried into another analysis.
   */
  useEffect(() => {
    setGraphMode("structure");
  }, [analysisId]);

  /*
   * No analysis selected.
   */
  if (!analysisId) {
    return (
      <section className="relative min-h-0 overflow-hidden rounded-2xl border border-[#EAE8F0] bg-white">
        <div className="flex h-full min-h-[420px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0EAFF] text-[#7547E8]">
              <Network
                size={24}
                strokeWidth={1.8}
              />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-[#191725]">
              Source Graph
            </h3>

            <p className="mt-1 max-w-xs text-xs leading-5 text-[#9A96A6]">
              Run an analysis to build the
              repository structure and
              dependency graph.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const retry = () => {
    void loadGraph();
  };

  return (
    <section className="relative min-h-0 overflow-hidden rounded-2xl border border-[#EAE8F0] bg-white">
      {/* Graph Header */}
      <div className="absolute left-4 top-4 z-30 rounded-xl border border-[#EAE8F0] bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#9A96A6]">
              {graphMode ===
              "structure"
                ? "Source Graph"
                : "Dependency Graph"}
            </p>

            <p className="mt-0.5 text-xs font-semibold text-[#191725]">
              Analysis #{analysisId}
            </p>
          </div>

          {graphData?.commit_sha && (
            <>
              <div className="h-7 w-px bg-[#EAE8F0]" />

              <div>
                <p className="text-[10px] uppercase tracking-[0.06em] text-[#9A96A6]">
                  Commit
                </p>

                <p className="font-mono text-[11px] font-medium text-[#7547E8]">
                  {graphData.commit_sha.slice(
                    0,
                    7,
                  )}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Graph Type Switcher */}
      <div className="absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-xl border border-[#EAE8F0] bg-white p-1 shadow-sm">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              setGraphMode("structure")
            }
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-[11px] font-semibold transition-colors ${
              graphMode === "structure"
                ? "bg-[#F0EAFF] text-[#7547E8]"
                : "text-[#6F6B7D] hover:bg-[#F7F6FA] hover:text-[#191725]"
            }`}
          >
            <GitBranch
              size={14}
              strokeWidth={1.8}
            />

            Structure
          </button>

          <button
            type="button"
            onClick={() =>
              setGraphMode(
                "dependencies",
              )
            }
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-[11px] font-semibold transition-colors ${
              graphMode ===
              "dependencies"
                ? "bg-[#F0EAFF] text-[#7547E8]"
                : "text-[#6F6B7D] hover:bg-[#F7F6FA] hover:text-[#191725]"
            }`}
          >
            <Network
              size={14}
              strokeWidth={1.8}
            />

            Dependencies
          </button>
        </div>
      </div>

      {/* Graph */}
      {graphMode === "structure" ? (
        <StructuralGraph
          data={graphData}
          loading={loading}
          error={error}
          onRetry={retry}
        />
      ) : (
        <DependencyGraph
          data={graphData}
          loading={loading}
          error={error}
          onRetry={retry}
        />
      )}

      {/* Analysis Status */}
      {!loading &&
        !error &&
        graphData &&
        graphData.nodes.length > 0 && (
          <div className="absolute bottom-4 right-4 z-30 rounded-lg border border-[#EAE8F0] bg-white px-3 py-2 shadow-sm">
            <div className="flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  graphData.status ===
                  "completed"
                    ? "bg-[#16CFEA]"
                    : graphData.status ===
                        "failed"
                      ? "bg-[#E05252]"
                      : "bg-[#7547E8]"
                }`}
              />

              <span className="text-[11px] font-medium text-[#6F6B7D]">
                {graphData.status
                  ? graphData.status
                      .charAt(0)
                      .toUpperCase() +
                    graphData.status.slice(
                      1,
                    )
                  : "Ready"}
              </span>
            </div>
          </div>
        )}
    </section>
  );
}