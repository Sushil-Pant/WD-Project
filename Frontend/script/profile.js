// profile.js — My Profile Page

function renderProfile() {
  const user = DB.getCurrentUser();
  if (!user) return;

  // Avatar initials
  const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('profile-avatar').textContent = initials;
  document.getElementById('profile-display-name').textContent = user.name;
  document.getElementById('profile-display-email').textContent = user.email;

  // Pre-fill form
  document.getElementById('edit-name').value = user.name;
  document.getElementById('edit-email').value = user.email;

  // Nav auth button
  const btn = document.getElementById('nav-auth-btn');
  if (btn) { btn.textContent = user.name; btn.href = 'profile.html'; }

  // Stats
  const orders = DB.getMyOrders();
  const totalSpent = orders.reduce((s, o) => s + o.total, 0);
  document.getElementById('profile-stats').innerHTML = `
    <div class="stat-badge"><div class="stat-val">${orders.length}</div><div class="stat-lbl">Orders</div></div>
    <div class="stat-badge"><div class="stat-val">₹${totalSpent.toLocaleString('en-IN')}</div><div class="stat-lbl">Total Spent</div></div>
  `;
}

function saveProfile() {
  const name = document.getElementById('edit-name').value.trim();
  if (!name) { showToast('Name cannot be empty.', 'error'); return; }

  const result = DB.updateProfile(name, null);
  if (result.success) {
    showToast('Profile updated!', 'success');
    renderProfile();
  } else {
    showToast(result.message, 'error');
  }
}

function changePassword() {
  const oldPass = document.getElementById('old-pass').value;
  const newPass = document.getElementById('new-pass').value;
  const confirmPass = document.getElementById('confirm-pass').value;

  if (!oldPass || !newPass || !confirmPass) {
    showToast('Please fill all password fields.', 'error'); return;
  }
  if (newPass.length < 4) {
    showToast('New password must be at least 4 characters.', 'error'); return;
  }
  if (newPass !== confirmPass) {
    showToast('Passwords do not match.', 'error'); return;
  }

  // Verify old password
  const user = DB.getCurrentUser();
  const users = JSON.parse(localStorage.getItem('daraz_users') || '[]');
  const record = users.find(u => u.email.toLowerCase() === user.email.toLowerCase());
  if (!record || record.password !== oldPass) {
    showToast('Current password is incorrect.', 'error'); return;
  }

  const result = DB.updateProfile(null, newPass);
  if (result.success) {
    showToast('Password changed successfully!', 'success');
    document.getElementById('old-pass').value = '';
    document.getElementById('new-pass').value = '';
    document.getElementById('confirm-pass').value = '';
  } else {
    showToast(result.message, 'error');
  }
}

function handleLogout() {
  DB.logout();
  showToast('Logged out successfully.', 'success');
  setTimeout(() => { window.location.href = 'index.html'; }, 800);
}

window.addEventListener('DOMContentLoaded', () => {
  if (!DB.getCurrentUser()) {
    sessionStorage.setItem('login_redirect', 'profile.html');
    window.location.href = 'login.html';
    return;
  }
  updateNavCartCount();
  updateNavAuthButton();
  renderProfile();
});
