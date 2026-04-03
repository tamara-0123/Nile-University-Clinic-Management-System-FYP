document.addEventListener('DOMContentLoaded', async () => {
  const staffBody = document.getElementById('staffBody');
  const addBtn = document.getElementById('addBtn');
  const modal = document.getElementById('modal');
  const staffForm = document.getElementById('staffForm');
  const cancelBtn = document.getElementById('cancelBtn');
  const search = document.getElementById('search');
  const deactivateSelected = document.getElementById('deactivateSelected');

  let staff = [];
  let editingId = null;

  async function loadStaff() {
    try {
      const data = await API_CONFIG.request('/admin/users');
      if (data.success) {
        staff = data.users.map(u => ({
          id: u._id,
          name: u.name,
          role: u.role,
          staffID: u.staffID,
          active: u.isActive
        }));
        renderTable();
      }
    } catch (error) {
      console.error('Failed to load staff:', error);
      alert("Failed to load staff list.");
    }
  }

  function renderTable(filter = '') {
    staffBody.innerHTML = '';
    const q = filter.trim().toLowerCase();
    staff.forEach(s => {
      if (q && !(s.staffID?.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))) return;
      const tr = document.createElement('tr');
      if (!s.active) tr.classList.add('inactive');
      tr.innerHTML = `
        <td><input type="checkbox" data-id="${s.id}" class="row-select"></td>
        <td>${s.staffID || 'N/A'}</td>
        <td>${s.name}</td>
        <td>${s.role.charAt(0).toUpperCase() + s.role.slice(1)}</td>
        <td>${s.staffID}@nileuniversity.edu.ng</td>
        <td>${s.active ? 'Active' : 'Inactive'}</td>
        <td>
          <button class="action-btn edit" data-id="${s.id}" aria-label="Edit ${s.name}">Edit</button>
          <button class="action-btn deactivate" data-id="${s.id}" aria-label="Toggle active ${s.name}">${s.active ? 'Deactivate' : 'Activate'}</button>
        </td>
      `;
      staffBody.appendChild(tr);
    });
  }

  function openModal(mode = 'add', record = null) {
    modal.setAttribute('aria-hidden', 'false');
    modal.querySelector('#modalTitle').textContent = mode === 'add' ? 'Add Staff' : 'Edit Staff';
    if (record) {
      staffForm.id.value = record.staffID;
      staffForm.name.value = record.name;
      staffForm.role.value = record.role.charAt(0).toUpperCase() + record.role.slice(1);
      editingId = record.id;
      staffForm.id.disabled = true;
      staffForm.role.disabled = true;
    } else {
      staffForm.reset();
      editingId = null;
      staffForm.id.disabled = false;
      staffForm.role.disabled = false;
    }
    staffForm.querySelector('input[name="name"]').focus();
  }

  function closeModal() { modal.setAttribute('aria-hidden', 'true'); editingId = null; staffForm.id.disabled = false; staffForm.role.disabled = false; }

  addBtn.addEventListener('click', () => openModal('add'));
  cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  staffBody.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.edit');
    const toggleBtn = e.target.closest('.deactivate');
    if (editBtn) {
      const id = editBtn.dataset.id;
      const rec = staff.find(s => s.id === id);
      if (rec) openModal('edit', rec);
    }
    if (toggleBtn) {
      const id = toggleBtn.dataset.id;
      try {
        const data = await API_CONFIG.request(`/admin/users/${id}/status`, { method: 'PUT' });
        if (data.success) loadStaff();
      } catch (error) {
        alert("Failed to toggle status");
      }
    }
  });

  staffForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(staffForm);
    const payload = {
      staffID: formData.get('id').trim(),
      name: formData.get('name').trim(),
      role: formData.get('role').toLowerCase().trim(),
    };

    try {
      if (editingId) {
        const data = await API_CONFIG.request(`/admin/users/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        if (data.success) {
          alert("Staff updated");
          loadStaff();
          closeModal();
        }
      } else {
        const data = await API_CONFIG.request('/admin/users', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (data.success) {
          alert("Staff added");
          loadStaff();
          closeModal();
        }
      }
    } catch (error) {
      alert(error.message || "Operation failed");
    }
  });

  search.addEventListener('input', () => renderTable(search.value));

  deactivateSelected.addEventListener('click', async () => {
    const selected = Array.from(document.querySelectorAll('.row-select:checked')).map(i => i.dataset.id);
    if (selected.length === 0) return alert('No rows selected');

    if (confirm(`Deactivate ${selected.length} users?`)) {
      for (const id of selected) {
        await API_CONFIG.request(`/admin/users/${id}/status`, { method: 'PUT' });
      }
      loadStaff();
    }
  });

  const selectAll = document.getElementById('selectAll');
  if (selectAll) {
    selectAll.addEventListener('change', () => {
      const checked = selectAll.checked;
      document.querySelectorAll('.row-select').forEach(cb => cb.checked = checked);
    });
  }

  // Initialize
  loadStaff();
});