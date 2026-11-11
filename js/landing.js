/* Strimix — лендинг. Все данные вымышленные и генерируются локально. Никаких сетевых запросов. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  var rnd = function (a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; };
  var pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  var fmt = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var NICKS = ['kotik_pro', 'dushnila228', 'vasya_gg', 'lisa_plays', 'mr_bober', 'nightowl', 'pelmen4ik',
    'kek_master', 'sanya_cs', 'yummy_tea', 'glebushka', 'zhenya_vod', 'tapok_3000', 'marshmallow', 'ded_inside'];
  var MESSAGES = ['Спасибо за стрим!', 'На новый микрофон 🎤', 'Включи Шрека 😂', 'Лучший стрим недели',
    'Передаю привет маме', 'GG WP', 'За аукцион!', 'Купи коту корм 🐈', 'Это было легендарно', 'Ещё один каток!'];
  var SUMS = [50, 100, 100, 150, 200, 300, 300, 500, 500, 1000, 1500, 2000];
  var LOTS = [
    { name: 'Интерстеллар', type: 'фильм', pts: 48200 },
    { name: 'Elden Ring', type: 'игра', pts: 41350 },
    { name: 'Шрек 2', type: 'фильм', pts: 36900 },
    { name: 'Hollow Knight', type: 'игра', pts: 29800 },
    { name: 'Дюна: Часть вторая', type: 'фильм', pts: 22450 },
    { name: 'Hades II', type: 'игра', pts: 18700 }
  ];

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* ---------- Пилюльный переключатель ---------- */
  var pills = document.querySelectorAll('.pill');
  var indicator = document.querySelector('.pill-indicator');
  function moveIndicator(btn) {
    if (!indicator || !btn) return;
    indicator.style.left = btn.offsetLeft + 'px';
    indicator.style.width = btn.offsetWidth + 'px';
  }
  function setTab(name) {
    pills.forEach(function (p) {
      var on = p.dataset.tab === name;
      p.classList.toggle('active', on);
      p.setAttribute('aria-selected', on ? 'true' : 'false');
      if (on) moveIndicator(p);
    });
    document.querySelectorAll('[data-panel]').forEach(function (p) { p.classList.toggle('active', p.dataset.panel === name); });
    document.querySelectorAll('[data-side]').forEach(function (s) { s.classList.toggle('active', s.dataset.side === name); });
  }
  pills.forEach(function (p) { p.addEventListener('click', function () { setTab(p.dataset.tab); }); });
  window.addEventListener('resize', function () { moveIndicator(document.querySelector('.pill.active')); });
  moveIndicator(document.querySelector('.pill.active'));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveIndicator(document.querySelector('.pill.active')); });

  /* ---------- Таймеры ---------- */
  document.querySelectorAll('[data-timer]').forEach(function (t) {
    var s = +t.dataset.timer;
    setInterval(function () {
      s = s > 0 ? s - 1 : 600;
      t.textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    }, 1000);
  });

  /* ---------- Аукцион ---------- */
  function createAuction(root) {
    var limit = +root.dataset.limit || 5;
    var bidsRoot = root.parentElement.querySelector('[data-widget="bids"]');
    var lots = LOTS.slice(0, limit).map(function (l) {
      var row = el('div', 'lot');
      row.appendChild(el('span', 'lot-rank'));
      var name = el('span', 'lot-name', l.name);
      name.appendChild(el('small', null, l.type));
      row.appendChild(name);
      row.appendChild(el('span', 'lot-pts'));
      root.appendChild(row);
      return { pts: l.pts + rnd(0, 900), el: row, name: l.name };
    });

    function render(animate) {
      var first = new Map();
      if (animate) lots.forEach(function (l) { first.set(l.el, l.el.getBoundingClientRect().top); });
      lots.sort(function (a, b) { return b.pts - a.pts; });
      var max = lots[0].pts;
      lots.forEach(function (l, i) {
        root.appendChild(l.el);
        l.el.querySelector('.lot-rank').textContent = i + 1;
        l.el.querySelector('.lot-pts').textContent = fmt(l.pts);
        l.el.style.setProperty('--w', Math.max(8, (l.pts / max) * 100) + '%');
      });
      if (animate && !reduceMotion && Element.prototype.animate) {
        lots.forEach(function (l) {
          var dy = first.get(l.el) - l.el.getBoundingClientRect().top;
          if (dy) l.el.animate([{ transform: 'translateY(' + dy + 'px)' }, { transform: 'none' }], { duration: 500, easing: 'cubic-bezier(.2,.7,.2,1)' });
        });
      }
    }

    function addBid(nick, lot, amount) {
      if (!bidsRoot) return;
      var b = el('div', 'bid');
      var left = el('span');
      left.appendChild(el('b', null, nick));
      left.appendChild(document.createTextNode(' → ' + lot));
      b.appendChild(left);
      b.appendChild(el('em', null, '+' + fmt(amount)));
      bidsRoot.insertBefore(b, bidsRoot.firstChild);
      while (bidsRoot.children.length > 6) bidsRoot.removeChild(bidsRoot.lastChild);
    }

    render(false);
    for (var i = 0; i < 6; i++) addBid(pick(NICKS), pick(lots).name, rnd(1, 25) * 100);

    (function tick() {
      // чаще ставят на нижние лоты — так интереснее перестановки
      var idx = Math.random() < 0.6 ? rnd(1, lots.length - 1) : rnd(0, lots.length - 1);
      var lot = lots[idx];
      var amount = rnd(2, 40) * 100;
      lot.pts += amount;
      lot.el.classList.add('bump');
      setTimeout(function () { lot.el.classList.remove('bump'); }, 600);
      addBid(pick(NICKS), lot.name, amount);
      render(true);
      setTimeout(tick, rnd(1300, 2600));
    })();
  }
  document.querySelectorAll('[data-widget="auction"]').forEach(createAuction);

  /* ---------- Донаты ---------- */
  function avatarColor(nick) {
    var h = 0;
    for (var i = 0; i < nick.length; i++) h = (h * 31 + nick.charCodeAt(i)) % 360;
    return 'hsl(' + (250 + (h % 60)) + ' 70% 52%)';
  }
  function makeDonation() {
    return { nick: pick(NICKS), sum: pick(SUMS), msg: pick(MESSAGES) };
  }
  function createDonations(root) {
    var limit = +root.dataset.limit || 4;
    var alertBox = root.dataset.alertTarget ? root.parentElement.querySelector('[data-alert]') : null;

    function add(d, silent) {
      var row = el('div', 'don');
      var ava = el('div', 'ava', d.nick.charAt(0).toUpperCase());
      ava.style.background = avatarColor(d.nick);
      var body = el('div', 'don-body');
      body.appendChild(el('div', 'don-nick', d.nick));
      body.appendChild(el('div', 'don-msg', d.msg));
      row.appendChild(ava);
      row.appendChild(body);
      row.appendChild(el('div', 'don-sum', fmt(d.sum) + ' ₽'));
      root.insertBefore(row, root.firstChild);
      while (root.children.length > limit) root.removeChild(root.lastChild);
      if (alertBox && !silent) {
        alertBox.querySelector('[data-alert-nick]').textContent = d.nick;
        alertBox.querySelector('[data-alert-sum]').textContent = fmt(d.sum) + ' ₽';
        alertBox.querySelector('[data-alert-msg]').textContent = '«' + d.msg + '»';
        alertBox.classList.remove('pop');
        void alertBox.offsetWidth;
        alertBox.classList.add('pop');
      }
    }
    for (var i = 0; i < limit; i++) add(makeDonation(), true);
    (function tick() {
      add(makeDonation(), false);
      setTimeout(tick, rnd(2400, 4200));
    })();
  }
  document.querySelectorAll('[data-widget="donations"]').forEach(createDonations);

  /* ---------- Голосования ---------- */
  document.querySelectorAll('[data-widget="poll"]').forEach(function (poll) {
    var opts = Array.prototype.slice.call(poll.querySelectorAll('.poll-opt'));
    var votes = opts.map(function (o) { return parseFloat(o.style.getPropertyValue('--p')) * 10; });
    setInterval(function () {
      votes = votes.map(function (v) { return v + rnd(0, 30); });
      var total = votes.reduce(function (a, b) { return a + b; }, 0);
      var maxV = Math.max.apply(null, votes);
      opts.forEach(function (o, i) {
        var p = Math.round(votes[i] / total * 100);
        o.style.setProperty('--p', p + '%');
        o.querySelector('b').textContent = p + '%';
        o.classList.toggle('lead', votes[i] === maxV);
      });
    }, 2800);
  });

  /* ---------- Цели ---------- */
  document.querySelectorAll('[data-goal]').forEach(function (fill) {
    var label = fill.closest('.card').querySelector('[data-goal-text]');
    var m = label.textContent.replace(/\s/g, '').match(/(\d+)\/(\d+)/);
    if (!m) return;
    var cur = +m[1], goal = +m[2];
    setInterval(function () {
      cur = cur + rnd(1, 6) * 50;
      if (cur > goal * 0.97) cur = goal * 0.55;
      label.textContent = fmt(cur) + ' / ' + fmt(goal) + ' ₽';
      fill.style.setProperty('--g', (cur / goal * 100).toFixed(1) + '%');
    }, 3200);
  });

  /* ---------- Счётчики ---------- */
  document.querySelectorAll('[data-widget="counter"]').forEach(function (c) {
    var val = c.querySelector('.counter-val');
    c.querySelectorAll('[data-step]').forEach(function (b) {
      b.addEventListener('click', function () {
        val.textContent = Math.max(0, (+val.textContent) + (+b.dataset.step));
      });
    });
  });

  /* ---------- Оверлеи ---------- */
  document.querySelectorAll('[data-ov-toggle]').forEach(function (t) {
    t.addEventListener('click', function () {
      var on = t.getAttribute('aria-pressed') !== 'true';
      t.setAttribute('aria-pressed', on ? 'true' : 'false');
      var ov = document.querySelector('[data-ov="' + t.dataset.ovToggle + '"]');
      if (ov) ov.classList.toggle('off', !on);
    });
  });

  /* ---------- График аналитики ---------- */
  document.querySelectorAll('[data-widget="chart"]').forEach(function (svg) {
    var NS = 'http://www.w3.org/2000/svg';
    var W = 600, H = 200, N = 36, pts = [];
    var v = 40;
    for (var i = 0; i < N; i++) {
      v += rnd(-8, 12);
      if (i === 22) v += 45;           // «пик» — рейд/клип
      if (i === 25) v -= 35;
      v = Math.max(20, Math.min(170, v));
      pts.push([i * (W / (N - 1)), H - v]);
    }
    var d = 'M' + pts[0][0] + ' ' + pts[0][1];
    for (var j = 1; j < pts.length; j++) {
      var p0 = pts[j - 1], p1 = pts[j], cx = (p0[0] + p1[0]) / 2;
      d += ' C' + cx + ' ' + p0[1] + ' ' + cx + ' ' + p1[1] + ' ' + p1[0] + ' ' + p1[1];
    }
    var area = document.createElementNS(NS, 'path');
    area.setAttribute('class', 'area');
    area.setAttribute('d', d + ' L' + W + ' ' + H + ' L0 ' + H + ' Z');
    var line = document.createElementNS(NS, 'path');
    line.setAttribute('class', 'stroke draw');
    line.setAttribute('d', d);
    svg.appendChild(area);
    svg.appendChild(line);
    var peak = pts.reduce(function (a, b) { return b[1] < a[1] ? b : a; });
    var dot = document.createElementNS(NS, 'circle');
    dot.setAttribute('class', 'peak');
    dot.setAttribute('cx', peak[0]); dot.setAttribute('cy', peak[1]); dot.setAttribute('r', 7);
    svg.appendChild(dot);
    var label = document.createElementNS(NS, 'text');
    label.setAttribute('x', Math.min(peak[0] + 12, W - 90)); label.setAttribute('y', Math.max(peak[1] - 12, 14));
    label.textContent = 'пик · 1 284';
    svg.appendChild(label);
    try { line.style.setProperty('--len', Math.ceil(line.getTotalLength())); } catch (e) { /* noop */ }
  });

  /* ---------- Счётчики-доверия ---------- */
  function countUp(node) {
    var target = +node.dataset.count, suffix = node.dataset.suffix || '';
    if (reduceMotion || target === 0) { node.textContent = fmt(target) + suffix; return; }
    var start = performance.now(), dur = 1600;
    (function frame(now) {
      var t = Math.min(1, (now - start) / dur);
      var e = 1 - Math.pow(1 - t, 3);
      node.textContent = fmt(target * e) + suffix;
      if (t < 1) requestAnimationFrame(frame);
    })(start);
  }

  /* ---------- Появление при скролле ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        e.target.querySelectorAll('[data-count]').forEach(countUp);
        io.unobserve(e.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (r) { io.observe(r); });
  } else {
    revealEls.forEach(function (r) { r.classList.add('in'); });
  }
})();
