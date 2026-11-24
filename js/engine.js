// Coaching logic. Pure functions only: no DOM, no storage, no clock except the `now` passed in.

const HOUR = 3600e3;
const LOWER = ['quads', 'glutes', 'hams'];
const UPPER = ['back', 'chest', 'shoulders', 'arms'];
const RECOVERY_HOURS = 48;
const LONG_BREAK_HOURS = 96;
const MIN_SETS_TO_COUNT = 4;
const OUTSIDE_HOURS = 24;
const HEAVY_SETS = 10;        // sets on one half of the body in two days that count as heavy work
const REST_AFTER_DAYS = 5;    // hard days in a row before the coach calls a rest day

export function num(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function localDate(ms) {
  const d = new Date(ms);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function when(s) {
  if (Number.isFinite(s.at)) return s.at;
  const t = Date.parse(String(s.date) + 'T12:00:00');
  return Number.isFinite(t) ? t : 0;
}
function sorted(history) {
  return (Array.isArray(history) ? history : []).filter(s => s && Array.isArray(s.items)).slice().sort((a, b) => when(b) - when(a));
}
function doneSets(item) {
  return (item.sets || []).filter(s => s && s.done);
}

export function lastEntries(history, exId, n = 1) {
  const out = [];
  for (const s of sorted(history)) {
    for (const it of s.items) {
      if (it.ex === exId && doneSets(it).length) { out.push({ ...it, date: s.date, at: when(s) }); break; }
    }
    if (out.length >= n) break;
  }
  return out;
}

function sustained(entry) {
  const ws = doneSets(entry).map(s => num(s.w)).filter(w => w !== null);
  return ws.length ? Math.min(...ws) : null;
}
function fmtStep(n) { return String(Math.round(n * 100) / 100); }

export function nextTarget(history, ex, item) {
  if (!ex || !ex.unit) return { weight: null, why: '' };
  const start = { weight: num(item.start), why: 'Starting guess. Adjust it after your first set.' };
  const prior = lastEntries(history, item.ex, 2);
  if (!prior.length) return start;
  const last = prior[0];
  const base = sustained(last);
  if (base === null) return start;
  const step = ex.step || 5;
  const done = doneSets(last);
  const allDone = done.length === last.sets.length;
  const target = num(last.reps);
  const hitReps = target !== null && done.every(s => num(s.r) !== null && num(s.r) >= target);
  if (last.feel === 'hard' && prior[1] && prior[1].feel === 'hard') {
    return { weight: Math.max(step, Math.round((base * 0.9) / step) * step), why: 'Down 10 percent to rebuild after two hard sessions.' };
  }
  const top = topWeight(last);
  if (top !== null && top !== base) return { weight: top, why: 'Start where you finished last time: every set at this weight.' };
  if (allDone && hitReps && last.feel !== 'hard') {
    return { weight: base + step, why: 'Up ' + fmtStep(step) + ' lb: you hit every rep last time.' };
  }
  if (last.feel === 'hard') return { weight: base, why: 'Same weight: last time felt too hard.' };
  return { weight: base, why: 'Same weight: finish every rep before adding more.' };
}

// Sets per region for one logged session, counting only exercises still in the library.
function regionSets(session, exercises) {
  let lower = 0, upper = 0;
  for (const it of session.items) {
    const ex = exercises[it.ex];
    if (!ex) continue;
    const n = doneSets(it).length;
    if (ex.muscles.some(m => LOWER.includes(m))) lower += n;
    if (ex.muscles.some(m => UPPER.includes(m))) upper += n;
  }
  return { lower, upper };
}

function load(history, exercises, now, ext) {
  const out = { lower: Infinity, upper: Infinity, lowerSets: 0, upperSets: 0, lowerRecent: 0, upperRecent: 0, lowerUntil: 0, upperUntil: 0, lowerBy: null, upperBy: null };
  const mark = (k, hrs, at, windowHours, by) => {
    if (hrs < out[k]) { out[k] = hrs; out[k + 'By'] = by; }
    out[k + 'Until'] = Math.max(out[k + 'Until'], at + windowHours * HOUR);
  };
  for (const s of sorted(history)) {
    const hrs = (now - when(s)) / HOUR;
    if (hrs < 0) continue;
    const r = regionSets(s, exercises);
    for (const k of ['lower', 'upper']) {
      if (r[k] >= MIN_SETS_TO_COUNT) mark(k, hrs, when(s), RECOVERY_HOURS, s.title || s.sessionId);
      if (hrs < RECOVERY_HOURS) out[k + 'Recent'] += r[k];
      if (hrs <= 168) out[k + 'Sets'] += r[k];
    }
  }
  // A hard run, ride or swim counts as heavy work for its half of the body, for a shorter window than lifting.
  for (const e of ext || []) {
    if (!e || (e.lean !== 'lower' && e.lean !== 'upper')) continue;
    const hrs = (now - e.at) / HOUR;
    if (hrs >= 0 && hrs < OUTSIDE_HOURS) { mark(e.lean, hrs, e.at, OUTSIDE_HOURS, e.label || 'outside training'); out[e.lean + 'Recent'] += HEAVY_SETS; }
  }
  out.lowerState = grade(out.lowerRecent); out.upperState = grade(out.upperRecent);
  return out;
}
// ready: nothing in the last two days. light: some work, fine to train again. recovering: heavy work, give it time.
function grade(recentSets) { return recentSets >= HEAVY_SETS ? 'recovering' : recentSets > 0 ? 'light' : 'ready'; }

export function hoursSince(history, sessions, exercises, now, ext = []) {
  const l = load(history, exercises, now, ext);
  return { lower: l.lower, upper: l.upper };
}

// Where each half of the body stands right now.
export function status(history, exercises, now, ext = []) {
  const l = load(history, exercises, now, ext);
  const one = k => ({ hours: l[k], state: l[k + 'State'], readyAt: l[k + 'State'] === 'ready' ? null : l[k + 'Until'] || null, by: l[k + 'By'] });
  return { lower: one('lower'), upper: one('upper') };
}

// Consecutive days, ending today or yesterday, with a real lifting session or a hard outside effort.
export function hardStreak(history, now, ext = []) {
  const days = new Set();
  for (const s of sorted(history)) {
    const done = s.items.reduce((n, it) => n + doneSets(it).length, 0);
    if (done >= HEAVY_SETS) days.add(localDate(when(s)));
  }
  for (const e of ext || []) if (e && Number.isFinite(e.at) && e.at <= now) days.add(localDate(e.at));
  const d = new Date(now); d.setHours(12, 0, 0, 0);
  if (!days.has(localDate(d.getTime()))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(localDate(d.getTime()))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

function ago(hours) {
  if (hours < 20) return Math.max(1, Math.round(hours)) + ' hours ago';
  const d = Math.round(hours / 24);
  return d <= 1 ? 'yesterday' : d + ' days ago';
}

// Least recently done first; among sessions never done, the group trained least recently first.
function pick(sessions, history, lean) {
  const lastDone = {}, groupLast = {};
  // A thirty-minute session counts as the kind of day it is (squat, hinge, pull or push).
  const groupOf = Object.fromEntries(sessions.map(s => [s.id, s.kind || s.group]));
  for (const s of sorted(history)) {
    if (!(s.sessionId in lastDone)) lastDone[s.sessionId] = when(s);
    const g = groupOf[s.sessionId];
    if (g && !(g in groupLast)) groupLast[g] = when(s);
  }
  const strength = sessions.filter(s => s.strength);
  for (const want of [lean, 'lower', 'upper', 'whole']) {
    const pool = strength.filter(s => s.lean === want);
    if (!pool.length) continue;
    pool.sort((a, b) => (lastDone[a.id] || 0) - (lastDone[b.id] || 0) || (groupLast[a.group] || 0) - (groupLast[b.group] || 0));
    return { sessionId: pool[0].id, lean: want };
  }
  return { sessionId: null, lean: null };
}

// A light session for days when both halves are recovering: mobility and core first, then any circuit.
function pickLight(sessions, history) {
  const lastDone = {};
  for (const s of sorted(history)) if (!(s.sessionId in lastDone)) lastDone[s.sessionId] = when(s);
  const pool = sessions.filter(s => !s.strength);
  pool.sort((a, b) => (b.recovery ? 1 : 0) - (a.recovery ? 1 : 0) || (lastDone[a.id] || 0) - (lastDone[b.id] || 0));
  return pool.length ? pool[0].id : null;
}

export function recommend(sessions, exercises, history, now, ext = []) {
  const l = load(history, exercises, now, ext);
  const never = l.lower === Infinity && l.upper === Infinity;
  const by = k => (l[k + 'By'] ? ' (' + l[k + 'By'] + ')' : '');
  let lean, why;
  if (never) { lean = 'lower'; why = 'Nothing is logged yet, so start with legs.'; }
  else if (l.lowerState === 'recovering' && l.upperState !== 'recovering') { lean = 'upper'; why = 'Your legs did the heavy work ' + ago(l.lower) + by('lower') + ', so today is upper body.'; }
  else if (l.upperState === 'recovering' && l.lowerState !== 'recovering') { lean = 'lower'; why = 'Your upper body did the heavy work ' + ago(l.upper) + by('upper') + ', so today is legs.'; }
  else if (l.lowerState === 'recovering' && l.upperState === 'recovering') { lean = null; }
  else if (l.lower !== Infinity && l.upper !== Infinity && l.lower >= LONG_BREAK_HOURS && l.upper >= LONG_BREAK_HOURS) {
    lean = 'whole'; why = 'It has been ' + ago(Math.min(l.lower, l.upper)).replace(' ago', '') + ' since you lifted. A whole-body day gets everything moving again.';
  }
  else {
    const upperFirst = l.upperRecent !== l.lowerRecent ? l.upperRecent < l.lowerRecent
      : l.upperSets !== l.lowerSets ? l.upperSets < l.lowerSets : l.upper > l.lower;
    lean = upperFirst ? 'upper' : 'lower';
    const other = upperFirst ? 'lower' : 'upper', name = { lower: 'legs', upper: 'upper body' };
    why = l[other + 'Recent'] > 0
      ? 'Your ' + name[other] + ' worked ' + ago(l[other]) + by(other) + ', so today is ' + name[lean] + '.'
      : 'Everything is rested, and your ' + name[lean] + (lean === 'lower' ? ' have' : ' has') + ' had less work this week.';
  }

  const normal = lean ? pick(sessions, history, lean) : pick(sessions, history, l.lowerUntil <= l.upperUntil ? 'lower' : 'upper');
  const streak = hardStreak(history, now, ext);
  if (streak >= REST_AFTER_DAYS) {
    const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'];
    return { sessionId: null, rest: true, light: false, lean: null, streak,
      why: 'That is ' + (words[streak] || streak) + ' hard days in a row. Take today off from lifting. Your easy rides still count as moving.',
      next: { sessionId: normal.sessionId, lean: normal.lean, readyAt: null } };
  }
  if (!lean) {
    const lightId = pickLight(sessions, history);
    const base = { rest: !lightId, light: !!lightId, lean: null, streak, next: { sessionId: normal.sessionId, lean: normal.lean, readyAt: Math.min(l.lowerUntil, l.upperUntil) } };
    return { ...base, sessionId: lightId,
      why: 'Your legs and your upper body both did heavy work in the last two days. ' + (lightId ? 'A light session keeps you moving while they rebuild.' : 'Keep today easy while they rebuild.') };
  }
  if (!normal.sessionId) return { sessionId: null, rest: false, light: false, lean: null, streak, why: 'No strength sessions are in the library yet.' };
  return { sessionId: normal.sessionId, rest: false, light: false, lean: normal.lean, streak, why };
}

export function week(history, now) {
  const days = [];
  const base = new Date(now);
  base.setHours(12, 0, 0, 0);
  for (let i = 6; i >= 0; i--) {
    const d = new Date(base.getTime() - i * 24 * HOUR);
    days.push({ date: localDate(d.getTime()), label: 'SMTWTFS'[d.getDay()], sessions: [] });
  }
  const byDate = Object.fromEntries(days.map(d => [d.date, d]));
  for (const s of sorted(history).reverse()) {
    if (byDate[s.date]) byDate[s.date].sessions.push({ group: s.group, title: s.title });
  }
  return days;
}

function topWeight(entry) {
  const ws = doneSets(entry).map(s => num(s.w)).filter(w => w !== null);
  return ws.length ? Math.max(...ws) : null;
}
function findItem(sessions, exId) {
  for (const s of sessions) for (const b of s.blocks || []) for (const it of b.items || []) if (it.ex === exId) return it;
  return null;
}

export function liftTable(history, exercises, sessions) {
  const rows = [], seen = new Set();
  const hist = sorted(history);
  for (const s of hist) {
    for (const it of s.items) {
      const ex = exercises[it.ex];
      if (!ex || !ex.unit || seen.has(it.ex)) continue;
      const last = topWeight(it);
      if (last === null) continue;
      seen.add(it.ex);
      let best = last;
      for (const s2 of hist) for (const it2 of s2.items) if (it2.ex === it.ex) { const w = topWeight(it2); if (w !== null && w > best) best = w; }
      const item = findItem(sessions, it.ex) || { ex: it.ex };
      const next = nextTarget(history, ex, item).weight;
      const milestone = (ex.milestones || []).find(m => m > best) ?? null;
      rows.push({ ex: it.ex, name: ex.name, unit: ex.unit, last, best, next, milestone });
    }
  }
  return rows;
}

function clock(sec) {
  sec = Math.max(0, Math.round(sec || 0));
  return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
}
const FEEL = { easy: 'too easy', right: 'just right', hard: 'too hard' };

export function logText(history, today) {
  const lines = ['Sequoia log, exported ' + today, ''];
  for (const s of sorted(history).slice(0, 20)) {
    lines.push(s.date + ' | ' + s.title + ' | ' + clock(s.durationSec) + ' | ' + (s.setsDone || 0) + ' of ' + (s.setsTotal || 0) + ' sets');
    for (const it of s.items) {
      const done = doneSets(it);
      if (!done.length) continue;
      const sets = done.map(x => {
        const w = num(x.w), r = num(x.r);
        return (w !== null ? w + ' x ' : '') + (r !== null ? r : '?');
      }).join(', ');
      const per = it.per ? ' ' + it.per : (it.unit ? '' : ' reps');
      lines.push('- ' + it.name + ' [' + it.ex + ']: ' + sets + (it.unit ? ' (' + it.unit + ')' : '') + per + ' | ' + done.length + '/' + it.sets.length + ' sets' + (FEEL[it.feel] ? ' | felt ' + FEEL[it.feel] : ''));
    }
    lines.push('');
  }
  return lines.join('\n');
}

// Strava also records lifting. Drop a weight-training entry that ended within three hours of a session
// already in the log, so the same workout is not listed or counted twice.
export function withoutLoggedLifts(history, activities) {
  const ends = sorted(history).map(when);
  return (activities || []).filter(a => !(a.sport === 'Weight training' && ends.some(t => Math.abs(t - a.end) <= 3 * HOUR)));
}

// Total pounds moved: weight times reps for every finished set. A pair of dumbbells counts twice,
// and so do reps done on each side. Timed holds and carries are left out.
export function volume(items) {
  let total = 0;
  for (const it of items || []) {
    if (!it || !it.unit || /sec|steps/.test(it.per || '')) continue;
    const mult = (it.unit === 'lb each' ? 2 : 1) * (it.per === 'side' ? 2 : 1);
    for (const x of doneSets(it)) { const w = num(x.w), r = num(x.r); if (w !== null && r !== null) total += w * r * mult; }
  }
  return Math.round(total);
}

// Rough, well-known weights to put a total in perspective.
const THINGS = [
  [200, 'a newborn elephant', 'newborn elephants'], [500, 'a grizzly bear', 'grizzly bears'], [1000, 'a grand piano', 'grand pianos'],
  [2000, 'a bison', 'bison'], [3000, 'a compact car', 'compact cars'], [5000, 'a pickup truck', 'pickup trucks'],
  [13000, 'an African elephant', 'African elephants'], [30000, 'a city bus', 'city buses'], [66000, 'a humpback whale', 'humpback whales'],
  [300000, 'a blue whale', 'blue whales']
];
export function compare(lb) {
  if (!Number.isFinite(lb) || lb < THINGS[0][0] * 0.9) return null;
  let pick = THINGS[0];
  for (const t of THINGS) if (lb >= t[0] * 0.9) pick = t;
  const ratio = lb / pick[0];
  return { ratio, text: ratio < 1.15 ? pick[1] : (Math.round(ratio * 10) / 10) + ' ' + pick[2] };
}

// What to do with the next set, from how the last one felt.
export function adviseSet(feel, weight, step) {
  const w = num(weight), inc = step || 5;
  if (w === null) {
    if (feel === 'easy') return { next: null, text: 'Too easy: add a rep or slow the lowering on your next set.' };
    if (feel === 'hard') return { next: null, text: 'Tough one. Take a few extra breaths before the next set.' };
    return { next: null, text: 'Right on target. Same again.' };
  }
  if (feel === 'easy') return { next: w + inc, text: 'Go up to ' + (w + inc) + ' lb for your next set.' };
  if (feel === 'hard') return { next: null, text: 'Stay at ' + w + ' lb. If the next set is hard too, take ' + inc + ' lb off.' };
  return { next: null, text: 'Right on target. Stay at ' + w + ' lb.' };
}

export function itemFeel(sets) {
  let out = '';
  for (const x of sets || []) if (x && FEEL[x.feel]) out = x.feel;
  return out;
}

// Pings partway through a long timer: one at halfway if asked for, plus any listed as [seconds, label].
export function pingPlan(item) {
  const total = num(item && item.timer);
  if (total === null) return [];
  const plan = ((item.pings || []).map(p => ({ at: p[0], label: p[1] }))).concat(item.half ? [{ at: total / 2, label: 'Halfway' }] : []);
  return plan.filter(p => p.at > 0 && p.at < total).sort((a, b) => a.at - b.at);
}
// The next ping that has come due, given how many have already sounded.
export function duePing(plan, elapsedSec, fired) {
  const p = plan[fired];
  return p && elapsedSec >= p.at ? p : null;
}
