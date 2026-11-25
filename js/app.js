// Screens and events. All coaching decisions come from engine.js; this file only draws and listens.
import { EXERCISES } from './data/exercises.js';
import { SESSIONS, GROUPS } from './data/sessions.js';
import { NOTES } from './data/notes.js';
import { figureSVG } from './figures.js';
import { num, nextTarget, lastEntries, recommend, status, week, liftTable, logText, localDate, withoutLoggedLifts, volume, compare, adviseSet, itemFeel, pingPlan, duePing } from './engine.js';
import { createStore } from './store.js';
import { insights, weekly, muscleSets, cardio, lifts, MUSCLE_ORDER, MUSCLE_NAME, WEEKLY_SETS, riegel, timeText, paceText } from './coach.js';
import { VERSION } from './version.js';
import { loadConfig, saveConfig, clearConfig, createSync, syncLog, validRepo, guessRepo } from './sync.js';
import { treeRings, yourTree } from './art.js';

/* ---------- setup ---------- */
function safeStorage() {
  try { const k = '__sequoia_probe'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return localStorage; }
  catch (e) { const mem = {}; return { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } }; }
}
const storage = safeStorage();
const store = createStore(storage);
const st = store.state;
const FEEL = { easy: 'Too easy', right: 'Just right', hard: 'Too hard' };
// Sessions keep the title they were logged under; show the library's current name instead.
function refreshTitles() { let changed = false; for (const h of st.history) { const cur = SESSIONS.find(x => x.id === h.sessionId); if (cur && h.title !== cur.title) { h.title = cur.title; changed = true; } } if (changed) store.save(); }
const LEAN = { lower: 'Lower body', upper: 'Upper body', whole: 'Whole body' };
const calm = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clock = sec => { sec = Math.max(0, Math.round(sec || 0)); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); };
const nice = date => { try { return new Date(date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); } catch (e) { return date; } };
const list = arr => '<ul>' + (arr || []).map(s => '<li>' + esc(s) + '</li>').join('') + '</ul>';
const byId = id => SESSIONS.find(s => s.id === id) || null;
const tone = s => 'tone-' + ((GROUPS[s.group] || {}).tone || 'light');
const libItems = s => s.blocks.flatMap(b => b.items.filter(i => i.ex));
const warmItems = s => s.blocks.flatMap(b => b.items.filter(i => !i.ex));

function perText(it) {
  return it.per === 'side' ? ' / side' : it.per ? ' ' + it.per : '';
}
function rxText(it) { return it.ex ? it.sets + ' × ' + it.reps + perText(it) : it.rx; }
function repUnit(it) { return /sec/.test(it.per || '') ? 'sec' : /steps/.test(it.per || '') ? 'steps' : 'reps'; }
function show(w, unit) { return w === null || w === undefined ? '' : w + ' ' + (unit || 'lb'); }

/* ---------- active session ---------- */
// Time spent in the session, not counting pauses.
function elapsedMs(a) { return a && a.start ? Math.max(0, (a.end || a.pauseAt || Date.now()) - a.start - (a.paused || 0)) : 0; }
function pauseSession() { const a = st.active; if (!a || !a.start || a.end || a.pauseAt) return; a.auto = false; a.pauseAt = Date.now(); hideDock(); letSleep(); store.save(); }
function resumeSession() { const a = st.active; if (!a || !a.pauseAt) return; a.paused = (a.paused || 0) + (Date.now() - a.pauseAt); a.pauseAt = 0; keepAwake(); store.save(); }
function startSession(id) {
  const s = byId(id);
  if (!s) return;
  if (!st.active || st.active.sessionId !== id) st.active = { sessionId: id, start: 0, end: 0, sets: {}, checks: {}, feel: {}, why: {} };
  ensureActive(s);
  store.save();
  location.hash = 'workout';
  route();
}
function ensureActive(s) {
  const a = st.active;
  a.sets = a.sets || {}; a.checks = a.checks || {}; a.feel = a.feel || {}; a.why = a.why || {};
  for (const it of libItems(s)) {
    if (!Array.isArray(a.sets[it.ex]) || a.sets[it.ex].length !== it.sets) {
      const t = nextTarget(st.history, EXERCISES[it.ex], it);
      a.why[it.ex] = t.why;
      a.sets[it.ex] = Array.from({ length: it.sets }, () => ({ w: t.weight === null ? '' : String(t.weight), r: String(it.reps), done: false }));
    }
  }
  for (const it of warmItems(s)) {
    if (!Array.isArray(a.checks[it.id]) || a.checks[it.id].length !== it.sets) a.checks[it.id] = Array.from({ length: it.sets }, () => false);
  }
}
function activeSession() {
  if (!st.active) return null;
  const s = byId(st.active.sessionId);
  if (!s) { st.active = null; store.save(); return null; }
  ensureActive(s);
  return s;
}
function blockCounts(b) {
  const a = st.active; let d = 0, t = 0;
  for (const it of b.items) {
    const arr = it.ex ? a.sets[it.ex].map(x => x.done) : a.checks[it.id];
    t += arr.length; d += arr.filter(Boolean).length;
  }
  return { d, t };
}

/* ---------- outside activity (Strava, carried in by Claude) ---------- */
let outside = { asOf: null, list: [] };
const actEnd = a => new Date(a.start).getTime() + (a.elapsedSec || 0) * 1000;
function setOutside(d) {
  if (!d || !Array.isArray(d.activities)) return false;
  outside = { asOf: d.asOf || null, fitness: d.fitness && typeof d.fitness === 'object' ? d.fitness : null, list: d.activities.filter(a => a && typeof a.start === 'string' && Number.isFinite(new Date(a.start).getTime())) };
  return true;
}
// Hard or long runs, rides and swims count as training for the coach's recovery rule.
// Outside activity minus any lifting the log already holds.
const outsideSeen = () => withoutLoggedLifts(st.history, outside.list.map(a => ({ ...a, end: actEnd(a) })));
const outsideLoad = () => outside.list.filter(a => a.hard && (a.lean === 'lower' || a.lean === 'upper')).map(a => ({ at: actEnd(a), lean: a.lean, label: a.text }));

/* ---------- shared decoration ---------- */
const TOPO = '<div class="topo">' + treeRings({ rings: 10, seed: 5, size: 220 }) + '</div>';
// The illustrated backdrop behind every page; css/app.css picks the picture for each view.
const scene = document.createElement('div');
scene.className = 'scene';
scene.setAttribute('aria-hidden', 'true');
document.body.prepend(scene);

/* ---------- Today ---------- */
function whenText(ms) {
  const d = new Date(ms);
  const day = localDate(ms) === localDate(Date.now()) ? 'today' : d.toLocaleDateString(undefined, { weekday: 'long' });
  return day + ' at ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
function workedText(hours) {
  if (hours === Infinity) return 'Not trained yet';
  if (hours < 1) return 'Worked within the hour';
  if (hours < 20) return 'Worked ' + Math.round(hours) + ' hours ago';
  const d = Math.round(hours / 24);
  return 'Worked ' + (d <= 1 ? 'yesterday' : d + ' days ago');
}
const STATE = { ready: 'Ready', light: 'Lightly worked', recovering: 'Recovering' };
function whereRow(name, r) {
  const tail = r.state === 'recovering' ? ' Ready for heavy work ' + esc(whenText(r.readyAt)) + '.' : r.state === 'light' ? ' Fine to train again.' : '';
  return '<div class="where-row"><span class="state ' + r.state + '">' + STATE[r.state] + '</span><div><strong>' + name + '</strong>'
    + '<span class="small">' + esc(workedText(r.hours)) + (r.by ? ': ' + esc(r.by) : '') + '.' + tail + '</span></div></div>';
}
function recentList(now) {
  const since = now - 7 * 864e5, rows = [], minor = {};
  for (const h of st.history) { const at = h.at || new Date(h.date + 'T12:00:00').getTime(); if (at >= since) rows.push({ at, text: 'Lift · ' + h.title, tag: '' }); }
  for (const a of outsideSeen()) {
    const at = actEnd(a);
    if (at < since || at > now + 6e5) continue;
    // Everything from today and yesterday is listed. Older short efforts are counted in one line.
    const fresh = localDate(at) >= localDate(now - 864e5);
    if (a.hard || (a.movingSec || 0) >= 1500 || fresh) rows.push({ at, text: a.text, tag: a.hard && a.lean ? (a.lean === 'lower' ? 'counts as leg work' : 'counts as upper-body work') : '' });
    else minor[a.sport] = (minor[a.sport] || 0) + 1;
  }
  rows.sort((x, y) => y.at - x.at);
  const small = Object.entries(minor).map(([k, n]) => n + ' short ' + k.toLowerCase() + (n === 1 ? '' : 's')).join(', ');
  if (!rows.length && !small) return '<p class="small" style="margin-top:8px">Nothing in the last seven days yet.</p>';
  return '<ul class="recent">' + rows.slice(0, 10).map(r => '<li><span class="rd">' + esc(new Date(r.at).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })) + '</span><span>' + esc(r.text) + (r.tag ? ' <em>' + r.tag + '</em>' : '') + '</span></li>').join('') + '</ul>'
    + (small ? '<p class="small" style="margin-top:6px">Earlier this week: ' + esc(small) + '.</p>' : '');
}

