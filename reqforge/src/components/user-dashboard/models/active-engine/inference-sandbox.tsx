"use client";

import { useEffect, useState } from "react";
import { Play, Terminal as TerminalIcon } from "lucide-react";
import type { GenerationHyperparameters, TestInferenceResult } from "../types";
import { testInference } from "../models-api";

interface InferenceSandboxProps {
  modelName: string;
  hyperparameters: GenerationHyperparameters;
  triggerEvaluation?: number;
}

export function InferenceSandbox({
  modelName,
  hyperparameters,
  triggerEvaluation,
}: InferenceSandboxProps) {
  const [prompt, setPrompt] = useState(
    "Extract OpenAPI schema from class UserRegistrationRequest",
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestInferenceResult>({
    model: modelName,
    output:
      '{\n  "symbols": ["verify_bearer_token", "decode_claims"],\n  "complexity_score": 3.2,\n  "suggested_docstring": "Validate incoming Authorization headers against asymmetric RSA keys."\n}',
    tokens_generated: 142,
    duration_seconds: 4.88,
    tok_per_sec: 29.1,
    status: "200 OK",
  });

  async function handleEvaluate() {
    if (!prompt.trim() || loading) return;
    try {
      setLoading(true);
      const res = await testInference({
        prompt,
        model: modelName,
        temperature: hyperparameters.temperature,
        top_p: hyperparameters.top_p,
        max_tokens: hyperparameters.max_output_tokens,
        system_prompt: hyperparameters.system_prompt,
      });
      setResult(res);
    } catch (err) {
      console.error("Evaluation failed:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (triggerEvaluation && triggerEvaluation > 0) {
      handleEvaluate();
    }
  }, [triggerEvaluation]);

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-4 w-4 text-[#7547E8]" />
          <h3 className="text-sm font-semibold text-[#191725]">
            Inference Sandbox
          </h3>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-100">
          Ready ☰
        </span>
      </div>

      {/* Terminal Output Container */}
      <div className="flex-1 min-h-[220px] rounded-xl border border-[#2D2B3D] bg-[#191725] p-3.5 font-mono text-xs text-[#D6D3E6] flex flex-col justify-between overflow-hidden shadow-inner">
        <div className="space-y-2 overflow-y-auto max-h-[190px]">
          <div className="text-[11px] text-[#868395]">
            <span className="text-violet-400">4</span> Ollama engine connection established at 127.0.0.1:11434
          </div>
          <div className="text-[11px] text-cyan-300">
            &gt; Model {modelName} warm in VRAM (context: 32k)
          </div>
          <div className="text-[11px] text-[#A5A1B8]">
            <span className="text-emerald-400">regforge@agent:~$</span> evaluate --target=&quot;{prompt}&quot;
          </div>
          {loading ? (
            <div className="flex items-center gap-2 py-3 text-violet-300 animate-pulse">
              <span className="h-2 w-2 rounded-full bg-violet-400" />
              <span>Streaming tokens from {modelName}...</span>
            </div>
          ) : (
            <pre className="text-[11.5px] leading-relaxed text-[#ECE9F5] whitespace-pre-wrap font-mono">
              {result.output}
            </pre>
          )}
        </div>

        {/* Status Line */}
        <div className="mt-3 flex items-center justify-between border-t border-[#2D2B3D] pt-2 text-[10px] text-[#868395]">
          <div className="flex items-center gap-2">
            <span>Tokens: {result.tokens_generated}</span>
            <span>•</span>
            <span>Time: {result.duration_seconds}s</span>
            <span>•</span>
            <span className="text-cyan-300">{result.tok_per_sec} tok/s</span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>{result.status}</span>
          </div>
        </div>
      </div>

      {/* Prompt Input & Evaluate Button */}
      <div className="flex items-center gap-2 pt-1">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter test prompt or AST target..."
          onKeyDown={(e) => {
            if (e.key === "Enter") handleEvaluate();
          }}
          className="flex-1 rounded-lg border border-[#EAE8F0] bg-white px-3.5 py-2 text-xs text-[#191725] placeholder:text-[#9A96A6] focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-100"
        />
        <button
          type="button"
          onClick={handleEvaluate}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#7547E8] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#6335D1] disabled:opacity-60 shrink-0"
        >
          <Play className="h-3 w-3 fill-white" />
          <span>{loading ? "Evaluating..." : "Evaluate"}</span>
        </button>
      </div>
    </div>
  );
}
