"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Code2,
  Copy,
  Download,
  Eye,
  FastForward,
  FileCode,
  Loader2,
  Save,
} from "lucide-react";
import { MarkdownPreview } from "./markdown-preview";

interface MarkdownEditorProps {
  content: string;
  disabled: boolean;
  onSave: (content: string) => Promise<void>;
  viewMode?: "edit" | "preview";
  onViewModeChange?: (mode: "edit" | "preview") => void;
}

export function MarkdownEditor({
  content,
  disabled,
  onSave,
  viewMode: controlledMode,
  onViewModeChange,
}: MarkdownEditorProps) {
  const [value, setValue] = useState(content);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [internalMode, setInternalMode] = useState<"edit" | "preview">("edit");

  const mode = controlledMode ?? internalMode;
  const setMode = (newMode: "edit" | "preview") => {
    setInternalMode(newMode);
    onViewModeChange?.(newMode);
  };

  // Token streaming state (ChatGPT / Claude style streaming)
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamProgress, setStreamProgress] = useState(0);

  const streamTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasStreamedRef = useRef<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Sync content when it arrives from the backend
  useEffect(() => {
    if (!content) {
      setValue("");
      return;
    }

    if (!hasStreamedRef.current && content.length > 0 && !disabled) {
      hasStreamedRef.current = true;
      setIsStreaming(true);

      const words = content.split(" ");
      let currentIndex = 0;
      const chunkSize = 4;

      if (streamTimerRef.current) clearInterval(streamTimerRef.current);

      streamTimerRef.current = setInterval(() => {
        currentIndex += chunkSize;
        if (currentIndex >= words.length) {
          setValue(content);
          setIsStreaming(false);
          if (streamTimerRef.current) clearInterval(streamTimerRef.current);
        } else {
          setValue(words.slice(0, currentIndex).join(" "));
          setStreamProgress(Math.floor((currentIndex / words.length) * 100));

          if (textareaRef.current) {
            textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
          }
        }
      }, 30);
    } else if (!isStreaming) {
      setValue(content);
    }

    return () => {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    };
  }, [content, disabled]);

  const handleSkipStream = () => {
    if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    setValue(content);
    setIsStreaming(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([value], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "REPOSITORY_DOCUMENTATION.md";
    link.click();
    URL.revokeObjectURL(url);
  };

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(value);
    } finally {
      setSaving(false);
    }
  }

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const lineCount = value.trim() ? value.split("\n").length : 0;

  return (
    <div className="flex min-h-[640px] flex-col bg-white">
      {/* Editor Top Navigation: Edit vs Preview Tabs + Actions */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#EAE8F0] bg-[#FAF8FF] px-5 py-2.5 text-xs text-[#6F6B7D]">
        {/* Left: Tabs */}
        <div className="flex items-center gap-1.5">
          <div className="flex rounded-lg border border-[#EAE8F0] bg-white p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => setMode("edit")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition ${
                mode === "edit"
                  ? "bg-[#7547E8] text-white shadow-sm"
                  : "text-[#6F6B7D] hover:text-[#191725]"
              }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              Edit (.md)
            </button>

            <button
              type="button"
              onClick={() => setMode("preview")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition ${
                mode === "preview"
                  ? "bg-[#7547E8] text-white shadow-sm"
                  : "text-[#6F6B7D] hover:text-[#191725]"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </button>
          </div>

          {isStreaming ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#7547E8] px-2 py-0.5 text-[10px] font-bold text-white animate-pulse">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              Streaming tokens ({streamProgress}%)
            </span>
          ) : (
            value.length > 0 && (
              <span className="text-[11px] text-[#9A96A6]">
                · {wordCount.toLocaleString()} words · {lineCount.toLocaleString()}{" "}
                lines
              </span>
            )
          )}
        </div>

        {/* Right: Copy & Download Actions */}
        <div className="flex items-center gap-2">
          {isStreaming && (
            <button
              type="button"
              onClick={handleSkipStream}
              className="inline-flex items-center gap-1 rounded-md border border-[#D5C9FA] bg-white px-2.5 py-1 text-[11px] font-medium text-[#7547E8] transition hover:bg-[#F3EFFF]"
            >
              <FastForward className="h-3 w-3" />
              Skip to end
            </button>
          )}

          <button
            type="button"
            disabled={!value}
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded-md border border-[#EAE8F0] bg-white px-2.5 py-1 text-[11px] font-medium text-[#6F6B7D] transition hover:bg-[#F4F3F7] disabled:opacity-50"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-[#10B981]" />
                <span className="text-[#10B981]">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy .md</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={!value}
            onClick={handleDownload}
            className="inline-flex items-center gap-1 rounded-md border border-[#EAE8F0] bg-white px-2.5 py-1 text-[11px] font-medium text-[#6F6B7D] transition hover:bg-[#F4F3F7] disabled:opacity-50"
          >
            <Download className="h-3 w-3" />
            <span>Download .md</span>
          </button>
        </div>
      </div>

      {/* Main Body: Edit View vs Preview View */}
      <div className="relative flex-1">
        {mode === "edit" ? (
          <>
            <textarea
              ref={textareaRef}
              value={value}
              disabled={disabled || isStreaming}
              onChange={(event) => setValue(event.target.value)}
              className="min-h-[580px] w-full resize-y bg-transparent px-8 py-7 font-mono text-sm leading-7 text-[#29213F] outline-none placeholder:text-[#9A96A6] disabled:cursor-not-allowed disabled:text-[#6F6B7D]"
              placeholder="Generated documentation will appear here."
            />
            {isStreaming && (
              <span className="pointer-events-none inline-block h-4 w-2 animate-pulse bg-[#7547E8]" />
            )}
          </>
        ) : (
          <MarkdownPreview content={value} />
        )}
      </div>

      {/* Save Action Footer */}
      <div className="flex items-center justify-between border-t border-[#EAE8F0] bg-white px-6 py-3.5">
        <p className="text-xs text-[#9A96A6]">
          {value !== content
            ? "You have unsaved changes in your Markdown document."
            : "Markdown matches latest saved version."}
        </p>

        <button
          type="button"
          disabled={disabled || saving || value === content || isStreaming}
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-lg bg-[#7547E8] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6335D1] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}
