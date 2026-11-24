import test from 'node:test';
import assert from 'node:assert/strict';
import { EXERCISES } from '../js/data/exercises.js';
import { SESSIONS, GROUPS } from '../js/data/sessions.js';
import { NOTES } from '../js/data/notes.js';

const MUSCLES = ['quads', 'glutes', 'hams', 'back', 'chest', 'shoulders', 'arms', 'core'];
const PER = [undefined, 'side', 'sec', 'steps', 'sec / side', 'steps / side', 'each letter'];
const libraryItems = SESSIONS.flatMap(s => s.blocks.flatMap(b => b.items.filter(i => i.ex).map(i => ({ s: s.id, ...i }))));

test('there are 50 sessions with unique ids and a known group', () => {
  assert.equal(SESSIONS.length, 50);
  assert.equal(new Set(SESSIONS.map(s => s.id)).size, 50);
  for (const s of SESSIONS) {
    assert.ok(GROUPS[s.group], s.id + ' group');
    assert.ok(['lower', 'upper', 'whole'].includes(s.lean), s.id + ' lean');
    assert.equal(typeof s.strength, 'boolean');
    assert.ok(s.title && s.sub, s.id + ' copy');
  }
});

test('the library can recommend lower, upper and whole-body strength days', () => {
  for (const lean of ['lower', 'upper', 'whole']) assert.ok(SESSIONS.some(s => s.strength && s.lean === lean), lean);
});

test('every session item points at an exercise in the library', () => {
  for (const it of libraryItems) assert.ok(EXERCISES[it.ex], it.s + ' uses unknown exercise ' + it.ex);
});

test('every item has whole-number sets and reps and a known per unit', () => {
  for (const it of libraryItems) {
    assert.ok(Number.isInteger(it.sets) && it.sets >= 1 && it.sets <= 5, it.s + '/' + it.ex + ' sets');
    assert.ok(Number.isInteger(it.reps) && it.reps >= 1, it.s + '/' + it.ex + ' reps');
    assert.ok(PER.includes(it.per), it.s + '/' + it.ex + ' per ' + it.per);
  }
});

test('items in one block share a set count so rounds line up', () => {
  for (const s of SESSIONS) for (const b of s.blocks) {
    const lib = b.items.filter(i => i.ex);
    if (lib.length > 1) assert.equal(new Set(lib.map(i => i.sets)).size, 1, s.id + ' block ' + b.tag);
  }
});

test('block minutes add up to the session length', () => {
  for (const s of SESSIONS) {
    const sum = s.blocks.reduce((n, b) => n + b.min, 0);
    assert.ok(Math.abs(sum - s.minutes) <= 3, s.id + ' blocks ' + sum + ' vs ' + s.minutes);
  }
});

test('sessions run 42 to 50 minutes, and the two short ones run 25', () => {
  for (const s of SESSIONS) {
    if (s.group === 'short') assert.equal(s.minutes, 25, s.id);
    else if (s.group === 'pair' || s.group === 'thirty') assert.equal(s.minutes, 30, s.id);
    else if (s.group === 'mobility') assert.ok(s.minutes >= 15 && s.minutes <= 25, s.id);
    else if (s.cardio) assert.ok(s.minutes >= 15 && s.minutes <= 90, s.id + ' ' + s.minutes);
    else assert.ok(s.minutes >= 42 && s.minutes <= 50, s.id + ' ' + s.minutes);
  }
  assert.equal(SESSIONS.filter(s => s.group === 'short').length, 2);
});

test('the library matches the design: 4 squat, 4 hinge, 3 pull, 3 push, 4 whole, 2 tone, 2 short', () => {
  const want = { squat: 4, hinge: 4, pull: 3, push: 3, whole: 4, tone: 2, short: 2, pair: 3, thirty: 4, run: 5, swim: 8, bike: 5, mobility: 3 };
  for (const [g, n] of Object.entries(want)) assert.equal(SESSIONS.filter(s => s.group === g).length, n, g);
});

test('every group explains what it trains and when to choose it', () => {
  for (const [g, info] of Object.entries(GROUPS)) {
    assert.ok(info.about && info.about.length > 40, g + ' about');
    assert.ok(info.when && info.when.length > 20, g + ' when');
  }
});

test('no session title uses the dessert joke', () => {
  for (const s of SESSIONS) assert.ok(!/dessert/i.test(JSON.stringify(s)), s.id);
});

test('every exercise has complete how-to content and valid metadata', () => {
  for (const [id, ex] of Object.entries(EXERCISES)) {
    assert.ok(ex.name, id);
    assert.ok(['lb', 'lb each', ''].includes(ex.unit), id + ' unit');
    assert.ok(ex.muscles.length && ex.muscles.every(m => MUSCLES.includes(m)), id + ' muscles');
    assert.ok(ex.setup.length >= 2 && ex.cues.length >= 3 && ex.faults.length >= 3, id + ' how-to');
    assert.ok(ex.feel.length > 10, id + ' feel');
    if (ex.unit) assert.ok(ex.step > 0, id + ' step');
  }
});

test('weighted items carry a generic starting weight, never a personal one', () => {
  for (const it of libraryItems) {
    if (!EXERCISES[it.ex].unit) { assert.equal(it.start, undefined, it.s + '/' + it.ex); continue; }
    assert.ok(typeof it.start === 'number' && it.start >= 0 && it.start <= 95 && it.start % 2.5 === 0, it.s + '/' + it.ex + ' start ' + it.start);
  }
});

