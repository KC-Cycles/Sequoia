import test from 'node:test';
import assert from 'node:assert/strict';
import { num, lastEntries, nextTarget, hoursSince, recommend, week, liftTable, logText, localDate } from '../js/engine.js';

const H = 3600e3;
const NOW = new Date(2026, 10, 25, 18, 0, 0).getTime(); // Wed Nov 25 2026, 6pm local

const EX = {
  squat: { name: 'Back squat', unit: 'lb', muscles: ['quads', 'glutes'], step: 5, milestones: [95, 115, 135] },
  rdl: { name: 'Romanian deadlift', unit: 'lb each', muscles: ['hams', 'glutes'], step: 5 },
  row: { name: 'Row', unit: 'lb', muscles: ['back', 'arms'], step: 5 },
  press: { name: 'Press', unit: 'lb', muscles: ['shoulders', 'arms'], step: 2.5 },
  pushup: { name: 'Push-up', unit: '', muscles: ['chest', 'arms'], step: 0 },
  deadbug: { name: 'Dead bug', unit: '', muscles: ['core'], step: 0 }
};
const SESS = [
  { id: 'legs', group: 'squat', lean: 'lower', strength: true, title: 'Legs', blocks: [{ items: [{ ex: 'squat', sets: 3, reps: 8, start: 65 }, { ex: 'rdl', sets: 3, reps: 10, start: 20 }] }] },
  { id: 'legs2', group: 'hinge', lean: 'lower', strength: true, title: 'Hinge', blocks: [{ items: [{ ex: 'rdl', sets: 3, reps: 10, start: 20 }] }] },
  { id: 'pull', group: 'pull', lean: 'upper', strength: true, title: 'Pull', blocks: [{ items: [{ ex: 'row', sets: 3, reps: 10, start: 20 }, { ex: 'press', sets: 3, reps: 8, start: 10 }] }] },
  { id: 'whole', group: 'whole', lean: 'whole', strength: true, title: 'Whole', blocks: [{ items: [{ ex: 'squat', sets: 3, reps: 6 }, { ex: 'row', sets: 3, reps: 10 }] }] },
  { id: 'tone', group: 'tone', lean: 'lower', strength: false, title: 'Tone', blocks: [{ items: [{ ex: 'squat', sets: 3, reps: 15 }] }] }
];

function item(ex, w, r, n = 3, opt = {}) {
  const sets = [];
  for (let i = 0; i < n; i++) sets.push({ w, r, done: true });
  return { ex, name: EX[ex] ? EX[ex].name : ex, unit: EX[ex] ? EX[ex].unit : 'lb', reps: opt.reps ?? r, feel: opt.feel || '', sets };
}
function sess(sessionId, hoursAgo, items) {
  const at = NOW - hoursAgo * H;
  return { id: 's' + at, sessionId, group: 'x', title: sessionId, date: localDate(at), at, durationSec: 3000, setsDone: 9, setsTotal: 9, items };
}
const squatItem = SESS[0].blocks[0].items[0];

test('num parses field values and rejects blank, text and negatives', () => {
  assert.equal(num('85'), 85);
  assert.equal(num('17.5'), 17.5);
  assert.equal(num(0), 0);
  assert.equal(num(''), null);
  assert.equal(num('abc'), null);
  assert.equal(num('-5'), null);
  assert.equal(num(null), null);
  assert.equal(num(undefined), null);
});

test('lastEntries returns newest first with the session date', () => {
  const hist = [sess('legs', 100, [item('squat', 80, 8)]), sess('legs', 20, [item('squat', 85, 8)])];
  const got = lastEntries(hist, 'squat', 2);
  assert.equal(got.length, 2);
  assert.equal(got[0].sets[0].w, 85);
  assert.equal(got[0].date, localDate(NOW - 20 * H));
  assert.equal(lastEntries(hist, 'row').length, 0);
});

test('nextTarget with no history uses the starting guess', () => {
  const t = nextTarget([], EX.squat, squatItem);
  assert.equal(t.weight, 65);
  assert.match(t.why, /Starting guess/);
});

