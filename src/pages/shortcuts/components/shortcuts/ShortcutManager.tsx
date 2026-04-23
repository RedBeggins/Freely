import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Header, Button } from "@/components";
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

  // Reload config when changed
  useEffect(() => {
    setConfig(getShortcutsConfig());
  }, []);

  const handleSave = async (actionId: string, key: string) => {
    const updatedConfig = updateShortcutBinding(actionId, key);
    setConfig(updatedConfig);

    // Send updated shortcuts to Tauri backend
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

    // Send reset shortcuts to Tauri backend
    try {
      await invoke("update_shortcuts", { config: resetConfig });
    } catch (error) {
      console.error("Failed to reset shortcuts in backend:", error);
    }
  };

  return (
    <div className="space-y-4">
      <Header
        title="Global Shortcuts"
        description="Customize keyboard shortcuts for various actions"
        isMainTitle
        rightSlot={
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="size-4 mr-2" />
            Reset to Defaults
          </Button>
        }
      />
      <div className="flex flex-col gap-4">
        {actions.map((action: ShortcutAction) => {
          const binding = config.bindings[action.id];
          const isEditing = editingActionId === action.id;

          return (
            <div
              key={action.id}
              className="flex justify-between items-center bg-muted/20 p-3 rounded-lg border"
            >
              <div>
                <p className="text-sm font-medium">{action.name}</p>
                <p className="text-xs text-muted-foreground">
                  {action.description}
                </p>
              </div>
              <div>
                {isEditing ? (
                  <ShortcutRecorder
                    actionId={action.id}
                    onSave={(key) => handleSave(action.id, key)}
                    onCancel={() => setEditingActionId(null)}
                  />
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="font-mono text-xs"
                    onClick={() => setEditingActionId(action.id)}
                  >
                    {binding?.key
                      ? formatShortcutKeyForDisplay(binding.key)
                      : "Unassigned"}
                    <Edit2 className="size-3 ml-2 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}