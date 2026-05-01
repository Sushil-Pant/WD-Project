// orders.js — My Orders Page

function renderOrders() {
  const orders = DB.getMyOrders();
  const container = document.getElementById('orders-list');

  if (!orders.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📦</div>
        <h3>No orders yet</h3>
        <p>Your placed orders will appear here.</p>
        <a href="index.html" class="btn-primary">Start Shopping</a>
      </div>`;
    return;
  }

  container.innerHTML = `<div class="orders-list">${orders.map((o, i) => {
    const addr = o.address || {};
    const hasAddr = addr.line1 && addr.city;
    const addrStr = hasAddr
      ? `${addr.line1}${addr.line2 ? ', ' + addr.line2 : ''}, ${addr.city}, ${addr.state} — ${addr.pin}`
      : 'No address recorded';
    const payLabel = { cod: '💵 Cash on Delivery', upi: '📱 UPI / PhonePe', card: '💳 Card' };

    return `
      <div class="order-card" style="animation-delay:${i * 0.07}s">
        <div class="order-card-header">
          <div class="order-meta">
            <div class="order-id">${o.id}</div>
            <div class="order-date">📅 ${o.date}</div>
          </div>
          <div class="order-right">
            <div class="order-total">₹${o.total.toLocaleString('en-IN')}</div>
            <span class="status-pill confirmed">${o.status}</span>
          </div>
        </div>
        <div class="order-card-body">
          <div class="order-address">
            <span class="order-address-icon">📍</span>
            <div class="order-address-text">
              <strong>${addr.name || o.customerName}</strong>
              ${addrStr}
              ${addr.phone ? `&nbsp;|&nbsp; 📞 ${addr.phone}` : ''}
              ${addr.paymentMethod ? `&nbsp;|&nbsp; ${payLabel[addr.paymentMethod] || addr.paymentMethod}` : ''}
            </div>
          </div>
          <div class="order-items">
            ${o.items.map(item => `
              <div class="order-item">
                <img src="${item.image}" alt="${item.name}"
                  onerror="this.src='https://via.placeholder.com/54x64/1a1a1a/fff?text=IMG'"
                  onclick="window.location.href='product.html?id=${item.productId}'" style="cursor: pointer;" />
                <div class="order-item-info">
                  <div class="order-item-name" onclick="window.location.href='product.html?id=${item.productId}'" style="cursor: pointer;">${item.name}</div>
                  <div class="order-item-meta">Qty: ${item.qty} × ₹${item.price.toLocaleString('en-IN')}</div>
                </div>
                <div class="order-item-price">₹${(item.price * item.qty).toLocaleString('en-IN')}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>`;
  }).join('')}</div>`;
}

window.addEventListener('DOMContentLoaded', () => {
  if (!DB.getCurrentUser()) {
    sessionStorage.setItem('login_redirect', 'orders.html');
    window.location.href = 'login.html';
    return;
  }
  updateNavCartCount();
  updateNavAuthButton();
  renderOrders();
});
