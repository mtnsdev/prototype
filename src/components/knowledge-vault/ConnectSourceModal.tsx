"use client";

import { Cloud, Database, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataSourceType, type DataSource } from "@/types/knowledge-vault";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/utils";

type RowDef = {
  type: DataSourceType;
  name: string;
  description: string;
  comingSoon?: boolean;
};

const ROWS: RowDef[] = [
  {
    type: DataSourceType.GoogleDriveAdmin,
    name: "Google Drive — Shared",
    description:
      "Connect your agency's shared Google Drive. All advisors will see synced documents.",
  },
  {
    type: DataSourceType.GoogleDrivePersonal,
    name: "Google Drive — Personal",
    description: "Connect your personal Google Drive. Only you will see these documents.",
  },
  {
    type: DataSourceType.ClaromentisDocuments,
    name: "Claromentis — Documents",
    description:
      "Sync files from your Claromentis document library. Respects Claromentis permission groups.",
  },
  {
    type: DataSourceType.ClaromentisPages,
    name: "Claromentis — Pages",
    description:
      "Sync wiki pages from your Claromentis intranet. Respects Claromentis permission groups.",
  },
  {
    type: DataSourceType.Email,
    name: "Email forwarding",
    description:
      "Forward emails to your agency ingest address. Body and attachments appear in the Knowledge Vault as advisor-private by default.",
    comingSoon: false,
  },
];

type Props = {
  open: boolean;
  onClose: () => void;
  sources: DataSource[];
};

export default function ConnectSourceModal({ open, onClose, sources }: Props) {
  const toast = useToast();

  const connectedTypes = new Set(
    sources.filter((s) => s.status === "connected").map((s) => s.source_type)
  );

  const handleConnect = () => {
    toast("Coming soon — contact your admin.");
  };

  if (!open) return null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#1a1a1a] border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#F5F5F5]">Connect a source</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[rgba(245,245,245,0.6)]">
          Choose a data source to connect to your Knowledge Vault. Documents will be synced and indexed
          for search.
        </p>
        <div className="grid gap-3 mt-4">
          {ROWS.map((row) => {
            const isConnected = !row.comingSoon && connectedTypes.has(row.type);
            const Icon =
              row.type === DataSourceType.Email
                ? Mail
                : row.type === DataSourceType.GoogleDriveAdmin ||
                    row.type === DataSourceType.GoogleDrivePersonal
                  ? Cloud
                  : Database;
            return (
              <div
                key={String(row.type)}
                className="flex items-start gap-4 rounded-xl border border-[rgba(255,255,255,0.08)] bg-white/[0.03] p-4"
              >
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-[#F5F5F5] shrink-0">
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-[#F5F5F5]">{row.name}</h3>
                  <p className="text-sm text-[rgba(245,245,245,0.6)] mt-0.5">{row.description}</p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  {row.comingSoon && (
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded border border-white/15",
                        "text-[rgba(245,245,245,0.55)]"
                      )}
                    >
                      Coming soon
                    </span>
                  )}
                  {!row.comingSoon && isConnected && (
                    <span className="text-xs px-2 py-1 rounded bg-[var(--muted-success-bg)] text-[var(--muted-success-text)] border border-[var(--muted-success-border)]">
                      Connected
                    </span>
                  )}
                  {!row.comingSoon && !isConnected && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/10 text-[#F5F5F5]"
                      onClick={handleConnect}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
