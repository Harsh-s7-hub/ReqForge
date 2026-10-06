export interface Repository {
  id: number | string;
  githubRepoId?: number | string;

  name: string;
  fullName: string;
  ownerLogin?: string;

  description?: string | null;

  isPrivate: boolean;

  defaultBranch: string;

  htmlUrl: string;

  lastGithubActivityAt?: string | null;
}