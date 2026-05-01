const DB = {
  // ---------- PRODUCTS ----------
  getProducts() {
    const raw = localStorage.getItem('daraz_products');
    const defaults = this._defaultProducts();
    if (!raw) {
      this.setProducts(defaults);
      return defaults;
    }
    // Always merge: ensure default products are present even for returning users
    const stored = JSON.parse(raw);
    const storedIds = new Set(stored.map(p => p.id));
    const missing = defaults.filter(p => !storedIds.has(p.id));
    if (missing.length) {
      const merged = [...stored, ...missing];
      this.setProducts(merged);
      return merged;
    }
    return stored;
  },
  setProducts(products) {
    localStorage.setItem('daraz_products', JSON.stringify(products));
  },
  addProduct(product) {
    const products = this.getProducts();
    product.id = 'prod_' + Date.now();
    product.price = parseFloat(product.price);
    product.stock = parseInt(product.stock);
    products.push(product);
    this.setProducts(products);
    return product;
  },
  updateProduct(id, updates) {
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    products[idx] = { ...products[idx], ...updates };
    if ('price' in updates) products[idx].price = parseFloat(updates.price);
    if ('stock' in updates) products[idx].stock = parseInt(updates.stock, 10);
    this.setProducts(products);
    return products[idx];
  },
  deleteProduct(id) {
    const products = this.getProducts().filter(p => p.id !== id);
    this.setProducts(products);
  },
  getProductById(id) {
    return this.getProducts().find(p => p.id === id) || null;
  },
  searchProducts(query) {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return this.getProducts().filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  },

  // ---------- USER AUTH ----------
  getCurrentUser() {
    const raw = sessionStorage.getItem('daraz_user');
    return raw ? JSON.parse(raw) : null;
  },
  _getUserRecord(email) {
    const users = JSON.parse(localStorage.getItem('daraz_users') || '[]');
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },
  _saveUserRecord(updatedUser) {
    const users = JSON.parse(localStorage.getItem('daraz_users') || '[]');
    const idx = users.findIndex(u => u.email.toLowerCase() === updatedUser.email.toLowerCase());
    if (idx !== -1) users[idx] = updatedUser;
    else users.push(updatedUser);
    localStorage.setItem('daraz_users', JSON.stringify(users));
  },
  login(email, password) {
    const users = JSON.parse(localStorage.getItem('daraz_users') || '[]');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      if (user.password !== password) return { success: false, message: 'Incorrect password. Try again.' };
      const session = { name: user.name, email: user.email };
      sessionStorage.setItem('daraz_user', JSON.stringify(session));
      return { success: true, user: session };
    }
    // Auto-register on first login
    const newUser = { name: email.split('@')[0], email, password };
    users.push(newUser);
    localStorage.setItem('daraz_users', JSON.stringify(users));
    const session = { name: newUser.name, email: newUser.email };
    sessionStorage.setItem('daraz_user', JSON.stringify(session));
    return { success: true, user: session };
  },
  register(email, password) {
    const users = JSON.parse(localStorage.getItem('daraz_users') || '[]');
    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) return { success: false, message: 'Email already registered.' };
    const newUser = { name: email.split('@')[0], email, password };
    users.push(newUser);
    localStorage.setItem('daraz_users', JSON.stringify(users));
    return { success: true, user: newUser };
  },
  updateProfile(name, newPassword) {
    const session = this.getCurrentUser();
    if (!session) return { success: false, message: 'Not logged in.' };
    const users = JSON.parse(localStorage.getItem('daraz_users') || '[]');
    const idx = users.findIndex(u => u.email.toLowerCase() === session.email.toLowerCase());
    if (idx === -1) return { success: false, message: 'User not found.' };
    if (name) users[idx].name = name;
    if (newPassword) users[idx].password = newPassword;
    localStorage.setItem('daraz_users', JSON.stringify(users));
    // Update session
    const updated = { name: users[idx].name, email: users[idx].email };
    sessionStorage.setItem('daraz_user', JSON.stringify(updated));
    return { success: true, user: updated };
  },
  logout() {
    sessionStorage.removeItem('daraz_user');
  },

  // ---------- CART ----------
  getCart() {
    return JSON.parse(localStorage.getItem('daraz_cart') || '[]');
  },
  setCart(cart) {
    localStorage.setItem('daraz_cart', JSON.stringify(cart));
  },
  addToCart(productId, qty = 1) {
    if (!this.getCurrentUser()) {
      return { success: false, requiresLogin: true, message: 'Please login to add items to cart.' };
    }
    qty = parseInt(qty, 10);
    const cart = this.getCart();
    const product = this.getProductById(productId);
    if (!product) return { success: false, message: 'Product not found' };
    if (product.stock < qty) return { success: false, message: 'Not enough stock' };
    const existing = cart.find(item => item.productId === productId);
    if (existing) {
      if (product.stock < existing.qty + qty) return { success: false, message: 'Not enough stock' };
      existing.qty += qty;
    } else {
      cart.push({ productId, qty, name: product.name, price: product.price, image: product.image });
    }
    this.setCart(cart);
    return { success: true, message: `${product.name} added to cart!` };
  },
  removeFromCart(productId) {
    this.setCart(this.getCart().filter(i => i.productId !== productId));
  },
  updateCartQty(productId, qty) {
    qty = parseInt(qty, 10);
    const cart = this.getCart();
    const item = cart.find(i => i.productId === productId);
    if (item) { item.qty = qty; this.setCart(cart); }
  },
  clearCart() {
    localStorage.removeItem('daraz_cart');
  },
  getCartTotal() {
    return this.getCart().reduce((sum, i) => sum + i.price * i.qty, 0);
  },
  getCartCount() {
    return this.getCart().reduce((sum, i) => sum + i.qty, 0);
  },

  // ---------- ORDERS ----------
  getOrders() {
    return JSON.parse(localStorage.getItem('daraz_orders') || '[]');
  },
  getMyOrders() {
    const user = this.getCurrentUser();
    if (!user) return [];
    return this.getOrders().filter(o => o.customerEmail === user.email);
  },
  placeOrder(address) {
    const cart = this.getCart();
    if (!cart.length) return { success: false, message: 'Cart is empty' };
    const user = this.getCurrentUser();
    const products = this.getProducts();
    cart.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) prod.stock = Math.max(0, prod.stock - item.qty);
    });
    this.setProducts(products);
    const order = {
      id: 'ORD-' + Date.now(),
      customerName: user ? user.name : 'Guest',
      customerEmail: user ? user.email : '',
      address: address || {},
      items: cart,
      total: this.getCartTotal(),
      date: new Date().toLocaleDateString('en-IN'),
      status: 'Confirmed'
    };
    const orders = this.getOrders();
    orders.unshift(order);
    localStorage.setItem('daraz_orders', JSON.stringify(orders));
    this.clearCart();
    return { success: true, message: `Order ${order.id} placed!`, order };
  },

  // ---------- DEFAULT PRODUCTS ----------
  _defaultProducts() {
    return [
      // ---- ORIGINAL ITEMS ----
      {
        id: 'prod_1',
        name: 'Shadow Oversized Tee',
        price: 799,
        category: 'men',
        stock: 40,
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80',
        description: 'Ultra-soft cotton oversized silhouette. Perfect for a relaxed, effortless look. Pre-shrunk and long-lasting.',
        rating: 4.5,
        reviews: 128
      },
      {
        id: 'prod_2',
        name: 'Noir Cargo Pants',
        price: 1599,
        category: 'men',
        stock: 25,
        image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80',
        description: 'Tactical cargo with a sleek midnight finish. Multiple pockets, tapered fit, and durable fabric.',
        rating: 4.3,
        reviews: 87
      },
      {
        id: 'prod_3',
        name: 'Dusk Wrap Dress',
        price: 1299,
        category: 'women',
        stock: 18,
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80',
        description: 'Flowing wrap silhouette for effortless elegance. Lightweight, breathable fabric with a timeless cut.',
        rating: 4.7,
        reviews: 204
      },
      {
        id: 'prod_4',
        name: 'Eclipse Crop Top',
        price: 699,
        category: 'women',
        stock: 30,
        image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&q=80',
        description: 'Cropped and minimal with a structured edge. Pairs perfectly with high-waist bottoms.',
        rating: 4.2,
        reviews: 65
      },
      {
        id: 'prod_5',
        name: 'Obsidian Watch',
        price: 2499,
        category: 'accessories',
        stock: 10,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
        description: 'Matte black case with sapphire glass. Water-resistant up to 50m, minimalist dial.',
        rating: 4.8,
        reviews: 312
      },
      {
        id: 'prod_6',
        name: 'Void Leather Bag',
        price: 1899,
        category: 'accessories',
        stock: 15,
        image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80',
        description: 'Minimalist top-handle bag in vegan leather. Spacious interior with a structured silhouette.',
        rating: 4.6,
        reviews: 153
      },

      // ---- NEPALI BESTSELLERS ----
      {
        id: 'nepali_1',
        name: 'Himalayan Pashmina Shawl',
        price: 2499,
        category: 'handicrafts',
        stock: 30,
        image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80',
        description: 'Luxuriously soft 100% pure Pashmina from the Himalayan highlands. Hand-woven in Kathmandu with traditional patterns. Naturally warm, feather-light, and timeless.',
        rating: 4.9,
        reviews: 847
      },
      {
        id: 'nepali_2',
        name: 'Tibetan Singing Bowl Set',
        price: 1799,
        category: 'handicrafts',
        stock: 20,
        image: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=600&q=80',
        description: 'Handcrafted 7-metal singing bowl from Patan, Nepal. Includes striker mallet and silk cushion. Used for meditation, sound healing, and stress relief.',
        rating: 4.8,
        reviews: 512
      },
      {
        id: 'nepali_3',
        name: 'Yak Wool Trek Sweater',
        price: 2999,
        category: 'men',
        stock: 22,
        image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&q=80',
        description: 'Premium yak wool sweater — 40% warmer than merino, softer than sheep wool. Hand-knitted by artisans in Mustang. Trusted by Himalayan trekkers for decades.',
        rating: 4.7,
        reviews: 389
      },
      {
        id: 'nepali_4',
        name: 'Ilam First Flush Tea',
        price: 799,
        category: 'handicrafts',
        stock: 60,
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
        description: 'Award-winning orthodox black tea from the misty hills of Ilam, Nepal. Delicate muscatel aroma with golden liquor. 100g premium loose leaf tin, harvested Spring 2026.',
        rating: 4.6,
        reviews: 1023
      },
      {
        id: 'nepali_5',
        name: 'Hand-carved Buddha Idol',
        price: 3499,
        category: 'handicrafts',
        stock: 12,
        image: 'https://images.unsplash.com/photo-1603823776617-5dab7ebf024a?w=600&q=80',
        description: 'Solid brass Shakyamuni Buddha idol, hand-carved by master craftsmen in Patan Dhoka. 24K gold-plated finish, 6-inch height. A sacred piece that blesses your home.',
        rating: 4.9,
        reviews: 267
      },
      {
        id: 'nepali_6',
        name: 'Himalayan Pink Salt Lamp',
        price: 1299,
        category: 'accessories',
        stock: 35,
        image: 'https://images.unsplash.com/photo-1551269901-5c5e68ef5df2?w=600&q=80',
        description: 'Natural pink crystal salt lamp mined from the Himalayan foothills. Emits a warm amber glow that purifies air and relieves stress. Includes wooden base and dimmer cable.',
        rating: 4.5,
        reviews: 1456
      },
      {
        id: 'nepali_7',
        name: 'Dhaka Weave Tote Bag',
        price: 899,
        category: 'women',
        stock: 40,
        image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80',
        description: 'Handwoven Dhaka fabric tote bag featuring Nepal\'s iconic geometric patterns on sturdy cotton canvas. Fully lined interior with zip pocket. A fashion statement with heritage.',
        rating: 4.4,
        reviews: 634
      },
      {
        id: 'nepali_8',
        name: 'Lokta Paper Handmade Journal',
        price: 599,
        category: 'handicrafts',
        stock: 55,
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80',
        description: 'Eco-friendly journal crafted from Lokta bark paper — a sacred Himalayan material used for centuries in monasteries. Acid-free, insect-resistant, and beautifully textured. 120 pages.',
        rating: 4.7,
        reviews: 748
      }
    ];
  }
};

