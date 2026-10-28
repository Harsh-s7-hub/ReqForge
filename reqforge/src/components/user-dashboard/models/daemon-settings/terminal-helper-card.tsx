"use client";

import { useState } from "react";
import { Check, Copy, ShieldCheck, Terminal as TerminalIcon } from "lucide-react";

export function TerminalHelperCard() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const commands = [
    "ollama run qwen2.5:7b",
    "ollama pull qwen2.5-coder:7b",
  ];

  async function handleCopy(cmd: string, idx: number) {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // fallback
    }
  }

  return (
    <div className="rounded-2xl border border-[#EAE8F0] bg-white p-5 shadow-[0_2px_12px_rgba(35,25,65,0.03)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-4 w-4 text-[#7547E8]" />
          <h3 className="text-sm font-bold text-[#191725]">
            Ollama CLI Commands
          </h3>
        </div>
        <span className="text-[10px] font-semibold text-[#6F6B7D] tracking-wider uppercase">
          Terminal Helper
        </span>
      </div>

      <p className="text-xs text-[#6F6B7D]">
        Copy commands to replicate this local inference runtime on developer laptops:
      </p>

      {/* Commands List */}
      <div className="space-y-2">
        {commands.map((cmd, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between rounded-xl border border-[#EAE8F0] bg-[#FAF9FC] px-3.5 py-2 font-mono text-xs text-[#191725]"
          >
            <span>{cmd}</span>
            <button
              type="button"
              onClick={() => handleCopy(cmd, idx)}
              className="text-[#6F6B7D] hover:text-[#7547E8] transition p-1"
              title="Copy command"
            >
              {copiedIndex === idx ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[#F1EFF8] pt-3 text-[11px] text-[#6F6B7D]">
        <span className="font-mono text-[10.5px]">Ollama process: PID 19284</span>
        <span className="flex items-center gap-1 font-semibold text-emerald-600">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          Zero Cloud Egress
        </span>
      </div>
    </div>
  );
}
