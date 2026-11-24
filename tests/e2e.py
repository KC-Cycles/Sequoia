"""Browser run-through at phone size. Run: python3 tests/e2e.py http://localhost:8766
Covers the plan's Review Focus 1, 2, 3 and 5 plus the main path: recommend, log, save, progress, backup."""
import json
import sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8766'
fails = []


def check(name, cond, detail=''):
    print(('ok   ' if cond else 'FAIL ') + name + ((' :: ' + str(detail)) if detail and not cond else ''))
    if not cond:
        fails.append(name)


def wait_js(page, expr, timeout=10000):
    """Poll an expression until it is true. (wait_for_function needs eval, which the app's security policy forbids.)"""
    for _ in range(timeout // 100):
        if page.evaluate(expr):
            return
        page.wait_for_timeout(100)
    raise AssertionError('timed out waiting for: ' + expr)


with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, permissions=['clipboard-read', 'clipboard-write'])
    pg = ctx.new_page()
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/data/seed.json', lambda r: r.fulfill(status=404, body=''))
    pg.route('**/data/activity.json', lambda r: r.fulfill(status=404, body=''))
    pg.route('**/fonts.googleapis.com/**', lambda r: r.abort())

    def history():
        return json.loads(pg.evaluate("localStorage.getItem('sequoia-v1')") or '{"history":[]}')['history']

    # --- empty log: recommends the first lower-body strength session
    pg.goto(BASE + '/index.html')
    pg.wait_for_selector('#today-title')
    check('today recommends the squat day with an empty log', 'Squat day' in pg.inner_text('#today-title'), pg.inner_text('#today-title'))
    check('today shows where each region stands', pg.locator('#where .where-row').count() == 2)
    check('today explains what the session is for', len(pg.inner_text('#today-about')) > 40)
    art = lambda: pg.evaluate("getComputedStyle(document.querySelector('.scene')).backgroundImage")
    seen = {}
    for v in ['today', 'library', 'coach', 'progress']:
        pg.click('.tabs a[href="#%s"]' % v)
        wait_js(pg, "document.body.dataset.view === '%s'" % v)
        seen[v] = art()
    pg.click('.tabs a[href="#today"]')
    wait_js(pg, "document.body.dataset.view === 'today'")
    check('every page has its own illustrated background', all(('art/%s.webp' % v) in seen[v] for v in seen) and len(set(seen.values())) == 4, seen)
    check('the artwork files load', pg.evaluate("Promise.all(['today','workout','library','progress','coach'].map(n => fetch('art/' + n + '.webp').then(r => r.ok))).then(a => a.every(Boolean))"))
    check('today explains why', len(pg.inner_text('#today-why')) > 10)
    check('today shows the week by muscle group and says how often to train each', pg.locator('#week-muscles .mrow').count() == 8 and 'twice a week' in pg.inner_text('#week-muscles').lower())
    check('the tabs are Today, Library, Coach and Progress', [t.strip() for t in pg.locator('.tabs a').all_inner_texts()] == ['Today', 'Library', 'Coach', 'Progress'], pg.locator('.tabs a').all_inner_texts())
    check('the tab bar is lifted off the bottom edge of the screen', pg.evaluate("parseFloat(getComputedStyle(document.querySelector('.tabs')).paddingBottom)") >= 14)
    pg.click('#open-settings')
    wait_js(pg, "document.body.dataset.view === 'settings'")
    check('settings opens from the leaf in the corner', pg.locator('#sync').count() == 1 and pg.get_attribute('#open-settings', 'aria-label') == 'Settings')
    pg.click('.tabs a[href="#today"]'); wait_js(pg, "document.body.dataset.view === 'today'")
    check('a thirty-minute version of today\'s session is one tap away', pg.get_attribute('#start-short', 'data-id') == 'squat-30', pg.locator('#start-short').count())
    t0 = pg.inner_text('#note-title'); pg.click('#note-next')
    check('another field note is one tap away', pg.inner_text('#note-title') != t0)
    pg.click('.tabs a[href="#coach"]'); wait_js(pg, "document.body.dataset.view === 'coach'")
    check('with nothing logged, the coach asks for a first session', 'first session' in pg.inner_text('#insights').lower() and pg.locator('#insights li').count() == 1)
    pg.click('.tabs a[href="#today"]'); wait_js(pg, "document.body.dataset.view === 'today'")
    check('the field note leads with its finding in bold and sets the why apart', pg.locator('.note-card p.finding strong').count() == 1 and pg.locator('.note-card ul.points li strong').count() == 1)
    check('week strip has seven days', pg.locator('.week .day').count() == 7)
    check('a field note is shown', len(pg.inner_text('#note-title')) > 3)

    # --- start it and log every set, one with a blank weight
    pg.click('#start-rec')
    pg.wait_for_selector('.set-row')
    check('workout view shows figures', pg.locator('.ex svg.fig').count() >= 8, pg.locator('.ex svg.fig').count())
    check('squat weight is prefilled with the starting guess', pg.input_value('.ex[data-ex="squat"] .set-row input.w') == '65')
    check('squat reps are prefilled', pg.input_value('.ex[data-ex="squat"] .set-row input.r') == '8')
    pg.locator('.ex[data-ex="hammer"] .set-row input.w').nth(1).fill('')
    for i in range(pg.locator('.pill').count()):
        pg.locator('.pill').nth(i).click()
    n = pg.locator('.set-row button.check').count()
    for i in range(n):
        pg.locator('.set-row button.check').nth(i).click()
        if i == 0:
            check('rest timer starts after a squat set', pg.is_visible('#dock') and 'rest' in pg.inner_text('#dockLabel').lower())
            check('the dock asks how the set felt', pg.locator('#dockAsk [data-ask]').count() == 3 and pg.is_visible('#dockAsk'))
            pg.click('#dockAsk [data-ask="easy"]')
            check('an easy set raises the next sets by one step', pg.locator('.ex[data-ex="squat"] .set-row input.w').nth(1).input_value() == '70' and pg.locator('.ex[data-ex="squat"] .set-row input.w').nth(0).input_value() == '65')
            check('the dock says what to do next', '70 lb' in pg.inner_text('#dockAdvice'), pg.inner_text('#dockAdvice'))
    check('all sets counted', pg.inner_text('#count').startswith('32 of 32'), pg.inner_text('#count'))
    check('the finish card totals the pounds lifted with a comparison', 'lb' in pg.inner_text('#fin-total') and 'about the weight of' in pg.inner_text('#fin-total'), pg.inner_text('#fin-total'))
    pg.click('#save-session')
    pg.wait_for_selector('#today-title')
    h = history()
    check('session saved to the log', len(h) == 1 and h[0]['sessionId'] == 'legs-arms')
    squat = [i for i in h[0]['items'] if i['ex'] == 'squat'][0]
    check('each set stores weight, reps and how it felt', squat['sets'] == [{'w': 65, 'r': 8, 'done': True, 'feel': 'easy'}, {'w': 70, 'r': 8, 'done': True, 'feel': ''}, {'w': 70, 'r': 8, 'done': True, 'feel': ''}], squat['sets'])
    check('the session stores its total pounds', h[0].get('totalLb', 0) > 5000, h[0].get('totalLb'))
    hammer = [i for i in h[0]['items'] if i['ex'] == 'hammer'][0]
    check('blank weight saves as null', hammer['sets'][1]['w'] is None, hammer['sets'][1])
    check('the day after legs, today sends her to upper body instead of resting', 'Pull day' in pg.inner_text('#today-title'), pg.inner_text('#today-title'))
    check('legs show as recovering and upper body as lightly worked', pg.locator('#where .state.recovering').count() == 1 and pg.locator('#where .state.light').count() == 1)

    # --- progress: next target moved up, nothing prints NaN
    pg.goto(BASE + '/index.html#progress')
    pg.wait_for_selector('#lifts tr[data-ex="squat"]')
    check('your tree has one ring after one session', pg.locator('#tree svg.tree .grown').count() == 1, pg.locator('#tree svg.tree .grown').count())
    check('progress shows the top squat weight', '70' in pg.inner_text('#lifts tr[data-ex="squat"] .last'))
    check('next squat target starts where she finished', '70' in pg.inner_text('#lifts tr[data-ex="squat"] .next'))
    check('progress shows lifetime pounds', 'lb' in pg.inner_text('#lifetime'))
    pg.click('.tabs a[href="#library"]'); wait_js(pg, "document.body.dataset.view === 'library'")
    check('sessions you have done get a leaf', pg.locator('#view-library .did').count() >= 1)
    pg.click('[data-start="swim-drills"]'); pg.wait_for_selector('#view-workout svg.fig')
    check('the drills swim shows a stick figure for each drill', pg.locator('#view-workout svg.fig').count() >= 8)
    pg.click('#exit-btn'); wait_js(pg, "document.body.dataset.view === 'today'")
    pg.click('.tabs a[href="#progress"]'); wait_js(pg, "document.body.dataset.view === 'progress'")
    import re as _re
    check('each lift in a session shows the pounds it added', bool(_re.search(r'[0-9,]+ lb$', (pg.locator('#sessions li').first.text_content() or '').strip())), pg.locator('#sessions li').first.text_content())
    pg.click('.tabs a[href="#coach"]'); wait_js(pg, "document.body.dataset.view === 'coach'")
    check('the coach page leads with the charts and numbers, and the written advice comes after', pg.evaluate("(() => { const order = ['#muscles', '#week-compare', '#strength', '#insights'].map(q => document.querySelector(q)); return order.every((el, i) => !i || (order[i - 1].compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)); })()"))
    check('the coach lists specific things to work on', pg.locator('#insights li').count() >= 2 and pg.locator('#insights li strong').count() >= 2, pg.inner_text('#insights'))
    check('the coach compares this week with last', 'lb' in pg.inner_text('#week-compare') and 'sessions' in pg.inner_text('#week-compare').lower())
    check('the coach shows sets for all eight muscle groups', pg.locator('#muscles .mrow').count() == 8)
    check('the coach estimates strength per lift', pg.locator('#strength tr[data-ex]').count() >= 1 and 'squat' in pg.inner_text('#strength').lower())
    pg.click('.tabs a[href="#progress"]'); wait_js(pg, "document.body.dataset.view === 'progress'")
    body = pg.inner_text('body')
    check('no NaN, null or undefined on screen', not any(x in body for x in ['NaN', 'null', 'undefined']))

    # --- library: start a second session the same day and end it early
    pg.goto(BASE + '/index.html#library')
    pg.wait_for_selector('[data-start="press-arms"]')
    check('library lists 50 sessions', pg.locator('[data-start]').count() == 50, pg.locator('[data-start]').count())
    check('sessions you have not done carry no label; the ones you have done carry a leaf', 'not done yet' not in pg.inner_text('#view-library') and pg.locator('#view-library .did').count() == len(set(h['sessionId'] for h in history())), pg.locator('#view-library .did').count())
    check('the library title sits near the top with the picture below it', pg.evaluate("document.querySelector('#view-library h1').getBoundingClientRect().top") < 150, pg.evaluate("document.querySelector('#view-library h1').getBoundingClientRect().top"))
    check('double-day sessions say what they pair with', 'swim day' in pg.inner_text('#view-library').lower() and 'run day' in pg.inner_text('#view-library').lower())
    check('library counts its groups', '50 sessions in 13 groups' in pg.inner_text('#view-library'))
    check('the library opens straight on the workouts, with the guide folded away', pg.evaluate("document.querySelector('#guide').open") is False and pg.evaluate("document.querySelector('[data-start]').getBoundingClientRect().top") < 700, pg.evaluate("document.querySelector('[data-start]').getBoundingClientRect().top"))
    pg.click('#lib-filter [data-max="30"]')
    check('the thirty-minutes-or-less filter shows the nine short sessions', pg.locator('[data-start]:visible').count() == 18, pg.locator('[data-start]:visible').count())
    pg.click('#lib-filter [data-max="0"]')
    check('and All brings every session back', pg.locator('[data-start]:visible').count() == 50)
    seen = {}
    for kind in ['lift', 'run', 'swim', 'bike', 'mobility']:
        pg.click('#lib-type [data-type="%s"]' % kind)
        seen[kind] = pg.locator('[data-start]:visible').count()
    check('the top filter sorts the library into lifts, runs, swims and rides', seen == {'lift': 29, 'run': 5, 'swim': 8, 'bike': 5, 'mobility': 3}, seen)
    pg.click('#lib-type [data-type="bike"]'); pg.click('#lib-filter [data-max="30"]')
    check('the two filters combine: short rides only', pg.locator('[data-start]:visible').count() == 1 and pg.locator('[data-start="bike-short"]:visible').count() == 1)
    pg.click('#lib-filter [data-max="0"]'); pg.click('#lib-type [data-type="all"]')
    check('the type filter sits above the length filter', pg.evaluate("document.querySelector('#lib-type').getBoundingClientRect().top < document.querySelector('#lib-filter').getBoundingClientRect().top"))
    # a guided run: the timer pings at halfway and at the end, and finishing does not write to the lifting log
    n_before = len(history())
    pg.click('[data-start="run-easy"]'); pg.wait_for_selector('#auto-start')
    check('a run explains its steps', pg.locator('#view-workout details.how').count() >= 1 and 'zone 2' in pg.inner_text('#view-workout').lower())
    pg.evaluate("(() => { const n = Date.now.bind(Date); window.__skew = 0; Date.now = () => n() + window.__skew; window.__said = []; Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { speak: u => window.__said.push(u.text), cancel() {}, getVoices: () => [] } }); })()")
    pg.click('#auto-start')
    wait_js(pg, "/brisk walk/i.test(document.querySelector('#dockLabel').textContent)")
    pg.evaluate("window.__skew = (3 * 60 + 1) * 1000")
    wait_js(pg, "/easy run/i.test(document.querySelector('#dockLabel').textContent)")
    check('one tap runs the session: the walk hands over to the run by itself', True)
    pg.evaluate("window.__skew = (3 * 60 + 1 + 11 * 60 + 2) * 1000")
    wait_js(pg, "/halfway/i.test(document.querySelector('#dockLabel').textContent)")
    check('the run timer pings at halfway', 'halfway' in pg.inner_text('#dockLabel').lower())
    pg.evaluate("window.__skew = (3 * 60 + 1 + 22 * 60 + 3) * 1000")
    wait_js(pg, "/^walk/i.test(document.querySelector('#dockLabel').textContent)")
    pg.evaluate("window.__skew = (3 * 60 + 1 + 22 * 60 + 3 + 2 * 60 + 2) * 1000")
    wait_js(pg, "/done/i.test(document.querySelector('#dockLabel').textContent)")
    said = ' | '.join(pg.evaluate("window.__said"))
    check('every change is spoken aloud, so there is no need to look', all(w in said.lower() for w in ['brisk walk', 'easy run', 'halfway', 'walk', 'done']), said)
    pg.evaluate("window.__skew = 0")
    check('a run offers Finish, not Save session', pg.inner_text('#save-session').strip() in ('Finish', 'Finish early'), pg.inner_text('#save-session'))
    pg.click('#save-session'); wait_js(pg, "document.body.dataset.view === 'today'")
    check('finishing a run leaves the lifting log alone', len(history()) == n_before)
    pg.click('.tabs a[href="#library"]'); wait_js(pg, "document.body.dataset.view === 'library'")
    pg.click('#guide > summary')
    check('the library guide is bullets with bold leads, not a wall of text', pg.locator('#guide > ul.points > li > strong').count() >= 5 and pg.locator('#guide > p').count() <= 1)
    check('each group says what it is and when to choose it as two bullets', pg.locator('.group ul.points li strong').count() == 26)
    check('library explains how it is organized', pg.locator('#guide').count() == 1 and 'pull' in pg.inner_text('#view-library').lower())
    check('library guide states the five-day rest rule', 'five hard days' in pg.inner_text('#guide').lower())
    pg.click('[data-start="press-arms"]')
    pg.wait_for_selector('.set-row')
    pg.locator('.set-row button.check').nth(0).click()
    pg.locator('.set-row button.check').nth(1).click()
    check('save button offers ending early', 'early' in pg.inner_text('#save-session').lower(), pg.inner_text('#save-session'))
    pg.click('#save-session')
    pg.wait_for_selector('#today-title')
    h = history()
    check('early session saved with two sets', len(h) == 2 and h[0]['setsDone'] == 2, [x.get('setsDone') for x in h])
    press = [i for i in h[0]['items'] if i['ex'] == 'press'][0]
    check('unchecked sets are stored as not done', [s['done'] for s in press['sets']] == [True, True, False, False], press['sets'])
    check('both sessions show on today in the week strip', pg.locator('.week .day').nth(6).locator('.dot').count() == 2)
    pg.goto(BASE + '/index.html#progress')
    pg.wait_for_selector('#sessions .sess')
    check('progress lists both sessions', pg.locator('#sessions .sess').count() == 2)
    check('your tree has two rings after two sessions', pg.locator('#tree svg.tree .grown').count() == 2)
    pg.wait_for_selector('#lifts tr[data-ex="press"]')
    check('press target holds after an unfinished session', pg.inner_text('#lifts tr[data-ex="press"] .next').strip().startswith(pg.inner_text('#lifts tr[data-ex="press"] .last').strip().split(' ')[0]))

    # --- backup round trip
    pg.goto(BASE + '/index.html#settings')
    pg.wait_for_selector('#advanced')
    pg.click('#advanced > summary')
    pg.click('#copy-backup')
    pg.wait_for_timeout(200)
    backup = pg.evaluate('navigator.clipboard.readText()')
    check('backup copied', '"app":"sequoia"' in backup)
    pg.evaluate("localStorage.clear()")
    pg.reload()
    pg.goto(BASE + '/index.html#settings')
    pg.wait_for_selector('#advanced')
    pg.click('#advanced > summary')
    pg.fill('#restore-in', 'not a backup at all')
    pg.click('#restore-btn')
    check('bad restore text is refused', len(history()) == 0)
    pg.fill('#restore-in', backup)
    pg.click('#restore-btn')
    check('restore brings both sessions back', len(history()) == 2)

    # --- corrupt storage still starts
    pg.evaluate("localStorage.setItem('sequoia-v1', '{broken')")
    pg.goto(BASE + '/index.html')
    pg.reload()
    pg.wait_for_selector('#today-title')
    check('corrupt storage starts with an empty log', 'Squat day' in pg.inner_text('#today-title'))

    # --- outside activity from Strava steers the pick and shows in the week
    ctx2 = b.new_context(viewport={'width': 390, 'height': 844})
    p2 = ctx2.new_page()
    p2.on('pageerror', lambda e: errs.append(str(e)))
    p2.route('**/data/seed.json', lambda r: r.fulfill(status=404, body=''))
    p2.route('**/fonts.googleapis.com/**', lambda r: r.abort())
    start = p2.evaluate("(() => { const d = new Date(Date.now() - 6 * 3600e3); const z = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + 'T' + z(d.getHours()) + ':' + z(d.getMinutes()) + ':00'; })()")
    acts = {'asOf': '2026-11-23T16:55:00Z', 'fitness': {'zone2': {'bpm': [120, 150], 'pace': [540, 630]}, 'best': [{'label': '5K', 'km': 5, 'sec': 1500, 'date': '2026-09-12'}], 'swim': {'pace100': [110, 125]}, 'last': {'Run': '2026-11-01', 'Swim': '2026-09-20'}}, 'activities': [
        {'start': start, 'elapsedSec': 3600, 'movingSec': 3500, 'sport': 'Ride', 'text': 'Ride \u00b7 22.0 mi \u00b7 58 min', 'hard': True, 'lean': 'lower'},
        {'start': start, 'elapsedSec': 900, 'movingSec': 900, 'sport': 'Walk', 'text': 'Walk \u00b7 0.5 mi \u00b7 15 min', 'hard': False, 'lean': None}]}
    p2.route('**/data/activity.json', lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps(acts)))
    p2.goto(BASE + '/index.html')
    p2.wait_for_selector('#activity-asof')
    check('a hard ride five hours ago sends an empty log to upper body', 'Pull day' in p2.inner_text('#today-title'), p2.inner_text('#today-title'))
    check('the reason names the ride', 'Ride' in p2.inner_text('#today-why'), p2.inner_text('#today-why'))
    check('outside activity shows in the week strip', p2.locator('.week .day .ring').count() >= 1)
    check('outside activity is listed', 'Ride' in p2.inner_text('#where'))
    p2.click('.tabs a[href="#coach"]'); wait_js(p2, "document.body.dataset.view === 'coach'")
    check('cardio is drawn as one bar per sport', p2.locator('#cardio .mrow').count() == 3 and 'Rides' in p2.inner_text('#cardio'))
    e = p2.inner_text('#endurance')
    check('the coach shows endurance numbers from Strava: zone 2, easy pace, bests and predictions', '120' in e and '150' in e and '9:00' in e and '25:00' in e and '52:07' in e and '1:55:00' in e, e)
    p2.click('.tabs a[href="#today"]'); wait_js(p2, "document.body.dataset.view === 'today'")
    check('a short activity from today is listed by name, not folded into a count', 'Walk \u00b7 0.5 mi' in p2.inner_text('#where .recent'), p2.inner_text('#where'))

    # --- private sync: a key pasted in Settings lets the phone read Strava and store its log in a private repository
    import base64
    b64 = lambda o: base64.b64encode(json.dumps(o).encode()).decode()
    gh = {'calls': [], 'log': None, 'private': True}
    def github(route):
        req = route.request
        path = req.url.split('api.github.com')[1]
        gh['calls'].append((req.method, path, req.headers.get('authorization', '')))
        if path == '/repos/me/sequoia-data':
            return route.fulfill(status=200, content_type='application/json', body=json.dumps({'private': gh['private']}))
        if path.endswith('/contents/activity.json'):
            return route.fulfill(status=200, content_type='application/json', body=json.dumps({'sha': 'a1', 'content': b64(acts)}))
        if path.endswith('/contents/coach.json'):
            return route.fulfill(status=200, content_type='application/json', body=json.dumps({'sha': 'c1', 'content': b64({'updated': '2026-11-23', 'headline': 'Strong start on legs', 'points': [{'lead': 'Legs', 'text': 'A solid base.'}], 'next': ['Pull day next']})}))
        if path.endswith('/contents/log.json'):
            if req.method == 'PUT':
                gh['log'] = json.loads(base64.b64decode(json.loads(req.post_data)['content']))
                return route.fulfill(status=201, content_type='application/json', body=json.dumps({'content': {'sha': 'l1'}}))
            if gh['log'] is None:
                return route.fulfill(status=404, content_type='application/json', body='{}')
            return route.fulfill(status=200, content_type='application/json', body=json.dumps({'sha': 'l1', 'content': b64(gh['log'])}))
        return route.fulfill(status=404, content_type='application/json', body='{}')
    ctx3 = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, permissions=['clipboard-read', 'clipboard-write'])
    p3 = ctx3.new_page()
    p3.on('pageerror', lambda e: errs.append(str(e)))
    p3.route('**/data/*.json', lambda r: r.fulfill(status=404, body=''))
    p3.route('**/fonts.googleapis.com/**', lambda r: r.abort())
    p3.route('**/api.github.com/**', github)
    p3.goto(BASE + '/index.html#settings')
    p3.wait_for_selector('#sync')
    check('settings offers private sync and asks for the key in a password box', p3.get_attribute('#sync-token', 'type') == 'password' and p3.locator('#sync-connect').count() == 1)
    check('nothing is sent to GitHub before a key is saved', gh['calls'] == [], gh['calls'])
    gh['private'] = False
    p3.fill('#sync-repo', 'me/sequoia-data'); p3.fill('#sync-token', 'test-key-123'); p3.click('#sync-connect')
    wait_js(p3, "document.querySelector('#sync-status').textContent.toLowerCase().includes('public')")
    check('a public repository is refused and the key is not kept', p3.evaluate("localStorage.getItem('sequoia-sync')") is None)
    gh['private'] = True
    p3.fill('#sync-repo', 'me/sequoia-data'); p3.fill('#sync-token', 'test-key-123'); p3.click('#sync-connect')
    p3.wait_for_selector('#sync-disconnect')
    check('a private repository connects', 'me/sequoia-data' in p3.inner_text('#sync-status'), p3.inner_text('#sync-status'))
    p3.click('#copy-key')
    wait_js(p3, "/copied/i.test(document.querySelector('#toast').textContent)")
    check('the key can be copied for moving to a new install, without being shown', p3.evaluate("navigator.clipboard.readText()") == 'test-key-123' and 'test-key-123' not in p3.content())
    check('the key is stored apart from the log and never appears on the page', 'test-key-123' in (p3.evaluate("localStorage.getItem('sequoia-sync')") or '') and 'test-key-123' not in (p3.evaluate("localStorage.getItem('sequoia-v1')") or '') and 'test-key-123' not in p3.content())
    check('every call carried the key and went to the chosen repository', all(c[2] == 'Bearer test-key-123' and c[1].startswith('/repos/me/sequoia-data') for c in gh['calls']), gh['calls'])
    p3.click('.tabs a[href="#today"]')
    p3.wait_for_selector('#activity-asof')
    check('Strava from the private repository steers Today', 'Pull day' in p3.inner_text('#today-title') and 'Ride' in p3.inner_text('#today-why'), p3.inner_text('#today-title'))
    # --- refresh: a button and a pull-down both re-read the private repository; a newer app version reloads the page
    reads = lambda: len([c for c in gh['calls'] if c[0] == 'GET' and c[1].endswith('/contents/activity.json')])
    n0 = reads()
    p3.click('#refresh-now')
    wait_js(p3, "document.querySelector('#toast') && !document.querySelector('#toast').hidden && /up to date/i.test(document.querySelector('#toast').textContent)")
    check('the refresh button re-reads Strava from the private repository', reads() == n0 + 1, (n0, reads()))
    check('the page says how to refresh', 'pull down' in p3.inner_text('#activity-asof').lower(), p3.inner_text('#activity-asof'))
    drag = """(dy) => { const t = y => new Touch({ identifier: 1, target: document.body, clientX: 200, clientY: y });
      const fire = (type, list) => document.dispatchEvent(new TouchEvent(type, { touches: list, targetTouches: list, changedTouches: [t(100 + dy)], bubbles: true }));
      window.scrollTo(0, 0); fire('touchstart', [t(100)]); fire('touchmove', [t(100 + dy / 2)]); fire('touchmove', [t(100 + dy)]);
      const label = document.querySelector('#pull').hidden ? '' : document.querySelector('#pull').textContent; fire('touchend', []); return label; }"""
    p3.wait_for_timeout(300)
    n1 = reads()
    label = p3.evaluate(drag, 30)
    p3.wait_for_timeout(400)
    check('a small drag does nothing', reads() == n1, (n1, reads(), label))
    label = p3.evaluate(drag, 140)
    for _ in range(40):
        if reads() > n1: break
        p3.wait_for_timeout(100)
    check('pulling the page down refreshes', reads() == n1 + 1 and 'release' in label.lower(), (n1, reads(), label))
    p3.wait_for_timeout(500)
    p3.route('**/js/version.js*', lambda r: r.fulfill(status=200, content_type='text/javascript', body="export const VERSION = 'next-build';\n"))
    p3.evaluate("window.__mark = 1")
    p3.click('#refresh-now')
    wait_js(p3, "window.__mark === undefined && !!document.querySelector('#today-title')")
    check('a newer version of the app reloads the page on refresh', True)
    p3.evaluate("window.__mark = 2"); p3.wait_for_timeout(900)
    check('and it reloads only once', p3.evaluate("window.__mark") == 2)
    p3.wait_for_selector('#activity-asof')
    p3.click('.tabs a[href="#coach"]'); wait_js(p3, "document.body.dataset.view === 'coach'")
    check('a written review from the private repository shows on the coach page', 'Strong start on legs' in p3.inner_text('#coach-note') and 'Pull day next' in p3.inner_text('#coach-note'), p3.inner_text('#view-coach')[:200])
    p3.click('.tabs a[href="#today"]'); wait_js(p3, "document.body.dataset.view === 'today'")
    p3.click('#start-rec'); p3.wait_for_selector('.set-row button.check')
    p3.locator('.set-row button.check').first.click()
    p3.wait_for_timeout(1100)
    p3.click('#pause-btn')
    c1 = p3.inner_text('#clock'); p3.wait_for_timeout(1300)
    check('pause stops the clock and says so', p3.inner_text('#clock') == c1 and 'paused' in p3.inner_text('.bar').lower() and p3.is_hidden('#dock'), (c1, p3.inner_text('#clock')))
    p3.click('#exit-btn'); wait_js(p3, "document.body.dataset.view === 'today'")
    check('exit leaves the workout and keeps it for later', p3.locator('#resume').count() == 1 and 'paused' in p3.inner_text('.hero').lower())
    p3.click('#resume'); wait_js(p3, "document.body.dataset.view === 'workout'")
    p3.wait_for_timeout(1200)
    check('resume picks the clock back up with the set still checked', p3.inner_text('#clock') != c1 and p3.locator('.set-row button.check.on, .set-row.done').count() >= 1 and p3.inner_text('#pause-btn').strip() == 'Pause', (c1, p3.inner_text('#clock')))
    p3.click('#save-session')
    wait_js(p3, "document.body.dataset.view === 'today'")
    for _ in range(40):
        if gh['log']: break
        p3.wait_for_timeout(100)
    check('a saved session is stored in the private repository as a backup', bool(gh['log']) and gh['log'].get('app') == 'sequoia' and len(gh['log']['history']) == 1, gh['log'] and list(gh['log'].keys()))
    check('the backup never contains the key', 'test-key-123' not in json.dumps(gh['log']))
    # a second phone (or a reinstall) with the same key gets the log back
    ctx4 = b.new_context(viewport={'width': 390, 'height': 844})
    p4 = ctx4.new_page()
    p4.on('pageerror', lambda e: errs.append(str(e)))
    p4.route('**/data/*.json', lambda r: r.fulfill(status=404, body=''))
    p4.route('**/fonts.googleapis.com/**', lambda r: r.abort())
    p4.route('**/api.github.com/**', github)
    p4.goto(BASE + '/index.html#settings'); p4.wait_for_selector('#sync')
    p4.fill('#sync-repo', 'me/sequoia-data'); p4.fill('#sync-token', 'test-key-123'); p4.click('#sync-connect')
    p4.wait_for_selector('#sync-disconnect')
    wait_js(p4, "(JSON.parse(localStorage.getItem('sequoia-v1') || '{}').history || []).length === 1")
    check('a fresh install with the key gets the log back', True)
    p4.click('#sync-disconnect')
    p4.wait_for_selector('#sync-connect')
    check('disconnect removes the key from the phone and keeps the log', p4.evaluate("localStorage.getItem('sequoia-sync')") is None and p4.evaluate("JSON.parse(localStorage.getItem('sequoia-v1')).history.length") == 1)

    # --- the page that holds the key loads nothing from other sites and may only talk to GitHub's API
    p5 = ctx3.new_page(); reqs = []
    p5.on('request', lambda r: reqs.append(r.url))
    p5.route('**/api.github.com/**', github)
    p5.goto(BASE + '/index.html'); p5.wait_for_selector('#today-title'); p5.wait_for_timeout(600)
    other = [u for u in reqs if not u.startswith(BASE) and 'api.github.com/repos/me/sequoia-data' not in u]
    check('no requests go anywhere except the app itself and the private repository', other == [], other[:3])
    csp = p5.get_attribute('meta[http-equiv="Content-Security-Policy"]', 'content') or ''
    check('a content security policy limits connections to GitHub and scripts to the app', "connect-src 'self' https://api.github.com" in csp and "script-src 'self'" in csp, csp)
    check('the fonts are served by the app', p5.evaluate("document.fonts.ready.then(() => document.fonts.check('700 20px \"Zilla Slab\"') && document.fonts.check('400 16px Figtree'))"))
    blocked = p5.evaluate("fetch('https://example.com/').then(() => 'sent', () => 'blocked')")
    check('a request to any other site is blocked', blocked == 'blocked', blocked)

    check('no page errors', errs == [], errs)
    b.close()

print('\n' + ('ALL PASSED' if not fails else str(len(fails)) + ' FAILED: ' + ', '.join(fails)))
sys.exit(1 if fails else 0)