// First sentence in bold, the rest as written.
function leadBold(text) {
  const i = text.indexOf('. ');
  return i < 0 ? '<strong>' + esc(text) + '</strong>' : '<strong>' + esc(text.slice(0, i + 1)) + '</strong>' + esc(text.slice(i + 1));
}
let noteShift = 0;
// The thirty-minute version of a session's kind of day, if the library has one.
const quick = s => SESSIONS.find(x => x.group === 'thirty' && x.kind === s.group) || null;
// One bar per muscle group; the line marks the target number of sets.
const REGION = { quads: 'legs', glutes: 'legs', hams: 'legs', back: 'upper', chest: 'upper', shoulders: 'upper', arms: 'upper', core: 'core' };
function muscleRows(m, target) {
  const half = x => (Number.isInteger(x) ? String(x) : x.toFixed(1));
  return MUSCLE_ORDER.map((k, n) => '<div class="mrow' + (m[k] >= target ? ' hit' : '') + '" data-region="' + REGION[k] + '"><span class="ml">' + MUSCLE_NAME[k] + '</span><span class="mb"><i style="width:' + Math.min(100, 100 * m[k] / (target * 1.25)) + '%;animation-delay:' + n * 60 + 'ms"' + (m[k] === 0 ? ' class="zero"' : '') + '></i><b class="goal" aria-hidden="true"></b></span><span class="mn">' + half(m[k]) + (m[k] >= target ? '<span class="tick" aria-label="target reached">✓</span>' : '') + '</span></div>').join('');
}
// The headline above the weekly chart: how many of the eight groups got work, as a row of leaves.
function muscleScore(m, target) {
  const worked = MUSCLE_ORDER.filter(k => m[k] > 0).length, hit = MUSCLE_ORDER.filter(k => m[k] >= target).length;
  return '<div class="score" id="week-score"><div class="big"><strong>' + worked + '</strong><span>of 8 muscle groups worked' + (hit ? '<em>' + hit + ' at the weekly target</em>' : worked ? '<em>none at the weekly target yet</em>' : '<em>a fresh week</em>') + '</span></div>'
    + '<div class="leafs" aria-hidden="true">' + MUSCLE_ORDER.map(k => '<i data-region="' + REGION[k] + '" class="' + (m[k] >= target ? 'full' : m[k] > 0 ? 'on' : '') + '"></i>').join('') + '</div></div>'
    + '<div class="legend3" aria-hidden="true"><span data-region="legs">Legs</span><span data-region="upper">Upper body</span><span data-region="core">Core</span><span class="goalkey">Target</span></div>';
}
function renderToday() {
  const now = Date.now(), ext = outsideLoad();
  const rec = recommend(SESSIONS, EXERCISES, st.history, now, ext);
  const where = status(st.history, EXERCISES, now, ext);
  const s = rec.sessionId ? byId(rec.sessionId) : null;
  const act = st.active && st.active.start ? activeSession() : null;
  const days = week(st.history, now), m7 = muscleSets(st.history, EXERCISES, now, 7);
  const note = NOTES[(Math.floor((now - new Date(now).getTimezoneOffset() * 60000) / 864e5) + noteShift) % NOTES.length];
  const today = localDate(now);
  const about = x => '<p class="about" id="today-about"><strong>What it trains:</strong> ' + esc((GROUPS[x.group] || {}).about || '') + '</p>';
  let hero;
  if (act) {
    hero = '<section class="hero ' + tone(act) + '">' + TOPO + '<div class="eyebrow">In progress</div><h1 id="today-title">' + esc(act.title) + '</h1>'
      + '<p class="why" id="today-why">' + (st.active.pauseAt ? 'Paused at ' + clock(elapsedMs(st.active) / 1000) + '. Pick up where you left off.' : st.active.start ? 'You have a session under way. Pick up where you left off.' : 'You opened this session and have not started it yet.') + '</p>' + about(act)
      + '<div class="btns"><button class="solid" id="resume" type="button">' + (st.active.start ? 'Resume session' : 'Open session') + '</button><button class="ghost" id="cancel-active" type="button">Cancel workout</button><span id="cancel-active-ask" hidden>Cancel it? Nothing will be saved. <button class="solid" id="cancel-active-yes" type="button">Yes, cancel it</button> <button class="ghost" id="cancel-active-no" type="button">Keep it</button></span></div></section>';
  } else if (s) {
    const last = st.history.find(h => h.sessionId === s.id);
    const nx = rec.light && rec.next && rec.next.sessionId ? byId(rec.next.sessionId) : null;
    hero = '<section class="hero ' + tone(s) + '">' + TOPO + '<div class="eyebrow">Do this next</div><h1 id="today-title">' + esc(s.title) + '</h1>'
      + '<p class="why" id="today-why">' + esc(rec.why) + '</p>' + about(s)
      + (nx ? '<p class="about" id="next-up"><strong>Next heavy session:</strong> ' + esc(nx.title) + ', from ' + esc(whenText(rec.next.readyAt)) + '.</p>' : '')
      + '<div class="meta"><span>' + s.minutes + ' min</span><span>' + esc((GROUPS[s.group] || {}).short || LEAN[s.lean]) + '</span><span>' + (last ? 'Last done ' + esc(nice(last.date)) : 'New to you') + '</span></div>'
      + '<div class="btns"><button class="solid" id="start-rec" data-id="' + esc(s.id) + '" type="button">Start session</button>' + (quick(s) ? '<button class="ghost" id="start-short" data-id="' + esc(quick(s).id) + '" type="button">Only have 30 min?</button>' : '') + '<a class="ghost" href="#library">Pick another</a></div></section>';
  } else {
    const nx = rec.next && rec.next.sessionId ? byId(rec.next.sessionId) : null;
    hero = '<section class="hero">' + TOPO + '<div class="eyebrow">Do this next</div><h1 id="today-title">Rest day, earned</h1>'
      + '<p class="why" id="today-why">' + esc(rec.why) + '</p>'
      + (nx ? '<p class="about" id="next-up"><strong>Next up:</strong> ' + esc(nx.title) + (rec.next.readyAt ? ', from ' + esc(whenText(rec.next.readyAt)) : ' tomorrow') + '. ' + esc((GROUPS[nx.group] || {}).about || '') + '</p>' : '')
      + '<div class="btns">' + (nx ? '<button class="ghost" type="button" id="start-next" data-id="' + esc(nx.id) + '">Start it anyway</button>' : '') + '<a class="ghost" href="#library">Browse the library</a></div></section>';
  }
  const rings = d => { const seen = new Set(); for (const a of outsideSeen()) if (localDate(actEnd(a)) === d.date) seen.add(a.sport); return [...seen].slice(0, 3).map(k => '<span class="ring" title="' + esc(k) + '"></span>').join(''); };
  $('view-today').innerHTML = '<div class="wrap"><header class="top"><div class="eyebrow">' + esc(nice(today)) + '</div><h1 style="margin-top:6px">Today</h1></header><main style="margin-top:14px">' + hero
    + '<section class="card" id="where"><h2>Where you are</h2>' + whereRow('Legs', where.lower) + whereRow('Upper body', where.upper)
    + '<h3 style="margin-top:16px">Last seven days</h3>' + recentList(now)
    + '<div class="week">' + days.map(d => '<div class="day' + (d.date === today ? ' today' : '') + (d.sessions.length ? ' lifted' : rings(d) ? ' moved' : '') + '"><div class="d">' + d.label + '</div><div class="n">' + Number(d.date.slice(8)) + '</div><div class="dots">'
      + d.sessions.map(x => '<span class="dot tone-' + esc((GROUPS[x.group] || {}).tone || 'light') + '" title="' + esc(x.title) + '"></span>').join('') + rings(d) + '</div></div>').join('') + '</div>'
    + '<p class="small" style="margin-top:8px">Filled dot: a lift. Open ring: a ride, run, swim or other activity.</p>'
    + (outside.asOf ? '<p class="small" id="activity-asof">Strava activity as of ' + esc(whenText(new Date(outside.asOf).getTime())) + '. Pull down to check for newer.</p>' : '')
    + '<div class="btns"><button class="ghost" id="refresh-now" type="button">Check for new data</button></div></section>'
    + '<section class="card" id="week-muscles"><h2>Muscles this week</h2><p class="small" style="margin-top:4px;font-size:15px">Hard sets in the last 7 days. The flag marks ' + WEEKLY_SETS + '.</p>' + muscleScore(m7, WEEKLY_SETS) + '<div class="mrows">' + muscleRows(m7, WEEKLY_SETS) + '</div>'
    + '<ul class="points small" style="font-size:15px"><li><strong>Aim for twice a week.</strong> A muscle group grows best when it gets hard work about twice a week, adding up to around ten sets.</li><li><strong>Once a week</strong> mostly holds what you have.</li><li><strong>Why:</strong> the rebuilding after a session lasts a day or two. A second session a few days later starts the next round.</li></ul></section>'
    + '<section class="card note-card"><div class="eyebrow">Field notes</div><h2 id="note-title">' + esc(note.title) + '</h2><p class="finding" style="margin-top:8px">' + leadBold(note.body) + '</p>'
    + '<ul class="points"><li><strong>Why it matters for you:</strong> ' + esc(note.why) + '</li></ul><div class="btns"><button class="ghost" id="note-next" type="button">Another note</button></div></section></main></div>';
}

