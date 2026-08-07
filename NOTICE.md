# Third-Party Notices — The Well Church website

This project bundles the following third-party open-source software.

## WebGL Fluid Simulation

- **File:** `public/fluid.js`
- **Source:** https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
- **Author:** Pavel Dobryakov
- **License:** MIT
- **Modifications:** Embedded for this site — removed the promo/analytics/dat.GUI
  code, wrapped as `window.startFluid(canvas, config)` with start/pause/destroy,
  locked the splat palette to the church's blue/silver, made it hover-reactive at
  the window level, and added gentle ambient motion. The full MIT license text is
  retained at the top of `public/fluid.js`.
