import { Header } from "@/components";
import { UseSettingsReturn } from "@/types";
import { Providers } from "./Providers";
import { CustomProviders } from "./CustomProvider";

export const AIProviders = (settings: UseSettingsReturn) => {
  return (
    <div id="ai-providers" className="space-y-2">
      <Header
        title="AI Providers"
        description="Select your preferred AI service provider"
      />
      <div className="rounded-xl border border-border/50 divide-y divide-border/40">
        <div className="px-4 py-4 space-y-4">
          <CustomProviders {...settings} />
        </div>
        <div className="px-4 py-4">
          <Providers {...settings} />
        </div>
      </div>
    </div>
  );
};
