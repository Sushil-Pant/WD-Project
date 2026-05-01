// cart.js — Cart Page

function renderCart() {
  const cart = DB.getCart();
  const container = document.getElementById('cart-items');
  const summary = document.getElementById('cart-summary');

  // Show user greeting
  const user = DB.getCurrentUser();
  const titleEl = document.querySelector('.page-title');
  if (titleEl && user) {
    titleEl.innerHTML = `Your Cart <span style="font-size:0.9rem;font-weight:400;color:var(--text-muted);font-family:'DM Sans',sans-serif;letter-spacing:0;">— ${user.name}</span>`;
  }

  if (!cart.length) {
    container.innerHTML = '<p class="empty-msg" id="empty-msg">Your cart is empty. <a href="index.html">Continue shopping →</a></p>';
    summary.style.display = 'none';
    return;
  }

  summary.style.display = 'flex';

  container.innerHTML = cart.map(item => `
    <div class="cart-item" id="citem-${item.productId}">
      <img src="${item.image}" alt="${item.name}"
        onerror="this.src='https://via.placeholder.com/100x120/1a1a1a/fff?text=IMG'"
        onclick="window.location.href='product.html?id=${item.productId}'" style="cursor: pointer;" />
      <div class="cart-item-info">
        <h4 onclick="window.location.href='product.html?id=${item.productId}'" style="cursor: pointer;">${item.name}</h4>
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

  // Update DOM directly instead of re-rendering entire cart to prevent blinking
  const itemEl = document.getElementById(`citem-${productId}`);
  if (itemEl) {
    const qtySpan = itemEl.querySelector('.qty-controls span');
    if (qtySpan) qtySpan.textContent = newQty;
    
    const btns = itemEl.querySelectorAll('.qty-controls button');
    if (btns.length === 2) {
      btns[0].setAttribute('onclick', `changeQty('${productId}', ${newQty - 1})`);
      btns[1].setAttribute('onclick', `changeQty('${productId}', ${newQty + 1})`);
    }

    const totalSpan = itemEl.querySelector('.cart-item-total');
    if (totalSpan && product) {
      totalSpan.textContent = `₹${(product.price * newQty).toLocaleString('en-IN')}`;
    }
  }

  updateSummary();
}

function removeItem(productId) {
  DB.removeFromCart(productId);
  updateNavCartCount();
  renderCart();
  showToast('Item removed from cart.');
}

function checkout() {
  const user = DB.getCurrentUser();
  const result = DB.placeOrder();
  if (result.success) {
    const name = user ? user.name : 'there';
    showToast(`🎉 Order placed, ${name}! ${result.order.id}`, 'success');
    updateNavCartCount();
    setTimeout(() => renderCart(), 500);
  } else {
    showToast(result.message, 'error');
  }
}

renderCart();