/* ---------- Workout ---------- */
function renderWorkout() {
  const s = activeSession();
  if (!s) { location.hash = 'today'; return; }
  const a = st.active, anim = !calm();
  let segs = '', html = '';
  s.blocks.forEach((b, bi) => {
    segs += '<div class="seg" data-seg="' + bi + '" style="flex:' + b.min + ' 1 0"><i></i></div>';
    html += '<section class="block" data-block="' + bi + '"><div class="block-head"><div class="tag">' + esc(b.tag) + '</div><div><h2>' + esc(b.name) + '</h2><div class="kind">' + esc(b.kind) + '</div></div><div class="mins">' + b.min + ' min</div></div><p class="how">' + esc(b.how) + '</p>';
    for (const it of b.items) {
      if (!it.ex) {
        const pills = a.checks[it.id].map((_, i) => '<button type="button" class="pill" data-warm="' + esc(it.id) + '" data-i="' + i + '" data-b="' + bi + '" aria-pressed="false" aria-label="' + esc(it.name) + ', ' + (i + 1) + '">' + (i + 1) + '</button>').join('');
        html += '<div class="ex">' + (it.fig ? '<div class="drill-fig">' + figureSVG(it.fig, { animate: anim, label: it.name }) + '</div>' : '') + '<div class="ex-name">' + esc(it.name) + ' <span class="rx" style="margin:0 0 0 6px">' + esc(it.rx) + '</span></div><p class="note">' + esc(it.note || '') + '</p>'
          + (Array.isArray(it.how) ? '<details class="how"><summary>How to do it</summary><div class="howto">' + list(it.how) + '</div></details>' : '')
          + '<div class="ex-row"><div class="pills">' + pills + '</div>' + (it.timer ? '<button type="button" class="timer-btn" data-timer="' + esc(it.id) + '" data-sec="' + it.timer + '" data-b="' + bi + '">Start ' + clock(it.timer) + ' timer</button>' : '') + '</div></div>';
        continue;
      }
      const ex = EXERCISES[it.ex], unit = ex.unit, le = lastEntries(st.history, it.ex, 1)[0];
      const t0 = a.sets[it.ex][0].w;
      const rows = a.sets[it.ex].map((x, i) => '<div class="set-row" data-ex="' + esc(it.ex) + '" data-i="' + i + '"><span class="n">' + (i + 1) + '</span>'
        + (unit ? '<input class="w" type="number" inputmode="decimal" min="0" step="0.5" value="' + esc(x.w) + '" aria-label="' + esc(ex.name) + ' set ' + (i + 1) + ' weight in ' + esc(unit) + '">' : '')
        + '<input class="r" type="number" inputmode="numeric" min="0" step="1" value="' + esc(x.r) + '" aria-label="' + esc(ex.name) + ' set ' + (i + 1) + ' ' + repUnit(it) + '">'
        + '<button type="button" class="check" data-b="' + bi + '" aria-pressed="false" aria-label="Confirm ' + esc(ex.name) + ' set ' + (i + 1) + '">✓</button></div>').join('');
      html += '<div class="ex" data-ex="' + esc(it.ex) + '"><div class="ex-head"><div class="ex-fig">' + figureSVG(ex.fig || it.ex, { animate: anim, label: ex.name }) + '</div><div>'
        + '<div class="ex-name"><span class="lab">' + esc(it.lab || '') + '</span>' + esc(ex.name) + '</div><div class="rx">' + esc(rxText(it)) + '</div>'
        + (it.note ? '<p class="note">' + esc(it.note) + '</p>' : '') + '</div></div>'
        + (unit && t0 !== '' ? '<p class="target">Target <b>' + esc(t0) + ' ' + esc(unit) + '</b>. ' + esc(a.why[it.ex] || '') + '</p>' : '')
        + (le && !unit ? '<p class="target">Last time: ' + esc(le.sets.filter(x => x.done).map(x => x.r).join(', ')) + ' ' + repUnit(it) + '.</p>' : '')
        + '<div class="sets' + (unit ? '' : ' no-weight') + '"><div class="set-head"><span>Set</span>' + (unit ? '<span>' + esc(unit) + '</span>' : '') + '<span>' + repUnit(it) + '</span><span>Done</span></div>' + rows + '</div>'
        + '<p class="feltline small" data-felt="' + esc(it.ex) + '"></p>'
        + '<details><summary>How to do it</summary><div class="howto"><h3>Setup</h3>' + list(ex.setup) + '<h3>Cues</h3>' + list(ex.cues) + '<h3>Common faults</h3>' + list(ex.faults) + '<p><strong>Where you should feel it:</strong> ' + esc(ex.feel) + '</p></div></details></div>';
    }
    html += '</section>';
  });
  $('view-workout').innerHTML = '<div class="bar"><div class="wrap"><div class="bar-row"><span id="count"></span><span class="bar-btns"><button type="button" id="pause-btn">Pause</button><button type="button" id="exit-btn">Exit</button></span><span class="clock" id="clock" aria-label="Session time">0:00</span></div><div class="segs" aria-hidden="true">' + segs + '</div></div></div>'
    + '<div class="wrap"><header class="top"><div class="eyebrow">' + esc((GROUPS[s.group] || {}).label || '') + ' · about ' + s.minutes + ' minutes</div><h1 style="margin-top:6px">' + esc(s.title) + '</h1><p class="lede">' + esc(s.sub) + '</p></header>'
    + '<main>' + (s.cardio && s.blocks.some(b => b.items.some(i => i.timer)) ? '<div class="auto"><button class="solid" id="auto-start" type="button">Start and run it all</button><p class="small" style="margin-top:6px;color:var(--on-page)">One tap. Each timed step starts by itself and is called out loud, so you never have to stop and look.</p></div>' : '') + html + '<section class="card finish" id="finish"><h2 id="fin-title"></h2><p id="fin-line" style="margin-top:6px"></p><p id="fin-total" style="margin-top:8px;font-weight:600"></p><div class="btns"><button class="solid" id="save-session" type="button">Save session</button>'
    + '<button class="ghost" id="cancel-workout" type="button">Cancel workout</button><span id="cancel-ask" hidden>Cancel this workout? Nothing from it will be saved. <button class="solid" id="cancel-yes" type="button">Yes, cancel it</button> <button class="ghost" id="cancel-no" type="button">Keep going</button></span></div></section>'
    + '<section class="card"><h2 style="font-size:20px">Cool-down</h2><p class="small" style="margin-top:4px;font-size:15px">Two minutes of easy walking, then a figure-four stretch and a half-kneeling hip flexor stretch, about 45 seconds a side.</p></section></main></div>';
  syncWorkout();
}
function syncWorkout() {
  const s = activeSession();
  if (!s || $('view-workout').hidden) return;
  const a = st.active;
  let done = 0, total = 0, nowSet = false;
  document.querySelectorAll('.set-row').forEach(row => {
    const x = a.sets[row.dataset.ex][+row.dataset.i], btn = row.querySelector('.check');
    row.classList.toggle('done', x.done); btn.classList.toggle('on', x.done); btn.setAttribute('aria-pressed', x.done ? 'true' : 'false');
  });
  document.querySelectorAll('.pill').forEach(p => {
    const on = a.checks[p.dataset.warm][+p.dataset.i];
    p.classList.toggle('on', on); p.setAttribute('aria-pressed', on ? 'true' : 'false'); p.textContent = on ? '✓' : (+p.dataset.i + 1);
  });
  document.querySelectorAll('.feltline').forEach(p => { const txt = (a.sets[p.dataset.felt] || []).map((x, i) => (FEEL[x.feel] ? 'set ' + (i + 1) + ' ' + FEEL[x.feel].toLowerCase() : '')).filter(Boolean).join(' · '); p.textContent = txt ? 'Felt: ' + txt : ''; });
  s.blocks.forEach((b, bi) => {
    const c = blockCounts(b); done += c.d; total += c.t;
    const full = c.d === c.t, el = document.querySelector('[data-block="' + bi + '"]'), seg = document.querySelector('[data-seg="' + bi + '"]');
    el.classList.toggle('full', full); el.classList.toggle('now', !full && !nowSet); if (!full) nowSet = true;
    seg.classList.toggle('full', full); seg.firstChild.style.width = (100 * c.d / c.t) + '%';
  });
  $('count').textContent = (a.pauseAt ? 'Paused \u00b7 ' : '') + done + ' of ' + total + (s.cardio ? ' steps' : ' sets');
  $('pause-btn').textContent = a.pauseAt ? 'Resume' : 'Pause';
  $('pause-btn').disabled = !a.start || !!a.end;
  const all = done === total;
  if (all && a.start && !a.end) a.end = Date.now();
  if (!all) a.end = 0;
  $('finish').classList.toggle('good', all);
  $('fin-title').textContent = all ? (s.cardio ? 'That is the session.' : 'That is the whole thing.') : a.start ? 'Need to stop here?' : 'Ready when you are';
  $('fin-line').textContent = all ? total + ' sets in ' + clock(elapsedMs(a) / 1000) + '. Save it to your log.'
    : a.start ? 'You can save what you have done so far. Unchecked sets will not count.' : 'Tap Done on a set to start the clock. Weights and reps are filled in with today’s targets; change any that differ.';
  $('fin-total').textContent = a.start ? poundsLine(volume(buildItems(s)), all ? 'today' : 'so far') : '';
  $('save-session').textContent = s.cardio ? (all ? 'Finish' : 'Finish early') : all ? 'Save session' : 'End early and save';
  if (s.cardio) { $('fin-line').textContent = all ? 'Nice work. Your watch and Strava keep the record of this one.' : a.start ? 'You can stop here. Runs and swims are not written to your lifting log.' : 'Start a timer or tick a step to begin.'; $('fin-total').textContent = ''; }
  $('save-session').disabled = !a.start;
  tick();
}
function tick() {
  const a = st.active, el = $('clock');
  if (el) el.textContent = clock(elapsedMs(a) / 1000);
}
setInterval(tick, 1000);

