import type {
  GenerationHyperparameters,
  ModelsOverviewData,
  TestInferenceResult,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.detail || "Request failed.");
  }
  return data as T;
}

export async function getModelsOverview(): Promise<ModelsOverviewData> {
  const response = await fetch(`${API_URL}/api/models`, {
    credentials: "include",
    cache: "no-store",
  });
  return parseResponse<ModelsOverviewData>(response);
}

export async function testInference(payload: {
  prompt: string;
  model?: string;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  system_prompt?: string;
}): Promise<TestInferenceResult> {
  const response = await fetch(`${API_URL}/api/models/test-inference`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<TestInferenceResult>(response);
}

export async function setActiveModel(modelName: string): Promise<{ status: string; active_model: string }> {
  const response = await fetch(`${API_URL}/api/models/active`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model_name: modelName }),
  });
  return parseResponse<{ status: string; active_model: string }>(response);
}

export async function saveHyperparameters(
  params: GenerationHyperparameters,
): Promise<{ status: string; hyperparameters: GenerationHyperparameters }> {
  const response = await fetch(`${API_URL}/api/models/hyperparameters`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return parseResponse<{ status: string; hyperparameters: GenerationHyperparameters }>(response);
}
