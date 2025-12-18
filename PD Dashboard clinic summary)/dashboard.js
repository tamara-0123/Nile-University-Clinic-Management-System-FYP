document.addEventListener('DOMContentLoaded', ()=>{
  // Sample data (would normally come from an API)
  const sample = {
    stats: {patientsToday: 42, admissions: 7, discharges: 3, occupancy: '78%'},
    appointments: {
      labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      data: [38,45,52,47,50,30,34]
    },
    diagnoses: {labels:['Flu','Respiratory','Diabetes','Other'],data:[18,12,6,6]},
    patients: [
      {id:'P001',name:'Aisha Khan',age:34,diagnosis:'Flu',admitted:'2025-12-14',status:'Seen'},
      {id:'P002',name:'Samuel Lee',age:52,diagnosis:'Diabetes',admitted:'2025-12-14',status:'Admitted'},
      {id:'P003',name:'Maria Gomez',age:28,diagnosis:'Respiratory',admitted:'2025-12-15',status:'Seen'},
      {id:'P004',name:'John Doe',age:45,diagnosis:'Other',admitted:'2025-12-15',status:'Discharged'},
    ]
  };

  // DOM refs
  const patientsToday = document.getElementById('patientsToday');
  const admissions = document.getElementById('admissions');
  const discharges = document.getElementById('discharges');
  const occupancy = document.getElementById('occupancy');
  const patientsTable = document.getElementById('patientsTable');
  const yearEl = document.getElementById('year');
  const refreshBtn = document.getElementById('refreshBtn');
  const searchInput = document.getElementById('search');
  const exportBtn = document.getElementById('exportCsv');

  // Fill stats
  patientsToday.textContent = sample.stats.patientsToday;
  admissions.textContent = sample.stats.admissions;
  discharges.textContent = sample.stats.discharges;
  occupancy.textContent = sample.stats.occupancy;

  // Year
  yearEl.textContent = new Date().getFullYear();

  // Populate table
  function renderTable(rows){
    patientsTable.innerHTML = '';
    rows.forEach(r=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.id}</td><td>${r.name}</td><td>${r.age}</td><td>${r.diagnosis}</td><td>${r.admitted}</td><td>${r.status}</td>`;
      patientsTable.appendChild(tr);
    })
  }
  renderTable(sample.patients);

  // Search
  searchInput.addEventListener('input', ()=>{
    const q = searchInput.value.trim().toLowerCase();
    const filtered = sample.patients.filter(p=> p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q));
    renderTable(filtered);
  });

  // Export CSV
  exportBtn.addEventListener('click', ()=>{
    const rows = sample.patients;
    const csv = [ ['Patient ID','Name','Age','Diagnosis','Admitted','Status'], ...rows.map(r=>[r.id,r.name,r.age,r.diagnosis,r.admitted,r.status]) ];
    const csvContent = csv.map(e=>e.join(',')).join('\n');
    const blob = new Blob([csvContent],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'patients.csv';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });

  // Charts
  const ctxA = document.getElementById('appointmentsChart').getContext('2d');
  const appointmentsChart = new Chart(ctxA, {
    type: 'line',
    data: {
      labels: sample.appointments.labels,
      datasets: [{label:'Appointments',data:sample.appointments.data,borderColor:'#3b6ea5',backgroundColor:'rgba(59,110,165,0.08)',tension:0.3}]
    },
    options: {
      plugins:{legend:{display:false}},
      responsive:true,
      maintainAspectRatio:true,
      aspectRatio:3, // wider chart that fits card
      animation: false,
      transitions: { active: { animation: false } }
    }
  });

  const ctxD = document.getElementById('diagnosesChart').getContext('2d');
  const diagnosesChart = new Chart(ctxD, {
    type: 'pie',
    data: {labels: sample.diagnoses.labels,datasets:[{data:sample.diagnoses.data,backgroundColor:['#ff7a5a','#ffd166','#6fcf97','#9ad0f5']}]},
    options:{
      responsive:true,
      maintainAspectRatio:true,
      aspectRatio:1, // square pie chart
      animation:false,
      transitions: { active: { animation: false } }
    }
  });

  // Chart sizes are controlled by CSS (.chart-card canvas) for a compact, consistent layout

  // Refresh (simulated update)
  refreshBtn.addEventListener('click', ()=>{
    refreshBtn.disabled = true; refreshBtn.textContent = 'Refreshing...';
    setTimeout(()=>{
      // simulate small change
      sample.stats.patientsToday += Math.floor(Math.random()*3-1);
      patientsToday.textContent = sample.stats.patientsToday;
      // update charts with small variance
      sample.appointments.data = sample.appointments.data.map(v=>Math.max(5, v + Math.floor(Math.random()*7-3)));
      appointmentsChart.data.datasets[0].data = sample.appointments.data;
      // update without animation and respect aspect ratio
      appointmentsChart.update('none');
      refreshBtn.disabled = false; refreshBtn.textContent = 'Refresh';
    },800);
  });

});