function buildItems(s) {
  const a = st.active;
  return libItems(s).map(it => {
    const ex = EXERCISES[it.ex];
    const sets = a.sets[it.ex].map(x => ({ w: ex.unit ? num(x.w) : null, r: num(x.r), done: !!x.done, feel: FEEL[x.feel] ? x.feel : '' }));
    return { ex: it.ex, name: ex.name, unit: ex.unit, reps: it.reps, per: it.per || '', feel: itemFeel(sets), sets };
  });
}
// "You lifted 4,200 lb today, about the weight of a pickup truck."
function poundsLine(lb, tail) {
  if (!lb) return '';
  const c = compare(lb);
  return 'You lifted ' + lb.toLocaleString('en-US') + ' lb' + (tail ? ' ' + tail : '') + (c ? ', about the weight of ' + c.text + '.' : '.');
}
// Throw the workout in progress away: nothing is logged and nothing is left paused.
function cancelWorkout(message) {
  st.active = null; store.save(); hideDock(); letSleep();
  try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) { /* no voice */ }
  if (message) toast(message);
  location.hash = 'today'; route();
}
function saveSession() {
  const s = activeSession(), a = st.active;
  if (!s || !a.start) return;
  if (s.cardio) { st.active = null; store.save(); hideDock(); letSleep(); toast('Done. It shows on Today once Strava has it.'); location.hash = 'today'; return route(); }
  const end = a.end || Date.now();
  let done = 0, total = 0;
  const items = buildItems(s);
  for (const b of s.blocks) { const c = blockCounts(b); done += c.d; total += c.t; }
  if (!items.some(it => it.sets.some(x => x.done))) return cancelWorkout('Nothing was finished, so nothing was logged.');
  const totalLb = volume(items);
  st.history.unshift({ id: 's-' + end, sessionId: s.id, group: s.group, title: s.title, date: localDate(a.start), at: end, durationSec: Math.round(elapsedMs({ ...a, end }) / 1000), setsDone: done, setsTotal: total, totalLb, items });
  st.active = null;
  store.save(); hideDock(); letSleep();
  toast(totalLb ? poundsLine(totalLb, 'today') : 'Saved to your log. Nice work.');
  location.hash = 'today'; route();
  syncNow();
}

/* ---------- Library ---------- */
let libMax = 0, libType = 'all';
const typeOf = s => (['run', 'swim', 'bike', 'mobility'].includes(s.group) ? s.group : 'lift');
const fits = s => (libType === 'all' || typeOf(s) === libType) && (libMax === 0 || (libMax === 30 ? s.minutes <= 30 : s.minutes >= 40));
function renderLibrary() {
  const busy = st.active && st.active.start ? st.active.sessionId : null;
  let html = '<div class="chips" id="lib-type" role="group" aria-label="Kind of session">' + [['all', 'All'], ['lift', 'Lift'], ['run', 'Run'], ['swim', 'Swim'], ['bike', 'Bike'], ['mobility', 'Mobility']].map(f => '<button type="button" data-type="' + f[0] + '" aria-pressed="' + (libType === f[0]) + '"' + (libType === f[0] ? ' class="on"' : '') + '>' + f[1] + '</button>').join('') + '</div>'
    + '<div class="chips small" id="lib-filter" role="group" aria-label="Session length">' + [[0, 'Any length'], [30, '30 min or less'], [45, '40 min and up']].map(f => '<button type="button" data-max="' + f[0] + '" aria-pressed="' + (libMax === f[0]) + '"' + (libMax === f[0] ? ' class="on"' : '') + '>' + f[1] + '</button>').join('') + '</div>'
    + '<details class="card fold" id="guide"><summary>About this library</summary>'
    + '<p style="margin-top:8px">You do not need to plan a rotation. <strong>Open Today and it picks for you</strong>, from what you have logged and what Strava shows.</p>'
    + '<ul class="points">'
    + '<li><strong>Halves take turns.</strong> Heavy work never goes to the same half of your body two days running. Legs yesterday means upper body today.</li>'
    + '<li><strong>Cardio counts.</strong> A long ride or run counts as leg work, and a long swim as upper-body work, for one day. Short, easy rides do not count.</li>'
    + '<li><strong>Rest is rare.</strong> It calls a rest day only after five hard days in a row.</li>'
    + '<li><strong>Light days fill the gap.</strong> If both halves worked hard in the last two days, you get mobility and core instead.</li>'
    + '<li><strong>Each half rotates.</strong> Leg days alternate squat and hinge. Upper-body days alternate pull and push.</li>'
    + '</ul>'
    + '<details><summary>Why not a back day, an arm day and a leg day?</summary><div class="howto"><ul class="points">'
    + '<li><strong>That split needs five or six lifting days.</strong> At two or three, each muscle would wait a full week for its turn, which is too long to build strength.</li>'
    + '<li><strong>Half-body and whole-body sessions</strong> let every muscle work about twice a week.</li>'
    + '<li><strong>Your arms are covered.</strong> They are trained inside the pull and push days.</li>'
    + '</ul></div></details></details>';
  for (const g of Object.keys(GROUPS)) {
    const rows = SESSIONS.filter(s => s.group === g && fits(s));
    if (!rows.length) continue;
    html += '<section class="card group"><h2>' + esc(GROUPS[g].label) + '</h2><details class="about"><summary>About these</summary><ul class="points small" style="font-size:15px"><li><strong>What it is:</strong> ' + esc(GROUPS[g].about) + '</li><li><strong>Choose it when:</strong> ' + esc(GROUPS[g].when) + '</li></ul></details>' + rows.map(s => {
      const last = st.history.find(h => h.sessionId === s.id);
      return '<div class="srow ' + tone(s) + '"><div><div class="t">' + esc(s.title) + (last ? '<span class="did" role="img" aria-label="Done before"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 19.5C4.5 10.5 10 5 19.5 4.5 19.5 14 14 19.5 4.5 19.5Z" fill="currentColor"/></svg></span>' : '') + '</div><div class="m">' + s.minutes + ' min' + (s.pair ? ' · pair with a ' + esc(s.pair) + ' day' : '') + (last ? ' · last done ' + esc(nice(last.date)) : '') + '</div><div class="m">' + esc(s.sub) + '</div></div>'
        + '<button type="button" class="' + (busy === s.id ? 'solid' : 'ghost') + '" data-start="' + esc(s.id) + '"' + (busy && busy !== s.id ? ' disabled' : '') + '>' + (busy === s.id ? 'Resume' : 'Start') + '</button></div>';
    }).join('') + '</section>';
  }
  $('view-library').innerHTML = '<div class="wrap"><header class="top"><div class="eyebrow">Library</div><h1 style="margin-top:6px">Every session</h1><p class="lede">' + SESSIONS.length + ' sessions in ' + Object.keys(GROUPS).length + ' groups.</p>'
    + (busy ? '<p class="small" style="margin-top:8px">Save or cancel the session in progress to start a different one.</p>' : '') + '</header><main>' + html + '</main></div>';
}

