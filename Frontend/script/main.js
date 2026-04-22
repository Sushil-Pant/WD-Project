// main.js — Shop Page

let currentCategory = 'all';

function renderProducts(cat = 'all') {
  const grid = document.getElementById('products-grid');
  let products = DB.getProducts();
  if (cat !== 'all') products = products.filter(p => p.category === cat);

  grid.innerHTML = products.map((p, i) => `
    <div class="product-card" style="animation-delay:${i * 0.07}s">
      <div class="product-img-wrap">
        <img src="${p.image}" alt="${p.name}" loading="lazy"
          onerror="this.src='https://via.placeholder.com/400x500/1a1a1a/ffffff?text=IMG'" />
        <span class="product-badge">${p.category.toUpperCase()}</span>
        ${p.stock <= 5 ? `<span class="low-stock">Only ${p.stock} left!</span>` : ''}
      </div>
      <div class="product-info">
        <h3>${p.name}</h3>
        <p class="product-desc">${p.description}</p>
        <div class="product-footer">
          <span class="product-price">₹${p.price.toLocaleString('en-IN')}</span>
          <button class="btn-add" onclick="addToCart('${p.id}')" ${p.stock === 0 ? 'disabled' : ''}>
            ${p.stock === 0 ? 'Out of Stock' : '+ Add'}
          </button>
        </div>
      </div>
    </div>
  `).join('') || '<p class="empty-msg">No products in this category.</p>';
}

function addToCart(productId) {
  const result = DB.addToCart(productId);
  showToast(result.message, result.success ? 'success' : 'error');
  if (result.success) updateNavCartCount();
}

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = btn.dataset.cat;
    renderProducts(currentCategory);
  });
});

renderProducts();