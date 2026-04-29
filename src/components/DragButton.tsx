import { GripVerticalIcon } from "lucide-react";

export const DragButton = () => {
  return (
    <div
      data-tauri-drag-region
      className="flex items-center justify-center cursor-grab text-muted-foreground/50 hover:text-foreground transition-colors h-9 px-1 -ml-1"
    >
      <GripVerticalIcon className="h-4 w-4 pointer-events-none" />
    </div>
  );
};
