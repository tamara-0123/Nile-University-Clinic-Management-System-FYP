
  /******************************************************************
   * 1. HELPERS (Must be at the top)
   ******************************************************************/
  const qs = (sel) => document.querySelector(sel);
  const qsa = (sel) => Array.from(document.querySelectorAll(sel));
  const toastWrap = qs("#toastWrap");

  function showToast(message, timeout = 3000) {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = message;
    toastWrap.appendChild(t);
    setTimeout(() => {
      t.style.opacity = 0;
      t.style.transform = "translateX(8px)";
      setTimeout(() => t.remove(), 400);
    }, timeout);
  }

  /******************************************************************
   * 2. MOCK DATA
   ******************************************************************/
  
  // 2a. Current Vitals (Temporary state)
  let currentVitals = {
    bp: "120/80",
    temp: "37.1",
    pulse: "76",
    weight: "60",
  };

  // 2b. Appointments Data (Restored!)
  const appointments = [
    { id: 'A1', time: '09:00', datetime: '2025-11-12T09:00', patientId: 'S2022001', patientName: 'Cynthia George', dept:'CS', status: 'waiting', reason:'Fever & Fatigue', doctor: 'Dr. Umar' },
    { id: 'A2', time: '09:30', datetime: '2025-11-12T09:30', patientId: 'S2022002', patientName: 'John Doe', dept:'EE', status: 'checked_in', reason:'Headache', doctor: 'Dr. Umar' },
    { id: 'A3', time: '10:00', datetime: '2025-11-12T10:00', patientId: 'S2022003', patientName: 'Aisha Bello', dept:'ME', status: 'in_consult', reason:'Cough', doctor: 'Dr. Umar' },
    { id: 'A4', time: '10:30', datetime: '2025-11-12T10:30', patientId: 'S2022004', patientName: 'David Chukwu', dept:'CE', status: 'scheduled', reason:'Routine check-up', doctor: 'Dr. Umar' },
    { id: 'A5', time: '11:00', datetime: '2025-11-12T11:00', patientId: 'S2022005', patientName: 'Mary A.', dept:'LAW', status: 'waiting', reason:'Stomach pain', doctor: 'Dr. Umar' },
    { id: 'A6', time: '11:30', datetime: '2025-11-12T11:30', patientId: 'S2022006', patientName: 'Attahir A.', dept:'Cyb', status: 'scheduled', reason:'Ulcer', doctor: 'Dr. Umar' },
  ];

  // 2c. Patients Data (New Array Format)
  const patients = [
    {
      _id: "mongo_obj_id_1",
      id: "S2022001",
      name: "Cynthia George",
      age: 20,
      dept: "CS",
      allergies: ["Penicillin"],
      vitals: { bp: "120/80", temp: "37.1°C", pulse: 76, weight: "60kg" },
      history: [
        { date: "2025-10-12", reason: "Fever & Fatigue", diagnosis: "Mild viral infection" },
        { date: "2025-08-30", reason: "Headache", diagnosis: "Stress-related tension" }
      ],
      prescriptions: [
        { drug: "Amoxicillin 500mg", dosage: "1 capsule", freq: "3/day", status: "Active", issued: "2025-10-12" },
        { drug: "Ibuprofen 200mg", dosage: "1 tablet", freq: "2/day", status: "Completed", issued: "2025-08-30" }
      ]
    },
    {
      _id: "mongo_obj_id_2",
      id: "S2022002",
      name: "John Doe",
      age: 21,
      dept: "EE",
      allergies: [],
      vitals: null,
      history: [],
      prescriptions: []
    },
    {
      _id: "mongo_obj_id_3",
      id: "S2022003",
      name: "Aisha Bello",
      age: 22,
      dept: "ME",
      allergies: [],
      vitals: { bp: "130/85", temp: "38.0°C", pulse: 80, weight: "65kg" },
      history: [],
      prescriptions: []
    }
  ];

  /******************************************************************
   * 3. CORE LOGIC
   ******************************************************************/

  // Helper to find patient by Matric Number
  function getPatientByMatric(matricNumber) {
    return patients.find(p => p.id === matricNumber);
  }

  // Render Appointment List
  const appointmentListEl = qs('#appointmentList');
  let activeApptId = null;

  function statusToPill(status) {
    if (status === 'scheduled') return '<span class="status-pill pill-scheduled">Scheduled</span>';
    if (status === 'waiting') return '<span class="status-pill pill-checked">Waiting</span>';
    if (status === 'checked_in') return '<span class="status-pill pill-checked">Checked-in</span>';
    if (status === 'in_consult') return '<span class="status-pill pill-in">In consultation</span>';
    if (status === 'completed') return '<span class="status-pill pill-completed">Completed</span>';
    return '<span class="status-pill">' + status + '</span>';
  }

  function renderAppointments(list) {
    appointmentListEl.innerHTML = '';
    const countLabel = qs('#countLabel');
    if(countLabel) countLabel.textContent = list.length;

    list.forEach(appt => {
      const wrap = document.createElement('div');
      wrap.className = 'appt';
      if (appt.id === activeApptId) wrap.classList.add('active');

      wrap.setAttribute('data-id', appt.id);
      wrap.innerHTML = `
          <div class="leftcol">
            <div class="time">${appt.time}</div>
            <div class="pname">${appt.patientName}</div>
            <div class="meta2">${appt.patientId} • ${appt.dept}</div>
          </div>
          <div style="text-align:right">
            ${statusToPill(appt.status)}
            <div style="margin-top:0.6rem;font-size:0.9rem;color:var(--muted)">${appt.reason}</div>
          </div>
        `;
      wrap.addEventListener('click', () => selectAppointment(appt.id));
      appointmentListEl.appendChild(wrap);
    });
  }

  // Load Patient Details
  function loadPatient(pid, appt) {
    const patient = getPatientByMatric(pid);

    if (!patient) {
      qs("#pName").textContent = "Unknown patient";
      qs("#pSub").textContent = "";
      qs("#pTags").innerHTML = "";
      qs("#vitalsContent").textContent = "No vitals recorded";
      qs("#lastVisit").textContent = "No previous visit";
      qs("#historyList").innerHTML = "";
      return;
    }

    qs("#pName").textContent = patient.name;
    qs("#pSub").textContent = `${patient.age} • ${patient.id} • ${patient.dept}`;

    // Tags
    const tagWrap = qs("#pTags");
    tagWrap.innerHTML = "";
    if (patient.allergies && patient.allergies.length) {
      patient.allergies.forEach(a => {
        const t = document.createElement("span");
        t.className = "tag";
        t.textContent = "Allergy: " + a;
        tagWrap.appendChild(t);
      });
    }

    // Vitals
    if (patient.vitals) {
      qs("#vitalsContent").innerHTML = `BP: ${patient.vitals.bp} • Temp: ${patient.vitals.temp} • Pulse: ${patient.vitals.pulse} • Weight: ${patient.vitals.weight}`;
    } else qs("#vitalsContent").textContent = "No vitals recorded";

    // Last Visit
    if (patient.history && patient.history.length) {
      const last = patient.history[0];
      qs("#lastVisit").textContent = `${last.date} — ${last.diagnosis}`;
    } else qs("#lastVisit").textContent = "No previous visit";

    // History List
    const hist = qs("#historyList");
    hist.innerHTML = "";
    (patient.history || []).forEach(h => {
      const d = document.createElement("div");
      d.style.padding = "0.6rem";
      d.style.borderBottom = "1px solid var(--border)";
      d.innerHTML = `<strong>${h.date}</strong><div style="color:var(--muted)">${h.reason} — ${h.diagnosis}</div>`;
      hist.appendChild(d);
    });

    // Load Drafts & Rx
    const draftKey = "draft_" + pid;
    const saved = localStorage.getItem(draftKey);
    qs("#consultNotes").value = saved || "";
    renderRxList(patient.prescriptions || []);
    showToast("Patient loaded: " + patient.name, 1200);
  }

  // Select Appointment Wrapper
  function selectAppointment(id) {
    activeApptId = id;
    qsa('.appt').forEach(el => el.classList.toggle('active', el.dataset.id === id));
    const appt = appointments.find(a => a.id === id);
    if (!appt) return;
    loadPatient(appt.patientId, appt);
  }

  /******************************************************************
   * 4. UI INTERACTION (Search, Tabs, Modals)
   ******************************************************************/

  // Search & Filters
  let currentFilter = 'all';

  function applyFilters() {
    const q = qs('#searchInput').value.trim().toLowerCase();
    let filtered = appointments.filter(a => {
      if (currentFilter !== 'all' && a.status !== currentFilter) return false;
      if (!q) return true;
      return (a.patientName.toLowerCase().includes(q) || a.patientId.toLowerCase().includes(q));
    });
    renderAppointments(filtered);
  }

  qsa('.chip').forEach(chip => {
    chip.addEventListener('click', e => {
      qsa('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.dataset.filter;
      applyFilters();
    })
  });

  qs('#searchInput').addEventListener('input', () => applyFilters());


  // Tabs
  qsa('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      qsa('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      qsa('#notesPanel, #prescriptionsPanel, #historyPanel').forEach(p => p.style.display = 'none');
      if (target === 'notes') qs('#notesPanel').style.display = 'block';
      if (target === 'prescriptions') qs('#prescriptionsPanel').style.display = 'block';
      if (target === 'history') qs('#historyPanel').style.display = 'block';
    });
  });

  // Draft Autosave
  qs('#consultNotes').addEventListener('input', () => {
    const patientId = activeApptId ? appointments.find(a => a.id === activeApptId).patientId : null;
    if (!patientId) return;
    const key = 'draft_' + patientId;
    localStorage.setItem(key, qs('#consultNotes').value);
  });

  qs('#saveDraft').addEventListener('click', () => {
    const patientId = activeApptId ? appointments.find(a => a.id === activeApptId).patientId : null;
    if (!patientId) return showToast('Select a patient first');
    localStorage.setItem('draft_' + patientId, qs('#consultNotes').value);
    showToast('Draft saved');
  });

  // Prescription Logic
  function makeRxRow(prescription) {
    const div = document.createElement('div');
    div.className = 'rx-row';
    div.innerHTML = `
        <input name="drug" placeholder="Drug name" value="${prescription?.drug||''}" aria-label="Drug name" />
        <input name="dose" placeholder="Dose (e.g., 500mg)" value="${prescription?.dosage||''}" aria-label="Dose" />
        <input name="freq" placeholder="Frequency (e.g., 1x/day)" value="${prescription?.freq||''}" aria-label="Frequency" />
        <input name="duration" placeholder="Duration (e.g., 7 days)" value="${prescription?.duration||''}" aria-label="Duration" />
        <button class="remove" title="Remove">✕</button>
      `;
    div.querySelector('.remove').addEventListener('click', () => div.remove());
    return div;
  }

  function renderRxList(existing) {
    const rxList = qs('#rxList');
    rxList.innerHTML = '';
    (existing || []).forEach(p => {
      rxList.appendChild(makeRxRow({
        drug: p.drug,
        dosage: p.dosage,
        freq: p.freq,
        duration: ''
      }));
    });
  }

  qs('#addRx').addEventListener('click', e => {
    e.preventDefault();
    qs('#rxList').appendChild(makeRxRow({}));
  });

  qs('#saveRx').addEventListener('click', e => {
    e.preventDefault();
    if (!activeApptId) return showToast("Select a patient first", 2000);
    const appt = appointments.find(a => a.id === activeApptId);
    
    // Updated Logic
    const patient = getPatientByMatric(appt.patientId);
    if (!patient) return showToast("Patient not found in database");

    const rows = Array.from(qs("#rxList").children);
    const newItems = rows.map(r => {
      return {
        drug: r.querySelector('input[name="drug"]').value.trim(),
        dosage: r.querySelector('input[name="dose"]').value.trim(),
        freq: r.querySelector('input[name="freq"]').value.trim(),
        duration: r.querySelector('input[name="duration"]').value.trim(),
        issued: new Date().toISOString().slice(0, 10),
        status: "Active"
      };
    }).filter(x => x.drug);

    patient.prescriptions = (patient.prescriptions || []).concat(newItems);
    showToast("Prescription saved");
    qs("#rxList").innerHTML = "";
    renderRxList(patient.prescriptions);
  });

  // Finalize Appointment
  function finalizeAppointment() {
    if (!activeApptId) return showToast('Select an appointment first');

    const appt = appointments.find(a => a.id === activeApptId);
    const pid = appt.patientId;

    // Updated Logic
    const patient = getPatientByMatric(pid);
    const notes = qs('#consultNotes').value.trim();

    if (patient) {
      patient.history = patient.history || [];
      patient.history.unshift({
        date: new Date().toISOString().slice(0, 10),
        reason: appt.reason,
        diagnosis: notes || "See notes"
      });
    }

    appt.status = 'completed';
    activeApptId = null;
    applyFilters();
    
    // Clear workspace manually
    qs('#pName').textContent = 'Select an appointment';
    qs('#pSub').textContent = '';
    qs('#pTags').innerHTML = '';
    qs('#vitalsContent').textContent = 'No vitals recorded';
    qs('#lastVisit').textContent = 'No previous visit';
    qs('#historyList').innerHTML = '';
    qs('#consultNotes').value = '';
    qs('#rxList').innerHTML = '';
    
    showToast('Appointment finalized and marked complete');
  }

  qs('#saveFinalize').addEventListener('click', finalizeAppointment);
  qs('#btnFinalize').addEventListener('click', finalizeAppointment);


  /******************************************************************
   * 5. MODALS (Slots & Vitals)
   ******************************************************************/
  
  // Slot Modal
  const slotModal = qs("#slotModal");
  qs("#newSlotBtn").addEventListener("click", () => slotModal.style.display = "flex");
  qs("#cancelSlot").addEventListener("click", () => slotModal.style.display = "none");
  qs("#saveSlot").addEventListener("click", () => {
    const date = qs("#slotDate").value;
    const start = qs("#startTime").value;
    const end = qs("#endTime").value;
    if (!date || !start || !end) {
      alert("Please fill all fields");
      return;
    }
    console.log({ date, start, end }); // Placeholder for backend
    alert("Slot created successfully");
    slotModal.style.display = "none";
  });

  // Vitals Modal
  const vitalsModal = qs("#vitalsModal");
  qs("#addVitalsBtn").addEventListener("click", () => {
    qs("#bp").value = currentVitals.bp;
    qs("#temp").value = currentVitals.temp;
    qs("#pulse").value = currentVitals.pulse;
    qs("#weight").value = currentVitals.weight;
    vitalsModal.style.display = "flex";
  });
  qs("#cancelVitals").addEventListener("click", () => vitalsModal.style.display = "none");
  
  qs("#saveVitals").addEventListener("click", () => {
    const bp = qs("#bp").value;
    const temp = qs("#temp").value;
    const pulse = qs("#pulse").value;
    const weight = qs("#weight").value;

    if (!bp || !temp || !pulse || !weight) {
      alert("Please fill all vital fields");
      return;
    }
    currentVitals = { bp, temp, pulse, weight };
    // Note: This updates the display, but in a real app you'd save to DB
    qs("#vitalsContent").innerHTML = `BP: ${bp} • Temp: ${temp}°C • Pulse: ${pulse} • Weight: ${weight}kg`;
    vitalsModal.style.display = "none";
  });


  /******************************************************************
   * 6. INITIALIZATION & UTILS
   ******************************************************************/
  
  // Logout
  qs("#logoutBtn").addEventListener("click", () => {
    if (confirm("Are you sure you want to logout?")) {
      sessionStorage.clear();
      window.location.href = "login.html";
    }
  });

  // Link helper
  document.querySelectorAll('.navlinks a').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      window.open('#', '_blank', 'noopener');
    });
  });

  // Fade in animation
  document.querySelectorAll('.fade-in').forEach((el, i) => {
    setTimeout(() => el.classList.add('visible'), 80 + i * 80);
  });

  // Keyboard navigation
  appointmentListEl.addEventListener('keydown', (e) => {
    const focusable = Array.from(appointmentListEl.querySelectorAll('.appt'));
    const idx = focusable.findIndex(n => n === document.activeElement);
    if (e.key === 'ArrowDown' && idx < focusable.length - 1) {
      e.preventDefault();
      focusable[idx + 1].focus();
    }
    if (e.key === 'ArrowUp' && idx > 0) {
      e.preventDefault();
      focusable[idx - 1].focus();
    }
  });

  // Start
  document.addEventListener("DOMContentLoaded", () => {
    // 1. Dynamic Date
    const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
    const today = new Date().toLocaleDateString('en-GB', options);
    const metaDiv = document.querySelector('.meta');
    if (metaDiv) {
      metaDiv.textContent = `Today • ${today} • ${appointments.length} appointments`;
    }

    // 2. Render Lists
    renderAppointments(appointments);
    
    // 3. Select first if available
    if (appointments[0]) selectAppointment(appointments[0].id);
  });