test('nextTarget goes up one step when every set hit the target reps', () => {
  const t = nextTarget([sess('legs', 50, [item('squat', 85, 8)])], EX.squat, squatItem);
  assert.equal(t.weight, 90);
  assert.match(t.why, /Up 5 lb/);
});

test('nextTarget holds when one set fell short of the target reps', () => {
  const it = item('squat', 85, 8);
  it.sets[2].r = 6;
  const t = nextTarget([sess('legs', 50, [it])], EX.squat, squatItem);
  assert.equal(t.weight, 85);
});

test('nextTarget holds when a set was left unchecked', () => {
  const it = item('squat', 85, 8);
  it.sets[2].done = false;
  const t = nextTarget([sess('legs', 50, [it])], EX.squat, squatItem);
  assert.equal(t.weight, 85);
});

test('nextTarget holds after a single too-hard rating even with all reps', () => {
  const t = nextTarget([sess('legs', 50, [item('squat', 85, 8, 3, { feel: 'hard' })])], EX.squat, squatItem);
  assert.equal(t.weight, 85);
});

test('nextTarget drops 10 percent after two too-hard ratings in a row', () => {
  const hist = [sess('legs', 120, [item('squat', 100, 8, 3, { feel: 'hard' })]), sess('legs', 50, [item('squat', 100, 8, 3, { feel: 'hard' })])];
  const t = nextTarget(hist, EX.squat, squatItem);
  assert.equal(t.weight, 90);
  assert.match(t.why, /10 percent/);
});

test('nextTarget ignores sets saved with no weight', () => {
  const it = item('squat', null, 8);
  const t = nextTarget([sess('legs', 50, [it])], EX.squat, squatItem);
  assert.equal(t.weight, 65);
  assert.ok(!String(t.weight).includes('NaN'));
});

test('nextTarget gives no weight for bodyweight exercises', () => {
  const t = nextTarget([], EX.pushup, { ex: 'pushup', sets: 3, reps: 8 });
  assert.equal(t.weight, null);
});

test('hoursSince is Infinity when nothing is logged', () => {
  const h = hoursSince([], SESS, EX, NOW);
  assert.equal(h.lower, Infinity);
  assert.equal(h.upper, Infinity);
});

test('hoursSince counts a region only when it got at least four sets', () => {
  const hist = [sess('legs', 20, [item('squat', 85, 8), item('rdl', 30, 10), item('press', 15, 8, 2)])];
  const h = hoursSince(hist, SESS, EX, NOW);
  assert.equal(h.lower, 20);
  assert.equal(h.upper, Infinity);
});

test('recommend starts with the first lower strength session when nothing is logged', () => {
  const r = recommend(SESS, EX, [], NOW);
  assert.equal(r.sessionId, 'legs');
  assert.equal(r.rest, false);
  assert.ok(r.why.length > 10);
});

test('recommend picks upper body when legs worked 20 hours ago', () => {
  const hist = [sess('legs', 20, [item('squat', 85, 8), item('rdl', 30, 10)])];
  const r = recommend(SESS, EX, hist, NOW);
  assert.equal(r.sessionId, 'pull');
  assert.match(r.why, /legs/i);
});

test('recommend keeps lifting when both halves were only lightly worked', () => {
  const hist = [sess('legs', 30, [item('squat', 85, 8), item('rdl', 30, 10)]), sess('pull', 10, [item('row', 25, 10), item('press', 15, 8)])];
  const r = recommend(SESS, EX, hist, NOW);
  assert.equal(r.rest, false);
  assert.equal(r.sessionId, 'legs2');
});

test('after a legs day with some arm work, the next day is upper body, not rest', () => {
  const hist = [sess('legs', 19, [item('squat', 85, 8), item('rdl', 30, 10, 3), item('squat', 85, 8, 5), item('rdl', 30, 10, 6), item('press', 15, 8), item('row', 15, 12, 6)])];
  const r = recommend(SESS, EX, hist, NOW);
  assert.equal(r.rest, false);
  assert.equal(r.sessionId, 'pull');
  assert.match(r.why, /legs/i);
});

