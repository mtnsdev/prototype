"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VICTravelProfileRoute() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : "";
  const type = typeof params?.type === "string" ? params.type : "";

  if (!id || !type) {
    return (
      <div className="p-6">
        <p className="text-sm text-[rgba(245,245,245,0.5)]">Invalid route.</p>
        <Link href="/dashboard/vics" className="text-sm text-[rgba(245,245,245,0.7)] hover:underline mt-2 inline-block">
          Back to VICs
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 mb-4 text-[rgba(245,245,245,0.7)]"
        onClick={() => router.push(`/dashboard/vics/${id}`)}
      >
        <ArrowLeft size={16} />
        Back to VIC
      </Button>
      <h1 className="text-xl font-semibold text-[#F5F5F5] mb-2">
        Travel profile: {type.replace(/-/g, " ")}
      </h1>
      <p className="text-sm text-[rgba(245,245,245,0.5)]">
        Expanded travel profile view for VIC <code className="bg-white/10 px-1 rounded">{id}</code>.
        Full content will be implemented in the detail page Travel tab.
      </p>
    </div>
  );
}
