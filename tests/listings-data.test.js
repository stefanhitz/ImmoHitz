import test from 'node:test';
import assert from 'node:assert/strict';
import { getTypes, filterByType, statusLabel } from '../js/listings-data.js';

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
