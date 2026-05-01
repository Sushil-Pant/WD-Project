// checkout.js — Checkout Page

if (!requireLogin('checkout.html')) { /* redirected */ }

updateNavCartCount();
updateNavAuthButton();

const user = DB.getCurrentUser();

// Pre-fill name from user session
window.addEventListener('DOMContentLoaded', () => {
  if (user) {
    document.getElementById('addr-name').value = user.name || '';
  }
  renderOrderSummary();
});

function renderOrderSummary() {
  const cart = DB.getCart();
  if (!cart.length) {
    // Redirect to cart if empty
    showToast('Your cart is empty.', 'error');
    setTimeout(() => { window.location.href = 'cart.html'; }, 1200);
    return;
  }

  const itemsEl = document.getElementById('checkout-items');
  itemsEl.innerHTML = cart.map(item => `
    <div class="co-item">
      <img src="${item.image}" alt="${item.name}"
        onerror="this.src='https://via.placeholder.com/50x60/1a1a1a/fff?text=IMG'" />
      <div class="co-item-info">
        <div class="co-item-name">${item.name}</div>
        <div class="co-item-meta">Qty: ${item.qty} × ₹${item.price.toLocaleString('en-IN')}</div>
      </div>
      <div class="co-item-price">₹${(item.price * item.qty).toLocaleString('en-IN')}</div>
    </div>
  `).join('');

  const subtotal = DB.getCartTotal();
  const shipping = subtotal >= 999 ? 0 : 99;
  const total = subtotal + shipping;
  document.getElementById('co-subtotal').textContent = `₹${subtotal.toLocaleString('en-IN')}`;
  document.getElementById('co-shipping').textContent = shipping === 0 ? 'FREE' : `₹${shipping}`;
  document.getElementById('co-total').textContent = `₹${total.toLocaleString('en-IN')}`;
}

// ---- LOCATION DETECTION ----
function detectLocation() {
  const statusEl = document.getElementById('location-status');
  const btn = document.getElementById('btn-location');
  statusEl.style.display = 'block';
  statusEl.className = 'location-status';
  statusEl.textContent = '📡 Detecting your location…';
  btn.disabled = true;

  if (!navigator.geolocation) {
    statusEl.className = 'location-status err';
    statusEl.textContent = '❌ Geolocation is not supported by your browser.';
    btn.disabled = false;
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
        );
        const data = await res.json();
        const addr = data.address;

        // Fill form fields from geocoder
        const road = addr.road || addr.pedestrian || addr.suburb || '';
        const houseNo = addr.house_number ? `${addr.house_number}, ` : '';
        document.getElementById('addr-line1').value = `${houseNo}${road}`.trim();
        document.getElementById('addr-line2').value = addr.suburb || addr.neighbourhood || '';
        document.getElementById('addr-city').value = addr.city || addr.town || addr.village || '';
        document.getElementById('addr-pin').value = addr.postcode || '';

        // Match state
        const stateRaw = addr.state || '';
        const stateSelect = document.getElementById('addr-state');
        for (let opt of stateSelect.options) {
          if (stateRaw.toLowerCase().includes(opt.value.toLowerCase()) || opt.value.toLowerCase().includes(stateRaw.toLowerCase())) {
            stateSelect.value = opt.value;
            break;
          }
        }

        statusEl.className = 'location-status ok';
        statusEl.textContent = `✅ Location detected: ${addr.city || addr.town || addr.suburb || 'your area'}, ${addr.state || 'India'}`;
      } catch {
        statusEl.className = 'location-status err';
        statusEl.textContent = '⚠️ Could not fetch address details. Please fill manually.';
      }
      btn.disabled = false;
    },
    (err) => {
      statusEl.className = 'location-status err';
      statusEl.textContent = '❌ Location access denied. Please fill address manually.';
      btn.disabled = false;
    }
  );
}

// ---- PLACE ORDER ----
function placeOrder() {
  const name = document.getElementById('addr-name').value.trim();
  const phone = document.getElementById('addr-phone').value.trim();
  const line1 = document.getElementById('addr-line1').value.trim();
  const city = document.getElementById('addr-city').value.trim();
  const state = document.getElementById('addr-state').value;
  const pin = document.getElementById('addr-pin').value.trim();

  if (!name || !phone || !line1 || !city || !state || !pin) {
    showToast('Please fill all required address fields.', 'error');
    return;
  }
  if (!/^\d{6}$/.test(pin)) {
    showToast('Enter a valid 6-digit PIN code.', 'error');
    return;
  }
  if (!/^\+?[\d\s\-]{8,15}$/.test(phone)) {
    showToast('Enter a valid phone number.', 'error');
    return;
  }

  const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
  const line2 = document.getElementById('addr-line2').value.trim();
  const country = document.getElementById('addr-country').value;

  const address = { name, phone, line1, line2, city, state, pin, country, paymentMethod };

  const btn = document.getElementById('place-order-btn');
  btn.textContent = 'Placing Order…';
  btn.disabled = true;

  setTimeout(() => {
    const result = DB.placeOrder(address);
    if (result.success) {
      showSuccessScreen(result.order);
    } else {
      showToast(result.message, 'error');
      btn.textContent = 'Place Order →';
      btn.disabled = false;
    }
  }, 700);
}

function showSuccessScreen(order) {
  const section = document.querySelector('.page-section');
  const addr = order.address;
  const addrStr = `${addr.line1}${addr.line2 ? ', ' + addr.line2 : ''}, ${addr.city}, ${addr.state} — ${addr.pin}`;
  const payLabel = { cod: 'Cash on Delivery', upi: 'UPI / PhonePe / GPay', card: 'Debit / Credit Card' };

  section.innerHTML = `
    <div class="order-success">
      <div class="success-icon">🎉</div>
      <h2>Order Placed!</h2>
      <p>Thank you, <strong>${order.customerName}</strong>! Your order is confirmed.</p>
      <div class="order-id-chip">${order.id}</div>
      <div class="success-address-chip">
        <strong>📍 Delivering to:</strong>
        ${addr.name}<br>${addrStr}<br>
        📞 ${addr.phone}<br>
        💳 ${payLabel[addr.paymentMethod] || addr.paymentMethod}
      </div>
      <div class="success-actions">
        <a href="orders.html" class="btn-primary">View My Orders</a>
        <a href="index.html" class="btn-outline">Continue Shopping</a>
      </div>
    </div>
  `;
  updateNavCartCount();
}
