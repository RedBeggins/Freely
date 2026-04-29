import { Button, Input, Selection, TextInput } from "@/components";
import { UseSettingsReturn } from "@/types";
import curl2Json, { ResultJSON } from "@bany/curl-to-json";
import { KeyIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";

export const Providers = ({
  allSttProviders,
  selectedSttProvider,
  onSetSelectedSttProvider,
  sttVariables,
}: UseSettingsReturn) => {
  const [localSelectedProvider, setLocalSelectedProvider] =
    useState<ResultJSON | null>(null);

  useEffect(() => {
    if (selectedSttProvider?.provider) {
      const provider = allSttProviders?.find(
        (p) => p?.id === selectedSttProvider?.provider
      );
      if (provider) {
        try {
          const json = curl2Json(provider?.curl);
          setLocalSelectedProvider(json as ResultJSON);
        } catch (error) {
          console.warn("Failed to parse curl command:", error);
          setLocalSelectedProvider(null);
        }
      }
    }
  }, [selectedSttProvider?.provider]);

  const findKeyAndValue = (key: string) => {
    return sttVariables?.find((v) => v?.key === key);
  };

  const getApiKeyValue = () => {
    const apiKeyVar = findKeyAndValue("api_key");
    if (!apiKeyVar || !selectedSttProvider?.variables) return "";
    return selectedSttProvider?.variables?.[apiKeyVar.key] || "";
  };

  const isApiKeyEmpty = () => {
    return !getApiKeyValue().trim();
  };

  return (
    <div className="space-y-4">
      {/* Provider Selection */}
      <div className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
        <div className="flex flex-col pr-4 min-w-0 flex-1">
          <p className="text-sm font-medium">Select STT Provider</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Choose from built-in or custom providers
          </p>
          {localSelectedProvider && (
            <p className="text-[10px] text-muted-foreground/60 mt-1 line-clamp-1">
              {localSelectedProvider?.method?.toUpperCase()} · {localSelectedProvider?.url}
            </p>
          )}
        </div>
        <div className="w-full max-w-[280px] min-w-0">
          <Selection
            selected={selectedSttProvider?.provider}
            options={allSttProviders?.map((provider) => {
              let json: ResultJSON | null = null;
              try {
                json = curl2Json(provider?.curl) as ResultJSON;
              } catch (error) {
                console.warn("Failed to parse curl command:", error);
              }
              return {
                label: provider?.isCustom
                  ? json?.url || "Custom Provider"
                  : provider?.id || "Custom Provider",
                value: provider?.id || "Custom Provider",
                isCustom: provider?.isCustom,
              };
            })}
            placeholder="Choose provider"
            onChange={(value) => {
              onSetSelectedSttProvider({
                provider: value,
                variables: {},
              });
            }}
          />
        </div>
      </div>

      {/* API Key */}
      {findKeyAndValue("api_key") && (
        <div className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
          <div className="flex flex-col pr-4 min-w-0 flex-1">
            <p className="text-sm font-medium">API Key</p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              For {
                allSttProviders?.find(
                  (p) => p?.id === selectedSttProvider?.provider
                )?.isCustom
                  ? "Custom Provider"
                  : selectedSttProvider?.provider
              } (stored locally)
            </p>
          </div>
          <div className="flex gap-2 w-full max-w-[280px] min-w-0">
            <Input
              type="password"
              placeholder="API Key"
              value={getApiKeyValue()}
              onChange={(value) => {
                const apiKeyVar = findKeyAndValue("api_key");
                if (!apiKeyVar || !selectedSttProvider) return;
                onSetSelectedSttProvider({
                  ...selectedSttProvider,
                  variables: {
                    ...selectedSttProvider.variables,
                    [apiKeyVar.key]:
                      typeof value === "string" ? value : value.target.value,
                  },
                });
              }}
              onKeyDown={(e) => {
                const apiKeyVar = findKeyAndValue("api_key");
                if (!apiKeyVar || !selectedSttProvider) return;
                onSetSelectedSttProvider({
                  ...selectedSttProvider,
                  variables: {
                    ...selectedSttProvider.variables,
                    [apiKeyVar.key]: (e.target as HTMLInputElement).value,
                  },
                });
              }}
              disabled={false}
              className="flex-1 h-10 border-border/50"
            />
            {isApiKeyEmpty() ? (
              <Button
                onClick={() => {
                  const apiKeyVar = findKeyAndValue("api_key");
                  if (!apiKeyVar || !selectedSttProvider || isApiKeyEmpty()) return;
                  onSetSelectedSttProvider({
                    ...selectedSttProvider,
                    variables: {
                      ...selectedSttProvider.variables,
                      [apiKeyVar.key]: getApiKeyValue(),
                    },
                  });
                }}
                disabled={isApiKeyEmpty()}
                size="icon"
                className="shrink-0 h-10 w-10"
                title="Submit API Key"
              >
                <KeyIcon className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={() => {
                  const apiKeyVar = findKeyAndValue("api_key");
                  if (!apiKeyVar || !selectedSttProvider) return;
                  onSetSelectedSttProvider({
                    ...selectedSttProvider,
                    variables: {
                      ...selectedSttProvider.variables,
                      [apiKeyVar.key]: "",
                    },
                  });
                }}
                size="icon"
                variant="destructive"
                className="shrink-0 h-10 w-10"
                title="Clear API Key"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Other Variables */}
      {sttVariables?.filter((v) => v.key !== findKeyAndValue("api_key")?.key).length ? (
        <div className="rounded-xl border border-border/50 divide-y divide-border/40">
          {sttVariables
            ?.filter((variable) => variable.key !== findKeyAndValue("api_key")?.key)
            .map((variable) => {
              const getVariableValue = () => {
                if (!variable?.key || !selectedSttProvider?.variables) return "";
                return selectedSttProvider.variables[variable.key] || "";
              };

              return (
                <div className="flex items-center justify-between px-4 py-3" key={variable?.key}>
                  <div className="flex flex-col pr-4 min-w-0 flex-1">
                    <p className="text-sm font-medium capitalize">
                      {variable?.key?.replace(/_/g, " ")}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                      {variable?.value || "Required parameter"}
                    </p>
                  </div>
                  <div className="w-full max-w-[280px] min-w-0">
                    <TextInput
                      placeholder={`Enter ${variable?.key?.replace(/_/g, " ") || "value"}`}
                      value={getVariableValue()}
                      onChange={(value) => {
                        if (!variable?.key || !selectedSttProvider) return;
                        onSetSelectedSttProvider({
                          ...selectedSttProvider,
                          variables: {
                            ...selectedSttProvider.variables,
                            [variable.key]: value,
                          },
                        });
                      }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      ) : null}
    </div>
  );
};
