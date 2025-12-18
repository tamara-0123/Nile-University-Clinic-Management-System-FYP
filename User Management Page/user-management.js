document.addEventListener('DOMContentLoaded', ()=>{
  const storageKey = 'clinic_staff_v1';
  const sampleStaff = [
    {id:'S001',name:'Yusuf Mohammed',role:'Doctor',email:'yusuf.mohammed@example.com',active:true},
    {id:'S002',name:'Aisha Bello',role:'Nurse',email:'aisha.bello@example.com',active:true},
    {id:'S003',name:'Samuel Obi',role:'Nurse',email:'samuel.obi@example.com',active:false}
  ];

  // Ensure the sample data appears on the page:
  // If there's no stored data, or stored data still contains the old sample names,
  // write the updated sampleStaff into localStorage so the table displays them.
  try{
    const stored = JSON.parse(localStorage.getItem(storageKey));
    const legacyNames = ['Dr. Aisha Khannn','Nurse Samuel Lee','Dr. Maria Gomez'];
    if(!Array.isArray(stored) || stored.some(s => legacyNames.includes(s.name))){
      localStorage.setItem(storageKey, JSON.stringify(sampleStaff));
    }
  }catch(e){
    localStorage.setItem(storageKey, JSON.stringify(sampleStaff));
  }

  function normalizeRole(r){
    if(!r) return 'Doctor';
    const s = r.toLowerCase();
    if(s.includes('nurse')) return 'Nurse';
    return 'Doctor';
  }

  let staff = (JSON.parse(localStorage.getItem(storageKey)) || sampleStaff.slice()).map(s=> ({...s, role: normalizeRole(s.role)}));
  const staffBody = document.getElementById('staffBody');
  const addBtn = document.getElementById('addBtn');
  const modal = document.getElementById('modal');
  const staffForm = document.getElementById('staffForm');
  const cancelBtn = document.getElementById('cancelBtn');
  const search = document.getElementById('search');
  const deactivateSelected = document.getElementById('deactivateSelected');

  let editingId = null;

  function save(){ localStorage.setItem(storageKey, JSON.stringify(staff)); }

  function renderTable(filter = ''){
    staffBody.innerHTML = '';
    const q = filter.trim().toLowerCase();
    staff.forEach(s=>{
      if(q && !(s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))) return;
      const tr = document.createElement('tr');
      // add inactive class when not active
      if(!s.active) tr.classList.add('inactive');
      tr.innerHTML = `
        <td><input type="checkbox" data-id="${s.id}" class="row-select"></td>
        <td>${s.id}</td>
        <td>${s.name}</td>
        <td>${s.role}</td>
        <td>${s.email || ''}</td>
        <td>${s.active ? 'Active' : 'Inactive'}</td>
        <td>
          <button class="action-btn edit" data-id="${s.id}" aria-label="Edit ${s.name}">Edit</button>
          <button class="action-btn deactivate" data-id="${s.id}" aria-label="Toggle active ${s.name}">${s.active ? 'Deactivate' : 'Activate'}</button>
        </td>
      `;
      staffBody.appendChild(tr);
    });
    const sa = document.getElementById('selectAll'); if(sa) sa.checked = false;
  }

  function openModal(mode='add', record=null){
    modal.setAttribute('aria-hidden','false');
    modal.querySelector('#modalTitle').textContent = mode === 'add' ? 'Add Staff' : 'Edit Staff';
    if(record){
      staffForm.id.value = record.id;
      staffForm.name.value = record.name;
      staffForm.role.value = record.role;
      staffForm.email.value = record.email || '';
      editingId = record.id;
      staffForm.id.disabled = true;
      // role should not be editable when editing existing staff
      staffForm.role.disabled = true;
    } else {
      staffForm.reset();
      editingId = null;
      staffForm.id.disabled = false;
      staffForm.role.disabled = false;
    }
    staffForm.querySelector('input[name="name"]').focus();
  }

  function closeModal(){ modal.setAttribute('aria-hidden','true'); editingId = null; staffForm.id.disabled = false; }

  addBtn.addEventListener('click', ()=> openModal('add'));
  cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e)=>{ if(e.target === modal) closeModal(); });

  staffBody.addEventListener('click', (e)=>{
    const editBtn = e.target.closest('.edit');
    const toggleBtn = e.target.closest('.deactivate');
    if(editBtn){
      const id = editBtn.dataset.id;
      const rec = staff.find(s=>s.id===id);
      if(rec) openModal('edit', rec);
    }
    if(toggleBtn){
      const id = toggleBtn.dataset.id;
      const rec = staff.find(s=>s.id===id);
      if(rec){ rec.active = !rec.active; save(); renderTable(search.value); }
    }
  });

  staffForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const formData = new FormData(staffForm);
    const roleVal = (formData.get('role') && formData.get('role').trim()) || (editingId ? (staff.find(s=>s.id===editingId)?.role || 'Doctor') : 'Doctor');
    const record = {
      id: formData.get('id').trim(),
      name: formData.get('name').trim(),
      role: roleVal,
      email: formData.get('email').trim(),
      active: true
    };
    if(!record.id || !record.name) return alert('Please provide ID and name.');

    if(editingId){
      const idx = staff.findIndex(s=>s.id===editingId);
      if(idx>-1){ staff[idx] = {...staff[idx], ...record}; save(); }
    } else {
      if(staff.some(s=>s.id===record.id)) return alert('ID already exists.');
      staff.unshift(record);
      save();
    }
    renderTable(search.value);
    closeModal();
  });

  search.addEventListener('input', ()=> renderTable(search.value));

  deactivateSelected.addEventListener('click', ()=>{
    const selected = Array.from(document.querySelectorAll('.row-select:checked')).map(i=>i.dataset.id);
    if(selected.length===0) return alert('No rows selected');
    staff = staff.map(s=> selected.includes(s.id) ? {...s, active:false} : s);
    save(); renderTable(search.value);
  });

  // Select all checkbox behavior
  const selectAll = document.getElementById('selectAll');
  if(selectAll){
    selectAll.addEventListener('change', ()=>{
      const checked = selectAll.checked;
      document.querySelectorAll('.row-select').forEach(cb=> cb.checked = checked);
    });
  }

  // initialize
  renderTable();
});