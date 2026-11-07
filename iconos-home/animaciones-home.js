// Reproduce las animaciones de Créditos y Tienda en sus íconos respectivos.
// Tienda está separada de Créditos en la tercera fila del Home.
(function () {
  'use strict';

  const sources = {
    'créditos': 'creditos.json',
    'tienda': 'tienda-cyber.json'
  };
  const requests = new Map();
  const active = new Map();
  let pending = false;

  function data(file) {
    if (!requests.has(file)) {
      const url = new URL('iconos-home/' + file, document.baseURI).href;
      const request = fetch(url).then(function (response) {
        if (!response.ok) throw new Error('No se encontró la animación ' + file);
        return response.json();
      });
      requests.set(file, request);
    }
    return requests.get(file);
  }

  function refresh() {
    pending = false;
    for (const [box, animation] of active) {
      if (!box.isConnected) {
        animation.destroy();
        active.delete(box);
      }
    }

    const renderer = window.__YPFK_HOME_LOTTIE__ || window.lottie;
    if (!renderer || typeof renderer.loadAnimation !== 'function') return;

    document.querySelectorAll('app-yape-resources .home-icon-item').forEach(function (item) {
      const label = item.querySelector('.home-icon-label');
      const name = label && label.textContent.trim().toLocaleLowerCase('es');
      const file = sources[name];
      if (!file) return;

      const box = item.querySelector('.home-icon-content');
      if (!box || box.dataset.homeLottie) return;
      box.dataset.homeLottie = 'loading';

      const placeholder = document.createElement('span');
      placeholder.setAttribute('aria-hidden', 'true');
      placeholder.className = 'home-lottie-animation';
      Object.assign(placeholder.style, {
        position: 'absolute', inset: '0', zIndex: '2',
        width: '100%', height: '100%', pointerEvents: 'none', overflow: 'hidden'
      });
      box.appendChild(placeholder);

      data(file).then(function (json) {
        if (!box.isConnected || !placeholder.isConnected) return;
        const animation = renderer.loadAnimation({
          container: placeholder, renderer: 'svg', autoplay: true,
          loop: true, animationData: JSON.parse(JSON.stringify(json)),
          rendererSettings: {preserveAspectRatio: 'xMidYMid meet'}
        });
        animation.setSpeed(0.85);
        active.set(box, animation);
        box.dataset.homeLottie = 'ready';
        animation.addEventListener('DOMLoaded', function () {
          const fallback = box.querySelector('img.home-icon-image');
          if (fallback) fallback.style.visibility = 'hidden';
        });
        animation.addEventListener('data_failed', function () {
          placeholder.remove();
          const fallback = box.querySelector('img.home-icon-image');
          if (fallback) fallback.style.visibility = '';
        });
      }).catch(function () {
        // Si falla un JSON, se mantiene visible el ícono original del botón.
        placeholder.remove();
        box.dataset.homeLottie = 'failed';
      });
    });
  }

  function scheduleRefresh() {
    if (pending) return;
    pending = true;
    queueMicrotask(refresh);
  }

  const observer = new MutationObserver(scheduleRefresh);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      observer.observe(document.body, {childList: true, subtree: true});
      scheduleRefresh();
    }, {once: true});
  } else {
    observer.observe(document.body, {childList: true, subtree: true});
    scheduleRefresh();
  }
  window.addEventListener('ypfk-ready', scheduleRefresh);
})();
