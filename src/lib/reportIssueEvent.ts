/** Dispatched so `ReportIssueLauncher` can open from the sidebar menu. */
export const REPORT_ISSUE_OPEN_EVENT = "enable:open-report-issue";

export function openReportIssueModal(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(REPORT_ISSUE_OPEN_EVENT));
}
