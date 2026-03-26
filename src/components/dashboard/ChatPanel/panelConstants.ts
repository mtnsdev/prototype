/**
 * Results panel (Places / Knowledge / Sources) width behaviour:
 *
 * - Default: DEFAULT_RESULTS_PANEL_WIDTH — chosen so place cards (image + text) show
 *   fully without cropping on typical viewports.
 * - Stored in localStorage under RESULTS_PANEL_WIDTH_KEY; restored on load.
 * - User can resize via the drag handle (min MIN_WIDTH, max 60% of viewport).
 * - "Reset to default" restores DEFAULT_RESULTS_PANEL_WIDTH and saves it.
 */

export const RESULTS_PANEL_WIDTH_KEY = "travellustre_results_panel_width";

/** Default width in px. Wide enough for place cards (image + metadata) to display without cropping. */
export const DEFAULT_RESULTS_PANEL_WIDTH = 420;

export const MIN_RESULTS_PANEL_WIDTH = 280;

export function getMaxResultsPanelWidth(): number {
  if (typeof window === "undefined") return 800;
  return Math.floor(window.innerWidth * 0.6);
}

export function getStoredOrDefaultPanelWidth(): number {
  if (typeof window === "undefined") return DEFAULT_RESULTS_PANEL_WIDTH;
  const stored = localStorage.getItem(RESULTS_PANEL_WIDTH_KEY);
  const parsed = stored ? parseInt(stored, 10) : NaN;
  if (!Number.isFinite(parsed)) return DEFAULT_RESULTS_PANEL_WIDTH;
  return Math.min(
    Math.max(parsed, MIN_RESULTS_PANEL_WIDTH),
    getMaxResultsPanelWidth()
  );
}

export function savePanelWidth(width: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(RESULTS_PANEL_WIDTH_KEY, String(width));
}