/* ---------- Progress ---------- */
function setsText(it) {
  const done = (it.sets || []).filter(x => x.done);
  if (!done.length) return 'not done';
  const parts = done.map(x => (x.w !== null && x.w !== undefined ? x.w + ' × ' : '') + (x.r !== null && x.r !== undefined ? x.r : '?'));
  const same = parts.every(p => p === parts[0]);
  return (same ? parts.length + ' sets of ' + parts[0] : parts.join(', ')) + (it.unit ? ' ' + it.unit : '');
}
function lifetimeLine(h) {
  const lb = h.reduce((n, s) => n + volume(s.items), 0);
  if (!lb) return 'Pounds lifted will add up here.';
  const c = compare(lb);
  return lb.toLocaleString('en-US') + ' lb lifted so far' + (c ? ', about the weight of ' + c.text + '.' : '.');
}
function renderProgress() {
  const rows = liftTable(st.history, EXERCISES, SESSIONS), h = st.history;
  $('view-progress').innerHTML = '<div class="wrap"><header class="top"><div class="eyebrow">Progress</div><h1 style="margin-top:6px">What you have lifted</h1><p class="lede">'
    + (h.length ? h.length + (h.length === 1 ? ' session' : ' sessions') + ' logged. Most recent: ' + esc(nice(h[0].date)) + '.' : 'Nothing logged yet. Finish a session and it shows up here.') + '</p></header><main>'
    + '<section class="card" id="tree"><h2>Your tree</h2><p class="small" style="margin-top:6px;font-size:15px">Every session you log adds a growth ring. ' + (h.length ? h.length + (h.length === 1 ? ' ring' : ' rings') + ' so far.' : 'Yours starts with the first one.') + '</p>' + yourTree(h)
    + '<p id="lifetime" style="text-align:center;margin-top:8px;font-weight:600">' + esc(lifetimeLine(h)) + '</p>'
    + '<div class="legend"><span><i class="dot tone-lower"></i>Legs</span><span><i class="dot tone-upper"></i>Upper body</span><span><i class="dot tone-whole"></i>Whole body</span><span><i class="dot tone-light"></i>Circuits and short</span></div></section>'
    + '<section class="card"><h2>Your lifts</h2><div id="lifts">' + (rows.length ? '<table><thead><tr><th>Lift</th><th class="n">Last</th><th class="n">Next</th></tr></thead><tbody>'
      + rows.map(r => '<tr data-ex="' + esc(r.ex) + '"><td>' + esc(r.name) + '<span class="sub">Best ' + esc(show(r.best, r.unit)) + (r.milestone ? ' · milestone ' + esc(show(r.milestone, r.unit)) : '') + '</span></td><td class="n last">' + esc(show(r.last, r.unit)) + '</td><td class="n next">' + esc(show(r.next, r.unit)) + '</td></tr>').join('')
      + '</tbody></table>' : '<p class="small" style="margin-top:6px">Weights you log are tracked here, lift by lift, with the next target for each.</p>') + '</div></section>'
    + '<section class="card"><h2>Sessions</h2><div id="sessions" style="margin-top:8px">' + (h.length ? h.map(s => '<details class="sess"><summary><span><span class="when">' + esc(nice(s.date)) + ' · ' + esc(s.title) + '</span><span class="m">' + clock(s.durationSec) + ' · ' + (s.setsDone || 0) + ' of ' + (s.setsTotal || 0) + ' sets' + (volume(s.items) ? ' · ' + volume(s.items).toLocaleString('en-US') + ' lb' : '') + '</span></span></summary><ul>'
      + s.items.filter(it => (it.sets || []).some(x => x.done)).map(it => '<li>' + esc(it.name) + ': ' + esc(setsText(it)) + (FEEL[it.feel] ? ' · ' + FEEL[it.feel].toLowerCase() : '') + (volume([it]) ? ' · ' + volume([it]).toLocaleString('en-US') + ' lb' : '') + '</li>').join('') + '</ul><div class="btns del"><button class="ghost" type="button" data-del="' + esc(s.id) + '">Delete this session</button><span hidden>Delete it for good? <button class="solid" type="button" data-del-yes="' + esc(s.id) + '">Yes, delete</button> <button class="ghost" type="button" data-del-no>Keep</button></span></div></details>').join('') : '<p class="small">No sessions yet.</p>') + '</div></section>'
    + '<section class="card"><h2>Ask your coach</h2><p style="margin-top:6px">Copy your log and paste it into your chat with Claude for a review or new sessions.</p><div class="btns"><button class="ghost" id="copy-log" type="button">Copy log for Claude</button></div><textarea id="log-out" hidden readonly aria-label="Your log as text"></textarea></section></main></div>';
}

/* ---------- Settings ---------- */
/* ---------- Coach ---------- */
let coachNote = null;
try { coachNote = JSON.parse(storage.getItem('sequoia-coach') || 'null'); } catch (e) { coachNote = null; }
function coachNoteCard() {
  const c = coachNote;
  if (!c || typeof c !== 'object' || !c.headline) return '';
  const pts = Array.isArray(c.points) ? c.points.filter(p => p && p.text) : [], next = Array.isArray(c.next) ? c.next.filter(x => typeof x === 'string') : [];
  return '<section class="card note-card" id="coach-note"><div class="eyebrow">From your coach' + (c.updated ? ' · ' + esc(nice(String(c.updated))) : '') + '</div><h2>' + esc(c.headline) + '</h2>'
    + (pts.length ? '<ul class="points">' + pts.map(p => '<li>' + (p.lead ? '<strong>' + esc(p.lead) + '</strong> ' : '') + esc(p.text) + '</li>').join('') + '</ul>' : '')
    + (next.length ? '<h3 class="sub">Next</h3><ol class="points">' + next.map(x => '<li>' + esc(x) + '</li>').join('') + '</ol>' : '') + '</section>';
}
// Numbers worked out from Strava: heart-rate zone, paces, best times and what they predict.
function enduranceCard(now) {
  const f = outside.fitness;
  if (!f) return '';
  const rows = [], row = (k, v, sub) => rows.push('<tr><td>' + esc(k) + (sub ? '<span class="sub">' + esc(sub) + '</span>' : '') + '</td><td class="n">' + esc(v) + '</td></tr>');
  const ago = d => { const n = Math.round((now - new Date(d + 'T12:00:00').getTime()) / 864e5); return n <= 0 ? 'today' : n + (n === 1 ? ' day ago' : ' days ago'); };
  if (f.zone2 && Array.isArray(f.zone2.bpm)) row('Zone 2 heart rate', f.zone2.bpm[0] + ' to ' + f.zone2.bpm[1] + ' bpm', 'Your easy, full-sentence effort');
  if (f.zone2 && Array.isArray(f.zone2.pace)) row('Easy run pace', paceText(f.zone2.pace[0]) + ' to ' + paceText(f.zone2.pace[1]) + ' /mi', 'About where zone 2 lands on flat ground');
  for (const b of Array.isArray(f.best) ? f.best : []) if (b && b.sec) row('Best ' + b.label + ' this year', timeText(b.sec), b.date ? nice(b.date) : '');
  const five = (Array.isArray(f.best) ? f.best : []).find(b => b && b.km === 5 && b.sec);
  if (five) { row('Predicted 10K', timeText(riegel(five.sec, 5, 10)), 'From your 5K'); row('Predicted half marathon', timeText(riegel(five.sec, 5, 21.0975)), 'From your 5K'); }
  if (f.swim && Array.isArray(f.swim.pace100)) row('Pool swim pace', paceText(f.swim.pace100[0]) + ' to ' + paceText(f.swim.pace100[1]) + ' /100 yd', 'Your recent pool swims');
  if (f.ftp && f.ftp.watts) row('Cycling threshold power', f.ftp.watts + ' W', f.ftp.estimated ? 'Strava’s estimate, from little power data' : '');
  if (f.last && f.last.Run) row('Last run', ago(f.last.Run), nice(f.last.Run));
  if (f.last && f.last.Swim) row('Last swim', ago(f.last.Swim), nice(f.last.Swim));
  if (!rows.length) return '';
  return '<section class="card"><h2>Endurance numbers</h2><table id="endurance"><tbody>' + rows.join('') + '</tbody></table>'
    + '<p class="small" style="margin-top:8px">Predictions use Riegel’s formula, which stretches a recent race time to a longer distance. They assume you train for that distance.</p></section>';
}
function renderCoach() {
  const now = Date.now(), h = st.history, acts = outsideSeen();
  const ins = insights(h, EXERCISES, acts, now), w = weekly(h, now), m = muscleSets(h, EXERCISES, now, 14), c = cardio(acts, now, 14), rows = lifts(h, EXERCISES).slice(0, 8);
  const n = x => x.toLocaleString('en-US'), half = x => (Number.isInteger(x) ? String(x) : x.toFixed(1));
  const delta = (a, b) => (a === b ? '' : ' <span class="delta ' + (a > b ? 'up' : 'down') + '">' + (a > b ? '▲' : '▼') + '</span>');
  const mins = x => (x < 60 ? x + ' min' : Math.floor(x / 60) + ' h ' + String(x % 60).padStart(2, '0') + ' min');
  const anyCardio = c.Ride.count + c.Run.count + c.Swim.count > 0;
  $('view-coach').innerHTML = '<div class="wrap"><header class="top"><div class="eyebrow">Coach</div><h1 style="margin-top:6px">Your numbers</h1><p class="lede">Worked out from your log' + (outside.asOf ? ' and Strava' : '') + '. It updates every time you finish a session.</p></header><main>'
    + '<section class="card"><h2>Muscle balance</h2><p class="small" style="margin-top:6px;font-size:15px">Hard sets in the last 14 days. A full set counts for the main muscle and half for helpers. The line marks ' + WEEKLY_SETS * 2 + ', about ten a week, a common target once you lift regularly.</p><div id="muscles">'
    + muscleRows(m, WEEKLY_SETS * 2) + '</div></section>'
    + '<section class="card"><h2>This week against last</h2><table id="week-compare"><thead><tr><th></th><th class="n">Last 7 days</th><th class="n">7 before</th></tr></thead><tbody>'
    + '<tr><td>Sessions</td><td class="n">' + w.now.sessions + delta(w.now.sessions, w.before.sessions) + '</td><td class="n">' + w.before.sessions + '</td></tr>'
    + '<tr><td>Working sets</td><td class="n">' + w.now.sets + delta(w.now.sets, w.before.sets) + '</td><td class="n">' + w.before.sets + '</td></tr>'
    + '<tr><td>Pounds lifted</td><td class="n">' + n(w.now.pounds) + ' lb' + delta(w.now.pounds, w.before.pounds) + '</td><td class="n">' + n(w.before.pounds) + ' lb</td></tr></tbody></table></section>'
    + '<section class="card"><h2>Cardio, last 14 days</h2>' + (anyCardio ? '<div id="cardio">' + ['Ride', 'Run', 'Swim'].map(k => '<div class="mrow wide"><span class="ml">' + k + 's</span><span class="mb plain"><i style="width:' + (100 * c[k].minutes / Math.max(1, c.Ride.minutes, c.Run.minutes, c.Swim.minutes)) + '%"' + (c[k].count ? '' : ' class="zero"') + '></i></span><span class="mn">' + (c[k].count ? c[k].count + ' \u00b7 ' + mins(c[k].minutes) : '0') + '</span></div>').join('') + '</div>'
      : '<p class="small" style="margin-top:6px">' + (sync ? 'No rides, runs or swims in the last two weeks.' : 'Connect Private sync in Settings to bring in Strava.') + '</p>') + '</section>'
    + enduranceCard(now)
    + '<section class="card"><h2>Estimated strength</h2>' + (rows.length ? '<table id="strength"><thead><tr><th>Lift</th><th class="n">Best recent set</th><th class="n">Est. max</th></tr></thead><tbody>'
      + rows.map(r => '<tr data-ex="' + esc(r.ex) + '"><td>' + esc(r.name) + '<span class="sub">' + (r.times < 2 ? 'First time logged' : (r.change > 0 ? 'Up ' + r.change + ' lb' : r.change < 0 ? 'Down ' + -r.change + ' lb' : 'Same weight') + ' since your first time') + '</span></td><td class="n">' + esc(show(r.last, r.unit)) + ' × ' + r.lastReps + '</td><td class="n">' + r.est + ' lb</td></tr>').join('') + '</tbody></table>'
      + '<p class="small" style="margin-top:8px">Estimated max is a calculation from your best set (the Epley formula). It is a yardstick for progress, not a lift to attempt. You do not need to test a true one-rep max: a hard set of three to five reps every six to eight weeks tells you the same thing with far less risk.</p>'
      : '<p class="small" style="margin-top:6px">Your lifts show up here after your first session.</p>') + '</section>'
    + '<section class="card"><h2>Work on these</h2><ol class="points big" id="insights">' + ins.slice(0, 4).map(i => '<li><strong>' + esc(i.title) + '.</strong> ' + esc(i.detail) + '<span class="do">' + esc(i.action) + '</span></li>').join('') + '</ol>'
    + (ins.length ? '' : '<p style="margin-top:8px">Nothing stands out right now. Keep the rhythm going.</p>') + '</section>'
    + coachNoteCard()
    + '</main></div>';
}

