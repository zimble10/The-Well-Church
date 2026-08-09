/*
 * Water-ripple heightfield for The Well Church.
 * Concentric ripples radiate from the pointer and from gentle ambient drops;
 * light glints off the rippled surface (looking down a well at the water).
 *
 * Exposes window.startRipples(canvas, config) -> { pause, resume, destroy, mode, reason }
 *
 * `mode` tells the caller which path the device actually got:
 *   'webgl'  — the full heightfield simulation
 *   'canvas' — the 2D ring fallback (no WebGL2, or no float render targets)
 *   'none'   — nothing could run; the CSS pool shows through
 *
 * Design rule: this effect must DEGRADE, never disappear. Every early return
 * hands back a cheaper animation rather than a dead canvas, because a flat
 * gradient is what "the site looks broken" feels like to a visitor.
 */
window.startRipples = function (canvas, cfg) {
  'use strict';
  cfg = cfg || {};

  function controllerFor(mode, reason, impl) {
    return {
      mode: mode,
      reason: reason || null,
      pause: impl ? impl.pause : function () {},
      resume: impl ? impl.resume : function () {},
      destroy: impl ? impl.destroy : function () {},
    };
  }

  /* Fall back to the 2D ring animation, which needs no GPU features at all. */
  function fallback(reason) {
    var impl = window.startRipples2D && window.startRipples2D(canvas, cfg);
    if (!impl) return controllerFor('none', reason, null);
    return controllerFor('canvas', reason, impl);
  }

  var gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    // Never let the browser refuse the context just because it would be slow —
    // a soft renderer still looks better here than a static gradient.
    failIfMajorPerformanceCaveat: false,
  });
  if (!gl) return fallback('no-webgl2');

  /*
   * The simulation stores heights in RGBA16F — a HALF-float target. Requiring
   * EXT_color_buffer_float (full 32-bit) is therefore stricter than this code
   * actually needs, and it silently switched the effect off on hardware that
   * runs it perfectly well. Half-float is supported far more widely, including
   * essentially all mobile GPUs. Ask for either, and prefer half.
   */
  var halfFloat = gl.getExtension('EXT_color_buffer_half_float');
  var fullFloat = gl.getExtension('EXT_color_buffer_float');
  if (!halfFloat && !fullFloat) return fallback('no-float-render-target');

  var SIM = cfg.resolution || 256;
  var DPR_CAP = cfg.dprCap || 2;
  // Set on touch devices, where a scrolling gesture retracts the browser chrome
  // and changes the viewport height without the user resizing anything.
  var ignoreChromeJitter = !!cfg.ignoreChromeJitter;

  /*
   * highp is not guaranteed in fragment shaders on mobile GPUs. Ask the
   * compiler rather than assuming; mediump keeps the sim alive on the few
   * devices that lack it.
   */
  var PRECISION =
    '#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';

  var VS =
    '#version 300 es\nin vec2 a; out vec2 v; void main(){ v = a*0.5+0.5; gl_Position = vec4(a,0.,1.); }';

  var UPDATE =
    '#version 300 es\n' +
    PRECISION +
    'in vec2 v; out vec4 o;\n' +
    'uniform sampler2D u; uniform vec2 texel; uniform float damping; uniform float c2;\n' +
    'void main(){\n' +
    '  vec2 d = texture(u,v).xy;\n' +
    '  float l=texture(u,v-vec2(texel.x,0.)).x;\n' +
    '  float r=texture(u,v+vec2(texel.x,0.)).x;\n' +
    '  float t=texture(u,v+vec2(0.,texel.y)).x;\n' +
    '  float b=texture(u,v-vec2(0.,texel.y)).x;\n' +
    // Damped wave equation written out with an explicit Courant term, so the
    // propagation speed is a parameter instead of being baked into the grid.
    // c2 = 0.5 reproduces the original exactly ((l+r+t+b)*0.5 - prev); halving
    // the speed means c2 = 0.125, since c2 scales with speed SQUARED. Stability
    // requires c2 <= 0.5, so every slower value is safely inside it.
    // Slowing the wave this way keeps the sim stepping at its normal rate. The
    // alternative — stepping half as often — drops the update rate to ~10/sec
    // and the motion reads as stuttering rather than as slow water.
    '  float nh = 2.0*d.x - d.y + c2*((l+r+t+b) - 4.0*d.x);\n' +
    '  nh*=damping;\n' +
    '  o=vec4(nh, d.x, 0., 1.);\n' +
    '}';

  var DROP =
    '#version 300 es\n' +
    PRECISION +
    'in vec2 v; out vec4 o;\n' +
    'uniform sampler2D u; uniform vec2 center; uniform float radius; uniform float strength; uniform float aspect;\n' +
    'void main(){\n' +
    '  vec4 s=texture(u,v);\n' +
    '  vec2 p=v-center; p.x*=aspect;\n' +
    '  float d=length(p)/radius;\n' +
    '  float drop = (1.0 - smoothstep(0.0,1.0,d)) * cos(min(d,1.0)*3.14159);\n' +
    '  o=vec4(s.x + drop*strength, s.y, 0., 1.);\n' +
    '}';

  var RENDER =
    '#version 300 es\n' +
    PRECISION +
    'in vec2 v; out vec4 o;\n' +
    'uniform sampler2D u; uniform vec2 texel; uniform vec3 deep; uniform vec3 shallow; uniform vec2 lightPos; uniform float aspect; uniform vec2 vignette;\n' +
    'void main(){\n' +
    // COVER-fit the square sim to the viewport: scale until it fills, crop the
    // overflow. The old CONTAIN fit letterboxed the sim into a centred square of
    // side = viewport HEIGHT and discarded everything outside it, which is exactly
    // why a maximised ultrawide window showed hard vertical edges — at aspect 2.5
    // the square covered only 39% of the width. Both branches below scale x and y
    // by the same factor, so ripples stay perfectly circular, and neither can
    // sample outside [0,1], so nothing is ever clipped.
    '  vec2 s = aspect > 1.0\n' +
    '    ? vec2(v.x, (v.y - 0.5) / aspect + 0.5)\n' +
    '    : vec2((v.x - 0.5) * aspect + 0.5, v.y);\n' +
    '  float hx=texture(u,s+vec2(texel.x,0.)).x - texture(u,s-vec2(texel.x,0.)).x;\n' +
    '  float hy=texture(u,s+vec2(0.,texel.y)).x - texture(u,s-vec2(0.,texel.y)).x;\n' +
    '  vec3 n=normalize(vec3(-hx*18.0, -hy*18.0, 1.0));\n' +
    '  vec3 L=normalize(vec3(0.30,0.40,0.87));\n' +
    '  float diff=clamp(dot(n,L),0.0,1.0);\n' +
    '  float spec=pow(clamp(dot(reflect(-L,n), vec3(0.,0.,1.)),0.0,1.0), 60.0);\n' +
    '  vec2 ruv = s + n.xy*0.12;\n' +
    '  float glow = smoothstep(0.55, 0.0, distance(ruv, lightPos))*0.16;\n' +
    '  vec3 col = mix(deep, shallow, diff);\n' +
    '  col += glow * vec3(0.34,0.46,0.66);\n' +
    '  col += spec * vec3(0.82,0.91,1.0);\n' +
    // The water now carries its own radial falloff. Previously it wrote alpha 1.0
    // everywhere and the "black fade" was really just the CSS pool showing around
    // the clipped square — so maximising the window (small square, big screen)
    // made the fade look strong, and filling the screen with water erased it.
    // Distance is aspect-corrected: d = 1.0 at the top and bottom edges whatever
    // the window shape, and larger toward the sides of a wide one, so the fade
    // lands in the same visual place at every size. Premultiplied, because the
    // context composites that way by default.
    '  vec2 q = (v - vec2(0.5)) * vec2(aspect, 1.0);\n' +
    '  float d = length(q) * 2.0;\n' +
    '  float vign = 1.0 - smoothstep(vignette.x, vignette.y, d);\n' +
    '  o = vec4(col * vign, vign);\n' +
    '}';

  var texel = [1 / SIM, 1 / SIM];
  var deep = cfg.deep || [0.015, 0.05, 0.1];
  var shallow = cfg.shallow || [0.1, 0.27, 0.44];
  var lightPos = cfg.lightPos || [0.5, 0.42];
  var damping = cfg.damping || 0.992;
  /*
   * Propagation speed as a multiplier of the original: 1.0 = unchanged,
   * 0.5 = ripples travel outward half as fast. Squared into the Courant term
   * because wave speed enters the equation as c².
   *
   * Damping is per-STEP, so a slower wave crosses the same distance in more
   * steps and would die out closer to the centre at the same damping value.
   * Compensating with damping^speed keeps the ripples reaching just as far as
   * before — only slower — instead of also shrinking the pool.
   */
  var waveSpeed = cfg.waveSpeed || 1.0;
  var c2 = 0.5 * waveSpeed * waveSpeed;
  var stepDamping = Math.pow(damping, waveSpeed);
  var cx = cfg.centerX != null ? cfg.centerX : 0.5;
  var cy = cfg.centerY != null ? cfg.centerY : 0.5;
  // [fully opaque water, fully faded] as aspect-corrected radii, where 1.0 is the
  // top/bottom edge of the viewport. Tune these to move the black fade in or out.
  var vignette = cfg.vignette || [0.5, 1.25];
  var stepEvery = cfg.stepEvery || 3; // sim step once per N frames → slower outward travel
  var dropRadius = cfg.dropRadius || 0.05;
  var dropStrength = cfg.dropStrength || 0.12;
  var minFrameMs = cfg.maxFps ? 1000 / cfg.maxFps : 0;

  // --- GPU objects, rebuilt from scratch if the context is ever lost ---------
  var pUpdate, pDrop, pRender, quad, vao, texA, texB, fboA, fboB;
  /*
   * Uniform locations, resolved once at build time.
   *
   * These used to be looked up with gl.getUniformLocation inside the draw
   * functions — seven per render(), five per drop(), plus a getAttribLocation
   * for the quad. Those are synchronous queries against the linked program, not
   * cheap state sets, and render() runs every frame while drop() runs on every
   * pointer event. They belong in setup.
   */
  var uUpdate, uDrop, uRender;
  var lastAspect = -1;

  function sh(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function prog(vs, fs) {
    var p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    // Pin the quad attribute to slot 0 in every program BEFORE linking, so one
    // VAO describes the geometry for all three and no program needs its own
    // attribute setup at draw time.
    gl.bindAttribLocation(p, 0, 'a');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }
  function U(p, name) {
    return gl.getUniformLocation(p, name);
  }
  function makeTex() {
    var t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    // RGBA16F is filterable in WebGL2 core, so LINEAR needs no extra extension.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, SIM, SIM, 0, gl.RGBA, gl.HALF_FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  function makeFBO(tex) {
    var f = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return f;
  }

  /* Build everything. Returns false if this GPU cannot actually do it —
     an advertised extension is not the same as a complete framebuffer. */
  function build() {
    pUpdate = prog(VS, UPDATE);
    pDrop = prog(VS, DROP);
    pRender = prog(VS, RENDER);

    uUpdate = {
      u: U(pUpdate, 'u'),
      texel: U(pUpdate, 'texel'),
      damping: U(pUpdate, 'damping'),
      c2: U(pUpdate, 'c2'),
    };
    uDrop = {
      u: U(pDrop, 'u'),
      center: U(pDrop, 'center'),
      radius: U(pDrop, 'radius'),
      strength: U(pDrop, 'strength'),
      aspect: U(pDrop, 'aspect'),
    };
    uRender = {
      u: U(pRender, 'u'),
      texel: U(pRender, 'texel'),
      deep: U(pRender, 'deep'),
      shallow: U(pRender, 'shallow'),
      lightPos: U(pRender, 'lightPos'),
      aspect: U(pRender, 'aspect'),
      vignette: U(pRender, 'vignette'),
    };

    quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    // One VAO for all three programs (slot 0 pinned in prog()). Bound once and
    // left bound — nothing else in this file touches vertex state — so the draw
    // functions do no attribute work at all.
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    /* Uniforms that never change are program state, so they survive useProgram
       switches and only need setting once. That leaves the per-frame path with
       just the handful that actually vary. */
    gl.useProgram(pUpdate);
    gl.uniform1i(uUpdate.u, 0);
    gl.uniform2f(uUpdate.texel, texel[0], texel[1]);
    gl.uniform1f(uUpdate.damping, stepDamping);
    gl.uniform1f(uUpdate.c2, c2);

    gl.useProgram(pDrop);
    gl.uniform1i(uDrop.u, 0);
    gl.uniform1f(uDrop.aspect, 1.0); // the sim grid is square; always 1

    gl.useProgram(pRender);
    gl.uniform1i(uRender.u, 0);
    gl.uniform2f(uRender.texel, texel[0], texel[1]);
    gl.uniform3f(uRender.deep, deep[0], deep[1], deep[2]);
    gl.uniform3f(uRender.shallow, shallow[0], shallow[1], shallow[2]);
    gl.uniform2f(uRender.lightPos, lightPos[0], lightPos[1]);
    gl.uniform2f(uRender.vignette, vignette[0], vignette[1]);
    lastAspect = -1; // force one aspect upload on the next render

    texA = makeTex();
    texB = makeTex();
    fboA = makeFBO(texA);
    fboB = makeFBO(texB);

    var ok = true;
    [fboA, fboB].forEach(function (f) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, f);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) ok = false;
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    });
    return ok;
  }

  function swap() {
    var t = texA;
    texA = texB;
    texB = t;
    var f = fboA;
    fboA = fboB;
    fboB = f;
  }

  function drop(dcx, dcy, radius, strength) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fboB);
    gl.viewport(0, 0, SIM, SIM);
    gl.useProgram(pDrop);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texA);
    gl.uniform2f(uDrop.center, dcx, dcy);
    gl.uniform1f(uDrop.radius, radius);
    gl.uniform1f(uDrop.strength, strength);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    swap();
  }

  function step() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fboB);
    gl.viewport(0, 0, SIM, SIM);
    gl.useProgram(pUpdate);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texA);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    swap();
  }

  function render() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(pRender);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texA);
    // Aspect is the only per-frame uniform, and it only actually changes on a
    // resize — so upload it only when it has.
    var aspect = canvas.width / canvas.height;
    if (aspect !== lastAspect) {
      gl.uniform1f(uRender.aspect, aspect);
      lastAspect = aspect;
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /* Reallocating the backing store clears it, and mobile fires resize on every
     URL-bar show/hide — so coalesce to one per frame and skip no-op changes. */
  var resizePending = false;
  function applySize() {
    resizePending = false;
    var dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    var cw = canvas.clientWidth;
    var ch = canvas.clientHeight;
    // Mid-drag the layout can momentarily report a zero-sized box. Clamping that
    // to 1px collapses the buffer and the water visibly vanishes, so hold the
    // previous size and pick the real one up on the next frame instead.
    if (!cw || !ch) {
      resizePending = true;
      return;
    }
    var w = Math.max(1, Math.floor(cw * dpr));
    var h = Math.max(1, Math.floor(ch * dpr));
    if (w === canvas.width && h === canvas.height) return;
    /*
     * Backstop for browsers without `lvh` (see .fluid-canvas in globals.css).
     * A collapsing mobile URL bar changes the height by roughly 8-15% and leaves
     * the width alone. Reallocating for that mid-scroll re-centres the sim and
     * reads as the water sliding then snapping back, so on touch devices a
     * height-only change of that scale is treated as browser chrome and ignored.
     * A real rotation or split-screen resize changes the width too, or changes
     * the height by far more than this, and still gets through.
     */
    if (
      ignoreChromeJitter &&
      canvas.width === w &&
      canvas.height > 0 &&
      Math.abs(h - canvas.height) < canvas.height * 0.22
    ) {
      return;
    }
    canvas.width = w;
    canvas.height = h;
  }
  /*
   * Only FLAG the change — the frame loop applies it immediately before drawing.
   *
   * Assigning canvas.width/height reallocates and CLEARS the drawing buffer. When
   * that happened in its own rAF callback it could land AFTER the same frame's
   * render(), leaving a cleared canvas on screen until the next one. Dragging a
   * window edge fires resize continuously, so that landed on frame after frame
   * and the water flashed on and off. Resizing inside the draw guarantees the
   * clear is always followed by a render in the same frame.
   */
  function resize() {
    resizePending = true;
  }

  try {
    if (!build()) return fallback('framebuffer-incomplete');
  } catch (err) {
    return fallback('shader-error: ' + (err && err.message ? err.message : err));
  }
  applySize();

  var running = true;
  var lost = false;
  var _f = 0;
  var _last = 0;
  var rafId = 0;

  /*
   * Adaptive quality. Fragment cost scales with the square of the pixel ratio,
   * so a weak GPU behind a high-DPI panel is the worst case — and it is exactly
   * the case we cannot detect up front. Rather than guess from a device string,
   * watch real frame times and step the resolution down once if the machine is
   * visibly struggling. Deliberately one-way and slow to trigger: the aim is to
   * rescue a bad experience, not to oscillate.
   *
   * Timing deliberately drives DPR only, never stepEvery — changing the step
   * rate would change how fast the water moves, so a slow device would get a
   * different animation rather than the same one rendered more cheaply.
   */
  var prevT = 0;
  var slowStreak = 0;
  var degraded = false;
  function watchPerf(now) {
    if (!prevT) {
      prevT = now;
      return;
    }
    var dt = now - prevT;
    prevT = now;
    if (dt > 28) slowStreak++;
    else if (slowStreak > 0) slowStreak--;
    if (!degraded && slowStreak > 120 && DPR_CAP > 1) {
      degraded = true;
      DPR_CAP = 1;
      resizePending = true;
    }
  }

  function frame(now) {
    if (!running || lost) return;
    rafId = requestAnimationFrame(frame);
    if (minFrameMs && now - _last < minFrameMs) return;
    _last = now || 0;
    watchPerf(now || 0);
    // Resize here, never from a standalone callback: the clear it causes is then
    // always followed by the render below, within the same frame.
    if (resizePending) applySize();
    flushInput(); // at most one move + one press, whatever the input rate
    _f++;
    if (_f % stepEvery === 0) step(); // propagate 1/stepEvery as fast (gentle roll)
    render();
  }

  /* Pointer Events cover mouse, pen AND touch in one listener, which is why a
     phone previously could not make a single ripple — the old code bound only
     mousemove. Passive: this never blocks scrolling. */
  function addRipple(clientX, clientY, radius, strength) {
    var r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var ux = (clientX - r.left) / r.width;
    var uy = 1.0 - (clientY - r.top) / r.height;
    var aspect = canvas.width / canvas.height;
    // Must mirror the COVER fit in the render shader exactly, or the ripple
    // appears somewhere other than under the pointer.
    var sx, sy;
    if (aspect > 1.0) {
      sx = ux;
      sy = (uy - 0.5) / aspect + 0.5;
    } else {
      sx = (ux - 0.5) * aspect + 0.5;
      sy = uy;
    }
    if (sx < 0.0 || sx > 1.0 || sy < 0.0 || sy > 1.0) return;
    drop(sx, sy, radius, strength);
  }

  /*
   * Input is QUEUED, not drawn on arrival.
   *
   * drop() is a full render-to-texture pass plus a buffer swap. Firing one per
   * pointer event meant a 1000Hz gaming mouse could trigger ~16 extra GPU passes
   * inside a single 60fps frame, and a multi-touch drag could do worse — all of
   * it invisible, because only the last state before render() is ever seen. The
   * frame loop now applies at most one move and one press per frame, which is
   * the most that can actually be displayed.
   */
  var pendingMove = null;
  var pendingPress = null;
  function flushInput() {
    if (pendingPress) {
      addRipple(pendingPress[0], pendingPress[1], pendingPress[2], pendingPress[3]);
      pendingPress = null;
    }
    if (pendingMove) {
      addRipple(pendingMove[0], pendingMove[1], pendingMove[2], pendingMove[3]);
      pendingMove = null;
    }
  }
  function onPointerMove(e) {
    if (!running || lost) return;
    pendingMove = [e.clientX, e.clientY, cfg.cursorRadius || 0.03, cfg.cursorStrength || 0.06];
  }
  function onPointerDown(e) {
    if (!running || lost) return;
    // A tap deserves a bigger splash than a passing cursor — it is deliberate.
    pendingPress = [
      e.clientX,
      e.clientY,
      (cfg.cursorRadius || 0.03) * 1.6,
      (cfg.cursorStrength || 0.06) * 2.2,
    ];
  }
  function onTouchMove(e) {
    if (!running || lost || !e.touches || !e.touches.length) return;
    // Legacy path only (no Pointer Events). One finger per frame is all that
    // survives to the screen anyway.
    var t = e.touches[0];
    pendingMove = [t.clientX, t.clientY, cfg.cursorRadius || 0.03, cfg.cursorStrength || 0.06];
  }

  var OPTS = { passive: true };
  var hasPointer = typeof window.PointerEvent === 'function';
  if (hasPointer) {
    window.addEventListener('pointermove', onPointerMove, OPTS);
    window.addEventListener('pointerdown', onPointerDown, OPTS);
  } else {
    window.addEventListener('mousemove', onPointerMove, OPTS);
    window.addEventListener('touchmove', onTouchMove, OPTS);
    window.addEventListener('touchstart', onTouchMove, OPTS);
  }
  /* Track the element, not just the window. ResizeObserver fires for anything
     that changes the canvas box — maximise/restore, drag-resize, a DPI change
     from moving the window to another monitor, mobile URL-bar collapse — and it
     reports the change directly rather than us inferring it from a window event.
     window.resize stays as the fallback for browsers without it. The shader
     re-reads the aspect ratio every frame, so the water reflows continuously
     while a drag is in progress rather than snapping at the end. */
  var ro = null;
  if (typeof ResizeObserver === 'function') {
    ro = new ResizeObserver(resize);
    ro.observe(canvas);
  }
  window.addEventListener('resize', resize);

  /* A lost context (driver reset, tab backgrounded on mobile, GPU switch) used
     to kill the water permanently. Rebuild instead. */
  function onLost(e) {
    e.preventDefault();
    lost = true;
    cancelAnimationFrame(rafId);
  }
  function onRestored() {
    try {
      if (!build()) return;
      applySize();
      lost = false;
      if (running) rafId = requestAnimationFrame(frame);
    } catch (err) {
      /* stays on the CSS pool */
    }
  }
  canvas.addEventListener('webglcontextlost', onLost, false);
  canvas.addEventListener('webglcontextrestored', onRestored, false);

  // Gentle rings from the centre (behind the logo), softly expanding outward.
  for (var i = 0; i < 2; i++) drop(cx, cy, dropRadius, dropStrength);
  var amb = setInterval(function () {
    if (running && !lost) drop(cx, cy, dropRadius, dropStrength);
  }, cfg.dropInterval || 900);

  rafId = requestAnimationFrame(frame);

  return controllerFor('webgl', halfFloat ? 'half-float' : 'full-float', {
    pause: function () {
      running = false;
      cancelAnimationFrame(rafId);
    },
    resume: function () {
      if (!running) {
        running = true;
        // A pause is not a slow frame. Without this the gap since the last frame
        // would be counted against the perf budget and could degrade quality for
        // nothing more than the tab having been in the background.
        prevT = 0;
        _last = 0;
        if (!lost) rafId = requestAnimationFrame(frame);
      }
    },
    destroy: function () {
      running = false;
      cancelAnimationFrame(rafId);
      clearInterval(amb);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', resize);
      if (hasPointer) {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerdown', onPointerDown);
      } else {
        window.removeEventListener('mousemove', onPointerMove);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchstart', onTouchMove);
      }
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      var ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    },
  });
};

