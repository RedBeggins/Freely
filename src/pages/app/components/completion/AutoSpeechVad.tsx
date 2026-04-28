import { fetchSTT } from "@/lib";
import { UseCompletionReturn } from "@/types";
import { LoaderCircleIcon, MicIcon, AlertCircleIcon } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components";
import { useApp } from "@/contexts";

interface AutoSpeechVADProps {
  submit: UseCompletionReturn["submit"];
  setState: UseCompletionReturn["setState"];
  setEnableVAD: UseCompletionReturn["setEnableVAD"];
  microphoneDeviceName?: string;
  microphoneDeviceId?: string;
}

const SILENCE_THRESHOLD = 0.008;
const SILENCE_DURATION_MS = 1500;
const MIN_SPEECH_DURATION_MS = 400;
const VAD_FALLBACK_TIMEOUT_MS = 2000;
const TIMER_DURATION_MS = 8000;

async function resolveWebDeviceId(
  nativeName?: string,
  nativeId?: string
): Promise<string | undefined> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();

    if (nativeName) {
      const match = devices.find(
        (d) =>
          d.kind === "audioinput" &&
          d.label.toLowerCase().includes(nativeName.toLowerCase())
      );
      if (match?.deviceId) return match.deviceId;
    }

    if (nativeId && nativeId !== "default") {
      const idMatch = devices.find(
        (d) => d.kind === "audioinput" && d.deviceId === nativeId
      );
      if (idMatch?.deviceId) return idMatch.deviceId;
    }
  } catch {
    // enumerateDevices may fail before permission
  }

  return nativeId && nativeId !== "default" ? nativeId : undefined;
}

