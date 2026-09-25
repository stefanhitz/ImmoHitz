const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value) {
  return typeof value === 'string' && EMAIL_RE.test(value.trim());
}

export function validateContactForm({ vorname, nachname, email, telefon } = {}) {
  const errors = [];
  if (!vorname || !vorname.trim()) errors.push('vorname');
  if (!nachname || !nachname.trim()) errors.push('nachname');
  if (!isValidEmail(email)) errors.push('email');
  if (!telefon || !telefon.trim()) errors.push('telefon');
  return errors;
}
