"use client";

import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Key, RefreshCw, Terminal, X } from "lucide-react";
import { getProjectActionToken } from "@/components/user-dashboard/documentations/documentation-api";

interface GitHubActionDialogProps {
  projectId: number;
  projectName: string;
  repositoryName: string;
  isOpen: boolean;
  onClose: () => void;
}

const WORKFLOW_YAML_CONTENT = `name: RegForge Documentation CI/CD

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]
    types: [opened, synchronize, reopened]

permissions:
  contents: write
  pull-requests: write

jobs:
  # -------------------------------------------------------------------------
  # Job 1: PR Documentation & Architecture Check
  # Evaluates code changes in incoming PRs and posts a review bot summary
  # -------------------------------------------------------------------------
  check-pr-docs:
    name: Check Documentation Status (PR)
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest

    steps:
      - name: Checkout PR Code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Inspect Changed Code Files
        id: diff
        run: |
          git fetch origin \${{ github.base_ref }} --depth=1
          CHANGED_FILES_JSON=$(git diff --name-only origin/\${{ github.base_ref }}...HEAD | jq -R -s -c 'split("\\n")[:-1]')
          echo "files=\${CHANGED_FILES_JSON}" >> $GITHUB_OUTPUT

      - name: Query RegForge Documentation Check API
        id: regforge_check
        env:
          REGFORGE_URL: \${{ secrets.REGFORGE_API_URL || 'http://127.0.0.1:8001' }}
          REGFORGE_TOKEN: \${{ secrets.REGFORGE_PROJECT_TOKEN }}
        run: |
          if [ -z "$REGFORGE_TOKEN" ]; then
            echo "::warning::REGFORGE_PROJECT_TOKEN secret not configured in repository."
            exit 0
          fi

          PAYLOAD=$(jq -n \\
            --arg sha "\${{ github.event.pull_request.head.sha }}" \\
            --argjson pr "\${{ github.event.pull_request.number }}" \\
            --arg base "\${{ github.base_ref }}" \\
            --arg head "\${{ github.head_ref }}" \\
            --argjson files '\${{ steps.diff.outputs.files }}' \\
            '{commit_sha: $sha, pr_number: $pr, base_ref: $base, head_ref: $head, changed_files: $files}')

          RESPONSE=$(curl -s -X POST "\${REGFORGE_URL}/api/actions/documentation/check" \\
            -H "Authorization: Bearer \${REGFORGE_TOKEN}" \\
            -H "Content-Type: application/json" \\
            -d "\${PAYLOAD}")

          SUMMARY=$(echo "\${RESPONSE}" | jq -r '.summary_markdown // empty')

          {
            echo "summary<<EOF"
            echo "\${SUMMARY}"
            echo "EOF"
          } >> $GITHUB_OUTPUT

      - name: Publish GitHub Step Summary
        if: steps.regforge_check.outputs.summary != ''
        run: |
          echo "\${{ steps.regforge_check.outputs.summary }}" >> $GITHUB_STEP_SUMMARY

      - name: Post PR Comment
        uses: actions/github-script@v7
        if: steps.regforge_check.outputs.summary != ''
        with:
          script: |
            const summary = process.env.SUMMARY_TEXT;
            if (!summary) return;
            const marker = '<!-- regforge-doc-check-comment -->';
            const body = \`\${marker}\\n\${summary}\`;

            const { data: comments } = await github.rest.issues.listComments({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
            });

            const existing = comments.find(c => c.body.includes(marker));
            if (existing) {
              await github.rest.issues.updateComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                comment_id: existing.id,
                body: body,
              });
            } else {
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.issue.number,
                body: body,
              });
            }
        env:
          SUMMARY_TEXT: \${{ steps.regforge_check.outputs.summary }}

  # -------------------------------------------------------------------------
  # Job 2: Auto-Sync Documentation on Merge / Push to Main
  # Automatically triggers AI synthesis for the new commit
  # -------------------------------------------------------------------------
  sync-main-docs:
    name: Auto-Sync Documentation (Main)
    if: github.event_name == 'push'
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Trigger RegForge AI Documentation Sync
        env:
          REGFORGE_URL: \${{ secrets.REGFORGE_API_URL || 'http://127.0.0.1:8001' }}
          REGFORGE_TOKEN: \${{ secrets.REGFORGE_PROJECT_TOKEN }}
          COMMIT_SHA: \${{ github.sha }}
          REF_NAME: \${{ github.ref_name }}
        run: |
          if [ -z "$REGFORGE_TOKEN" ]; then
            echo "::notice::REGFORGE_PROJECT_TOKEN not set. Skipping automated sync."
            exit 0
          fi

          echo "Triggering automated RegForge documentation sync for commit \${COMMIT_SHA}..."
          RESPONSE=$(curl -s -X POST "\${REGFORGE_URL}/api/actions/documentation/sync" \\
            -H "Authorization: Bearer \${REGFORGE_TOKEN}" \\
            -H "Content-Type: application/json" \\
            -d "{\\"commit_sha\\": \\"\${COMMIT_SHA}\\", \\"branch\\": \\"\${REF_NAME}\\"}")

          echo "Sync Result: \${RESPONSE}"
          JOB_ID=$(echo "\${RESPONSE}" | jq -r '.job_id // empty')
          VERSION_NUM=$(echo "\${RESPONSE}" | jq -r '.version_number // empty')

          if [ -n "$JOB_ID" ]; then
            echo "### ✅ RegForge Documentation Generation Queued" >> $GITHUB_STEP_SUMMARY
            echo "- **Version:** \\\`v\${VERSION_NUM}\\\`" >> $GITHUB_STEP_SUMMARY
            echo "- **Job ID:** \\\`\${JOB_ID}\\\`" >> $GITHUB_STEP_SUMMARY
            echo "- **Commit:** \\\`\${COMMIT_SHA}\\\`" >> $GITHUB_STEP_SUMMARY
            echo "Documentation synthesis is running in Celery worker." >> $GITHUB_STEP_SUMMARY
          fi
`;

