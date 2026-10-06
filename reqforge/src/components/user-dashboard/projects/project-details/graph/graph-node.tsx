"use client";

import {
  Braces,
  Box,
  FileCode2,
  FolderGit2,
  GitBranch,
  Layers3,
} from "lucide-react";

import {
  Handle,
  Position,
  type NodeProps,
} from "@xyflow/react";

export interface GraphNodeData {
  label: string;
  type?: string;
  path?: string;
  language?: string;
}

type GraphNodeProps = NodeProps & {
  data: GraphNodeData;
};

interface NodeConfig {
  label: string;
  icon: typeof FolderGit2;
  border: string;
  header: string;
  iconBackground: string;
  iconColor: string;
  labelColor: string;
}

export function GraphNode({
  data,
}: GraphNodeProps) {
  const nodeType =
    data.type?.toLowerCase() ?? "node";

  const config = getNodeConfig(nodeType);

  const Icon = config.icon;

  return (
    <div
      className={`min-w-[180px] max-w-[240px] overflow-hidden rounded-xl border bg-white shadow-sm ${config.border}`}
    >
      {/* Incoming connection */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-2 !border-white !bg-[#7547E8]"
      />

      {/* Header */}
      <div
        className={`flex items-center gap-2 border-b px-3 py-2 ${config.header}`}
      >
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${config.iconBackground}`}
        >
          <Icon
            className={`h-4 w-4 ${config.iconColor}`}
          />
        </div>

        <div className="min-w-0">
          <p
            className={`text-[10px] font-semibold uppercase tracking-[0.08em] ${config.labelColor}`}
          >
            {config.label}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 py-3">
        <p
          className="truncate text-xs font-semibold text-[#191725]"
          title={data.label}
        >
          {data.label}
        </p>

        {data.path && (
          <p
            className="mt-1 truncate font-mono text-[10px] text-[#9A96A6]"
            title={data.path}
          >
            {data.path}
          </p>
        )}

        {data.language && (
          <span className="mt-2 inline-flex rounded-md bg-[#F1F3F7] px-2 py-1 text-[9px] font-medium text-[#6F6B7D]">
            {data.language}
          </span>
        )}
      </div>

      {/* Outgoing connection */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-2 !border-white !bg-[#7547E8]"
      />
    </div>
  );
}

function getNodeConfig(
  type: string,
): NodeConfig {
  switch (type) {
    case "project":
      return {
        label: "Project",
        icon: FolderGit2,
        border: "border-[#DCD3F8]",
        header: "bg-[#F0EAFF]",
        iconBackground: "bg-white",
        iconColor: "text-[#7547E8]",
        labelColor: "text-[#7547E8]",
      };

    case "analysis":
      return {
        label: "Analysis",
        icon: GitBranch,
        border: "border-[#CDEEF4]",
        header: "bg-[#EFFBFD]",
        iconBackground: "bg-white",
        iconColor: "text-[#16AFC5]",
        labelColor: "text-[#1394A8]",
      };

    case "file":
      return {
        label: "File",
        icon: FileCode2,
        border: "border-[#EAE8F0]",
        header: "bg-[#F7F7F9]",
        iconBackground: "bg-white",
        iconColor: "text-[#6F6B7D]",
        labelColor: "text-[#6F6B7D]",
      };

    case "class":
      return {
        label: "Class",
        icon: Box,
        border: "border-[#DDE7F7]",
        header: "bg-[#F3F7FD]",
        iconBackground: "bg-white",
        iconColor: "text-[#5279B9]",
        labelColor: "text-[#5279B9]",
      };

    case "function":
      return {
        label: "Function",
        icon: Braces,
        border: "border-[#E5DCF7]",
        header: "bg-[#F7F3FD]",
        iconBackground: "bg-white",
        iconColor: "text-[#8A62B9]",
        labelColor: "text-[#8057AE]",
      };

    default:
      return {
        label: "Node",
        icon: Layers3,
        border: "border-[#EAE8F0]",
        header: "bg-[#F7F7F9]",
        iconBackground: "bg-white",
        iconColor: "text-[#6F6B7D]",
        labelColor: "text-[#6F6B7D]",
      };
  }
}