import { Switch } from "@/components";
import { useApp } from "@/contexts";

interface AutostartToggleProps {
  className?: string;
}

export const AutostartToggle = ({ className }: AutostartToggleProps) => {
  const { customizable, toggleAutostart } = useApp();

  const isEnabled = customizable?.autostart?.isEnabled ?? true;

  const handleSwitchChange = async (checked: boolean) => {
    await toggleAutostart(checked);
  };

  return (
    <div id="autostart" className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
        <div className="flex flex-col pr-4">
          <p className="text-sm font-medium">Launch on Startup</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automatically open Freely when your system starts
          </p>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={handleSwitchChange}
          aria-label="Toggle autostart"
        />
      </div>
    </div>
  );
};
