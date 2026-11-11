/* ==========================================================================
   СЦЕНАРИЙ ТЕРМИНАЛА — редактируйте здесь.
   Весь текст вымышленный, ничего не выполняется.

   Шаблоны внутри строк (каждый раз генерируются заново):
     {ip} {mac} {hash} {hash64} {hex8} {port} {pid} {time} {date} {speed}
     {rand:10-99}   {size:2-48K}   ({size:1-3M}, {size:200-900B}, {size:1-2G})
   Переменные, фиксированные на весь прогон (см. TERMINAL_CONFIG.vars): {$target} {$relay1} …
   Цвет внутри строки: [[red|текст]], [[green bold|текст]]
     цвета: green, dim, white, gray, red, amber, cyan, purple; модификаторы: bold, blink, inv

   Типы шагов:
     { type:'phase', id:1, mode:'normal'|'alert', prompt:'local'|'root' }  — метка фазы (клавиши 1–5)
     { type:'cmd', text:'…' }                    — команда после промпта, вставляется кусками
     { type:'out', lines:[…], cls:'red', delay:[min,max] } — вывод блоком
     { type:'wait', ms:1000 }                     — пауза (ms можно [min,max])
     { type:'progress', label:'…', duration:3000, done:'…' }
     { type:'portscan', rows:[[port, state, service, version], …] }
     { type:'ls', entries:[{ name:'file', size:'1-9K', hot:true }, { name:'dir/' }] }
     { type:'download', files:[{ name:'file', size:'1-9M', hot:true }] }
     { type:'hex', lines:40, delay:[10,25] }      — поток hex-дампа
     { type:'hashes', count:30, delay:[10,40] }   — поток хэшей
     { type:'decrypt', lines:[…], duration:4000 } — «расшифровка» бегущими символами
     { type:'banner', text:'ACCESS GRANTED', ms:2500, wait:true }  (ms:0 — висит до {type:'banner', hide:true})
     { type:'glitch', ms:600, strong:true, wait:false }
     { type:'mode', value:'alert' }   { type:'prompt', value:'root' }   { type:'clear' }
     { type:'countdown', seconds:40, label:'…' }  { type:'waitCountdown' }
     { type:'final', title:'…', lines:[…] }       — финальная надпись, сцена замирает
   ========================================================================== */

window.TERMINAL_CONFIG = {
  startDelay: 700,
  speed: 0.6,                              // множитель всех пауз: 1 — исходный темп, меньше — быстрее
  typing: { chunk: [4, 12], delay: [40, 110] }, // команды вставляются кусками по 4–12 символов
  vars: {
    target: '{ip}',
    gw: '{ip}',
    relay1: '{ip}',
    relay2: '{ip}',
    relay3: '{ip}',
    mac: '{mac}',
    session: '{hex8}',
    node: 'ghost-{hex4}',
    key: '{hex24}'
  },
  prompts: {
    local: '[[green bold|streamer@studio-pc]]:[[cyan|~]]$ ',
    root: '[[red bold|root@{$node}]]:[[cyan|~]]# '
  }
};

