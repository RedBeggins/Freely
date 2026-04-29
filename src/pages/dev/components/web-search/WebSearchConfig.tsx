import { Header, Switch } from "@/components";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

type StorageResult = {
  web_search_enabled?: boolean | null;
};

export const WebSearchConfig = () => {
  const [enabled, setEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleCheckedChange = async (newValue: boolean) => {
    setEnabled(newValue);
    setIsSaving(true);
    try {
      await invoke("secure_storage_save", {
        items: [
          { key: "web_search_enabled", value: newValue ? "true" : "false" },
        ],
      });
    } catch (e) {
      console.error("Save failed:", e);
      setEnabled(!newValue);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="web-search" className="space-y-2">
      <div className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
        <div className="flex flex-col pr-4">
          <p className="text-sm font-medium">Web Search</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Built-in DuckDuckGo search tool. Required for tool calling to work.
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={handleCheckedChange}
          disabled={isSaving}
        />
      </div>
    </div>
  );
};
