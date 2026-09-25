import { getTypes, filterByType, statusLabel } from './listings-data.js';

let allListings = [];
let currentListings = [];

async function init() {
  try {
    const res = await fetch('/data/listings.json');
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    allListings = await res.json();
  } catch (err) {
    console.error('[listings] data/listings.json konnte nicht geladen werden:', err);
    showMessage('Angebote konnten nicht geladen werden.');
    return;
  }
  renderTabs();
  applyFilter('Alle');
}

function showMessage(text) {
  const grid = document.getElementById('listingsGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const p = document.createElement('p');
  p.className = 'listing-message';
  p.textContent = text;
  grid.appendChild(p);
}

function renderTabs() {
  const tabsEl = document.getElementById('listingsTabs');
  const types = getTypes(allListings);
  if (types.length <= 1) {
    tabsEl.hidden = true;
    return;
  }
  tabsEl.hidden = false;
  tabsEl.innerHTML = '';
  types.forEach((type) => {
    const btn = document.createElement('button');
    btn.className = 'tab';
    btn.textContent = type;
    btn.dataset.type = type;
    btn.addEventListener('click', () => applyFilter(type));
    tabsEl.appendChild(btn);
  });
}

function applyFilter(type) {
  currentListings = filterByType(allListings, type);
  document.querySelectorAll('#listingsTabs .tab').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });
  renderGrid();
}

function renderGrid() {
  const grid = document.getElementById('listingsGrid');
  grid.innerHTML = '';
  if (currentListings.length === 0) {
    showMessage('Aktuell sind keine Angebote verfügbar. Kontaktieren Sie uns gerne direkt.');
    return;
  }
  currentListings.forEach((listing) => grid.appendChild(renderCard(listing)));
}

function renderCard(listing) {
  const card = document.createElement('article');
  card.className = 'listing-card';

  const img = document.createElement('img');
  img.src = listing.bild || '/img/site/listing-placeholder.svg';
  img.alt = listing.titel || 'Immobilienangebot';
  img.loading = 'lazy';
  card.appendChild(img);

  const body = document.createElement('div');
  body.className = 'listing-body';

  const status = listing.status || 'aktiv';
  const badge = document.createElement('span');
  badge.className = `status-badge status-${status}`;
  badge.textContent = statusLabel(status);
  body.appendChild(badge);

  const h2 = document.createElement('h2');
  h2.textContent = listing.titel || 'Immobilienangebot';
  body.appendChild(h2);

  if (listing.ort) {
    const ort = document.createElement('p');
    ort.className = 'listing-ort';
    ort.textContent = listing.ort;
    body.appendChild(ort);
  }

  const metaParts = [];
  if (listing.zimmer) metaParts.push(`${listing.zimmer} Zimmer`);
  if (listing.flaeche) metaParts.push(`${listing.flaeche} m²`);
  if (metaParts.length > 0) {
    const meta = document.createElement('p');
    meta.className = 'listing-meta';
    meta.textContent = metaParts.join(' · ');
    body.appendChild(meta);
  }

  if (listing.preis) {
    const preis = document.createElement('p');
    preis.className = 'listing-preis';
    preis.textContent = listing.preis;
    body.appendChild(preis);
  }

  if (listing.beschreibung) {
    const desc = document.createElement('p');
    desc.className = 'listing-desc';
    desc.textContent = listing.beschreibung;
    body.appendChild(desc);
  }

  card.appendChild(body);
  return card;
}

document.addEventListener('partials:loaded', init);
