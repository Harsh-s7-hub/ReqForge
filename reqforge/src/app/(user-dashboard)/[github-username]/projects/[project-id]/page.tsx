import { ProjectDetailsPage } from "@/components/user-dashboard/projects/project-details/project-details-page";

interface PageProps {
  params: Promise<{
    "github-username": string;
    "project-id": string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { "project-id": projectId } = await params;

  return (
    <ProjectDetailsPage
      projectId={Number(projectId)}
    />
  );
}