// Private sync. The app's code is public; the log and the Strava snapshot are not, so they live in a
// private GitHub repository that this phone reads and writes with a key the owner pastes in once.
// The key is stored under its own name on this phone, is never part of a backup, and is sent
// only to api.github.com. A repository that is not private is refused.

export const SYNC_KEY = 'sequoia-sync';
const API = 'https://api.github.com';

export function validRepo(repo) {
  return typeof repo === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9_.-]+$/.test(repo) && !repo.includes('..');
}

export function loadConfig(storage) {
  try {
    const c = JSON.parse(storage.getItem(SYNC_KEY) || 'null');
    return c && validRepo(c.repo) && typeof c.token === 'string' && c.token ? { repo: c.repo, token: c.token } : null;
  } catch (e) { return null; }
}
export function saveConfig(storage, cfg) { storage.setItem(SYNC_KEY, JSON.stringify({ repo: cfg.repo, token: cfg.token })); }
export function clearConfig(storage) { storage.removeItem(SYNC_KEY); }

export function b64encode(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
  return btoa(bin);
}
export function b64decode(b64) {
  const bin = atob(String(b64).replace(/\s/g, ''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

const when = s => (Number.isFinite(s.at) ? s.at : Date.parse(s.date + 'T12:00:00') || 0);
// Every session from both sides, once. This phone's copy wins when both have the same one.
export function mergeHistory(local, remote) {
  const seen = new Map();
  for (const s of [...(Array.isArray(local) ? local : []), ...(Array.isArray(remote) ? remote : [])]) {
    if (s && typeof s === 'object' && s.id && !seen.has(s.id)) seen.set(s.id, s);
  }
  return [...seen.values()].sort((a, b) => when(b) - when(a));
}

export function createSync({ fetch, repo, token }) {
  const headers = { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  const base = API + '/repos/' + repo;
  return {
    repo,
    // Is the key good, can it see the repository, and is the repository private?
    async check() {
      let r;
      try { r = await fetch(base, { headers, cache: 'no-store' }); } catch (e) { return { ok: false, reason: 'offline' }; }
      if (r.status === 401 || r.status === 403) return { ok: false, reason: 'key' };
      if (!r.ok) return { ok: false, reason: 'repo' };
      const info = await r.json();
      return info && info.private === true ? { ok: true, reason: 'ok' } : { ok: false, reason: 'public' };
    },
    async getJSON(path) {
      const r = await fetch(base + '/contents/' + path, { headers, cache: 'no-store' });
      if (!r.ok) return { ok: false, status: r.status };
      const f = await r.json();
      return { ok: true, status: r.status, sha: f.sha, data: JSON.parse(b64decode(f.content)) };
    },
    async putJSON(path, data, sha, message) {
      const body = { message: message || 'Update ' + path, content: b64encode(JSON.stringify(data)) };
      if (sha) body.sha = sha;
      const r = await fetch(base + '/contents/' + path, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) return { ok: false, status: r.status };
      const out = await r.json();
      return { ok: true, status: r.status, sha: out && out.content ? out.content.sha : null };
    }
  };
}

const sameIds = (a, b) => a.length === b.length && a.every((s, i) => s.id === b[i].id);
const fail = status => (status === 401 || status === 403 ? 'key' : status === 404 ? 'repo' : 'error');

// Bring the phone's log and the stored log.json into line. The stored file is a normal backup, plus
// a list of the ids of sessions deleted on purpose so that no phone ever brings one back.
// replace: the phone's log is the truth (used after Restore), and it overrides earlier deletions.
// An empty phone never wipes the store.
export async function syncLog(client, history, opts = {}) {
  const local = Array.isArray(history) ? history : [];
  const mine = Array.isArray(opts.deleted) ? opts.deleted : [];
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const cur = await client.getJSON('log.json');
      if (!cur.ok && cur.status !== 404) return { ok: false, reason: fail(cur.status), history: local, deleted: mine, pushed: false };
      const remote = cur.ok && cur.data && Array.isArray(cur.data.history) ? cur.data.history : [];
      const theirs = cur.ok && cur.data && Array.isArray(cur.data.deleted) ? cur.data.deleted.filter(x => typeof x === 'string') : [];
      const replace = !!opts.replace && local.length > 0;
      const kept = new Set(replace ? local.map(s => s.id) : []);
      const deleted = [...new Set([...theirs, ...mine])].filter(id => !kept.has(id)).slice(-500);
      const gone = new Set(deleted);
      const next = (replace ? local : mergeHistory(local, remote)).filter(s => !gone.has(s.id));
      const stored = mergeHistory(remote, []);
      const same = sameIds(next, stored) && deleted.length === theirs.length && theirs.every(id => gone.has(id));
      const push = cur.ok ? !same || replace : next.length > 0;
      if (!push) return { ok: true, reason: 'ok', history: next, deleted, pushed: false };
      const body = { app: 'sequoia', v: 1, history: next };
      if (deleted.length) body.deleted = deleted;
      const put = await client.putJSON('log.json', body, cur.ok ? cur.sha : null, 'Update training log');
      if (put.ok) return { ok: true, reason: 'ok', history: next, deleted, pushed: true };
      if (put.status !== 409) return { ok: false, reason: fail(put.status), history: local, deleted: mine, pushed: false };
    }
    return { ok: false, reason: 'error', history: local, deleted: mine, pushed: false };
  } catch (e) {
    return { ok: false, reason: 'offline', history: local, deleted: mine, pushed: false };
  }
}

// On a GitHub Pages address the owner's name is in the host, so the private repository can be suggested.
export function guessRepo(hostname) {
  const m = /^([a-z0-9-]+)\.github\.io$/i.exec(hostname || '');
  return m ? m[1] + '/sequoia-private' : '';
}
