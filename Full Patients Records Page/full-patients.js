<<<<<<< HEAD
document.addEventListener('DOMContentLoaded', ()=>{
  const storageKey = 'clinic_patients_v1';
  const sample = [
    {id:'P100',name:'Aisha Khan',age:20,sex:'Female',diagnosis:'Flu',admitted:'2025-12-14',discharged:'Pending',status:'active'},
    {id:'P101',name:'Samuel Lee',age:17,sex:'Male',diagnosis:'Malaria',admitted:'2025-12-12',discharged:'Pending',status:'active'},
    {id:'P102',name:'Maria Gomez',age:19,sex:'Female',diagnosis:'Typhoid',admitted:'2025-12-10',discharged:'2025-12-15',status:'discharged'}
  ];

  let patients = JSON.parse(localStorage.getItem(storageKey)) || sample.slice();

  const patientsBody = document.getElementById('patientsBody');
  const search = document.getElementById('search');
  const statusFilter = document.getElementById('statusFilter');
  const fromDate = document.getElementById('fromDate');
  const toDate = document.getElementById('toDate');
  const exportCsv = document.getElementById('exportCsv');
  const printBtn = document.getElementById('printBtn');
  const addPatient = document.getElementById('addPatient');
  const modal = document.getElementById('modal');
  const patientForm = document.getElementById('patientForm');
  const closeModal = document.getElementById('closeModal');

  function save(){ localStorage.setItem(storageKey, JSON.stringify(patients)); }

  function formatDate(d){ if(!d) return ''; const dt = new Date(d); if(isNaN(dt)) return d; return dt.toISOString().slice(0,10); }

  function render(filter=''){
    patientsBody.innerHTML = '';
    const q = filter.trim().toLowerCase();
    const status = statusFilter.value;
    const from = fromDate.value;
    const to = toDate.value;

    patients.forEach(p=>{
      if(q && !(p.id.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || (p.diagnosis || '').toLowerCase().includes(q))) return;
      if(status !== 'all' && p.status !== status) return;
      if(from && p.admitted && p.admitted < from) return;
      if(to && p.admitted && p.admitted > to) return;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.id}</td>
        <td>${p.name}</td>
        <td>${p.age || ''}</td>
        <td>${p.sex || ''}</td>
        <td>${p.diagnosis || ''}</td>
        <td>${formatDate(p.admitted)}</td>
        <td>${formatDate(p.discharged)}</td>
        <td>${p.status}</td>
        <td>
          <button class="action-btn view" data-id="${p.id}" aria-label="View ${p.name}">View</button>
          <button class="action-btn delete" data-id="${p.id}" aria-label="Delete ${p.name}">Delete</button>
        </td>
      `;
      patientsBody.appendChild(tr);
    });
  }

  function openModal(mode='view', rec=null){
    modal.setAttribute('aria-hidden','false');
    document.getElementById('modalTitle').textContent = mode === 'add' ? 'Add Patient' : (mode === 'edit' ? 'Edit Patient' : 'View Patient');
    if(rec){
      patientForm.id.value = rec.id;
      patientForm.name.value = rec.name || '';
      patientForm.age.value = rec.age || '';
      patientForm.sex.value = rec.sex || 'Male';
      patientForm.diagnosis.value = rec.diagnosis || '';
      patientForm.admitted.value = rec.admitted || '';
      patientForm.discharged.value = rec.discharged || '';
      patientForm.status.value = rec.status || 'active';
      // if view mode, disable inputs
      if(mode === 'view'){
        patientForm.querySelectorAll('input,select').forEach(i=> i.disabled = true);
        patientForm.querySelector('button[type="submit"]').style.display = 'none';
      } else {
        patientForm.querySelectorAll('input,select').forEach(i=> i.disabled = false);
        patientForm.querySelector('input[name="id"]').disabled = (mode === 'edit');
        patientForm.querySelector('button[type="submit"]').style.display = '';
      }
    } else {
      patientForm.reset();
      patientForm.querySelectorAll('input,select').forEach(i=> i.disabled = false);
      patientForm.querySelector('button[type="submit"]').style.display = '';
    }
  }

  function closeModalFunc(){ modal.setAttribute('aria-hidden','true'); }

  patientsBody.addEventListener('click', (e)=>{
    const view = e.target.closest('.view');
    const del = e.target.closest('.delete');
    if(view){
      const id = view.dataset.id;
      const rec = patients.find(p=> p.id === id);
      if(rec) openModal('view', rec);
    }
    if(del){
      const id = del.dataset.id;
      if(!confirm('Delete record? This cannot be undone.')) return;
      patients = patients.filter(p=> p.id !== id);
      save(); render(search.value);
    }
  });

  addPatient.addEventListener('click', ()=> openModal('add'));
  closeModal.addEventListener('click', closeModalFunc);
  modal.addEventListener('click', (e)=>{ if(e.target === modal) closeModalFunc(); });

  patientForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const fd = new FormData(patientForm);
    const rec = {
      id: fd.get('id').trim(),
      name: fd.get('name').trim(),
      age: fd.get('age') ? Number(fd.get('age')) : null,
      sex: fd.get('sex'),
      diagnosis: fd.get('diagnosis').trim(),
      admitted: fd.get('admitted') || '',
      discharged: fd.get('discharged') || '',
      status: fd.get('status') || 'active'
    };
    if(!rec.id || !rec.name) return alert('Please provide ID and Name');
    const exists = patients.findIndex(p=> p.id === rec.id);
    if(exists >= 0){ patients[exists] = {...patients[exists], ...rec}; }
    else { patients.unshift(rec); }
    save(); render(search.value); closeModalFunc();
  });

  search.addEventListener('input', ()=> render(search.value));
  statusFilter.addEventListener('change', ()=> render(search.value));
  fromDate.addEventListener('change', ()=> render(search.value));
  toDate.addEventListener('change', ()=> render(search.value));

  exportCsv.addEventListener('click', ()=>{
    const rows = patients;
    const csv = [ ['ID','Name','Age','Sex','Diagnosis','Admitted','Discharged','Status'], ...rows.map(r=>[r.id,r.name,r.age,r.sex,r.diagnosis,r.admitted,r.discharged,r.status]) ];
    const csvContent = csv.map(e=>e.join(',')).join('\n');
    const blob = new Blob([csvContent],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'patients.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });

  printBtn.addEventListener('click', ()=> window.print());

  // basic init
  render();
=======
document.addEventListener('DOMContentLoaded', ()=>{
  const storageKey = 'clinic_patients_v1';
  const sample = [
    {id:'P100',name:'Aisha Khan',age:20,sex:'Female',diagnosis:'Flu',admitted:'2025-12-14',discharged:'Pending',status:'active'},
    {id:'P101',name:'Samuel Lee',age:17,sex:'Male',diagnosis:'Malaria',admitted:'2025-12-12',discharged:'Pending',status:'active'},
    {id:'P102',name:'Maria Gomez',age:19,sex:'Female',diagnosis:'Typhoid',admitted:'2025-12-10',discharged:'2025-12-15',status:'discharged'}
  ];

  let patients = JSON.parse(localStorage.getItem(storageKey)) || sample.slice();

  const patientsBody = document.getElementById('patientsBody');
  const search = document.getElementById('search');
  const statusFilter = document.getElementById('statusFilter');
  const fromDate = document.getElementById('fromDate');
  const toDate = document.getElementById('toDate');
  const exportCsv = document.getElementById('exportCsv');
  const printBtn = document.getElementById('printBtn');
  const addPatient = document.getElementById('addPatient');
  const modal = document.getElementById('modal');
  const patientForm = document.getElementById('patientForm');
  const closeModal = document.getElementById('closeModal');

  function save(){ localStorage.setItem(storageKey, JSON.stringify(patients)); }

  function formatDate(d){ if(!d) return ''; const dt = new Date(d); if(isNaN(dt)) return d; return dt.toISOString().slice(0,10); }

  function render(filter=''){
    patientsBody.innerHTML = '';
    const q = filter.trim().toLowerCase();
    const status = statusFilter.value;
    const from = fromDate.value;
    const to = toDate.value;

    patients.forEach(p=>{
      if(q && !(p.id.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || (p.diagnosis || '').toLowerCase().includes(q))) return;
      if(status !== 'all' && p.status !== status) return;
      if(from && p.admitted && p.admitted < from) return;
      if(to && p.admitted && p.admitted > to) return;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.id}</td>
        <td>${p.name}</td>
        <td>${p.age || ''}</td>
        <td>${p.sex || ''}</td>
        <td>${p.diagnosis || ''}</td>
        <td>${formatDate(p.admitted)}</td>
        <td>${formatDate(p.discharged)}</td>
        <td>${p.status}</td>
        <td>
          <button class="action-btn view" data-id="${p.id}" aria-label="View ${p.name}">View</button>
          <button class="action-btn delete" data-id="${p.id}" aria-label="Delete ${p.name}">Delete</button>
        </td>
      `;
      patientsBody.appendChild(tr);
    });
  }

  function openModal(mode='view', rec=null){
    modal.setAttribute('aria-hidden','false');
    document.getElementById('modalTitle').textContent = mode === 'add' ? 'Add Patient' : (mode === 'edit' ? 'Edit Patient' : 'View Patient');
    if(rec){
      patientForm.id.value = rec.id;
      patientForm.name.value = rec.name || '';
      patientForm.age.value = rec.age || '';
      patientForm.sex.value = rec.sex || 'Male';
      patientForm.diagnosis.value = rec.diagnosis || '';
      patientForm.admitted.value = rec.admitted || '';
      patientForm.discharged.value = rec.discharged || '';
      patientForm.status.value = rec.status || 'active';
      // if view mode, disable inputs
      if(mode === 'view'){
        patientForm.querySelectorAll('input,select').forEach(i=> i.disabled = true);
        patientForm.querySelector('button[type="submit"]').style.display = 'none';
      } else {
        patientForm.querySelectorAll('input,select').forEach(i=> i.disabled = false);
        patientForm.querySelector('input[name="id"]').disabled = (mode === 'edit');
        patientForm.querySelector('button[type="submit"]').style.display = '';
      }
    } else {
      patientForm.reset();
      patientForm.querySelectorAll('input,select').forEach(i=> i.disabled = false);
      patientForm.querySelector('button[type="submit"]').style.display = '';
    }
  }

  function closeModalFunc(){ modal.setAttribute('aria-hidden','true'); }

  patientsBody.addEventListener('click', (e)=>{
    const view = e.target.closest('.view');
    const del = e.target.closest('.delete');
    if(view){
      const id = view.dataset.id;
      const rec = patients.find(p=> p.id === id);
      if(rec) openModal('view', rec);
    }
    if(del){
      const id = del.dataset.id;
      if(!confirm('Delete record? This cannot be undone.')) return;
      patients = patients.filter(p=> p.id !== id);
      save(); render(search.value);
    }
  });

  addPatient.addEventListener('click', ()=> openModal('add'));
  closeModal.addEventListener('click', closeModalFunc);
  modal.addEventListener('click', (e)=>{ if(e.target === modal) closeModalFunc(); });

  patientForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const fd = new FormData(patientForm);
    const rec = {
      id: fd.get('id').trim(),
      name: fd.get('name').trim(),
      age: fd.get('age') ? Number(fd.get('age')) : null,
      sex: fd.get('sex'),
      diagnosis: fd.get('diagnosis').trim(),
      admitted: fd.get('admitted') || '',
      discharged: fd.get('discharged') || '',
      status: fd.get('status') || 'active'
    };
    if(!rec.id || !rec.name) return alert('Please provide ID and Name');
    const exists = patients.findIndex(p=> p.id === rec.id);
    if(exists >= 0){ patients[exists] = {...patients[exists], ...rec}; }
    else { patients.unshift(rec); }
    save(); render(search.value); closeModalFunc();
  });

  search.addEventListener('input', ()=> render(search.value));
  statusFilter.addEventListener('change', ()=> render(search.value));
  fromDate.addEventListener('change', ()=> render(search.value));
  toDate.addEventListener('change', ()=> render(search.value));

  exportCsv.addEventListener('click', ()=>{
    const rows = patients;
    const csv = [ ['ID','Name','Age','Sex','Diagnosis','Admitted','Discharged','Status'], ...rows.map(r=>[r.id,r.name,r.age,r.sex,r.diagnosis,r.admitted,r.discharged,r.status]) ];
    const csvContent = csv.map(e=>e.join(',')).join('\n');
    const blob = new Blob([csvContent],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'patients.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });

  printBtn.addEventListener('click', ()=> window.print());

  // basic init
  render();
>>>>>>> 1f6c2de (Added Figma UI/UX designs)
});