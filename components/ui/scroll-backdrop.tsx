/**
 * Renders the fixed CSS "well pool" layer (`.site-bg`) — the base/fallback water.
 * On desktop the interactive <FluidBackground> renders live water on top of it.
 */
export function ScrollBackdrop() {
  return <div className="site-bg" aria-hidden />;
}
