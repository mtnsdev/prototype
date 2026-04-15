/** Single prototype lens: toggles `user.role` between advisor and admin (persisted with user). */
export const DEMO_ADMIN_MENU = {
    prototypeAdminView: "Admin view",
} as const;

export const DEMO_ADMIN_SR = {
    prototypeAdminView:
        "Sets your session role to admin or advisor (same as the directory role pill). Admin shows Knowledge Vault, product directory, and Briefing Room as an agency operator; advisor matches the default end-user experience.",
} as const;
