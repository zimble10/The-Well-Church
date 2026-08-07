/*
 * Water-ripple heightfield for The Well Church — custom WebGL2.
 * Concentric ripples radiate from the cursor and from gentle ambient drops;
 * light glints off the rippled surface (looking down a well at the water).
 * Exposes window.startRipples(canvas, config) -> { pause, resume, destroy }.
 */
window.startRipples = function (canvas, cfg) {
  'use strict';
  cfg = cfg || {};
  var noop = { pause: function () {}, resume: function () {}, destroy: function () {} };

  var gl = canvas.getContext('webgl2', { alpha: true, antialias: false, depth: false, stencil: false });
  if (!gl) return noop;
  if (!gl.getExtension('EXT_color_buffer_float')) return noop; // need float render targets

  var SIM = cfg.resolution || 256;

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
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }

  var VS =
    '#version 300 es\nin vec2 a; out vec2 v; void main(){ v = a*0.5+0.5; gl_Position = vec4(a,0.,1.); }';

  var UPDATE =
    '#version 300 es\nprecision highp float; in vec2 v; out vec4 o;\n' +
    'uniform sampler2D u; uniform vec2 texel; uniform float damping;\n' +
    'void main(){\n' +
    '  vec2 d = texture(u,v).xy;\n' +
    '  float l=texture(u,v-vec2(texel.x,0.)).x;\n' +
    '  float r=texture(u,v+vec2(texel.x,0.)).x;\n' +
    '  float t=texture(u,v+vec2(0.,texel.y)).x;\n' +
    '  float b=texture(u,v-vec2(0.,texel.y)).x;\n' +
    '  float nh=(l+r+t+b)*0.5 - d.y;\n' +
    '  nh*=damping;\n' +
    '  o=vec4(nh, d.x, 0., 1.);\n' +
    '}';

  var DROP =
    '#version 300 es\nprecision highp float; in vec2 v; out vec4 o;\n' +
    'uniform sampler2D u; uniform vec2 center; uniform float radius; uniform float strength; uniform float aspect;\n' +
    'void main(){\n' +
    '  vec4 s=texture(u,v);\n' +
    '  vec2 p=v-center; p.x*=aspect;\n' +
    '  float d=length(p)/radius;\n' +
    '  float drop = (1.0 - smoothstep(0.0,1.0,d)) * cos(min(d,1.0)*3.14159);\n' +
    '  o=vec4(s.x + drop*strength, s.y, 0., 1.);\n' +
    '}';

  var RENDER =
    '#version 300 es\nprecision highp float; in vec2 v; out vec4 o;\n' +
    'uniform sampler2D u; uniform vec2 texel; uniform vec3 deep; uniform vec3 shallow; uniform vec2 lightPos; uniform float aspect;\n' +
    'void main(){\n' +
    // sample the SQUARE sim into a centred square so ripples stay full circles
    '  vec2 s = vec2((v.x-0.5)*aspect + 0.5, v.y);\n' +
    '  if (s.x < 0.0 || s.x > 1.0) { o = vec4(0.0); return; }\n' +
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
    '  o=vec4(col, 1.0);\n' +
    '}';

  var pUpdate = prog(VS, UPDATE);
  var pDrop = prog(VS, DROP);
  var pRender = prog(VS, RENDER);

  var quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  function bindQuad(p) {
    var loc = gl.getAttribLocation(p, 'a');
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  }
  function U(p, name) {
    return gl.getUniformLocation(p, name);
  }

  function makeTex() {
    var t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, SIM, SIM, 0, gl.RGBA, gl.FLOAT, null);
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

  var texA = makeTex(),
    texB = makeTex();
  var fboA = makeFBO(texA),
    fboB = makeFBO(texB);
  [fboA, fboB].forEach(function (f) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  });

  var texel = [1 / SIM, 1 / SIM];
  var deep = cfg.deep || [0.015, 0.05, 0.1];
  var shallow = cfg.shallow || [0.1, 0.27, 0.44];
  var lightPos = cfg.lightPos || [0.5, 0.42];
  var damping = cfg.damping || 0.992;

  function swap() {
    var t = texA;
    texA = texB;
    texB = t;
    var f = fboA;
    fboA = fboB;
    fboB = f;
  }

  function drop(cx, cy, radius, strength) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fboB);
    gl.viewport(0, 0, SIM, SIM);
    gl.useProgram(pDrop);
    bindQuad(pDrop);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texA);
    gl.uniform1i(U(pDrop, 'u'), 0);
    gl.uniform2f(U(pDrop, 'center'), cx, cy);
    gl.uniform1f(U(pDrop, 'radius'), radius);
    gl.uniform1f(U(pDrop, 'strength'), strength);
    gl.uniform1f(U(pDrop, 'aspect'), 1.0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    swap();
  }

  function step() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fboB);
    gl.viewport(0, 0, SIM, SIM);
    gl.useProgram(pUpdate);
    bindQuad(pUpdate);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texA);
    gl.uniform1i(U(pUpdate, 'u'), 0);
    gl.uniform2f(U(pUpdate, 'texel'), texel[0], texel[1]);
    gl.uniform1f(U(pUpdate, 'damping'), damping);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    swap();
  }

  function render() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(pRender);
    bindQuad(pRender);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texA);
    gl.uniform1i(U(pRender, 'u'), 0);
    gl.uniform2f(U(pRender, 'texel'), texel[0], texel[1]);
    gl.uniform3f(U(pRender, 'deep'), deep[0], deep[1], deep[2]);
    gl.uniform3f(U(pRender, 'shallow'), shallow[0], shallow[1], shallow[2]);
    gl.uniform2f(U(pRender, 'lightPos'), lightPos[0], lightPos[1]);
    gl.uniform1f(U(pRender, 'aspect'), canvas.width / canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
  }
  resize();
  window.addEventListener('resize', resize);

  var running = true;
  var cx = cfg.centerX != null ? cfg.centerX : 0.5;
  var cy = cfg.centerY != null ? cfg.centerY : 0.5;
  var stepEvery = cfg.stepEvery || 3; // sim step once per N frames → slower outward travel
  var _f = 0;
  function frame() {
    if (!running) return;
    _f++;
    if (_f % stepEvery === 0) step(); // propagate 1/stepEvery as fast (gentle roll)
    render();
    requestAnimationFrame(frame);
  }

  function toUV(e) {
    var r = canvas.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, 1.0 - (e.clientY - r.top) / r.height];
  }
  function onMove(e) {
    var uv = toUV(e);
    var aspect = canvas.width / canvas.height;
    var sx = (uv[0] - 0.5) * aspect + 0.5; // map cursor into the centred square
    if (sx < 0.0 || sx > 1.0 || uv[1] < 0.0 || uv[1] > 1.0) return;
    drop(sx, uv[1], cfg.cursorRadius || 0.03, cfg.cursorStrength || 0.06);
  }
  window.addEventListener('mousemove', onMove);

  // Gentle rings from the centre (behind the logo), softly expanding outward.
  var dropRadius = cfg.dropRadius || 0.05;
  var dropStrength = cfg.dropStrength || 0.12;
  for (var i = 0; i < 2; i++) drop(cx, cy, dropRadius, dropStrength);
  var amb = setInterval(function () {
    if (running) drop(cx, cy, dropRadius, dropStrength);
  }, cfg.dropInterval || 900);

  requestAnimationFrame(frame);

  return {
    pause: function () {
      running = false;
    },
    resume: function () {
      if (!running) {
        running = true;
        requestAnimationFrame(frame);
      }
    },
    destroy: function () {
      running = false;
      clearInterval(amb);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    },
  };
};
