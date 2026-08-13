/**
 * Renders the fixed CSS "well pool" layer (`.site-bg`) — the base/fallback water.
 * On every device the interactive <WaterBackground> renders live water on top of
 * it; this layer shows through when that opts out (prefers-reduced-motion) or
 * while its canvas is paused. <WaterBackground>'s scroll handler also scales
 * this layer up as the water fades out, expanding the pool circle so the page
 * brightens past the hero (transform set there, reset on its cleanup).
 */
export function ScrollBackdrop() {
  return <div className="site-bg" aria-hidden />;
}
