"use client";

import { Maximize2, Minus, Plus, RotateCcw } from "lucide-react";

interface GraphToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onReset: () => void;
}

export function GraphToolbar({
  onZoomIn,
  onZoomOut,
  onFitView,
  onReset,
}: GraphToolbarProps) {
  return (
    <div className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-xl border border-[#EAE8F0] bg-white p-1 shadow-sm">
      <ToolbarButton
        label="Zoom in"
        onClick={onZoomIn}
      >
        <Plus className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        label="Zoom out"
        onClick={onZoomOut}
      >
        <Minus className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        label="Fit graph"
        onClick={onFitView}
      >
        <Maximize2 className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        label="Reset graph"
        onClick={onReset}
      >
        <RotateCcw className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6F6B7D] transition-colors hover:bg-[#F0EAFF] hover:text-[#7547E8] focus:outline-none focus:ring-2 focus:ring-[#7547E8]/20"
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return (
    <div className="mx-1 h-5 w-px bg-[#EAE8F0]" />
  );
}