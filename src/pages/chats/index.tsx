import { Badge, Input, Card, Empty, Button } from "@/components";
import { useHistory } from "@/hooks";
import { PageLayout } from "@/layouts";
import { MessageCircleIcon, Search, Trash2, CheckSquare, Square, X } from "lucide-react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Dashboard = () => {
  const conversations = useHistory();
  const navigate = useNavigate();
  const [selectMode, setSelectMode] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  // Group conversations by date
  const groupedConversations = conversations.conversations.reduce(
    (acc, doc) => {
      const dateKey = moment(doc.updatedAt).format("YYYY-MM-DD");
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(doc);
      return acc;
    },
    {} as Record<string, typeof conversations.conversations>
  );

  // Sort dates in descending order (most recent first)
  const sortedDates = Object.keys(groupedConversations).sort((a, b) =>
    moment(b).diff(moment(a))
  );

  const allSelected =
    conversations.conversations.length > 0 &&
    conversations.selectedIds.size === conversations.conversations.length;

  const handleExitSelectMode = () => {
    setSelectMode(false);
    conversations.clearSelection();
  };

  const handleDeleteSelected = async () => {
    await conversations.deleteSelected();
    if (conversations.conversations.length === 0) setSelectMode(false);
  };

  const handleDeleteAll = async () => {
    await conversations.deleteAll();
    setSelectMode(false);
    setConfirmDeleteAll(false);
  };

  return (
    <PageLayout
      title="All conversations"
      description="View all your conversations"
      rightSlot={
        conversations.conversations.length > 0 ? (
          <div className="flex items-center gap-2">
            {selectMode ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 gap-1.5"
                  onClick={allSelected ? conversations.clearSelection : conversations.selectAll}
                >
                  {allSelected ? <Square className="size-3.5" /> : <CheckSquare className="size-3.5" />}
                  {allSelected ? "Deselect all" : "Select all"}
                </Button>
                {conversations.selectedIds.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="text-xs h-7 gap-1.5"
                    onClick={handleDeleteSelected}
                  >
                    <Trash2 className="size-3.5" />
                    Delete ({conversations.selectedIds.size})
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={handleExitSelectMode}
                >
                  <X className="size-3.5" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 gap-1.5"
                  onClick={() => setSelectMode(true)}
                >
                  <CheckSquare className="size-3.5" />
                  Select
                </Button>
                {confirmDeleteAll ? (
                  <>
                    <span className="text-xs text-muted-foreground">Delete all?</span>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="text-xs h-7"
                      onClick={handleDeleteAll}
                    >
                      Confirm
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => setConfirmDeleteAll(false)}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="text-xs h-7 gap-1.5"
                    onClick={() => setConfirmDeleteAll(true)}
                  >
                    <Trash2 className="size-3.5" />
                    Delete all
                  </Button>
                )}
              </>
            )}
          </div>
        ) : undefined
      }
    >
      <>
        {conversations.conversations.length === 0 ? (
          <Empty
            isLoading={conversations.isLoading}
            icon={MessageCircleIcon}
            title="No conversations found"
            description="Start a new conversation to get started"
          />
        ) : (
          <div className="flex flex-col gap-6 pb-8">
            <div className="relative mb-4 w-1/3">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search conversations..."
                className="pl-9 focus-visible:ring-0 focus-visible:ring-offset-0"
                value={conversations.search}
                onChange={(e) => conversations.setSearch(e.target.value)}
              />
            </div>
            {sortedDates
              .filter((dateKey) =>
                conversations?.search?.length === 0
                  ? true
                  : groupedConversations?.[dateKey]?.some((doc) =>
                      doc?.title
                        .toLowerCase()
                        .includes(conversations?.search?.toLowerCase() || "")
                    )
              )
              .map((dateKey) => (
                <div key={dateKey} className="flex flex-col gap-3">
                  <p className="text-xs text-muted-foreground select-none font-medium">
                    {moment(dateKey).format("ddd, MMM D")}
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    {groupedConversations[dateKey]
                      .filter((doc) =>
                        conversations?.search?.length === 0
                          ? true
                          : doc?.title
                              .toLowerCase()
                              .includes(conversations?.search?.toLowerCase() || "")
                      )
                      .map((doc) => {
                        const isSelected = conversations.selectedIds.has(doc.id);
                        return (
                          <Card
                            key={doc.id}
                            className={`shadow-none select-none p-4 gap-0 group relative transition-all cursor-pointer ${
                              isSelected
                                ? "!border-primary/70 !bg-primary/5"
                                : "!bg-black/5 dark:!bg-white/5 hover:!border-primary/50"
                            }`}
                            onClick={() => {
                              if (selectMode) {
                                conversations.toggleSelectId(doc.id);
                              } else {
                                navigate(`/chats/view/${doc.id}`);
                              }
                            }}
                          >
                            <div className="flex items-center justify-between">
                              {selectMode && (
                                <div className="mr-3 shrink-0">
                                  {isSelected ? (
                                    <CheckSquare className="size-4 text-primary" />
                                  ) : (
                                    <Square className="size-4 text-muted-foreground/50" />
                                  )}
                                </div>
                              )}
                              <p className="line-clamp-1 text-sm mr-8 flex-1">
                                {doc.title}
                              </p>
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className="text-xs">
                                  {doc.messages.length} messages
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {moment(doc.updatedAt).format("hh:mm A")}
                                </Badge>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                  </div>
                </div>
              ))}
          </div>
        )}
      </>
    </PageLayout>
  );
};

export default Dashboard;
