// The log on this phone: load, save, backup and restore. Storage is passed in so tests can fake it.

export const KEY = 'sequoia-v1';

function validSession(s) {
  return !!s && typeof s === 'object' && Array.isArray(s.items) && typeof s.date === 'string';
}
function when(s) {
  if (Number.isFinite(s.at)) return s.at;
  const t = Date.parse(s.date + 'T12:00:00');
  return Number.isFinite(t) ? t : 0;
}
// Valid sessions only, newest first.
function clean(history) {
  return (Array.isArray(history) ? history : []).filter(validSession).sort((a, b) => when(b) - when(a)).map(s => ({
    ...s,
    items: s.items.filter(it => it && typeof it === 'object' && typeof it.ex === 'string').map(it => ({ ...it, sets: Array.isArray(it.sets) ? it.sets.filter(x => x && typeof x === 'object') : [] }))
  }));
}
function fresh() { return { v: 1, history: [], active: null, seeded: false, deleted: [] }; }
// Ids of sessions deleted on purpose, so a sync never brings them back. The most recent 500 are kept.
const ids = list => (Array.isArray(list) ? list.filter(x => typeof x === 'string' && x).slice(-500) : []);

export function createStore(storage) {
  let state = fresh();
  try {
    const raw = JSON.parse(storage.getItem(KEY) || 'null');
    if (raw && typeof raw === 'object' && !Array.isArray(raw) && Array.isArray(raw.history)) {
      state = { v: 1, history: clean(raw.history), active: raw.active && typeof raw.active === 'object' ? raw.active : null, seeded: !!raw.seeded, deleted: ids(raw.deleted) };
    }
  } catch (e) { state = fresh(); }

  const store = {
    state,
    save() { try { storage.setItem(KEY, JSON.stringify(store.state)); } catch (e) { /* storage full or blocked: keep running from memory */ } },
    backup() { return JSON.stringify({ app: 'sequoia', v: 1, history: store.state.history }); },
    restore(text) {
      let d = null;
      try { d = JSON.parse(text); } catch (e) { d = null; }
      if (!d || d.app !== 'sequoia' || !Array.isArray(d.history)) throw new Error('not a backup');
      store.state.history = clean(d.history);
      const back = new Set(store.state.history.map(h => h.id));
      store.state.deleted = ids(store.state.deleted).filter(id => !back.has(id));
      store.state.seeded = true;
      store.save();
      return store.state.history.length;
    },
    // Delete one logged session for good.
    remove(id) {
      const n = store.state.history.length;
      store.state.history = store.state.history.filter(h => h.id !== id);
      if (store.state.history.length === n) return false;
      store.state.deleted = ids(ids(store.state.deleted).filter(x => x !== id).concat(id));
      store.save();
      return true;
    },
    addSeed(list) {
      if (store.state.seeded) return false;
      store.state.history = clean(list).concat(store.state.history);
      store.state.seeded = true;
      store.save();
      return true;
    }
  };
  return store;
}
