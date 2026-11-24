// Coaching analysis: numbers and specific places to improve, worked out from the lifting log and
// the Strava snapshot. Pure functions, so every rule here is covered by tests/coach.test.js.
import { num, volume } from './engine.js';

const DAY = 864e5;
export const MUSCLE_ORDER = ['quads', 'glutes', 'hams', 'back', 'chest', 'shoulders', 'arms', 'core'];
export const MUSCLE_NAME = { quads: 'Quads', glutes: 'Glutes', hams: 'Hamstrings', back: 'Back', chest: 'Chest', shoulders: 'Shoulders', arms: 'Arms', core: 'Core' };
// A common guideline: about ten hard sets per muscle each week once you lift regularly.
export const WEEKLY_SETS = 10;

const when = s => (Number.isFinite(s.at) ? s.at : Date.parse(s.date + 'T12:00:00') || 0);
const done = it => (it.sets || []).filter(x => x && x.done);
const within = (history, now, from, to) => (history || []).filter(s => { const age = now - when(s); return age >= from * DAY && age < to * DAY; });

// Epley estimate of the most you could lift once, from a set of several reps.
export function estimate1RM(weight, reps) {
  const w = num(weight), r = num(reps);
  if (w === null || r === null || r < 1) return null;
  return r === 1 ? w : Math.round(w * (1 + Math.min(r, 12) / 30));
}

// Hard sets per muscle: a full set for the exercise's main muscle, half a set for each helper.
export function muscleSets(history, exercises, now, days = 14) {
  const out = Object.fromEntries(MUSCLE_ORDER.map(m => [m, 0]));
  for (const s of within(history, now, 0, days)) {
    for (const it of s.items || []) {
      const ex = exercises[it.ex];
      if (!ex) continue;
      const n = done(it).length;
      ex.muscles.forEach((m, i) => { if (m in out) out[m] += i === 0 ? n : n / 2; });
    }
  }
  return out;
}

function span(history, now, from, to) {
  const list = within(history, now, from, to);
  return { sessions: list.length, sets: list.reduce((n, s) => n + (s.items || []).reduce((k, it) => k + done(it).length, 0), 0), pounds: list.reduce((n, s) => n + volume(s.items), 0) };
}
export function weekly(history, now) { return { now: span(history, now, 0, 7), before: span(history, now, 7, 14) }; }

export function cardio(activities, now, days = 14) {
  const out = { Ride: { count: 0, minutes: 0 }, Run: { count: 0, minutes: 0 }, Swim: { count: 0, minutes: 0 } };
  for (const a of activities || []) {
    const t = new Date(a.start).getTime();
    if (!Number.isFinite(t) || now - t > days * DAY || t > now + DAY || !out[a.sport]) continue;
    out[a.sport].count++; out[a.sport].minutes += Math.round((a.movingSec || 0) / 60);
  }
  return out;
}

// One row per weighted lift: latest top weight, the first one logged, and a one-rep estimate.
export function lifts(history, exercises) {
  const rows = new Map();
  const hist = [...(history || [])].sort((a, b) => when(b) - when(a));
  for (const s of hist) {
    for (const it of s.items || []) {
      const ex = exercises[it.ex];
      if (!ex || !ex.unit) continue;
      const best = done(it).filter(x => num(x.w) !== null && num(x.r) !== null).sort((a, b) => num(b.w) - num(a.w) || num(b.r) - num(a.r))[0];
      if (!best) continue;
      const w = num(best.w), r = num(best.r);
      const row = rows.get(it.ex) || { ex: it.ex, name: ex.name, unit: ex.unit, last: w, lastReps: r, est: estimate1RM(w, r), times: 0, feel: it.feel || '', weights: [] };
      row.first = w; row.times++; row.weights.push(w);
      rows.set(it.ex, row);
    }
  }
  return [...rows.values()].map(r => ({ ...r, change: r.last - r.first })).sort((a, b) => b.est - a.est);
}

const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many || one + 's');
const listWords = a => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);