window.TERMINAL_SCRIPT = [

  /* ───────────── ФАЗА 1 · «нормальное» подключение → резкий поворот ───────────── */
  { type: 'phase', id: 1, mode: 'normal', prompt: 'local' },
  { type: 'wait', ms: 900 },
  { type: 'cmd', text: 'strimix-agent connect --channel live --overlay obs' },
  { type: 'out', delay: [220, 520], lines: [
    '[[dim|{time}]] Strimix Agent v2.4.1 (build {hex7})',
    '[[dim|{time}]] Загрузка конфигурации ............ [[green|OK]]',
    '[[dim|{time}]] Авторизация Twitch ............... [[green|OK]]',
    '[[dim|{time}]] Сервер синхронизации {$gw}:443 ... [[green|OK]]'
  ] },
  { type: 'progress', label: 'Синхронизация оверлеев', duration: 2200 },
  { type: 'out', delay: [300, 650], lines: [
    '[[dim|{time}]] Аукционы: 0 активных · Голосования: 0',
    '[[dim|{time}]] Донат-алерты подключены к OBS (scene: «Игровая»)',
    '[[dim|{time}]] [[green bold|✓ Расширение готово к работе]]'
  ] },
  { type: 'wait', ms: 2200 },
  { type: 'out', lines: ['[[dim|{time}]] [[amber|WARN]] Неожиданный ответ сервера (code 0x7F3A)'] },
  { type: 'wait', ms: 1100 },
  { type: 'out', lines: ['[[dim|{time}]] [[amber|WARN]] Сессия {$session} запрошена с неизвестного узла {$relay1}'] },
  { type: 'wait', ms: 900 },
  { type: 'glitch', ms: 350 },
  { type: 'out', delay: [250, 500], lines: [
    '[[dim|{time}]] [[red bold|ERR ]] Нарушена целостность пакета: payload 0x{hex8}',
    '[[dim|{time}]] [[red bold|ERR ]] Remote shell spawned — pid {pid}',
    '[[dim|{time}]] [[red bold|!!! ВХОДЯЩЕЕ ПОДКЛЮЧЕНИЕ: {$relay1} → localhost:22]]'
  ] },
  { type: 'mode', value: 'alert' },
  { type: 'glitch', ms: 1000, strong: true, wait: true },
  { type: 'out', lines: ['', '[[gray|Connection to strimix-agent closed by remote host.]]', ''] },
  { type: 'wait', ms: 900 },

  /* ───────────── ФАЗА 2 · подключение к узлам и сканирование ───────────── */
  { type: 'phase', id: 2, mode: 'alert', prompt: 'root' },
  { type: 'out', cls: 'red', lines: [
    '[[inv bold| ROOT SESSION ESTABLISHED ]]  uid=0(root) gid=0(wheel) tty=pts/{rand:1-9}',
    ''
  ] },
  { type: 'wait', ms: 600 },
  { type: 'cmd', text: 'chain --hop {$relay1} --hop {$relay2} --hop {$relay3} --tunnel' },
  { type: 'out', delay: [350, 800], lines: [
    '[relay] {$relay1}  ........ [[green|linked]]  ({rand:12-90} ms)',
    '[relay] {$relay2}  ........ [[green|linked]]  ({rand:30-140} ms)',
    '[relay] {$relay3}  ........ [[green|linked]]  ({rand:60-220} ms)',
    '[relay] [[cyan|tunnel up]] · exit node {ip} · cipher chacha20-poly1305'
  ] },
  { type: 'cmd', text: 'arp-scan --localnet -I en0' },
  { type: 'out', delay: [120, 260], lines: [
    'Interface: en0, type: EN10MB, MAC: {$mac}, IPv4: {$target}',
    'Starting arp-scan with 256 hosts',
    '{ip}\t{mac}\t(locally administered)',
    '{ip}\t{mac}\t(locally administered)',
    '{ip}\t{mac}\t(locally administered)',
    '{ip}\t{mac}\t(locally administered)',
    '{ip}\t{mac}\t(locally administered)',
    '[[white|5 hosts responded]]'
  ] },
  { type: 'cmd', text: 'portscan -sS -sV -T4 -p- {$target}' },
  { type: 'out', delay: [150, 300], lines: [
    'Starting portscan 7.95 at {date} {time}',
    'Scan report for [[white bold|{$target}]]',
    'Host is up (0.0{rand:10-99}s latency).',
    'Not shown: 65{rand:510-525} closed tcp ports',
    ''
  ] },
  { type: 'portscan', rows: [
    ['22/tcp',   'open',     'ssh',           'OpenSSH 9.6p1'],
    ['80/tcp',   'open',     'http',          'nginx 1.25.{rand:1-5}'],
    ['139/tcp',  'filtered', 'netbios-ssn',   ''],
    ['443/tcp',  'open',     'ssl/https',     ''],
    ['445/tcp',  'open',     'microsoft-ds',  'SMB 3.1.1'],
    ['1935/tcp', 'open',     'rtmp',          'stream ingest'],
    ['3389/tcp', 'filtered', 'ms-wbt-server', ''],
    ['4455/tcp', 'open',     'websocket',     'obs-websocket 5.{rand:1-5}'],
    ['5900/tcp', 'closed',   'vnc',           ''],
    ['8080/tcp', 'open',     'http-proxy',    'strimix-agent 2.4.1'],
    ['{port}/tcp', 'open',   'unknown',       '[[red|backdoor?]]']
  ] },
  { type: 'out', lines: ['', 'Scan done: 1 IP address (1 host up) scanned in {rand:8-19}.{rand:10-99} seconds', ''] },
  { type: 'cmd', text: 'hydra-lite -t 64 ssh://{$target}' },
  { type: 'out', delay: [60, 140], cls: 'dim', lines: [
    '[ATTEMPT] target {$target} - login "root" - pass "********" - 1 of 14344399',
    '[ATTEMPT] target {$target} - login "root" - pass "********" - 2 of 14344399',
    '[ATTEMPT] target {$target} - login "admin" - pass "********" - 3 of 14344399',
    '[ATTEMPT] target {$target} - login "streamer" - pass "********" - 4 of 14344399',
    '[ATTEMPT] target {$target} - login "streamer" - pass "********" - 5 of 14344399',
    '[ATTEMPT] target {$target} - login "obs" - pass "********" - 6 of 14344399'
  ] },
  { type: 'hashes', count: 18, delay: [20, 55] },
  { type: 'out', lines: ['[[green bold|[22][ssh] host: {$target}   login: streamer   password: ************]]', ''] },
  { type: 'wait', ms: 700 },

  /* ───────────── ФАЗА 3 · обход защиты и получение доступа ───────────── */
  { type: 'phase', id: 3, mode: 'alert', prompt: 'root' },
  { type: 'cmd', text: './bypass --target {$target} --fw --av --uac --stealth' },
  { type: 'progress', label: 'Обход файрвола', duration: 3000, cls: 'white', done: '[+] Firewall rules flushed (0 active)' },
  { type: 'progress', label: 'Отключение антивируса', duration: 3600, cls: 'white', done: '[+] Real-time protection: [[red bold|DISABLED]]' },
  { type: 'out', lines: ['[[amber|[!] Обнаружена защита SIP — применяю обход…]]'] },
  { type: 'glitch', ms: 300 },
  { type: 'progress', label: 'Повышение привилегий', duration: 2800, cls: 'white', done: '[+] Privileges escalated → [[red bold|SYSTEM]]' },
  { type: 'cmd', text: 'whoami && uname -a' },
  { type: 'out', lines: [
    '[[red bold|root]]',
    'Darwin studio-pc 24.{rand:1-6}.0 Darwin Kernel Version 24.{rand:1-6}.0: root:xnu-{rand:10000-11999}.{rand:1-99}~{rand:1-9}/RELEASE_ARM64 arm64'
  ] },
  { type: 'cmd', text: 'inject --pid {pid} --payload ghost.so --persist' },
  { type: 'out', delay: [80, 200], lines: [
    '[*] Allocating 0x{hex4} bytes @ 0x7ff{hex9}',
    '[*] Writing shellcode ........... [[green|done]]',
    '[*] Hooking keyboard / clipboard  [[green|done]]',
    '[*] Persistence via launchd ..... [[green|done]]'
  ] },
  { type: 'hashes', count: 24, delay: [15, 45] },
  { type: 'progress', label: 'Получение доступа', duration: 3200, cls: 'red bold' },
  { type: 'glitch', ms: 500, strong: true },
  { type: 'banner', text: 'ACCESS GRANTED', ms: 2800, wait: true },
  { type: 'out', lines: ['', '[[green bold|[+] Полный доступ к {$target} получен. Сессия {$session} активна.]]', ''] },

  /* ───────────── ФАЗА 4 · листинг и «скачивание» файлов ───────────── */
  { type: 'phase', id: 4, mode: 'alert', prompt: 'root' },
  { type: 'cmd', text: 'ls -la /Users/streamer' },
  { type: 'ls', entries: [
    { name: './' }, { name: '../' },
    { name: 'Desktop/' }, { name: 'Documents/' }, { name: 'Downloads/' }, { name: 'Pictures/' }, { name: 'OBS/' },
    { name: '.ssh/', hot: true },
    { name: 'Passwords.txt', size: '2-48K', hot: true },
    { name: 'browser_cookies.db', size: '1-6M', hot: true },
    { name: 'stream_keys.cfg', size: '200-900B', hot: true },
    { name: 'donations_2026.xlsx', size: '80-400K' },
    { name: 'wallet_backup.dat', size: '20-90K', hot: true },
    { name: 'chat_logs.sqlite', size: '10-60M' },
    { name: 'obs_profile.json', size: '4-30K' }
  ] },
  { type: 'cmd', text: 'find / -name "*.cfg" -o -name "*.db" -o -name "*.txt" 2>/dev/null | head -8' },
  { type: 'out', delay: [40, 120], lines: [
    '/Users/streamer/Passwords.txt',
    '/Users/streamer/stream_keys.cfg',
    '/Users/streamer/browser_cookies.db',
    '/Users/streamer/Library/Keychains/login.keychain-db',
    '/Users/streamer/OBS/basic/profiles/Main/service.json',
    '/Users/streamer/Documents/scans/passport_scan.pdf',
    '/Users/streamer/Documents/bank/statement_{rand:10-12}.pdf',
    '/Users/streamer/Desktop/photos.zip'
  ] },
  { type: 'cmd', text: 'exfil --to {$relay3}:4444 --compress --encrypt --files @found' },
  { type: 'out', lines: ['[*] Канал {$relay3}:4444 открыт · сжатие zstd · {speed}', ''] },
  { type: 'download', files: [
    { name: 'Passwords.txt', size: '2-48K', hot: true },
    { name: 'stream_keys.cfg', size: '200-900B', hot: true },
    { name: 'browser_cookies.db', size: '1-6M', hot: true },
    { name: 'login.keychain-db', size: '300-900K', hot: true },
    { name: 'wallet_backup.dat', size: '20-90K', hot: true },
    { name: 'Documents/', size: '200-600M' },
    { name: 'Desktop/photos.zip', size: '80-400M' },
    { name: 'chat_logs.sqlite', size: '10-60M' },
    { name: 'donations_2026.xlsx', size: '80-400K' }
  ] },
  { type: 'out', lines: ['', '[[green bold|[+] 9 объектов скачано · {size:1-2G} · среднее {speed}]]', ''] },
  { type: 'cmd', text: 'xxd browser_cookies.db | head -64' },
  { type: 'hex', lines: 64, delay: [12, 30] },
  { type: 'glitch', ms: 400 },

  /* ───────────── ФАЗА 5 · расшифровка, выгрузка, финал ───────────── */
  { type: 'phase', id: 5, mode: 'alert', prompt: 'root' },
  { type: 'cmd', text: 'decrypt --aes-256-gcm --key {$key} ./loot/*' },
  { type: 'decrypt', duration: 5200, cls: 'white', lines: [
    'Passwords.txt      → twitch: ************   mail: ************',
    'stream_keys.cfg    → live_{hex8}_{hex16}{hex8}',
    'browser_cookies.db → {rand:200-900} sessions decrypted',
    'login.keychain-db  → {rand:40-120} entries decrypted',
    'wallet_backup.dat  → seed: ●●●●● ●●●●● ●●●●● ●●●●● ●●●●● ●●●●●'
  ], done: '[+] Расшифровка завершена: 5/5' },
  { type: 'wait', ms: 800 },
  { type: 'countdown', seconds: 20, label: 'ОТПРАВКА ДАННЫХ' },
  { type: 'glitch', ms: 500, strong: true },
  { type: 'banner', text: 'UPLOADING DATA…', ms: 2600, wait: true },
  { type: 'cmd', text: 'upload --all --to {$relay3} --wipe-traces' },
  { type: 'progress', label: 'Upload → {$relay3}', duration: 6500, cls: 'red bold' },
  { type: 'hex', lines: 40, delay: [8, 20], cls: 'red' },
  { type: 'out', delay: [400, 900], cls: 'red bold', lines: [
    '[!!] Ключ трансляции перехвачен',
    '[!!] Сессии браузера экспортированы',
    '[!!] Логи системы очищены'
  ] },
  { type: 'glitch', ms: 800, strong: true },
  { type: 'hashes', count: 36, delay: [8, 25] },
  { type: 'banner', text: 'SYSTEM COMPROMISED', ms: 2200, wait: true },
  { type: 'progress', label: 'Удаление следов', duration: 4000, cls: 'red' },
  { type: 'hex', lines: 60, delay: [6, 14], cls: 'dim' },
  { type: 'glitch', ms: 600, strong: true },
  { type: 'banner', text: 'UPLOADING DATA…', ms: 0 },
  { type: 'waitCountdown' },
  { type: 'banner', hide: true },
  { type: 'glitch', ms: 1400, strong: true, wait: true },
  { type: 'final', title: 'ДАННЫЕ ПЕРЕДАНЫ', lines: [
    'Удалённый узел {$relay3} подтвердил получение.',
    'Сессия {$session} закрыта · {date} {time}',
    ''
  ] }
];
