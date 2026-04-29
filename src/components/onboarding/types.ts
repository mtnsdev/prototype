export type HubSnapshot = {
  /** Workspace name set by the first admin (Path A only). */
  workspaceName: string;

  // ── Intranet ───────────────────────────────────────────────────────
  tenantIntranetUrl: string | null;
  intranetConnected: boolean;
  intranetDocs: number;
  intranetPages: number;
  /** Login the intranet was connected with — surfaced as "Connected as …". */
  intranetConnectedAs: string;
  /** Last user-visible error string for the intranet card (empty when none). */
  intranetError: string;

  // ── Shared Drive ───────────────────────────────────────────────────
  sharedDriveConnected: boolean;
  sharedDocs: number;
  sharedFolderName: string;
  sharedConnectedAs: string;

  // ── Personal Drive ─────────────────────────────────────────────────
  personalConnected: boolean;
  personalDocs: number;
  personalFolderName: string;
  personalConnectedAs: string;

  // ── Email forwarding ───────────────────────────────────────────────
  emailForwardingConfigured: boolean;
  emailForwardingAddress: string;

  // ── Skip flags ─────────────────────────────────────────────────────
  skippedIntranet: boolean;
  skippedShared: boolean;
  skippedPersonal: boolean;
  skippedEmailForwarding: boolean;
};

export function emptyHubSnapshot(): HubSnapshot {
  return {
    workspaceName: "",
    tenantIntranetUrl: null,
    intranetConnected: false,
    intranetDocs: 0,
    intranetPages: 0,
    intranetConnectedAs: "",
    intranetError: "",
    sharedDriveConnected: false,
    sharedDocs: 0,
    sharedFolderName: "",
    sharedConnectedAs: "",
    personalConnected: false,
    personalDocs: 0,
    personalFolderName: "",
    personalConnectedAs: "",
    emailForwardingConfigured: true,
    emailForwardingAddress: "",
    skippedIntranet: false,
    skippedShared: false,
    skippedPersonal: false,
    skippedEmailForwarding: false,
  };
}
