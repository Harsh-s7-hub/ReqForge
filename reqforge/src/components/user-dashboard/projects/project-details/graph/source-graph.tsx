"use client";

import { useCallback, useEffect, useState } from "react";

import {
  Background,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import { GraphLegend } from "./graph-legend";
import { GraphNode } from "./graph-node";
import { GraphToolbar } from "./graph-toolbar";

interface SourceGraphProps {
  projectId: number;
  analysisId?: number | null;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8001";

interface GraphResponse {
  project_id: number;
  analysis_id: number;
  commit_sha: string;
  status: string;
  nodes: GraphApiNode[];
  edges: GraphApiEdge[];
}

interface GraphApiNode {
  id: string;
  labels: string[];
  properties: Record<string, unknown>;
}

interface GraphApiEdge {
  source: string;
  target: string;
  type: string;
  properties: Record<string, unknown>;
}

const nodeTypes = {
  graphNode: GraphNode,
};

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
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [commitSha, setCommitSha] =
    useState<string | null>(null);

  const [status, setStatus] =
    useState<string | null>(null);

  const {
    zoomIn,
    zoomOut,
    fitView,
    setViewport,
  } = useReactFlow();

  const loadGraph = useCallback(
    async (signal?: AbortSignal) => {
      if (!analysisId) {
        setNodes([]);
        setEdges([]);
        setCommitSha(null);
        setStatus(null);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      /*
       * Clear the previous analysis immediately.
       *
       * Without this, when switching from one commit
       * to another, the previous graph can remain visible
       * while the new graph is loading.
       */
      setNodes([]);
      setEdges([]);
      setCommitSha(null);
      setStatus(null);

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
            // Keep the default error message.
          }

          throw new Error(message);
        }

        const data =
          (await response.json()) as GraphResponse;

        /*
         * The request may have been cancelled while
         * the response was being processed.
         */
        if (signal?.aborted) {
          return;
        }

        setCommitSha(data.commit_sha);
        setStatus(data.status);

        const graphNodes: Node[] =
          data.nodes.map(
            (node, index) => ({
              id: node.id,

              position: {
                x: (index % 4) * 280,
                y:
                  Math.floor(index / 4) *
                  170,
              },

              data: {
                label:
                  String(
                    node.properties.name ??
                      "",
                  ) ||
                  String(
                    node.properties.path ??
                      "",
                  ) ||
                  node.labels[0] ||
                  "Node",

                type:
                  node.labels[0]?.toLowerCase() ??
                  "node",

                path:
                  typeof node.properties
                    .path === "string"
                    ? node.properties.path
                    : undefined,

                language:
                  typeof node.properties
                    .language === "string"
                    ? node.properties.language
                    : undefined,
              },

              type: "graphNode",
            }),
          );

        const graphEdges: Edge[] =
          data.edges.map(
            (edge, index) => ({
              id: `edge-${index}`,

              source: edge.source,
              target: edge.target,

              label: edge.type,

              animated: false,

              style: {
                stroke: "#B8B3C5",
                strokeWidth: 1.5,
              },

              labelStyle: {
                fill: "#6F6B7D",
                fontSize: 9,
                fontWeight: 500,
              },

              labelBgStyle: {
                fill: "#FFFFFF",
                fillOpacity: 0.9,
              },

              labelBgPadding: [4, 2] as [
                number,
                number,
              ],

              labelBgBorderRadius: 4,
            }),
          );

        if (signal?.aborted) {
          return;
        }

        setNodes(graphNodes);
        setEdges(graphEdges);

        /*
         * Fit after React Flow has rendered the new
         * graph nodes.
         */
        requestAnimationFrame(() => {
          if (!signal?.aborted) {
            fitView({
              padding: 0.2,
              duration: 300,
            });
          }
        });
      } catch (err) {
        /*
         * AbortError is expected when the user changes
         * commits before the previous request finishes.
         */
        if (
          err instanceof DOMException &&
          err.name === "AbortError"
        ) {
          return;
        }

        if (signal?.aborted) {
          return;
        }

        setNodes([]);
        setEdges([]);

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
    [
      projectId,
      analysisId,
      fitView,
    ],
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

  function handleReset() {
    setViewport({
      x: 0,
      y: 0,
      zoom: 1,
    });
  }

  if (!analysisId) {
    return (
      <section className="relative min-h-0 overflow-hidden rounded-2xl border border-[#EAE8F0] bg-white">
        <div className="flex h-full min-h-[420px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0EAFF] text-[#7547E8]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <circle
                  cx="6"
                  cy="6"
                  r="2.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />

                <circle
                  cx="18"
                  cy="6"
                  r="2.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />

                <circle
                  cx="12"
                  cy="18"
                  r="2.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />

                <path
                  d="M8.5 6H15.5M7.4 8L10.7 16M16.6 8L13.3 16"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
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

  return (
    <section className="relative min-h-0 overflow-hidden rounded-2xl border border-[#EAE8F0] bg-white">
      {/* Graph Header */}
      <div className="absolute left-4 top-4 z-10 rounded-xl border border-[#EAE8F0] bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#9A96A6]">
              Source Graph
            </p>

            <p className="mt-0.5 text-xs font-semibold text-[#191725]">
              Analysis #{analysisId}
            </p>
          </div>

          {commitSha && (
            <div className="h-7 w-px bg-[#EAE8F0]" />
          )}

          {commitSha && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.06em] text-[#9A96A6]">
                Commit
              </p>

              <p className="font-mono text-[11px] font-medium text-[#7547E8]">
                {commitSha.slice(0, 7)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Graph Toolbar */}
      <GraphToolbar
        onZoomIn={() =>
          zoomIn({ duration: 200 })
        }
        onZoomOut={() =>
          zoomOut({ duration: 200 })
        }
        onFitView={() =>
          fitView({
            padding: 0.2,
            duration: 300,
          })
        }
        onReset={handleReset}
      />

      {/* Graph Legend */}
      <GraphLegend />

      {/* Loading */}
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
          <div className="rounded-xl border border-[#EAE8F0] bg-white px-5 py-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#EAE8F0] border-t-[#7547E8]" />

              <span className="text-sm text-[#6F6B7D]">
                Loading source graph...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white">
          <div className="max-w-sm px-6 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1F3F7] text-[#6F6B7D]">
              !
            </div>

            <h3 className="mt-3 text-sm font-semibold text-[#191725]">
              Unable to load graph
            </h3>

            <p className="mt-1 text-xs leading-5 text-[#9A96A6]">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadGraph()
              }
              className="mt-4 rounded-lg bg-[#7547E8] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[#6335D1]"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Empty Graph */}
      {!loading &&
        !error &&
        nodes.length === 0 && (
          <div className="flex h-full min-h-[420px] items-center justify-center">
            <div className="text-center">
              <h3 className="text-sm font-semibold text-[#191725]">
                No graph data
              </h3>

              <p className="mt-1 text-xs text-[#9A96A6]">
                No structural nodes were
                generated for this analysis.
              </p>
            </div>
          </div>
        )}

      {/* React Flow */}
      {!error && nodes.length > 0 && (
        <div className="h-full min-h-[420px] w-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{
              padding: 0.2,
            }}
            minZoom={0.1}
            maxZoom={2}
            nodesDraggable
            nodesConnectable={false}
            elementsSelectable
            panOnDrag
            zoomOnScroll
            zoomOnPinch
            zoomOnDoubleClick
            proOptions={{
              hideAttribution: true,
            }}
          >
            <Background
              gap={20}
              size={1}
            />

            <MiniMap
              pannable
              zoomable
              nodeStrokeWidth={2}
              className="!bottom-4 !left-4 !m-0 !h-[180px] !w-[240px] !rounded-xl !border !border-[#EAE8F0] !bg-white"
            />
          </ReactFlow>
        </div>
      )}

      {/* Graph Status */}
      {!loading &&
        !error &&
        nodes.length > 0 && (
          <div className="absolute bottom-4 right-4 z-10 rounded-lg border border-[#EAE8F0] bg-white px-3 py-2 shadow-sm">
            <div className="flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  status === "completed"
                    ? "bg-[#16CFEA]"
                    : status === "failed"
                      ? "bg-[#E05252]"
                      : "bg-[#7547E8]"
                }`}
              />

              <span className="text-[11px] font-medium text-[#6F6B7D]">
                {status
                  ? status
                      .charAt(0)
                      .toUpperCase() +
                    status.slice(1)
                  : "Ready"}
              </span>
            </div>
          </div>
        )}
    </section>
  );
}