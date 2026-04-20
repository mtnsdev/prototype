"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Zap, Trash2, Tag, Download, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STATUS_OPTIONS = ["active", "inactive", "prospect", "past", "do_not_contact"] as const;

type Props = {
  count: number;
  canRunAcuity: boolean;
  onRunAcuity: () => void;
  onBulkUpdateStatus?: (status: string) => void;
  onBulkTag?: () => void;
  onDelete: () => void;
  onBulkExport?: () => void;
  onClearSelection: () => void;
};

export default function BulkActionsBar({
  count,
  canRunAcuity,
  onRunAcuity,
  onBulkUpdateStatus,
  onBulkTag,
  onDelete,
  onBulkExport,
  onClearSelection,
}: Props) {
  const [statusOpen, setStatusOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-2 bg-foreground/[0.05] border-b border-border">
      <span className="text-sm text-muted-foreground">
        {count} VIC{count !== 1 ? "s" : ""} selected
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={onRunAcuity}
          disabled={!canRunAcuity}
          title={!canRunAcuity ? "Set up your Acuity profile in Admin Settings to enable VIC intelligence" : undefined}
          className="gap-1.5"
        >
          <Zap size={14} />
          Bulk Run Acuity
        </Button>
        {onBulkUpdateStatus && (
          <DropdownMenu open={statusOpen} onOpenChange={setStatusOpen}>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                Bulk Update Status
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {STATUS_OPTIONS.map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => {
                    onBulkUpdateStatus(s);
                    setStatusOpen(false);
                  }}
                  className="text-[rgba(245,245,245,0.9)] capitalize"
                >
                  {s.replace(/_/g, " ")}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {onBulkTag && (
          <Button size="sm" variant="outline" onClick={onBulkTag} className="gap-1.5">
            <Tag size={14} />
            Bulk Tag
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={onDelete} className="gap-1.5">
          <Trash2 size={14} />
          Bulk Delete
        </Button>
        {onBulkExport && (
          <Button size="sm" variant="outline" onClick={onBulkExport} className="gap-1.5">
            <Download size={14} />
            Bulk Export
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onClearSelection} className="gap-1.5">
          <X size={14} />
          Clear
        </Button>
      </div>
    </div>
  );
}
