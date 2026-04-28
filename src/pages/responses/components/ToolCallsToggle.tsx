import { Switch, Label, Header } from "@/components";
import { useEffect, useState } from "react";
import { getResponseSettings, updateEnableToolCalls } from "@/lib";

export const ToolCallsToggle = () => {
  const [enabled, setEnabled] = useState<boolean>(false);

  useEffect(() => {
    const settings = getResponseSettings();
    setEnabled(Boolean(settings.enableToolCalls));
  }, []);

  const handleSwitchChange = (checked: boolean) => {
    setEnabled(checked);
    updateEnableToolCalls(checked);
  };

  return (
    <div className="space-y-4">
      <Header
        title="Tool Calls (Web Search)"
        description="Allow the model to call tools (OpenAI-compatible `tools` / `tool_calls`) such as web search. Requires Web Search to be enabled in Dev Space."
        isMainTitle
      />

      <div className="flex items-center justify-between p-4 border rounded-xl">
        <div className="pr-4">
          <Label className="text-sm font-medium">
            {enabled ? "Tool calls enabled" : "Tool calls disabled"}
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            When enabled, the assistant may perform a tool call (like web search)
            mid-response and then continue with sources.
          </p>
          <p className="text-xs mt-2 text-amber-600 dark:text-amber-400">
            Warning: Many models reject `tools/tool_calls` and will return a 400
            error. Turn this off if you see API errors.
          </p>
          <p className="text-xs mt-2 text-muted-foreground">
            Setup: Go to Dev Space → Web Search (Free) and enable it.
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={handleSwitchChange}
          title={`Toggle to ${!enabled ? "enable" : "disable"} tool calls`}
          aria-label={`Toggle to ${enabled ? "disable" : "enable"} tool calls`}
        />
      </div>
    </div>
  );
};

