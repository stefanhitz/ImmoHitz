import test from 'node:test';
import assert from 'node:assert/strict';
import { getTypes, filterByType, statusLabel, statusBadgeClass, buildListingCard } from '../js/listings-data.js';

test('getTypes returns "Alle" plus sorted unique types', () => {
  const listings = [{ typ: 'Miete' }, { typ: 'Kauf' }, { typ: 'Miete' }, {}];
  assert.deepEqual(getTypes(listings), ['Alle', 'Kauf', 'Miete']);
});

test('getTypes returns just "Alle" for an empty list', () => {
  assert.deepEqual(getTypes([]), ['Alle']);
});

test('filterByType returns everything for "Alle"', () => {
  const listings = [{ typ: 'Kauf' }, { typ: 'Miete' }];
  assert.deepEqual(filterByType(listings, 'Alle'), listings);
});

test('filterByType returns everything when type is falsy', () => {
  const listings = [{ typ: 'Kauf' }, { typ: 'Miete' }];
  assert.deepEqual(filterByType(listings, undefined), listings);
});

test('filterByType filters to exact matches', () => {
  const listings = [{ typ: 'Kauf', id: 1 }, { typ: 'Miete', id: 2 }, { typ: 'Kauf', id: 3 }];
  assert.deepEqual(filterByType(listings, 'Kauf'), [{ typ: 'Kauf', id: 1 }, { typ: 'Kauf', id: 3 }]);
});

test('statusLabel maps known statuses to German labels', () => {
  assert.equal(statusLabel('aktiv'), 'Aktiv');
  assert.equal(statusLabel('verkauft'), 'Verkauft');
  assert.equal(statusLabel('vermietet'), 'Vermietet');
});

test('statusLabel returns unknown values unchanged', () => {
  assert.equal(statusLabel('reserviert'), 'reserviert');
});

test('statusBadgeClass maps known statuses (any case/whitespace) to their class', () => {
  assert.equal(statusBadgeClass('aktiv'), 'aktiv');
  assert.equal(statusBadgeClass('Aktiv'), 'aktiv');
  assert.equal(statusBadgeClass('  vermietet  '), 'vermietet');
  assert.equal(statusBadgeClass('VERKAUFT'), 'verkauft');
});

test('statusBadgeClass falls back to "unbekannt" for unknown or missing statuses', () => {
  assert.equal(statusBadgeClass('reserviert'), 'unbekannt');
  assert.equal(statusBadgeClass(undefined), 'unbekannt');
  assert.equal(statusBadgeClass(''), 'unbekannt');
});

test('buildListingCard fills in every field for a complete listing', () => {
  const card = buildListingCard({
    titel: '3.5-Zimmer-Wohnung',
    ort: 'Urtenen-Schönbühl',
    preis: "590'000 CHF",
    zimmer: 3.5,
    flaeche: 92,
    bild: '/img/listings/beispiel.jpg',
    status: 'aktiv',
    beschreibung: 'Helle Wohnung mit Balkon.',
  });
  assert.deepEqual(card, {
    imgSrc: '/img/listings/beispiel.jpg',
    imgAlt: '3.5-Zimmer-Wohnung',
    badgeClass: 'aktiv',
    badgeLabel: 'Aktiv',
    title: '3.5-Zimmer-Wohnung',
    ort: 'Urtenen-Schönbühl',
    metaText: '3.5 Zimmer · 92 m²',
    preis: "590'000 CHF",
    beschreibung: 'Helle Wohnung mit Balkon.',
  });
});

test('buildListingCard degrades gracefully when optional fields are missing', () => {
  const card = buildListingCard({ titel: '2-Zimmer-Attikawohnung', typ: 'Miete', status: 'vermietet' });
  assert.deepEqual(card, {
    imgSrc: '/img/site/listing-placeholder.svg',
    imgAlt: '2-Zimmer-Attikawohnung',
    badgeClass: 'vermietet',
    badgeLabel: 'Vermietet',
    title: '2-Zimmer-Attikawohnung',
    ort: '',
    metaText: '',
    preis: '',
    beschreibung: '',
  });
});

test('buildListingCard uses a fallback title and "unbekannt" badge class for a malformed entry', () => {
  const card = buildListingCard({ status: 'reserviert' });
  assert.equal(card.title, 'Immobilienangebot');
  assert.equal(card.imgAlt, 'Immobilienangebot');
  assert.equal(card.badgeClass, 'unbekannt');
  assert.equal(card.badgeLabel, 'reserviert');
});
