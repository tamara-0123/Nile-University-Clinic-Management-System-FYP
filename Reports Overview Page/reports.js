<<<<<<< HEAD
document.addEventListener('DOMContentLoaded', ()=>{
  // Sample data and state
  const reportsKey = 'clinic_reports_v1';
  let reports = JSON.parse(localStorage.getItem(reportsKey)) || [];

  // Elements
  const visitsEl = document.getElementById('visits');
  const admissionsEl = document.getElementById('admissions');
  const dischargesEl = document.getElementById('discharges');
  const fromDate = document.getElementById('fromDate');
  const toDate = document.getElementById('toDate');
  const reportScope = document.getElementById('reportScope');
  const generateBtn = document.getElementById('generate');
  const reportsBody = document.getElementById('reportsBody');
  const yearEl = document.getElementById('year');
  const exportCsv = document.getElementById('exportCsv');
  const downloadPdf = document.getElementById('downloadPdf');

  yearEl.textContent = new Date().getFullYear();

  // Charts
  const visitsCtx = document.getElementById('visitsChart').getContext('2d');
  const deptCtx = document.getElementById('deptChart').getContext('2d');

  const visitsChart = new Chart(visitsCtx, {
    type: 'line',
    data: {labels: ['-6','-5','-4','-3','-2','-1','Today'],datasets:[{data:[30,42,38,50,41,35,48],borderColor:'#0606ba',backgroundColor:'rgba(6,6,186,0.08)',tension:0.3}]},
    options:{plugins:{legend:{display:false}},responsive:true,maintainAspectRatio:true,aspectRatio:3,animation:false}
  });

  const deptChart = new Chart(deptCtx, {
    type:'pie',
    data:{labels:['General','Pediatrics','Cardiology','Other'],datasets:[{data:[45,20,18,17],backgroundColor:['#ff7a5a','#ffd166','#6fcf97','#9ad0f5']}]},
    options:{responsive:true,maintainAspectRatio:true,aspectRatio:1,animation:false}
  });

  function renderKPIs(){
    // simple randomized demo values — replace with real API data
    visitsEl.textContent = 48;
    admissionsEl.textContent = 7;
    dischargesEl.textContent = 3;
  }

  function renderReports(){
    reportsBody.innerHTML = '';
    reports.forEach(r=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.date}</td><td>${r.type}</td><td>${r.scope}</td><td><button class="btn alt download" data-id="${r.id}">Download</button></td>`;
      reportsBody.appendChild(tr);
    });
    // Wire download buttons
    document.querySelectorAll('.download').forEach(btn=> btn.addEventListener('click', (e)=>{
      const id = btn.dataset.id; const r = reports.find(x=> x.id===id); if(!r) return; downloadReport(r);
    }));
  }

  function saveReports(){ localStorage.setItem(reportsKey, JSON.stringify(reports)); }

  function generateReport(){
    const scope = reportScope.value;
    const date = new Date().toISOString().slice(0,10);
    const id = 'R' + Math.floor(Math.random()*900 + 100);
    const r = {id,date,type: scope === 'daily' ? 'Daily Summary' : 'Monthly Summary',scope};
    reports.unshift(r); saveReports(); renderReports();
    // small chart update simulation
    visitsChart.data.datasets[0].data = visitsChart.data.datasets[0].data.map(v=> Math.max(10, v + Math.floor(Math.random()*11-5)));
    visitsChart.update('none');
  }

  function downloadReport(r){
    const csv = [['Field','Value'],['Report ID',r.id],['Date',r.date],['Type',r.type],['Scope',r.scope]].map(row=> row.join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download = `${r.id}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  generateBtn.addEventListener('click', generateReport);
  exportCsv.addEventListener('click', ()=>{
    // export all reports
    const csv = [ ['ID','Date','Type','Scope'], ...reports.map(r=> [r.id,r.date,r.type,r.scope])];
    const content = csv.map(r=> r.join(',')).join('\n');
    const blob = new Blob([content],{type:'text/csv'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='reports.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });

  downloadPdf.addEventListener('click', ()=> alert('PDF download placeholder — integrate server-side/pdf library to generate real PDFs.'));

  // init
  renderKPIs(); renderReports();
=======
document.addEventListener('DOMContentLoaded', ()=>{
  // Sample data and state
  const reportsKey = 'clinic_reports_v1';
  let reports = JSON.parse(localStorage.getItem(reportsKey)) || [];

  // Elements
  const visitsEl = document.getElementById('visits');
  const admissionsEl = document.getElementById('admissions');
  const dischargesEl = document.getElementById('discharges');
  const fromDate = document.getElementById('fromDate');
  const toDate = document.getElementById('toDate');
  const reportScope = document.getElementById('reportScope');
  const generateBtn = document.getElementById('generate');
  const reportsBody = document.getElementById('reportsBody');
  const yearEl = document.getElementById('year');
  const exportCsv = document.getElementById('exportCsv');
  const downloadPdf = document.getElementById('downloadPdf');

  yearEl.textContent = new Date().getFullYear();

  // Charts
  const visitsCtx = document.getElementById('visitsChart').getContext('2d');
  const deptCtx = document.getElementById('deptChart').getContext('2d');

  const visitsChart = new Chart(visitsCtx, {
    type: 'line',
    data: {labels: ['-6','-5','-4','-3','-2','-1','Today'],datasets:[{data:[30,42,38,50,41,35,48],borderColor:'#0606ba',backgroundColor:'rgba(6,6,186,0.08)',tension:0.3}]},
    options:{plugins:{legend:{display:false}},responsive:true,maintainAspectRatio:true,aspectRatio:3,animation:false}
  });

  const deptChart = new Chart(deptCtx, {
    type:'pie',
    data:{labels:['General','Pediatrics','Cardiology','Other'],datasets:[{data:[45,20,18,17],backgroundColor:['#ff7a5a','#ffd166','#6fcf97','#9ad0f5']}]},
    options:{responsive:true,maintainAspectRatio:true,aspectRatio:1,animation:false}
  });

  function renderKPIs(){
    // simple randomized demo values — replace with real API data
    visitsEl.textContent = 48;
    admissionsEl.textContent = 7;
    dischargesEl.textContent = 3;
  }

  function renderReports(){
    reportsBody.innerHTML = '';
    reports.forEach(r=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.date}</td><td>${r.type}</td><td>${r.scope}</td><td><button class="btn alt download" data-id="${r.id}">Download</button></td>`;
      reportsBody.appendChild(tr);
    });
    // Wire download buttons
    document.querySelectorAll('.download').forEach(btn=> btn.addEventListener('click', (e)=>{
      const id = btn.dataset.id; const r = reports.find(x=> x.id===id); if(!r) return; downloadReport(r);
    }));
  }

  function saveReports(){ localStorage.setItem(reportsKey, JSON.stringify(reports)); }

  function generateReport(){
    const scope = reportScope.value;
    const date = new Date().toISOString().slice(0,10);
    const id = 'R' + Math.floor(Math.random()*900 + 100);
    const r = {id,date,type: scope === 'daily' ? 'Daily Summary' : 'Monthly Summary',scope};
    reports.unshift(r); saveReports(); renderReports();
    // small chart update simulation
    visitsChart.data.datasets[0].data = visitsChart.data.datasets[0].data.map(v=> Math.max(10, v + Math.floor(Math.random()*11-5)));
    visitsChart.update('none');
  }

  function downloadReport(r){
    const csv = [['Field','Value'],['Report ID',r.id],['Date',r.date],['Type',r.type],['Scope',r.scope]].map(row=> row.join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download = `${r.id}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  generateBtn.addEventListener('click', generateReport);
  exportCsv.addEventListener('click', ()=>{
    // export all reports
    const csv = [ ['ID','Date','Type','Scope'], ...reports.map(r=> [r.id,r.date,r.type,r.scope])];
    const content = csv.map(r=> r.join(',')).join('\n');
    const blob = new Blob([content],{type:'text/csv'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='reports.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });

  downloadPdf.addEventListener('click', ()=> alert('PDF download placeholder — integrate server-side/pdf library to generate real PDFs.'));

  // init
  renderKPIs(); renderReports();
>>>>>>> 1f6c2de (Added Figma UI/UX designs)
});