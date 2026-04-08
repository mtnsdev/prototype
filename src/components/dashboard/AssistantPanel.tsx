"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import ChatPanel from "@/components/dashboard/ChatPanel";
import { useChatContext } from "@/contexts/ChatContext";

/**
 * macOS-style “Notification Center” surface: assistant slides in from the right.
 */
export default function AssistantPanel() {
  const {
    assistantOpen,
    setAssistantOpen,
    selectedConversationId,
    setSelectedConversationId,
    triggerRefresh,
  } = useChatContext();

  return (
    <Dialog open={assistantOpen} onOpenChange={setAssistantOpen}>
      <DialogContent
        sheetSide="right"
        showCloseButton
        className="w-[min(100vw,28rem)] max-w-none border-border bg-background p-0"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Assistant</DialogTitle>
        <div className="flex h-[100dvh] max-h-[100dvh] min-h-0 flex-1 flex-col overflow-hidden">
          <ChatPanel
            conversationId={selectedConversationId}
            onConversationCreated={(id) => {
              setSelectedConversationId(id);
              triggerRefresh();
            }}
            onBackToHome={() => setSelectedConversationId(null)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
