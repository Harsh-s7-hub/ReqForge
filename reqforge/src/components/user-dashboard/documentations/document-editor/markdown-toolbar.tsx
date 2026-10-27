import { Bold, Code2, Heading1, Heading2, Italic, List } from "lucide-react";

const tools = [Heading1, Heading2, Bold, Italic, Code2, List];

export function MarkdownToolbar() {
  return <div className="flex items-center gap-1 border-b border-[#EAE8F0] px-4 py-3">{tools.map((Icon, index) => <button key={index} type="button" aria-label="Markdown formatting tool" className="rounded-md p-2 text-[#6F6B7D] transition hover:bg-[#F3F0FC] hover:text-[#7547E8]"><Icon className="h-4 w-4" /></button>)}<span className="ml-auto text-xs font-medium text-[#9A96A6]">Markdown editor</span></div>;
}
