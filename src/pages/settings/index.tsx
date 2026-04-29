import { Theme, AutostartToggle, TransparencySlider } from "./components";
import { PageLayout } from "@/layouts";

const Settings = () => {
  return (
    <PageLayout title="Settings" description="Manage your settings">
      {/* Theme */}
      <Theme />

      {/* Background Transparency */}
      <TransparencySlider />

      {/* Autostart Toggle */}
      <AutostartToggle />

    </PageLayout>
  );
};

export default Settings;
