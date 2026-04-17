import type { RepFirmSpecialty } from "@/types/rep-firm";

export const REP_FIRM_SPECIALTIES: readonly RepFirmSpecialty[] = [
  "hotels",
  "dmcs",
  "camps_lodges",
  "villas",
  "cruise",
  "spas",
  "transportation",
  "tourism_board",
  "multi",
] as const;

export const REP_FIRM_SPECIALTY_LABELS: Record<RepFirmSpecialty, string> = {
  hotels: "Hotels",
  dmcs: "DMCs",
  camps_lodges: "Camps & Lodges",
  villas: "Villas",
  cruise: "Cruise",
  spas: "Spas",
  transportation: "Transportation",
  tourism_board: "Tourism Board",
  multi: "Multi",
};
