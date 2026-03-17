"use client";

import { useState } from "react";
import type { VIC, SharedAccess } from "@/types/vic";
import { getVICId } from "@/lib/vic-api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

const MOCK_ADVISORS = [
  { id: "1", name: "Alex Advisor" },
  { id: "2", name: "Sam Smith" },
  { id: "3", name: "Jordan Lee" },
];

const LEVEL_DESCRIPTIONS: Record<string, string> = {
  none: "Private — only you and assigned advisors",
  basic: "Basic — name and contact only to shared users",
  full: "Full — all fields visible to shared users",
};

type Props = {
  vic: VIC;
  onClose: () => void;
  onSaved: () => void;
};

export default function ShareVICModal({ vic, onClose, onSaved }: Props) {
  const [level, setLevel] = useState<VIC["sharing_level"]>(vic.sharing_level ?? "none");
  const [sharedToAgency, setSharedToAgency] = useState(vic.is_shared_to_agency ?? false);
  const [sharedWith, setSharedWith] = useState<SharedAccess[]>(vic.shared_with ?? []);
  const [addAdvisorId, setAddAdvisorId] = useState("");
  const [addAccessLevel, setAddAccessLevel] = useState<"view" | "edit">("view");
  const [saving, setSaving] = useState(false);

  const handleAddAdvisor = () => {
    const advisor = MOCK_ADVISORS.find((a) => a.id === addAdvisorId);
    if (!advisor || sharedWith.some((s) => s.advisor_id === advisor.id)) return;
    setSharedWith((prev) => [...prev, { advisor_id: advisor.id, advisor_name: advisor.name, access_level: addAccessLevel, shared_at: new Date().toISOString() }]);
    setAddAdvisorId("");
  };

  const handleRemove = (advisorId: string) => {
    setSharedWith((prev) => prev.filter((s) => s.advisor_id !== advisorId));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const vicId = getVICId(vic);
      // In a real app: PATCH /api/vics/:id with sharing_level, is_shared_to_agency, shared_with
      await Promise.all(
        sharedWith.filter((s) => !(vic.shared_with ?? []).some((e) => e.advisor_id === s.advisor_id)).map((s) =>
          fetch(`/api/vics/${vicId}/share`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ advisor_id: s.advisor_id, access_level: s.access_level, sharing_level: level }),
          }).catch(() => {})
        )
      );
      onSaved();
      onClose();
    } catch {
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share VIC</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div>
            <Label className="text-[rgba(245,245,245,0.6)]">Sharing level</Label>
            <div className="mt-1.5 space-y-2">
              {(["none", "basic", "full"] as const).map((l) => (
                <label key={l} className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="level"
                    checked={level === l}
                    onChange={() => setLevel(l)}
                    className="mt-1 rounded border-white/20 bg-white/5"
                  />
                  <span className="text-[#F5F5F5] capitalize">{l === "none" ? "Private" : l}</span>
                  <span className="text-[rgba(245,245,245,0.5)] text-xs">— {LEVEL_DESCRIPTIONS[l]}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-[rgba(245,245,245,0.6)]">Share with advisors</Label>
            <div className="mt-1.5 flex gap-2 flex-wrap">
              <select
                value={addAdvisorId}
                onChange={(e) => setAddAdvisorId(e.target.value)}
                className="rounded-md border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-[#F5F5F5] min-w-[140px]"
              >
                <option value="">Select advisor</option>
                {MOCK_ADVISORS.filter((a) => !sharedWith.some((s) => s.advisor_id === a.id)).map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <select
                value={addAccessLevel}
                onChange={(e) => setAddAccessLevel(e.target.value as "view" | "edit")}
                className="rounded-md border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-[#F5F5F5]"
              >
                <option value="view">View</option>
                <option value="edit">Edit</option>
              </select>
              <Button type="button" size="sm" variant="outline" onClick={handleAddAdvisor} disabled={!addAdvisorId}>
                Add
              </Button>
            </div>
            {sharedWith.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {sharedWith.map((s) => (
                  <li key={s.advisor_id} className="flex items-center justify-between py-1.5 border-b border-[rgba(255,255,255,0.06)] last:border-0">
                    <span className="text-[#F5F5F5]">{s.advisor_name ?? s.advisor_id} · {s.access_level}</span>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-[rgba(245,245,245,0.5)]" onClick={() => handleRemove(s.advisor_id)}>
                      <X size={14} />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="agency_visibility"
              checked={sharedToAgency}
              onChange={(e) => setSharedToAgency(e.target.checked)}
              className="rounded border-white/20 bg-white/5"
            />
            <Label htmlFor="agency_visibility" className="font-normal text-[#F5F5F5]">Make visible in Agency Directory</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
