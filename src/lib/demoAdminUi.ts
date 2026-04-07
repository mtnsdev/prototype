/** Single prototype lens: default off (end-user), on (admin across KV, products, briefing). */
export const DEMO_ADMIN_MENU = {
    prototypeAdminView: "Admin view",
} as const;

export const DEMO_ADMIN_SR = {
    prototypeAdminView:
        "When on, the prototype shows Knowledge Vault, product directory, and Briefing Room as an agency admin would see them. When off, it matches the default advisor or end-user experience.",
} as const;
