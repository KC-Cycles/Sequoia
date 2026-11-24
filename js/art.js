// Drawings made in code: tree rings, the "your tree" progress cross-section, and the ridgeline scene.
// Everything here returns SVG text and is deterministic, so the same seed always draws the same wood.

function rng(seed) {
  let a = (seed * 2654435761) >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const f1 = n => (Math.round(n * 10) / 10).toFixed(1).replace(/\.0$/, '');

// One wobbly outline shared by every ring of a tree, so the rings nest the way real growth rings do.
function grain(rand) {
  const ph = [rand(), rand(), rand(), rand()].map(v => v * Math.PI * 2);
  return th => 0.55 * Math.sin(th + ph[0]) + 0.3 * Math.sin(2 * th + ph[1]) + 0.2 * Math.sin(3 * th + ph[2]) + 0.1 * Math.sin(5 * th + ph[3]);
}
// A smooth closed path through points on a wobbly ring of mean radius r.
function ringPath(cx, cy, r, shape, wobble, twist) {
  const N = 40, pts = [];
  for (let j = 0; j < N; j++) {
    const th = (j / N) * Math.PI * 2;
    const rr = r * (1 + wobble * shape(th)) + r * 0.008 * Math.sin(7 * th + twist);
    pts.push([cx + rr * Math.cos(th), cy + rr * Math.sin(th)]);
  }
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(pts[N - 1], pts[0]);
  let d = 'M' + f1(m0[0]) + ' ' + f1(m0[1]);
  for (let j = 0; j < N; j++) { const m = mid(pts[j], pts[(j + 1) % N]); d += ' Q' + f1(pts[j][0]) + ' ' + f1(pts[j][1]) + ' ' + f1(m[0]) + ' ' + f1(m[1]); }
  return d + 'Z';
}

// A cross-section of a trunk: uneven growth rings, a pith, a couple of drying cracks and bark.
export function treeRings(opts = {}) {
  const rings = opts.rings || 14, size = opts.size || 400, seed = opts.seed || 1;
  const cx = opts.cx ?? size / 2, cy = opts.cy ?? size / 2;
  const rand = rng(seed), shape = grain(rand), maxR = (opts.maxR || size * 0.46) * 0.92;
  // growth per year: mostly even, with a run of two lean years somewhere
  const lean = 2 + Math.floor(rand() * Math.max(1, rings - 4));
  const grow = Array.from({ length: rings }, (_, i) => (0.6 + rand() * 0.8) * (i === lean || i === lean + 1 ? 0.45 : 1));
  const total = grow.reduce((a, b) => a + b, 0);
  let r = 0, out = '';
  for (let i = 0; i < rings; i++) {
    r += (grow[i] / total) * maxR;
    const wob = 0.075 * Math.min(1, (i + 1) / 3);
    out += '<path class="ring' + (i % 3 === 2 ? ' late' : '') + '" d="' + ringPath(cx, cy, r, shape, wob, rand() * 6.28) + '"/>';
  }
  let cracks = '';
  for (let c = 0; c < 2; c++) {
    const th = rand() * Math.PI * 2, a = maxR * (0.1 + rand() * 0.08), b = maxR * (0.6 + rand() * 0.3), k = (rand() - 0.5) * 0.12;
    const p = t => { const rr = a + (b - a) * t, tt = th + k * Math.sin(t * 3); return f1(cx + rr * Math.cos(tt)) + ' ' + f1(cy + rr * Math.sin(tt)); };
    cracks += '<path class="crack" d="M' + p(0) + ' L' + p(0.35) + ' L' + p(0.7) + ' L' + p(1) + '"/>';
  }
  const bark = '<path class="bark" d="' + ringPath(cx, cy, maxR * 1.045, shape, 0.085, 1.3) + '"/>';
  return '<svg class="rings" viewBox="0 0 ' + size + ' ' + size + '" aria-hidden="true">' + out + bark + cracks + '<circle class="pith" cx="' + f1(cx) + '" cy="' + f1(cy) + '" r="' + f1(Math.max(1.6, size / 170)) + '"/></svg>';
}

const TONES = { squat: 'lower', hinge: 'lower', pull: 'upper', push: 'upper', whole: 'whole', tone: 'light', short: 'light' };

// The progress tree: one ring per logged session, oldest at the center, colored by what it trained.
// sessions: newest first, as the log keeps them.
export function yourTree(sessions, tones = TONES) {
  const C = 120, MAX = 104, PITH = 5;
  const list = (Array.isArray(sessions) ? sessions : []).slice().reverse();
  const shape = grain(rng(11));
  const young = list.length < 8 ? 1.5 : 1;   // a young tree draws its first rings wider so they can be seen
  let widths = list.map(s => Math.max(3, Math.min(7, (Number(s.setsDone) || 15) / 5)) * young);
  const need = widths.reduce((a, b) => a + b, 0);
  if (need > MAX - PITH) widths = widths.map(w => w * (MAX - PITH) / need);
  let r = PITH, out = '';
  list.forEach((s, i) => {
    r += widths[i];
    out += '<path class="ring grown tone-' + (tones[s.group] || 'light') + '" stroke-width="' + f1(Math.max(1, widths[i] * 0.55)) + '" d="' + ringPath(C, C, r - widths[i] / 2, shape, 0.06 * Math.min(1, (i + 2) / 4), i) + '"/>';
  });
  let ghosts = '';
  for (let g = 0; g < 14 && r + 7 <= 100; g++) { r += 7; ghosts += '<path class="ring ghost" d="' + ringPath(C, C, r - 3.5, shape, 0.06, g) + '"/>'; }
  if (!list.length && !ghosts) ghosts = '<path class="ring ghost" d="' + ringPath(C, C, 12, shape, 0.04, 0) + '"/>';
  const label = list.length + (list.length === 1 ? ' ring' : ' rings') + ', one for each session logged';
  return '<svg class="tree" viewBox="0 0 240 240" role="img" aria-label="Your tree: ' + label + '">' + ghosts + out + '<circle class="pith" cx="' + C + '" cy="' + C + '" r="3"/></svg>';
}
