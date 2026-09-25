import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidEmail, validateContactForm } from '../js/contact-form.js';

test('isValidEmail accepts a plausible address', () => {
  assert.equal(isValidEmail('jeremias.hitz@immohitz.ch'), true);
});

test('isValidEmail rejects missing @ or domain dot', () => {
  assert.equal(isValidEmail('abc'), false);
  assert.equal(isValidEmail('a@b'), false);
  assert.equal(isValidEmail(''), false);
});

test('validateContactForm returns no errors for a complete, valid submission', () => {
  const errors = validateContactForm({
    vorname: 'Max',
    nachname: 'Muster',
    email: 'max@example.com',
    telefon: '079 123 45 67',
  });
  assert.deepEqual(errors, []);
});

test('validateContactForm flags missing required fields', () => {
  const errors = validateContactForm({ vorname: '', nachname: '', email: '', telefon: '' });
  assert.deepEqual(errors, ['vorname', 'nachname', 'email', 'telefon']);
});

test('validateContactForm flags an invalid email but leaves valid fields out', () => {
  const errors = validateContactForm({
    vorname: 'Max',
    nachname: 'Muster',
    email: 'not-an-email',
    telefon: '079 123 45 67',
  });
  assert.deepEqual(errors, ['email']);
});

test('validateContactForm treats whitespace-only fields as missing', () => {
  const errors = validateContactForm({ vorname: '   ', nachname: 'Muster', email: 'max@example.com', telefon: '079' });
  assert.deepEqual(errors, ['vorname']);
});

test('validateContactForm ignores nachricht entirely', () => {
  const errors = validateContactForm({
    vorname: 'Max', nachname: 'Muster', email: 'max@example.com', telefon: '079', nachricht: '',
  });
  assert.deepEqual(errors, []);
});
