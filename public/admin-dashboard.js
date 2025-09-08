// Robust admin-dashboard.js with defensive JSON parsing and all admin features

document.addEventListener('DOMContentLoaded', () => {
  loadPendingUsers();
  loadPendingTailors();
  loadOngoingOrders();
});

async function safeFetchJson(url, options = {}) {
  const token = localStorage.getItem('token');
  options.headers = options.headers || {};
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

// 1. Approve new users
async function loadPendingUsers() {
  const tbody = document.querySelector('#pending-users-table tbody');
  tbody.innerHTML = '<tr><td colspan="3">Loading...</td></tr>';
  const data = await safeFetchJson('/api/admin/pending-users');
  if (!data || !data.users) {
    tbody.innerHTML = '<tr><td colspan="3">Error loading users</td></tr>';
    return;
  }
  tbody.innerHTML = '';
  if (data.users.length === 0) tbody.innerHTML = '<tr><td colspan="3">No pending users</td></tr>';
  data.users.forEach(user => {
    const tr = document.createElement('tr');
    let actionCell = '';
    if (user.approved) {
      actionCell = `<button class="btn btn-secondary btn-sm" disabled>Approved</button>`;
    } else {
      actionCell = `<button class=\"btn btn-success btn-sm\" onclick=\"approveUser('${user._id}')\">Approve</button>`;
    }
    tr.innerHTML = `<td>${user.name || ''}</td><td>${user.email || ''}</td><td>${actionCell}</td>`;
    tbody.appendChild(tr);
  });
}
async function approveUser(id) {
  const result = await safeFetchJson(`/api/admin/approve-user/${id}`, { method: 'POST' });
  if (result && result.success) {
    // Find the row and update the button to 'Approved' with a different color
    const tbody = document.querySelector('#pending-users-table tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    rows.forEach(row => {
      if (row.innerHTML.includes(id)) {
        const btnCell = row.querySelector('button');
        if (btnCell) {
          btnCell.className = 'btn btn-secondary btn-sm';
          btnCell.textContent = 'Approved';
          btnCell.disabled = true;
        }
      }
    });
    alert('User approved!');
  } else {
    alert('Error approving user.');
  }
  // Optionally reload the table to reflect changes
  // loadPendingUsers();
}

// 1. Approve new tailors
async function loadPendingTailors() {
  const tbody = document.querySelector('#pending-tailors-table tbody');
  tbody.innerHTML = '<tr><td colspan="3">Loading...</td></tr>';
  const data = await safeFetchJson('/api/admin/pending-tailors');
  if (!data || !data.tailors) {
    tbody.innerHTML = '<tr><td colspan="3">Error loading tailors</td></tr>';
    return;
  }
  tbody.innerHTML = '';
  if (data.tailors.length === 0) tbody.innerHTML = '<tr><td colspan="3">No pending tailors</td></tr>';
  data.tailors.forEach(tailor => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${tailor.name || ''}</td><td>${tailor.email || ''}</td><td><button class="btn btn-success btn-sm" onclick="approveTailor('${tailor._id}')">Approve</button></td>`;
    tbody.appendChild(tr);
  });
}
async function approveTailor(id) {
  await safeFetchJson(`/api/admin/approve-tailor/${id}`, { method: 'POST' });
  loadPendingTailors();
}

// Helper: fetch all tailors for dropdown
async function fetchAllTailors() {
  const data = await safeFetchJson('/api/admin/pending-tailors');
  return data && data.tailors ? data.tailors : [];
}

// 2 & 3. Monitor ongoing orders and assign tailor
async function loadOngoingOrders() {
  const tbody = document.querySelector('#ongoing-orders-table tbody');
  tbody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
  const data = await safeFetchJson('/api/admin/ongoing-orders');
  if (!data || !data.orders) {
    tbody.innerHTML = '<tr><td colspan="5">Error loading orders</td></tr>';
    return;
  }
  tbody.innerHTML = '';
  if (data.orders.length === 0) tbody.innerHTML = '<tr><td colspan="5">No ongoing orders</td></tr>';
  let tailors = await fetchAllTailors();
  data.orders.forEach(order => {
    const tr = document.createElement('tr');
    let tailorOptions = tailors.map(t => `<option value="${t._id}">${t.name || t.email}</option>`).join('');
    tr.innerHTML = `
      <td>${order._id}</td>
      <td>${order.customer?.name || ''}</td>
      <td>${order.tailor?.name || ''}</td>
      <td>${order.status}</td>
      <td>
        <select class="form-select form-select-sm d-inline w-auto" id="tailor-select-${order._id}">
          <option value="">Select Tailor</option>
          ${tailorOptions}
        </select>
        <button class="btn btn-primary btn-sm ms-1" onclick="assignTailor('${order._id}')">Assign</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}
async function assignTailor(orderId) {
  const select = document.getElementById(`tailor-select-${orderId}`);
  const tailorId = select.value;
  if (!tailorId) return alert('Select a tailor');
  await safeFetchJson('/api/admin/assign-tailor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, tailorId })
  });
  loadOngoingOrders();
}

// 4. Reports
async function loadOrderStats(period) {
  const reportDiv = document.getElementById('report-results');
  reportDiv.innerHTML = 'Loading...';
  const stats = await safeFetchJson(`/api/admin/order-stats?period=${period}`);
  if (!stats) {
    reportDiv.innerHTML = '<div class="alert alert-danger">Error loading stats</div>';
    return;
  }
  let html = `<h5>Orders per ${period}</h5><ul class="list-group">`;
  stats.forEach(s => {
    html += `<li class="list-group-item">${period === 'week' ? 'Week' : 'Day'} ${s._id}: ${s.count} orders</li>`;
  });
  html += '</ul>';
  reportDiv.innerHTML = html;
}
async function loadTopCustomers() {
  const reportDiv = document.getElementById('report-results');
  reportDiv.innerHTML = 'Loading...';
  const customers = await safeFetchJson('/api/admin/top-customers');
  if (!customers) {
    reportDiv.innerHTML = '<div class="alert alert-danger">Error loading customers</div>';
    return;
  }
  let html = '<h5>Top Customers</h5><ul class="list-group">';
  customers.forEach(c => {
    html += `<li class="list-group-item">Customer ID: ${c._id} - Orders: ${c.count}</li>`;
  });
  html += '</ul>';
  reportDiv.innerHTML = html;
}
async function loadTopTailors() {
  const reportDiv = document.getElementById('report-results');
  reportDiv.innerHTML = 'Loading...';
  const tailors = await safeFetchJson('/api/admin/top-tailors');
  if (!tailors) {
    reportDiv.innerHTML = '<div class="alert alert-danger">Error loading tailors</div>';
    return;
  }
  let html = '<h5>Top Tailors</h5><ul class="list-group">';
  tailors.forEach(t => {
    html += `<li class="list-group-item">Tailor ID: ${t._id} - Orders: ${t.count}</li>`;
  });
  html += '</ul>';
  reportDiv.innerHTML = html;
}
