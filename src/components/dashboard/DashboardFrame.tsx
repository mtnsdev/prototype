"use client";

import { Suspense, useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import ClaireDock from "@/components/dashboard/ClaireDock";
import CommandPalette from "@/components/dashboard/CommandPalette";
import { ChatProvider } from "@/contexts/ChatContext";
import { UserProvider } from "@/contexts/UserContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { KnowledgeVaultEmailProvider } from "@/contexts/KnowledgeVaultEmailContext";
import { TeamsProvider } from "@/contexts/TeamsContext";
import { KvShareSuggestionsProvider } from "@/contexts/KvShareSuggestionsContext";
import ReportIssueLauncher from "@/components/ui/ReportIssueLauncher";
import { NotificationPanelProvider } from "@/components/dashboard/DashboardNotifications";
import { ProductDirectoryCatalogProvider } from "@/components/products/ProductDirectoryCatalogContext";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function SidebarFallback() {
  return (
    <div
      className="flex h-full w-[56px] shrink-0 flex-col items-center gap-2 border-r border-border bg-background py-3"
      aria-hidden
    />
  );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const sidebarProps = {
    collapsed: sidebarCollapsed,
    onToggle: () => setSidebarCollapsed((v) => !v),
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="h-screen flex">
        <Suspense fallback={<SidebarFallback />}>
          <div className="hidden md:flex h-full shrink-0">
            <Sidebar {...sidebarProps} />
          </div>
        </Suspense>

        <Dialog open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <DialogContent
            id="dashboard-mobile-nav-dialog"
            sheetSide="left"
            className="border-[var(--border-subtle)]"
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              document.getElementById("dashboard-mobile-nav-trigger")?.focus();
            }}
          >
            <DialogTitle className="sr-only">Main navigation</DialogTitle>
            <Sidebar
              {...sidebarProps}
              layout="drawer"
              collapsed={false}
              onRequestClose={() => setMobileNavOpen(false)}
            />
          </DialogContent>
        </Dialog>

        <Button
          id="dashboard-mobile-nav-trigger"
          type="button"
          variant="ghost"
          size="icon"
          className="fixed left-3 top-3 z-[60] h-10 w-10 shrink-0 rounded-lg border border-border bg-background/90 text-muted-foreground shadow-sm backdrop-blur-sm hover:bg-muted hover:text-foreground md:hidden"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open menu"
          aria-expanded={mobileNavOpen}
          aria-controls="dashboard-mobile-nav-dialog"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </Button>

        <main
          id="main-content"
          tabIndex={-1}
          className="flex h-full min-h-0 min-w-0 flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">{children}</div>
        </main>

        <div className="md:hidden">
          <ReportIssueLauncher />
        </div>

        <ClaireDock />
        <CommandPalette />
      </div>
    </div>
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
                    <DashboardContent>{children}</DashboardContent>
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
