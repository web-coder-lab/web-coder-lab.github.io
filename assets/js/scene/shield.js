// Builds the 3D NEXGUARD shield by extruding the same Bezier outline the app draws (GuardianShield.kt), plus a badge sphere.
const SEG = [[50, 8, 80, 8, 92, 16, 90, 42], [90, 42, 88, 68, 68, 86, 50, 94], [50, 94, 32, 86, 12, 68, 10, 42], [10, 42, 8, 16, 20, 8, 50, 8]];
function outline(n) {
  const pts = [];
  for (const [x0, y0, x1, y1, x2, y2, x3, y3] of SEG) for (let i = 0; i < n; i++) {
    const t = i / n, u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
    pts.push([((a * x0 + b * x1 + c * x2 + d * x3) - 50) / 43, -(((a * y0 + b * y1 + c * y2 + d * y3) - 51) / 43)]);
  }
  return pts;
}
export function buildShield() {
  const P = outline(24), N = P.length, v = [];
  const nrm = P.map((p, i) => { const a = P[(i + N - 1) % N], b = P[(i + 1) % N]; let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; return [ty / l, -tx / l]; }); // outward 2D normal (outline runs clockwise in this space)
  // make sure normals point away from the centre
  nrm.forEach((n, i) => { if (n[0] * P[i][0] + n[1] * P[i][1] < 0) { n[0] = -n[0]; n[1] = -n[1]; } });
  const D = .2, B = .93;
  const push = (p, n) => v.push(p[0], p[1], p[2], n[0], n[1], n[2]);
  const ring = (i, s, z) => [P[i][0] * s, P[i][1] * s, z];
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N, ni = nrm[i], nj = nrm[j];
    // side wall (back edge to front edge)
    const s = [[ring(i, 1, -D), [ni[0], ni[1], 0]], [ring(j, 1, -D), [nj[0], nj[1], 0]], [ring(j, 1, D * .55), [nj[0], nj[1], 0]], [ring(i, 1, D * .55), [ni[0], ni[1], 0]]];
    [0, 1, 2, 0, 2, 3].forEach(k => push(s[k][0], s[k][1]));
    // bevel (side top to inset front edge)
    const bn = (n) => { const l = Math.hypot(n[0] * .7, n[1] * .7, .7); return [n[0] * .7 / l, n[1] * .7 / l, .7 / l]; };
    const q = [[ring(i, 1, D * .55), bn(ni)], [ring(j, 1, D * .55), bn(nj)], [ring(j, B, D), bn(nj)], [ring(i, B, D), bn(ni)]];
    [0, 1, 2, 0, 2, 3].forEach(k => push(q[k][0], q[k][1]));
    // front face
    push([0, -.02, D], [0, 0, 1]); push(ring(i, B, D), [0, 0, 1]); push(ring(j, B, D), [0, 0, 1]);
    // back face
    push([0, -.02, -D], [0, 0, -1]); push(ring(j, 1, -D), [0, 0, -1]); push(ring(i, 1, -D), [0, 0, -1]);
  }
  return new Float32Array(v);
}
export function buildSphere(r, cx, cy, cz, lat = 12, lon = 18) {
  const v = [], p = (a, b) => { const x = Math.sin(a) * Math.cos(b), y = Math.cos(a), z = Math.sin(a) * Math.sin(b); return [cx + r * x, cy + r * y, cz + r * z, x, y, z]; };
  for (let i = 0; i < lat; i++) for (let j = 0; j < lon; j++) {
    const a0 = Math.PI * i / lat, a1 = Math.PI * (i + 1) / lat, b0 = 2 * Math.PI * j / lon, b1 = 2 * Math.PI * (j + 1) / lon;
    const A = p(a0, b0), B = p(a1, b0), C = p(a1, b1), E = p(a0, b1); v.push(...A, ...B, ...C, ...A, ...C, ...E);
  }
  return new Float32Array(v);
}
