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

  /* ── ФАЗА 1 · подключение → чужой узел ── */
  { type: 'phase', id: 1, mode: 'normal', prompt: 'local' },
  { type: 'cmd', text: 'strimix-agent connect --channel 146_art', pre: 150, post: 150 },
  { type: 'out', delay: [120, 200], lines: [
    '[[dim|{time}]] Twitch OAuth ........... [[green|OK]]',
    '[[dim|{time}]] Синхронизация оверлеев . [[green|OK]]',
    '[[dim|{time}]] [[amber|WARN]] Сессию запросил неизвестный узел {$relay1}',
    '[[dim|{time}]] [[red bold|!!! REMOTE SHELL SPAWNED — pid {pid}]]'
  ] },
  { type: 'mode', value: 'alert' },
  { type: 'glitch', ms: 350, strong: true },
  { type: 'prompt', value: 'root' },
  { type: 'cmd', text: 'whoami && hostname', pre: 200, post: 100 },
  { type: 'out', delay: [60, 100], lines: ['[[red bold|root]]', 'studio-pc.local'] },

  /* ── ФАЗА 2 · узлы, порты, токены ── */
  { type: 'phase', id: 2, mode: 'alert', prompt: 'root' },
  { type: 'cmd', text: 'chain --hop {$relay1} --hop {$relay2} --tunnel', pre: 150, post: 100 },
  { type: 'out', delay: [120, 200], lines: [
    '[relay] {$relay1} ........ [[green|linked]] ({rand:12-90} ms)',
    '[relay] {$relay2} ........ [[green|linked]] ({rand:30-140} ms)',
    '[relay] [[cyan|tunnel up]] · exit node {ip}'
  ] },
  { type: 'cmd', text: 'arp-scan --localnet -I en0', pre: 150, post: 80 },
  { type: 'out', delay: [110, 170], lines: [
    '{ip}\t{mac}\t(locally administered)',
    '{ip}\t{mac}\t(locally administered)',
    '{ip}\t{mac}\t(locally administered)',
    '{ip}\t{mac}\t(locally administered)',
    '[[white|4 hosts responded]]'
  ] },
  { type: 'cmd', text: 'portscan -sS -T5 localhost', pre: 150, post: 100 },
  { type: 'portscan', delay: [70, 130], rows: [
    ['22/tcp',   'open',     'ssh',        'OpenSSH 9.6p1'],
    ['443/tcp',  'open',     'https',      ''],
    ['1935/tcp', 'open',     'rtmp',       'stream ingest'],
    ['4455/tcp', 'open',     'websocket',  'obs-websocket 5.4'],
    ['8080/tcp', 'open',     'http-proxy', 'strimix-agent 2.4.1']
  ] },
  { type: 'cmd', text: 'dump --tokens twitch,donationalerts --relay {$relay2}', pre: 150, post: 100 },
  { type: 'hashes', count: 10, delay: [20, 40] },
  { type: 'out', delay: [200, 300], lines: [
    'Twitch Access: [[green bold|granted]]. Токен Twitch получен: [[white|oauth:{alnum30}]]',
    'DonationAlerts Access: [[green bold|granted]]. Токен DonationAlerts получен: [[white|da_{alnum24}]]',
    'Stream key перехвачен: [[white|live_{alnum8}_{alnum20}]]'
  ] },

  /* ── ФАЗА 3 · файлы, кошелёк, окошко ── */
  { type: 'phase', id: 3, mode: 'alert', prompt: 'root' },
  { type: 'cmd', text: 'ls -la /Users/streamer', pre: 150, post: 80 },
  { type: 'ls', delay: [25, 50], entries: [
    { name: 'Desktop/' }, { name: 'Documents/' }, { name: 'OBS/' },
    { name: 'Passwords.txt', size: '2-48K', hot: true },
    { name: 'browser_cookies.db', size: '1-6M', hot: true },
    { name: 'stream_keys.cfg', size: '200-900B', hot: true },
    { name: 'donations_2026.xlsx', size: '80-400K' }
  ] },
  { type: 'cmd', text: 'find / -name "*.cfg" -o -name "*.db" 2>/dev/null | head -6', pre: 150, post: 80 },
  { type: 'out', delay: [110, 170], lines: [
    '/Users/streamer/stream_keys.cfg',
    '/Users/streamer/browser_cookies.db',
    '/Users/streamer/Library/Keychains/login.keychain-db',
    '/Users/streamer/OBS/basic/profiles/Main/service.json',
    '/Users/streamer/Documents/bank/statement_{rand:10-12}.pdf',
    '/Users/streamer/Desktop/photos.zip'
  ] },
  { type: 'cmd', text: 'payout --set-wallet --force --no-confirm', pre: 150, post: 100 },
  { type: 'out', delay: [200, 300], lines: [
    'Счёт для вывода сменён на [[red bold|{$wallet}]]',
    'Автовывод: [[red bold|ВКЛЮЧЁН]] · подтверждение по почте: [[red bold|ОТКЛЮЧЕНО]]'
  ] },
  { type: 'popup', ms: 2000, left: 72, top: 74, title: '⚠ 0x000000F4 :: ??????', lines: [
    '[[red bold|ᚦ̷ ⟊⟒ ꙮ ⌇⟟⟒⟒ ⊑⟒ ⏁⊑⟒⍜ ̸͙ ⍀⍜⍜⋔]]',
    '[[gray|процесс {pid} не отвечает · ты всё ещё здесь?]]'
  ] },
  { type: 'cmd', text: 'exfil --to {$relay2}:4444 --files Passwords.txt,browser_cookies.db,stream_keys.cfg', pre: 150, post: 80 },
  { type: 'download', speed: 0.35, files: [
    { name: 'Passwords.txt', size: '2-48K', hot: true },
    { name: 'browser_cookies.db', size: '1-6M', hot: true },
    { name: 'stream_keys.cfg', size: '200-900B', hot: true },
    { name: 'login.keychain-db', size: '300-900K', hot: true },
    { name: 'wallet_backup.dat', size: '20-90K', hot: true },
    { name: 'Desktop/photos.zip', size: '80-400M' }
  ] },

  /* ── ФАЗА 4 · дампы и расшифровка ── */
  { type: 'phase', id: 4, mode: 'alert', prompt: 'root' },
  { type: 'cmd', text: 'xxd browser_cookies.db | head -32', pre: 120, post: 60 },
  { type: 'hex', lines: 32, delay: [15, 28], cls: 'red' },
  { type: 'glitch', ms: 400, strong: true },
  { type: 'cmd', text: 'decrypt --aes-256-gcm ./loot/*', pre: 120, post: 80 },
  { type: 'decrypt', duration: 1600, cls: 'white', lines: [
    'Passwords.txt      → {rand:12-40} записей',
    'browser_cookies.db → {rand:200-900} сессий',
    'stream_keys.cfg    → live_{alnum8}_{alnum16}'
  ] },
  { type: 'hashes', count: 14, delay: [15, 30] },
  { type: 'cmd', text: 'upload --all --to {$relay2} --wipe-traces', pre: 120, post: 60 },
  { type: 'progress', label: 'Upload → {$relay2}', duration: 2000, cls: 'red bold' },
  { type: 'cmd', text: 'tail -n 6 /var/log/auth.log', pre: 120, post: 60 },
  { type: 'out', delay: [120, 190], cls: 'dim', lines: [
    '{time} sshd[{pid}]: Accepted publickey for root from {$relay1}',
    '{time} sudo: root : TTY=pts/3 ; COMMAND=/usr/bin/payout --set-wallet',
    '{time} sshd[{pid}]: session opened for user streamer',
    '{time} kernel: [[red|audit: log rotation forced]]',
    '{time} sshd[{pid}]: Received disconnect from {$relay2}',
    '{time} [[red|history -c]]'
  ] },
  { type: 'out', delay: [150, 250], cls: 'red bold', lines: [
    '[!!] Выгрузка на {$relay2} ......... 100%',
    '[!!] Сессии браузера экспортированы'
  ] },
  { type: 'wait', ms: 150 },

  /* ── ФАЗА 5 · очистка терминала (2 c) и финальная строка ── */
  { type: 'phase', id: 5, mode: 'alert', prompt: 'root' },
  { type: 'wipe', ms: 2000, label: 'Очистка терминала' },
  { type: 'mode', value: 'normal' },
  { type: 'wait', ms: 100 },
  { type: 'out', cls: 'white bold', lines: ['200 OK | 146_art session_closed'] }
  // дальше экран просто остаётся с этой строкой
];
