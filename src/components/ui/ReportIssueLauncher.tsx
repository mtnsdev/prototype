"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/contexts/ToastContext";

/**
 * Global “Report issue” entry (dashboard shell). Submit is demo-only.
 */
export default function ReportIssueLauncher() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("wrong");
  const [details, setDetails] = useState("");
  const toast = useToast();

  const submit = () => {
    setOpen(false);
    setDetails("");
    toast("Issue reported — we'll look into it.");
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-[10px] text-gray-600 hover:text-gray-400 flex items-center gap-1 bg-white/[0.02] border border-white/[0.04] rounded-lg px-2.5 py-1.5 backdrop-blur-sm"
        >
          <Flag className="w-3 h-3" aria-hidden />
          Report issue
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-issue-title"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-[#0a0a0f] border border-white/[0.06] rounded-xl p-5 w-full max-w-sm shadow-2xl">
            <h3 id="report-issue-title" className="text-sm text-white font-medium mb-1">
              Report an issue
            </h3>
            <p className="text-[10px] text-gray-500 mb-4">Let us know if something isn&apos;t right.</p>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs bg-white/[0.03] border border-white/[0.04] rounded-lg px-3 py-2 text-gray-400 mb-3 outline-none"
            >
              <option value="wrong">Something looks wrong</option>
              <option value="indexing">Document not indexing</option>
              <option value="missing">Missing content</option>
              <option value="other">Other</option>
            </select>

            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe what you're seeing..."
              className="w-full text-xs bg-white/[0.03] border border-white/[0.04] rounded-lg px-3 py-2 text-gray-400 h-20 resize-none mb-3 outline-none placeholder:text-gray-600"
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-[10px] h-8 text-gray-500 hover:text-gray-400"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="text-[10px] h-8 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 border-0"
                onClick={submit}
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
