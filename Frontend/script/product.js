// product.js — Product Detail Page

const params = new URLSearchParams(window.location.search);
const productId = params.get('id');

let selectedQty = 1;

function renderProduct() {
  const product = DB.getProductById(productId);
  const section = document.getElementById('product-content');

  if (!product) {
    section.innerHTML = `<div class="empty-state"><div class="empty-icon">😕</div><h3>Product not found</h3><p>It may have been removed.</p><a href="index.html" class="btn-primary">Back to Shop</a></div>`;
    return;
  }

  document.title = `${product.name} — DARAZ`;
  const stars = renderStars(product.rating || 4.5);

  section.innerHTML = `
    <div class="product-detail">
      <div class="pd-image-wrap">
        <img src="${product.image}" alt="${product.name}"
          onerror="this.src='https://via.placeholder.com/600x750/1a1a1a/fff?text=IMG'" />
        <span class="pd-badge">${product.category.toUpperCase()}</span>
        ${product.stock <= 5 && product.stock > 0 ? `<span class="pd-low-stock">Only ${product.stock} left!</span>` : ''}
      </div>
      <div class="pd-info">
        <p class="pd-crumb">
          <a href="index.html">Shop</a>
          <span>/</span>
          <a href="index.html">${product.category}</a>
          <span>/</span>
          ${product.name}
        </p>
        <h1 class="pd-name">${product.name}</h1>
        <div class="pd-rating">
          <span class="stars">${stars}</span>
          <span>${product.rating || '4.5'} (${product.reviews || 0} reviews)</span>
        </div>
        <div class="pd-price">₹${product.price.toLocaleString('en-IN')}</div>
        <p class="pd-desc">${product.description}</p>
        <p class="pd-stock">Availability: <strong>${product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</strong></p>

        <div class="pd-qty-row">
          <span class="pd-qty-label">Quantity</span>
          <div class="qty-selector">
            <button onclick="changeQty(-1)">−</button>
            <span id="qty-display">1</span>
            <button onclick="changeQty(1)">+</button>
          </div>
        </div>

        <div class="pd-actions">
          <button class="btn-primary" id="atc-btn" onclick="addToCartDetail()" ${product.stock === 0 ? 'disabled' : ''}>
            ${product.stock === 0 ? 'Out of Stock' : '+ Add to Cart'}
          </button>
        </div>

        <div class="pd-delivery">
          🚚 Free delivery on orders above ₹999 &nbsp;|&nbsp; ✅ Easy 30-day returns
        </div>
      </div>
    </div>
  `;

  renderRelated(product);
}

function changeQty(delta) {
  const product = DB.getProductById(productId);
  const max = product ? product.stock : 1;
  selectedQty = Math.min(Math.max(1, selectedQty + delta), max);
  document.getElementById('qty-display').textContent = selectedQty;
}

function addToCartDetail() {
  const result = DB.addToCart(productId, selectedQty);
  if (result.requiresLogin) {
    sessionStorage.setItem('login_redirect', `product.html?id=${productId}`);
    showToast(result.message, 'error');
    setTimeout(() => { window.location.href = 'login.html'; }, 1000);
    return;
  }
  showToast(result.message, result.success ? 'success' : 'error');
  if (result.success) {
    updateNavCartCount();
    const btn = document.getElementById('atc-btn');
    if (btn) {
      btn.textContent = '✓ Added to Cart';
      btn.style.background = '#5aaa7a';
      setTimeout(() => { btn.textContent = '+ Add to Cart'; btn.style.background = ''; }, 1500);
    }
  }
}


function renderRelated(current) {
  const all = DB.getProducts().filter(p => p.category === current.category && p.id !== current.id).slice(0, 4);
  if (!all.length) return;
  document.getElementById('related-section').style.display = 'block';
  document.getElementById('related-grid').innerHTML = all.map(p => `
    <div class="related-card" onclick="window.location.href='product.html?id=${p.id}'">
      <img src="${p.image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/300x300/1a1a1a/fff?text=IMG'" />
      <div class="related-info">
        <h4>${p.name}</h4>
        <div class="related-price">₹${p.price.toLocaleString('en-IN')}</div>
      </div>
    </div>
  `).join('');
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

window.addEventListener('DOMContentLoaded', () => {
  updateNavCartCount();
  updateNavAuthButton();
  renderProduct();
});