// Specific things to work on, most important first. Each has a title, the numbers behind it, and one action.
export function insights(history, exercises, activities, now) {
  const hist = history || [];
  if (!hist.length) {
    return [{ id: 'start', rank: 0, title: 'Log your first session', detail: 'There is nothing to analyze yet. One finished session is enough to start tracking lifts, muscle balance and total pounds.', action: 'Start the session on Today.' }];
  }
  const out = [];
  const m14 = muscleSets(hist, exercises, now, 14), m28 = muscleSets(hist, exercises, now, 28);
  const recent = within(hist, now, 0, 14).length;

  const missing = ['back', 'chest', 'hams', 'quads', 'glutes', 'shoulders', 'core'].filter(m => m28[m] === 0);
  if (missing.length) {
    const upper = missing.some(m => m === 'back'), names = missing.map(m => MUSCLE_NAME[m].toLowerCase());
    out.push({ id: 'untrained', rank: 1, title: 'No direct work yet for your ' + listWords(names.slice(0, 3)),
      detail: 'In the last four weeks you logged no sets where ' + (names.length === 1 ? 'this muscle is' : 'these muscles are') + ' the main mover: ' + listWords(names) + '.',
      action: upper ? 'Do a pull day next. It covers your back and biceps.' : missing.includes('chest') || missing.includes('shoulders') ? 'Do a push day next.' : missing.includes('hams') ? 'Do a hinge day next.' : missing.includes('core') ? 'Pick a session with a core block, or add a plank and a carry.' : 'Do a squat day next.' });
  }
  if (recent < 4) {
    out.push({ id: 'frequency', rank: 2, title: 'Lift twice a week',
      detail: plural(recent, 'session') + ' in the last 14 days. Two a week is about the smallest dose that keeps strength climbing, because each muscle then gets worked every three to four days.',
      action: recent >= 2 ? 'Hold this rhythm for one more week.' : 'Fit in a second session this week, even a thirty-minute one.' });
  }
  const pull = m28.back, push = m28.chest + m28.shoulders;
  if (pull + push >= 8 && Math.min(pull, push) < 0.6 * Math.max(pull, push)) {
    const low = pull < push ? 'pulling' : 'pushing';
    out.push({ id: 'push-pull', rank: 3, title: 'Even out pushing and pulling',
      detail: 'Last four weeks: ' + pull + ' pulling sets (back) against ' + push + ' pushing sets (chest and shoulders). Close to even keeps shoulders healthy.',
      action: 'Make your next upper-body day a ' + (low === 'pulling' ? 'pull' : 'push') + ' day.' });
  }
  const knee = m28.quads, hip = m28.hams;
  if (knee + hip >= 8 && Math.min(knee, hip) < 0.5 * Math.max(knee, hip)) {
    out.push({ id: 'squat-hinge', rank: 4, title: 'Balance the front and back of your legs',
      detail: 'Last four weeks: ' + knee + ' sets led by your quads against ' + hip + ' led by your hamstrings.',
      action: 'Make your next leg day a ' + (hip < knee ? 'hinge' : 'squat') + ' day.' });
  }
  const rows = lifts(hist, exercises);
  const easy = rows.filter(r => r.feel === 'easy');
  if (easy.length) {
    out.push({ id: 'easy', rank: 5, title: 'Add weight where it felt easy',
      detail: 'You rated ' + listWords(easy.slice(0, 3).map(r => r.name.toLowerCase())) + ' as too easy last time.',
      action: 'Next time, go up one step on ' + (easy.length === 1 ? 'that lift' : 'those lifts') + ' from the first set.' });
  }
  const stuck = rows.filter(r => r.times >= 3 && r.weights[0] === r.weights[1] && r.weights[1] === r.weights[2]);
  if (stuck.length) {
    out.push({ id: 'stalled', rank: 6, title: 'Unstick ' + stuck[0].name.toLowerCase(),
      detail: 'The same weight three sessions running: ' + stuck[0].last + ' lb.',
      action: 'Keep the weight and add one rep per set until you can add two, then go up.' });
  }
  const c = cardio(activities, now, 14);
  const total = c.Ride.count + c.Run.count + c.Swim.count;
  const absent = ['Run', 'Swim', 'Ride'].filter(k => c[k].count === 0);
  if (total >= 3 && absent.length) {
    const have = ['Ride', 'Run', 'Swim'].filter(k => c[k].count).map(k => plural(c[k].count, k.toLowerCase()));
    out.push({ id: 'cardio-mix', rank: 7, title: 'Your cardio is all ' + (absent.length === 2 ? { Ride: 'on the bike', Run: 'running', Swim: 'in the pool' }[['Ride', 'Run', 'Swim'].find(k => c[k].count)] : 'in two sports'),
      detail: 'Last 14 days: ' + listWords(have) + ', and no ' + listWords(absent.map(k => k.toLowerCase() + 's')).replace(' and ', ' or ') + '. If you train for all three, the missing one is where fitness is cheapest to gain.',
      action: 'Add one short ' + absent[0].toLowerCase() + ' this week. The library has guided ' + absent[0].toLowerCase() + 's, and a ' + absent[0] + '-day strength session to pair with it.' });
  }
  if (m14.core === 0 && !missing.includes('core')) {
    out.push({ id: 'core', rank: 8, title: 'Bring back the core work', detail: 'No core sets in the last two weeks.', action: 'Pick a session with a core block, or add a plank and a carry.' });
  }
  return out.sort((a, b) => a.rank - b.rank);
}

// Riegel's formula: a time over one distance predicts a time over a longer one.
export function riegel(sec, fromKm, toKm) { return Math.round(sec * Math.pow(toKm / fromKm, 1.06)); }
export function timeText(sec) {
  const s = Math.round(sec), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return (h ? h + ':' + String(m).padStart(2, '0') : String(m)) + ':' + String(r).padStart(2, '0');
}
export function paceText(secPerUnit) { return timeText(Math.floor(secPerUnit)); }
