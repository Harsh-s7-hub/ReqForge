export interface Project {
  id: number;
  name: string;
  description: string | null;

  repositoryId: number;
  repositoryName: string;
  repositoryUrl: string;

  repositoryAccessActive?: boolean;
  createdAt?: string;
}