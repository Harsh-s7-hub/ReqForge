"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

export function GlobalSearch() {
  const searchRef = useRef<HTMLInputElement>(null);

  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;

      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      if (
        event.key === "/" &&
        !isTyping &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault();
        setSearchExpanded(true);
        searchRef.current?.focus();
      }

      if (event.key === "Escape") {
        setSearchExpanded(false);
        searchRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="flex flex-1 items-center justify-end">
      <div
        className={`relative flex h-10 items-center rounded-xl border bg-[#FAF9FC] transition-all duration-300 ease-in-out ${
          searchExpanded
            ? "w-full max-w-[520px] border-[#7547E8] bg-white shadow-[0_0_0_3px_rgba(117,71,232,0.08)]"
            : "w-[220px] max-w-[280px] border-[#EAE8F0] hover:border-[#D5C8F5] sm:w-[280px]"
        }`}
      >
        <Search
          size={17}
          className="ml-3 shrink-0 text-[#9691A2]"
        />

        <input
          ref={searchRef}
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          onFocus={() => setSearchExpanded(true)}
          placeholder="Search anything..."
          aria-label="Search RegForge"
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-xs text-[#29213F] outline-none placeholder:text-[#A5A1AE]"
        />

        {!searchExpanded && (
          <div className="mr-2 flex h-6 shrink-0 items-center rounded-md border border-[#EAE8F0] bg-white px-2 text-[10px] text-[#858092]">
            /
          </div>
        )}

        {searchExpanded && searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="mr-3 text-xs text-[#9691A2] transition-colors hover:text-[#7547E8]"
            aria-label="Clear search"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}