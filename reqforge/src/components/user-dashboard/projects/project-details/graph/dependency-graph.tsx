"use client";

import { useEffect, useMemo } from "react";

import dagre from "@dagrejs/dagre";

import {
  Background,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import { GraphNode } from "./graph-node";
import { GraphToolbar } from "./graph-toolbar";

import type { GraphResponse } from "./source-graph";

interface DependencyGraphProps {
  data: GraphResponse | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

const nodeTypes = {
  graphNode: GraphNode,
};

const NODE_WIDTH = 220;
const NODE_HEIGHT = 92;

const DEPENDENCY_EDGE_TYPES = new Set([
  "IMPORTS",
]);

/*
 * Dependency graph uses a vertical layout.
 *
 * Direction:
 *
 * Importing File
 *       |
 *       v
 * Imported File
 *
 * Example:
 *
 * app.py
 *   |
 *   v
 * rag_engine.py
 *
 * This makes the arrow direction represent:
 *
 * source -> target
 *
 * where source imports target.
 */
function getDependencyLayout(
  nodes: Node[],
  edges: Edge[],
): Node[] {
  const graph =
    new dagre.graphlib.Graph();

  graph.setDefaultEdgeLabel(
    () => ({}),
  );

  graph.setGraph({
    rankdir: "TB",
    align: "UL",

    nodesep: 90,
    ranksep: 120,

    marginx: 70,
    marginy: 70,

    ranker: "network-simplex",
  });

  nodes.forEach((node) => {
    graph.setNode(node.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });
  });

  /*
   * Only dependency relationships
   * participate in the layout.
   */
  edges.forEach((edge) => {
    if (
      edge.source === edge.target
    ) {
      return;
    }

    if (
      !graph.hasEdge(
        edge.source,
        edge.target,
      )
    ) {
      graph.setEdge(
        edge.source,
        edge.target,
        {},
      );
    }
  });

  dagre.layout(graph);

  return nodes.map((node) => {
    const position =
      graph.node(node.id);

    if (!position) {
      return {
        ...node,

        position: {
          x: 0,
          y: 0,
        },

        sourcePosition:
          Position.Bottom,

        targetPosition:
          Position.Top,
      };
    }

    return {
      ...node,

      position: {
        x:
          position.x -
          NODE_WIDTH / 2,

        y:
          position.y -
          NODE_HEIGHT / 2,
      },

      /*
       * The bottom of the importing
       * node is the source.
       */
      sourcePosition:
        Position.Bottom,

      /*
       * The top of the imported
       * node is the target.
       */
      targetPosition:
        Position.Top,
    };
  });
}

/*
 * Only File nodes belong in the
 * dependency graph.
 *
 * Structural nodes such as:
 *
 * Project
 * Analysis
 * Class
 * Function
 *
 * are intentionally excluded.
 */
function getFileNodes(
  data: GraphResponse,
): Node[] {
  return data.nodes
    .filter((node) =>
      node.labels.includes("File"),
    )
    .map((node) => ({
      id: node.id,

      position: {
        x: 0,
        y: 0,
      },

      type: "graphNode",

      sourcePosition:
        Position.Bottom,

      targetPosition:
        Position.Top,

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
          "File",

        type: "file",

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
    }));
}

/*
 * Convert Neo4j IMPORTS relationships
 * into React Flow dependency edges.
 *
 * IMPORTANT:
 *
 * source = importing file
 * target = imported file
 *
 * Therefore:
 *
 * app.py
 *   ------>
 * rag_engine.py
 *
 * means:
 *
 * app.py IMPORTS rag_engine.py
 */
function getDependencyEdges(
  data: GraphResponse,
  fileNodeIds: Set<string>,
): Edge[] {
  return data.edges
    .filter((edge) => {
      const type = String(
        edge.type ?? "",
      )
        .trim()
        .toUpperCase();

      return (
        DEPENDENCY_EDGE_TYPES.has(
          type,
        ) &&
        fileNodeIds.has(
          edge.source,
        ) &&
        fileNodeIds.has(
          edge.target,
        ) &&
        edge.source !== edge.target
      );
    })
    .map((edge, index) => ({
      id: `dependency-edge-${index}`,

      /*
       * Importing file.
       */
      source: edge.source,

      /*
       * Imported file.
       */
      target: edge.target,

      label: "IMPORTS",

      type: "smoothstep",

      animated: false,

      /*
       * Large visible arrow at the
       * imported-file end.
       */
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 22,
        height: 22,
        color: "#7547E8",
      },

      style: {
        stroke: "#7547E8",
        strokeWidth: 2.2,
      },

      labelStyle: {
        fill: "#6F6B7D",
        fontSize: 8,
        fontWeight: 500,
      },

      labelBgStyle: {
        fill: "#FFFFFF",
        fillOpacity: 0.92,
      },

      labelBgPadding: [
        3,
        1,
      ] as [number, number],

      labelBgBorderRadius: 3,
    }));
}

