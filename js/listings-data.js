const STATUS_LABELS = { aktiv: 'Aktiv', verkauft: 'Verkauft', vermietet: 'Vermietet' };

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
