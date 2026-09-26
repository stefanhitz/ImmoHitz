import { validateContactForm } from './contact-form.js';

document.addEventListener('partials:loaded', () => {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const errorBanner = document.getElementById('formError');

  form.addEventListener('submit', (event) => {
    const errors = validateContactForm({
      vorname: form.vorname.value,
      nachname: form.nachname.value,
      email: form.email.value,
      telefon: form.telefon.value,
    });

    ['vorname', 'nachname', 'email', 'telefon'].forEach((field) => {
      form.elements[field].removeAttribute('aria-invalid');
    });

    if (errors.length > 0) {
      event.preventDefault();
      errorBanner.hidden = false;
      errors.forEach((field) => {
        form.elements[field].setAttribute('aria-invalid', 'true');
      });
    } else {
      errorBanner.hidden = true;
    }
  });
});
