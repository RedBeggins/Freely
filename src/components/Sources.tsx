import { useMemo, useState } from "react";

export type WebSource = {
  title: string;
  url: string;
  snippet?: string;
};

export function Sources({ sources }: { sources?: WebSource[] }) {
  const [open, setOpen] = useState(false);

  const normalized = useMemo(() => {
    if (!Array.isArray(sources)) return [];
    return sources
      .filter((s) => s && typeof s.url === "string" && s.url.trim().length > 0)
      .slice(0, 5);
  }, [sources]);

  if (normalized.length === 0) return null;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[11px] text-muted-foreground/80 hover:text-muted-foreground select-none"
      >
        {open ? "Hide sources" : "Sources"}
        <span className="ml-1 text-muted-foreground/60">
          ({normalized.length})
        </span>
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {normalized.map((s, idx) => (
            <div
              key={`${s.url}-${idx}`}
              className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2"
            >
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="text-[12px] font-medium underline underline-offset-2 hover:opacity-90 break-words"
              >
                {s.title?.trim() ? s.title : s.url}
              </a>
              {s.snippet?.trim() && (
                <div className="mt-1 text-[11px] text-muted-foreground/80">
                  {s.snippet}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

