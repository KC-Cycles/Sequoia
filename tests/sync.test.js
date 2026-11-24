import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeHistory, b64encode, b64decode, validRepo, loadConfig, saveConfig, clearConfig, createSync, syncLog, SYNC_KEY } from '../js/sync.js';

const S = (id, at) => ({ id, at, date: '2026-11-22', items: [] });

// A stand-in for GitHub: files live in a map, every call is recorded.
function fakeGitHub(files = {}, repoInfo = { private: true }) {
  const calls = [];
  let n = 0;
  const fetch = async (url, opts = {}) => {
    calls.push({ url, method: opts.method || 'GET', headers: opts.headers || {}, body: opts.body ? JSON.parse(opts.body) : null });
    const u = new URL(url);
    const m = u.pathname.match(/^\/repos\/me\/data(?:\/contents\/(.+))?$/);
    const res = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
    if (!m) return res(404, {});
    if (!m[1]) return repoInfo ? res(200, repoInfo) : res(404, {});
    const path = m[1];
    if ((opts.method || 'GET') === 'GET') return files[path] ? res(200, { sha: files[path].sha, content: b64encode(files[path].text), encoding: 'base64' }) : res(404, {});
    const body = JSON.parse(opts.body);
    if (files[path] && body.sha !== files[path].sha) return res(409, {});
    files[path] = { sha: 'sha' + (++n), text: b64decode(body.content) };
    return res(files[path].sha === 'sha1' ? 201 : 200, { content: { sha: files[path].sha } });
  };
  return { fetch, calls, files };
}

test('mergeHistory keeps every session once, this phone winning a tie, newest first', () => {
  const local = [S('b', 20), { ...S('a', 10), title: 'mine' }];
  const remote = [S('c', 30), { ...S('a', 10), title: 'theirs' }];
  const out = mergeHistory(local, remote);
  assert.deepEqual(out.map(s => s.id), ['c', 'b', 'a']);
  assert.equal(out[2].title, 'mine');
  assert.deepEqual(mergeHistory(local, null).map(s => s.id), ['b', 'a']);
});

test('base64 round-trips text with accents and symbols', () => {
  const text = JSON.stringify({ t: 'Ride · 22.0 mi — café', n: 'x'.repeat(70000) });
  assert.equal(b64decode(b64encode(text)), text);
});

test('validRepo accepts owner/name and nothing else', () => {
  assert.ok(validRepo('me/data'));
  for (const bad of ['', 'me', 'me/data/x', 'https://github.com/me/data', 'me/da ta', '../x']) assert.ok(!validRepo(bad), bad);
});

test('the key is kept under its own storage name, apart from the log', () => {
  const mem = {}; const storage = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = v; }, removeItem: k => { delete mem[k]; } };
  assert.equal(loadConfig(storage), null);
  saveConfig(storage, { repo: 'me/data', token: 'tok' });
  assert.deepEqual(Object.keys(mem), [SYNC_KEY]);
  assert.deepEqual(loadConfig(storage), { repo: 'me/data', token: 'tok' });
  clearConfig(storage);
  assert.equal(loadConfig(storage), null);
  mem[SYNC_KEY] = 'not json';
  assert.equal(loadConfig(storage), null);
});

test('every request goes to api.github.com for the chosen repository and carries the key', async () => {
  const gh = fakeGitHub({ 'activity.json': { sha: 's', text: '{"asOf":"x","activities":[]}' } });
  const c = createSync({ fetch: gh.fetch, repo: 'me/data', token: 'tok' });
  const r = await c.getJSON('activity.json');
  assert.deepEqual(r, { ok: true, status: 200, sha: 's', data: { asOf: 'x', activities: [] } });
  assert.equal(gh.calls[0].url, 'https://api.github.com/repos/me/data/contents/activity.json');
  assert.equal(gh.calls[0].headers.Authorization, 'Bearer tok');
  assert.deepEqual(await c.getJSON('missing.json'), { ok: false, status: 404 });
});