export function GitHubActionDialog({
  projectId,
  projectName,
  repositoryName,
  isOpen,
  onClose,
}: GitHubActionDialogProps) {
  const [activeTab, setActiveTab] = useState<"guide" | "workflow">("guide");
  const [token, setToken] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedYaml, setCopiedYaml] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setLoadingToken(true);

    getProjectActionToken(projectId)
      .then((res) => {
        if (mounted) {
          setToken(res.token);
        }
      })
      .catch((err) => {
        console.error("Failed to load project action token:", err);
      })
      .finally(() => {
        if (mounted) setLoadingToken(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  async function handleCopyToken() {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } catch {
      // fallback
    }
  }

  async function handleCopyYaml() {
    try {
      await navigator.clipboard.writeText(WORKFLOW_YAML_CONTENT);
      setCopiedYaml(true);
      setTimeout(() => setCopiedYaml(false), 2000);
    } catch {
      // fallback
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-[#EAE8F0] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EAE8F0] px-6 py-4.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F6F8FA] border border-[#D0D7DE] text-[#24292F]">
              <svg
                className="h-5 w-5 text-[#24292F]"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#191725]">
                  GitHub Actions Automation
                </h2>
                <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700">
                  CI / CD
                </span>
              </div>
              <p className="text-xs text-[#6F6B7D]">
                Automated PR Documentation Checks & Merge Synchronization for {repositoryName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6F6B7D] transition hover:bg-[#F4F2F7] hover:text-[#191725]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#EAE8F0] bg-[#FAF9FC] px-6">
          <button
            type="button"
            onClick={() => setActiveTab("guide")}
            className={`border-b-2 px-4 py-3 text-xs font-semibold transition ${
              activeTab === "guide"
                ? "border-violet-600 text-violet-700 bg-white"
                : "border-transparent text-[#6F6B7D] hover:text-[#191725]"
            }`}
          >
            Setup Guide & Token
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("workflow")}
            className={`border-b-2 px-4 py-3 text-xs font-semibold transition ${
              activeTab === "workflow"
                ? "border-violet-600 text-violet-700 bg-white"
                : "border-transparent text-[#6F6B7D] hover:text-[#191725]"
            }`}
          >
            Workflow YAML (.github/workflows/regforge-docs.yml)
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "guide" ? (
            <div className="space-y-6 text-sm">
              {/* Feature Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-violet-900 font-semibold text-xs">
                    <Terminal className="h-4 w-4 text-violet-600" />
                    PR Architecture & Doc Check
                  </div>
                  <p className="text-xs text-violet-800/80 leading-relaxed">
                    Evaluates incoming PR diffs, alerts reviewers via GitHub Step Summary & Bot Comments when changes impact README.md.
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-900 font-semibold text-xs">
                    <RefreshCw className="h-4 w-4 text-emerald-600" />
                    Auto-Sync on Push & Merge
                  </div>
                  <p className="text-xs text-emerald-800/80 leading-relaxed">
                    Automatically queues headless RegForge AI synthesis for new commits on main, creating version v&#123;N+1&#125; seamlessly.
                  </p>
                </div>
              </div>

              {/* Step 1: Project Action Token */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#191725] flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white text-[10px] font-bold">
                      1
                    </span>
                    Project Secret Token (<code className="font-mono text-violet-700">REGFORGE_PROJECT_TOKEN</code>)
                  </label>
                  {token && (
                    <button
                      type="button"
                      onClick={() => setRevealed(!revealed)}
                      className="text-xs font-medium text-violet-600 hover:text-violet-800"
                    >
                      {revealed ? "Mask" : "Reveal"}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-xl border border-[#EAE8F0] bg-[#FAF9FC] px-3.5 py-2.5 font-mono text-xs text-[#191725]">
                    {loadingToken ? (
                      <span className="text-[#9A96A6]">Generating project token...</span>
                    ) : token ? (
                      revealed ? (
                        token
                      ) : (
                        `${token.slice(0, 16)}••••••••••••••••••••••••••••••••`
                      )
                    ) : (
                      <span className="text-red-500">Failed to load token</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    disabled={!token || loadingToken}
                    className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
                  >
                    {copiedToken ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy Token
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-[#6F6B7D]">
                  Go to your repository on GitHub: <strong>Settings → Secrets and variables → Actions</strong>, and add a New repository secret named <code className="bg-[#FAF9FC] px-1 py-0.5 rounded font-mono text-violet-700">REGFORGE_PROJECT_TOKEN</code>.
                </p>
              </div>

              {/* Step 2: Add Workflow */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#191725] flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white text-[10px] font-bold">
                    2
                  </span>
                  Add Workflow File to Repository
                </label>
                <div className="rounded-xl border border-[#EAE8F0] bg-[#FAF9FC] p-3 text-xs text-[#6F6B7D] space-y-2">
                  <p>
                    Create the file at <code className="font-mono text-violet-700 font-semibold">.github/workflows/regforge-docs.yml</code> in your repository.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("workflow")}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-800"
                  >
                    View & Copy Workflow YAML →
                  </button>
                </div>
              </div>

              {/* Step 3: Self-Commit Prevention & Safety Note */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 text-xs text-blue-900 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-blue-600" />
                  Self-Commit Loop Prevention Built-in
                </p>
                <p className="text-blue-800/80 leading-relaxed text-[11.5px]">
                  When RegForge commits documentation back into your repository, the automated detector recognizes the signature (via RegForge commit SHA &amp; message) and bypasses stale alerts to prevent infinite notification loops.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[#6F6B7D]">
                  .github/workflows/regforge-docs.yml
                </span>
                <button
                  type="button"
                  onClick={handleCopyYaml}
                  className="flex items-center gap-1.5 rounded-lg border border-[#EAE8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#191725] shadow-sm transition hover:bg-[#FAF9FC]"
                >
                  {copiedYaml ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied YAML!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-[#6F6B7D]" />
                      Copy Workflow YAML
                    </>
                  )}
                </button>
              </div>

              <pre className="max-h-[380px] overflow-auto rounded-2xl border border-[#2D2B3D] bg-[#191725] p-4 font-mono text-[11px] leading-relaxed text-[#D6D3E6]">
                {WORKFLOW_YAML_CONTENT}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-[#EAE8F0] px-6 py-4 bg-[#FAF9FC] rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#EAE8F0] bg-white px-5 py-2 text-xs font-semibold text-[#191725] transition hover:bg-[#F4F2F7]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
