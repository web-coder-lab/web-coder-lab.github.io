// Site-wide WebGL scene: a 3D shield and a particle tunnel. The camera zooms in and out with scroll; each page has its own mood.
import { m4, clamp, lerp, smooth, hex } from './math.js';
import { buildShield, buildSphere } from './shield.js';

const canvas = document.getElementById('gl');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const gl = canvas && (canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true }) || canvas.getContext('experimental-webgl'));

function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
function prog(vs, fs) { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p; }
const U = (p, names) => Object.fromEntries(names.map(n => [n, gl.getUniformLocation(p, n)]));

const BODY_VS = `attribute vec3 a_pos;attribute vec3 a_nrm;uniform mat4 u_mvp;uniform mat4 u_model;uniform mat3 u_nm;varying vec3 v_n;varying vec3 v_p;
void main(){v_n=u_nm*a_nrm;v_p=(u_model*vec4(a_pos,1.)).xyz;gl_Position=u_mvp*vec4(a_pos,1.);}`;
const BODY_FS = `precision mediump float;varying vec3 v_n;varying vec3 v_p;uniform vec3 u_cam;uniform vec3 u_c1;uniform vec3 u_c2;uniform vec3 u_c3;uniform float u_t;uniform float u_a;uniform float u_emit;uniform float u_light;
void main(){vec3 N=normalize(v_n);vec3 V=normalize(u_cam-v_p);vec3 L=normalize(vec3(-.5,.8,.9));float d=max(dot(N,L),0.);float f=pow(1.-max(dot(N,V),0.),2.4);vec3 H=normalize(L+V);float s=pow(max(dot(N,H),0.),56.);
float g=clamp(v_p.y*.5+.5+.14*sin(u_t*.6+v_p.x*2.),0.,1.);vec3 b=mix(u_c1,u_c2,g);b=mix(b,u_c3,f*.55);
vec3 c=b*(.22+.95*d)+s*vec3(.9,1.,1.)*.75+f*mix(u_c1,vec3(1.),.35)*.95+u_emit*b;c=mix(c,c*.78,u_light);gl_FragColor=vec4(c*u_a,u_a);}`;
const PT_VS = `attribute vec4 a_s;uniform mat4 u_vp;uniform float u_t;uniform float u_trav;uniform float u_size;uniform vec2 u_par;uniform vec3 u_c1;uniform vec3 u_c2;uniform vec3 u_c3;varying float v_a;varying vec3 v_c;
void main(){float depth=70.;float z=mod(a_s.z*depth+u_trav,depth)-depth+8.;float ang=a_s.x*6.2831+u_t*.04*(a_s.w-.5);float r=a_s.y;
vec3 p=vec3(cos(ang)*r,sin(ang)*r*.72,z);p.xy+=u_par*(1.+z*.015);vec4 pos=u_vp*vec4(p,1.);gl_Position=pos;
gl_PointSize=clamp(u_size*(.55+a_s.w)/max(pos.w,.5),1.,16.);
float gap=smoothstep(0.,1.,abs(z+22.)/3.6);v_a=smoothstep(1.,7.,pos.w)*(1.-smoothstep(32.,64.,pos.w))*mix(.1,1.,gap);
vec3 c=mix(u_c1,u_c2,smoothstep(2.,40.,pos.w));v_c=mix(c,u_c3,smoothstep(30.,64.,pos.w));}`;
const PT_FS = `precision mediump float;varying float v_a;varying vec3 v_c;uniform float u_a;
void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d);gl_FragColor=vec4(v_c*a*v_a*u_a,a*v_a*u_a);}`;

