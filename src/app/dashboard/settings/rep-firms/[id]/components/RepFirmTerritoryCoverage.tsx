"use client";

import { Globe, BarChart3 } from "lucide-react";

interface RepFirmTerritoryCoverageProps {
  propertyCount: number;
  regions: string[];
}

export function RepFirmTerritoryCoverage({ propertyCount, regions }: RepFirmTerritoryCoverageProps) {
  const PROPERTY_DENSITY = 500; // Properties per region for visualization
  const coveragePercentage = Math.min(
    100,
    Math.round((propertyCount / (regions.length * PROPERTY_DENSITY)) * 100)
  );

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#161616] p-6">
      <div className="mb-6 flex items-center gap-2">
        <Globe className="h-4 w-4 text-[#C9A96E]" />
        <h2 className="text-sm font-semibold text-[#F5F0EB]">Territory Coverage</h2>
      </div>

      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-white/[0.05] bg-[#0a0a0f] p-4">
            <p className="text-2xs text-[#9B9590]">PROPERTIES REPRESENTED</p>
            <p className="mt-2 text-2xl font-semibold text-[#F5F0EB]">{propertyCount.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-white/[0.05] bg-[#0a0a0f] p-4">
            <p className="text-2xs text-[#9B9590]">REGIONS COVERED</p>
            <p className="mt-2 text-2xl font-semibold text-[#F5F0EB]">{regions.length}</p>
          </div>
        </div>

        {/* Regional Breakdown */}
        {regions.length > 0 && (
          <div>
            <p className="mb-3 text-2xs text-[#9B9590]">REGIONAL DISTRIBUTION</p>
            <div className="space-y-2">
              {regions.map((region) => {
                const avgPropsPerRegion = Math.round(propertyCount / regions.length);
                const regionCoverage = Math.min(
                  100,
                  Math.round((avgPropsPerRegion / PROPERTY_DENSITY) * 100)
                );
                return (
                  <div key={region} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#F5F0EB]">{region}</span>
                      <span className="text-[#9B9590]">~{avgPropsPerRegion} properties</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                      <div
                        className="h-full bg-gradient-to-r from-[#C9A96E] to-[#B8905D]"
                        style={{ width: `${Math.min(100, regionCoverage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Coverage Insights */}
        <div className="flex items-start gap-3 rounded-lg border border-[#C9A96E]/20 bg-[#C9A96E]/5 p-4">
          <BarChart3 className="h-4 w-4 flex-shrink-0 text-[#C9A96E] mt-0.5" />
          <p className="text-xs text-[#F5F0EB]">
            This rep firm represents approximately <span className="font-semibold">{coveragePercentage}%</span> of
            typical regional property inventory, providing solid coverage across {regions.length} region
            {regions.length !== 1 ? "s" : ""}.
          </p>
        </div>
      </div>
    </div>
  );
}
