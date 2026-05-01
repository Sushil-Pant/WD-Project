// main.js — Shop Page

let currentCategory = 'all';

function renderProducts(cat = 'all') {
  const grid = document.getElementById('products-grid');
  let products = DB.getProducts();

  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('search');

  if (searchQuery) {
    products = DB.searchProducts(searchQuery);

    // Pre-fill the search input with the active query
    const searchInput = document.getElementById('nav-search-input');
    if (searchInput) searchInput.value = searchQuery;

    const header = document.querySelector('.section-header h2');
    if (header) header.innerHTML = `Search: <em style="font-style:italic;opacity:0.7">${searchQuery}</em>`;

    const filterBar = document.querySelector('.filter-bar');
    if (filterBar) {
      filterBar.innerHTML = `<a href="index.html" class="filter-btn active" style="text-decoration:none;">← All Products</a>`;
    }

    if (!products.length) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:4rem 1rem;">
          <div style="font-size:3rem;margin-bottom:1rem;">🔍</div>
          <h3 style="font-size:1.4rem;margin-bottom:0.5rem;">No results for "${searchQuery}"</h3>
          <p style="color:#888;margin-bottom:1.5rem;">Try a different keyword or browse all products.</p>
          <a href="index.html" class="btn-primary" style="text-decoration:none;">Browse All Products</a>
        </div>`;
      return;
    }
  } else if (cat !== 'all') {
    products = products.filter(p => p.category === cat);
    const header = document.querySelector('.section-header h2');
    if (header) header.textContent = 'Featured Products';
    const filterBar = document.querySelector('.filter-bar');
    if (filterBar) filterBar.style.display = 'flex';
  }

  grid.innerHTML = products.map((p, i) => `
    <div class="product-card" style="animation-delay:${i * 0.07}s">
      <div class="product-img-wrap" onclick="window.location.href='product.html?id=${p.id}'" style="cursor: pointer;">
        <img src="${p.image}" alt="${p.name}" loading="lazy"
          onerror="this.src='https://via.placeholder.com/400x500/1a1a1a/ffffff?text=IMG'" />
        <span class="product-badge">${p.category.toUpperCase()}</span>
        ${p.stock <= 5 ? `<span class="low-stock">Only ${p.stock} left!</span>` : ''}
      </div>
      <div class="product-info">
        <h3 onclick="window.location.href='product.html?id=${p.id}'" style="cursor: pointer;">${p.name}</h3>
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
  if (result.requiresLogin) {
    sessionStorage.setItem('login_redirect', 'index.html');
    showToast(result.message, 'error');
    setTimeout(() => { window.location.href = 'login.html'; }, 1000);
    return;
  }
  showToast(result.message, result.success ? 'success' : 'error');
  if (result.success) {
    // Update cart count badge instantly — no refresh needed
    updateNavCartCount();

    // Animate the clicked button for immediate visual feedback
    const btn = document.querySelector(`[onclick="addToCart('${productId}')"]`);
    if (btn) {
      const prev = btn.textContent;
      btn.textContent = '✓ Added';
      btn.style.background = '#5aaa7a';
      btn.style.color = '#fff';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = prev;
        btn.style.background = '';
        btn.style.color = '';
        btn.disabled = false;
      }, 1200);
    }
  }
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