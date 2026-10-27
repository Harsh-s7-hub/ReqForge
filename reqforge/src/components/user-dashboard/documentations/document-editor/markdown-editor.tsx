"use client";

import { useState } from "react";
import { Save } from "lucide-react";

interface MarkdownEditorProps { content: string; disabled: boolean; onSave: (content: string) => Promise<void>; }

export function MarkdownEditor({ content, disabled, onSave }: MarkdownEditorProps) {
  const [value, setValue] = useState(content);
  const [saving, setSaving] = useState(false);
  async function save() { setSaving(true); try { await onSave(value); } finally { setSaving(false); } }
  return <div className="min-h-[600px] bg-white"><textarea value={value} disabled={disabled} onChange={(event) => setValue(event.target.value)} className="min-h-[540px] w-full resize-y bg-transparent px-8 py-7 font-mono text-sm leading-7 text-[#29213F] outline-none disabled:cursor-not-allowed disabled:text-[#9A96A6]" placeholder="Generated documentation will appear here." />
    <div className="flex justify-end border-t border-[#EAE8F0] px-5 py-3"><button type="button" disabled={disabled || saving || value === content} onClick={save} className="inline-flex items-center gap-2 rounded-lg bg-[#7547E8] px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-[#6335D1] disabled:cursor-not-allowed disabled:opacity-50"><Save className="h-4 w-4" />{saving ? "Saving..." : "Save changes"}</button></div>
  </div>;
}
