import { Slider } from "@/components";
import { useTheme } from "@/contexts";

export const TransparencySlider = () => {
  const { transparency, onSetTransparency } = useTheme();

  const opacity = Math.round(((100 - transparency) / 100) * 100);

  return (
    <div id="transparency" className="space-y-2">
      <div className="flex flex-col gap-3 rounded-xl border border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col pr-4">
            <p className="text-sm font-medium">Background Transparency</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Adjust the opacity of the main bar background
            </p>
          </div>
          <span className="text-xs tabular-nums text-muted-foreground/60 min-w-[3ch] text-right">
            {opacity}%
          </span>
        </div>
        <Slider
          value={[transparency]}
          onValueChange={([value]) => onSetTransparency(value)}
          min={0}
          max={80}
          step={1}
          aria-label="Background transparency"
        />
      </div>
    </div>
  );
};