test('there are at least twelve field notes, each with a title, body and why', () => {
  assert.ok(NOTES.length >= 40);
  assert.equal(new Set(NOTES.map(n => n.title)).size, NOTES.length);
  for (const topic of [/superset/i, /stretch/i, /push and pull/i, /repair/i]) assert.ok(NOTES.some(n => topic.test(n.title + ' ' + n.body)), String(topic));
  for (const n of NOTES) {
    assert.ok(n.title && n.body.length > 60 && n.why.length > 20, n.title);
  }
});

test('no session uses the same exercise twice, since sets are logged per exercise', () => {
  for (const s of SESSIONS) {
    const ids = s.blocks.flatMap(b => b.items.filter(i => i.ex).map(i => i.ex));
    assert.equal(new Set(ids).size, ids.length, s.id);
  }
});

test('exactly one non-strength session is marked as the recovery session', () => {
  const rec = SESSIONS.filter(s => s.recovery);
  assert.equal(rec.length, 1);
  assert.equal(rec[0].strength, false);
});

test('double-day sessions each name the workout they share a day with and stay off its muscles', () => {
  const pairs = SESSIONS.filter(s => s.group === 'pair');
  assert.deepEqual(pairs.map(s => s.pair).sort(), ['ride', 'run', 'swim']);
  const LOWER = ['quads', 'glutes', 'hams'], SHOULDER = ['shoulders', 'back', 'chest'];
  const muscles = s => s.blocks.flatMap(b => b.items.filter(i => i.ex).flatMap(i => EXERCISES[i.ex].muscles));
  assert.ok(!muscles(pairs.find(s => s.pair === 'run')).some(m => LOWER.includes(m)), 'run day leaves legs alone');
  assert.ok(!muscles(pairs.find(s => s.pair === 'swim')).some(m => SHOULDER.includes(m)), 'swim day leaves shoulders alone');
  for (const s of pairs) assert.equal(s.strength, false);
});

test('thirty-minute sessions cover squat, hinge, pull and push, and never lead the default rotation', () => {
  const t = SESSIONS.filter(s => s.group === 'thirty');
  assert.deepEqual(t.map(s => s.kind).sort(), ['hinge', 'pull', 'push', 'squat']);
  for (const s of t) { assert.equal(s.strength, false); assert.equal(s.lean, s.kind === 'squat' || s.kind === 'hinge' ? 'lower' : 'upper'); }
});

test('runs and swims are guided sessions: no lifts, unique step ids, and timers that ping partway', () => {
  const cardio = SESSIONS.filter(s => s.cardio);
  assert.equal(cardio.length, 20);
  for (const s of cardio) {
    assert.equal(s.strength, false); assert.ok(['run', 'swim', 'bike', 'mobility'].includes(s.group), s.id);
    const items = s.blocks.flatMap(b => b.items);
    assert.ok(items.every(i => !i.ex && i.id && i.name && i.rx && i.note), s.id + ' steps');
    assert.equal(new Set(items.map(i => i.id)).size, items.length, s.id + ' ids');
    for (const i of items) for (const p of i.pings || []) assert.ok(p[0] > 0 && p[0] < i.timer && p[1], s.id + '/' + i.id + ' ping');
    if (s.group === 'run' || s.group === 'bike') assert.ok(items.some(i => i.timer >= 600 && (i.half || (i.pings || []).length)), s.id + ' needs a main timer that pings');
  }
});

test('every swim teaches its drills step by step', () => {
  for (const s of SESSIONS.filter(x => x.group === 'swim')) {
    const taught = s.blocks.flatMap(b => b.items).filter(i => Array.isArray(i.how) && i.how.length >= 3);
    assert.ok(taught.length >= 3, s.id + ' has ' + taught.length + ' taught drills');
  }
});

import { FIGS as ALLFIGS } from '../js/data/figs.js';
test('the drills-only swim shows a stick figure for every drill', () => {
  const d = SESSIONS.find(s => s.id === 'swim-drills');
  const items = d.blocks.flatMap(b => b.items);
  assert.ok(items.length >= 8);
  for (const i of items) { assert.ok(i.fig && ALLFIGS[i.fig], d.id + '/' + i.id + ' figure'); assert.ok(Array.isArray(i.how) && i.how.length >= 3, i.id + ' how-to'); }
});

test('the long swims add up to the distance in their title', () => {
  for (const [id, metres] of [['swim-1600', 1600], ['swim-1800', 1800], ['swim-2000', 2000]]) {
    const s = SESSIONS.find(x => x.id === id);
    const total = s.blocks.flatMap(b => b.items).reduce((n, i) => n + i.metres, 0);
    assert.equal(total, metres, id);
    assert.ok(s.title.includes(metres.toLocaleString('en-US') + ' m'), s.title);
  }
});

test('a session never promises a different length in its summary than its total', () => {
  for (const s of SESSIONS.filter(x => x.group === 'run' || x.group === 'bike')) assert.ok(s.sub.includes(String(s.minutes)) || s.sub.toLowerCase().includes('in all'), s.id + ': ' + s.sub);
});

test('mobility and core: two guided mobility flows with timers, and one core session of real exercises', () => {
  const m = SESSIONS.filter(s => s.group === 'mobility');
  assert.equal(m.filter(s => s.cardio).length, 2);
  for (const s of m.filter(x => x.cardio)) assert.ok(s.blocks.flatMap(b => b.items).every(i => i.timer && Array.isArray(i.how)), s.id);
  const core = m.find(s => !s.cardio);
  assert.ok(core.blocks.flatMap(b => b.items).filter(i => i.ex).length >= 5);
});

test('every step of every session has a stick figure, not only the lifts', () => {
  for (const s of SESSIONS) for (const b of s.blocks) for (const i of b.items) {
    if (i.ex) continue;
    assert.ok(i.fig && ALLFIGS[i.fig], s.id + '/' + i.id + ' (' + i.name + ') has no figure');
  }
});