/* ---------- private sync ---------- */
// The log and the Strava snapshot live in a private GitHub repository. See js/sync.js.
let syncCfg = loadConfig(storage);
let sync = syncCfg ? createSync({ fetch: (u, o) => fetch(u, o), repo: syncCfg.repo, token: syncCfg.token }) : null;
let syncState = { at: 0, ok: true, reason: '', busy: false, note: '' };
const SYNC_WHY = {
  key: 'GitHub did not accept the key. Make a new one and connect again.',
  repo: 'That repository was not found, or the key cannot see it.',
  public: 'That repository is public. Sequoia only stores your data in a private one.',
  offline: 'No connection just now. It will try again next time you open the app.',
  error: 'GitHub did not accept the update. It will try again next time.'
};
function syncStatusText() {
  if (syncState.note) return syncState.note;
  if (!sync) return '';
  if (!syncState.ok) return SYNC_WHY[syncState.reason] || SYNC_WHY.error;
  return 'Connected to ' + sync.repo + '.' + (syncState.at ? ' Last synced ' + whenText(syncState.at) + '.' : '');
}
function syncCard() {
  const head = '<section class="card" id="sync"><h2>Private sync</h2>';
  if (sync) {
    return head + '<p id="sync-status" style="margin-top:6px">' + esc(syncStatusText()) + '</p>'
      + '<ul class="points small" style="font-size:15px"><li><strong>Your log</strong> is saved to your private repository after every session.</li><li><strong>Strava</strong> is read from the same place.</li></ul>'
      + '<div class="btns"><button class="ghost" id="sync-now" type="button">Sync now</button><button class="ghost" id="copy-key" type="button">Copy key</button><button class="ghost" id="sync-disconnect" type="button">Disconnect this phone</button></div></section>';
  }
  return head + '<ul class="points" style="margin-top:6px"><li><strong>What it does:</strong> saves your log to a private GitHub repository and reads your Strava activity from it.</li>'
    + '<li><strong>Where the key lives:</strong> on this phone only. It is never in a backup and is sent only to GitHub.</li>'
    + '<li><strong>Private only:</strong> a public repository is refused.</li></ul>'
    + '<label class="small" for="sync-repo" style="display:block;margin-top:10px">Private repository (owner/name)</label><input id="sync-repo" type="text" inputmode="url" autocapitalize="none" autocorrect="off" spellcheck="false" value="' + esc(guessRepo(location.hostname)) + '">'
    + '<label class="small" for="sync-token" style="display:block;margin-top:10px">Access key</label><input id="sync-token" type="password" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false">'
    + '<p class="small" id="sync-status" style="margin-top:8px">' + esc(syncStatusText()) + '</p>'
    + '<div class="btns"><button class="solid" id="sync-connect" type="button">Connect</button></div></section>';
}
function redrawAfterSync() {
  if (!$('view-workout').hidden) return;
  const v = document.body.dataset.view;
  if (v === 'settings') { const el = $('sync-status'); if (el) el.textContent = syncStatusText(); } else route();
}
// Pull Strava, then bring the log on this phone and the stored log into line.
let syncAgain = null;
async function syncNow(opts = {}) {
  if (!sync) return;
  if (syncState.busy) { syncAgain = { ...(syncAgain || {}), ...opts }; return; }
  syncState.busy = true; syncState.note = '';
  try {
    try { const act = await sync.getJSON('activity.json'); if (act.ok) setOutside(act.data); } catch (e) { /* the log sync below reports the connection */ }
    try { const cn = await sync.getJSON('coach.json'); if (cn.ok) { coachNote = cn.data; storage.setItem('sequoia-coach', JSON.stringify(cn.data)); } } catch (e) { /* optional file */ }
    const before = st.history.map(h => h.id).join();
    const out = await syncLog(sync, st.history, { ...opts, deleted: st.deleted || [] });
    syncState.ok = out.ok; syncState.reason = out.reason;
    if (out.ok) {
      syncState.at = Date.now();
      // Anything deleted while this sync was in flight stays deleted.
      const gone = new Set([...(st.deleted || []), ...out.deleted]);
      const merged = out.history.filter(h => !gone.has(h.id));
      st.deleted = [...gone].slice(-500);
      if (merged.map(h => h.id).join() !== before) { store.restore(JSON.stringify({ app: 'sequoia', v: 1, history: merged })); refreshTitles(); } else store.save();
    }
  } finally { syncState.busy = false; }
  redrawAfterSync();
  if (syncAgain) { const again = syncAgain; syncAgain = null; return syncNow(again); }
}
async function connectSync() {
  const repo = $('sync-repo').value.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\/+$/, ''), token = $('sync-token').value.trim();
  const say = msg => { syncState.note = msg; $('sync-status').textContent = msg; };
  if (!validRepo(repo)) return say('Enter the repository as owner/name, for example yourname/sequoia-private.');
  if (!token) return say('Paste the access key first.');
  say('Checking…');
  const client = createSync({ fetch: (u, o) => fetch(u, o), repo, token });
  const res = await client.check();
  if (!res.ok) return say(SYNC_WHY[res.reason] || SYNC_WHY.error);
  saveConfig(storage, { repo, token });
  syncCfg = { repo, token }; sync = client; syncState = { at: 0, ok: true, reason: '', busy: false, note: '' };
  renderSettings();
  toast('Connected. Your data stays private.');
  syncNow();
}
function disconnectSync() {
  clearConfig(storage); syncCfg = null; sync = null; syncState = { at: 0, ok: true, reason: '', busy: false, note: '' };
  renderSettings(); toast('Key removed from this phone. Your log is still here.');
}

function renderSettings() {
  $('view-settings').innerHTML = '<div class="wrap"><header class="top"><div class="eyebrow">Settings</div><a class="ghost done" id="settings-done" href="#today">Done</a><h1 style="margin-top:6px">Your log, your phone</h1><p class="lede">' + (sync ? 'Your log is kept on this phone and backed up to your private repository.' : 'Everything you log is kept on this phone. Nothing is sent anywhere.') + '</p></header><main>'
    + syncCard()
    + '<details class="card fold" id="advanced"><summary>Advanced: manual backup</summary><p class="small" style="margin-top:6px">Private sync already saves your log after every session. These are a manual fallback.</p>'
    + '<section class="inner"><h2>Back up</h2><p style="margin-top:6px">Copy a backup now and then and paste it somewhere safe, such as a note.</p><div class="btns"><button class="ghost" id="copy-backup" type="button">Copy full backup</button></div></section>'
    + '<section class="inner"><h2>Restore</h2><p style="margin-top:6px">Paste a backup to replace the log on this phone.</p><label class="small" for="restore-in" style="display:block;margin-top:8px">Backup text</label><textarea id="restore-in"></textarea><div class="btns"><button class="ghost" id="restore-btn" type="button">Replace my log with this backup</button></div></section>'
    + '</details>'
    + '<section class="card"><h2>About</h2><p class="small" style="margin-top:6px">Sequoia, phase 1. ' + SESSIONS.length + ' sessions, ' + Object.keys(EXERCISES).length + ' exercises, ' + NOTES.length + ' field notes.</p></section></main></div>';
}

