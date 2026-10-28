import type {
  CommitDocumentationPayload,
  CommitDocumentationResult,
  DocumentationCatalogItem,
  DocumentationGenerationResult,
  DocumentationVersion,
  ProjectActionTokenResponse,
  ProjectDocumentationStatus,
} from "./types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.detail || "Documentation request failed.");
  }
  return data as T;
}

export async function getDocumentationCatalog(): Promise<DocumentationCatalogItem[]> {
  const response = await fetch(`${API_URL}/api/documentation/catalog`, {
    credentials: "include",
    cache: "no-store",
  });
  const data = await parseResponse<{ documents: DocumentationCatalogItem[] }>(response);
  return data.documents;
}

export async function getCatalogDocumentVersion(documentationId: number, versionId: number): Promise<DocumentationVersion> {
  const response = await fetch(`${API_URL}/api/documentation/${documentationId}/versions/${versionId}`, {
    credentials: "include",
    cache: "no-store",
  });
  return parseResponse<DocumentationVersion>(response);
}

export async function requestDocumentationGeneration(
  projectId: number,
  analysisId: number,
): Promise<DocumentationGenerationResult> {
  const response = await fetch(
    `${API_URL}/api/projects/${projectId}/analysis/${analysisId}/documentation/generate`,
    { method: "POST", credentials: "include" },
  );
  return parseResponse<DocumentationGenerationResult>(response);
}

export async function getDocumentationVersion(
  projectId: number,
  versionId: number,
): Promise<DocumentationVersion> {
  const response = await fetch(
    `${API_URL}/api/projects/${projectId}/documentation/versions/${versionId}`,
    { credentials: "include", cache: "no-store" },
  );
  return parseResponse<DocumentationVersion>(response);
}

export async function saveDocumentationContent(
  projectId: number,
  versionId: number,
  content: string,
): Promise<DocumentationVersion> {
  const response = await fetch(
    `${API_URL}/api/projects/${projectId}/documentation/versions/${versionId}`,
    {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    },
  );
  return parseResponse<DocumentationVersion>(response);
}

export async function commitDocumentationVersion(
  projectId: number,
  versionId: number,
  payload: CommitDocumentationPayload,
): Promise<CommitDocumentationResult> {
  const response = await fetch(
    `${API_URL}/api/projects/${projectId}/documentation/versions/${versionId}/commit`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return parseResponse<CommitDocumentationResult>(response);
}

export async function getProjectDocumentationStatus(
  projectId: number,
): Promise<ProjectDocumentationStatus> {
  const response = await fetch(
    `${API_URL}/api/projects/${projectId}/documentation/status`,
    { credentials: "include", cache: "no-store" },
  );
  return parseResponse<ProjectDocumentationStatus>(response);
}

export async function getProjectActionToken(
  projectId: number,
): Promise<ProjectActionTokenResponse> {
  const response = await fetch(
    `${API_URL}/api/projects/${projectId}/action-token`,
    { credentials: "include", cache: "no-store" },
  );
  return parseResponse<ProjectActionTokenResponse>(response);
}
