import test from 'node:test';
import assert from 'node:assert/strict';
import { treeRings, yourTree } from '../js/art.js';

const paths = svg => [...svg.matchAll(/<path class="ring[^"]*" d="([^"]+)"/g)].map(m => m[1]);
function radii(d, cx, cy) {
  const nums = d.match(/-?\d+(\.\d+)?/g).map(Number), out = [];
  for (let i = 0; i + 1 < nums.length; i += 2) out.push(Math.hypot(nums[i] - cx, nums[i + 1] - cy));
  return out;
}

test('treeRings draws the number of rings asked for', () => {
  assert.equal(paths(treeRings({ rings: 12, seed: 4 })).length, 12);
});

test('treeRings is the same for the same seed and different for another', () => {
  assert.equal(treeRings({ rings: 8, seed: 4 }), treeRings({ rings: 8, seed: 4 }));
  assert.notEqual(treeRings({ rings: 8, seed: 4 }), treeRings({ rings: 8, seed: 5 }));
});

test('rings are irregular, not circles: each ring varies in radius by more than 4 percent', () => {
  const svg = treeRings({ rings: 10, seed: 2, size: 400, cx: 200, cy: 200 });
  for (const d of paths(svg).slice(2)) {
    assert.ok(!/A/.test(d), 'no circular arcs');
    const r = radii(d, 200, 200), lo = Math.min(...r), hi = Math.max(...r);
    assert.ok((hi - lo) / hi > 0.04, 'ring too round: ' + ((hi - lo) / hi).toFixed(3));
  }
});

test('ring spacing is uneven, like good and lean growing years', () => {
  const svg = treeRings({ rings: 12, seed: 6, size: 400, cx: 200, cy: 200 });
  const mean = paths(svg).map(d => { const r = radii(d, 200, 200); return r.reduce((a, b) => a + b, 0) / r.length; });
  const gaps = mean.slice(1).map((m, i) => m - mean[i]);
  assert.ok(gaps.every(g => g > 0), 'rings grow outward');
  assert.ok(Math.max(...gaps) / Math.min(...gaps) > 1.5, 'gaps too even');
});

test('treeRings includes a pith and at least one radial crack', () => {
  const svg = treeRings({ rings: 10, seed: 2 });
  assert.match(svg, /class="pith"/);
  assert.match(svg, /class="crack"/);
});

test('yourTree draws one ring per logged session, colored by what it trained', () => {
  const svg = yourTree([{ group: 'squat', setsDone: 32 }, { group: 'pull', setsDone: 25 }, { group: 'whole', setsDone: 20 }]);
  assert.equal(paths(svg).filter(d => d).length >= 3, true);
  assert.equal((svg.match(/class="ring grown/g) || []).length, 3);
  assert.match(svg, /tone-lower/);
  assert.match(svg, /tone-upper/);
  assert.match(svg, /tone-whole/);
});

test('yourTree with no sessions still draws a seedling and the rings to come', () => {
  const svg = yourTree([]);
  assert.match(svg, /^<svg /);
  assert.equal((svg.match(/class="ring grown/g) || []).length, 0);
  assert.ok((svg.match(/class="ring ghost/g) || []).length >= 3);
});

test('yourTree stays inside its box however many sessions are logged', () => {
  const many = Array.from({ length: 120 }, (_, i) => ({ group: i % 2 ? 'squat' : 'pull', setsDone: 30 }));
  const svg = yourTree(many);
  for (const d of paths(svg)) for (const r of radii(d, 120, 120)) assert.ok(r <= 118, 'ring leaves the box: ' + r.toFixed(1));
});

test('a young tree shows the rings still to come, out to most of its box', () => {
  const svg = yourTree([{ group: 'squat', setsDone: 32 }]);
  assert.ok((svg.match(/class="ring ghost/g) || []).length >= 8);
});
