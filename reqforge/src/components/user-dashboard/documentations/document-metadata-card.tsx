import { FileText, GitBranch, History, RadioTower } from "lucide-react";

interface DocumentMetadataCardProps {
  repositoryName: string;
  commitSha: string | null;
  updatedAt: string | null;
}

export function DocumentMetadataCard({ repositoryName, commitSha, updatedAt }: DocumentMetadataCardProps) {
  const items = [
    { icon: FileText, label: "Document", value: "Repository documentation" },
    { icon: GitBranch, label: "Repository", value: repositoryName },
    { icon: History, label: "Source commit", value: commitSha ? commitSha.slice(0, 7) : "Preparing" },
    { icon: RadioTower, label: "Last saved", value: updatedAt ? new Date(updatedAt).toLocaleString() : "Not saved yet" },
  ];
  return <section className="grid gap-4 rounded-2xl border border-[#EAE8F0] bg-white p-5 shadow-[0_2px_12px_rgba(35,25,65,0.04)] sm:grid-cols-2 xl:grid-cols-4">
    {items.map(({ icon: Icon, label, value }) => <div key={label} className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EAFF] text-[#7547E8]"><Icon className="h-5 w-5" /></span><div className="min-w-0"><p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#9A96A6]">{label}</p><p className="mt-1 truncate text-sm font-semibold text-[#191725]" title={value}>{value}</p></div></div>)}
  </section>;
}
