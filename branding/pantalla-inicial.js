// Ajustes visuales exclusivos de la bienvenida: logo BEBOTE SONYER,
// fondo negro y dos accesos. No cambia el resto del registro.
(function () {
  'use strict';

  let queued = false;
  function update() {
    queued = false;

    // Los componentes de registro se reutilizan en otras pantallas.
    // Se aplica el fondo oscuro solo si está visible el acceso inicial.
    const welcomeButton = document.querySelector('.bg-auth button.p-button-login');
    const welcomeScreen = welcomeButton && welcomeButton.closest('.bg-auth');
    document.querySelectorAll('.bg-auth').forEach(function (screen) {
      screen.classList.toggle('bebote-inicio-negro', screen === welcomeScreen);
    });
    document.documentElement.classList.toggle('bebote-pantalla-inicio', !!welcomeScreen);

    document.querySelectorAll('img.logo-glow').forEach(function (logo) {
      Object.assign(logo.style, {
        width: '100%', height: '100%', objectFit: 'contain',
        maxWidth: '100%', maxHeight: '18rem'
      });
    });

    document.querySelectorAll('button.btn-google').forEach(function (button) {
      if (button.textContent.trim() !== 'Ya tengo una cuenta') return;
      // Es duplicado del botón morado: ambos abrían el mismo formulario.
      button.hidden = true;
      button.style.display = 'none';
      const separator = button.previousElementSibling;
      if (separator && separator.textContent.trim().toLowerCase() === 'o') {
        separator.hidden = true;
        separator.style.display = 'none';
      }
    });
  }

  function schedule() {
    if (queued) return;
    queued = true;
    queueMicrotask(update);
  }

  const observer = new MutationObserver(schedule);
  function start() {
    observer.observe(document.body, {childList: true, subtree: true});
    schedule();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, {once: true});
  } else {
    start();
  }
  window.addEventListener('ypfk-ready', schedule);
})();