function DependencyGraphCanvas({
  data,
}: {
  data: GraphResponse;
}) {
  const {
    zoomIn,
    zoomOut,
    fitView,
    setViewport,
  } = useReactFlow();

  const {
    nodes,
    edges,
  } = useMemo(() => {
    const fileNodes =
      getFileNodes(data);

    const fileNodeIds =
      new Set(
        fileNodes.map(
          (node) => node.id,
        ),
      );

    const dependencyEdges =
      getDependencyEdges(
        data,
        fileNodeIds,
      );

    const layoutedNodes =
      getDependencyLayout(
        fileNodes,
        dependencyEdges,
      );

    return {
      nodes: layoutedNodes,
      edges: dependencyEdges,
    };
  }, [data]);

  /*
   * Fit the dependency graph after
   * the nodes and edges have rendered.
   */
  useEffect(() => {
    if (nodes.length === 0) {
      return;
    }

    requestAnimationFrame(() => {
      fitView({
        padding: 0.2,
        duration: 300,
        minZoom: 0.2,
        maxZoom: 1.4,
      });
    });
  }, [
    nodes,
    edges,
    fitView,
  ]);

  function handleReset() {
    fitView({
      padding: 0.2,
      duration: 300,
      minZoom: 0.2,
      maxZoom: 1.4,
    });
  }

  if (nodes.length === 0) {
    return (
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
                cy="12"
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
                cx="18"
                cy="18"
                r="2.5"
                stroke="currentColor"
                strokeWidth="1.8"
              />

              <path
                d="M8.5 11L15.5 7.5M8.5 13L15.5 16.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <h3 className="mt-4 text-sm font-semibold text-[#191725]">
            No dependencies found
          </h3>

          <p className="mt-1 max-w-xs text-xs leading-5 text-[#9A96A6]">
            No file-to-file import
            relationships were detected
            in this analysis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[420px] w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
          minZoom: 0.2,
          maxZoom: 1.4,
        }}
        minZoom={0.12}
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

        {/*
         * Custom graph controls.
         */}
        <GraphToolbar
          onZoomIn={() =>
            zoomIn({
              duration: 200,
            })
          }
          onZoomOut={() =>
            zoomOut({
              duration: 200,
            })
          }
          onFitView={() =>
            fitView({
              padding: 0.2,
              duration: 300,
            })
          }
          onReset={handleReset}
        />

        <MiniMap
          pannable
          zoomable
          nodeStrokeWidth={2}
          className="!bottom-4 !left-4 !m-0 !h-[180px] !w-[240px] !rounded-xl !border !border-[#EAE8F0] !bg-white"
        />
      </ReactFlow>

      {/*
       * Dependency information.
       */}
      <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-xl border border-[#EAE8F0] bg-white px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#7547E8]" />

            <span className="text-[10px] font-medium text-[#6F6B7D]">
              File dependency
            </span>
          </div>

          <div className="h-4 w-px bg-[#EAE8F0]" />

          <span className="font-mono text-[10px] text-[#9A96A6]">
            IMPORTS
          </span>

          <div className="h-4 w-px bg-[#EAE8F0]" />

          <span className="text-[10px] text-[#9A96A6]">
            {nodes.length} files
          </span>

          <span className="text-[10px] text-[#9A96A6]">
            {edges.length} dependencies
          </span>
        </div>
      </div>
    </div>
  );
}

export function DependencyGraph({
  data,
  loading,
  error,
  onRetry,
}: DependencyGraphProps) {
  if (loading) {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-[1px]">
        <div className="rounded-xl border border-[#EAE8F0] bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#EAE8F0] border-t-[#7547E8]" />

            <span className="text-sm text-[#6F6B7D]">
              Loading dependency graph...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-white">
        <div className="max-w-sm px-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1F3F7] text-sm font-bold text-[#6F6B7D]">
            !
          </div>

          <h3 className="mt-3 text-sm font-semibold text-[#191725]">
            Unable to load dependency graph
          </h3>

          <p className="mt-1 text-xs leading-5 text-[#9A96A6]">
            {error}
          </p>

          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-lg bg-[#7547E8] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[#6335D1]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <ReactFlowProvider>
      <DependencyGraphCanvas
        data={data}
      />
    </ReactFlowProvider>
  );
}