// ---- GLOBAL UTILITIES ----

function updateNavCartCount() {
  const el = document.getElementById('nav-cart-count');
  if (el) el.textContent = DB.getCartCount();
}

function updateNavAuthButton() {
  const btn = document.getElementById('nav-auth-btn');
  if (!btn) return;
  const user = DB.getCurrentUser();
  if (user) {
    btn.textContent = `Hi, ${user.name}`;
    btn.href = 'profile.html';
    btn.onclick = null;
  } else {
    btn.textContent = 'Login';
    btn.href = 'login.html';
    btn.onclick = null;
  }
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => t.className = 'toast', 2800);
}

function requireLogin(redirect = 'index.html') {
  if (!DB.getCurrentUser()) {
    sessionStorage.setItem('login_redirect', redirect);
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function initSearch() {
  const input = document.getElementById('nav-search-input');
  const dropdown = document.getElementById('search-dropdown');
  if (!input || !dropdown) return;

  // Resolve the correct path to index.html from any page
  function getIndexPath() {
    const path = window.location.pathname;
    // If we're in a subdirectory (like /Frontend/script/), go up appropriately
    // Since all HTML pages are in /Frontend/, index.html is always a sibling
    return 'index.html';
  }

  input.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (!query) {
      dropdown.innerHTML = '';
      dropdown.style.display = 'none';
      return;
    }
    const results = DB.searchProducts(query);
    if (!results.length) {
      dropdown.innerHTML = '<div style="padding:1rem;color:#888;font-size:0.9rem;">No products found</div>';
      dropdown.style.display = 'block';
      return;
    }
    dropdown.innerHTML = results.slice(0, 6).map(p => `
      <a href="product.html?id=${p.id}" style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem 1rem;text-decoration:none;color:inherit;border-bottom:1px solid rgba(255,255,255,0.07);transition:background 0.15s;" onmouseenter="this.style.background='rgba(255,255,255,0.05)'" onmouseleave="this.style.background='transparent'">
        <img src="${p.image}" alt="${p.name}" style="width:42px;height:52px;object-fit:cover;border-radius:6px;flex-shrink:0;" onerror="this.src='https://via.placeholder.com/42x52/1a1a1a/fff'" />
        <div style="flex:1;min-width:0;">
          <div style="font-weight:500;font-size:0.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.name}</div>
          <div style="font-size:0.78rem;color:#aaa;margin-top:2px;">${p.category.toUpperCase()} &nbsp;·&nbsp; ₹${p.price.toLocaleString('en-IN')}</div>
        </div>
      </a>
    `).join('');
    // "See all results" link at the bottom
    dropdown.innerHTML += `<a href="${getIndexPath()}?search=${encodeURIComponent(query)}" style="display:block;padding:0.65rem 1rem;font-size:0.82rem;color:#c9a84c;text-decoration:none;text-align:center;border-top:1px solid rgba(255,255,255,0.1);">See all results for "<strong>${query}</strong>" →</a>`;
    dropdown.style.display = 'block';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const query = e.target.value.trim();
      if (query) {
        window.location.href = getIndexPath() + '?search=' + encodeURIComponent(query);
      }
    }
    if (e.key === 'Escape') {
      dropdown.style.display = 'none';
      input.blur();
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-search')) {
      dropdown.style.display = 'none';
    }
  });
}

// Initialize global UI features once DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  updateNavCartCount();
  updateNavAuthButton();
  initSearch();
});