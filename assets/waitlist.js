'use strict';
const form = document.getElementById('waitlistForm');
const button = form.querySelector('button');
const messages = JSON.parse(form.dataset.messages);
const message = document.getElementById('waitlistMessage');
button.disabled = false;
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (button.disabled || !form.reportValidity()) return;
  const email = document.getElementById('waitlistEmail');
  const platform = form.querySelector('input[name="platform"]:checked').value;
  button.disabled = true;
  message.classList.remove('error');
  message.textContent = messages.pending;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch('https://glasify-backend.onrender.com/v1/waitlist', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'omit', referrerPolicy: 'no-referrer', signal: controller.signal,
      body: JSON.stringify({ email: email.value.trim(), platform })
    });
    message.textContent = response.ok ? messages.success : messages.error;
    message.classList.toggle('error', !response.ok);
    if (response.ok) email.value = '';
  } catch (_) {
    message.textContent = messages.network;
    message.classList.add('error');
  } finally {
    clearTimeout(timer);
    button.disabled = false;
  }
});
