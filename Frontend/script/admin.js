// admin.js — Admin Panel

function renderAdminTable() {
  const products = DB.getProducts();
  const tbody = document.getElementById('admin-table-body');
  tbody.innerHTML = products.map(p => `
    <tr>
      <td>${p.name}</td>
      <td><span class="cat-pill ${p.category}">${p.category}</span></td>
      <td>₹${p.price.toLocaleString('en-IN')}</td>
      <td class="${p.stock <= 5 ? 'low-stock-text' : ''}">${p.stock}</td>
      <td>
        <button class="btn-sm" onclick="editProduct('${p.id}')">Edit</button>
        <button class="btn-sm danger" onclick="deleteProduct('${p.id}')">Delete</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="5">No products found.</td></tr>';
}

function renderOrdersTable() {
  const orders = DB.getOrders();
  const tbody = document.getElementById('orders-table-body');
  tbody.innerHTML = orders.map(o => `
    <tr>
      <td>${o.id}</td>
      <td><strong>${o.customerName || 'Guest'}</strong><br><small style="color:var(--text-muted)">${o.customerEmail || ''}</small></td>
      <td>${o.items.map(i => `${i.name} ×${i.qty}`).join(', ')}</td>
      <td>₹${o.total.toLocaleString('en-IN')}</td>
      <td>${o.date}</td>
      <td><span class="status-pill confirmed">${o.status}</span></td>
    </tr>
  `).join('') || '<tr><td colspan="6">No orders yet.</td></tr>';
}

function updateStats() {
  const products = DB.getProducts();
  const orders = DB.getOrders();
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  document.getElementById('stat-products').textContent = products.length;
  document.getElementById('stat-orders').textContent = orders.length;
  document.getElementById('stat-revenue').textContent = `₹${revenue.toLocaleString('en-IN')}`;
}

function saveProduct() {
  const id = document.getElementById('edit-id').value;
  const data = {
    name: document.getElementById('prod-name').value.trim(),
    price: document.getElementById('prod-price').value,
    category: document.getElementById('prod-cat').value,
    image: document.getElementById('prod-img').value.trim(),
    description: document.getElementById('prod-desc').value.trim(),
    stock: document.getElementById('prod-stock').value,
  };
  if (!data.name || !data.price || !data.stock) {
    showToast('Please fill all required fields.', 'error');
    return;
  }
  if (id) {
    DB.updateProduct(id, data);
    showToast('Product updated!');
  } else {
    DB.addProduct(data);
    showToast('Product added!');
  }
  resetForm();
  renderAdminTable();
  updateStats();
}

function editProduct(id) {
  const p = DB.getProductById(id);
  if (!p) return;
  document.getElementById('edit-id').value = p.id;
  document.getElementById('prod-name').value = p.name;
  document.getElementById('prod-price').value = p.price;
  document.getElementById('prod-cat').value = p.category;
  document.getElementById('prod-img').value = p.image;
  document.getElementById('prod-desc').value = p.description;
  document.getElementById('prod-stock').value = p.stock;
  document.querySelector('.admin-form-card h3').textContent = 'Edit Product';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  DB.deleteProduct(id);
  showToast('Product deleted.', 'error');
  renderAdminTable();
  updateStats();
}

function resetForm() {
  document.getElementById('edit-id').value = '';
  document.getElementById('prod-name').value = '';
  document.getElementById('prod-price').value = '';
  document.getElementById('prod-img').value = '';
  document.getElementById('prod-desc').value = '';
  document.getElementById('prod-stock').value = '';
  document.getElementById('prod-cat').value = 'men';
  document.querySelector('.admin-form-card h3').textContent = 'Add / Edit Product';
}

window.addEventListener('DOMContentLoaded', () => {
  updateNavCartCount();
  updateNavAuthButton();
  initSearch();
  renderAdminTable();
  renderOrdersTable();
  updateStats();
});