"use client";

import { Cloud, Database, Upload, Mail, Globe, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataSourceType } from "@/types/knowledge-vault";
import { useToast } from "@/contexts/ToastContext";

const SOURCES = [
  {
    type: DataSourceType.GoogleDrive,
    name: "Google Drive",
    description: "Connect shared drives and team folders for automatic sync.",
    icon: Cloud,
  },
  {
    type: DataSourceType.Claromentis,
    name: "Claromentis (Intranet)",
    description: "Pull documents and pages from your Claromentis intranet.",
    icon: Database,
  },
  {
    type: DataSourceType.ManualUpload,
    name: "Manual Upload",
    description: "Upload documents directly. Already available from the Upload button.",
    icon: Upload,
  },
  {
    type: DataSourceType.Virtuoso,
    name: "Virtuoso Network",
    description: "Access Virtuoso partner content and rate sheets.",
    icon: Globe,
  },
  {
    type: DataSourceType.Email,
    name: "Email Ingestion",
    description: "Ingest documents from email attachments and threads.",
    icon: Mail,
  },
  {
    type: "web_scrape" as const,
    name: "Web Scrape",
    description: "Crawl and index specific URLs or partner portals.",
    icon: FileSearch,
  },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function ConnectSourceModal({ open, onClose }: Props) {
  const toast = useToast();

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
          Choose a data source to connect to your Knowledge Vault. Documents will be synced and indexed for search.
        </p>
        <div className="grid gap-3 mt-4">
          {SOURCES.map((src) => {
            const Icon = src.icon;
            return (
              <div
                key={src.type}
                className="flex items-start gap-4 rounded-xl border border-[rgba(255,255,255,0.08)] bg-white/[0.03] p-4"
              >
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-[#F5F5F5] shrink-0">
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-[#F5F5F5]">{src.name}</h3>
                  <p className="text-sm text-[rgba(245,245,245,0.6)] mt-0.5">{src.description}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 text-[#F5F5F5] shrink-0"
                  onClick={handleConnect}
                >
                  Connect
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
