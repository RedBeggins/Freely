import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

const BASE_HEIGHT = 44;
const EXPANDED_HEIGHT = 600;

export const useDynamicWindowSize = (inputOpen: boolean) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const hasInitialResize = useRef(false);

  useEffect(() => {
    if (!contentRef.current) return;

    const resizeWindow = async () => {
      try {
        const tauriWindow = getCurrentWebviewWindow();
        const element = contentRef.current;
        
        if (!element) return;

        // Medir el ancho del contenido
        const rect = element.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(element);
        const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
        const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
        const marginLeft = parseFloat(computedStyle.marginLeft) || 0;
        const marginRight = parseFloat(computedStyle.marginRight) || 0;
        
        const contentWidth = rect.width + paddingLeft + paddingRight + marginLeft + marginRight;
        const finalWidth = Math.ceil(contentWidth + 32); // +32px de padding extra
        
        // Si input está abierto, usar altura expandida, sino altura base
        const finalHeight = inputOpen ? EXPANDED_HEIGHT : BASE_HEIGHT;
        
        await invoke("set_window_size", {
          window: tauriWindow,
          width: finalWidth,
          height: finalHeight,
        });
        
      } catch (error) {
        console.error("Failed to resize window:", error);
      }
    };

    // Resize inicial solo una vez
    if (!hasInitialResize.current) {
      resizeWindow();
      hasInitialResize.current = true;
    }

    // Resize cuando cambia inputOpen (con pequeño delay para que el DOM se actualice)
    const timeoutId = setTimeout(() => {
      resizeWindow();
    }, 50);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [inputOpen]); // Se ejecuta cuando cambia inputOpen

  return { contentRef };
};