test('when both halves did heavy work in the last two days, recommend a light session, not rest', () => {
  const heavy = h => sess('whole', h, [item('squat', 85, 8, 5), item('rdl', 30, 10, 5), item('row', 25, 10, 5), item('press', 15, 8, 5)]);
  const lib = SESS.concat([{ id: 'reset', group: 'short', lean: 'whole', strength: false, recovery: true, title: 'Reset', blocks: [{ items: [{ ex: 'deadbug', sets: 2, reps: 8 }] }] }]);
  const r = recommend(lib, EX, [heavy(20)], NOW);
  assert.equal(r.rest, false);
  assert.equal(r.light, true);
  assert.equal(r.sessionId, 'reset');
});

test('five hard days in a row earns a rest day that still names what is next', () => {
  const day = d => sess(d % 2 ? 'legs' : 'pull', d * 24 + 2, d % 2 ? [item('squat', 85, 8, 5), item('rdl', 30, 10, 5)] : [item('row', 25, 10, 5), item('press', 15, 8, 5)]);
  const five = [0, 1, 2, 3, 4].map(day), four = [0, 1, 2, 3].map(day);
  const r = recommend(SESS, EX, five, NOW);
  assert.equal(r.rest, true);
  assert.equal(r.sessionId, null);
  assert.ok(r.next && r.next.sessionId);
  assert.match(r.why, /five hard days/i);
  assert.equal(recommend(SESS, EX, four, NOW).rest, false);
});

test('hard outside days count toward the five-day streak', () => {
  const lifts = [1, 3].map(d => sess('legs', d * 24 + 2, [item('squat', 85, 8, 5), item('rdl', 30, 10, 5)]));
  const rides = [0, 2, 4].map(d => ({ at: NOW - (d * 24 + 3) * H, lean: 'lower', label: 'Ride' }));
  assert.equal(recommend(SESS, EX, lifts, NOW, rides).rest, true);
});

test('recommend rotates to the lower session done least recently', () => {
  const hist = [sess('legs', 60, [item('squat', 85, 8), item('rdl', 30, 10)]), sess('pull', 55, [item('row', 25, 10), item('press', 15, 8), item('row', 25, 10)])];
  const r = recommend(SESS, EX, hist, NOW);
  assert.equal(r.sessionId, 'legs2');
});

test('recommend never picks a non-strength session by itself', () => {
  const r = recommend(SESS.filter(s => s.id === 'tone' || s.id === 'pull'), EX, [], NOW);
  assert.equal(r.sessionId, 'pull');
});

test('recommend offers a whole-body day after four days off', () => {
  const hist = [sess('legs', 120, [item('squat', 85, 8), item('rdl', 30, 10)]), sess('pull', 110, [item('row', 25, 10), item('press', 15, 8)])];
  const r = recommend(SESS, EX, hist, NOW);
  assert.equal(r.sessionId, 'whole');
});

test('recommend treats outside load as training for that region', () => {
  const r = recommend(SESS, EX, [], NOW, [{ at: NOW - 10 * H, lean: 'lower' }]);
  assert.equal(r.sessionId, 'pull');
});

test('recommend and liftTable skip sessions and exercises that left the library', () => {
  const hist = [sess('gone', 20, [item('mystery', 50, 8), item('squat', 85, 8)])];
  assert.doesNotThrow(() => recommend(SESS, EX, hist, NOW));
  const rows = liftTable(hist, EX, SESS);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].ex, 'squat');
});

test('week returns seven days ending today and keeps two sessions on one day', () => {
  const hist = [sess('legs', 9, [item('squat', 85, 8)]), sess('pull', 2, [item('row', 25, 10)])];
  const w = week(hist, NOW);
  assert.equal(w.length, 7);
  assert.equal(w[6].date, localDate(NOW));
  assert.equal(w[6].sessions.length, 2);
  assert.equal(w[0].sessions.length, 0);
});

test('liftTable reports last, best, next target and the next milestone', () => {
  const hist = [sess('legs', 200, [item('squat', 90, 8)]), sess('legs', 50, [item('squat', 85, 8)])];
  const row = liftTable(hist, EX, SESS).find(r => r.ex === 'squat');
  assert.equal(row.last, 85);
  assert.equal(row.best, 90);
  assert.equal(row.next, 90);
  assert.equal(row.milestone, 95);
  assert.equal(row.unit, 'lb');
});

