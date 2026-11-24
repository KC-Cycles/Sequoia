import test from 'node:test';
import assert from 'node:assert/strict';
import { estimate1RM, muscleSets, weekly, cardio, lifts, insights } from '../js/coach.js';
import { EXERCISES } from '../js/data/exercises.js';

const NOW = Date.UTC(2026, 10, 23, 20), D = 864e5;
const sets = (n, w, r, feel) => Array.from({ length: n }, () => ({ w, r, done: true, feel: feel || '' }));
const S = (id, daysAgo, items, group = 'squat') => ({ id, sessionId: id, group, date: '2026-11-22', at: NOW - daysAgo * D, items });
const legs = S('a', 1, [
  { ex: 'squat', name: 'Barbell back squat', unit: 'lb', reps: 8, per: '', feel: '', sets: sets(3, 70, 8) },
  { ex: 'curl', name: 'Leg curl', unit: 'lb', reps: 12, per: '', feel: 'easy', sets: sets(3, 60, 12, 'easy') },
  { ex: 'hammer', name: 'Hammer curl', unit: 'lb each', reps: 12, per: '', feel: '', sets: sets(3, 10, 12) }
]);
const ride = (daysAgo, min, hard) => ({ start: new Date(NOW - daysAgo * D).toISOString().slice(0, 19), movingSec: min * 60, elapsedSec: min * 60, sport: 'Ride', text: 'Ride · ' + (min / 5).toFixed(1) + ' mi · ' + min + ' min', hard: !!hard, lean: hard ? 'lower' : null });

test('estimate1RM uses the Epley formula and leaves a single alone', () => {
  assert.equal(estimate1RM(100, 1), 100);
  assert.equal(estimate1RM(90, 6), 108);
  assert.equal(estimate1RM(null, 8), null);
});

test('muscleSets counts a full set for the main muscle and half for helpers, inside the window', () => {
  const m = muscleSets([legs, S('old', 30, legs.items)], EXERCISES, NOW, 14);
  assert.equal(m.quads, 3); assert.equal(m.glutes, 1.5); assert.equal(m.hams, 3); assert.equal(m.arms, 3);
  assert.equal(m.back, 0); assert.equal(m.chest, 0);
});

test('weekly compares the last seven days with the seven before', () => {
  const w = weekly([legs, S('b', 9, legs.items)], NOW);
  assert.equal(w.now.sessions, 1); assert.equal(w.before.sessions, 1);
  assert.equal(w.now.sets, 9);
  assert.equal(w.now.pounds, 70 * 8 * 3 + 60 * 12 * 3 + 20 * 12 * 3);
});

test('cardio totals each sport over two weeks', () => {
  const c = cardio([ride(1, 20), ride(2, 144, true), ride(20, 60, true), { ...ride(3, 30), sport: 'Swim', text: 'Swim · 0.5 mi · 30 min' }], NOW, 14);
  assert.equal(c.Ride.count, 2); assert.equal(c.Ride.minutes, 164); assert.equal(c.Swim.count, 1);
  assert.equal(c.Run.count, 0);
});

test('lifts lists each weighted lift with its estimate and change since the first time', () => {
  const later = S('c', 0.2, [{ ex: 'squat', name: 'Barbell back squat', unit: 'lb', reps: 8, per: '', feel: '', sets: sets(3, 75, 8) }]);
  const rows = lifts([later, legs], EXERCISES);
  const sq = rows.find(r => r.ex === 'squat');
  assert.equal(sq.last, 75); assert.equal(sq.first, 70); assert.equal(sq.change, 5); assert.equal(sq.est, estimate1RM(75, 8)); assert.equal(sq.times, 2);
});

test('insights: an empty log asks for a first session and nothing else', () => {
  const out = insights([], EXERCISES, [], NOW);
  assert.equal(out.length, 1); assert.equal(out[0].id, 'start');
});

test('insights: a legs-and-arms log points at the untrained back and chest, the easy lift, and frequency', () => {
  const ids = insights([legs], EXERCISES, [], NOW).map(i => i.id);
  assert.ok(ids.includes('untrained')); assert.ok(ids.includes('easy')); assert.ok(ids.includes('frequency'));
  const un = insights([legs], EXERCISES, [], NOW).find(i => i.id === 'untrained');
  assert.match(un.title + un.detail, /back/i);
  assert.match(un.action, /pull/i);
});

test('insights: cardio that is all on the bike points at the missing swim and run', () => {
  const acts = [ride(1, 20), ride(2, 144, true), ride(4, 20), ride(6, 98, true)];
  const c = insights([legs], EXERCISES, acts, NOW).find(i => i.id === 'cardio-mix');
  assert.ok(c); assert.match(c.detail, /4 rides/); assert.match(c.detail, /no runs? or swims?|0 runs/i);
  assert.equal(insights([legs], EXERCISES, [ride(1, 20)], NOW).find(i => i.id === 'cardio-mix'), undefined);
});

test('insights come back most important first, each with a title, detail and action', () => {
  const out = insights([legs], EXERCISES, [ride(1, 20), ride(2, 144, true), ride(4, 20)], NOW);
  for (const i of out) assert.ok(i.title && i.detail && i.action, i.id);
  assert.deepEqual(out.map(i => i.rank), [...out.map(i => i.rank)].sort((a, b) => a - b));
});

import { riegel, paceText, timeText } from '../js/coach.js';
test('riegel predicts a longer race from a shorter one, and formats times and paces', () => {
  assert.equal(riegel(1500, 5, 10), 3127);
  assert.equal(riegel(1500, 5, 21.0975), 6900);
  assert.equal(timeText(1500), '25:00'); assert.equal(timeText(6900), '1:55:00');
  assert.equal(paceText(540), '9:00'); assert.equal(paceText(630.4), '10:30');
});
