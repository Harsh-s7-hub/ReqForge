import { DocumentationCatalog } from "@/components/user-dashboard/documentations/catalog/documentation-catalog";

interface PageProps { params: Promise<{ "github-username": string }>; }

export default async function DocumentationCatalogPage({ params }: PageProps) {
  const { "github-username": username } = await params;
  return <DocumentationCatalog username={username} />;
}
