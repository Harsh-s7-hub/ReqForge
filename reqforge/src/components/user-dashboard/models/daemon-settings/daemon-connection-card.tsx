"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Cloud, Network } from "lucide-react";

interface DaemonConnectionCardProps {
  endpoint: string;
}

interface TimeoutOption {
  value: string;
  label: string;
  description: string;
}

const TIMEOUT_OPTIONS: TimeoutOption[] = [
  {
    value: "15m",
    label: "15m (Fast Unload)",
    description: "Releases VRAM quickly when idle",
  },
  {
    value: "60m",
    label: "60m (Stay in VRAM for 1 hour)",
    description: "Recommended for active development workflows",
  },
  {
    value: "240m",
    label: "240m (Persistent)",
    description: "Keeps model weights warm across long sessions",
  },
  {
    value: "-1",
    label: "Indefinite (-1)",
    description: "Never evicts model weights from GPU memory",
  },
];

export function DaemonConnectionCard({ endpoint }: DaemonConnectionCardProps) {
  const [url, setUrl] = useState(endpoint);
  const [timeout, setTimeoutVal] = useState("60m");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [fallbackEnabled, setFallbackEnabled] = useState(true);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const selectedOption =
    TIMEOUT_OPTIONS.find((opt) => opt.value === timeout) || TIMEOUT_OPTIONS[1];

  return (
    <div className="rounded-2xl border border-[#EAE8F0] bg-white p-5 shadow-[0_2px_12px_rgba(35,25,65,0.03)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-[#7547E8]" />
          <h3 className="text-sm font-bold text-[#191725]">
            Local Daemon Connection Settings
          </h3>
        </div>
        <span className="rounded-md bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-800 border border-cyan-100">
          HTTP REST API
        </span>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Ollama Endpoint */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-[#6F6B7D] uppercase tracking-wider">
            Ollama Endpoint URL
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-xl border border-[#EAE8F0] bg-[#FAF9FC] px-3.5 py-2 font-mono text-xs text-[#191725] transition focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-100"
          />
        </div>

        {/* Custom Futuristic Dropdown */}
        <div className="relative space-y-1.5" ref={dropdownRef}>
          <label className="text-[11px] font-semibold text-[#6F6B7D] uppercase tracking-wider">
            Keep-Alive Timeout
          </label>

          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className={`flex h-9 w-full items-center justify-between rounded-xl border bg-white px-3.5 text-xs text-[#191725] transition outline-none ${
              dropdownOpen
                ? "border-[#7547E8] ring-2 ring-[#F0EAFF]"
                : "border-[#EAE8F0] hover:border-[#D6D3E6]"
            }`}
          >
            <span className="truncate font-medium">{selectedOption.label}</span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-[#6F6B7D] transition-transform duration-200 ${
                dropdownOpen ? "rotate-180 text-[#7547E8]" : ""
              }`}
            />
          </button>

          {/* Floating Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl border border-[#EAE8F0] bg-white p-1.5 shadow-[0_12px_32px_rgba(35,25,65,0.12)] animate-in fade-in zoom-in-95 duration-100">
              <div className="space-y-1">
                {TIMEOUT_OPTIONS.map((opt) => {
                  const isSelected = opt.value === timeout;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setTimeoutVal(opt.value);
                        setDropdownOpen(false);
                      }}
                      className={`flex w-full items-start justify-between rounded-xl px-3 py-2 text-left transition ${
                        isSelected
                          ? "bg-[#F0EAFF] text-[#7547E8]"
                          : "text-[#191725] hover:bg-[#FAF9FC]"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div
                          className={`text-xs font-semibold ${
                            isSelected ? "text-[#7547E8]" : "text-[#191725]"
                          }`}
                        >
                          {opt.label}
                        </div>
                        <div className="text-[10px] text-[#6F6B7D] truncate">
                          {opt.description}
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="h-4 w-4 shrink-0 text-[#7547E8] mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cloud Fallback Relay Toggle */}
      <div className="flex items-center justify-between rounded-xl border border-[#EAE8F0] bg-[#FAF9FC] p-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
            <Cloud className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#191725]">
              Cloud Fallback Relay
            </div>
            <p className="text-[11px] text-[#6F6B7D]">
              Automatically route AST payload to remote inference if local VRAM exceeds 95%
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setFallbackEnabled(!fallbackEnabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            fallbackEnabled ? "bg-[#7547E8]" : "bg-gray-200"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              fallbackEnabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
