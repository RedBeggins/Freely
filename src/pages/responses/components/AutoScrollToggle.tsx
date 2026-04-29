import { Switch } from "@/components";
import { useState, useEffect } from "react";
import { getResponseSettings, updateAutoScroll } from "@/lib";

export const AutoScrollToggle = () => {
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  useEffect(() => {
    const settings = getResponseSettings();
    setAutoScroll(settings.autoScroll);
  }, []);

  const handleSwitchChange = (checked: boolean) => {
    setAutoScroll(checked);
    updateAutoScroll(checked);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
        <div className="flex flex-col pr-4">
          <p className="text-sm font-medium">Auto-Scroll</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Responses scroll to the latest content as they stream
          </p>
        </div>
        <Switch
          checked={autoScroll}
          onCheckedChange={handleSwitchChange}
          aria-label="Toggle auto-scroll"
        />
      </div>
    </div>
  );
};
