import type { VicMockNormalizedRoot } from "@/lib/build-vic-persona-bundles";
import type { Trip } from "@/types/vic-profile";

import profiles from "./profiles.json";
import tripRh1 from "./trips/trip_rh_001.json";
import tripRh2 from "./trips/trip_rh_002.json";
import tripSr1 from "./trips/trip_sr_001.json";
import tripNa1 from "./trips/trip_na_001.json";
import tripJcp1 from "./trips/trip_jcp_001.json";
import tripAp1 from "./trips/trip_ap_001.json";
import tripAp2 from "./trips/trip_ap_002.json";
import proposals from "./proposals.json";
import relationships from "./relationships.json";
import financials from "./financials.json";
import advisories from "./advisories.json";
import sourceConflicts from "./sourceConflicts.json";
import touchPoints from "./touchPoints.json";
import activityEvents from "./activityEvents.json";
import prefRh from "./preferences/vic_harrington_richard.json";
import prefSr from "./preferences/vic_sofia_reyes.json";
import prefNa from "./preferences/vic_nadia_alrashid.json";
import prefJcp from "./preferences/vic_james_chenpark.json";
import prefAp from "./preferences/vic_anya_petrova.json";

const trips = [
  tripRh1,
  tripRh2,
  tripSr1,
  tripNa1,
  tripJcp1,
  tripAp1,
  tripAp2,
] as unknown as Trip[];

/** JSON imports widen string literals; cast at the ledger boundary. */
export const vicMockLedgerRoot = {
  profiles,
  preferences: {
    vic_harrington_richard: prefRh,
    vic_sofia_reyes: prefSr,
    vic_nadia_alrashid: prefNa,
    vic_james_chenpark: prefJcp,
    vic_anya_petrova: prefAp,
  },
  trips,
  proposals,
  relationships,
  financials,
  advisories,
  sourceConflicts,
  touchPoints,
  activityEvents,
} as unknown as VicMockNormalizedRoot;
