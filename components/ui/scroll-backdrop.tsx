/**
 * Renders the fixed CSS "well pool" layer (`.site-bg`) — the base/fallback water.
 * On every device the interactive <WaterBackground> renders live water on top of
 * it; this layer shows through when that opts out (prefers-reduced-motion) or
 * while its canvas is paused.
 */
export function ScrollBackdrop() {
  return <div className="site-bg" aria-hidden />;
}
