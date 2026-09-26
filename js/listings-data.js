const STATUS_LABELS = { aktiv: 'Aktiv', verkauft: 'Verkauft', vermietet: 'Vermietet' };
const KNOWN_STATUSES = Object.keys(STATUS_LABELS);

export function getTypes(listings) {
  const set = new Set(listings.map((l) => l.typ).filter(Boolean));
  return ['Alle', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'de'))];
}

export function filterByType(listings, type) {
  if (!type || type === 'Alle') return listings;
  return listings.filter((l) => l.typ === type);
}

export function statusLabel(status) {
  return STATUS_LABELS[status] || status;
}

// A hand-edited listings.json can contain a mistyped or unrecognised status
// (wrong case, extra whitespace, a typo). The badge's background colour comes
// from this class, so an unmatched value must resolve to a real, visible
// class instead of silently rendering white-on-white.
export function statusBadgeClass(status) {
  const normalized = String(status ?? '').trim().toLowerCase();
  return KNOWN_STATUSES.includes(normalized) ? normalized : 'unbekannt';
}

export function buildListingCard(listing) {
  const status = listing.status || 'aktiv';
  const metaParts = [];
  if (listing.zimmer) metaParts.push(`${listing.zimmer} Zimmer`);
  if (listing.flaeche) metaParts.push(`${listing.flaeche} m²`);

  return {
    imgSrc: listing.bild || '/ImmoHitz/img/site/listing-placeholder.svg',
    imgAlt: listing.titel || 'Immobilienangebot',
    badgeClass: statusBadgeClass(status),
    badgeLabel: statusLabel(status),
    title: listing.titel || 'Immobilienangebot',
    ort: listing.ort || '',
    metaText: metaParts.join(' · '),
    preis: listing.preis || '',
    beschreibung: listing.beschreibung || '',
  };
}
