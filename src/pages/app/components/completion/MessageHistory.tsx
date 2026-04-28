import { useEffect, useRef } from "react";
import { MessageSquareText, ChevronUp, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  ScrollArea,
  Markdown,
  Sources,
} from "@/components";
import { ChatMessage } from "@/types/completion";

interface MessageHistoryProps {
  conversationHistory: ChatMessage[];
  currentConversationId: string | null;
  onStartNewConversation: () => void;
  messageHistoryOpen: boolean;
  setMessageHistoryOpen: (open: boolean) => void;
}

export const MessageHistory = ({
  conversationHistory,
  onStartNewConversation,
  messageHistoryOpen,
  setMessageHistoryOpen,
}: MessageHistoryProps) => {
  const scrollAreaHostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!messageHistoryOpen) return;

    const scrollToBottom = () => {
      const viewport = scrollAreaHostRef.current?.querySelector(
        '[data-slot="scroll-area-viewport"]'
      ) as HTMLElement | null;
      if (!viewport) return;
      viewport.scrollTop = viewport.scrollHeight;
    };

    // Content can grow after initial paint (Markdown, images). Do a few passes
    // to reliably land at the bottom.
    const raf1 = requestAnimationFrame(() => {
      scrollToBottom();
      const raf2 = requestAnimationFrame(() => {
        scrollToBottom();
        const raf3 = requestAnimationFrame(scrollToBottom);
        const timeoutId = window.setTimeout(scrollToBottom, 120);

        return () => {
          cancelAnimationFrame(raf3);
          window.clearTimeout(timeoutId);
        };
      });

      return () => cancelAnimationFrame(raf2);
    });

    return () => cancelAnimationFrame(raf1);
  }, [messageHistoryOpen]);

  return (
    <Popover open={messageHistoryOpen} onOpenChange={setMessageHistoryOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          aria-label="View Current Conversation"
          className="relative cursor-pointer w-12 h-7 px-2 flex gap-1 items-center justify-center"
        >
          <div className="flex items-center justify-center text-xs font-medium">
            {conversationHistory.length}
          </div>
          <MessageSquareText className="h-5 w-5" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        className="select-none w-screen p-0 mt-3 border overflow-hidden border-input/50"
      >
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-col">
              <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Current Conversation
              </h2>
              <p className="text-xs text-muted-foreground">
                {conversationHistory.length} messages in this conversation
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => {
                  onStartNewConversation();
                  setMessageHistoryOpen(false);
                }}
                className="text-xs"
              >
                New Chat
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setMessageHistoryOpen(false)}
                className="text-xs"
              >
                {messageHistoryOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div ref={scrollAreaHostRef}>
          <ScrollArea
            className="h-[calc(100vh-10rem)]"
            viewportClassName="[-webkit-mask-image:linear-gradient(to_bottom,transparent_0,black_28px,black_100%)] [mask-image:linear-gradient(to_bottom,transparent_0,black_28px,black_100%)]"
          >
            <div className="p-4 space-y-2">
              {conversationHistory
                .slice()
                .sort(
                  (a, b) =>
                    (Number(a?.timestamp) || 0) - (Number(b?.timestamp) || 0)
                )
                .map((message) => {
                  const isUser = message.role === "user";
                  const timeLabel = new Date(message.timestamp).toLocaleTimeString(
                    [],
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  );
                  const imagePreview = Array.isArray((message as any).attachedFiles)
                    ? (message as any).attachedFiles.find(
                        (f: any) =>
                          f &&
                          typeof f.type === "string" &&
                          f.type.startsWith("image/") &&
                          typeof f.base64 === "string" &&
                          f.base64.trim().length > 0
                      )
                    : null;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        isUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div className={isUser ? "max-w-[85%]" : "w-full"}>
                        <div
                          className={
                            isUser
                              ? "relative px-5 py-3 rounded-2xl text-sm leading-snug text-white bg-gradient-to-b from-blue-500/90 to-blue-600/65 border border-blue-300/25 shadow-[0_14px_40px_rgba(0,0,0,0.25)] shadow-inner after:content-[''] after:absolute after:inset-0 after:rounded-2xl after:bg-gradient-to-b after:from-white/25 after:to-transparent after:opacity-70 after:pointer-events-none"
                              : "text-sm"
                          }
                        >
                          {isUser && imagePreview && (
                            <div className="mb-2 flex justify-end">
                              <img
                                src={`data:${imagePreview.type};base64,${imagePreview.base64}`}
                                alt={imagePreview.name || "Screenshot"}
                                className="w-28 h-16 rounded-md object-cover border border-white/20"
                              />
                            </div>
                          )}
                          <Markdown>{message.content}</Markdown>
                          {!isUser && <Sources sources={(message as any).sources} />}
                        </div>
                        <div
                          className={`mt-1 text-[10px] leading-none text-muted-foreground/70 select-none ${
                            isUser ? "text-right" : "text-left"
                          }`}
                        >
                          {timeLabel}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
};
