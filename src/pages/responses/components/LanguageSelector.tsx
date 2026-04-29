import { Selection } from "@/components";
import { LANGUAGES } from "@/lib";
import { updateLanguage } from "@/lib/storage/response-settings.storage";
import { useState, useEffect, useMemo } from "react";
import { getResponseSettings } from "@/lib";

export const LanguageSelector = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>("english");

  useEffect(() => {
    const settings = getResponseSettings();
    setSelectedLanguage(settings.language);
  }, []);

  const handleLanguageChange = (languageId: string) => {
    setSelectedLanguage(languageId);
    updateLanguage(languageId);
  };

  const languageOptions = useMemo(() => {
    return LANGUAGES.map((lang) => ({
      label: `${lang.flag} ${lang.name}`,
      value: lang.id,
    }));
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
        <div className="flex flex-col pr-4 min-w-0 flex-1">
          <p className="text-sm font-medium">Response Language</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Language for AI responses — applies to all providers and conversations
          </p>
        </div>
        <div className="w-full max-w-[280px] min-w-0">
          <Selection
            selected={selectedLanguage}
            onChange={handleLanguageChange}
            options={languageOptions}
            placeholder="Select a language"
          />
        </div>
      </div>
    </div>
  );
};
