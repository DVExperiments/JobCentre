/*
 * The Job Centre's website. Rendering only: everything comes from PixelUniverse.labour, the working records kept with
 * the census in City's census.js. Supports ?at=YYYY-MM-DDTHH:MM (city time) to visit another moment.
 * Routes: #/ · #/vacancies · #/queue[/<page>] · #/employers · #/employer/<id> · #/worker/<id> · #/dreams
 */
(function () {
  'use strict';
  const U = window.PixelUniverse || {};
  const L = U.labour, K = U.census, C = U.city;
  const $ = (id) => document.getElementById(id);
  const main = $('main');
  const DAY = 86400000, H = 3600000;
  const q = new URLSearchParams(location.search);
  const at = q.get('at');
  const parsed = at ? Date.parse((at.length <= 16 ? at + ':00' : at) + 'Z') - 12 * H : NaN;
  const offset = isNaN(parsed) ? 0 : parsed - Date.now();
  const now = () => Date.now() + offset;
  const AT = isNaN(parsed) ? '' : '?at=' + encodeURIComponent(at);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const link = (r, text) => '<a href="' + AT + '#/' + r + '">' + text + '</a>';
  const num = (n) => Number(n).toLocaleString('en');
  const city = (ms) => ms + 12 * H;
  const fDay = new Intl.DateTimeFormat(undefined, { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });
  const fLong = new Intl.DateTimeFormat(undefined, { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const head = (title, lede, kicker) => '<section class="page-head">' + (kicker ? '<p class="kicker">' + kicker + '</p>' : '') + '<h1>' + title + '</h1>' + (lede ? '<p class="lede">' + lede + '</p>' : '') + '</section>';
  const fact = (k, v, small) => '<div><dt>' + k + '</dt><dd>' + v + (small ? ' <small>' + small + '</small>' : '') + '</dd></div>';
  const census = (id) => 'https://dvexperiments.github.io/City/census.html' + AT + '#/resident/' + id;
  const months = (ms) => { const m = Math.round(ms / (30.44 * DAY)); return m < 1 ? 'under a month' : m === 1 ? 'a month' : m < 24 ? m + ' months' : Math.round(m / 12) + ' years'; };
  const districtName = (d) => C.map(now()).districts[d].name;

  function notYet() {
    const t = now();
    return head('The Job Centre', t < L.start ? 'The Job Centre’s records begin on ' + fLong.format(city(L.start)) + ', and its doors open on ' + fLong.format(city(L.opens)) + '.' : 'The Job Centre opens on ' + fLong.format(city(L.opens)) + '. Its records already show who is working, and who is looking.', 'Pixel City');
  }

  // ---------------------------------------------------------------- today
  function today() {
    const t = now();
    if (t < L.start) return notYet();
    const lm = L.labourAt(t);
    const open = (() => { const d = new Date(city(t)), wd = d.getUTCDay(), h = d.getUTCHours() + d.getUTCMinutes() / 60; return t >= L.opens && wd >= 1 && wd <= 5 && h >= 8.5 && h < 17; })();
    // the ticket being served: a number that climbs through each open day
    const d = new Date(city(t)), mins = Math.max(0, Math.min(510, (d.getUTCHours() - 8) * 60 + d.getUTCMinutes() - 30));
    const ticket = String(Math.floor(mins * lm.looking / 2600) + 1).padStart(4, '0');
    let h = head(num(lm.looking) + ' pixels are looking for work.', 'Unemployment in Pixel City is ' + lm.rate + '%. ' + num(lm.vacancies.length) + ' employers are hiring, and ' + num(lm.dream) + ' pixels are doing their dream job.', t >= L.opens ? 'The Job Centre, ' + fLong.format(city(t)) : 'Opening ' + fLong.format(city(L.opens)));
    if (t >= L.opens) h += '<div class="board"><div><small>Now serving</small><span class="ticket">' + (open ? ticket : '----') + '</span></div><p>' + (open ? 'The Job Centre is open until 5pm. Please wait for your number to be called. <b>Please do not dim yourself in the queue.</b>' : 'The Job Centre is closed. It opens weekdays at 8:30am, city time.') + '</p></div>';
    h += '<dl class="facts">' + fact('Unemployment', lm.rate + '%') + fact('In work', num(lm.employed)) + fact('Looking for work', num(lm.looking)) + fact('Jobs in the city', num(lm.jobs)) + fact('Out of the workforce', num(lm.away), 'studying, caring, at home') + fact('Retired', num(lm.retired)) + '</dl>';
    const news = L.eventsBetween(Math.max(L.start, t - 60 * DAY), t).reverse().slice(0, 8);
    h += '<div class="two"><section><h2>By district</h2><div class="table-wrap"><table class="data"><thead><tr><th>District</th><th class="n">In work</th><th class="n">Looking</th><th class="n">Rate</th></tr></thead><tbody>' +
      lm.byDistrict.slice().sort((a, b) => b.looking / (b.employed + b.looking || 1) - a.looking / (a.employed + a.looking || 1)).map((x) => { const r = x.employed + x.looking ? Math.round(x.looking / (x.employed + x.looking) * 1000) / 10 : 0; return '<tr><td>' + esc(x.name) + '</td><td class="n">' + num(x.employed) + '</td><td class="n">' + num(x.looking) + '</td><td class="n"><span class="hbar" style="width:' + r * 4 + 'px"></span>' + r + '%</td></tr>'; }).join('') + '</tbody></table></div></section>' +
      '<section><h2>News from the Job Centre</h2><ul class="news">' + (news.map((e) => '<li><time>' + fDay.format(city(Date.parse(e.time))) + '</time><span>' + esc(e.headline) + '</span></li>').join('') || '<li><span></span><span class="muted">Nothing yet.</span></li>') + '</ul>' +
      '<h2>Who works where</h2><div class="table-wrap"><table class="data"><tbody>' + Object.keys(lm.bySector).sort((a, b) => lm.bySector[b] - lm.bySector[a]).map((k) => '<tr><td>' + esc(L.SECTOR[k].label) + '</td><td class="n">' + num(lm.bySector[k]) + '</td></tr>').join('') + '</tbody></table></div></section></div>';
    return h;
  }

  // ---------------------------------------------------------------- vacancies
  function vacancies() {
    const t = now();
    if (t < L.start) return notYet();
    const lm = L.labourAt(t), emp = L.employers().byId;
    const total = lm.vacancies.reduce((a, v) => a + v.open, 0);
    let h = head('Vacancies', num(total) + ' positions open at ' + num(lm.vacancies.length) + ' employers. Wages are in watts a week.', 'The Job Centre');
    h += '<ul class="cards">' + lm.vacancies.slice(0, 90).map((v) => { const e = emp[v.id], w = L.SECTOR[e.sector].wage; return '<li class="card"><b>' + esc(e.titles[0].charAt(0).toUpperCase() + e.titles[0].slice(1)) + (e.titles.length > 1 ? ' and more' : '') + '</b><span>' + link('employer/' + e.id, esc(e.name)) + ', ' + esc(districtName(e.district)) + '</span><span>' + Math.round(w * 0.85 / 10) * 10 + ' to ' + Math.round(w * 1.4 / 10) * 10 + ' W a week</span><span class="open">' + v.open + ' open position' + (v.open === 1 ? '' : 's') + '</span></li>'; }).join('') + '</ul>';
    if (lm.vacancies.length > 90) h += '<p class="muted">And ' + num(lm.vacancies.length - 90) + ' more employers with smaller openings.</p>';
    return h;
  }

  // ---------------------------------------------------------------- the queue
  const PAGE = 60;
  function queue(page) {
    const t = now();
    if (t < L.start) return notYet();
    const lm = L.labourAt(t);
    page = +page || 0;
    let h = head('The queue', num(lm.looking) + ' pixels are looking for work, longest waiting first.', 'The Job Centre');
    h += '<div class="table-wrap"><table class="data"><thead><tr><th>#</th><th>Resident</th><th>District</th><th>Waiting</th><th>Why</th></tr></thead><tbody>' +
      lm.queue.slice(page * PAGE, page * PAGE + PAGE).map((x, i) => { const s = K.summary(x.id, t); return '<tr><td>' + (page * PAGE + i + 1) + '</td><td><span class="chip" style="--c:' + s.color + '"></span>' + link('worker/' + x.id, esc(s.name)) + ' <span class="muted">' + s.age + '</span></td><td>' + esc(s.districtName) + '</td><td>' + months(t - x.since) + '</td><td>' + esc(x.reason || '') + '</td></tr>'; }).join('') + '</tbody></table></div>';
    h += '<p class="pager"><span>' + (page > 0 ? link('queue/' + (page - 1), 'Previous ' + PAGE) : '') + '</span><span>' + ((page + 1) * PAGE < lm.queue.length ? link('queue/' + (page + 1), 'Next ' + PAGE) : '') + '</span></p>';
    return h;
  }

  // ---------------------------------------------------------------- employers
  function employers() {
    const t = now();
    if (t < L.start) return notYet();
    const lm = L.labourAt(t), emp = L.employers().byId;
    const rows = Object.keys(lm.head).map((id) => [emp[id], lm.head[id]]).sort((a, b) => b[1] - a[1]).slice(0, 60);
    let h = head('Employers', num(Object.keys(lm.head).length) + ' employers in Pixel City: shops, offices, factories, warehouses, the port, the power stations and the city’s institutions. The largest:', 'The Job Centre');
    h += '<div class="table-wrap"><table class="data"><thead><tr><th>Employer</th><th>Sector</th><th>District</th><th class="n">Staff</th></tr></thead><tbody>' +
      rows.map(([e, n]) => '<tr><td>' + link('employer/' + e.id, esc(e.name)) + '</td><td>' + esc(L.SECTOR[e.sector].label) + '</td><td>' + esc(districtName(e.district)) + '</td><td class="n">' + num(n) + '</td></tr>').join('') + '</tbody></table></div>';
    return h;
  }
  function employer(id) {
    const t = now();
    if (t < L.start) return notYet();
    const e = L.employers().byId[id];
    if (!e) return head('No such employer', link('employers', 'All employers') + '.');
    const staff = L.staffOf(id, t);
    let h = head(esc(e.name), esc(L.SECTOR[e.sector].label) + ' in ' + esc(districtName(e.district)) + ' district. ' + num(staff.length) + ' staff' + (L.operating(e, t) ? '.' : ', though it has closed.'), link('employers', 'Employers'));
    h += '<dl class="facts">' + fact('Staff', num(staff.length)) + fact('Room for', num(e.capacity)) + fact('Usual wage', L.SECTOR[e.sector].wage + ' W', 'a week') + '</dl>';
    h += '<h2>Jobs here</h2><p>' + esc(e.titles.map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join(', ')) + '.</p>';
    if (staff.length) h += '<h2>Staff</h2><ul class="tiles">' + staff.slice(0, 120).map((sid) => { const s = K.summary(sid, t), j = L.jobOf(sid, t); return '<li><a class="tile" href="' + AT + '#/worker/' + sid + '"><span class="sw" style="--c:' + s.color + ';--h:transparent"><i></i></span><b>' + esc(s.name) + '</b><span>' + esc(j.title || '') + '</span></a></li>'; }).join('') + '</ul>';
    return h;
  }

  // ---------------------------------------------------------------- a working life
  const STATUS = { employed: 'In work', looking: 'Looking for work', away: 'Out of the workforce', retired: 'Retired', young: 'Too young to work' };
  function worker(id) {
    const t = now();
    if (t < L.start) return notYet();
    const p = K.person(id, t);
    if (!p) return head('No such resident', '');
    const j = L.jobOf(id, t), career = L.careerOf(id, t);
    let h = '<div class="profile"><span class="sw" style="--c:' + p.color + ';--h:transparent"><i></i></span><div><p class="kicker">' + esc(STATUS[j.status] || '') + '</p><h1 style="font:800 clamp(2rem,5vw,3.2rem)/1 var(--display);margin:0 0 8px">' + esc(p.name) + '</h1>' +
      '<p class="lede" style="font-size:1rem">' + p.age + ', ' + esc(p.districtName) + ' district. <a href="' + census(id) + '">Their census file</a>.</p></div></div>';
    if (j.status === 'employed') h += '<dl class="facts">' + fact('Job', esc(j.title.charAt(0).toUpperCase() + j.title.slice(1))) + fact('Employer', link('employer/' + j.employer, esc(j.employerName))) + fact('Since', fDay.format(city(j.from))) + fact('Wage', num(j.wage) + ' W', 'a week') + fact('Dream job', esc(p.dreamJob.charAt(0).toUpperCase() + p.dreamJob.slice(1)), j.dream ? 'and this is it' : '') + '</dl>';
    else h += '<dl class="facts">' + fact('Status', esc(STATUS[j.status] || '')) + (j.from ? fact('Since', fDay.format(city(j.from))) : '') + (j.reason ? fact('Why', esc(j.reason)) : '') + fact('Dream job', esc(p.dreamJob.charAt(0).toUpperCase() + p.dreamJob.slice(1))) + '</dl>';
    if (career.length) h += '<h2>Working life</h2><p class="hint muted">The Job Centre’s records begin on ' + fDay.format(city(L.start)) + '.</p><div class="table-wrap"><table class="data"><thead><tr><th>From</th><th>To</th><th>What</th></tr></thead><tbody>' +
      career.slice().reverse().map((sp) => '<tr><td>' + (sp.from < L.start ? 'Before records' : fDay.format(city(sp.from))) + '</td><td>' + (sp.to > t || sp.to === Infinity ? 'Now' : fDay.format(city(sp.to))) + '</td><td>' +
        (sp.status === 'employed' ? esc(sp.title.charAt(0).toUpperCase() + sp.title.slice(1)) + ', ' + link('employer/' + sp.employer, esc(sp.employerName)) + (sp.reason && sp.to <= t ? ' <span class="muted">(' + esc(sp.reason) + ')</span>' : '') : esc(STATUS[sp.status]) + (sp.reason ? ' <span class="muted">(' + esc(sp.reason) + ')</span>' : '')) + '</td></tr>').join('') + '</tbody></table></div>';
    return h;
  }

  // ---------------------------------------------------------------- dream jobs
  function dreams() {
    const t = now();
    if (t < L.start) return notYet();
    const lm = L.labourAt(t);
    let h = head('Living the dream', num(lm.dream) + ' pixels are doing the job they always wanted. Every resident tells the Census Office their dream job; the Job Centre does what it can.', 'The Job Centre');
    // a sample of dreamers, from the city's largest employers
    const emp = L.employers().byId, dreamers = [];
    for (const id of Object.keys(lm.head).sort((a, b) => lm.head[b] - lm.head[a]).slice(0, 40)) {
      for (const sid of L.staffOf(id, t)) { const j = L.jobOf(sid, t); if (j.dream) { dreamers.push([sid, j]); if (dreamers.length >= 36) break; } }
      if (dreamers.length >= 36) break;
    }
    h += '<ul class="tiles">' + dreamers.map(([sid, j]) => { const s = K.summary(sid, t); return '<li><a class="tile" href="' + AT + '#/worker/' + sid + '"><span class="sw" style="--c:' + s.color + ';--h:transparent"><i></i></span><b>' + esc(s.name) + '</b><span>' + esc(j.title.charAt(0).toUpperCase() + j.title.slice(1)) + ', ' + esc(emp[j.employer].name) + '</span></a></li>'; }).join('') + '</ul>';
    return h;
  }

  // ---------------------------------------------------------------- routing
  function render() {
    if (!L || !L.ready()) { main.innerHTML = head('The Job Centre is closed', 'It needs the Census Office’s records, and they could not be reached. Please try again shortly.', 'Pixel City'); return; }
    const parts = location.hash.replace(/^#\/?/, '').split('/'), r = parts[0] || '';
    main.innerHTML = '<p class="muted" style="padding:40px 0">Calling the next number…</p>';
    setTimeout(() => {
      main.innerHTML = r === 'vacancies' ? vacancies() : r === 'queue' ? queue(parts[1]) : r === 'employers' ? employers() : r === 'employer' ? employer(parts[1]) : r === 'worker' ? worker(parts[1]) : r === 'dreams' ? dreams() : today();
      document.querySelectorAll('.tabs a').forEach((a) => (a.dataset.r === (r === 'employer' ? 'employers' : r === 'worker' ? '' : r) ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
      window.scrollTo(0, 0);
    }, 20);
  }
  if (AT) {
    const b = $('travel'); b.hidden = false;
    b.innerHTML = 'Visiting the Job Centre at ' + esc(at.replace('T', ' ')) + ', city time. <a href="' + location.pathname + location.hash + '">Return to the present</a>.';
    document.querySelectorAll('.tabs a, .crest-link').forEach((a) => a.setAttribute('href', AT + a.getAttribute('href')));
  }
  window.addEventListener('hashchange', render);
  render();
})();