function start() {
  const mobile = innerWidth < 760, light = () => document.documentElement.dataset.theme === 'light';
  let COUNT = mobile ? 2200 : 6500, DPR = Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2);
  const body = prog(BODY_VS, BODY_FS), pts = prog(PT_VS, PT_FS);
  const bU = U(body, ['u_mvp', 'u_model', 'u_nm', 'u_cam', 'u_c1', 'u_c2', 'u_c3', 'u_t', 'u_a', 'u_emit', 'u_light']);
  const pU = U(pts, ['u_vp', 'u_t', 'u_trav', 'u_size', 'u_par', 'u_c1', 'u_c2', 'u_c3', 'u_a']);
  const shield = buildShield(), badge = buildSphere(.2, .66, .7, .26);
  const mk = data => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); return b; };
  const shBuf = mk(shield), bdBuf = mk(badge);
  const seeds = new Float32Array(COUNT * 4);
  for (let i = 0; i < COUNT; i++) { const r = 2.2 + Math.pow(Math.random(), .7) * 13; seeds.set([Math.random(), r, Math.random(), Math.random()], i * 4); }
  const ptBuf = mk(seeds);
  let cols = { c1: [.3, .94, .82], c2: [.42, .65, 1], c3: [.65, .55, .98] };
  const readColors = () => { const s = getComputedStyle(document.documentElement); cols = { c1: hex(s.getPropertyValue('--a')), c2: hex(s.getPropertyValue('--a2')), c3: hex(s.getPropertyValue('--a3')) }; };
  readColors(); new MutationObserver(readColors).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  const scene = () => document.body.dataset.scene || 'sub';
  // Pose per scene: camera distance (zoom), screen-relative position, size and opacity of the shield as a function of page progress p.
  const poses = {
    home: p => ({ z: lerp(10, 6.4, smooth(.74, 1, p)), nx: 0, ny: -.02, s: 1.25, a: smooth(.8, .97, p) * .95, pa: 1 }),
    sub: p => { const out = smooth(0, .5, p), back = smooth(.62, 1, p); return { z: lerp(lerp(5.6, 12, out), 7, back), nx: lerp(.6, 0, back), ny: lerp(.05, .85, out) * (1 - back), s: 1.0, a: lerp(lerp(1, .22, out), .8, back), pa: 1 }; },
    download: p => { const out = smooth(0, .6, p), back = smooth(.7, 1, p); return { z: lerp(lerp(5.8, 11, out), 6.5, back), nx: lerp(.52, 0, back), ny: lerp(.06, .7, out) * (1 - back), s: 1.0, a: lerp(lerp(1, .3, out), .85, back), pa: 1 }; },
    quiet: p => ({ z: lerp(7, 12, smooth(0, 1, p)), nx: .6, ny: .1, s: 1.1, a: .16, pa: .7 }),
  };
  const mpose = (o) => mobile ? { ...o, nx: o.nx > .3 ? .7 : o.nx * .9, ny: o.ny * .5 + .66, s: o.s * .5, a: o.a * .55 } : o;

  let w = 0, h = 0, ps = 0, trav = 0, t0 = performance.now(), last = t0, px = 0, py = 0, tpx = 0, tpy = 0, frames = 0, slow = 0, running = true, lastP = 0;
  function size() { w = innerWidth; h = innerHeight; canvas.width = Math.round(w * DPR); canvas.height = Math.round(h * DPR); gl.viewport(0, 0, canvas.width, canvas.height); }
  addEventListener('resize', () => { size(); if (reduce) frame(performance.now()); });
  if (!reduce) addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; tpx = e.clientX / innerWidth * 2 - 1; tpy = e.clientY / innerHeight * 2 - 1; }, { passive: true });
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running && !reduce) { last = performance.now(); requestAnimationFrame(frame); } });
  size();

  function frame(now) {
    if (!running) return;
    const dt = Math.min(.05, (now - last) / 1000); last = now; const t = (now - t0) / 1000;
    if (!reduce && ++frames > 30 && frames < 120) { slow += dt > .03 ? 1 : 0; if (frames === 119 && slow > 60 && DPR > 1) { DPR = 1; size(); } }
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight), p = clamp(scrollY / max);
    ps += (p - ps) * (reduce ? 1 : .09); const vel = Math.abs(ps - lastP) / Math.max(dt, .001); lastP = ps;
    px += (tpx - px) * .05; py += (tpy - py) * .05;
    const o = mpose((poses[scene()] || poses.sub)(ps)), asp = w / h, fov = 45 * Math.PI / 180, tan = Math.tan(fov / 2);
    trav += dt * (reduce ? 0 : 1.6 + Math.min(14, vel * 90));
    const proj = m4.persp(fov, asp, .1, 120), view = m4.trans(0, 0, -o.z), vp = m4.mul(proj, view), L = light();
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST);
    // shield
    if (o.a > .01) {
      const x = o.nx * tan * 6 * asp, y = o.ny * tan * 6;
      const ry = Math.sin(t * .45) * .5 + px * .5 + ps * 2.2, rx = -py * .28 + .1 + Math.sin(t * .3) * .05;
      const R = m4.mul(m4.rotY(ry), m4.rotX(rx)), M = m4.mul(m4.trans(x, y, 0), m4.mul(R, m4.scale(o.s))), nm = new Float32Array([R[0], R[1], R[2], R[4], R[5], R[6], R[8], R[9], R[10]]);
      gl.useProgram(body); gl.disable(gl.BLEND);
      gl.uniformMatrix4fv(bU.u_mvp, false, m4.mul(vp, M)); gl.uniformMatrix4fv(bU.u_model, false, M); gl.uniformMatrix3fv(bU.u_nm, false, nm);
      gl.uniform3f(bU.u_cam, 0, 0, o.z); gl.uniform3fv(bU.u_c1, cols.c1); gl.uniform3fv(bU.u_c2, cols.c2); gl.uniform3fv(bU.u_c3, cols.c3);
      gl.uniform1f(bU.u_t, t); gl.uniform1f(bU.u_a, o.a); gl.uniform1f(bU.u_light, L ? 1 : 0);
      const A = gl.getAttribLocation(body, 'a_pos'), B = gl.getAttribLocation(body, 'a_nrm'); gl.enableVertexAttribArray(A); gl.enableVertexAttribArray(B);
      for (const [buf, n, emit, c] of [[shBuf, shield.length / 6, 0, null], [bdBuf, badge.length / 6, 1.1, [1, .36, .3]]]) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.vertexAttribPointer(A, 3, gl.FLOAT, false, 24, 0); gl.vertexAttribPointer(B, 3, gl.FLOAT, false, 24, 12);
        gl.uniform1f(bU.u_emit, emit); if (c) { gl.uniform3fv(bU.u_c1, c); gl.uniform3fv(bU.u_c2, c); gl.uniform3fv(bU.u_c3, [1, .7, .6]); }
        gl.drawArrays(gl.TRIANGLES, 0, n);
      }
    }
    // particles (additive on dark, normal blending on light)
    gl.useProgram(pts); gl.enable(gl.BLEND); gl.depthMask(false);
    gl.blendFunc(L ? gl.ONE : gl.SRC_ALPHA, L ? gl.ONE_MINUS_SRC_ALPHA : gl.ONE);
    gl.uniformMatrix4fv(pU.u_vp, false, vp); gl.uniform1f(pU.u_t, t); gl.uniform1f(pU.u_trav, trav);
    gl.uniform1f(pU.u_size, (mobile ? 70 : 95) * DPR); gl.uniform2f(pU.u_par, -px * 1.2, py * .8);
    gl.uniform3fv(pU.u_c1, cols.c1); gl.uniform3fv(pU.u_c2, cols.c2); gl.uniform3fv(pU.u_c3, cols.c3); gl.uniform1f(pU.u_a, (L ? .55 : .9) * o.pa);
    const S = gl.getAttribLocation(pts, 'a_s'); gl.enableVertexAttribArray(S); gl.bindBuffer(gl.ARRAY_BUFFER, ptBuf); gl.vertexAttribPointer(S, 4, gl.FLOAT, false, 16, 0);
    gl.drawArrays(gl.POINTS, 0, COUNT); gl.depthMask(true);
    window.__ngScene = { frames, z: o.z, a: o.a, p: ps };
    if (!reduce) requestAnimationFrame(frame);
  }
  if (reduce) frame(performance.now()); else requestAnimationFrame(frame);
  addEventListener('scroll', () => { if (reduce) frame(performance.now()); }, { passive: true });
  document.documentElement.classList.add('gl-on');
}

if (gl) start();
