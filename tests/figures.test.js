import test from 'node:test';
import assert from 'node:assert/strict';
import { SEG, frame, figureSVG } from '../js/figures.js';
import { FIGS } from '../js/data/figs.js';
import { SESSIONS } from '../js/data/sessions.js';
import { EXERCISES } from '../js/data/exercises.js';

const used = [...new Set(SESSIONS.flatMap(s => s.blocks.flatMap(b => b.items.filter(i => i.ex).map(i => i.ex))))];
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const TS = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];

test('every exercise used in a session has a figure', () => {
  for (const id of used) assert.ok(FIGS[EXERCISES[id].fig || id], 'no figure for ' + id);
});

test('limbs keep their length through the whole movement', () => {
  for (const id of Object.keys(FIGS)) for (const t of TS) {
    const j = frame(FIGS[id], t);
    const check = (a, b, len, what) => { if (a && b) assert.ok(Math.abs(dist(a, b) - len) < 0.6, id + ' ' + what + ' at t=' + t + ': ' + dist(a, b).toFixed(2)); };
    check(j.hip, j.sh, SEG.torso, 'torso');
    check(j.sh, j.elF, SEG.uarm, 'front upper arm'); check(j.elF, j.haF, SEG.farm, 'front forearm');
    check(j.sh, j.elB, SEG.uarm, 'back upper arm'); check(j.elB, j.haB, SEG.farm, 'back forearm');
    check(j.hip, j.knF, SEG.thigh, 'front thigh'); check(j.knF, j.ftF, SEG.shin, 'front shin');
    check(j.hip, j.knB, SEG.thigh, 'back thigh'); check(j.knB, j.ftB, SEG.shin, 'back shin');
  }
});

test('planted hands and feet stay where the pose puts them', () => {
  for (const id of Object.keys(FIGS)) for (const t of TS) {
    const j = frame(FIGS[id], t);
    assert.deepEqual(j.missed, [], id + ' cannot reach ' + j.missed.join(', ') + ' at t=' + t);
  }
});

test('every joint stays inside the drawing', () => {
  for (const id of Object.keys(FIGS)) for (const t of TS) {
    const j = frame(FIGS[id], t);
    for (const k of ['hip', 'sh', 'head', 'elF', 'haF', 'elB', 'haB', 'knF', 'ftF', 'knB', 'ftB']) {
      const p = j[k];
      if (!p) continue;
      const pad = k === 'head' ? SEG.head + 1 : 2;
      assert.ok(p[0] >= pad && p[0] <= 120 - pad && p[1] >= pad && p[1] <= 118, id + ' ' + k + ' out of frame at t=' + t + ': ' + p.map(n => n.toFixed(1)));
    }
  }
});

test('figureSVG returns an animated svg for a known exercise', () => {
  const svg = figureSVG('squat');
  assert.match(svg, /^<svg /);
  assert.match(svg, /<animate /);
  assert.match(svg, /role="img"/);
});

test('figureSVG without animation shows both positions and no animate tags', () => {
  const svg = figureSVG('squat', { animate: false });
  assert.match(svg, /^<svg /);
  assert.ok(!svg.includes('<animate'));
  assert.match(svg, /class="fig-ghost"/);
});

test('figureSVG returns an empty string for an unknown exercise', () => {
  assert.equal(figureSVG('nope'), '');
});
