import { Loader2, XIcon } from "lucide-react";
import { useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  ScrollArea,
  Input as InputComponent,
  Markdown,
  Switch,
  CopyButton,
} from "@/components";
import { UseCompletionReturn } from "@/types";
import { MessageHistory } from "./MessageHistory";

export const Input = ({
  isPopoverOpen,
  isLoading,
  reset,
  input,
  setInput,
  handleKeyPress,
  handlePaste,
  currentConversationId,
  conversationHistory,
  startNewConversation,
  messageHistoryOpen,
  setMessageHistoryOpen,
  error,
  response,
  cancel,
  scrollAreaRef,
  inputRef,
  isHidden,
  keepEngaged,
  setKeepEngaged,
}: UseCompletionReturn & { isHidden: boolean }) => {
  const sortedConversationHistory = conversationHistory
    .slice()
    .sort(
      (a, b) => (Number(a?.timestamp) || 0) - (Number(b?.timestamp) || 0)
    );

  useEffect(() => {
    if (!isPopoverOpen) return;

    const scrollToBottom = () => {
      const host = scrollAreaRef?.current as unknown as HTMLElement | null;
      const viewport = host?.querySelector(
        '[data-slot="scroll-area-viewport"]'
      ) as HTMLElement | null;
      if (!viewport) return;
      viewport.scrollTop = viewport.scrollHeight;
    };

    // The content inside the popover can grow after initial paint (Markdown, images,
    // conditional history render). Do a few passes to reliably land at the bottom.
    const raf1 = requestAnimationFrame(() => {
      scrollToBottom();
      const raf2 = requestAnimationFrame(() => {
        scrollToBottom();
        const raf3 = requestAnimationFrame(scrollToBottom);
        // One more pass after layout settles.
        const timeoutId = window.setTimeout(scrollToBottom, 120);

        return () => {
          cancelAnimationFrame(raf3);
          window.clearTimeout(timeoutId);
        };
      });

      return () => cancelAnimationFrame(raf2);
    });

    return () => cancelAnimationFrame(raf1);
  }, [
    isPopoverOpen,
    keepEngaged,
    isLoading,
    response,
    conversationHistory.length,
    scrollAreaRef,
  ]);

  return (
    <div className="relative flex-1">
      <Popover
        open={isPopoverOpen}
        onOpenChange={(open) => {
          if (!open && !isLoading && !keepEngaged) {
            reset();
          }
        }}
      >
        <PopoverTrigger asChild className="!border-none !bg-transparent">
          <div className="relative select-none">
            <InputComponent
              ref={inputRef}
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              onPaste={handlePaste}
              disabled={isLoading || isHidden}
              className={`${
                currentConversationId && conversationHistory.length > 0
                  ? "pr-14"
                  : "pr-2"
              }`}
            />

            {/* Conversation thread indicator */}
            {currentConversationId &&
              conversationHistory.length > 0 &&
              !isLoading && (
                <div className="absolute select-none right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <MessageHistory
                    conversationHistory={conversationHistory}
                    currentConversationId={currentConversationId}
                    onStartNewConversation={startNewConversation}
                    messageHistoryOpen={messageHistoryOpen}
                    setMessageHistoryOpen={setMessageHistoryOpen}
                  />
                </div>
              )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </PopoverTrigger>

        {/* Response Panel */}
        <PopoverContent
          align="end"
          side="bottom"
          className="w-screen p-0 border shadow-lg overflow-hidden"
          sideOffset={8}
        >
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
            <div className="flex flex-row gap-1 items-center">
              <h3 className="font-semibold text-xs select-none">
                {keepEngaged ? "Conversation Mode" : "AI Response"}
              </h3>
              <div className="text-[10px] text-muted-foreground/70">
                (Use arrow keys to scroll)
              </div>
            </div>
            <div className="flex items-center gap-2 select-none">
              <div className="flex flex-row items-center gap-2 mr-2">
                <p className="text-[10px]">{`Toggle ${
                  keepEngaged ? "AI response" : "conversation mode"
                }`}</p>
                <span className="text-[10px] text-muted-foreground/60 bg-muted/30 px-1 py-0 rounded border border-input/50">
                  {navigator.platform.toLowerCase().includes("mac")
                    ? "⌘"
                    : "Ctrl"}{" "}
                  + K
                </span>
                <Switch
                  checked={keepEngaged}
                  onCheckedChange={(checked) => {
                    setKeepEngaged(checked);
                    // Focus input after toggle
                    setTimeout(() => {
                      inputRef?.current?.focus();
                    }, 100);
                  }}
                />
              </div>
              <CopyButton content={response} />
              <Button
                variant="frosted"
                size="icon"
                onClick={() => {
                  if (isLoading) {
                    cancel();
                  } else if (keepEngaged) {
                    // When keepEngaged is on, close everything and start new conversation
                    setKeepEngaged(false);
                    startNewConversation();
                  } else {
                    reset();
                  }
                }}
                className="cursor-pointer"
                title={
                  isLoading
                    ? "Cancel loading"
                    : keepEngaged
                    ? "Close and start new conversation"
                    : "Clear conversation"
                }
              >
                <XIcon />
              </Button>
            </div>
          </div>

          <ScrollArea ref={scrollAreaRef} className="h-[calc(100vh-7rem)]">
            <div className="p-4">
              {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                  <strong>Error:</strong> {error}
                </div>
              )}
              {isLoading && (
                <div className="flex items-center gap-2 my-4 text-muted-foreground animate-pulse select-none">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Generating response...</span>
                </div>
              )}
              {/* In conversation mode, the latest assistant turn should appear at the bottom,
                  so we render the streaming response as a chat bubble below the history. */}
              {!keepEngaged && response && <Markdown>{response}</Markdown>}

              {/* Conversation History - Separate scroll, no auto-scroll */}
              {keepEngaged && conversationHistory.length > 1 && (
                <div className="space-y-2 pt-3">
                  {sortedConversationHistory.map((message) => {
                    const isUser = message.role === "user";
                    const timeLabel = new Date(message.timestamp).toLocaleTimeString(
                      [],
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    );
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        <div className={isUser ? "max-w-[85%]" : "w-full"}>
                          <div
                            className={
                              isUser
                                ? "relative px-5 py-3 rounded-2xl text-sm leading-snug text-white bg-gradient-to-b from-blue-500/90 to-blue-600/65 border border-blue-300/25 shadow-[0_14px_40px_rgba(0,0,0,0.25)] shadow-inner after:content-[''] after:absolute after:inset-0 after:rounded-2xl after:bg-gradient-to-b after:from-white/25 after:to-transparent after:opacity-70 after:pointer-events-none"
                                : "text-sm"
                            }
                          >
                            <Markdown>{message.content}</Markdown>
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

                  {/* Streaming/preview assistant response pinned to bottom */}
                  {(isLoading || !sortedConversationHistory.length) &&
                    response?.trim() && (
                      <div className="w-full text-sm">
                        <Markdown>{response}</Markdown>
                        <div className="mt-1 text-[10px] leading-none text-muted-foreground/70 select-none text-left">
                          {new Date().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
};
