import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components";
import { AudioVisualizer } from "@/pages/app/components/speech/audio-visualizer";
import { fetchSTT } from "@/lib";
import { useApp } from "@/contexts";
import { StopCircle, Send } from "lucide-react";

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  onCancel: () => void;
}

const MAX_DURATION = 3 * 60 * 1000;

export const AudioRecorder = ({
  onTranscriptionComplete,
  onCancel,
}: AudioRecorderProps) => {
  const { selectedSttProvider, allSttProviders, selectedAudioDevices } =
    useApp();
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [initError, setInitError] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "initializing" | "waiting_permission" | "recording" | "ready" | "error"
  >("initializing");
  const [initElapsedMs, setInitElapsedMs] = useState(0);
  const canRequestMic =
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia);
  const hasMediaRecorder = typeof MediaRecorder !== "undefined";
  const [chosenMimeType, setChosenMimeType] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxDurationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const permissionTimeoutRef = useRef<number | null>(null);
  const recorderStartTimeoutRef = useRef<number | null>(null);
  const startTokenRef = useRef(0);
  const initIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (status === "error" && !initError) {
      setInitError("Unknown microphone error (no details).");
    }
  }, [status, initError]);

  // Cleanup function - stops all tracks and clears refs
  const cleanup = useCallback(() => {
    // Invalidate any in-flight startRecording() call
    startTokenRef.current += 1;

    // Clear timers
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (maxDurationTimeoutRef.current) {
      clearTimeout(maxDurationTimeoutRef.current);
      maxDurationTimeoutRef.current = null;
    }
    if (permissionTimeoutRef.current) {
      window.clearTimeout(permissionTimeoutRef.current);
      permissionTimeoutRef.current = null;
    }
    if (recorderStartTimeoutRef.current) {
      window.clearTimeout(recorderStartTimeoutRef.current);
      recorderStartTimeoutRef.current = null;
    }
    if (initIntervalRef.current) {
      window.clearInterval(initIntervalRef.current);
      initIntervalRef.current = null;
    }

    // Stop media recorder
    if (mediaRecorderRef.current?.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // Ignore errors when stopping
      }
    }
    mediaRecorderRef.current = null;

    // Stop all audio tracks - this is critical for releasing the microphone
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
    }

    // Also stop from state
    if (audioStream) {
      audioStream.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
    }
    setAudioStream(null);
  }, [audioStream]);

  useEffect(() => {
    startRecording();

    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, []);

  const startRecording = async () => {
    const token = startTokenRef.current;
    const safeSetError = (msg: string) => {
      if (startTokenRef.current !== token) return;
      setInitError(msg);
      setStatus("error");
    };
    try {
      setInitError(null);
      setStatus("initializing");
      setInitElapsedMs(0);

      if (!canRequestMic) {
        safeSetError(
          "Microphone API is unavailable in this view (navigator.mediaDevices.getUserMedia missing)."
        );
        return;
      }

      if (initIntervalRef.current) {
        window.clearInterval(initIntervalRef.current);
      }
      const initStart = Date.now();
      initIntervalRef.current = window.setInterval(() => {
        const ms = Date.now() - initStart;
        setInitElapsedMs(ms);
        setStatus((s) =>
          s === "initializing" && ms > 900 ? "waiting_permission" : s
        );
      }, 200);

      // The audio settings page stores native (Tauri/Rust) device IDs which
      // differ from Web API device IDs. Resolve by matching on device name.
      const configuredDeviceName = selectedAudioDevices?.input?.name;
      const configuredDeviceId = selectedAudioDevices?.input?.id;

      let webDeviceId: string | undefined;
      if (configuredDeviceName) {
        try {
          const webDevices = await navigator.mediaDevices.enumerateDevices();
          const match = webDevices.find(
            (d) =>
              d.kind === "audioinput" &&
              d.label.toLowerCase().includes(configuredDeviceName.toLowerCase())
          );
          if (match && match.deviceId) {
            webDeviceId = match.deviceId;
          }
        } catch {
          // enumerateDevices may fail before permission; continue with fallback
        }
      }

      const resolvedId = webDeviceId || configuredDeviceId;

      const audioConstraintsExact: MediaTrackConstraints =
        resolvedId && resolvedId !== "default" ? { deviceId: { exact: resolvedId } } : {};

      const audioConstraintsIdeal: MediaTrackConstraints =
        resolvedId && resolvedId !== "default" ? { deviceId: { ideal: resolvedId } } : {};

      // If the permission prompt is shown, getUserMedia can "hang" from the UI
      // perspective. Flip the status after a short delay so the user sees what's happening.
      permissionTimeoutRef.current = window.setTimeout(() => {
        setStatus((s) => (s === "initializing" ? "waiting_permission" : s));
      }, 800);

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraintsExact,
        });
      } catch (e) {
        // If exact selection fails, try ideal, then finally fall back to default.
        if (resolvedId && resolvedId !== "default") {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: audioConstraintsIdeal,
            });
          } catch (e2) {
            try {
              stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch (e3) {
              const err = e3 as any;
              const name = typeof err?.name === "string" ? err.name : "Error";
              const message =
                typeof err?.message === "string" && err.message
                  ? err.message
                  : "Failed to access microphone";
              const constraint =
                typeof err?.constraint === "string" ? ` (constraint: ${err.constraint})` : "";
              safeSetError(`${name}: ${message}${constraint}`);
              return;
            }
          }
        } else {
          const err = e as any;
          const name = typeof err?.name === "string" ? err.name : "Error";
          const message =
            typeof err?.message === "string" && err.message
              ? err.message
              : "Failed to access microphone";
          const constraint =
            typeof err?.constraint === "string" ? ` (constraint: ${err.constraint})` : "";
          safeSetError(`${name}: ${message}${constraint}`);
          return;
        }
      }

      

      if (startTokenRef.current !== token) {
        // This start attempt was cancelled (e.g. React strict-mode remount).
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      if (initIntervalRef.current) {
        window.clearInterval(initIntervalRef.current);
        initIntervalRef.current = null;
      }

      // Store in both ref and state
      streamRef.current = stream;
      setAudioStream(stream);
      setStatus("ready");

      // Pick a supported mimeType if possible, otherwise let the browser decide.
      const preferredMimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg",
      ];
      const supportedMimeType =
        typeof MediaRecorder !== "undefined" &&
        preferredMimeTypes.find((t) => MediaRecorder.isTypeSupported(t));
      setChosenMimeType(supportedMimeType || null);

      let recorder: MediaRecorder;
      try {
        recorder = supportedMimeType
          ? new MediaRecorder(stream, { mimeType: supportedMimeType })
          : new MediaRecorder(stream);
      } catch (e) {
        const msg =
          typeof (e as any)?.name === "string"
            ? `${(e as any).name}: ${String((e as any).message || "")}`.trim()
            : `MediaRecorder init failed: ${String(e)}`;
        safeSetError(msg);
        // Ensure we release the mic if recorder couldn't start.
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      startTimeRef.current = Date.now();
      setDuration(0);

      const startTimer = () => {
        startTimeRef.current = Date.now();
        setDuration(0);
        setStatus("recording");
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
        }
        durationIntervalRef.current = setInterval(() => {
          setDuration(Date.now() - startTimeRef.current);
        }, 100);
      };

      recorder.onstart = () => {
        startTimer();
      };

      recorder.onerror = (e) => {
        console.error("MediaRecorder error:", e);
        setInitError("MediaRecorder failed to start");
        setStatus("error");
      };

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      try {
        recorder.start(100);
      } catch (e) {
        const msg =
          typeof (e as any)?.name === "string"
            ? `${(e as any).name}: ${String((e as any).message || "")}`.trim()
            : `MediaRecorder start failed: ${String(e)}`;
        safeSetError(msg);
        cleanup();
        return;
      }

      // Fallback: some environments don't fire onstart reliably.
      // If the recorder transitions to "recording", start the timer anyway.
      recorderStartTimeoutRef.current = window.setTimeout(() => {
        const r = mediaRecorderRef.current;
        if (!r) return;
        if (r.state === "recording") {
          startTimer();
          return;
        }
        // If it still didn't start, surface a clear error.
        safeSetError(
          "Audio recorder did not start. Try changing the input device in settings or restarting the app."
        );
      }, 350);

      maxDurationTimeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          handleSend();
        }
      }, MAX_DURATION);
    } catch (error) {
      console.error("Failed to start recording:", error);
      cleanup();
      const msg =
        error instanceof Error ? error.message : "Failed to access microphone";
      // Don't auto-close the recorder UI; show the error and let the user retry/close.
      safeSetError(msg);
    }
  };

  const handleStop = () => {
    cleanup();
    onCancel();
  };

  const handleSend = async () => {
    if (!mediaRecorderRef.current || isTranscribing) return;

    setIsTranscribing(true);

    const mimeType = mediaRecorderRef.current.mimeType;
    const chunks = [...audioChunksRef.current];

    // Cleanup immediately after getting chunks
    cleanup();

    try {
      if (!chunks.length) {
        throw new Error("No audio captured");
      }
      const audioBlob = new Blob(chunks, { type: mimeType });

      const provider = allSttProviders.find(
        (p) => p.id === selectedSttProvider.provider
      );

      const text = await fetchSTT({
        provider,
        selectedProvider: selectedSttProvider,
        audio: audioBlob,
      });

      onTranscriptionComplete(text);
    } catch (error) {
      console.error("Transcription failed:", error);
      const msg =
        error instanceof Error ? error.message : "Transcription failed";
      setInitError(msg);
      setIsTranscribing(false);
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="border bg-background rounded-lg overflow-hidden">
      <div className="h-12 relative bg-muted/20">
        {audioStream ? (
          <div className="h-full w-full pt-3">
            <AudioVisualizer stream={audioStream} isRecording={true} />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            {initError
              ? "Microphone error"
              : status === "waiting_permission"
              ? "Waiting for microphone permission..."
              : "Initializing..."}
          </div>
        )}
      </div>
      {status === "error" && (
        <div className="px-4 pt-2 text-[10px] text-muted-foreground/70 select-none">
          getUserMedia: {canRequestMic ? "yes" : "no"} · MediaRecorder: {hasMediaRecorder ? "yes" : "no"}
          {chosenMimeType ? ` · mime: ${chosenMimeType}` : ""}
        </div>
      )}
      <div className="flex items-center justify-between px-4 py-2.5 border-t bg-muted/5">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-mono tabular-nums font-medium">
            {formatTime(duration)}
          </span>
          <span className="text-xs text-muted-foreground">/ 3:00</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={handleStop}
            disabled={isTranscribing}
            className="h-8 w-8"
            title="Stop recording"
          >
            <StopCircle className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            onClick={handleSend}
            disabled={isTranscribing || Boolean(initError) || !mediaRecorderRef.current}
            className="h-8 w-8"
            title={isTranscribing ? "Sending..." : "Send to AI"}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {status === "error" && (
        <div className="px-4 pb-3 text-xs text-muted-foreground">
          <div className="mt-2">
            {initError || "Unknown microphone error"}
          </div>
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                cleanup();
                startRecording();
              }}
            >
              Retry
            </Button>
            <Button size="sm" onClick={handleStop}>
              Close
            </Button>
          </div>
        </div>
      )}

      {!initError && !audioStream && status === "waiting_permission" && (
        <div className="px-4 pb-3 text-xs text-muted-foreground">
          <div className="mt-2">
            If you don't see a permission prompt, click retry to trigger it again.
          </div>
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                cleanup();
                startRecording();
              }}
            >
              Retry
            </Button>
            <Button size="sm" onClick={handleStop}>
              Close
            </Button>
          </div>
          {initElapsedMs > 0 && (
            <div className="mt-2 opacity-60">({Math.round(initElapsedMs / 100) / 10}s)</div>
          )}
        </div>
      )}
    </div>
  );
};
