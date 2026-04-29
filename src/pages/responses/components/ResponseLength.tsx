import { Selection } from "@/components";
import { RESPONSE_LENGTHS } from "@/lib";
import { updateResponseLength } from "@/lib/storage/response-settings.storage";
import { useState, useEffect, useMemo } from "react";
import { getResponseSettings } from "@/lib";

export const ResponseLength = () => {
  const [selectedLength, setSelectedLength] = useState<string>("auto");

  useEffect(() => {
    const settings = getResponseSettings();
    setSelectedLength(settings.responseLength);
  }, []);

  const handleLengthChange = (lengthId: string) => {
    setSelectedLength(lengthId);
    updateResponseLength(lengthId);
  };

  const lengthOptions = useMemo(() => {
    return RESPONSE_LENGTHS.map((length) => ({
      label: length.title,
      value: length.id,
    }));
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
        <div className="flex flex-col pr-4 min-w-0 flex-1">
          <p className="text-sm font-medium">Response Length</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            How detailed AI responses should be
          </p>
        </div>
        <div className="w-full max-w-[280px] min-w-0">
          <Selection
            selected={selectedLength}
            onChange={handleLengthChange}
            options={lengthOptions}
            placeholder="Select a length"
          />
        </div>
      </div>
    </div>
  );
};
