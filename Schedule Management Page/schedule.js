document.addEventListener('DOMContentLoaded', ()=>{
  const storageKey = 'clinic_schedule_v1';
  const sample = [
    {id:'A001',patientId:'P100',patientName:'Aisha Khan',role:'Doctor',type:'Consultation',date:'2025-12-15',time:'09:00',notes:'Follow-up'},
    {id:'A002',patientId:'P101',patientName:'Samuel Lee',role:'Nurse',type:'Check',date:'2025-12-15',time:'11:00',notes:''},
    {id:'A003',patientId:'P102',patientName:'Maria Gomez',role:'Doctor',type:'Review',date:'2025-12-16',time:'14:30',notes:''}
  ];

  let appts = JSON.parse(localStorage.getItem(storageKey)) || sample.slice();
  const calendarGrid = document.getElementById('calendarGrid');
  const appointmentsList = document.getElementById('appointmentsList');
  const viewToggle = document.getElementById('viewToggle');
  const datePicker = document.getElementById('datePicker');
  const prev = document.getElementById('prev');
  const next = document.getElementById('next');
  const addAppt = document.getElementById('addAppt');
  const modal = document.getElementById('modal');
  const apptForm = document.getElementById('apptForm');
  const cancelBtn = document.getElementById('cancelBtn');
  const roleFilter = document.getElementById('roleFilter');
  const rangeLabel = document.getElementById('rangeLabel');

  let currentDate = new Date();
  let editingId = null;

  function save(){ localStorage.setItem(storageKey, JSON.stringify(appts)); }

  function startOfWeek(date){ const d = new Date(date); const day = d.getDay(); const diff = d.getDate() - day + (day===0? -6:1); return new Date(d.setDate(diff)); }

  function formatDay(d){ return d.toISOString().slice(0,10); }

  function renderCalendar(){
    calendarGrid.innerHTML = '';
    const view = viewToggle.value;
    if(view === 'week'){
      const start = startOfWeek(currentDate);
      const days = [];
      for(let i=0;i<7;i++){ const dt = new Date(start); dt.setDate(start.getDate()+i); days.push(dt); }
      rangeLabel.textContent = `${formatDay(days[0])} — ${formatDay(days[6])}`;
      days.forEach(d=>{
        const cell = document.createElement('div'); cell.className = 'cell';
        cell.innerHTML = `<h4>${d.toDateString().slice(0,10)}</h4>`;
        const dateStr = formatDay(d);
        const dayAppts = appts.filter(a=> a.date === dateStr && (roleFilter.value==='all' || a.role===roleFilter.value));
        dayAppts.sort((a,b)=> a.time.localeCompare(b.time));
        dayAppts.forEach(a=>{
          const aEl = document.createElement('a'); aEl.href='#'; aEl.className='appointment'; aEl.textContent = `${a.time} — ${a.patientName} (${a.type})`;
          aEl.dataset.id = a.id; aEl.addEventListener('click',(e)=>{ e.preventDefault(); openModal('edit', a); });
          cell.appendChild(aEl);
        });
        calendarGrid.appendChild(cell);
      });
    } else {
      // day view
      const dateStr = formatDay(currentDate);
      rangeLabel.textContent = dateStr;
      const column = document.createElement('div'); column.className = 'cell';
      column.innerHTML = `<h4>${currentDate.toDateString()}</h4>`;
      const dayAppts = appts.filter(a=> a.date === dateStr && (roleFilter.value==='all' || a.role===roleFilter.value));
      dayAppts.sort((a,b)=> a.time.localeCompare(b.time));
      dayAppts.forEach(a=>{
        const aEl = document.createElement('a'); aEl.href='#'; aEl.className='appointment'; aEl.textContent = `${a.time} — ${a.patientName} (${a.type})`;
        aEl.dataset.id = a.id; aEl.addEventListener('click',(e)=>{ e.preventDefault(); openModal('edit', a); });
        column.appendChild(aEl);
      });
      calendarGrid.appendChild(column);
    }
    renderList();
  }

  function renderList(){
    appointmentsList.innerHTML = '';
    const visible = (viewToggle.value === 'day') ? appts.filter(a=> a.date === formatDay(currentDate)) : appts.filter(a=>{
      const start = startOfWeek(currentDate); const end = new Date(start); end.setDate(start.getDate()+6);
      const d = new Date(a.date);
      return d >= start && d <= end;
    });
    const filtered = visible.filter(a=> roleFilter.value === 'all' || a.role === roleFilter.value);
    filtered.sort((a,b)=> (a.date+a.time).localeCompare(b.date+b.time));
    filtered.forEach(a=>{
      const li = document.createElement('li'); li.className = 'app-item';
      li.innerHTML = `<div><strong>${a.patientName}</strong><div class="muted">${a.date} ${a.time} • ${a.role} • ${a.type}</div></div><div><button class="btn alt edit" data-id="${a.id}">Edit</button> <button class="btn alt del" data-id="${a.id}">Cancel</button></div>`;
      appointmentsList.appendChild(li);
    });
  }

  function openModal(mode='add', rec=null){
    modal.setAttribute('aria-hidden','false');
    document.getElementById('modalTitle').textContent = mode === 'add' ? 'Add Appointment' : 'Edit Appointment';
    if(rec){
      apptForm.patientId.value = rec.patientId;
      apptForm.patientName.value = rec.patientName;
      apptForm.role.value = rec.role;
      apptForm.type.value = rec.type;
      apptForm.date.value = rec.date;
      apptForm.time.value = rec.time;
      apptForm.notes.value = rec.notes || '';
      editingId = rec.id;
    } else {
      apptForm.reset(); apptForm.date.value = formatDay(currentDate); editingId = null;
    }
  }

  function closeModal(){ modal.setAttribute('aria-hidden','true'); editingId = null; }

  calendarGrid.addEventListener('click', (e)=>{
    if(e.target.classList.contains('cell')){
      const h = e.target.querySelector('h4').textContent; // parse date label
      // attempt to set current date to selected cell date
      const d = new Date(h);
      if(!isNaN(d)) currentDate = d; renderCalendar();
    }
  });

  appointmentsList.addEventListener('click',(e)=>{
    const ed = e.target.closest('.edit'); const del = e.target.closest('.del');
    if(ed){ const rec = appts.find(a=> a.id===ed.dataset.id); if(rec) openModal('edit', rec); }
    if(del){ const id = del.dataset.id; if(!confirm('Cancel appointment?')) return; appts = appts.filter(a=> a.id!==id); save(); renderCalendar(); }
  });

  apptForm.addEventListener('submit',(e)=>{
    e.preventDefault();
    const fd = new FormData(apptForm);
    const rec = {
      id: editingId || ('A'+(Math.floor(Math.random()*900)+100)),
      patientId: fd.get('patientId').trim(),
      patientName: fd.get('patientName').trim(),
      role: fd.get('role'),
      type: fd.get('type').trim() || 'Consultation',
      date: fd.get('date'),
      time: fd.get('time'),
      notes: fd.get('notes').trim()
    };
    if(!rec.patientId || !rec.patientName || !rec.date || !rec.time) return alert('Provide patient ID, name, date and time');
    const idx = appts.findIndex(a=> a.id === rec.id);
    if(idx>-1) appts[idx] = {...appts[idx], ...rec}; else appts.unshift(rec);
    save(); closeModal(); renderCalendar();
  });

  addAppt.addEventListener('click', ()=> openModal('add'));
  cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click',(e)=>{ if(e.target===modal) closeModal(); });

  prev.addEventListener('click', ()=>{
    const v = viewToggle.value; if(v==='week') currentDate.setDate(currentDate.getDate()-7); else currentDate.setDate(currentDate.getDate()-1); renderCalendar();
  });
  next.addEventListener('click', ()=>{
    const v = viewToggle.value; if(v==='week') currentDate.setDate(currentDate.getDate()+7); else currentDate.setDate(currentDate.getDate()+1); renderCalendar();
  });

  viewToggle.addEventListener('change', ()=> renderCalendar());
  datePicker.addEventListener('change', ()=>{ if(datePicker.value) currentDate = new Date(datePicker.value); renderCalendar(); });
  roleFilter.addEventListener('change', ()=> renderCalendar());

  // export print
  document.getElementById('next').addEventListener('click', ()=>{});

  // init
  renderCalendar();
});