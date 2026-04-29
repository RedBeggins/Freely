import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Button,
} from "@/components";
import { MicIcon, RefreshCwIcon, HeadphonesIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useApp } from "@/contexts";
import { STORAGE_KEYS } from "@/config/constants";
import { safeLocalStorage } from "@/lib/storage";
import { invoke } from "@tauri-apps/api/core";

const MarqueeText = ({ text }: { text: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const check = () => {
      if (containerRef.current && textRef.current) {
        setIsOverflowing(textRef.current.scrollWidth > containerRef.current.clientWidth);
      }
    };
    check();
    const observer = new ResizeObserver(check);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [text]);

  return (
    <div ref={containerRef} className="overflow-hidden w-full">
      {isOverflowing ? (
        <span
          ref={textRef}
          className="marquee-text"
          data-text={text}
        >
          {text}
        </span>
      ) : (
        <span ref={textRef} className="whitespace-nowrap">{text}</span>
      )}
    </div>
  );
};

export const AudioSelection = () => {
  const { selectedAudioDevices, setSelectedAudioDevices } = useApp();

  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [devices, setDevices] = useState<{
    input: { id: string; name: string; is_default: boolean }[];
    output: { id: string; name: string; is_default: boolean }[];
  }>({ input: [], output: [] });

  const saveToStorage = (newDevices: typeof selectedAudioDevices) => {
    safeLocalStorage.setItem(
      STORAGE_KEYS.SELECTED_AUDIO_DEVICES,
      JSON.stringify(newDevices)
    );
  };

  const loadAudioDevices = async () => {
    setIsLoadingDevices(true);
    try {
      const [inputDevices, outputDevices] = await Promise.all([
        invoke<{ id: string; name: string; is_default: boolean }[]>("get_input_devices"),
        invoke<{ id: string; name: string; is_default: boolean }[]>("get_output_devices"),
      ]);

      setDevices({
        input: inputDevices.map((d) => ({ id: d.id, name: d.name, is_default: d.is_default })) || [],
        output: outputDevices.map((d) => ({ id: d.id, name: d.name, is_default: d.is_default })) || [],
      });

      const currentInputExists = inputDevices.some((d) => d.id === selectedAudioDevices.input.id) || selectedAudioDevices.input.id === "default";
      const currentOutputExists = outputDevices.some((d) => d.id === selectedAudioDevices.output.id) || selectedAudioDevices.output.id === "default";

      if (!currentInputExists || !currentOutputExists) {
        const newDevices = {
          input: currentInputExists ? selectedAudioDevices.input : {
            id: "default",
            name: "System Default",
          },
          output: currentOutputExists ? selectedAudioDevices.output : {
            id: "default",
            name: "System Default",
          },
        };
        setSelectedAudioDevices(newDevices);
        saveToStorage(newDevices);
      }
    } catch (error) {
      console.error("Error loading audio devices:", error);
    } finally {
      setIsLoadingDevices(false);
    }
  };

  useEffect(() => {
    loadAudioDevices();
  }, []);

  const handleDeviceChange = (type: "input" | "output", deviceId: string) => {
    if (deviceId === "default") {
      const newDevices = {
        ...selectedAudioDevices,
        [type]: { id: "default", name: "System Default" },
      };
      setSelectedAudioDevices(newDevices);
      saveToStorage(newDevices);
      return;
    }

    const deviceList = type === "input" ? devices.input : devices.output;
    const selectedDevice = deviceList.find((d) => d.id === deviceId);
    if (!selectedDevice) return;

    const newDevices = {
      ...selectedAudioDevices,
      [type]: { id: deviceId, name: selectedDevice.name },
    };
    setSelectedAudioDevices(newDevices);
    saveToStorage(newDevices);
  };

  const RefreshButton = () => (
    <Button
      size="icon"
      variant="ghost"
      onClick={loadAudioDevices}
      disabled={isLoadingDevices}
      className="size-8 shrink-0 text-muted-foreground/60 hover:text-foreground"
      title="Refresh devices"
    >
      <RefreshCwIcon className={`size-3.5 ${isLoadingDevices ? "animate-spin" : ""}`} />
    </Button>
  );

  return (
    <div id="audio" className="space-y-5">
      {/* Microphone */}
      <div className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3 relative overflow-hidden">
        <div className="flex flex-col pr-4 min-w-0 flex-1">
          <p className="text-sm font-medium">Microphone</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Input device for voice and speech-to-text
          </p>
        </div>
        <div className="flex items-center gap-1 w-full max-w-[280px] min-w-0">
          <Select
            value={selectedAudioDevices.input.id}
            onValueChange={(value) => handleDeviceChange("input", value)}
            disabled={isLoadingDevices || devices?.input?.length === 0}
          >
            <SelectTrigger className="flex-1 h-10 border-border/50 overflow-hidden">
              <div className="flex items-center gap-2 text-sm min-w-0 flex-1">
                <MicIcon className="size-3.5 text-muted-foreground/60 shrink-0" />
                <MarqueeText text={
                  isLoadingDevices
                    ? "Loading..."
                    : devices?.input?.length === 0
                    ? "No devices found"
                    : selectedAudioDevices.input.id === "default"
                    ? `System Default${devices?.input?.find(d => d.is_default) ? ` (${devices.input.find(d => d.is_default)?.name})` : ''}`
                    : devices?.input?.find((d) => d?.id === selectedAudioDevices.input.id)?.name || "Select device"
                } />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">
                <div className="flex items-center gap-2">
                  <MicIcon className="size-3.5" />
                  <span className="truncate max-w-[200px]">
                    System Default{devices?.input?.find(d => d.is_default) ? ` (${devices.input.find(d => d.is_default)?.name})` : ''}
                  </span>
                </div>
              </SelectItem>
              {devices?.input?.map((mic) => (
                <SelectItem key={mic?.id} value={mic?.id}>
                  <div className="flex items-center gap-2">
                    <MicIcon className="size-3.5" />
                    <span className="truncate max-w-[200px]">
                      {mic?.name}{mic?.is_default && " (Default)"}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <RefreshButton />
        </div>
        
        {/* Success/Error overlays */}
        {devices?.input?.length === 0 && !isLoadingDevices && (
          <div className="absolute inset-x-0 bottom-0 px-4 py-1.5 flex justify-center bg-amber-500/10 backdrop-blur-sm pointer-events-none border-t border-amber-500/20">
            <span className="text-[10px] font-medium text-amber-600">No microphones found. Check system settings.</span>
          </div>
        )}
      </div>

      {/* System Audio */}
      <div className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3 relative overflow-hidden">
        <div className="flex flex-col pr-4 min-w-0 flex-1">
          <p className="text-sm font-medium">System Audio</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Output device to capture system sounds
          </p>
        </div>
        <div className="flex items-center gap-1 w-full max-w-[280px] min-w-0">
          <Select
            value={selectedAudioDevices.output.id}
            onValueChange={(value) => handleDeviceChange("output", value)}
            disabled={isLoadingDevices || devices?.output?.length === 0}
          >
            <SelectTrigger className="flex-1 h-10 border-border/50 overflow-hidden">
              <div className="flex items-center gap-2 text-sm min-w-0 flex-1">
                <HeadphonesIcon className="size-3.5 text-muted-foreground/60 shrink-0" />
                <MarqueeText text={
                  isLoadingDevices
                    ? "Loading..."
                    : devices?.output?.length === 0
                    ? "No devices found"
                    : selectedAudioDevices.output.id === "default"
                    ? `System Default${devices?.output?.find(d => d.is_default) ? ` (${devices.output.find(d => d.is_default)?.name})` : ''}`
                    : devices?.output?.find((d) => d?.id === selectedAudioDevices.output.id)?.name || "Select device"
                } />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">
                <div className="flex items-center gap-2">
                  <HeadphonesIcon className="size-3.5" />
                  <span className="truncate max-w-[200px]">
                    System Default{devices?.output?.find(d => d.is_default) ? ` (${devices.output.find(d => d.is_default)?.name})` : ''}
                  </span>
                </div>
              </SelectItem>
              {devices?.output?.map((output) => (
                <SelectItem key={output?.id} value={output?.id}>
                  <div className="flex items-center gap-2">
                    <HeadphonesIcon className="size-3.5" />
                    <span className="truncate max-w-[200px]">
                      {output?.name}{output?.is_default && " (Default)"}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <RefreshButton />
        </div>

        {/* Success/Error overlays */}
        {devices?.output?.length === 0 && !isLoadingDevices && (
          <div className="absolute inset-x-0 bottom-0 px-4 py-1.5 flex justify-center bg-amber-500/10 backdrop-blur-sm pointer-events-none border-t border-amber-500/20">
            <span className="text-[10px] font-medium text-amber-600">No output devices found. Check system settings.</span>
          </div>
        )}
      </div>
    </div>
  );
};
