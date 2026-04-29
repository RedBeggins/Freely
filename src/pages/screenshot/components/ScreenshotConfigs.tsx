import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components";
import { UseSettingsReturn } from "@/types";
import { LaptopMinimalIcon, MousePointer2Icon } from "lucide-react";

export const ScreenshotConfigs = ({
  screenshotConfiguration,
  handleScreenshotModeChange,
  handleScreenshotPromptChange,
  handleScreenshotEnabledChange,
}: UseSettingsReturn) => {
  return (
    <div id="screenshot" className="space-y-2">
      {/* Capture Method */}
      <div className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
        <div className="flex flex-col pr-4 min-w-0 flex-1">
          <p className="text-sm font-medium">Capture Method</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {screenshotConfiguration.enabled
              ? "Screenshot — captures the entire screen with one click"
              : "Selection — click and drag to capture a specific area"}
          </p>
        </div>
        <div className="w-full max-w-[280px] min-w-0">
          <Select
            value={screenshotConfiguration.enabled ? "screenshot" : "selection"}
            onValueChange={(value) =>
              handleScreenshotEnabledChange(value === "screenshot")
            }
          >
            <SelectTrigger className="w-full h-10 border-border/50">
              <div className="flex items-center gap-2 text-sm">
                {screenshotConfiguration.enabled ? (
                  <LaptopMinimalIcon className="size-3.5 text-muted-foreground/60" />
                ) : (
                  <MousePointer2Icon className="size-3.5 text-muted-foreground/60" />
                )}
                {screenshotConfiguration.enabled ? "Screenshot" : "Selection"}
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="selection">
                <div className="flex items-center gap-2">
                  <MousePointer2Icon className="size-3.5" />
                  Selection Mode
                </div>
              </SelectItem>
              <SelectItem value="screenshot">
                <div className="flex items-center gap-2">
                  <LaptopMinimalIcon className="size-3.5" />
                  Screenshot Mode
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Processing Mode */}
      <div className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
        <div className="flex flex-col pr-4 min-w-0 flex-1">
          <p className="text-sm font-medium">Processing Mode</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {screenshotConfiguration.mode === "manual"
              ? "Manual — screenshots are added to attached files for you to submit"
              : "Auto — screenshots are submitted to AI immediately with your prompt"}
          </p>
        </div>
        <div className="w-full max-w-[280px] min-w-0">
          <Select
            value={screenshotConfiguration.mode}
            onValueChange={handleScreenshotModeChange}
          >
            <SelectTrigger className="w-full h-10 border-border/50">
              <div className="text-sm">
                {screenshotConfiguration.mode === "auto" ? "Auto Mode" : "Manual Mode"}
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual Mode</SelectItem>
              <SelectItem value="auto">Auto Mode</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Auto Prompt */}
      {screenshotConfiguration.mode === "auto" && (
        <div className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
          <div className="flex flex-col pr-4 min-w-0 flex-1">
            <p className="text-sm font-medium">Auto Prompt</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Prompt sent automatically when captured
            </p>
          </div>
          <div className="w-full max-w-[280px] min-w-0">
            <Input
              placeholder="e.g. Explain what's happening on screen"
              value={screenshotConfiguration.autoPrompt}
              onChange={(e) => handleScreenshotPromptChange(e.target.value)}
              className="w-full h-10 border-border/50"
            />
          </div>
        </div>
      )}
    </div>
  );
};
