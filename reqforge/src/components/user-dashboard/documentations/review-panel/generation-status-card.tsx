import { CircleAlert, LoaderCircle, Sparkles } from "lucide-react";
import type { DocumentationStatus } from "../types";

export function GenerationStatusCard({ status, failureReason }: { status: DocumentationStatus; failureReason: string | null }) {
  const ready = status === "ready";
  const failed = status === "failed";
  return <section className="rounded-2xl border border-[#EAE8F0] bg-white p-5"><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${ready ? "bg-[#16CFEA]" : failed ? "bg-red-500" : "bg-[#E99A27]"}`} /><h2 className="font-semibold text-[#191725]">{ready ? "Draft ready" : failed ? "Generation failed" : "Generating documentation"}</h2></div><div className="mt-4 rounded-xl bg-[#F7F3FF] p-4 text-sm leading-6 text-[#6F6B7D]">{ready ? <><Sparkles className="mb-2 h-5 w-5 text-[#7547E8]" />Your AI-generated Markdown is ready for review and editing.</> : failed ? <><CircleAlert className="mb-2 h-5 w-5 text-red-500" />{failureReason || "The generation task could not complete."}</> : <><LoaderCircle className="mb-2 h-5 w-5 animate-spin text-[#7547E8]" />RegForge is assembling repository context and generating your documentation.</>}</div></section>;
}