test('logText lists each set and never prints NaN or null', () => {
  const it = item('squat', 85, 8);
  it.sets[1].w = null;
  const txt = logText([sess('legs', 50, [it, item('pushup', null, 8)])], '2026-11-25');
  assert.match(txt, /Back squat/);
  assert.match(txt, /85 x 8/);
  assert.ok(!/NaN|null|undefined/.test(txt));
});

test('localDate uses the local calendar day', () => {
  assert.equal(localDate(new Date(2026, 10, 25, 23, 30).getTime()), '2026-11-25');
  assert.equal(localDate(new Date(2026, 0, 5, 0, 10).getTime()), '2026-01-05');
});

// ---- round 2: outside activity, status, next-up, rotation ----
import { status } from '../js/engine.js';

test('outside activity older than 24 hours no longer blocks a region', () => {
  const r = recommend(SESS, EX, [], NOW, [{ at: NOW - 30 * H, lean: 'lower' }]);
  assert.equal(r.sessionId, 'legs');
});

test('status grades each half as ready, lightly worked or recovering', () => {
  const hist = [sess('legs', 20, [item('squat', 85, 8, 5), item('rdl', 30, 10, 5), item('press', 15, 8)])];
  const s = status(hist, EX, NOW);
  assert.equal(s.lower.state, 'recovering');
  assert.equal(s.lower.hours, 20);
  assert.equal(s.lower.readyAt, NOW + 28 * H);
  assert.equal(s.lower.by, 'legs');
  assert.equal(s.upper.state, 'light');
  assert.equal(status([], EX, NOW).upper.state, 'ready');
  assert.equal(status([], EX, NOW).upper.readyAt, null);
});

test('among sessions not done yet, recommend prefers the group trained least recently', () => {
  const mk = (id, group) => ({ id, group, lean: 'lower', strength: true, title: id, blocks: [{ items: [{ ex: 'squat', sets: 3, reps: 8, start: 65 }] }] });
  const lib = [mk('sqA', 'squat'), mk('sqB', 'squat'), mk('hgA', 'hinge'), SESS[2]];
  const hist = [sess('sqA', 60, [item('squat', 85, 8), item('rdl', 30, 10)]), sess('pull', 55, [item('row', 25, 10), item('press', 15, 8), item('row', 25, 10)])];
  const r = recommend(lib, EX, hist, NOW);
  assert.equal(r.sessionId, 'hgA');
});

import { withoutLoggedLifts } from '../js/engine.js';

test('a Strava weight-training entry is dropped when the same workout is already in the log', () => {
  const hist = [sess('legs', 20, [item('squat', 85, 8)])];
  const end = NOW - 20 * H;
  const acts = [
    { sport: 'Weight training', end: end - 0.5 * H, text: 'same workout' },
    { sport: 'Weight training', end: end - 30 * H, text: 'a class somewhere else' },
    { sport: 'Ride', end: end - 0.2 * H, text: 'ride home' }
  ];
  assert.deepEqual(withoutLoggedLifts(hist, acts).map(a => a.text), ['a class somewhere else', 'ride home']);
});

// ---- round 4: pounds lifted, comparisons, set-by-set feel ----
import { volume, compare, adviseSet, itemFeel } from '../js/engine.js';

test('volume adds weight times reps for done sets, doubling pairs of dumbbells and per-side reps', () => {
  const items = [
    { ex: 'squat', unit: 'lb', per: '', sets: [{ w: 70, r: 8, done: true }, { w: 70, r: 8, done: true }, { w: 70, r: 8, done: false }] },   // 1120
    { ex: 'rdl', unit: 'lb each', per: '', sets: [{ w: 25, r: 10, done: true }] },                                                        // 500
    { ex: 'press', unit: 'lb', per: 'side', sets: [{ w: 10, r: 8, done: true }] },                                                        // 160
    { ex: 'stepup', unit: 'lb each', per: 'side', sets: [{ w: 10, r: 8, done: true }] },                                                  // 320
    { ex: 'carry', unit: 'lb', per: 'steps / side', sets: [{ w: 35, r: 20, done: true }] },                                               // not reps
    { ex: 'plank', unit: '', per: 'sec', sets: [{ w: null, r: 30, done: true }] },
    { ex: 'curl', unit: 'lb', per: '', sets: [{ w: null, r: 12, done: true }, { w: 50, r: null, done: true }] }
  ];
  assert.equal(volume(items), 2100);
  assert.equal(volume([]), 0);
});

