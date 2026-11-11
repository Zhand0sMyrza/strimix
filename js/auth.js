/* Strimix — имитация авторизации. Никаких полей ввода и сетевых запросов: только таймеры. */
(function () {
  'use strict';

  var root = document.getElementById('auth');
  var title = document.getElementById('authTitle');
  var status = document.getElementById('authStatus');
  var steps = document.querySelectorAll('#authSteps li');
  var bar = document.getElementById('authBar');

  // Тайминги (мс от загрузки страницы)
  var STEPS = [
    { at: 250,  step: 0, text: 'Проверка разрешений…',  progress: 30 },
    { at: 1250, step: 1, text: 'Синхронизация канала…', progress: 68 },
    { at: 2350, step: 2, text: 'Готово',                progress: 100 }
  ];
  var SUCCESS_AT = 3000;   // спиннер → галочка
  var REDIRECT_AFTER = 1100; // через ~1 c после успеха → терминал
  var NEXT_PAGE = 'terminal.html';

  function setStatus(text) {
    var span = document.createElement('span');
    span.textContent = text;
    status.replaceChildren(span);
  }

  STEPS.forEach(function (s) {
    setTimeout(function () {
      steps.forEach(function (li, i) {
        li.classList.toggle('ok', i < s.step || (s.step === steps.length - 1 && i === s.step));
        li.classList.toggle('active', i === s.step && s.step !== steps.length - 1);
      });
      setStatus(s.text);
      bar.style.width = s.progress + '%';
    }, s.at);
  });

  setTimeout(function () {
    root.classList.add('done');
    steps.forEach(function (li) { li.classList.remove('active'); li.classList.add('ok'); });
    title.textContent = 'Авторизация успешна';
    setStatus('Перенаправление…');
    document.title = 'Авторизация успешна — Strimix';

    // метка времени в адресе — браузер всегда загрузит свежую страницу терминала
    setTimeout(function () { window.location.replace(NEXT_PAGE + '?t=' + Date.now()); }, REDIRECT_AFTER);
  }, SUCCESS_AT);
})();
