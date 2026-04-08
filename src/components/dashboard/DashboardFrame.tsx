"use client";

import { ChatProvider, useChatContext } from "@/contexts/ChatContext";
import { UserProvider } from "@/contexts/UserContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { KnowledgeVaultEmailProvider } from "@/contexts/KnowledgeVaultEmailContext";
import { TeamsProvider } from "@/contexts/TeamsContext";
import { KvShareSuggestionsProvider } from "@/contexts/KvShareSuggestionsContext";
import ReportIssueLauncher from "@/components/ui/ReportIssueLauncher";
import { NotificationPanelProvider } from "@/components/dashboard/DashboardNotifications";
import { ProductDirectoryCatalogProvider } from "@/components/products/ProductDirectoryCatalogContext";
import { GlobalSearchProvider } from "@/contexts/GlobalSearchContext";
import { DashboardShellProvider } from "@/contexts/DashboardShellContext";
import DashboardShellChrome from "@/components/dashboard/DashboardShellChrome";
import GlobalCommandPalette from "@/components/dashboard/GlobalCommandPalette";
import AssistantPanel from "@/components/dashboard/AssistantPanel";
import WorkspaceDock from "@/components/dashboard/WorkspaceDock";
import MobileWorkspaceNav from "@/components/dashboard/MobileWorkspaceNav";
import HistoryDrawer from "@/components/dashboard/HistoryDrawer";

function DashboardChrome({ children }: { children: React.ReactNode }) {
  const {
    isHistoryOpen,
    closeHistory,
    setSelectedConversationId,
    selectedConversationId,
  } = useChatContext();

  return (
    <>
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={closeHistory}
        onSelectConversation={(id) => {
          setSelectedConversationId(id);
          closeHistory();
        }}
        selectedConversationId={selectedConversationId}
      />
      <AssistantPanel />
      <div className="min-h-screen bg-background text-foreground">
        <MobileWorkspaceNav />
        <div className="flex h-screen flex-col">
          <main
            id="main-content"
            tabIndex={-1}
            className="flex min-h-0 min-w-0 flex-1 flex-col pb-[5.5rem] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:pb-[5.25rem]"
          >
            <DashboardShellChrome />
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
            <GlobalCommandPalette />
          </main>
          <WorkspaceDock />
        </div>
        <div className="md:hidden">
          <ReportIssueLauncher />
        </div>
      </div>
    </>
  );
}

export default function DashboardFrame({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <ProductDirectoryCatalogProvider>
        <TeamsProvider>
          <KvShareSuggestionsProvider>
            <KnowledgeVaultEmailProvider>
              <ChatProvider>
                <ToastProvider>
                  <NotificationPanelProvider>
                    <GlobalSearchProvider>
                      <DashboardShellProvider>
                        <DashboardChrome>{children}</DashboardChrome>
                      </DashboardShellProvider>
                    </GlobalSearchProvider>
                  </NotificationPanelProvider>
                </ToastProvider>
              </ChatProvider>
            </KnowledgeVaultEmailProvider>
          </KvShareSuggestionsProvider>
        </TeamsProvider>
      </ProductDirectoryCatalogProvider>
    </UserProvider>
  );
}
