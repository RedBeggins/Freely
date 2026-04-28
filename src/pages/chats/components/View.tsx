import {
  Badge,
  Empty,
  Button,
  Markdown,
  Textarea,
  Sources,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components";
import { getConversationById } from "@/lib";
import { ChatConversation } from "@/types";
import {
  Download,
  MessageCircleIcon,
  MessageCircleReplyIcon,
  Trash2,
  SendIcon,
  Check,
  Loader2,
  Plus,
  Paperclip,
  Monitor,
} from "lucide-react";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import moment from "moment";
import { useParams, useNavigate } from "react-router-dom";
import { PageLayout } from "@/layouts";
import { useHistory, useChatCompletion } from "@/hooks";
import { useApp } from "@/contexts";
import {
  DeleteConfirmationDialog,
  ChatAudio,
  AudioRecorder,
} from ".";

const View = () => {
  const { conversationId } = useParams();
  const { supportsImages } = useApp();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatConversation | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const TEXTAREA_BASE_PX = 44; // matches h-11
  const TEXTAREA_MAX_PX = 224; // matches max-h-56

  const {
    handleDeleteConfirm,
    confirmDelete,
    cancelDelete,
    deleteConfirm,
    handleAttachToOverlay,
    handleDownload,
    isDownloaded,
    isAttached,
  } = useHistory();

  const completion = useChatCompletion(
    conversationId as string,
    messages,
    setMessages
  );

  useEffect(() => {
    const getMessages = async () => {
      const conversation = await getConversationById(conversationId as string);
      setMessages(conversation || null);
    };
    getMessages();
  }, [conversationId]);

  useEffect(() => {
    // Scroll to bottom when messages load
    if (messages?.messages.length) {
      setTimeout(() => {
        completion.messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
        });
      }, 100);
    }
  }, [messages?.messages.length]);

  useLayoutEffect(() => {
    const el = completion.inputRef.current as unknown as HTMLTextAreaElement | null;
    if (!el) return;

    // Reset first so scrollHeight reflects current content.
    el.style.height = "auto";
    const next = completion.input.trim().length === 0
      ? TEXTAREA_BASE_PX
      : Math.min(el.scrollHeight, TEXTAREA_MAX_PX);
    el.style.height = `${next}px`;
  }, [completion.input]);

  const handleDelete = async () => {
    await confirmDelete();
    navigate(-1);
  };

  return (
    <PageLayout
      isMainTitle={false}
      allowBackButton={true}
      title={messages?.title || ""}
      description={`${messages?.messages.length} messages in this conversation`}
      rightSlot={
        <div className="flex flex-row items-center gap-2">
          <Button
            variant="outline"
            title="Open this conversation in overlay"
            className="text-[10px] lg:text-sm h-6 lg:h-8"
            onClick={() =>
              conversationId && handleAttachToOverlay(conversationId)
            }
            disabled={isAttached}
          >
            {isAttached ? (
              <>
                <Check className="size-3 lg:size-4 text-green-600" />
                Attached
              </>
            ) : (
              <>
                Open in Overlay{" "}
                <MessageCircleReplyIcon className="size-3 lg:size-4" />
              </>
            )}
          </Button>
          <Button
            variant={"outline"}
            title="Download conversation as markdown"
            className="text-[10px] lg:text-sm h-6 lg:h-8"
            onClick={(e) => handleDownload(messages, e)}
            disabled={isDownloaded}
          >
            {isDownloaded ? (
              <>
                <Check className="size-3 lg:size-4 text-green-600" />
                Downloaded
              </>
            ) : (
              <>
                Download <Download className="size-3 lg:size-4" />
              </>
            )}
          </Button>
          <Button
            variant="destructive"
            title="Delete conversation"
            onClick={() =>
              conversationId && handleDeleteConfirm(conversationId)
            }
            className="text-[10px] lg:text-sm h-6 lg:h-8"
          >
            Delete <Trash2 className="size-3 lg:size-4" />
          </Button>
        </div>
      }
    >
      {messages?.messages.length === 0 ? (
        <Empty
          isLoading={false}
          icon={MessageCircleIcon}
          title="No messages found"
          description="Start a new message to get started"
        />
      ) : (
        <div className="flex flex-col gap-3 pb-8 lg:pb-10 space-y-1 w-full max-w-3xl mx-auto">
          {messages?.messages.map((message, index, array) => {
            const isUser = message.role === "user";
            const showDate =
              index === 0 ||
              moment(message.timestamp).format("YYYY-MM-DD") !==
              moment(array[index - 1]?.timestamp).format("YYYY-MM-DD");
            const timeLabel = moment(message.timestamp).format("hh:mm A");
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
              <div key={message.id}>
                {showDate && (
                  <Badge
                    variant="outline"
                    className="flex items-center justify-center my-4 w-fit mx-auto"
                  >
                    {moment(message.timestamp).format("ddd, MMM D")}
                  </Badge>
                )}

                <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div className={isUser ? "max-w-[85%]" : "w-full"}>
                    <div
                      className={
                        isUser
                          ? "relative px-5 py-3 rounded-2xl text-sm leading-snug text-white bg-gradient-to-b from-blue-500/90 to-blue-600/65 border border-blue-300/25 shadow-[0_14px_40px_rgba(0,0,0,0.25)] after:content-[''] after:absolute after:inset-0 after:rounded-2xl after:bg-gradient-to-b after:from-white/25 after:to-transparent after:opacity-70 after:pointer-events-none"
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
                      <div className="chat-markdown">
                        <Markdown>{message.content}</Markdown>
                      </div>
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
              </div>
            );
          })}
          <div ref={completion.messagesEndRef} />
        </div>
      )}

      {/* Sticky Footer — anchors to ScrollArea's relative root */}
      <div className="absolute bottom-0 left-0 right-0 bg-transparent">
        <div className="w-full max-w-3xl mx-auto">
          {completion.error && (
            <div className="px-4 pt-3 pb-0">
              <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                <strong>Error:</strong> {completion.error}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1 px-3 pb-3 pt-2">
            {completion.isRecording ? (
              <AudioRecorder
                onTranscriptionComplete={(text) => {
                  completion.setIsRecording(false);
                  completion.submit(text);
                }}
                onCancel={() => completion.setIsRecording(false)}
              />
            ) : (
              <>
                <div className="flex items-center gap-2 rounded-3xl border bg-background/60 backdrop-blur px-2 py-2 shadow-sm">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="relative shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-9 rounded-full bg-transparent hover:bg-muted/40"
                          title="Add"
                          disabled={completion.isLoading}
                        >
                          <Plus className="size-4" />
                        </Button>
                        {completion.attachedFiles.length > 0 && (
                          <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-medium">
                            {completion.attachedFiles.length}
                          </div>
                        )}
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      side="top"
                      sideOffset={8}
                      className="min-w-56"
                    >
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          fileInputRef.current?.click();
                        }}
                        disabled={!supportsImages || completion.isLoading}
                      >
                        <Paperclip className="size-4" />
                        Attach image
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={async (e) => {
                          e.preventDefault();
                          await completion.captureScreenshot();
                        }}
                        disabled={
                          !supportsImages ||
                          completion.isLoading ||
                          completion.isScreenshotLoading
                        }
                      >
                        <Monitor className="size-4" />
                        Capture screenshot
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Textarea
                    ref={completion.inputRef}
                    placeholder="Type a message..."
                    className="flex-1 resize-none border-0 bg-transparent rounded-[inherit] focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-4 min-h-11 max-h-56 py-3 leading-5 overflow-y-auto"
                    rows={1}
                    value={completion.input}
                    onChange={(e) => completion.setInput(e.target.value)}
                    onKeyDown={completion.handleKeyPress}
                    onPaste={completion.handlePaste}
                    disabled={completion.isLoading}
                  />

                  <div className="flex items-center gap-1 shrink-0">
                    <ChatAudio
                      micOpen={completion.micOpen}
                      setMicOpen={completion.setMicOpen}
                      isRecording={completion.isRecording}
                      setIsRecording={completion.setIsRecording}
                    />
                    <Button
                      size="icon"
                      className="size-9 rounded-full shrink-0"
                      title="Send message"
                      onClick={() => completion.submit()}
                      disabled={completion.isLoading || !completion.input.trim()}
                    >
                      {completion.isLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <SendIcon className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={completion.handleFileSelect}
                  className="hidden"
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        deleteConfirm={deleteConfirm}
        cancelDelete={cancelDelete}
        confirmDelete={handleDelete}
      />
    </PageLayout>
  );
};

export default View;
