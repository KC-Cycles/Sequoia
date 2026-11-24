// Stick figures. A figure is two poses (start and finish) seen from the side, facing right.
// Legs and planted hands are solved from where the foot or hand is; free arms and legs are
// given as angles, so limbs keep their length while they move. Output is one inline SVG
// whose lines carry SMIL animations, so no script runs while it loops.
import { FIGS } from './data/figs.js';

export const SEG = { torso: 27, uarm: 13, farm: 13, thigh: 20, shin: 20, neck: 3.5, head: 5.5, foot: 5 };

// 0 degrees points up, 90 points forward (right), 180 points down.
function dir(deg) { const r = deg * Math.PI / 180; return [Math.sin(r), -Math.cos(r)]; }
function along(p, d, len) { return [p[0] + d[0] * len, p[1] + d[1] * len]; }

// Two-segment limb from a to target. side picks which way the middle joint bends.
function reach(a, target, l1, l2, side) {
  let dx = target[0] - a[0], dy = target[1] - a[1], d = Math.hypot(dx, dy);
  const max = l1 + l2;
  const missed = d > max + 0.5;
  if (d < 0.001) { dx = 0; dy = 1; d = 0.001; }
  const ux = dx / d, uy = dy / d, dd = Math.min(d, max);
  const k = (l1 * l1 - l2 * l2 + dd * dd) / (2 * dd);
  const h = Math.sqrt(Math.max(0, l1 * l1 - k * k));
  const px = side >= 0 ? uy : -uy, py = side >= 0 ? -ux : ux;
  return { mid: [a[0] + ux * k + px * h, a[1] + uy * k + py * h], end: [a[0] + ux * dd, a[1] + uy * dd], missed };
}

function lerp(a, b, t) {
  if (Array.isArray(a)) return a.map((v, i) => v + (b[i] - v) * t);
  return typeof a === 'number' ? a + (b - a) * t : a;
}
function blend(a, b, t) {
  const out = {};
  for (const k of Object.keys(a)) out[k] = k in b ? lerp(a[k], b[k], t) : a[k];
  return out;
}

export function solve(p) {
  const missed = [];
  const hip = p.h, sh = along(hip, dir(p.t), SEG.torso);
  const head = along(sh, dir(p.t + (p.ht || 0)), SEG.neck + SEG.head);
  const arm = (grip, ang, side, name) => {
    if (grip) { const r = reach(sh, grip, SEG.uarm, SEG.farm, side); if (r.missed) missed.push(name); return [r.mid, r.end]; }
    const el = along(sh, dir(ang[0]), SEG.uarm);
    return [el, along(el, dir(ang[1]), SEG.farm)];
  };
  const leg = (foot, ang, side, name) => {
    if (foot) { const r = reach(hip, foot, SEG.thigh, SEG.shin, side); if (r.missed) missed.push(name); return [r.mid, r.end]; }
    const kn = along(hip, dir(ang[0]), SEG.thigh);
    return [kn, along(kn, dir(ang[1]), SEG.shin)];
  };
  const [elF, haF] = arm(p.g, p.a || [180, 180], p.eb ?? 1, 'front hand');
  const [knF, ftF] = leg(p.f, p.l || [180, 180], p.kd ?? 1, 'front foot');
  const hasArmB = p.gb || p.ab, hasLegB = p.fb || p.lb;
  const [elB, haB] = hasArmB ? arm(p.gb, p.ab, p.ebb ?? p.eb ?? 1, 'back hand') : [null, null];
  const [knB, ftB] = hasLegB ? leg(p.fb, p.lb, p.kdb ?? p.kd ?? 1, 'back foot') : [null, null];
  return { hip, sh, head, elF, haF, elB, haB, knF, ftF, knB, ftB, missed };
}

export function frame(fig, t) {
  return solve(blend(fig.a, { ...fig.a, ...fig.b }, t));
}

const STEPS = 8;
const DUR = '2.8s';
const r1 = n => Math.round(n * 10) / 10;

function toe(kn, ft) {
  const d = Math.hypot(ft[0] - kn[0], ft[1] - kn[1]) || 1;
  const vx = (ft[0] - kn[0]) / d, vy = (ft[1] - kn[1]) / d;
  return [ft[0] + vy * SEG.foot, ft[1] - vx * SEG.foot];
}

function attrs(names, series, animate) {
  // series: one array of numbers per attribute, one entry per frame in the loop
  let own = '', kids = '';
  names.forEach((n, i) => {
    const vals = series[i].map(r1);
    own += ' ' + n + '="' + vals[0] + '"';
    if (animate && vals.some(v => v !== vals[0])) kids += '<animate attributeName="' + n + '" dur="' + DUR + '" repeatCount="indefinite" values="' + vals.join(';') + '"/>';
  });
  return [own, kids];
}
function lineEl(fs, pa, pb, animate) {
  const A = fs.map(pa), B = fs.map(pb);
  if (!A[0] || !B[0]) return '';
  const [own, kids] = attrs(['x1', 'y1', 'x2', 'y2'], [A.map(p => p[0]), A.map(p => p[1]), B.map(p => p[0]), B.map(p => p[1])], animate);
  return '<line' + own + (kids ? '>' + kids + '</line>' : '/>');
}
function circleEl(fs, pc, r, animate, cls) {
  const C = fs.map(pc);
  if (!C[0]) return '';
  const [own, kids] = attrs(['cx', 'cy'], [C.map(p => p[0]), C.map(p => p[1])], animate);
  return '<circle' + (cls ? ' class="' + cls + '"' : '') + ' r="' + r + '"' + own + (kids ? '>' + kids + '</circle>' : '/>');
}

