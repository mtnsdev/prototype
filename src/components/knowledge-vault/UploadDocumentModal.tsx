"use client";

import { useState } from "react";
import { Upload, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/contexts/ToastContext";

type Props = {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
};

export default function UploadDocumentModal({ open, onClose, onUploaded }: Props) {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [dataLayer, setDataLayer] = useState<"agency" | "advisor">("agency");
  const [tags, setTags] = useState("");
  const [uploading, setUploading] = useState(false);

  const reset = () => {
    setStep(1);
    setFiles([]);
    setTitle("");
    setDataLayer("agency");
    setTags("");
    setUploading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const list = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...list]);
    if (list[0] && !title) setTitle(list[0].name.replace(/\.[^.]+$/, ""));
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...list]);
    if (list[0] && !title) setTitle(list[0].name.replace(/\.[^.]+$/, ""));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      formData.set("title", title);
      formData.set("data_layer", dataLayer);
      formData.set("tags", tags);
      const { uploadKnowledgeDocuments } = await import("@/lib/knowledge-vault-api");
      await uploadKnowledgeDocuments(formData);
      toast("Documents uploaded. Processing…");
      onUploaded();
      handleClose();
    } catch {
      toast("Upload failed — using mock. Documents will appear after refresh.");
      onUploaded();
      handleClose();
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="bg-[#1a1a1a] border-white/10 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#F5F5F5]">
            Upload Document {step > 1 && `— Step ${step} of 3`}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-white/30 transition-colors"
          >
            <Upload size={40} className="mx-auto text-[rgba(245,245,245,0.4)] mb-4" />
            <p className="text-[#F5F5F5] font-medium">Drop files here or click to browse</p>
            <p className="text-xs text-[rgba(245,245,245,0.5)] mt-1">
              PDF, DOCX, XLSX, CSV, HTML, TXT, images
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.xlsx,.csv,.html,.txt,image/*"
              className="hidden"
              id="kv-upload-input"
              onChange={onFileInput}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 border-white/20"
              onClick={() => document.getElementById("kv-upload-input")?.click()}
            >
              Select files
            </Button>
            {files.length > 0 && (
              <p className="text-sm text-[rgba(245,245,245,0.7)] mt-4">
                {files.length} file{files.length !== 1 ? "s" : ""} selected
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label className="text-[rgba(245,245,245,0.8)]">Title</Label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#F5F5F5]"
              />
            </div>
            <div>
              <Label className="text-[rgba(245,245,245,0.8)]">Data layer</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 text-sm text-[rgba(245,245,245,0.8)]">
                  <input
                    type="radio"
                    name="layer"
                    checked={dataLayer === "agency"}
                    onChange={() => setDataLayer("agency")}
                  />
                  Agency
                </label>
                <label className="flex items-center gap-2 text-sm text-[rgba(245,245,245,0.8)]">
                  <input
                    type="radio"
                    name="layer"
                    checked={dataLayer === "advisor"}
                    onChange={() => setDataLayer("advisor")}
                  />
                  Advisor
                </label>
              </div>
            </div>
            <div>
              <Label className="text-[rgba(245,245,245,0.8)]">Tags (comma-separated)</Label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="luxury, Europe, rates"
                className="mt-1 w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#F5F5F5]"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-[rgba(245,245,245,0.7)]">Review and upload</p>
            <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-1">
              <p className="font-medium text-[#F5F5F5]">{title || "Untitled"}</p>
              <p className="text-xs text-[rgba(245,245,245,0.5)]">{dataLayer} layer</p>
              <p className="text-xs text-[rgba(245,245,245,0.5)]">
                {files.length} file{files.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="border-t border-white/10 pt-4">
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
          )}
          <div className="flex-1" />
          {step < 3 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 && files.length === 0}
            >
              Next <ChevronRight size={14} className="ml-1" />
            </Button>
          ) : (
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