test('check passes a private repository and refuses a public one, a bad key, or no connection', async () => {
  const mk = (info, f) => createSync({ fetch: f || fakeGitHub({}, info).fetch, repo: 'me/data', token: 'tok' });
  assert.deepEqual(await mk({ private: true }).check(), { ok: true, reason: 'ok' });
  assert.deepEqual(await mk({ private: false }).check(), { ok: false, reason: 'public' });
  assert.deepEqual(await mk(null).check(), { ok: false, reason: 'repo' });
  assert.deepEqual(await mk(null, async () => ({ ok: false, status: 401, json: async () => ({}) })).check(), { ok: false, reason: 'key' });
  assert.deepEqual(await mk(null, async () => { throw new Error('offline'); }).check(), { ok: false, reason: 'offline' });
});

test('syncLog creates the log file as a restorable backup when none exists', async () => {
  const gh = fakeGitHub();
  const c = createSync({ fetch: gh.fetch, repo: 'me/data', token: 'tok' });
  const out = await syncLog(c, [S('a', 10)]);
  assert.equal(out.ok, true); assert.equal(out.pushed, true);
  const saved = JSON.parse(gh.files['log.json'].text);
  assert.equal(saved.app, 'sequoia'); assert.deepEqual(saved.history.map(s => s.id), ['a']);
});

test('syncLog merges both ways and only writes when the stored file is missing something', async () => {
  const gh = fakeGitHub({ 'log.json': { sha: 's0', text: JSON.stringify({ app: 'sequoia', v: 1, history: [S('old', 5)] }) } });
  const c = createSync({ fetch: gh.fetch, repo: 'me/data', token: 'tok' });
  const out = await syncLog(c, [S('new', 9)]);
  assert.deepEqual(out.history.map(s => s.id), ['new', 'old']);
  assert.equal(out.pushed, true);
  assert.deepEqual(JSON.parse(gh.files['log.json'].text).history.map(s => s.id), ['new', 'old']);
  const puts = gh.calls.filter(x => x.method === 'PUT').length;
  const again = await syncLog(c, out.history);
  assert.equal(again.pushed, false);
  assert.equal(gh.calls.filter(x => x.method === 'PUT').length, puts);
});

test('syncLog with replace overwrites the stored log, and an empty phone never wipes it', async () => {
  const gh = fakeGitHub({ 'log.json': { sha: 's0', text: JSON.stringify({ app: 'sequoia', v: 1, history: [S('old', 5)] }) } });
  const c = createSync({ fetch: gh.fetch, repo: 'me/data', token: 'tok' });
  const pulled = await syncLog(c, []);
  assert.deepEqual(pulled.history.map(s => s.id), ['old']);
  assert.equal(pulled.pushed, false);
  const out = await syncLog(c, [S('only', 7)], { replace: true });
  assert.deepEqual(out.history.map(s => s.id), ['only']);
  assert.deepEqual(JSON.parse(gh.files['log.json'].text).history.map(s => s.id), ['only']);
});

test('syncLog reports a failure without throwing and leaves the phone log alone', async () => {
  const c = createSync({ fetch: async () => { throw new Error('offline'); }, repo: 'me/data', token: 'tok' });
  const out = await syncLog(c, [S('a', 1)]);
  assert.equal(out.ok, false); assert.equal(out.reason, 'offline');
  assert.deepEqual(out.history.map(s => s.id), ['a']);
});

import { guessRepo } from '../js/sync.js';
test('guessRepo suggests the owner\'s private repository on a GitHub Pages address and nothing elsewhere', () => {
  assert.equal(guessRepo('someone.github.io'), 'someone/sequoia-private');
  assert.equal(guessRepo('localhost'), '');
  assert.equal(guessRepo('claude.ai'), '');
  assert.equal(guessRepo(''), '');
});
