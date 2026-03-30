"use client";

import { useState, useEffect } from "react";
import type { AcuitySettings } from "@/types/vic";
import { fetchAcuitySettings, updateAcuitySettings } from "@/lib/vic-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const REQUester_TYPE_SUGGESTIONS = [
  "luxury hotel",
  "fashion house",
  "travel advisor",
  "jeweller",
  "real estate",
  "private bank",
];

export default function AcuitySettingsSection() {
  const [settings, setSettings] = useState<AcuitySettings>({
    requester_type: "",
    requester_name: "",
    requester_location: "",
    requester_focus: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchAcuitySettings()
      .then((s) => {
        if (s) setSettings(s);
      })
      .catch(() => setError("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      await updateAcuitySettings(settings);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground/75">Loading settings…</p>;
  }

  return (
    <section className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-lg font-semibold text-foreground">Acuity Intelligence Settings</h2>
        <p className="text-sm text-muted-foreground/75 mt-1">
          These settings determine how Acuity tailors its VIC intelligence profiles for your organisation.
        </p>
      </div>
      <form onSubmit={handleSave} className="p-5 space-y-4">
        {error && <p className="text-sm text-red-400">{error}</p>}
        {saved && <p className="text-sm text-green-400">Settings saved.</p>}

        <div>
          <Label htmlFor="requester_type">Industry Type *</Label>
          <Input
            id="requester_type"
            value={settings.requester_type}
            onChange={(e) => setSettings((s) => ({ ...s, requester_type: e.target.value }))}
            placeholder="e.g. luxury hotel"
            list="requester-type-suggestions"
            className="mt-1"
          />
          <datalist id="requester-type-suggestions">
            {REQUester_TYPE_SUGGESTIONS.map((opt) => (
              <option key={opt} value={opt} />
            ))}
          </datalist>
          <p className="text-xs text-muted-foreground/75 mt-1">
            Suggestions: luxury hotel, fashion house, travel advisor, jeweller, real estate, private bank
          </p>
        </div>

        <div>
          <Label htmlFor="requester_name">Organisation Name *</Label>
          <Input
            id="requester_name"
            value={settings.requester_name}
            onChange={(e) => setSettings((s) => ({ ...s, requester_name: e.target.value }))}
            placeholder="e.g. Hôtel de Paris Monte-Carlo"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="requester_location">Location *</Label>
          <Input
            id="requester_location"
            value={settings.requester_location}
            onChange={(e) => setSettings((s) => ({ ...s, requester_location: e.target.value }))}
            placeholder="e.g. Monaco"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="requester_focus">Focus Area (optional)</Label>
          <textarea
            id="requester_focus"
            value={settings.requester_focus ?? ""}
            onChange={(e) => setSettings((s) => ({ ...s, requester_focus: e.target.value }))}
            placeholder="e.g. dining preferences and activity interests for personalising guest stays"
            rows={2}
            className="mt-1 w-full rounded-md border border-input bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-foreground"
          />
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save Settings"}
        </Button>

        <p className="text-xs text-muted-foreground/75">
          These settings apply to all Acuity runs in this workspace. Changes take effect on the next run.
        </p>
      </form>
    </section>
  );
}
