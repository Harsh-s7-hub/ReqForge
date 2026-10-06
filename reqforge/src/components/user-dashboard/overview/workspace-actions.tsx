"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Link2,
  Terminal,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,

} from "lucide-react";

import { GithubIcon } from "@/components/icons/github-icon";

type CopyStatus = "idle" | "copied" | "error";

interface WorkspaceActionsProps {
  githubConnected: boolean;
  repositoryCount: number;
  installationUrl?: string;
}

export function WorkspaceActions({
  githubConnected,
  repositoryCount,
  installationUrl,
}: WorkspaceActionsProps) {
  const [copyStatus, setCopyStatus] =
    useState<CopyStatus>("idle");

  const timeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const pathname = usePathname();

  const username = pathname
    .split("/")
    .filter(Boolean)[0];

  const settingsHref = username
    ? `/${username}/settings`
    : "/settings";

  const repositoriesHref = username
    ? `/${username}/repositories`
    : "/repositories";

  const cliCommand =
    "npx @regforge/cli init --quickstart";

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(
        cliCommand,
      );

      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setCopyStatus("idle");
      timeoutRef.current = null;
    }, 2500);
  }

  function handleGitHubAction() {
    if (!githubConnected && installationUrl) {
      window.location.href = installationUrl;
    }
  }

  return (
    <section
      aria-label="Workspace setup actions"
      className="grid grid-cols-1 gap-4 xl:grid-cols-2"
    >
      {/* Git Connection */}
      <div className="flex min-h-[90px] items-center justify-between gap-4 rounded-xl border border-[#EAE8F0] bg-white p-4 shadow-[0_2px_12px_rgba(35,25,65,0.04)]">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              githubConnected
                ? "bg-[#E7F9F1] text-[#238653]"
                : "bg-[#FFF4E5] text-[#F28C28]"
            }`}
          >
            {githubConnected ? (
              <GithubIcon/>
            ) : (
              <Link2 size={19} />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xs font-bold text-[#191725]">
                {githubConnected
                  ? "GitHub Connected"
                  : "Git Connection Required"}
              </h3>

              <span
                className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                  githubConnected
                    ? "bg-[#E7F9F1] text-[#238653]"
                    : "bg-[#FFF1D6] text-[#B96B00]"
                }`}
              >
                {githubConnected
                  ? "Connected"
                  : "Action Needed"}
              </span>
            </div>

            <p className="mt-1 text-[11px] leading-4 text-[#6F6B7D]">
              {githubConnected
                ? `${repositoryCount} ${
                    repositoryCount === 1
                      ? "repository"
                      : "repositories"
                  } connected and ready for RegForge workflows.`
                : "Connect GitHub to access repositories, automate PR reviews, and run security analysis."}
            </p>
          </div>
        </div>

        {githubConnected ? (
          <Link
            href={repositoriesHref}
            className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-[#EAE8F0] bg-white px-3 text-[11px] font-semibold text-[#191725] transition-colors hover:border-[#D5C8F5] hover:bg-[#F0EAFF] hover:text-[#7547E8]"
          >
            <GithubIcon />
            Manage
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleGitHubAction}
            className="flex h-9 shrink-0 items-center gap-2 rounded-lg bg-[#191725] px-3 text-[11px] font-semibold text-white transition-colors hover:bg-[#343044]"
          >
            <GithubIcon />
            Connect
          </button>
        )}
      </div>

      {/* CLI Quick Setup */}
      <div className="flex min-h-[90px] items-center justify-between gap-4 rounded-xl border border-[#EAE8F0] bg-white p-4 shadow-[0_2px_12px_rgba(35,25,65,0.04)]">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EAFF] text-[#7547E8]">
            <Terminal size={19} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xs font-bold text-[#191725]">
                CLI Quick Setup
              </h3>

              <span className="rounded bg-[#F0EAFF] px-1.5 py-0.5 text-[9px] font-semibold text-[#7547E8]">
                CLI Preview
              </span>
            </div>

            <code className="mt-1 block truncate font-mono text-[10px] text-[#6F6B7D]">
              {cliCommand}
            </code>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy CLI setup command"
          className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-[#EAE8F0] bg-[#F1F3F7] px-3 text-[11px] font-semibold text-[#526078] transition-colors hover:border-[#D5C8F5] hover:bg-[#F0EAFF] hover:text-[#7547E8]"
        >
          {copyStatus === "copied" ? (
            <Check size={14} />
          ) : copyStatus === "error" ? (
            <AlertCircle size={14} />
          ) : (
            <Copy size={14} />
          )}

          {copyStatus === "copied"
            ? "Copied"
            : copyStatus === "error"
              ? "Failed"
              : "Copy"}
        </button>
      </div>
    </section>
  );
}