function body(fs, animate) {
  const far = lineEl(fs, j => j.hip, j => j.knB, animate) + lineEl(fs, j => j.knB, j => j.ftB, animate)
    + lineEl(fs, j => j.ftB, j => j.ftB && toe(j.knB, j.ftB), animate)
    + lineEl(fs, j => j.sh, j => j.elB, animate) + lineEl(fs, j => j.elB, j => j.haB, animate);
  const near = lineEl(fs, j => j.hip, j => j.sh, animate) + circleEl(fs, j => j.head, SEG.head, animate, 'fig-head')
    + lineEl(fs, j => j.hip, j => j.knF, animate) + lineEl(fs, j => j.knF, j => j.ftF, animate)
    + lineEl(fs, j => j.ftF, j => toe(j.knF, j.ftF), animate)
    + lineEl(fs, j => j.sh, j => j.elF, animate) + lineEl(fs, j => j.elF, j => j.haF, animate);
  return (far ? '<g class="fig-far">' + far + '</g>' : '') + '<g class="fig-near">' + near + '</g>';
}

function fixedProps(props) {
  let s = '<line x1="4" y1="113.4" x2="116" y2="113.4"/>';
  for (const p of props) {
    if (p.k === 'box') s += '<rect x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="' + (112.4 - p.y) + '" rx="1.5"/>';
    if (p.k === 'bench') s += '<rect x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="3.6" rx="1.5"/><line x1="' + (p.x + 5) + '" y1="' + (p.y + 3.6) + '" x2="' + (p.x + 5) + '" y2="113.4"/><line x1="' + (p.x + p.w - 5) + '" y1="' + (p.y + 3.6) + '" x2="' + (p.x + p.w - 5) + '" y2="113.4"/>';
    if (p.k === 'bar') s += '<line x1="' + p.x + '" y1="1" x2="' + p.x + '" y2="' + (p.y - 2.4) + '"/><circle cx="' + p.x + '" cy="' + p.y + '" r="2.4"/>';
    if (p.k === 'anchor') s += '<line x1="' + p.x + '" y1="3" x2="' + p.x + '" y2="113.4"/><circle cx="' + p.x + '" cy="' + p.y + '" r="2.6"/>';
  }
  for (const p of props) {
    if (p.k === 'wheel') s += '<circle cx="' + p.x + '" cy="' + p.y + '" r="' + p.r + '"/>';
    if (p.k === 'seg') s += '<line x1="' + p.p[0] + '" y1="' + p.p[1] + '" x2="' + p.p[2] + '" y2="' + p.p[3] + '"/>';
  }
  for (const p of props) if (p.k === 'water') s += '<path fill="none" d="M4 ' + p.y + ' q7 -2.6 14 0 t14 0 t14 0 t14 0 t14 0 t14 0 t14 0 t14 0"/>';
  return '<g class="fig-prop">' + s + '</g>';
}
function movingProps(props, fs, animate) {
  let lines = '', weights = '';
  for (const p of props) {
    const at = j => j[p.at || 'haF'];
    if (p.k === 'cable') lines += lineEl(fs, () => p.from, j => j[p.to || 'haF'], animate);
    if (p.k === 'disc') weights += circleEl(fs, j => at(j) && [at(j)[0] + (p.dx || 0), at(j)[1] + (p.dy || 0)], p.r || 7, animate);
    if (p.k === 'db') weights += circleEl(fs, at, 3.2, animate);
    if (p.k === 'pad') weights += circleEl(fs, at, 3, animate);
    if (p.k === 'kb') weights += circleEl(fs, j => {
      const h = j.haF, e = j.elF;
      if (p.hang === false) return h;
      const d = Math.hypot(h[0] - e[0], h[1] - e[1]) || 1;
      return [h[0] + (h[0] - e[0]) / d * 5.6, h[1] + (h[1] - e[1]) / d * 5.6];
    }, 4.4, animate);
  }
  return (lines ? '<g class="fig-cable">' + lines + '</g>' : '') + (weights ? '<g class="fig-weight">' + weights + '</g>' : '');
}

export function figureSVG(exId, opts = {}) {
  const fig = FIGS[exId];
  if (!fig) return '';
  const animate = opts.animate !== false;
  const props = fig.props || [];
  const label = (opts.label || exId) + ': start and finish positions';
  let inner = fixedProps(props);
  if (animate) {
    const ks = [0, 0];
    for (let k = 1; k <= STEPS; k++) ks.push(k);
    ks.push(STEPS);
    for (let k = STEPS - 1; k >= 0; k--) ks.push(k);
    const fs = ks.map(k => frame(fig, (1 - Math.cos(Math.PI * k / STEPS)) / 2));
    inner += movingProps(props, fs, true) + body(fs, true);
  } else {
    const end = [frame(fig, 1)], start = [frame(fig, 0)];
    inner += '<g class="fig-ghost">' + movingProps(props, end, false) + body(end, false) + '</g>' + movingProps(props, start, false) + body(start, false);
  }
  return '<svg class="fig" viewBox="0 0 120 120" role="img" aria-label="' + String(label).replace(/"/g, '&quot;') + '">' + inner + '</svg>';
}
