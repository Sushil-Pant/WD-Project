// login.js — Login Page Logic

window.addEventListener('DOMContentLoaded', () => {
  // If already logged in, redirect to shop
  if (DB.getCurrentUser()) {
    window.location.href = 'index.html';
    return;
  }
  updateNavCartCount();
  updateNavAuthButton();
});

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');

  // Basic validation
  if (password.length < 4) {
    showError('Password must be at least 4 characters.');
    return;
  }

  // Animate button
  btn.textContent = 'Logging in…';
  btn.disabled = true;

  // Simulate a brief loading delay for better UX
  setTimeout(() => {
    const result = DB.login(email, password);
    if (result.success) {
      showToast(`Welcome back, ${result.user.name}! 🎉`, 'success');
      // Redirect back to wherever user came from, or shop
      const redirect = sessionStorage.getItem('login_redirect') || 'index.html';
      sessionStorage.removeItem('login_redirect');
      setTimeout(() => { window.location.href = redirect; }, 800);
    } else {
      showError(result.message);
      btn.textContent = 'Login';
      btn.disabled = false;
    }
  }, 600);
}

function showError(msg) {
  const el = document.getElementById('login-error');
  el.textContent = msg;
  el.style.display = 'block';
  // Shake animation
  el.style.animation = 'none';
  el.offsetHeight; // reflow
  el.style.animation = 'shake 0.3s ease';
}

function togglePassword() {
  const input = document.getElementById('login-password');
  const icon = document.getElementById('eye-icon');
  if (input.type === 'password') {
    input.type = 'text';
    icon.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`;
  } else {
    input.type = 'password';
    icon.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
  }
}

function quickRegister(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || password.length < 4) {
    showError('Enter a valid email and password (min 4 chars) to auto-register.');
    return;
  }
  // Auto-register and log in
  DB.register(email, password);
  handleLogin(new Event('submit', { bubbles: true, cancelable: true }));
}

// Add shake keyframe dynamically
const style = document.createElement('style');
style.textContent = `@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }`;
document.head.appendChild(style);
