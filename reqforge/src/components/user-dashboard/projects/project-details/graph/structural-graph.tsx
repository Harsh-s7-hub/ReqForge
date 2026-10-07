"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import dagre from "@dagrejs/dagre";

import {
  Background,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import { GraphLegend } from "./graph-legend";
import { GraphNode } from "./graph-node";
import { GraphToolbar } from "./graph-toolbar";

import type {
  GraphApiEdge,
  GraphApiNode,
  GraphResponse,
} from "../graph/source-graph";

interface StructuralGraphProps {
  data: GraphResponse | null;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
}

const nodeTypes = {
  graphNode: GraphNode,
};

const NODE_WIDTH = 220;
const NODE_HEIGHT = 92;

/*
 * Structural relationships only.
 *
 * These relationships describe the repository
 * hierarchy:
 *
 * Project
 *   └── Analysis
 *        └── File
 *             ├── Class
 *             └── Function
 *
 * IMPORTS is intentionally excluded.
 * IMPORTS belongs to dependency-graph.tsx.
 */
const HIERARCHICAL_EDGE_TYPES =
  new Set([
    "HAS_ANALYSIS",
    "CONTAINS",
    "DEFINES_CLASS",
    "DEFINES_FUNCTION",
  ]);

function getStructuralLayout(
  nodes: Node[],
  edges: Edge[],
): Node[] {
  const graph =
    new dagre.graphlib.Graph();

  graph.setDefaultEdgeLabel(
    () => ({}),
  );

  /*
   * Top-to-bottom tree layout.
   *
   * ranksep controls vertical distance
   * between hierarchy levels.
   *
   * nodesep controls horizontal distance
   * between sibling nodes.
   */
  graph.setGraph({
    rankdir: "TB",
    align: "UL",
    nodesep: 80,
    ranksep: 110,
    marginx: 80,
    marginy: 80,
    ranker: "network-simplex",
  });

  nodes.forEach((node) => {
    graph.setNode(node.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });
  });

  edges.forEach((edge) => {
    if (
      edge.source === edge.target
    ) {
      return;
    }

    const edgeType = String(
      edge.label ?? "",
    );

    if (
      !HIERARCHICAL_EDGE_TYPES.has(
        edgeType,
      )
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
      sourcePosition:
        Position.Bottom,
      targetPosition:
        Position.Top,
    };
  });
}

function buildNodes(
  data: GraphResponse,
): Node[] {
  return data.nodes.map(
    (node: GraphApiNode) => ({
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
    }),
  );
}

function buildEdges(
  data: GraphResponse,
): Edge[] {
  return data.edges
    .filter((edge: GraphApiEdge) =>
      HIERARCHICAL_EDGE_TYPES.has(
        edge.type,
      ),
    )
    .map(
      (
        edge: GraphApiEdge,
        index: number,
      ) => ({
        id: `structural-edge-${index}`,

        source: edge.source,

        target: edge.target,

        label: edge.type,

        type: "smoothstep",

        animated: false,

        style: {
          stroke: "#B8B3C5",
          strokeWidth: 1.25,
        },

        labelStyle: {
          fill: "#6F6B7D",
          fontSize: 8,
          fontWeight: 500,
        },

        labelBgStyle: {
          fill: "#FFFFFF",
          fillOpacity: 0.88,
        },

        labelBgPadding: [
          3,
          1,
        ] as [
          number,
          number,
        ],

        labelBgBorderRadius: 3,
      }),
    );
}

export function StructuralGraph({
  data,
  loading,
  error,
  onRetry,
}: StructuralGraphProps) {
  const [nodes, setNodes] =
    useState<Node[]>([]);

  const [edges, setEdges] =
    useState<Edge[]>([]);

  const [viewportKey, setViewportKey] =
    useState(0);

  const prepareGraph =
    useCallback(() => {
      if (!data) {
        setNodes([]);
        setEdges([]);
        return;
      }

      /*
       * Build every node first.
       */
      const allNodes =
        buildNodes(data);

      /*
       * ONLY structural edges.
       *
       * IMPORTS is deliberately removed.
       */
      const structuralEdges =
        buildEdges(data);

      /*
       * Run Dagre only against the
       * structural hierarchy.
       */
      const layoutedNodes =
        getStructuralLayout(
          allNodes,
          structuralEdges,
        );

      setNodes(
        layoutedNodes,
      );

      setEdges(
        structuralEdges,
      );

      /*
       * Force React Flow to recreate
       * its viewport when switching
       * between analyses.
       */
      setViewportKey(
        (current) =>
          current + 1,
      );
    }, [data]);

  useEffect(() => {
    prepareGraph();
  }, [prepareGraph]);

  /*
   * Loading state
   */
  if (loading) {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
        <div className="rounded-xl border border-[#EAE8F0] bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#EAE8F0] border-t-[#7547E8]" />

            <span className="text-sm text-[#6F6B7D]">
              Loading structural graph...
            </span>
          </div>
        </div>
      </div>
    );
  }

  /*
   * Error state
   */
  if (error) {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-white">
        <div className="max-w-sm px-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1F3F7] text-sm font-bold text-[#6F6B7D]">
            !
          </div>

          <h3 className="mt-3 text-sm font-semibold text-[#191725]">
            Unable to load graph
          </h3>

          <p className="mt-1 text-xs leading-5 text-[#9A96A6]">
            {error}
          </p>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 rounded-lg bg-[#7547E8] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[#6335D1]"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  /*
   * Empty state
   */
  if (
    !data ||
    nodes.length === 0
  ) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center">
        <div className="text-center">
          <h3 className="text-sm font-semibold text-[#191725]">
            No structural graph data
          </h3>

          <p className="mt-1 text-xs text-[#9A96A6]">
            No structural nodes were
            generated for this analysis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      key={viewportKey}
      className="relative h-full min-h-[420px] w-full"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
          minZoom: 0.2,
          maxZoom: 1.3,
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

        <GraphToolbar
          onZoomIn={() => {}}
          onZoomOut={() => {}}
          onFitView={() => {}}
          onReset={() => {}}
        />

        <MiniMap
          pannable
          zoomable
          nodeStrokeWidth={2}
          className="!bottom-4 !left-4 !m-0 !h-[180px] !w-[240px] !rounded-xl !border !border-[#EAE8F0] !bg-white"
        />

        <GraphLegend />
      </ReactFlow>
    </div>
  );
}