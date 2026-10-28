export type DocumentationStatus =
  | "queued"
  | "generating"
  | "ready"
  | "failed"
  | "cancelled";

export interface DocumentationVersion {
  id: number;
  documentation_id: number;
  analysis_id: number | null;
  version_number: number;
  source_commit_sha: string;
  content: string | null;
  ai_generated_content: string | null;
  status: DocumentationStatus;
  model_name: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentationGenerationResult {
  documentation_id: number;
  version_id: number;
  job_id: number;
  status: DocumentationStatus;
}

export interface DocumentationCatalogVersion {
  id: number;
  version_number: number;
  source_commit_sha: string;
  status: DocumentationStatus;
  created_at: string;
  word_count: number;
  line_count: number;
}

export interface DocumentationCatalogItem {
  id: number;
  project_id: number;
  project_name: string;
  repository_name: string;
  title: string;
  status: string;
  versions: DocumentationCatalogVersion[];
}

export interface CommitDocumentationPayload {
  commit_message: string;
  file_path?: string;
  branch?: string;
}

export interface CommitDocumentationResult {
  commit_sha: string;
  html_url: string;
  file_path: string;
  branch: string;
}

export interface ProjectDocumentationStatus {
  has_documentation: boolean;
  documentation_id: number | null;
  latest_version_id: number | null;
  version_number: number | null;
  status: "active" | "stale" | "queued" | "generating" | "none";
  is_stale: boolean;
  source_commit_sha: string | null;
  current_commit_sha: string | null;
}

export interface ProjectActionTokenResponse {
  project_id: number;
  token: string;
  token_prefix: string;
}
