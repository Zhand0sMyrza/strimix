/* ==========================================================================
   Движок «терминала взлома». Чисто визуальная имитация:
   ничего не выполняется, никаких сетевых запросов, никаких данных посетителя.
   Сценарий — в js/script-data.js (window.TERMINAL_SCRIPT / TERMINAL_CONFIG).

   Скрытое управление:
     Space — пауза / продолжение
     R     — перезапуск с начала
     F     — полноэкранный режим
     1..5  — мгновенный переход к фазе
   ========================================================================== */
(function () {
  'use strict';

  var SCRIPT = window.TERMINAL_SCRIPT || [];
  var CFG = window.TERMINAL_CONFIG || {};
  var MAX_LINES = 400;

  var $screen = document.getElementById('screen');
  var $out = document.getElementById('output');
  var $banner = document.getElementById('banner');
  var $bannerBox = $banner.querySelector('.banner-box');
  var $cd = document.getElementById('countdown');
  var $cdLabel = $cd.querySelector('.cd-label');
  var $cdTime = $cd.querySelector('.cd-time');
  var $final = document.getElementById('final');
  var $glitch = document.getElementById('glitch');

  /* ---------------- Случайности ---------------- */
  var R = {
    int: function (a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; },
    float: function (a, b) { return Math.random() * (b - a) + a; },
    pick: function (arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    chance: function (p) { return Math.random() < p; },
    hex: function (n) { var s = ''; for (var i = 0; i < n; i++) s += '0123456789abcdef'[Math.random() * 16 | 0]; return s; },
    range: function (v, a, b) { return Array.isArray(v) ? R.int(v[0], v[1]) : (v != null ? v : R.int(a, b)); }
  };

  var pad2 = function (n) { return String(n).padStart(2, '0'); };

  var GEN = {
    // Только зарезервированные/непубличные диапазоны: RFC1918, CGNAT, benchmark, TEST-NET 1/2/3.
    ip: function () {
      return R.pick([
        function () { return '10.' + R.int(0, 255) + '.' + R.int(0, 255) + '.' + R.int(1, 254); },
        function () { return '172.' + R.int(16, 31) + '.' + R.int(0, 255) + '.' + R.int(1, 254); },
        function () { return '192.168.' + R.int(0, 255) + '.' + R.int(1, 254); },
        function () { return '100.' + R.int(64, 127) + '.' + R.int(0, 255) + '.' + R.int(1, 254); },
        function () { return '198.' + R.int(18, 19) + '.' + R.int(0, 255) + '.' + R.int(1, 254); },
        function () { return '192.0.2.' + R.int(1, 254); },
        function () { return '198.51.100.' + R.int(1, 254); },
        function () { return '203.0.113.' + R.int(1, 254); }
      ])();
    },
    // Локально администрируемый unicast MAC (бит 0x02) — не принадлежит реальному вендору.
    mac: function () {
      var first = ((R.int(0, 63) << 2) | 2).toString(16).padStart(2, '0');
      var parts = [first];
      for (var i = 0; i < 5; i++) parts.push(R.hex(2));
      return parts.join(':').toUpperCase();
    },
    bytes: function (n) {
      var u = ['B', 'KB', 'MB', 'GB'], i = 0;
      while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
      return (i === 0 ? Math.round(n) : n.toFixed(n < 10 ? 2 : 1)) + ' ' + u[i];
    },
    parseSize: function (spec) { // '2-48K' → случайное число байт
      var m = /^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)([BKMG])?$/i.exec(String(spec || '1-900K'));
      if (!m) return R.int(1024, 900 * 1024);
      var mult = { B: 1, K: 1024, M: 1048576, G: 1073741824 }[(m[3] || 'K').toUpperCase()];
      return Math.round(R.float(+m[1], +m[2]) * mult);
    },
    speed: function () { return R.float(1.8, 98).toFixed(1) + ' MB/s'; },
    time: function () {
      var d = new Date(Date.now() + timeOffset);
      timeOffset += R.int(40, 900);
      return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds()) + '.' + String(d.getMilliseconds()).padStart(3, '0');
    },
    date: function () { var d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); },
    lsDate: function () {
      var M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      var d = new Date(Date.now() - R.int(0, 120) * 86400000);
      return M[d.getMonth()] + ' ' + String(d.getDate()).padStart(2, ' ') + ' ' + pad2(R.int(0, 23)) + ':' + pad2(R.int(0, 59));
    }
  };
  var timeOffset = 0;

  /* Шаблоны в строках сценария:
       {ip} {mac} {hash} {hash64} {hex8} {port} {pid} {time} {date} {speed}
       {rand:10-99}  {size:2-48K}  {$имя} — переменная из TERMINAL_CONFIG.vars */
  var vars = {};
  function expand(str) {
    return String(str).replace(/\{(\$)?([a-zA-Z]+)(\d*)(?::([^}]*))?\}/g, function (m, dollar, name, num, arg) {
      if (dollar) return Object.prototype.hasOwnProperty.call(vars, name + num) ? vars[name + num] : m;
      switch (name) {
        case 'ip': return GEN.ip();
        case 'mac': return GEN.mac();
        case 'hash': case 'hex': return R.hex(+num || 32);
        case 'port': return R.int(1024, 65535);
        case 'pid': return R.int(300, 65000);
        case 'time': return GEN.time();
        case 'date': return GEN.date();
        case 'speed': return GEN.speed();
        case 'size': return GEN.bytes(GEN.parseSize(arg));
        case 'rand': { var p = String(arg || '0-100').split('-'); return R.int(+p[0], +p[1]); }
        default: return m;
      }
    });
  }

  /* ---------------- Пауза / прерывание ---------------- */
  var token = 0;
  var paused = false;
  var ABORT = { abort: true };

  function sleep(ms) {
    var my = token;
    return new Promise(function (resolve, reject) {
      var left = Math.max(0, ms || 0);
      var last = performance.now();
      function tick() {
        if (my !== token) return reject(ABORT);
        var now = performance.now();
        if (!paused) left -= now - last;
        last = now;
        if (left <= 0) resolve();
        else setTimeout(tick, Math.min(left, 40));
      }
      setTimeout(tick, Math.min(left, 40));
    });
  }
  function spawn(fn) { fn().catch(function (e) { if (e !== ABORT) console.error(e); }); }

  /* ---------------- Вывод ---------------- */
  var cursor = document.createElement('span');
  cursor.className = 'cursor';

  function classes(c) {
    if (!c) return '';
    return String(c).split(/\s+/).filter(Boolean).map(function (x) { return 'c-' + x; }).join(' ');
  }

  // Мини-разметка: [[red|текст]], [[red bold|текст]]
  function renderInline(target, text, append) {
    if (!append) target.textContent = '';
    var re = /\[\[([a-z ]+)\|([\s\S]*?)\]\]/g, last = 0, m;
    text = String(text);
    while ((m = re.exec(text))) {
      if (m.index > last) target.appendChild(document.createTextNode(text.slice(last, m.index)));
      var s = document.createElement('span');
      s.className = classes(m[1]);
      s.textContent = m[2];
      target.appendChild(s);
      last = re.lastIndex;
    }
    if (last < text.length) target.appendChild(document.createTextNode(text.slice(last)));
  }

  function scrollDown() { $screen.scrollTop = $screen.scrollHeight; }

  function addLine(content, cls) {
    var line = document.createElement('div');
    line.className = 'line ' + classes(cls);
    var ct = document.createElement('span');
    ct.className = 'ct';
    line.appendChild(ct);
    if (content) renderInline(ct, expand(content));
    $out.appendChild(line);
    line.appendChild(cursor);
    while ($out.childElementCount > MAX_LINES) $out.removeChild($out.firstElementChild);
    scrollDown();
    return ct;
  }
  function setLine(ct, content) { renderInline(ct, content); }

  /* ---------------- Состояние ---------------- */
  var promptKey = 'local';
  function promptText() { return expand((CFG.prompts || {})[promptKey] || '$ '); }
  function setMode(m) { document.body.dataset.mode = m || 'normal'; }

  /* ---------------- Эффекты ---------------- */
  var bannerTimer = 0;
  function showBanner(text, ms) {
    $bannerBox.textContent = expand(text);
    $banner.classList.add('show');
    var my = ++bannerTimer;
    if (ms > 0) spawn(function () { return sleep(ms).then(function () { if (my === bannerTimer) $banner.classList.remove('show'); }); });
  }
  function hideBanner() { bannerTimer++; $banner.classList.remove('show'); }

  var glitchDepth = 0;
  async function glitch(ms, strong) {
    glitchDepth++;
    document.body.classList.add('glitching');
    if (strong) document.body.classList.add('strong');
    var end = ms || 500, t = 0;
    try {
      while (t < end) {
        $glitch.textContent = '';
        var n = R.int(strong ? 4 : 2, strong ? 9 : 5);
        for (var i = 0; i < n; i++) {
          var b = document.createElement('i');
          b.className = R.pick(['', '', 'r', 'c', strong ? 'k' : '']);
          b.style.top = R.int(0, 96) + '%';
          b.style.height = R.int(2, strong ? 14 : 7) + '%';
          b.style.transform = 'translateX(' + R.int(-40, 40) + 'px)';
          $glitch.appendChild(b);
        }
        var step = R.int(40, 90);
        await sleep(step);
        t += step;
      }
    } finally {
      glitchDepth--;
      if (glitchDepth <= 0) {
        glitchDepth = 0;
        document.body.classList.remove('glitching', 'strong');
        $glitch.textContent = '';
      }
    }
  }

  var countdownPromise = null;
  function startCountdown(seconds, label) {
    $cdLabel.textContent = expand(label || 'TIME LEFT');
    $cd.classList.add('show');
    $cd.classList.remove('urgent');
    var left = seconds * 1000;
    function draw() {
      var s = Math.max(0, Math.ceil(left / 1000));
      $cdTime.textContent = pad2(Math.floor(s / 60)) + ':' + pad2(s % 60);
      $cd.classList.toggle('urgent', s <= 10);
    }
    draw();
    countdownPromise = (async function () {
      while (left > 0) { await sleep(100); left -= 100; draw(); }
    })();
    countdownPromise.catch(function () {});
  }

  /* ---------------- Типы шагов ---------------- */
  function typeDelay(ch) {
    var t = CFG.typing || {};
    var d = R.int(t.min || 30, t.max || 95);
    if (ch === ' ') d += R.int(10, 80);
    if (R.chance(0.18)) d = R.int(14, 32);          // быстрые «очереди»
    if (R.chance(0.035)) d += R.int(180, 420);      // задумался
    return d;
  }

  var STEPS = {
    phase: async function (s) {
      if (s.mode) setMode(s.mode);
      if (s.prompt) promptKey = s.prompt;
    },
    mode: async function (s) { setMode(s.value); },
    prompt: async function (s) { promptKey = s.value; },
    wait: async function (s) { await sleep(R.range(s.ms, 500, 1000)); },
    clear: async function () { $out.textContent = ''; },

    cmd: async function (s) {
      var ct = addLine('', s.cls);
      renderInline(ct, s.prompt != null ? expand(s.prompt) : promptText(), true);
      var span = document.createElement('span');
      span.className = classes(s.textCls || 'white');
      ct.appendChild(span);
      await sleep(R.range(s.pre, 250, 650));
      var text = expand(s.text);
      for (var i = 0; i < text.length; i++) {
        // изредка — опечатка с исправлением
        if (text[i] !== ' ' && R.chance(0.018)) {
          span.textContent += R.pick('asdfjkl;qweruio'.split(''));
          await sleep(R.int(90, 200));
          span.textContent = span.textContent.slice(0, -1);
          await sleep(R.int(60, 140));
        }
        span.textContent += text[i];
        await sleep(typeDelay(text[i]));
      }
      await sleep(R.range(s.post, 180, 450));
    },

    out: async function (s) {
      var lines = s.lines || [s.text];
      for (var i = 0; i < lines.length; i++) {
        var l = lines[i];
        if (l && typeof l === 'object') addLine(l.t, l.c || s.cls);
        else addLine(l, s.cls);
        if (i < lines.length - 1) await sleep(R.range(s.delay, 8, 45));
      }
      if (s.after) await sleep(R.range(s.after));
    },

    progress: async function (s) {
      var label = expand(s.label || 'Working');
      var width = s.width || 34;
      var dur = s.duration || 3000;
      var ct = addLine('', s.cls || 'white');
      var p = 0;
      function draw() {
        var f = Math.round(p / 100 * width);
        setLine(ct, label.padEnd(s.labelWidth || 30) + ' [' + '█'.repeat(f) + '░'.repeat(width - f) + '] ' + String(p).padStart(3) + '%');
      }
      draw();
      while (p < 100) {
        var stall = R.chance(0.08);
        p = Math.min(100, p + (stall ? 0 : R.int(1, 7)));
        draw();
        await sleep(stall ? R.int(250, 600) : (dur / 26) * R.float(0.4, 1.4));
      }
      if (s.done) { await sleep(120); addLine(s.done, s.doneCls || 'green'); }
    },

    portscan: async function (s) {
      var colCls = { open: 'green', filtered: 'amber', closed: 'dim' };
      addLine('PORT       STATE      SERVICE          VERSION', 'white bold');
      for (var i = 0; i < s.rows.length; i++) {
        var r = s.rows[i];
        await sleep(R.range(s.delay, 140, 480));
        addLine(String(r[0]).padEnd(11) + String(r[1]).padEnd(11) + String(r[2]).padEnd(17) + expand(r[3] || ''), colCls[r[1]] || 'green');
      }
    },

    ls: async function (s) {
      var user = s.user || 'streamer';
      addLine('total ' + R.int(120, 980), 'gray');
      for (var i = 0; i < s.entries.length; i++) {
        var e = s.entries[i];
        var dir = /\/$/.test(e.name);
        var perms = dir ? 'drwxr-xr-x' : (e.hot ? '-rw-------' : '-rw-r--r--');
        var size = dir ? String(R.int(2, 40) * 32) : String(GEN.parseSize(e.size));
        var line = perms + ' ' + String(dir ? R.int(2, 30) : 1).padStart(3) + ' ' + user.padEnd(9) + ' staff ' + size.padStart(10) + ' ' + GEN.lsDate() + ' ' + e.name;
        addLine(line, e.hot ? 'red' : (dir ? 'cyan' : 'green'));
        await sleep(R.range(s.delay, 20, 70));
      }
    },

    download: async function (s) {
      for (var i = 0; i < s.files.length; i++) {
        var f = s.files[i];
        var total = GEN.parseSize(f.size);
        var name = expand(f.name);
        var ct = addLine('', f.hot ? 'red' : 'white');
        var got = 0;
        var dur = Math.min(4200, Math.max(500, Math.log(total) * 170)) * (s.speed || 1);
        var t0 = 0;
        while (got < total) {
          var step = R.int(50, 120);
          await sleep(step);
          t0 += step;
          got = Math.min(total, got + total * (step / dur) * R.float(0.4, 1.7));
          var pct = Math.floor(got / total * 100);
          var bar = Math.round(pct / 100 * 20);
          var spd = (total / dur * 1000 / 1048576 * R.float(0.6, 1.4));
          setLine(ct, '  ↓ ' + name.padEnd(30) + ' [' + '█'.repeat(bar) + '░'.repeat(20 - bar) + '] ' + String(pct).padStart(3) + '%  ' +
            (GEN.bytes(got) + ' / ' + GEN.bytes(total)).padEnd(22) + ' ' + (spd < 1 ? (spd * 1024).toFixed(0) + ' KB/s' : spd.toFixed(1) + ' MB/s'));
        }
        setLine(ct, '  [[green|✓]] ' + name.padEnd(30) + ' ' + GEN.bytes(total).padEnd(11) + ' [[dim|sha1:' + R.hex(16) + ']]');
        await sleep(R.int(60, 220));
      }
    },

    hex: async function (s) {
      var addr = R.int(0x1000, 0xfffff) * 16;
      var n = R.range(s.lines, 30, 60);
      for (var i = 0; i < n; i++) {
        var bytes = [], ascii = '';
        for (var b = 0; b < 16; b++) {
          var v = R.chance(0.15) ? 0 : R.int(0, 255);
          bytes.push(v.toString(16).padStart(2, '0'));
          ascii += v >= 33 && v <= 126 ? String.fromCharCode(v) : '.';
        }
        addLine((addr + i * 16).toString(16).padStart(8, '0') + '  ' + bytes.slice(0, 8).join(' ') + '  ' + bytes.slice(8).join(' ') + '  |' + ascii + '|', s.cls || 'dim');
        await sleep(R.range(s.delay, 10, 30));
      }
    },

    hashes: async function (s) {
      var n = R.range(s.count, 20, 40);
      var fmts = [
        function () { return '[[dim|[' + GEN.time() + ']]] ' + R.hex(32) + ':' + R.hex(32) + '  [[green|NTLM]]'; },
        function () { return '[[dim|[' + GEN.time() + ']]] sha256 ' + R.hex(64); },
        function () { return '[[dim|[' + GEN.time() + ']]] $2b$12$' + R.hex(22) + R.hex(31) + '  [[amber|bcrypt]]'; },
        function () { return '[[dim|[' + GEN.time() + ']]] token ' + R.hex(8) + '-' + R.hex(4) + '-' + R.hex(4) + '-' + R.hex(4) + '-' + R.hex(12) + '  [[cyan|session]]'; }
      ];
      for (var i = 0; i < n; i++) {
        addLine(R.pick(fmts)(), s.cls || 'green');
        await sleep(R.range(s.delay, 15, 60));
      }
    },

    decrypt: async function (s) {
      var CH = '!@#$%^&*()_+=-{}[]<>?/\\|~ABCDEFabcdef0123456789';
      var targets = s.lines.map(function (l) { return expand(l); });
      var rows = targets.map(function (t) {
        var ct = addLine('', s.cls || 'white');
        var reveal = [];
        for (var i = 0; i < t.length; i++) reveal.push((i / Math.max(1, t.length)) * 0.55 + Math.random() * 0.45);
        return { ct: ct, t: t, reveal: reveal };
      });
      var dur = s.duration || 4000, el = 0;
      while (el <= dur) {
        var k = el / dur;
        rows.forEach(function (r) {
          var out = '';
          for (var i = 0; i < r.t.length; i++) out += k >= r.reveal[i] || r.t[i] === ' ' && k > 0.3 ? r.t[i] : CH[Math.random() * CH.length | 0];
          r.ct.textContent = out;
        });
        await sleep(45);
        el += 45;
      }
      rows.forEach(function (r) { r.ct.textContent = r.t; });
      if (s.done) addLine(s.done, s.doneCls || 'green');
    },

    banner: async function (s) {
      if (s.hide) { hideBanner(); return; }
      showBanner(s.text, s.ms != null ? s.ms : 2500);
      if (s.wait) await sleep(s.ms || 2500);
    },

    glitch: async function (s) {
      if (s.wait) await glitch(s.ms, s.strong);
      else spawn(function () { return glitch(s.ms, s.strong); });
    },

    countdown: async function (s) { startCountdown(s.seconds || 30, s.label); },
    waitCountdown: async function () { if (countdownPromise) await countdownPromise; },

    final: async function (s) {
      hideBanner();
      $final.querySelector('.final-title').textContent = expand(s.title || '');
      var box = $final.querySelector('.final-lines');
      box.textContent = '';
      (s.lines || []).forEach(function (l) {
        var d = document.createElement('div');
        renderInline(d, expand(l));
        box.appendChild(d);
      });
      (box.lastElementChild || box).appendChild(cursor);
      $final.classList.add('show');
    }
  };

  /* ---------------- Запуск ---------------- */
  function resetScene() {
    $out.textContent = '';
    hideBanner();
    $cd.classList.remove('show', 'urgent');
    $final.classList.remove('show');
    document.body.classList.remove('glitching', 'strong');
    $glitch.textContent = '';
    glitchDepth = 0;
    countdownPromise = null;
    timeOffset = 0;
    promptKey = 'local';
    setMode('normal');
    paused = false;
    vars = {};
    var v = CFG.vars || {};
    Object.keys(v).forEach(function (k) { vars[k] = expand(v[k]); });
  }

  async function run(from) {
    var my = ++token;
    resetScene();
    from = from || 0;
    // применяем состояние (режим/промпт) всех шагов до точки старта
    for (var j = 0; j < from; j++) {
      var p = SCRIPT[j];
      if (p.type === 'phase' || p.type === 'mode' || p.type === 'prompt') await STEPS[p.type](p);
    }
    try {
      for (var i = from; i < SCRIPT.length; i++) {
        if (my !== token) return;
        var step = SCRIPT[i];
        var fn = STEPS[step.type];
        if (!fn) { console.warn('Неизвестный шаг', step); continue; }
        await fn(step);
      }
    } catch (e) {
      if (e !== ABORT) console.error(e);
    }
  }

  function phaseIndex(id) {
    for (var i = 0; i < SCRIPT.length; i++) if (SCRIPT[i].type === 'phase' && SCRIPT[i].id === id) return i;
    return -1;
  }

  function toggleFullscreen() {
    var d = document;
    if (!d.fullscreenElement && !d.webkitFullscreenElement) {
      var el = d.documentElement;
      (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el);
    } else {
      (d.exitFullscreen || d.webkitExitFullscreen || function () {}).call(d);
    }
  }

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    var c = e.code;
    if (c === 'Space') { e.preventDefault(); paused = !paused; return; }
    if (c === 'KeyR') { e.preventDefault(); run(0); return; }
    if (c === 'KeyF') { e.preventDefault(); toggleFullscreen(); return; }
    var m = /^(?:Digit|Numpad)([1-9])$/.exec(c);
    if (m) {
      var idx = phaseIndex(+m[1]);
      if (idx >= 0) { e.preventDefault(); run(idx); }
    }
  });

  setTimeout(function () { run(0); }, CFG.startDelay || 600);
})();
