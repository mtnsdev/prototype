export type IntegrationKey =
    | "claromentis"
    | "google-drive-personal"
    | "google-drive-agency"
    | "virtuoso"
    | "axus"
    | "partner-portals";

export type IntegrationStatus = "active" | "not_connected" | "coming_soon" | "admin_only";

export type IntegrationDefinition = {
    key: IntegrationKey;
    label: string;
    // Whether the integration should appear for non-admin users
    visibleTo: "all" | "admin";
    // For Knowledge routing (only relevant when status is active)
    knowledgeQueryKey?: string;
};

export const INTEGRATION_DEFINITIONS: IntegrationDefinition[] = [
    {
        key: "claromentis",
        label: "Claromentis (Intranet)",
        visibleTo: "all",
        knowledgeQueryKey: "claromentis",
    },
    {
        key: "google-drive-personal",
        label: "My Google Drive",
        visibleTo: "all",
        knowledgeQueryKey: "google-drive-personal",
    },
    {
        key: "google-drive-agency",
        label: "Agency Google Drive",
        visibleTo: "admin",
        knowledgeQueryKey: "google-drive-agency",
    },
    { key: "virtuoso", label: "Virtuoso", visibleTo: "all" },
    { key: "axus", label: "Axus", visibleTo: "all" },
    { key: "partner-portals", label: "Partner Portals", visibleTo: "all" },
];


