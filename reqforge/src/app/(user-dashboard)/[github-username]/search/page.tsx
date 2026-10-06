"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, FolderGit2, FolderKanban, FileText } from "lucide-react";

const filters = [
  { label: "All", value: "all" },
  { label: "Repositories", value: "repositories" },
  { label: "Projects", value: "projects" },
  { label: "Documentation", value: "documentation" },
];

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") || "";
  const initialType = searchParams.get("type") || "all";

  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState(initialType);

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams();

    if (query.trim()) params.set("q", query.trim());
    if (type !== "all") params.set("type", type);

    router.push(`/Harsh-s7-hub/search?${params.toString()}`);
  }

  const isSearching = Boolean(initialQuery);

  return (
    <div className="mx-auto max-w-5xl space-y-8">

      <div>
        <h1 className="text-2xl font-bold text-[#29213F]">
          Search RegForge
        </h1>
        <p className="mt-2 text-sm text-[#6F6B7D]">
          Find repositories, projects, and AI-generated documentation.
        </p>
      </div>

      <form onSubmit={handleSearch}>
        <div className="flex h-12 items-center gap-3 rounded-xl border border-[#EAE8F0] bg-white px-4 shadow-sm focus-within:border-[#7547E8]">
          <Search size={19} className="text-[#9691A6]" />

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search repositories, projects, documentation..."
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-[#29213F] outline-none placeholder:text-[#9A96A6]"
            autoFocus
          />

          <button
            type="submit"
            className="rounded-lg bg-[#7547E8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#6335D1]"
          >
            Search
          </button>
        </div>
      </form>

      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setType(filter.value)}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
              type === filter.value
                ? "bg-[#F0EAFF] text-[#7547E8]"
                : "border border-[#EAE8F0] bg-white text-[#6F6B7D] hover:bg-[#F7F5FB]"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {isSearching ? (
        <div className="flex min-h-[350px] flex-col items-center justify-center rounded-xl border border-[#EAE8F0] bg-white p-8 text-center">

          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F0EAFF]">
            <Search size={30} className="text-[#7547E8]" />
          </div>

          <h2 className="text-xl font-bold text-[#29213F]">
            No results found
          </h2>

          <p className="mt-2 max-w-md text-sm leading-6 text-[#6F6B7D]">
            We couldn't find anything matching "{initialQuery}".
            Try another search term or select a different category.
          </p>

          <button
            onClick={() => {
              setQuery("");
              setType("all");
              router.push("/Harsh-s7-hub/search");
            }}
            className="mt-5 text-sm font-semibold text-[#7547E8] hover:text-[#6335D1]"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="flex min-h-[350px] flex-col items-center justify-center rounded-xl border border-dashed border-[#EAE8F0] bg-white p-8 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F0EAFF]">
            <FolderGit2 size={30} className="text-[#7547E8]" />
          </div>

          <h2 className="text-lg font-bold text-[#29213F]">
            What are you looking for?
          </h2>

          <p className="mt-2 text-sm text-[#6F6B7D]">
            Search across your RegForge workspace.
          </p>
        </div>
      )}
    </div>
  );
}