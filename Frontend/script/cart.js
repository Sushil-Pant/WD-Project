// cart.js — Cart Page

function renderCart() {
  const cart = DB.getCart();
  const container = document.getElementById('cart-items');
  const summary = document.getElementById('cart-summary');
  const emptyMsg = document.getElementById('empty-msg');

  if (!cart.length) {
    emptyMsg.style.display = 'block';
    summary.style.display = 'none';
    container.innerHTML = '';
    container.appendChild(emptyMsg);
    return;
  }

  emptyMsg.style.display = 'none';
  summary.style.display = 'flex';

  container.innerHTML = cart.map(item => `
    <div class="cart-item" id="citem-${item.productId}">
      <img src="${item.image}" alt="${item.name}"
        onerror="this.src='https://via.placeholder.com/100x120/1a1a1a/fff?text=IMG'" />
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <p class="cart-item-price">₹${item.price.toLocaleString('en-IN')} each</p>
        <div class="qty-controls">
          <button onclick="changeQty('${item.productId}', ${item.qty - 1})">−</button>
          <span>${item.qty}</span>
          <button onclick="changeQty('${item.productId}', ${item.qty + 1})">+</button>
        </div>
      </div>
      <div class="cart-item-right">
        <span class="cart-item-total">₹${(item.price * item.qty).toLocaleString('en-IN')}</span>
        <button class="btn-remove" onclick="removeItem('${item.productId}')">Remove</button>
      </div>
    </div>
  `).join('');

  updateSummary();
}

function updateSummary() {
  const subtotal = DB.getCartTotal();
  const shipping = subtotal >= 999 ? 0 : 99;
  const total = subtotal + shipping;
  document.getElementById('subtotal').textContent = `₹${subtotal.toLocaleString('en-IN')}`;
  document.getElementById('shipping').textContent = shipping === 0 ? 'FREE' : `₹${shipping}`;
  document.getElementById('total').textContent = `₹${total.toLocaleString('en-IN')}`;
}

function changeQty(productId, newQty) {
  if (newQty < 1) { removeItem(productId); return; }
  const product = DB.getProductById(productId);
  if (product && newQty > product.stock) {
    showToast(`Only ${product.stock} in stock!`, 'error');
    return;
  }
  DB.updateCartQty(productId, newQty);
  updateNavCartCount();
  renderCart();
}

function removeItem(productId) {
  DB.removeFromCart(productId);
  updateNavCartCount();
  renderCart();
  showToast('Item removed from cart.');
}

function checkout() {
  const result = DB.placeOrder();
  if (result.success) {
    showToast(`🎉 ${result.message}`, 'success');
    updateNavCartCount();
    setTimeout(() => renderCart(), 500);
  } else {
    showToast(result.message, 'error');
  }
}

renderCart();