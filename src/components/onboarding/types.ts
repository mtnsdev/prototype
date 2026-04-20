export type HubSnapshot = {
  tenantIntranetUrl: string | null;
  intranetConnected: boolean;
  intranetDocs: number;
  intranetPages: number;
  sharedDriveConnected: boolean;
  sharedDocs: number;
  sharedFolderName: string;
  personalConnected: boolean;
  personalDocs: number;
  personalFolderName: string;
  skippedIntranet: boolean;
  skippedShared: boolean;
  skippedPersonal: boolean;
};

export function emptyHubSnapshot(): HubSnapshot {
  return {
    tenantIntranetUrl: null,
    intranetConnected: false,
    intranetDocs: 0,
    intranetPages: 0,
    sharedDriveConnected: false,
    sharedDocs: 0,
    sharedFolderName: "",
    personalConnected: false,
    personalDocs: 0,
    personalFolderName: "",
    skippedIntranet: false,
    skippedShared: false,
    skippedPersonal: false,
  };
}
