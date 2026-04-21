import { GripVerticalIcon } from "lucide-react";
import { Button } from "@/components";

export const DragButton = () => {
  return (
    <div
      data-tauri-drag-region
      className="-ml-[2px]"
    >
      <Button
        variant="frosted"
        size="icon"
        className={`h-9 w-9 pointer-events-none rounded-full`}
      >
        <GripVerticalIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};
