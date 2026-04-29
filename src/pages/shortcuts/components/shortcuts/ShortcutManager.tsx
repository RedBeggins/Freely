import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Header } from "@/components";
import { Edit2, RotateCcw } from "lucide-react";
import { ShortcutRecorder } from "./ShortcutRecorder";
import {
  getAllShortcutActions,
  getShortcutsConfig,
  updateShortcutBinding,
  resetShortcutsToDefaults,
  formatShortcutKeyForDisplay,
} from "@/lib/storage/shortcuts.storage";
import { ShortcutAction, ShortcutsConfig } from "@/types";

export default function ShortcutManager() {
  const [config, setConfig] = useState<ShortcutsConfig>(getShortcutsConfig());
  const [editingActionId, setEditingActionId] = useState<string | null>(null);

  const actions = getAllShortcutActions();

  useEffect(() => {
    setConfig(getShortcutsConfig());
  }, []);

  const handleSave = async (actionId: string, key: string) => {
    const updatedConfig = updateShortcutBinding(actionId, key);
    setConfig(updatedConfig);
    try {
      await invoke("update_shortcuts", { config: updatedConfig });
    } catch (error) {
      console.error("Failed to update shortcuts in backend:", error);
    }
    setEditingActionId(null);
  };

  const handleReset = async () => {
    const resetConfig = resetShortcutsToDefaults();
    setConfig(resetConfig);
    try {
      await invoke("update_shortcuts", { config: resetConfig });
    } catch (error) {
      console.error("Failed to reset shortcuts in backend:", error);
    }
  };

  return (
    <div className="space-y-2">
      <Header
        title="Global Shortcuts"
        description="Keyboard shortcuts for quick access to Freely actions"
        rightSlot={
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            <RotateCcw className="size-3" />
            Reset
          </button>
        }
      />
      <div className="rounded-xl border border-border/50 divide-y divide-border/40">
        {actions.map((action: ShortcutAction) => {
          const binding = config.bindings[action.id];
          const isEditing = editingActionId === action.id;

          return (
            <div
              key={action.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{action.name}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
              <div className="ml-4 shrink-0">
                {isEditing ? (
                  <ShortcutRecorder
                    actionId={action.id}
                    onSave={(key) => handleSave(action.id, key)}
                    onCancel={() => setEditingActionId(null)}
                  />
                ) : (
                  <button
                    className="flex items-center gap-1.5 text-xs text-muted-foreground/70 hover:text-foreground transition-colors font-mono bg-muted/40 hover:bg-muted/70 px-2.5 py-1 rounded-md"
                    onClick={() => setEditingActionId(action.id)}
                  >
                    {binding?.key
                      ? formatShortcutKeyForDisplay(binding.key)
                      : "Unassigned"}
                    <Edit2 className="size-2.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
