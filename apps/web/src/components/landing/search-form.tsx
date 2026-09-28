"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CAMPUSES, SEARCH_EXAMPLES, type Campus } from "./data";

export function SearchForm() {
  const [campus, setCampus] = useState<Campus>(CAMPUSES[0]);
  const [query, setQuery] = useState("");
  const [exampleIndex, setExampleIndex] = useState(0);

  useEffect(() => {
    if (query) return; // niet wisselen terwijl iemand typt
    const id = setInterval(
      () => setExampleIndex((i) => (i + 1) % SEARCH_EXAMPLES.length),
      3500,
    );
    return () => clearInterval(id);
  }, [query]);

  return (
    <form
      action="/zoeken"
      className="rounded-[20px] border-[1.5px] border-line bg-surface-raised p-3 shadow-[0_18px_40px_-24px_rgb(43_18_39/0.35)] focus-within:border-ink"
    >
      <input type="hidden" name="campus" value={campus} />

      <div className="flex items-center gap-2">
        <Search className="ml-2.5 size-5.5 text-ink-muted" aria-hidden />
        <input
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Beschrijf je ideale kot"
          placeholder={SEARCH_EXAMPLES[exampleIndex]}
          className="min-w-0 flex-1 bg-transparent px-3 py-3.5 text-base text-ink outline-none placeholder:text-ink-muted"
        />
        <Button type="submit" variant="brand" size="pill">
          Zoeken
        </Button>
      </div>

      <div
        role="group"
        aria-label="Campus"
        className="mt-2 flex flex-wrap items-center gap-2 border-t border-line px-3 pt-3 pb-1"
      >
        <span className="mr-1 text-[13px] font-medium text-ink-muted">
          Campus
        </span>
        {CAMPUSES.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={c === campus}
            onClick={() => setCampus(c)}
            className={cn(
              "rounded-full border-[1.5px] px-3.5 py-2 text-[13px] leading-none font-medium transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink",
              c === campus
                ? "border-plum bg-plum text-ink"
                : "border-line bg-surface text-ink hover:border-soft-blush",
            )}
          >
            {c}
          </button>
        ))}
      </div>
    </form>
  );
}
