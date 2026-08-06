/**
 * Renders the fixed "water in a well" backdrop layer (styled in globals.css as
 * `.site-bg`). The swirl is a pure CSS animation, so no JS is required.
 */
export function ScrollBackdrop() {
  return <div className="site-bg" aria-hidden />;
}
