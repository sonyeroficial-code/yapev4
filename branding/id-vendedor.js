// Solo el campo ID del vendedor usa mayúsculas, no admite espacios e insignia SONYER.
// La insignia es visual: la validación de ID sigue haciéndose en Firebase.
(function () {
  'use strict';

  const selector = 'input#vendorId, input[formcontrolname="vendorId"], input[name="vendorId"]';
  let queued = false;

  function isVendorField(element) {
    return element instanceof HTMLInputElement && element.matches(selector);
  }

  function update(field, emitInput) {
    if (!field || field.isComposing) return;

    const original = String(field.value);
    const uppercase = original.replace(/\s+/gu, '').toUpperCase();
    if (field.value !== uppercase) {
      const begin = field.selectionStart, end = field.selectionEnd;
      const newBegin = begin === null ? null : original.slice(0, begin).replace(/\s+/gu, '').length;
      const newEnd = end === null ? null : original.slice(0, end).replace(/\s+/gu, '').length;
      field.value = uppercase;
      if (newBegin !== null && newEnd !== null && document.activeElement === field) {
        try { field.setSelectionRange(newBegin, newEnd); } catch (_) {}
      }
      // La escritura manual ya enviará el evento original al formulario.
      // Los datos precargados sí necesitan notificar al control de Angular.
      if (emitInput) field.dispatchEvent(new Event('input', {bubbles: true}));
    }

    const container = field.closest('.form-group') || field.parentElement;
    if (!container) return;
    let badge = container.querySelector('.sonyer-verified-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'sonyer-verified-badge';
      badge.setAttribute('role', 'img');
      badge.setAttribute('aria-label', 'Insignia del ID SONYER');
      container.appendChild(badge);
    }
    badge.hidden = uppercase !== 'SONYER';
  }

  function onInput(event) {
    if (!isVendorField(event.target) || event.isComposing) return;
    update(event.target, false);
  }

  function onBeforeInput(event) {
    if (!isVendorField(event.target) || event.isComposing) return;
    if (event.inputType === 'insertText' && /\s/u.test(event.data || '')) {
      event.preventDefault();
    }
  }

  function onKeyDown(event) {
    if (isVendorField(event.target) && !event.isComposing &&
        (event.key === ' ' || event.code === 'Space')) {
      event.preventDefault();
    }
  }

  function scan() {
    queued = false;
    document.querySelectorAll(selector).forEach(function (field) {
      field.setAttribute('autocapitalize', 'characters');
      field.setAttribute('autocorrect', 'off');
      field.spellcheck = false;
      update(field, true);
    });
  }

  function schedule() {
    if (queued) return;
    queued = true;
    queueMicrotask(scan);
  }

  function start() {
    document.addEventListener('beforeinput', onBeforeInput, true);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('input', onInput, true);
    document.addEventListener('change', onInput, true);
    document.addEventListener('compositionend', onInput, true);
    new MutationObserver(schedule).observe(document.body, {childList: true, subtree: true});
    schedule();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, {once: true});
  } else {
    start();
  }
})();
