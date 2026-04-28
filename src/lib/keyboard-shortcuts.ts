/**
 * Returns true when focus is inside a control that should receive the key
 * instead of app-level shortcuts (Space/Enter on recording, etc.).
 */
export function isKeyboardShortcutContextConsumed(): boolean {
  const el = document.activeElement;
  if (!(el instanceof Element)) return false;

  return !!el.closest(
    [
      `input:not([type="button"]):not([type="submit"]):not([type="reset"])`,
      "textarea",
      "select",
      "[contenteditable='true']",
      "[contenteditable='']",
      '[role="textbox"]',
      '[role="combobox"]',
      '[role="listbox"]',
      '[role="menu"]',
      '[role="menuitem"]',
      '[role="option"]',
      '[role="switch"]',
      '[role="slider"]',
      '[role="tab"]',
      "button",
      "a[href]",
    ].join(", ")
  );
}
