export interface DaemonStatus {
  is_online: boolean;
  version: string;
  endpoint: string;
  vram_total_gb: floatNumber;
  vram_used_gb: floatNumber;
  execution_mode: string;
}

export type floatNumber = number;

export interface ActiveModelDetails {
  name: string;
  display_name: string;
  description: string;
  parameter_count: string;
  quantization: string;
  context_window: number;
  vram_footprint_gb: number;
  endpoint_uri: string;
  execution_mode: string;
  tag: string;
}

export interface ModelKPIs {
  inference_latency_ms: number;
  throughput_tok_s: number;
  daily_volume_tokens: number;
  daily_prompts_count: number;
  vram_utilization_pct: number;
  is_bound: boolean;
}

export interface CachedModelItem {
  name: string;
  display_name: string;
  subtitle: string;
  size_gb: number;
  parameter_size: string;
  quantization: string;
  context_length: number;
  status: "Active Default" | "Ready" | "Standby" | "Active Embedder";
  is_primary: boolean;
  is_embedder: boolean;
  execution_mode: string;
}

export interface GenerationHyperparameters {
  temperature: number;
  top_p: number;
  max_output_tokens: number;
  system_prompt: string;
}

export interface ModelsOverviewData {
  daemon: DaemonStatus;
  active_model: ActiveModelDetails;
  kpis: ModelKPIs;
  hyperparameters: GenerationHyperparameters;
  cached_models: CachedModelItem[];
  total_cache_size_gb: number;
}

export interface TestInferenceResult {
  model: string;
  output: string;
  tokens_generated: number;
  duration_seconds: number;
  tok_per_sec: number;
  status: string;
}
