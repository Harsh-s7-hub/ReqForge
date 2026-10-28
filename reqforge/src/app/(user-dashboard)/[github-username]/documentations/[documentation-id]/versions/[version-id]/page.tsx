import { notFound } from "next/navigation";
import { HistoricalDocumentationView } from "@/components/user-dashboard/documentations/historical-documentation-view";

interface PageProps { params: Promise<{ "github-username": string; "documentation-id": string; "version-id": string }>; }

export default async function HistoricalDocumentationPage({ params }: PageProps) {
  const values = await params;
  const documentationId = Number(values["documentation-id"]);
  const versionId = Number(values["version-id"]);
  if (!Number.isInteger(documentationId) || !Number.isInteger(versionId)) notFound();
  return <HistoricalDocumentationView username={values["github-username"]} documentationId={documentationId} versionId={versionId} />;
}
