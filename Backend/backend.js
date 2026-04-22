const DB = {
  // ---------- PRODUCTS ----------
  getProducts() {
    const raw = localStorage.getItem('daraz_products');
    if (!raw) {
      const defaults = this._defaultProducts();
      this.setProducts(defaults);
      return defaults;
    }
    return JSON.parse(raw);
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

  // ---------- CART ----------
  getCart() {
    return JSON.parse(localStorage.getItem('daraz_cart') || '[]');
  },
  setCart(cart) {
    localStorage.setItem('daraz_cart', JSON.stringify(cart));
  },
  addToCart(productId, qty = 1) {
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
  placeOrder() {
    const cart = this.getCart();
    if (!cart.length) return { success: false, message: 'Cart is empty' };
    const products = this.getProducts();
    cart.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) prod.stock = Math.max(0, prod.stock - item.qty);
    });
    this.setProducts(products);
    const order = {
      id: 'ORD-' + Date.now(),
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
      {
        id: 'prod_1',
        name: 'Shadow Oversized Tee',
        price: 799,
        category: 'men',
        stock: 40,
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80',
        description: 'Ultra-soft cotton oversized silhouette.'
      },
      {
        id: 'prod_2',
        name: 'Noir Cargo Pants',
        price: 1599,
        category: 'men',
        stock: 25,
        image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&q=80',
        description: 'Tactical cargo with a sleek midnight finish.'
      },
      {
        id: 'prod_3',
        name: 'Dusk Wrap Dress',
        price: 1299,
        category: 'women',
        stock: 18,
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80',
        description: 'Flowing wrap silhouette for effortless elegance.'
      },
      {
        id: 'prod_4',
        name: 'Eclipse Crop Top',
        price: 699,
        category: 'women',
        stock: 30,
        image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&q=80',
        description: 'Cropped and minimal with a structured edge.'
      },
      {
        id: 'prod_5',
        name: 'Obsidian Watch',
        price: 2499,
        category: 'accessories',
        stock: 10,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
        description: 'Matte black case with sapphire glass.'
      },
      {
        id: 'prod_6',
        name: 'Void Leather Bag',
        price: 1899,
        category: 'accessories',
        stock: 15,
        image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80',
        description: 'Minimalist top-handle bag in vegan leather.'
      }
    ];
  }
};

// Update cart badge on every page
function updateNavCartCount() {
  const el = document.getElementById('nav-cart-count');
  if (el) el.textContent = DB.getCartCount();
}

// Toast notification
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => t.className = 'toast', 2800);
}

updateNavCartCount();