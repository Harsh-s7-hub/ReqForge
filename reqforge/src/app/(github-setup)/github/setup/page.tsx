"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GitBranch, XCircle } from "lucide-react";

import { GithubIcon } from "@/components/icons/github-icon";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

const MAX_ATTEMPTS = 5;
const RETRY_DELAY = 1500;

type SyncStatus = "syncing" | "error";

export default function GitHubSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const hasStarted = useRef(false);

  const [status, setStatus] =
    useState<SyncStatus>("syncing");

  const [message, setMessage] = useState(
    "Syncing repository details..."
  );

  useEffect(() => {
    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;

    const installationId =
      searchParams.get("installation_id");

    if (!installationId) {
      setStatus("error");
      setMessage(
        "GitHub installation information was not provided."
      );
      return;
    }

    const wait = (milliseconds: number) =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, milliseconds);
      });

    const syncRepositories = async () => {
      let lastError =
        "Unable to sync your repository details.";

      for (
        let attempt = 1;
        attempt <= MAX_ATTEMPTS;
        attempt++
      ) {
        try {
          setMessage(
            attempt === 1
              ? "Syncing repository details..."
              : "Waiting for repository synchronization..."
          );

          const response = await fetch(
            `${API_URL}/api/github/setup?installation_id=${encodeURIComponent(
              installationId
            )}`,
            {
              method: "GET",
              credentials: "include",
              cache: "no-store",
            }
          );

          let data: {
            success?: boolean;
            username?: string;
            installation_id?: number;
            message?: string;
            detail?: string;
          };

          try {
            data = await response.json();
          } catch {
            throw new Error(
              "The backend returned an invalid response."
            );
          }

          if (!response.ok) {
            lastError =
              data.detail ||
              "Unable to sync repository details.";

            if (attempt < MAX_ATTEMPTS) {
              await wait(RETRY_DELAY);
              continue;
            }

            throw new Error(lastError);
          }

          if (!data.success || !data.username) {
            lastError =
              "Repository synchronization returned an invalid response.";

            if (attempt < MAX_ATTEMPTS) {
              await wait(RETRY_DELAY);
              continue;
            }

            throw new Error(lastError);
          }

          // Keep animation running while redirecting.
          setMessage(
            "Repository details synced. Redirecting..."
          );

          await wait(800);

          router.replace(
            `/${encodeURIComponent(data.username)}`
          );

          return;
        } catch (error) {
          lastError =
            error instanceof Error
              ? error.message
              : "Unable to sync your repository details.";

          if (attempt < MAX_ATTEMPTS) {
            await wait(RETRY_DELAY);
            continue;
          }

          setStatus("error");
          setMessage(lastError);
        }
      }
    };

    void syncRepositories();
  }, [router, searchParams]);

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#FBFAFF] px-6">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-[45%] h-[520px] w-[950px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F1ECFF] opacity-70 blur-[140px]" />

      <div className="relative z-10 w-full max-w-[1050px]">
        {/* Header */}
        <div className="text-center">
          {status === "syncing" && (
            <>
              <h1 className="text-[28px] font-bold tracking-[-0.04em] text-[#191725] md:text-[34px]">
                Syncing Your{" "}
                <span className="text-[#7547E8]">
                  Repository Details
                </span>
              </h1>

              <p className="mx-auto mt-3 max-w-lg text-[13px] leading-5 text-[#858092] md:text-[14px]">
                RegForge is securely fetching the
                repositories you selected from GitHub.
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <h1 className="text-[28px] font-bold tracking-[-0.04em] text-[#191725] md:text-[34px]">
                Repository Sync{" "}
                <span className="text-[#D94A4A]">
                  Failed
                </span>
              </h1>

              <p className="mx-auto mt-3 max-w-lg text-[13px] leading-5 text-[#858092]">
                {message}
              </p>
            </>
          )}
        </div>

        {/* GitHub → RegForge */}
        <div className="mx-auto mt-20 flex w-full max-w-[900px] items-center">
          {/* GitHub */}
          <div className="relative z-20 flex shrink-0 flex-col items-center">
            {/* GitHub icon */}
            <div className="relative flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[#191725] shadow-[0_6px_18px_rgba(25,23,37,0.16)]">
              <GithubIcon className="h-[21px] w-[21px] text-white" />
            </div>

            <span className="mt-4 text-[11px] font-semibold text-[#191725]">
              GitHub
            </span>
          </div>

          {/* Transfer connection */}
          <div className="relative mx-8 mb-7 h-[60px] min-w-0 flex-1">
            <svg
              className="absolute inset-0 h-full w-full overflow-visible"
              viewBox="0 0 800 60"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {/* Light dashed base */}
              <line
                x1="0"
                y1="30"
                x2="800"
                y2="30"
                stroke="#D5CDEE"
                strokeWidth="2"
                strokeDasharray="10 10"
                strokeLinecap="round"
              />

              {/* Dark purple moving dashes */}
              {status === "syncing" && (
                <line
                  x1="0"
                  y1="30"
                  x2="800"
                  y2="30"
                  stroke="#7547E8"
                  strokeWidth="3"
                  strokeDasharray="10 10"
                  strokeLinecap="round"
                  opacity="0.95"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="0"
                    to="-20"
                    dur="0.65s"
                    repeatCount="indefinite"
                  />
                </line>
              )}

              {/* Glow dots */}
              {status === "syncing" && (
                <>
                  <circle
                    cx="200"
                    cy="30"
                    r="3"
                    fill="#8B5CF6"
                  >
                    <animate
                      attributeName="opacity"
                      values="0.35;1;0.35"
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                  </circle>

                  <circle
                    cx="600"
                    cy="30"
                    r="3"
                    fill="#8B5CF6"
                  >
                    <animate
                      attributeName="opacity"
                      values="1;0.35;1"
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </>
              )}

              {/* Continuously moving file */}
              {status === "syncing" && (
                <g>
                  {/* File glow */}
                  <circle
                    cx="0"
                    cy="30"
                    r="13"
                    fill="#A98BFF"
                    opacity="0.18"
                  >
                    <animate
                      attributeName="opacity"
                      values="0.08;0.3;0.08"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </circle>

                  {/* Moving document */}
                  <g>
                    <animateTransform
                      attributeName="transform"
                      type="translate"
                      from="0 30"
                      to="778 30"
                      dur="2.2s"
                      repeatCount="indefinite"
                    />

                    {/* Document */}
                    <rect
                      x="-10"
                      y="-11"
                      width="20"
                      height="22"
                      rx="3"
                      fill="white"
                      stroke="#7547E8"
                      strokeWidth="1.5"
                    />

                    {/* Folded corner */}
                    <path
                      d="M2 -11 L10 -3 L2 -3 Z"
                      fill="#EEE9FF"
                      stroke="#7547E8"
                      strokeWidth="1.1"
                    />

                    {/* Document lines */}
                    <line
                      x1="-6"
                      y1="2"
                      x2="5"
                      y2="2"
                      stroke="#7547E8"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />

                    <line
                      x1="-6"
                      y1="7"
                      x2="3"
                      y2="7"
                      stroke="#A98BFF"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                  </g>
                </g>
              )}

              {/* Error marker */}
              {status === "error" && (
                <circle
                  cx="400"
                  cy="30"
                  r="15"
                  fill="white"
                  stroke="#F0D0D0"
                  strokeWidth="1"
                />
              )}
            </svg>

            {status === "error" && (
              <div className="absolute left-1/2 top-1/2 z-30 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-[#D94A4A]">
                <XCircle size={17} />
              </div>
            )}
          </div>

          {/* RegForge */}
          <div className="relative z-20 flex shrink-0 flex-col items-center">
            {/* RegForge icon */}
            <div className="relative flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[#7547E8] text-white shadow-[0_6px_20px_rgba(117,71,232,0.25)]">
              <GitBranch
                size={22}
                strokeWidth={1.8}
              />
            </div>

            <span className="mt-4 text-[11px] font-semibold text-[#191725]">
              RegForge
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="mt-16 text-center">
          {status === "syncing" && (
            <>
              <div className="flex items-center justify-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7547E8] opacity-30" />

                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#7547E8]" />
                </span>

                <span className="text-[13px] font-semibold text-[#7547E8]">
                  {message}
                </span>
              </div>

              <p className="mt-3 text-[11px] text-[#9A96A6]">
                Your repositories are being prepared
                for your RegForge workspace.
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="flex items-center justify-center gap-2 text-[#D94A4A]">
                <XCircle size={17} />

                <span className="text-[13px] font-semibold">
                  Repository details not synced
                </span>
              </div>

              <button
                type="button"
                onClick={() => router.replace("/")}
                className="mt-6 rounded-xl bg-[#7547E8] px-5 py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#6335D1]"
              >
                Return to RegForge
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}