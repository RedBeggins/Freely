import { Settings, Code, MessagesSquare, WandSparkles, AudioLinesIcon, SquareSlashIcon, MonitorIcon, MailIcon, BugIcon } from "lucide-react";

export const useMenuItems = () => {
  const menu = [
    { icon: MessagesSquare, label: "Chats", href: "/chats" },
    { icon: WandSparkles, label: "System Prompts", href: "/system-prompts" },
    { icon: Settings, label: "Responses", href: "/responses" },
    { icon: AudioLinesIcon, label: "Chats Audio", href: "/audio" },
    { icon: SquareSlashIcon, label: "Shortcuts", href: "/shortcuts" },
    { icon: MonitorIcon, label: "Screenshot", href: "/screenshot" },
    { icon: Code, label: "Dev Space", href: "/dev-space" },
  ];

  const footerLinks: { icon: typeof MailIcon; title: string; link: string }[] = [];

  const footerItems = [
    { icon: MailIcon, label: "Contact Support", href: "mailto:jeuelsosalarocca@gmail.com" },
    { icon: BugIcon, label: "Report a bug", href: "mailto:jeuelsosalarocca@gmail.com" },
  ];

  return { menu, footerLinks, footerItems };
};