/* ---------- toast, timer, sound, screen ---------- */
let toastT;
function toast(msg) { const el = $('toast'); el.textContent = msg; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 3500); }
let actx = null, timer = null, timerI = null, goT = null, wl = null;
function wakeAudio() { try { const C = window.AudioContext || window.webkitAudioContext; if (!C) return; actx = actx || new C(); if (actx.state === 'suspended') actx.resume(); } catch (e) { /* no sound available */ } }
function keepAwake() { try { if ('wakeLock' in navigator && !wl) navigator.wakeLock.request('screen').then(l => { wl = l; l.addEventListener('release', () => { wl = null; }); }, () => {}); } catch (e) { /* not supported */ } }
function letSleep() { try { if (wl) wl.release(); } catch (e) { /* already released */ } wl = null; }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && st.active && st.active.start && !st.active.end) keepAwake(); });
function beep() {
  try { if (actx) { const t = actx.currentTime; [0, 0.28].forEach(d => { const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.3, t + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.22);
    o.connect(g); g.connect(actx.destination); o.start(t + d); o.stop(t + d + 0.25); }); } } catch (e) { /* no sound available */ }
  try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) { /* no vibration */ }
}
let asking = null, askT = null;
function askFeel(exId, i) {
  asking = { ex: exId, i };
  clearTimeout(askT);
  $('dockAskLabel').textContent = EXERCISES[exId].name + ', set ' + (i + 1) + ': how did it feel?';
  $('dockAdvice').hidden = true;
  document.querySelectorAll('#dockAsk [data-ask]').forEach(b => { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); });
  $('dockAsk').hidden = false; $('dock').hidden = false;
  if (!timer) { clearTimeout(goT); $('dock').classList.remove('go'); $('dockTimer').hidden = true; askT = setTimeout(closeAsk, 15000); }
}
function closeAsk() { clearTimeout(askT); asking = null; $('dockAsk').hidden = true; if (!timer) hideDock(); }
function answerFeel(feel) {
  const a = st.active;
  if (!asking || !a || !a.sets[asking.ex]) return;
  const sets = a.sets[asking.ex], x = sets[asking.i], ex = EXERCISES[asking.ex];
  x.feel = feel;
  const adv = adviseSet(feel, ex.unit ? x.w : null, ex.step);
  const left = sets.some((y, j) => j > asking.i && !y.done);
  if (adv.next !== null && left) {
    sets.forEach((y, j) => { if (j > asking.i && !y.done) y.w = String(adv.next); });
    document.querySelectorAll('.set-row[data-ex="' + asking.ex + '"]').forEach(row => { const j = +row.dataset.i, inp = row.querySelector('input.w'); if (inp && j > asking.i && !sets[j].done) inp.value = sets[j].w; });
  }
  $('dockAdvice').textContent = left ? adv.text : feel === 'easy' ? 'Too easy on your last set. Add weight next session.' : feel === 'hard' ? 'Tough finish. Next session holds this weight.' : 'Right on target.';
  $('dockAdvice').hidden = false;
  document.querySelectorAll('#dockAsk [data-ask]').forEach(b => { const on = b.dataset.ask === feel; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
  clearTimeout(askT);
  if (!timer) askT = setTimeout(closeAsk, 6000);
  store.save(); syncWorkout();
}
function startTimer(sec, label, warmId) {
  clearTimeout(goT); clearInterval(timerI); clearTimeout(askT);
  $('dockTimer').hidden = false;
  const step = warmId && activeSession() ? activeSession().blocks.flatMap(b => b.items).find(x => x.id === warmId) : null;
  timer = { end: Date.now() + sec * 1000, total: sec, warmId: warmId || null, plan: step ? pingPlan(step) : [], fired: 0 };
  $('dock').classList.remove('go'); $('dock').hidden = false; $('dockLabel').textContent = label; $('plus15').hidden = false; $('skip').textContent = 'Skip';
  timerI = setInterval(drawTimer, 200); drawTimer();
}
function drawTimer() {
  if (!timer) return;
  const left = (timer.end - Date.now()) / 1000;
  if (left <= 0) return finishTimer();
  const ping = duePing(timer.plan || [], timer.total - left, timer.fired || 0);
  if (ping) { timer.fired++; beep(); const cue = ping.label === 'Halfway' ? 'Halfway. Turn around.' : ping.label; $('dockLabel').textContent = cue; say(cue); }
  $('dockTime').textContent = clock(Math.ceil(left)); $('dockFill').style.width = Math.max(0, Math.min(100, 100 * left / timer.total)) + '%';
}
// Spoken cues, so a run or a stretch flow can be followed without looking at the phone.
function say(text) {
  try {
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  } catch (e) { /* no voice available */ }
}
const spoken = sec => (sec >= 60 ? (Math.round(sec / 60) === 1 ? '1 minute' : Math.round(sec / 60) + ' minutes') : sec + ' seconds');
// Start the next timed step that is not done yet. Returns false when there is none left.
function runNext(afterId) {
  const a = st.active, s = activeSession();
  if (!a || !s) return false;
  const steps = s.blocks.flatMap(b => b.items).filter(i => i.timer && !i.ex);
  const from = afterId ? steps.findIndex(i => i.id === afterId) + 1 : 0;
  const next = steps.slice(from).find(i => a.checks[i.id] && a.checks[i.id].includes(false));
  if (!next) { a.auto = false; store.save(); return false; }
  startTimer(next.timer, next.name, next.id);
  say(next.name + ', ' + spoken(next.timer) + '.');
  return true;
}
function finishTimer() {
  clearInterval(timerI); const t = timer; timer = null; beep();
  if (t && t.warmId && st.active && st.active.checks[t.warmId]) { const arr = st.active.checks[t.warmId], i = arr.indexOf(false); if (i >= 0) arr[i] = true; store.save(); syncWorkout(); }
  $('dock').classList.add('go'); $('dockLabel').textContent = t && t.warmId ? 'Done' : 'Rest over'; $('dockTime').textContent = t && t.warmId ? 'Nice.' : 'Go.';
  $('dockFill').style.width = '0%'; $('plus15').hidden = true; $('skip').textContent = 'Close'; goT = setTimeout(hideDock, 6000);
  const guided = t && t.warmId && activeSession() && activeSession().cardio;
  if (guided && st.active.auto && runNext(t.warmId)) return;
  if (guided) say('Done. Nice work.');
}
function hideDock() { clearTimeout(goT); clearInterval(timerI); clearTimeout(askT); timer = null; asking = null; $('dock').hidden = true; $('dockAsk').hidden = true; $('dockTimer').hidden = false; }
$('plus15').addEventListener('click', () => { if (timer) { timer.end += 15000; timer.total += 15; drawTimer(); } });
$('skip').addEventListener('click', hideDock);

function copyText(text, okMsg, fallbackEl) {
  const fb = () => { if (fallbackEl) { fallbackEl.hidden = false; fallbackEl.value = text; fallbackEl.focus(); fallbackEl.select(); toast('Select all and copy the text in the box.'); } };
  try { navigator.clipboard.writeText(text).then(() => toast(okMsg), fb); } catch (e) { fb(); }
}

/* ---------- events ---------- */
function begin() { const a = st.active; if (!a.start) a.start = Date.now(); if (a.pauseAt) resumeSession(); keepAwake(); }
function afterCheck(bi, i, turnedOn, wasFull) {
  const s = activeSession(), b = s.blocks[bi], a = st.active;
  if (turnedOn) {
    const c = blockCounts(b);
    const lib = b.items.filter(it => it.ex);
    const roundDone = lib.length > 0 && lib.every(it => i >= a.sets[it.ex].length || a.sets[it.ex][i].done);
    if (c.d === c.t && !wasFull) { toast(b.cheer || 'Block done.'); if (timer && !timer.warmId) hideDock(); }
    else if (b.rest && roundDone) startTimer(b.rest, 'Rest');
  }
  store.save(); syncWorkout();
}
document.addEventListener('click', ev => {
  const t = ev.target, a = st.active;
  const chk = t.closest('.check');
  if (chk && a) {
    wakeAudio();
    const row = chk.closest('.set-row'), x = a.sets[row.dataset.ex][+row.dataset.i], bi = +chk.dataset.b, s = activeSession();
    const before = blockCounts(s.blocks[bi]);
    x.done = !x.done; if (x.done) begin(); else x.feel = '';
    afterCheck(bi, +row.dataset.i, x.done, before.d === before.t);
    if (x.done) askFeel(row.dataset.ex, +row.dataset.i); else if (asking && asking.ex === row.dataset.ex && asking.i === +row.dataset.i) closeAsk();
    return;
  }
  const pill = t.closest('.pill');
  if (pill && a) {
    wakeAudio();
    const arr = a.checks[pill.dataset.warm], i = +pill.dataset.i, bi = +pill.dataset.b, s = activeSession();
    const before = blockCounts(s.blocks[bi]);
    arr[i] = !arr[i]; if (arr[i]) begin();
    return afterCheck(bi, i, arr[i], before.d === before.t);
  }
  const tb = t.closest('[data-timer]');
  if (tb && a) { wakeAudio(); begin(); store.save(); syncWorkout(); return startTimer(+tb.dataset.sec, 'Timer', tb.dataset.timer); }
  const ask = t.closest('[data-ask]');
  if (ask && a) return answerFeel(ask.dataset.ask);
  const startBtn = t.closest('[data-start]');
  if (startBtn && !startBtn.disabled) return startSession(startBtn.dataset.start);
  if (t.closest('#start-rec')) return startSession(t.closest('#start-rec').dataset.id);
  if (t.closest('#start-next')) return startSession(t.closest('#start-next').dataset.id);
  if (t.closest('#resume')) { resumeSession(); location.hash = 'workout'; return route(); }
  if (t.closest('#pause-btn') && a) { if (a.pauseAt) resumeSession(); else pauseSession(); return syncWorkout(); }
  if (t.closest('#exit-btn') && a) { pauseSession(); hideDock(); letSleep(); toast(a.start ? 'Paused. Resume or cancel it from Today.' : 'Set aside. Resume or cancel it from Today.'); location.hash = 'today'; return route(); }
  if (t.closest('#auto-start') && a) { wakeAudio(); begin(); a.auto = true; store.save(); syncWorkout(); if (!runNext(null)) toast('Every timed step is already done.'); return; }
  if (t.closest('#start-short')) return startSession(t.closest('#start-short').dataset.id);
  if (t.closest('#note-next')) { noteShift++; return renderToday(); }
  const typ = t.closest('#lib-type [data-type]');
  if (typ) { libType = typ.dataset.type; return renderLibrary(); }
  const fil = t.closest('#lib-filter [data-max]');
  if (fil) { libMax = +fil.dataset.max; return renderLibrary(); }
  if (t.closest('#save-session')) return saveSession();
  if (t.closest('#cancel-workout')) { $('cancel-ask').hidden = false; $('cancel-workout').hidden = true; return; }
  if (t.closest('#cancel-no')) { $('cancel-ask').hidden = true; $('cancel-workout').hidden = false; return; }
  if (t.closest('#cancel-yes') || t.closest('#cancel-active-yes')) return cancelWorkout('Workout cancelled. Nothing was saved.');
  if (t.closest('#cancel-active')) { $('cancel-active-ask').hidden = false; $('cancel-active').hidden = true; return; }
  if (t.closest('#cancel-active-no')) { $('cancel-active-ask').hidden = true; $('cancel-active').hidden = false; return; }
  const del = t.closest('[data-del]');
  if (del) { del.hidden = true; del.nextElementSibling.hidden = false; return; }
  const delNo = t.closest('[data-del-no]');
  if (delNo) { delNo.parentElement.hidden = true; delNo.parentElement.previousElementSibling.hidden = false; return; }
  const delYes = t.closest('[data-del-yes]');
  if (delYes) { if (store.remove(delYes.dataset.delYes)) { toast('Session deleted.'); syncNow(); } return renderProgress(); }
  if (t.closest('#copy-log')) return copyText(logText(st.history, localDate(Date.now())), 'Log copied. Paste it into your chat with Claude.', $('log-out'));
  if (t.closest('#refresh-now')) return refreshAll();
  if (t.closest('#sync-connect')) return connectSync();
  if (t.closest('#copy-key') && syncCfg) { try { navigator.clipboard.writeText(syncCfg.token).then(() => toast('Key copied. Paste it into the app after you re-add it.'), () => toast('This browser would not allow the copy.')); } catch (e) { toast('This browser would not allow the copy.'); } return; }
  if (t.closest('#sync-now')) { toast('Syncing\u2026'); return syncNow(); }
  if (t.closest('#sync-disconnect')) return disconnectSync();
  if (t.closest('#copy-backup')) return copyText(store.backup(), 'Backup copied. Paste it somewhere safe.', null);
  if (t.closest('#restore-btn')) {
    try { const n = store.restore($('restore-in').value); $('restore-in').value = ''; toast('Log restored: ' + n + (n === 1 ? ' session.' : ' sessions.')); syncNow({ replace: true }); }
    catch (e) { toast('That is not a Sequoia backup. Paste the full backup text.'); }
  }
});
document.addEventListener('input', ev => {
  const inp = ev.target, row = inp.closest && inp.closest('.set-row');
  if (!row || !st.active) return;
  const x = st.active.sets[row.dataset.ex][+row.dataset.i];
  if (inp.classList.contains('w')) x.w = inp.value; else if (inp.classList.contains('r')) x.r = inp.value;
  store.save();
});

/* ---------- routing and start ---------- */
const VIEWS = ['today', 'workout', 'library', 'coach', 'progress', 'settings'];
const RENDER = { today: renderToday, workout: renderWorkout, library: renderLibrary, coach: renderCoach, progress: renderProgress, settings: renderSettings };
function route() {
  let v = location.hash.replace('#', '');
  if (!VIEWS.includes(v)) v = 'today';
  if (v === 'workout' && !activeSession()) v = 'today';
  for (const name of VIEWS) $('view-' + name).hidden = name !== v;
  document.body.dataset.view = v;
  for (const name of ['today', 'library', 'coach', 'progress']) $('tab-' + name).classList.toggle('on', name === v || (v === 'workout' && name === 'today'));
  RENDER[v]();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
refreshTitles();
route();

// The private preview carries a starter log; the public site has no such file and skips this.
// Recent Strava activity, written into the private data by Claude. Absent on the public site.
fetch('data/activity.json').then(r => (r.ok ? r.json() : null)).then(d => { if (setOutside(d) && $('view-workout').hidden) route(); }).catch(() => {});
fetch('data/seed.json').then(r => (r.ok ? r.json() : null)).then(seed => { if (Array.isArray(seed) && store.addSeed(seed)) { refreshTitles(); if ($('view-workout').hidden) route(); } }).catch(() => {});

/* ---------- refresh: new data, and new versions of the app ---------- */
// Is a newer build published than the one running? The published version.js is read fresh, past every cache.
async function newerVersion() {
  try {
    const r = await fetch('js/version.js?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) return false;
    const m = /VERSION = '([^']+)'/.exec(await r.text());
    if (!m || m[1] === VERSION) return false;
    try { if (sessionStorage.getItem('sequoia-reloaded') === m[1]) return false; sessionStorage.setItem('sequoia-reloaded', m[1]); } catch (e) { /* reload anyway */ }
    return true;
  } catch (e) { return false; }
}
// Reload into a newer build, but never in the middle of a workout.
async function updateIfNewer() {
  if (!$('view-workout').hidden || !(await newerVersion())) return false;
  try { const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration(); if (reg) await reg.update(); } catch (e) { /* the reload still fetches fresh files */ }
  location.reload();
  return true;
}
let refreshing = false;
function pullShow(text, dy) { const el = $('pull'); el.textContent = text; el.hidden = false; el.style.transform = 'translate(-50%,' + Math.min(70, Math.max(0, dy * 0.5)) + 'px)'; }
function pullHide() { const el = $('pull'); el.hidden = true; el.style.transform = ''; }
async function refreshAll() {
  if (refreshing) return;
  refreshing = true;
  pullShow('Checking for new data…', 80);
  try {
    await syncNow();
    if (await updateIfNewer()) return;
    toast(!sync ? 'Up to date. Connect Private sync in Settings to bring in Strava.'
      : !syncState.ok ? (SYNC_WHY[syncState.reason] || SYNC_WHY.error)
      : 'Up to date.' + (outside.asOf ? ' Strava as of ' + whenText(new Date(outside.asOf).getTime()) + '.' : ''));
  } finally { refreshing = false; pullHide(); }
}
// Pull the page down from the top to refresh, on every screen except a workout in progress.
let pull = null;
const PULL_AT = 70;
document.addEventListener('touchstart', e => {
  pull = !refreshing && document.body.dataset.view !== 'workout' && window.scrollY <= 0 && e.touches.length === 1 ? { y: e.touches[0].clientY, d: 0 } : null;
}, { passive: true });
document.addEventListener('touchmove', e => {
  if (!pull || !e.touches.length) return;
  pull.d = e.touches[0].clientY - pull.y;
  if (pull.d > 24 && window.scrollY <= 0) pullShow(pull.d >= PULL_AT ? 'Release to refresh' : 'Pull to refresh', pull.d); else pullHide();
}, { passive: true });
document.addEventListener('touchend', () => {
  if (!pull) return;
  const go = pull.d >= PULL_AT && window.scrollY <= 0;
  pull = null;
  if (go) refreshAll(); else pullHide();
});
document.addEventListener('touchcancel', () => { pull = null; if (!refreshing) pullHide(); });

syncNow();
updateIfNewer();
let lastWake = Date.now();
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && Date.now() - lastWake > 60000) { lastWake = Date.now(); syncNow(); updateIfNewer(); } });
try { if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) { /* not available in this frame */ }
