function rehydrateScripts(fragment) {
  fragment.querySelectorAll('script').forEach((oldScript) => {
    const newScript = document.createElement('script');
    for (const attr of oldScript.attributes) {
      newScript.setAttribute(attr.name, attr.value);
    }
    newScript.textContent = oldScript.textContent;
    oldScript.replaceWith(newScript);
  });
}

async function loadPartial(el) {
  const url = el.getAttribute('data-include');
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const html = await res.text();
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    rehydrateScripts(tpl.content);
    el.replaceWith(tpl.content);
  } catch (err) {
    console.error(`[include] Partial "${url}" konnte nicht geladen werden:`, err);
  }
}

function highlightActiveNav() {
  const current = document.body.dataset.page;
  document.querySelectorAll('.nav-links a[data-nav]').forEach((a) => {
    if (a.dataset.nav === current) a.classList.add('active');
  });
}

async function loadAllPartials() {
  const els = Array.from(document.querySelectorAll('[data-include]'));
  try {
    await Promise.all(els.map(loadPartial));
    highlightActiveNav();
  } catch (err) {
    console.error('[include] Fehler beim Laden der Partials:', err);
  } finally {
    document.dispatchEvent(new Event('partials:loaded'));
  }
}

document.addEventListener('DOMContentLoaded', loadAllPartials);
