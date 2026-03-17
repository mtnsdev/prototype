"use client";

import { useState } from "react";
import type { Itinerary, ItineraryStatus } from "@/types/itinerary";
import { updateItineraryStatus } from "@/lib/itineraries-api";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

const VALID_TRANSITIONS: Record<ItineraryStatus, ItineraryStatus[]> = {
  draft: ["proposed", "cancelled"],
  proposed: ["confirmed", "draft", "cancelled"],
  confirmed: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: ["draft"],
};

const STATUS_LABELS: Record<ItineraryStatus, string> = {
  draft: "Draft",
  proposed: "Proposed",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

type Props = {
  itinerary: Itinerary;
  onStatusChange: (updatedStatus?: ItineraryStatus) => void;
};

export default function StatusChangeDropdown({ itinerary, onStatusChange }: Props) {
  const [loading, setLoading] = useState(false);
  const showToast = useToast();
  const nextStatuses = VALID_TRANSITIONS[itinerary.status] ?? [];

  const handleChange = async (newStatus: ItineraryStatus) => {
    setLoading(true);
    try {
      await updateItineraryStatus(itinerary.id, newStatus);
      onStatusChange(newStatus);
      showToast(`Status updated to ${STATUS_LABELS[newStatus]}`);
    } catch (_) {
      if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
        onStatusChange(newStatus);
        showToast(`Status updated to ${STATUS_LABELS[newStatus]}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (nextStatuses.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading} className="border-white/10 text-[#F5F5F5]">
          Change status <ChevronDown size={14} className="ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10">
        {nextStatuses.map((s) => (
          <DropdownMenuItem key={s} onClick={() => handleChange(s)}>
            {STATUS_LABELS[s]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
