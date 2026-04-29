import { Switch } from "@/components";
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
    <div className="space-y-2">
      <div className="rounded-xl border border-border/50 divide-y divide-border/40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex flex-col pr-4">
            <p className="text-sm font-medium">Tool Calls</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Allow the model to call tools (OpenAI <code className="text-[10px] bg-muted px-1 rounded">tool_calls</code>) such as web search. Requires Web Search enabled in Dev Space.
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={handleSwitchChange}
            aria-label="Toggle tool calls"
          />
        </div>
        <div className="px-4 py-2.5">
          <p className="text-xs text-amber-500/80">
            Many models reject <code className="text-[10px] bg-amber-500/10 px-1 rounded">tool_calls</code> and return a 400 error. Disable if you see API errors.
          </p>
        </div>
      </div>
    </div>
  );
};
