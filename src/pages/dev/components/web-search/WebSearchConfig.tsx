import { Button, Header, Switch, Label } from "@/components";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

type StorageResult = {
  web_search_enabled?: boolean | null;
};

export const WebSearchConfig = () => {
  const [enabled, setEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = (await invoke("secure_storage_get")) as StorageResult;
        setEnabled(res?.web_search_enabled ?? true);
      } catch {
        // ignore
      }
    })();
  }, []);

  const save = async () => {
    setIsSaving(true);
    setStatus(null);
    try {
      await invoke("secure_storage_save", {
        items: [
          { key: "web_search_enabled", value: enabled ? "true" : "false" },
        ],
      });
      setStatus("Saved.");
    } catch (e) {
      setStatus(`Save failed: ${String((e as any)?.message || e)}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="web-search" className="space-y-3">
      <Header
        title="Web Search (Free)"
        description="Enable the built-in free web search tool (DuckDuckGo HTML). Tool calling depends on this being enabled."
        isMainTitle
      />

      <div className="p-4 border rounded-xl space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label className="text-sm font-medium">
              {enabled ? "Web search enabled" : "Web search disabled"}
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              If disabled, tool calling will fail for web search.
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {status ? status : " "}
          </div>
          <Button onClick={save} disabled={isSaving} className="h-10">
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
};

