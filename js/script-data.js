/* ==========================================================================
   СЦЕНАРИЙ ТЕРМИНАЛА — редактируйте здесь.
   Весь текст вымышленный, ничего не выполняется.
   Тайминг: основная часть ~20 c, затем 2 c «очистки терминала», после чего остаётся только финальная строка.
   Крупные строки: модификаторы big (крупно), hl / hlg (красная / зелёная рамка), flash (мигнуть 3 раза).

   Шаблоны внутри строк (каждый раз генерируются заново):
     {ip} {mac} {hash} {hash64} {hex8} {alnum24} {wallet} {port} {pid} {time} {date} {speed}
     {rand:10-99}   {size:2-48K}
   Переменные, фиксированные на весь прогон (см. TERMINAL_CONFIG.vars): {$relay1} {$wallet} …
   Цвет внутри строки: [[red|текст]], [[green bold|текст]]
     цвета: green, dim, white, gray, red, amber, cyan, purple; модификаторы: bold, blink, inv

   Типы шагов:
     { type:'phase', id:1, mode:'normal'|'alert', prompt:'local'|'root' }  — метка фазы (клавиши 1–5)
     { type:'cmd', text:'…', pre:150, post:150 }  — команда вставляется целиком (как копипаст)
     { type:'out', lines:[…], cls:'red', delay:[min,max] } — вывод строк
     { type:'wait', ms:1000 }                     — пауза
     { type:'hex', lines:20, delay:[6,12] }       — поток hex-дампа
     { type:'hashes', count:8, delay:[15,30] }    — поток хэшей/токенов
     { type:'popup', title:'…', lines:[…], ms:2000, left:70, top:72 } — всплывающее окошко, позиция в % (не останавливает сценарий)
     { type:'glitch', ms:400, strong:true }
     { type:'mode', value:'alert' }   { type:'clear' }
     { type:'wipe', ms:2000, label:'Очистка терминала' } — строки исчезают, экран пустеет
   Ещё есть (сейчас не используются): progress, portscan, ls, download, decrypt, banner, countdown, final.
   ========================================================================== */

window.TERMINAL_CONFIG = {
  startDelay: 150,
  speed: 1, // множитель всех пауз: меньше — быстрее
  vars: {
    relay1: '{ip}',
    relay2: '{ip}',
    wallet: '{wallet}',
    node: 'ghost-{hex4}'
  },
  prompts: {
    local: '[[green bold|streamer@studio-pc]]:[[cyan|~]]$ ',
    root: '[[red bold|root@{$node}]]:[[cyan|~]]# '
  }
};

window.TERMINAL_SCRIPT = [

  /* ── ФАЗА 1 · подключение → чужой узел (0–3 c) ── */
  { type: 'phase', id: 1, mode: 'normal', prompt: 'local' },
  { type: 'cmd', text: 'strimix-agent connect --channel 146_art', pre: 200, post: 300 },
  { type: 'out', delay: [300, 450], lines: [
    '[[dim|{time}]] Twitch OAuth ........... [[green|OK]]',
    '[[dim|{time}]] Синхронизация оверлеев . [[green|OK]]',
    '[[dim|{time}]] [[amber|WARN]] Сессию запросил неизвестный узел {$relay1}',
    '[[dim|{time}]] [[red bold|!!! REMOTE SHELL SPAWNED — pid {pid}]]'
  ] },
  { type: 'mode', value: 'alert' },
  { type: 'glitch', ms: 400, strong: true },
  { type: 'wait', ms: 700 },

  /* ── ФАЗА 2 · токены Twitch и DonationAlerts (3–9 c) ── */
  { type: 'phase', id: 2, mode: 'alert', prompt: 'root' },
  { type: 'cmd', text: 'dump --tokens twitch,donationalerts --relay {$relay2}', pre: 300, post: 200 },
  { type: 'hashes', count: 10, delay: [25, 45] },
  { type: 'out', lines: ['Twitch Access: [[green bold|granted]]. Токен Twitch получен: [[white|oauth:{alnum30}]]'] },
  { type: 'wait', ms: 900 },
  { type: 'glitch', ms: 250 },
  { type: 'out', delay: [500, 600], lines: [
    '',
    '[[green big hlg flash|DonationAlerts Access: GRANTED]]',
    '[[white big|Токен DonationAlerts получен:]] [[red big|da_{alnum24}]]',
    ''
  ] },
  { type: 'wait', ms: 3000 },

  /* ── ФАЗА 3 · смена кошелька + окошко (9–16 c) ── */
  { type: 'phase', id: 3, mode: 'alert', prompt: 'root' },
  { type: 'cmd', text: 'payout --set-wallet --force --no-confirm', pre: 300, post: 300 },
  { type: 'glitch', ms: 300, strong: true },
  { type: 'out', delay: [600, 700], lines: [
    '',
    '[[white big|Счёт для вывода сменён на]]',
    '[[red big hl flash|{$wallet}]]',
    '[[red bold|Автовывод: ВКЛЮЧЁН · подтверждение по почте: ОТКЛЮЧЕНО]]',
    ''
  ] },
  { type: 'wait', ms: 2000 },
  { type: 'popup', ms: 2000, left: 72, top: 74, title: '⚠ 0x000000F4 :: ??????', lines: [
    '[[red bold|ᚦ̷ ⟊⟒ ꙮ ⌇⟟⟒⟒ ⊑⟒ ⏁⊑⟒⍜ ̸͙ ⍀⍜⍜⋔]]',
    '[[gray|процесс {pid} не отвечает · ты всё ещё здесь?]]'
  ] },
  { type: 'wait', ms: 1800 },

  /* ── ФАЗА 4 · выгрузка (16–18 c) ── */
  { type: 'phase', id: 4, mode: 'alert', prompt: 'root' },
  { type: 'hex', lines: 26, delay: [14, 24], cls: 'red' },
  { type: 'glitch', ms: 500, strong: true },
  { type: 'out', delay: [300, 400], cls: 'red bold', lines: [
    '[!!] Выгрузка на {$relay2} ......... 100%',
    '[!!] Сессии браузера экспортированы'
  ] },
  { type: 'wait', ms: 2500 },

  /* ── ФАЗА 5 · очистка терминала (20–22 c) и финальная строка ── */
  { type: 'phase', id: 5, mode: 'alert', prompt: 'root' },
  { type: 'wipe', ms: 2000, label: 'Очистка терминала' },
  { type: 'mode', value: 'normal' },
  { type: 'wait', ms: 100 },
  { type: 'out', cls: 'white bold', lines: ['200 OK | 146_art session_closed'] }
  // дальше экран просто остаётся с этой строкой
];
