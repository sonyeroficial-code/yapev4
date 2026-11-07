(function(){
  const CACHE = new Map();
  let lastContact = null;
  const origFetch = window.fetch ? window.fetch.bind(window) : null;
  if (origFetch) {
    window.fetch = async function(input, init) {
      const url = typeof input === 'string' ? input : (input && input.url) || '';
      let action = '';
      let phone = '';
      try {
        const bodyText = init && typeof init.body === 'string' ? init.body : '';
        if (url.includes('/functions/v1/sonyer-global') && bodyText) {
          const body = JSON.parse(bodyText);
          action = String(body && body.action || '');
          phone = String(body && body.phone || '').replace(/\D/g,'');
        }
      } catch(_) {}
      const res = await origFetch(input, init);
      try {
        if (url.includes('/functions/v1/sonyer-global') && action === 'lookup') {
          const clone = res.clone();
          const data = await clone.json().catch(()=>null);
          const contact = data && data.contact;
          if (data && data.ok && contact && contact.name && phone) {
            lastContact = {
              phone,
              name: String(contact.name || '').trim(),
              destino: String(contact.destino || '').trim()
            };
            CACHE.set(phone, lastContact);
            window.__SONYER_LAST_CONTACT__ = lastContact;
          }
        }
      } catch(_) {}
      return res;
    }
  }

  function abbreviateName(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '';
    if (parts.length === 1) return parts[0].slice(0, 3) + '*';
    const second = parts[1] || '';
    return parts[0] + ' ' + second.slice(0, 3) + '*';
  }

  function normalize(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  function extractBank(container) {
    const nodes = container ? Array.from(container.querySelectorAll('div,span,p,strong,b')) : [];
    for (const el of nodes) {
      const txt = normalize(el.textContent);
      const m = txt.match(/^Destino:\s*(.+)$/i);
      if (m) return m[1].trim();
      if (txt === 'Destino:') {
        let sib = el.nextElementSibling;
        while (sib) {
          const sTxt = normalize(sib.textContent);
          if (sTxt) return sTxt;
          sib = sib.nextElementSibling;
        }
      }
    }
    return '';
  }

  function findNameElement(container) {
    if (!container) return null;
    const nodes = Array.from(container.querySelectorAll('div,span,p,strong,b,h1,h2,h3,h4,h5'));
    let titleIndex = -1;
    for (let i=0;i<nodes.length;i++) {
      const txt = normalize(nodes[i].textContent);
      if (txt === 'Vas a yapear a:' || txt.includes('Vas a yapear a:')) {
        titleIndex = i;
        break;
      }
    }
    if (titleIndex === -1) return null;
    for (let j = titleIndex + 1; j < Math.min(nodes.length, titleIndex + 10); j++) {
      const txt = normalize(nodes[j].textContent);
      if (!txt) continue;
      if (/^(Monto:|Destino:|Más opciones|CONFIRMAR YAPEO|CANCELAR|S\/)/i.test(txt)) continue;
      if (txt.includes('Vas a yapear a:')) continue;
      return nodes[j];
    }
    return null;
  }

  function patchYapeModal() {
    const bodyText = normalize(document.body && document.body.textContent || '');
    if (!bodyText.includes('Vas a yapear a:')) return;

    const all = Array.from(document.querySelectorAll('div,section,article,.p-dialog,.p-component'));
    let container = null;
    for (const el of all) {
      const txt = normalize(el.textContent);
      if (txt.includes('Vas a yapear a:')) {
        container = el;
        break;
      }
    }
    if (!container) return;

    const bank = extractBank(container);
    const nameEl = findNameElement(container);
    if (!nameEl) return;

    const phone = lastContact && lastContact.phone ? lastContact.phone : '';
    const fullName = (phone && CACHE.get(phone) && CACHE.get(phone).name) || (lastContact && lastContact.name) || '';
    if (!fullName) return;

    const finalName = /^yape$/i.test(bank) ? abbreviateName(fullName) : fullName;
    if (normalize(nameEl.textContent) !== finalName) {
      nameEl.textContent = finalName;
    }
  }

  const observer = new MutationObserver(function(){
    try { patchYapeModal(); } catch(_) {}
  });

  function start() {
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      setInterval(function(){ try { patchYapeModal(); } catch(_) {} }, 700);
    } else {
      setTimeout(start, 250);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once:true });
  } else {
    start();
  }
})();
