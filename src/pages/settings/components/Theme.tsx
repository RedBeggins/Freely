import { Selection } from "@/components";
import { useTheme } from "@/contexts";

const THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export const Theme = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div id="theme" className="space-y-2">
      <div className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
        <div className="flex flex-col pr-4 min-w-0 flex-1">
          <p className="text-sm font-medium">Theme</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Choose between light, dark, or system-matched appearance
          </p>
        </div>
        <div className="w-full max-w-[280px] min-w-0">
          <Selection
            selected={theme}
            onChange={(value: string) =>
              setTheme(value as "light" | "dark" | "system")
            }
            options={THEME_OPTIONS}
            placeholder="Select theme"
          />
        </div>
      </div>
    </div>
  );
};
