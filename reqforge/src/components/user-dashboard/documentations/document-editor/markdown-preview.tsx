"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  if (!content.trim()) {
    return (
      <div className="flex min-h-[500px] items-center justify-center text-sm text-[#9A96A6]">
        No markdown content to preview.
      </div>
    );
  }

  // Parse markdown lines into structured blocks
  const blocks = parseMarkdownBlocks(content);

  return (
    <div className="min-h-[580px] space-y-6 px-10 py-8 text-[#29213F] leading-7">
      {blocks.map((block, idx) => (
        <RenderBlock key={idx} block={block} />
      ))}
    </div>
  );
}

type Block =
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "h4"; text: string }
  | { type: "code"; language: string; code: string }
  | { type: "list"; items: string[] }
  | { type: "ordered-list"; items: string[] }
  | { type: "blockquote"; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "hr" }
  | { type: "paragraph"; text: string };

function parseMarkdownBlocks(markdown: string): Block[] {
  const lines = markdown.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(---|___|\*\*\*)$/.test(trimmed)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // Code blocks ```lang
    if (trimmed.startsWith("```")) {
      const language = trimmed.slice(3).trim() || "text";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip closing ```
      blocks.push({ type: "code", language, code: codeLines.join("\n") });
      continue;
    }

    // Headings
    if (trimmed.startsWith("# ")) {
      blocks.push({ type: "h1", text: trimmed.slice(2).trim() });
      i++;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      blocks.push({ type: "h2", text: trimmed.slice(3).trim() });
      i++;
      continue;
    }
    if (trimmed.startsWith("### ")) {
      blocks.push({ type: "h3", text: trimmed.slice(4).trim() });
      i++;
      continue;
    }
    if (trimmed.startsWith("#### ")) {
      blocks.push({ type: "h4", text: trimmed.slice(5).trim() });
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      blocks.push({ type: "blockquote", text: trimmed.slice(2).trim() });
      i++;
      continue;
    }

    // Table detection: line contains | and next line has | --- |
    if (
      trimmed.startsWith("|") &&
      i + 1 < lines.length &&
      lines[i + 1].trim().startsWith("|") &&
      lines[i + 1].includes("---")
    ) {
      const headers = trimmed
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim());
      i += 2; // skip header and divider line
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const rowCells = lines[i]
          .split("|")
          .slice(1, -1)
          .map((cell) => cell.trim());
        rows.push(rowCells);
        i++;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    // Unordered list (- or * or +)
    if (/^[-*+]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*+]\s+/, ""));
        i++;
      }
      blocks.push({ type: "list", items });
      continue;
    }

    // Ordered list (1. 2. 3.)
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "ordered-list", items });
      continue;
    }

    // Paragraph (accumulate multi-line paragraphs until an empty line or block marker)
    const pLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith(">") &&
      !lines[i].trim().startsWith("|") &&
      !/^[-*+]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim())
    ) {
      pLines.push(lines[i].trim());
      i++;
    }
    if (pLines.length > 0) {
      blocks.push({ type: "paragraph", text: pLines.join(" ") });
    }
  }

  return blocks;
}

function RenderBlock({ block }: { block: Block }) {
  const [copied, setCopied] = useState(false);

  switch (block.type) {
    case "h1":
      return (
        <h1 className="border-b border-[#EAE8F0] pb-3 text-2xl font-bold tracking-tight text-[#191725]">
          <InlineFormat text={block.text} />
        </h1>
      );

    case "h2":
      return (
        <h2 className="mt-8 border-b border-[#F0EDF6] pb-2 text-xl font-semibold tracking-tight text-[#191725]">
          <InlineFormat text={block.text} />
        </h2>
      );

    case "h3":
      return (
        <h3 className="mt-6 text-base font-semibold text-[#191725]">
          <InlineFormat text={block.text} />
        </h3>
      );

    case "h4":
      return (
        <h4 className="mt-4 text-sm font-semibold text-[#191725]">
          <InlineFormat text={block.text} />
        </h4>
      );

    case "hr":
      return <hr className="my-6 border-[#EAE8F0]" />;

    case "blockquote":
      return (
        <blockquote className="my-4 rounded-r-xl border-l-4 border-[#7547E8] bg-[#FAF8FF] px-4 py-3 text-sm italic text-[#595368]">
          <InlineFormat text={block.text} />
        </blockquote>
      );

    case "list":
      return (
        <ul className="my-3 space-y-1.5 pl-6 text-sm">
          {block.items.map((item, i) => (
            <li key={i} className="list-disc text-[#3B344D]">
              <InlineFormat text={item} />
            </li>
          ))}
        </ul>
      );

    case "ordered-list":
      return (
        <ol className="my-3 space-y-1.5 pl-6 text-sm">
          {block.items.map((item, i) => (
            <li key={i} className="list-decimal text-[#3B344D]">
              <InlineFormat text={item} />
            </li>
          ))}
        </ol>
      );

    case "code":
      return (
        <div className="relative my-4 overflow-hidden rounded-xl border border-[#2D2248] bg-[#140D26] text-white">
          <div className="flex items-center justify-between border-b border-[#2D2248] bg-[#0E081D] px-4 py-2 text-xs font-mono text-[#A89EC4]">
            <span>{block.language}</span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(block.code);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="inline-flex items-center gap-1 text-[11px] text-[#A89EC4] transition hover:text-white"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-[#10B981]" />
                  <span className="text-[#10B981]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <pre className="overflow-x-auto p-4 font-mono text-xs leading-6 text-[#E4DEF2]">
            <code>{block.code}</code>
          </pre>
        </div>
      );

    case "table":
      return (
        <div className="my-4 overflow-x-auto rounded-xl border border-[#EAE8F0]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8FF] font-semibold text-[#191725]">
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i} className="border-b border-[#EAE8F0] px-4 py-2.5">
                    <InlineFormat text={h} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className="border-b border-[#F4F1FA] last:border-none hover:bg-[#FAF8FF]"
                >
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-2.5 text-[#3B344D]">
                      <InlineFormat text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "paragraph":
      return (
        <p className="my-2.5 text-sm leading-7 text-[#3B344D]">
          <InlineFormat text={block.text} />
        </p>
      );

    default:
      return null;
  }
}

/**
 * Handles inline markdown: **bold**, *italic*, `code`
 */
function InlineFormat({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  // Regex splitting by code `...` and bold **...**
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={match.index}
          className="rounded bg-[#F0EAFF] px-1.5 py-0.5 font-mono text-xs font-semibold text-[#7547E8]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={match.index} className="font-semibold text-[#191725]">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(
        <em key={match.index} className="italic text-[#3B344D]">
          {token.slice(1, -1)}
        </em>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <>{parts.length > 0 ? parts : text}</>;
}
