import { Header, ScrollArea } from "@/components";

export const PageLayout = ({
  children,
  title,
  description,
  rightSlot,
  allowBackButton = false,
  isMainTitle = true,
  disableScrollArea = false,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
  rightSlot?: React.ReactNode;
  allowBackButton?: boolean;
  isMainTitle?: boolean;
  disableScrollArea?: boolean;
}) => {
  return (
    <div className="flex flex-1 flex-col min-h-0">
      <header className="py-2 px-6 shrink-0">
        <Header
          isMainTitle={isMainTitle}
          showBorder={true}
          title={title}
          description={description}
          rightSlot={rightSlot}
          allowBackButton={allowBackButton}
        />
      </header>

      {disableScrollArea ? (
        <div className="flex-1 min-h-0 px-6">
          <div className="flex flex-col gap-6 pb-12 pt-4 px-1 h-full min-h-0">
            {children}
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1 min-h-0 px-6">
          <div className="flex flex-col gap-6 pb-12 pt-4 px-1 min-h-full">
            {children}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
