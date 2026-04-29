import {
  Card,
  Button,
  TextInput,
  Switch,
  Textarea,
  Selection,
} from "@/components";
import { PlusIcon, SaveIcon } from "lucide-react";
import { useCustomSttProviders } from "@/hooks";
import { useApp } from "@/contexts";
import { cn } from "@/lib/utils";

interface CreateEditProviderProps {
  customProviderHook?: ReturnType<typeof useCustomSttProviders>;
}

export const CreateEditProvider = ({
  customProviderHook,
}: CreateEditProviderProps) => {
  const { allSttProviders } = useApp();
  // Use the provided hook instance or create a new one
  const hookInstance = customProviderHook || useCustomSttProviders();

  const {
    showForm,
    setShowForm,
    editingProvider,
    formData,
    setFormData,
    errors,
    handleSave,
    setErrors,
    handleAutoFill,
  } = hookInstance;

  return (
    <>
      {!showForm ? (
        <Button
          onClick={() => {
            setShowForm(true);
            setErrors({});
          }}
          variant="outline"
          className="w-full h-11 border-border/50 transition-colors"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Custom STT Provider
        </Button>
      ) : (
        <Card className="p-5 border border-border/50 !bg-transparent space-y-5 rounded-xl">
          {/* Header & Auto-fill */}
          <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
            <div className="flex flex-col pr-4 min-w-0 flex-1">
              <p className="text-sm font-medium">{editingProvider ? `Edit STT Provider` : "Add Custom STT Provider"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Create a custom STT provider to use with your applications.
              </p>
            </div>
            <div className="w-full max-w-[280px] min-w-0">
              <Selection
                options={allSttProviders
                  ?.filter((provider) => !provider?.isCustom)
                  .map((provider) => {
                    return {
                      label: provider?.id || "STT Provider",
                      value: provider?.id || "STT Provider",
                    };
                  })}
                placeholder={"Auto-fill"}
                onChange={(value) => {
                  handleAutoFill(value);
                }}
              />
            </div>
          </div>

          {/* Curl Command */}
          <div className="space-y-2">
            <div className="flex flex-col px-1">
              <p className="text-sm font-medium">Curl Command *</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                The curl command to use with the STT provider.
              </p>
            </div>
            <Textarea
              className={cn(
                "h-72 font-mono text-sm border-border/50",
                errors.curl && "border-red-500"
              )}
              placeholder={`curl -X POST "https://api.openai.com/v1/audio/transcriptions" \\
      -H "Authorization: Bearer {{API_KEY}}" \\
      -F "file={{AUDIO}}" \\
      -F "model={{MODEL}}"`}
              value={formData.curl}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, curl: e.target.value }))
              }
            />
            {errors.curl && (
              <p className="text-xs text-red-500 mt-1 px-1">{errors.curl}</p>
            )}

            {/* Variable Instructions */}
            <div className="bg-muted/30 p-4 rounded-xl space-y-4 border border-border/30 mt-4">
              <div className="bg-background/50 border border-border/40 p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">
                  💡 Important: You can add custom variables or directly
                  include your API keys/values
                </p>
                <p className="text-xs text-muted-foreground">
                  No need to enter variables separately when selecting the
                  provider - you can embed them directly in the curl command
                  (e.g., replace YOUR_API_KEY with your actual key or use{" "}
                  <code className="bg-muted px-1 rounded text-xs">
                    {"{{MODEL}}"}
                  </code>{" "}
                  for model name).
                </p>
              </div>

              <h4 className="text-sm font-semibold text-foreground px-1">
                ⚠️ Required Variables for STT Providers:
              </h4>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center gap-3 px-3 py-2 bg-background/50 border border-border/40 rounded-lg">
                  <code className="bg-muted px-2 py-0.5 rounded font-mono text-[10px]">
                    {"{{AUDIO}}"}
                  </code>
                  <span className="text-xs font-medium">
                    → REQUIRED: Base64 encoded audio data or audio file
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
              <div className="flex flex-col pr-4 min-w-0 flex-1">
                <p className="text-sm font-medium">Streaming</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Stream the response from the provider (Currently unsupported for STT).
                </p>
              </div>
              <Switch
                checked={formData.streaming}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    streaming: checked,
                  }))
                }
                disabled={true}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
              <div className="flex flex-col pr-4 min-w-0 flex-1">
                <p className="text-sm font-medium">Response Content Path *</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Path to extract content from response.
                </p>
              </div>
              <div className="w-full max-w-[280px] min-w-0">
                <TextInput
                  placeholder="text"
                  value={formData.responseContentPath || ""}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      responseContentPath: value,
                    }))
                  }
                  error={errors.responseContentPath}
                />
              </div>
            </div>
            {errors.responseContentPath && (
               <p className="text-xs text-red-500 mt-1 px-4">{errors.responseContentPath}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/30">
            <Button
              variant="outline"
              onClick={() => setShowForm(!showForm)}
              className="h-10 border-border/50 transition-colors"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.curl.trim()}
              className={cn(
                "h-10 transition-colors",
                errors.curl && "bg-red-500 hover:bg-red-600 text-white"
              )}
            >
              {errors.curl ? (
                "Invalid cURL, try again"
              ) : (
                <>
                  <SaveIcon className="h-4 w-4 mr-2" />
                  {editingProvider ? "Update" : "Save"} Provider
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
    </>
  );
};