test('compare names something that weighs about as much', () => {
  assert.equal(compare(13100).text, 'an African elephant');
  assert.equal(compare(3100).text, 'a compact car');
  assert.equal(compare(2400).text, '1.2 bison');
  assert.equal(compare(7000).text, '1.4 pickup trucks');
  assert.equal(compare(50), null);
  assert.equal(compare(NaN), null);
});

test('adviseSet turns an easy set into a heavier next set, and holds otherwise', () => {
  const easy = adviseSet('easy', 85, 5);
  assert.equal(easy.next, 90);
  assert.match(easy.text, /90 lb/);
  assert.equal(adviseSet('right', 85, 5).next, null);
  assert.equal(adviseSet('hard', 85, 5).next, null);
  assert.match(adviseSet('hard', 85, 5).text, /85 lb/);
  assert.equal(adviseSet('easy', null, 0).next, null);
  assert.ok(adviseSet('easy', null, 0).text.length > 10);
});

test('itemFeel is the feel of the last set that was rated', () => {
  assert.equal(itemFeel([{ done: true, feel: 'easy' }, { done: true, feel: 'hard' }, { done: true, feel: '' }]), 'hard');
  assert.equal(itemFeel([{ done: true }, { done: false }]), '');
});

test('after raising the weight mid-session, the next target starts where she finished', () => {
  const it = item('squat', 65, 8);
  it.sets[1].w = 70; it.sets[2].w = 70;
  const t = nextTarget([sess('legs', 50, [it])], EX.squat, squatItem);
  assert.equal(t.weight, 70);
  assert.match(t.why, /finished/i);
});

// ---- round 6: thirty-minute sessions keep the squat / hinge rotation honest ----
import { SESSIONS as LIB } from '../js/data/sessions.js';
import { EXERCISES as LIBEX } from '../js/data/exercises.js';
test('a thirty-minute squat session counts as a squat day when the next leg day is chosen', () => {
  const now = Date.UTC(2026, 10, 20, 18), H = 3600e3;
  const sets = n => Array.from({ length: n }, () => ({ w: 50, r: 8, done: true }));
  const hist = [
    { id: 'u', sessionId: 'pull-core', group: 'pull', date: '2026-11-19', at: now - 20 * H, items: [{ ex: 'row', unit: 'lb', reps: 8, sets: sets(12) }] },
    { id: 'l', sessionId: 'squat-30', group: 'squat', date: '2026-11-17', at: now - 80 * H, items: [{ ex: 'squat', unit: 'lb', reps: 8, sets: sets(12) }] }
  ];
  const rec = recommend(LIB, LIBEX, hist, now, []);
  assert.equal(rec.lean, 'lower');
  assert.equal(LIB.find(s => s.id === rec.sessionId).group, 'hinge');
});

// ---- round 7: timers that ping partway through ----
import { pingPlan, duePing } from '../js/engine.js';
test('pingPlan puts a halfway ping in the middle and keeps custom pings in order', () => {
  assert.deepEqual(pingPlan({ timer: 1320, half: true }), [{ at: 660, label: 'Halfway' }]);
  assert.deepEqual(pingPlan({ timer: 720, pings: [[120, 'Fast'], [20, 'Easy']] }), [{ at: 20, label: 'Easy' }, { at: 120, label: 'Fast' }]);
  assert.deepEqual(pingPlan({ timer: 60 }), []);
  assert.deepEqual(pingPlan({ timer: 100, pings: [[150, 'Late']] }), []);
});
test('duePing fires each ping once, in order, as time passes', () => {
  const plan = pingPlan({ timer: 600, half: true, pings: [[60, 'Fast']] });
  assert.equal(duePing(plan, 30, 0), null);
  assert.deepEqual(duePing(plan, 61, 0), { at: 60, label: 'Fast' });
  assert.equal(duePing(plan, 61, 1), null);
  assert.deepEqual(duePing(plan, 400, 1), { at: 300, label: 'Halfway' });
  assert.equal(duePing(plan, 400, 2), null);
});
