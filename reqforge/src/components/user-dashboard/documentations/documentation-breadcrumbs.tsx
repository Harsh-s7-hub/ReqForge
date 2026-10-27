import { ChevronRight } from "lucide-react";

interface DocumentationBreadcrumbsProps {
  repositoryName: string;
}

export function DocumentationBreadcrumbs({ repositoryName }: DocumentationBreadcrumbsProps) {
  return (
    <div className="flex items-center gap-2 text-xs font-medium text-[#9A96A6]">
      <span>AI Engineering</span><ChevronRight className="h-3.5 w-3.5" />
      <span>Documentation</span><ChevronRight className="h-3.5 w-3.5" />
      <span className="rounded-md bg-[#F0EAFF] px-2 py-1 font-mono text-[#6335D1]">{repositoryName}</span>
    </div>
  );
}
