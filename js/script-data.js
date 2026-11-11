/* ==========================================================================
   СЦЕНАРИЙ ТЕРМИНАЛА — редактируйте здесь.
   Весь текст вымышленный, ничего не выполняется.
   Тайминг: ~8 c анимации (включая 2 c «очистки терминала») + 3 c на финальную строку.

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
     { type:'popup', title:'…', lines:[…], ms:2000 } — всплывающее окошко (не останавливает сценарий)
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

  /* ── ФАЗА 1 · подключение → чужой узел (≈1 c) ── */
  { type: 'phase', id: 1, mode: 'normal', prompt: 'local' },
  { type: 'cmd', text: 'strimix-agent connect --channel 146_art', pre: 120, post: 150 },
  { type: 'out', delay: [70, 120], lines: [
    '[[dim|{time}]] Twitch OAuth ........... [[green|OK]]',
    '[[dim|{time}]] [[amber|WARN]] Сессию запросил неизвестный узел {$relay1}',
    '[[dim|{time}]] [[red bold|!!! REMOTE SHELL SPAWNED — pid {pid}]]'
  ] },
  { type: 'mode', value: 'alert' },
  { type: 'glitch', ms: 300, strong: true },
  { type: 'wait', ms: 500 },

  /* ── ФАЗА 2 · токены (≈2 c) ── */
  { type: 'phase', id: 2, mode: 'alert', prompt: 'root' },
  { type: 'cmd', text: 'dump --tokens twitch,donationalerts --relay {$relay2}', pre: 200, post: 120 },
  { type: 'hashes', count: 8, delay: [12, 25] },
  { type: 'out', delay: [420, 520], lines: [
    'Twitch Access: [[green bold|granted]]. Токен Twitch получен: [[white|oauth:{alnum30}]]',
    'DonationAlerts Access: [[green bold|granted]]. Токен DonationAlerts получен: [[white|da_{alnum24}]]',
    'Stream key перехвачен: [[white|live_{alnum8}_{alnum20}]]'
  ] },
  { type: 'wait', ms: 600 },

  /* ── ФАЗА 3 · вывод денег + пугалки (≈2,5 c) ── */
  { type: 'phase', id: 3, mode: 'alert', prompt: 'root' },
  { type: 'cmd', text: 'payout --set-wallet --force', pre: 150, post: 100 },
  { type: 'out', delay: [450, 500], lines: [
    'Счёт для вывода сменён на [[red bold|{$wallet}]]',
    'Автовывод: [[red bold|ВКЛЮЧЁН]] · подтверждение по почте: [[red bold|ОТКЛЮЧЕНО]]'
  ] },
  { type: 'popup', ms: 2000, title: '⚠ 0x000000F4 :: ??????', lines: [
    '[[red bold|ᚦ̷ ⟊⟒ ꙮ ⌇⟟⟒⟒ ⊑⟒ ⏁⊑⟒⍜ ̸͙ ⍀⍜⍜⋔]]',
    '[[gray|процесс {pid} не отвечает · ты всё ещё здесь?]]'
  ] },
  { type: 'hex', lines: 18, delay: [10, 20], cls: 'red' },
  { type: 'glitch', ms: 450, strong: true },
  { type: 'out', delay: [180, 260], cls: 'red bold', lines: [
    '[!!] Выгрузка на {$relay2} ......... 100%',
    '[!!] Сессии браузера экспортированы'
  ] },
  { type: 'wait', ms: 1150 },

  /* ── ФАЗА 4 · очистка терминала (2 c) ── */
  { type: 'phase', id: 4, mode: 'alert', prompt: 'root' },
  { type: 'wipe', ms: 2000, label: 'Очистка терминала' },

  /* ── ФАЗА 5 · финальная строка (остаётся на экране, ≈3 c) ── */
  { type: 'phase', id: 5, mode: 'normal', prompt: 'root' },
  { type: 'wait', ms: 100 },
  { type: 'out', cls: 'white bold', lines: ['200 OK | 146_art session_closed'] },
  { type: 'wait', ms: 3000 }
];
