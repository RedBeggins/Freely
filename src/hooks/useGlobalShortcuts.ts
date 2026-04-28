import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { useCallback, useEffect, useRef } from "react";
import { getShortcutsConfig } from "@/lib";

// Global singleton to prevent multiple event listeners in StrictMode
let globalEventListeners: {
  focus?: UnlistenFn;
  audio?: UnlistenFn;
  screenshot?: UnlistenFn;
  systemAudio?: UnlistenFn;
  customShortcut?: UnlistenFn;
  registrationError?: UnlistenFn;
} = {};

// Global debounce for screenshot events to prevent duplicates
let lastScreenshotEventTime = 0;

// Ref-count: useGlobalShortcuts() is used from multiple hooks; only one IPC
// listener set should exist (avoids StrictMode / multi-mount teardown races).
let globalIpcListenerRefCount = 0;

function teardownGlobalIpcListeners(): void {
  const keys = [
    "focus",
    "audio",
    "screenshot",
    "systemAudio",
    "customShortcut",
    "registrationError",
  ] as const satisfies readonly (keyof typeof globalEventListeners)[];

  for (const key of keys) {
    const fn = globalEventListeners[key];
    if (fn) {
      try {
        fn();
      } catch (error) {
        console.warn(`Error cleaning up ${key} listener:`, error);
      }
      delete globalEventListeners[key];
    }
  }
}

async function setupGlobalIpcListenersOnce(): Promise<void> {
  teardownGlobalIpcListeners();

  const unlistenFocus = await listen("focus-text-input", () => {
    setTimeout(() => {
      if (globalInputRef) {
        globalInputRef.focus();
      }
    }, 100);
  });
  globalEventListeners.focus = unlistenFocus;

  const unlistenAudio = await listen("start-audio-recording", () => {
    if (globalAudioCallback) {
      globalAudioCallback();
    }
  });
  globalEventListeners.audio = unlistenAudio;

  const unlistenScreenshot = await listen("trigger-screenshot", () => {
    const now = Date.now();
    const timeSinceLastEvent = now - lastScreenshotEventTime;

    if (timeSinceLastEvent < 300) {
      return;
    }

    lastScreenshotEventTime = now;

    if (globalScreenshotCallback) {
      try {
        Promise.resolve(globalScreenshotCallback())
          .catch((error) => {
            console.error("Screenshot shortcut callback failed:", error);
          })
          .then(() => {
            // no-op
          });
      } catch (error) {
        console.error("Failed to run screenshot shortcut callback:", error);
      }
    } else {
      console.warn("Screenshot shortcut triggered but no callback registered.");
    }
  });
  globalEventListeners.screenshot = unlistenScreenshot;

  const unlistenSystemAudio = await listen("toggle-system-audio", () => {
    if (globalSystemAudioCallback) {
      globalSystemAudioCallback();
    }
  });
  globalEventListeners.systemAudio = unlistenSystemAudio;

  const unlistenCustomShortcut = await listen<{ action: string }>(
    "custom-shortcut-triggered",
    (event) => {
      const actionId = event.payload.action;
      const callback = globalCustomShortcutCallbacks.get(actionId);
      if (callback) {
        callback();
      } else {
        console.warn(`No callback registered for custom shortcut: ${actionId}`);
      }
    }
  );
  globalEventListeners.customShortcut = unlistenCustomShortcut;

  const unlistenRegistrationError = await listen<
    Array<[string, string, string]>
  >("shortcut-registration-error", (event) => {
    window.dispatchEvent(
      new CustomEvent("shortcutRegistrationError", {
        detail: event.payload,
      })
    );
  });
  globalEventListeners.registrationError = unlistenRegistrationError;
}

// Global callback refs
let globalInputRef: HTMLInputElement | null = null;
let globalAudioCallback: (() => void) | null = null;
let globalScreenshotCallback: (() => void | Promise<void>) | null = null;
let globalSystemAudioCallback: (() => void) | null = null;
let globalCustomShortcutCallbacks: Map<string, () => void> = new Map();

export const useGlobalShortcuts = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const audioCallbackRef = useRef<(() => void) | null>(null);
  const screenshotCallbackRef = useRef<(() => void) | null>(null);
  const systemAudioCallbackRef = useRef<(() => void) | null>(null);
  const customShortcutCallbacksRef = useRef<Map<string, () => void>>(new Map());

  const checkShortcutsRegistered = useCallback(async (): Promise<boolean> => {
    try {
      const registered = await invoke<boolean>("check_shortcuts_registered");
      return registered;
    } catch (error) {
      console.error("Failed to check shortcuts:", error);
      return false;
    }
  }, []);

  const getShortcuts = useCallback(async (): Promise<Record<
    string,
    string
  > | null> => {
    try {
      const shortcuts = await invoke<Record<string, string>>(
        "get_registered_shortcuts"
      );
      return shortcuts;
    } catch (error) {
      console.error("Failed to get shortcuts:", error);
      return null;
    }
  }, []);

  const updateShortcuts = useCallback(async (): Promise<boolean> => {
    try {
      const config = getShortcutsConfig();
      await invoke("update_shortcuts", { config });
      return true;
    } catch (error) {
      console.error("Failed to update shortcuts:", error);
      return false;
    }
  }, []);

  // Register input element for auto-focus
  const registerInputRef = useCallback((input: HTMLInputElement | null) => {
    inputRef.current = input;
    globalInputRef = input;
  }, []);

  // Register audio callback
  const registerAudioCallback = useCallback((callback: () => void) => {
    audioCallbackRef.current = callback;
    globalAudioCallback = callback;
  }, []);

  // Register screenshot callback
  const registerScreenshotCallback = useCallback(
    (callback: () => void | Promise<void>) => {
      screenshotCallbackRef.current = callback;
      globalScreenshotCallback = callback;
    },
    []
  );

  // Register system audio callback
  const registerSystemAudioCallback = useCallback((callback: () => void) => {
    systemAudioCallbackRef.current = callback;
    globalSystemAudioCallback = callback;
  }, []);

  // Register custom shortcut callback
  const registerCustomShortcutCallback = useCallback(
    (actionId: string, callback: () => void) => {
      customShortcutCallbacksRef.current.set(actionId, callback);
      globalCustomShortcutCallbacks.set(actionId, callback);
    },
    []
  );

  // Unregister custom shortcut callback
  const unregisterCustomShortcutCallback = useCallback((actionId: string) => {
    customShortcutCallbacksRef.current.delete(actionId);
    globalCustomShortcutCallbacks.delete(actionId);
  }, []);

  // Setup Tauri IPC listeners once across all useGlobalShortcuts() consumers.
  useEffect(() => {
    globalIpcListenerRefCount += 1;
    if (globalIpcListenerRefCount === 1) {
      void setupGlobalIpcListenersOnce().catch((error) => {
        console.error("Failed to setup global shortcut IPC listeners:", error);
      });
    }

    return () => {
      globalIpcListenerRefCount -= 1;
      if (globalIpcListenerRefCount === 0) {
        teardownGlobalIpcListeners();
      }
    };
  }, []);

  return {
    checkShortcutsRegistered,
    getShortcuts,
    updateShortcuts,
    registerInputRef,
    registerAudioCallback,
    registerScreenshotCallback,
    registerSystemAudioCallback,
    registerCustomShortcutCallback,
    unregisterCustomShortcutCallback,
  };
};