export const AutoSpeechVAD = ({
  submit,
  setState,
  setEnableVAD,
  microphoneDeviceName,
  microphoneDeviceId,
}: AutoSpeechVADProps) => {
  const [status, setStatus] = useState<
    "loading" | "listening" | "speaking" | "transcribing" | "error" | "timer"
  >("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { selectedSttProvider, allSttProviders } = useApp();

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const rafRef = useRef<number | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const speechStartRef = useRef<number | null>(null);
  const hasSpeechRef = useRef(false);
  const mountedRef = useRef(true);
  const timerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modeRef = useRef<"vad" | "timer">("vad");

  const cleanup = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (timerTimeoutRef.current) {
      clearTimeout(timerTimeoutRef.current);
      timerTimeoutRef.current = null;
    }
    if (mediaRecorderRef.current?.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    mediaRecorderRef.current = null;
    if (audioContextRef.current?.state !== "closed") {
      try {
        audioContextRef.current?.close();
      } catch {}
    }
    audioContextRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        t.stop();
        t.enabled = false;
      });
      streamRef.current = null;
    }
  }, []);

  const handleSend = useCallback(
    async (chunks: Blob[], mimeType: string) => {
      if (!mountedRef.current) return;
      setStatus("transcribing");

      try {
        if (!chunks.length) throw new Error("No audio captured");
        const audioBlob = new Blob(chunks, { type: mimeType });

        if (!selectedSttProvider.provider) {
          setState((prev: any) => ({
            ...prev,
            error: "No speech provider selected.",
          }));
          return;
        }

        const providerConfig = allSttProviders.find(
          (p) => p.id === selectedSttProvider.provider
        );
        if (!providerConfig) {
          setState((prev: any) => ({
            ...prev,
            error: "Speech provider config not found.",
          }));
          return;
        }

        const transcription = await fetchSTT({
          provider: providerConfig,
          selectedProvider: selectedSttProvider,
          audio: audioBlob,
        });

        if (transcription && mountedRef.current) {
          submit(transcription);
        }
      } catch (error) {
        console.error("Transcription failed:", error);
        if (mountedRef.current) {
          setState((prev: any) => ({
            ...prev,
            error:
              error instanceof Error ? error.message : "Transcription failed",
          }));
        }
      } finally {
        if (mountedRef.current) {
          setEnableVAD(false);
        }
      }
    },
    [selectedSttProvider, allSttProviders, submit, setState, setEnableVAD]
  );

  const startTimerMode = useCallback(
    (recorder: MediaRecorder) => {
      modeRef.current = "timer";
      setStatus("timer");

      timerTimeoutRef.current = setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
        }
        streamRef.current?.getTracks().forEach((t) => t.stop());
      }, TIMER_DURATION_MS);
    },
    []
  );

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    const startListening = async () => {
      try {
        setState((prev: any) => ({
          ...prev,
          error: null,
          response: "",
        }));

        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("getUserMedia not available in this webview");
        }

        const webDeviceId = await resolveWebDeviceId(microphoneDeviceName, microphoneDeviceId);
        if (cancelled) return;

        const audioBase: MediaTrackConstraints = {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        };

        let stream: MediaStream;
        try {
          if (webDeviceId) {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: { ...audioBase, deviceId: { exact: webDeviceId } },
            });
          } else {
            stream = await navigator.mediaDevices.getUserMedia({ audio: audioBase });
          }
        } catch {
          try {
            if (webDeviceId) {
              stream = await navigator.mediaDevices.getUserMedia({
                audio: { ...audioBase, deviceId: { ideal: webDeviceId } },
              });
            } else {
              stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            }
          } catch {
            try {
              stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch (micErr: any) {
              throw new Error(
                `Mic access denied: ${micErr?.name || ""} ${micErr?.message || micErr}`
              );
            }
          }
        }
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const track = stream.getAudioTracks()[0];
        if (!track || track.muted || !track.enabled) {
          throw new Error(
            `Audio track issue: exists=${!!track}, muted=${track?.muted}, enabled=${track?.enabled}`
          );
        }

        const preferredMimeTypes = [
          "audio/webm;codecs=opus",
          "audio/webm",
          "audio/ogg;codecs=opus",
        ];
        const supportedMimeType = preferredMimeTypes.find((t) =>
          MediaRecorder.isTypeSupported(t)
        );

        const recorder = supportedMimeType
          ? new MediaRecorder(stream, { mimeType: supportedMimeType })
          : new MediaRecorder(stream);

        mediaRecorderRef.current = recorder;
        chunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          if (chunksRef.current.length > 0) {
            handleSend([...chunksRef.current], recorder.mimeType);
          }
        };

        recorder.start(100);
        if (cancelled) return;

        // Try AudioContext-based VAD
        let vadWorking = false;
        try {
          const audioContext = new AudioContext();
          if (audioContext.state === "suspended") {
            await audioContext.resume();
          }
          audioContextRef.current = audioContext;

          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 2048;
          analyser.smoothingTimeConstant = 0;
          source.connect(analyser);

          // Force the processing pipeline by connecting to destination via silent gain
          const gainNode = audioContext.createGain();
          gainNode.gain.value = 0;
          analyser.connect(gainNode);
          gainNode.connect(audioContext.destination);

          if (cancelled) return;

          setStatus("listening");
          silenceStartRef.current = null;
          speechStartRef.current = null;
          hasSpeechRef.current = false;

          const dataArray = new Float32Array(analyser.fftSize);
          let peakSeen = 0;
          let frameCount = 0;
          const vadCheckFrame = Math.ceil(
            VAD_FALLBACK_TIMEOUT_MS / (1000 / 60)
          );

          const monitor = () => {
            if (cancelled || !mountedRef.current) return;

            analyser.getFloatTimeDomainData(dataArray);
            let maxAmplitude = 0;
            for (let i = 0; i < dataArray.length; i++) {
              const val = Math.abs(dataArray[i]);
              if (val > maxAmplitude) maxAmplitude = val;
            }

            if (maxAmplitude > peakSeen) peakSeen = maxAmplitude;
            frameCount++;

            // After VAD_FALLBACK_TIMEOUT_MS, if we've never seen any signal, switch to timer mode
            if (frameCount === vadCheckFrame && peakSeen < 0.0001) {
              console.warn(
                "AudioContext VAD not receiving data, switching to timer mode"
              );
              if (audioContextRef.current?.state !== "closed") {
                try {
                  audioContextRef.current?.close();
                } catch {}
              }
              audioContextRef.current = null;
              startTimerMode(recorder);
              return;
            }

            const now = Date.now();
            const isSpeaking = maxAmplitude > SILENCE_THRESHOLD;

            if (isSpeaking) {
              silenceStartRef.current = null;

              if (!hasSpeechRef.current) {
                hasSpeechRef.current = true;
                speechStartRef.current = now;
                setStatus("speaking");
              }
            } else if (hasSpeechRef.current) {
              if (!silenceStartRef.current) {
                silenceStartRef.current = now;
              }

              const speechDuration = speechStartRef.current
                ? now - speechStartRef.current
                : 0;
              const silenceDuration = now - silenceStartRef.current;

              if (
                silenceDuration >= SILENCE_DURATION_MS &&
                speechDuration >= MIN_SPEECH_DURATION_MS
              ) {
                if (recorder.state === "recording") {
                  recorder.stop();
                }
                streamRef.current?.getTracks().forEach((t) => t.stop());
                return;
              }
            }

            rafRef.current = requestAnimationFrame(monitor);
          };

          rafRef.current = requestAnimationFrame(monitor);
          vadWorking = true;
        } catch (audioCtxErr) {
          console.warn("AudioContext VAD failed, using timer mode:", audioCtxErr);
        }

        if (!vadWorking && !cancelled) {
          startTimerMode(recorder);
        }
      } catch (error) {
        if (cancelled) return;
        const msg =
          error instanceof Error ? error.message : "Mic access failed";
        console.error("Failed to start mic:", msg);
        setStatus("error");
        setErrorMsg(msg);
        setState((prev: any) => ({
          ...prev,
          error: `Microphone error: ${msg}`,
        }));
      }
    };

    startListening();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      cleanup();
    };
  }, [microphoneDeviceName, microphoneDeviceId, cleanup, handleSend, startTimerMode]);

  const handleClick = () => {
    if (modeRef.current === "timer" && mediaRecorderRef.current?.state === "recording") {
      if (timerTimeoutRef.current) {
        clearTimeout(timerTimeoutRef.current);
        timerTimeoutRef.current = null;
      }
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      return;
    }

    cleanup();
    setState((prev: any) => ({ ...prev, response: "", error: null }));
    setEnableVAD(false);
  };

  return (
    <Button
      size="icon"
      onClick={handleClick}
      className="cursor-pointer"
      title={
        status === "error"
          ? `Error: ${errorMsg}`
          : status === "loading"
            ? "Starting microphone..."
            : status === "transcribing"
              ? "Transcribing..."
              : status === "timer"
                ? "Recording... click to send now"
                : status === "speaking"
                  ? "Speaking detected... will auto-send on pause"
                  : "Listening... speak now (click to cancel)"
      }
    >
      {status === "error" ? (
        <AlertCircleIcon className="h-4 w-4 text-destructive" />
      ) : status === "transcribing" ? (
        <LoaderCircleIcon className="h-4 w-4 animate-spin text-green-500" />
      ) : status === "loading" ? (
        <LoaderCircleIcon className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : status === "timer" ? (
        <MicIcon className="h-4 w-4 text-red-500 animate-pulse" />
      ) : status === "speaking" ? (
        <MicIcon className="h-4 w-4 text-red-500 animate-pulse" />
      ) : (
        <MicIcon className="h-4 w-4 animate-pulse text-red-500" />
      )}
    </Button>
  );
};
