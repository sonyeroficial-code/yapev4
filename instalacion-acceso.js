(function () {
  'use strict';

  function detect() {
    var n = navigator;
    var ua = n.userAgent || '';
    var platform = n.platform || '';
    var ios = /iPhone|iPad|iPod/i.test(ua) ||
      (/MacIntel|Macintosh/i.test(ua + ' ' + platform) && n.maxTouchPoints > 1);
    var android = /Android/i.test(ua);
    return {
      ios: ios,
      android: android,
      mobile: ios || android,
      standalone: n.standalone === true ||
        matchMedia('(display-mode: standalone)').matches ||
        matchMedia('(display-mode: fullscreen)').matches
    };
  }

  window.DeviceAccess = { detect: detect };
  if (/\/instalar\.html$/i.test(location.pathname)) return;

  // Keep local editing previews accessible without installing them.
  var host = location.hostname.toLowerCase();
  var octets = host.split('.').map(Number);
  var ipv4 = octets.length === 4 && octets.every(function (n) {
    return Number.isInteger(n) && n >= 0 && n <= 255;
  });
  var local = host === 'localhost' || host.endsWith('.localhost') ||
    host === '[::1]' || host === '::1' || host === '0.0.0.0' ||
    host === 'appassets.androidplatform.net' ||
    (ipv4 && (octets[0] === 127 || octets[0] === 10 ||
      (octets[0] === 192 && octets[1] === 168) ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)));
  var device = detect();
  if (local || !/^https?:$/.test(location.protocol) ||
      !device.mobile || device.standalone) return;

  var script = document.currentScript;
  var base = script && script.src ? script.src : location.href;
  var install = new URL('instalar.html', base);
  install.search = location.search;
  install.hash = location.hash;
  // Redirect before the application starts, without flashing its login screen.
  document.documentElement.style.visibility = 'hidden';
  location.replace(install.href);
}());
