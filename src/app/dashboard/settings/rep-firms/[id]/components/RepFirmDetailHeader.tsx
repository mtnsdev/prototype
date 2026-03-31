"use client";

import { Globe, Users } from "lucide-react";
import type { RepFirm } from "@/types/rep-firm";

interface RepFirmDetailHeaderProps {
  firm: RepFirm;
}

export function RepFirmDetailHeader({ firm }: RepFirmDetailHeaderProps) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#161616] p-6">
      <div className="flex items-start gap-6">
        {/* Logo or Avatar */}
        <div className="flex-shrink-0">
          {firm.logoUrl ? (
            <img
              src={firm.logoUrl}
              alt={firm.name}
              className="h-24 w-24 rounded-lg border border-white/[0.08] bg-white/[0.02] object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-white/[0.08] bg-[#0a0a0f]">
              <Users className="h-10 w-10 text-[#B07A5B]/50" />
            </div>
          )}
        </div>

        {/* Header Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-semibold text-[#F5F0EB]">{firm.name}</h1>
              {firm.tagline && <p className="mt-2 text-sm text-[#9B9590]">{firm.tagline}</p>}

              {/* Status Badge */}
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={[
                    "rounded-full px-2.5 py-1 text-2xs uppercase tracking-wide",
                    firm.status === "active"
                      ? "bg-[rgba(91,138,110,0.12)] text-[#5B8A6E]"
                      : "bg-white/[0.05] text-[#6B6560]",
                  ].join(" ")}
                >
                  {firm.status}
                </span>
              </div>
            </div>
          </div>

          {/* Meta Information */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {firm.website && (
              <div>
                <p className="text-2xs text-[#9B9590]">WEBSITE</p>
                <a
                  href={firm.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1.5 text-xs text-[#C9A96E] transition-colors hover:text-[#d4b87e] break-all"
                >
                  <Globe className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{firm.website.replace(/^https?:\/\/(www\.)?/, "")}</span>
                </a>
              </div>
            )}

            {firm.propertyCount != null && (
              <div>
                <p className="text-2xs text-[#9B9590]">PROPERTIES</p>
                <p className="mt-1 text-xs text-[#F5F0EB] font-medium">{firm.propertyCount.toLocaleString()}</p>
              </div>
            )}

            {firm.contactEmail && (
              <div>
                <p className="text-2xs text-[#9B9590]">PRIMARY CONTACT</p>
                <a
                  href={`mailto:${firm.contactEmail}`}
                  className="mt-1 text-xs text-[#C9A96E] transition-colors hover:text-[#d4b87e] break-all"
                >
                  {firm.contactEmail}
                </a>
              </div>
            )}

            {firm.contactPhone && (
              <div>
                <p className="text-2xs text-[#9B9590]">PHONE</p>
                <a
                  href={`tel:${firm.contactPhone}`}
                  className="mt-1 text-xs text-[#F5F0EB] transition-colors hover:text-[#C9A96E]"
                >
                  {firm.contactPhone}
                </a>
              </div>
            )}

            {firm.contactName && (
              <div>
                <p className="text-2xs text-[#9B9590]">PRIMARY CONTACT NAME</p>
                <p className="mt-1 text-xs text-[#F5F0EB]">{firm.contactName}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
