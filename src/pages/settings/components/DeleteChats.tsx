import { Loader2, TrashIcon } from "lucide-react";
import { Button } from "@/components";
import { UseSettingsReturn } from "@/types";
import { useState } from "react";

export const DeleteChats = ({
  handleDeleteAllChatsConfirm,
  showDeleteConfirmDialog,
  setShowDeleteConfirmDialog,
}: UseSettingsReturn) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteAllChats = () => {
    setIsDeleting(true);
    handleDeleteAllChatsConfirm();
    setTimeout(() => setIsDeleting(false), 2000);
  };

  return (
    <div id="delete-chats" className="space-y-2">
      <div className="rounded-xl border border-destructive/20 overflow-hidden">
        {isDeleting && (
          <div className="px-4 py-2.5 text-xs text-green-600 bg-green-500/5 border-b border-border/40">
            All chat history has been deleted.
          </div>
        )}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex flex-col pr-4">
            <p className="text-sm font-medium">Delete Chat History</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Permanently remove all stored conversations — this cannot be undone
            </p>
          </div>
          <Button
            onClick={() => setShowDeleteConfirmDialog(true)}
            disabled={isDeleting}
            variant="destructive"
            size="sm"
            className="h-8 shrink-0"
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <TrashIcon className="h-3.5 w-3.5" />
                Delete All
              </>
            )}
          </Button>
        </div>
      </div>

      {showDeleteConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-xl p-5 max-w-sm mx-4 space-y-3">
            <div>
              <h3 className="text-sm font-semibold">Delete All Chat History?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                This will permanently remove all conversations. This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirmDialog(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={deleteAllChats}>
                Delete All
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
