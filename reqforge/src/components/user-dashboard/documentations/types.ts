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
