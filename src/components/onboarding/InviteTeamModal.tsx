"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Team } from "@/types/teams";
import { TEAM_EVERYONE_ID } from "@/types/teams";
import { cn } from "@/lib/utils";

export type InviteRow = {
  id: string;
  email: string;
  role: "admin" | "user";
  teamIds: string[];
};

type InviteTeamModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teams: Team[];
  initialRows: InviteRow[];
  onSend: (rows: InviteRow[]) => void;
};

function newRow(teams: Team[]): InviteRow {
  const selectable = teams.filter((t) => t.id !== TEAM_EVERYONE_ID);
  return {
    id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    email: "",
    role: "user",
    teamIds: selectable[0] ? [selectable[0].id] : [],
  };
}

export function InviteTeamModal({
  open,
  onOpenChange,
  teams,
  initialRows,
  onSend,
}: InviteTeamModalProps) {
  const [rows, setRows] = useState<InviteRow[]>(() => initialRows);

  useEffect(() => {
    if (open) setRows(initialRows);
  }, [open, initialRows]);

  const updateRow = useCallback((id: string, patch: Partial<InviteRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, newRow(teams)]);
  }, [teams]);

  const removeRow = useCallback((id: string) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  }, []);

  const toggleTeam = useCallback((rowId: string, teamId: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const has = r.teamIds.includes(teamId);
        const teamIds = has ? r.teamIds.filter((t) => t !== teamId) : [...r.teamIds, teamId];
        return { ...r, teamIds };
      })
    );
  }, []);

  const validCount = rows.filter((r) => r.email.trim().includes("@")).length;

  const handleSend = () => {
    onSend(rows.filter((r) => r.email.trim().includes("@")));
    onOpenChange(false);
  };

  const selectableTeams = teams.filter((t) => t.id !== TEAM_EVERYONE_ID);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle>Invite your team</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Add emails, choose a role, and assign teams. Invites are sent when you confirm (prototype: no
            email is sent).
          </p>
          {rows.map((row) => (
            <div
              key={row.id}
              className="rounded-xl border border-border bg-card/40 p-4 space-y-3"
            >
              <div className="flex flex-wrap gap-3 items-end">
                <div className="min-w-[200px] flex-1 space-y-1.5">
                  <Label htmlFor={`email-${row.id}`}>Email</Label>
                  <Input
                    id={`email-${row.id}`}
                    type="email"
                    placeholder="advisor@agency.com"
                    value={row.email}
                    onChange={(e) => updateRow(row.id, { email: e.target.value })}
                    autoComplete="email"
                  />
                </div>
                <div className="w-[140px] space-y-1.5">
                  <Label>Role</Label>
                  <Select
                    value={row.role}
                    onValueChange={(v: "admin" | "user") => updateRow(row.id, { role: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {rows.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground"
                    onClick={() => removeRow(row.id)}
                    aria-label="Remove row"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Teams</Label>
                <div className="flex flex-wrap gap-2">
                  {selectableTeams.map((t) => {
                    const on = row.teamIds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTeam(row.id, t.id)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          on
                            ? "border-primary bg-primary/15 text-foreground"
                            : "border-border bg-background text-muted-foreground hover:border-border/80"
                        )}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addRow}>
            <Plus className="h-4 w-4" />
            Add row
          </Button>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSend} disabled={validCount === 0}>
            Send {validCount} invite{validCount === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
