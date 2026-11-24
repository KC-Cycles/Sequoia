import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore, KEY } from '../js/store.js';

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return { data, getItem: k => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); } };
}
const session = (id = 's1') => ({ id, sessionId: 'legs-arms', group: 'squat', title: 'Legs', date: '2026-11-22', at: 1795300000000, durationSec: 3524, setsDone: 3, setsTotal: 3,
  items: [{ ex: 'squat', name: 'Back squat', unit: 'lb', reps: 8, feel: '', sets: [{ w: 70, r: 8, done: true }] }] });

test('a new store starts with an empty log and no active session', () => {
  const s = createStore(fakeStorage());
  assert.deepEqual(s.state.history, []);
  assert.equal(s.state.active, null);
});

test('save then reload keeps the log', () => {
  const st = fakeStorage();
  const a = createStore(st);
  a.state.history.push(session());
  a.save();
  const b = createStore(st);
  assert.equal(b.state.history.length, 1);
  assert.equal(b.state.history[0].items[0].sets[0].w, 70);
});

test('corrupt stored text gives an empty log instead of throwing', () => {
  const s = createStore(fakeStorage({ [KEY]: '{not json' }));
  assert.deepEqual(s.state.history, []);
});

test('a stored value of the wrong shape gives an empty log', () => {
  for (const bad of ['null', '42', '{"history":"oops"}', '[]']) {
    const s = createStore(fakeStorage({ [KEY]: bad }));
    assert.deepEqual(s.state.history, [], bad);
  }
});

test('sessions missing their items are dropped on load', () => {
  const s = createStore(fakeStorage({ [KEY]: JSON.stringify({ v: 1, history: [session(), { id: 'broken' }, null, 'x'], active: null }) }));
  assert.equal(s.state.history.length, 1);
});

test('storage that refuses to save does not throw', () => {
  const st = { getItem: () => null, setItem: () => { throw new Error('quota'); } };
  const s = createStore(st);
  assert.doesNotThrow(() => s.save());
});

test('backup then restore round-trips the log', () => {
  const a = createStore(fakeStorage());
  a.state.history.push(session('s1'), session('s2'));
  const text = a.backup();
  const b = createStore(fakeStorage());
  assert.equal(b.restore(text), 2);
  assert.equal(b.state.history.length, 2);
});

test('restore rejects text that is not a backup and leaves the log alone', () => {
  const s = createStore(fakeStorage());
  s.state.history.push(session());
  for (const bad of ['', 'hello', '{"history":5}', '{"app":"other","history":[]}']) {
    assert.throws(() => s.restore(bad), /not a backup/, bad);
  }
  assert.equal(s.state.history.length, 1);
});

test('addSeed adds starter sessions once only', () => {
  const st = fakeStorage();
  const s = createStore(st);
  assert.equal(s.addSeed([session('seed')]), true);
  assert.equal(s.addSeed([session('seed')]), false);
  assert.equal(createStore(st).state.history.length, 1);
});

test('the log is kept newest first whatever order it was stored or restored in', () => {
  const older = { ...session('old'), date: '2026-11-20', at: 1795100000000 };
  const newer = { ...session('new'), date: '2026-11-24', at: 1795500000000 };
  const s = createStore(fakeStorage({ [KEY]: JSON.stringify({ v: 1, history: [older, newer], active: null }) }));
  assert.deepEqual(s.state.history.map(x => x.id), ['new', 'old']);
  const t = createStore(fakeStorage());
  t.restore(JSON.stringify({ app: 'sequoia', v: 1, history: [older, newer] }));
  assert.deepEqual(t.state.history.map(x => x.id), ['new', 'old']);
});