/*
 * 2D fallback: expanding rings on a plain canvas. No GPU features, no shaders —
 * if a device can draw a circle it gets moving water. Deliberately cheap: a
 * handful of stroked arcs per frame, capped at 30fps.
 */
window.startRipples2D = function (canvas, cfg) {
  'use strict';
  cfg = cfg || {};
  var ctx = canvas.getContext('2d');
  if (!ctx) return null;

  var DPR_CAP = cfg.dprCap || 1.5;
  var speed = cfg.waveSpeed || 1.0;
  var rings = [];
  var running = true;
  var rafId = 0;
  var last = 0;
  var W = 0;
  var H = 0;

  /* Same rule as the WebGL path: flag it, apply it inside the draw. Assigning
     canvas.width clears the 2D surface too, so resizing from a standalone
     callback would flicker while a window edge is being dragged. */
  var resizePending2 = false;
  function applySize2() {
    resizePending2 = false;
    var dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    var cw = canvas.clientWidth;
    var ch = canvas.clientHeight;
    if (!cw || !ch) {
      resizePending2 = true;
      return;
    }
    var w = Math.max(1, Math.floor(cw * dpr));
    var h = Math.max(1, Math.floor(ch * dpr));
    // Same mobile-chrome guard as the WebGL path.
    if (cfg.ignoreChromeJitter && W === w && H > 0 && Math.abs(h - H) < H * 0.22) return;
    W = canvas.width = w;
    H = canvas.height = h;
  }
  function resize() {
    resizePending2 = true;
  }
  applySize2();
  var ro2 = null;
  if (typeof ResizeObserver === 'function') {
    ro2 = new ResizeObserver(resize);
    ro2.observe(canvas);
  }
  window.addEventListener('resize', resize);

  function spawn(x, y, strength) {
    if (rings.length > 28) rings.shift(); // hard cap keeps the cost flat
    rings.push({ x: x, y: y, r: 0, a: strength });
  }

  function frame(now) {
    if (!running) return;
    rafId = requestAnimationFrame(frame);
    if (now - last < 33) return; // ~30fps is plenty for slow rings
    var dt = last ? Math.min((now - last) / 1000, 0.1) : 0.033;
    last = now;
    if (resizePending2) applySize2();

    ctx.clearRect(0, 0, W, H);
    var max = Math.max(W, H) * 0.75;
    for (var i = rings.length - 1; i >= 0; i--) {
      var ring = rings[i];
      ring.r += max * 0.16 * speed * dt; // honour waveSpeed so both paths match
      ring.a *= 1 - 0.55 * dt;
      if (ring.a < 0.004 || ring.r > max) {
        rings.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(150, 200, 255, ' + ring.a.toFixed(3) + ')';
      ctx.lineWidth = Math.max(1, 2.5 * (1 - ring.r / max)) * (W / 1200 + 0.5);
      ctx.stroke();
    }
  }

  function pointerAt(e) {
    var r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    var dpr = W / r.width;
    return { x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr };
  }
  function onMove(e) {
    if (!running) return;
    var p = pointerAt(e);
    if (p && Math.random() < 0.18) spawn(p.x, p.y, 0.1); // thin the trail out
  }
  function onDown(e) {
    if (!running) return;
    var p = pointerAt(e);
    if (p) spawn(p.x, p.y, 0.34);
  }

  var OPTS = { passive: true };
  var hasPointer = typeof window.PointerEvent === 'function';
  var moveEvt = hasPointer ? 'pointermove' : 'mousemove';
  var downEvt = hasPointer ? 'pointerdown' : 'touchstart';
  window.addEventListener(moveEvt, onMove, OPTS);
  window.addEventListener(downEvt, onDown, OPTS);

  var amb = setInterval(function () {
    if (running) spawn(W * 0.5, H * 0.5, 0.26);
  }, cfg.dropInterval || 1400);
  spawn(W * 0.5, H * 0.5, 0.26);

  rafId = requestAnimationFrame(frame);

  return {
    pause: function () {
      running = false;
      cancelAnimationFrame(rafId);
    },
    resume: function () {
      if (!running) {
        running = true;
        last = 0;
        rafId = requestAnimationFrame(frame);
      }
    },
    destroy: function () {
      running = false;
      cancelAnimationFrame(rafId);
      clearInterval(amb);
      if (ro2) ro2.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener(moveEvt, onMove);
      window.removeEventListener(downEvt, onDown);
      ctx.clearRect(0, 0, W, H);
    },
  };
};
