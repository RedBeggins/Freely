import { InfoIcon, MicIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger, Button } from "@/components";
import { AutoSpeechVAD } from "./AutoSpeechVad";
import { UseCompletionReturn } from "@/types";
import { useApp } from "@/contexts";

export const Audio = ({
  micOpen,
  setMicOpen,
  enableVAD,
  setEnableVAD,
  submit,
  setState,
}: UseCompletionReturn) => {
  const { selectedSttProvider, selectedAudioDevices } = useApp();

  const isProviderConfigured = Boolean(selectedSttProvider.provider);

  if (isProviderConfigured && enableVAD) {
    return (
      <AutoSpeechVAD
        submit={submit}
        setState={setState}
        setEnableVAD={setEnableVAD}
        microphoneDeviceName={selectedAudioDevices.input.name}
        microphoneDeviceId={selectedAudioDevices.input.id}
      />
    );
  }

  if (isProviderConfigured) {
    return (
      <Button
        variant="frosted"
        size="icon"
        onClick={() => setEnableVAD(true)}
        className="cursor-pointer"
        title="Toggle voice input"
      >
        <MicIcon className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Popover open={micOpen} onOpenChange={setMicOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="frosted"
          size="icon"
          className="cursor-pointer"
          title="Toggle voice input"
        >
          <MicIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        className="w-80 p-3"
        sideOffset={8}
      >
        <div className="text-sm select-none">
          <div className="font-semibold text-orange-600 mb-1">
            Speech Provider Configuration Required
          </div>
          <p className="text-muted-foreground">
            <div className="mt-2 flex flex-row gap-1 items-center text-orange-600">
              <InfoIcon size={16} />
              <span>PROVIDER IS MISSING</span>
            </div>
            <span className="block mt-2">
              Please go to settings and configure your speech provider to
              enable voice input.
            </span>
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
