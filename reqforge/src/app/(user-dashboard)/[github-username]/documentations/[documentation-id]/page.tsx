import { notFound } from "next/navigation";
import { DocumentationWorkspace } from "@/components/user-dashboard/documentations/documentation-workspace";

interface PageProps { params: Promise<{ "documentation-id": string }>; searchParams: Promise<{ project?: string; version?: string }>; }

export default async function DocumentationPage({ params, searchParams }: PageProps) {
  const [{ "documentation-id": documentationId }, query] = await Promise.all([params, searchParams]);
  const documentNumber = Number(documentationId); const projectId = Number(query.project); const versionId = Number(query.version);
  if (!Number.isInteger(documentNumber) || !Number.isInteger(projectId) || !Number.isInteger(versionId)) notFound();
  return <DocumentationWorkspace documentationId={documentNumber} projectId={projectId} versionId={versionId} />;
}
