document.addEventListener('DOMContentLoaded', async () => {
  // Check Auth
  const token = API_CONFIG.getToken();
  if (!token) {
    window.location.href = '../Shared pages/login.html';
    return;
  }

  // Elements
  const visitsEl = document.getElementById('visits');
  const admissionsEl = document.getElementById('admissions');
  const dischargesEl = document.getElementById('discharges');
  const cancelledEl = document.getElementById('cancelled'); // New cancelled element
  const patientsTable = document.getElementById('patientsTable');
  const exportCsvBtn = document.getElementById('exportCsv');
  const printViewBtn = document.getElementById('printView');
  const generateBtn = document.getElementById('generate');
  const fromDate = document.getElementById('fromDate');
  const toDate = document.getElementById('toDate');
  const reportScope = document.getElementById('reportScope');
  const searchInput = document.getElementById('search');
  const reportsBody = document.getElementById('reportsBody');
  const yearEl = document.getElementById('year');
  const kpiLabels = document.querySelectorAll('.card-content');

  // Set default dates (last 7 days)
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  if (fromDate) {
    fromDate.valueAsDate = sevenDaysAgo;
    fromDate.max = today.toISOString().split('T')[0];
  }
  if (toDate) {
    toDate.valueAsDate = today;
    toDate.max = today.toISOString().split('T')[0];
  }

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // State
  let reportData = null;
  let patientsData = [];
  let charts = {};
  let currentFilters = {
    fromDate: sevenDaysAgo.toISOString().split('T')[0],
    toDate: today.toISOString().split('T')[0]
  };

  // Debounce function for date changes
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Initialize Charts
  async function initCharts(from, to) {
    try {
      // Load weekly data with date range
      const weeklyResponse = await API_CONFIG.reports.getWeekly(from, to);
      if (weeklyResponse.success) {
        createVisitsChart(weeklyResponse.chartData);
      }

      // Load diagnoses with date range
      const diagnosesResponse = await API_CONFIG.reports.getMonthlyDiagnoses(from, to);
      if (diagnosesResponse.success) {
        createDiagnosesChart(diagnosesResponse.diagnoses);
      }
    } catch (e) {
      console.error("Failed to load chart data:", e);
    }
  }

  function createVisitsChart(chartData) {
    const ctx = document.getElementById('visitsChart');
    if (!ctx) return;

    if (charts.visits) charts.visits.destroy();

    charts.visits = new Chart(ctx.getContext('2d'), {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [{
          label: 'Patient Visits',
          data: chartData.datasets[0].data,
          borderColor: '#003399',
          backgroundColor: 'rgba(0, 51, 153, 0.1)',
          tension: 0.3,
          fill: true,
          pointBackgroundColor: '#003399',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { 
            enabled: true,
            callbacks: {
              label: function(context) {
                return `Visits: ${context.raw}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { 
              stepSize: 1,
              precision: 0
            }
          }
        }
      }
    });
  }

  function createDiagnosesChart(diagnoses) {
    const ctx = document.getElementById('deptChart');
    if (!ctx) return;

    if (charts.diagnoses) charts.diagnoses.destroy();

    const colors = ['#003399', '#d32f2f', '#f5a623', '#7ed321', '#4a90e2', '#9b59b6'];

    charts.diagnoses = new Chart(ctx.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: diagnoses.map(d => d.name),
        datasets: [{
          data: diagnoses.map(d => d.count),
          backgroundColor: colors.slice(0, diagnoses.length),
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 15,
              font: { size: 11 }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        },
        cutout: '65%'
      }
    });
  }

  // Fetch data for date range (initial load and updates)
  async function fetchDateRangeData(from, to) {
    if (!from || !to) return;

    // Show loading state
    visitsEl.textContent = '...';
    admissionsEl.textContent = '...';
    dischargesEl.textContent = '...';
    if (cancelledEl) cancelledEl.textContent = '...';
    patientsTable.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">Loading...</td></tr>';

    try {
      const params = {
        fromDate: from,
        toDate: to
      };

      const response = await API_CONFIG.reports.getDateRangeReport(params);
      
      if (response.success) {
        // Update KPI cards
        if (visitsEl) visitsEl.textContent = response.summary.totalVisits || 0;
        if (admissionsEl) admissionsEl.textContent = response.summary.totalAdmissions || 0;
        if (dischargesEl) dischargesEl.textContent = response.summary.totalDischarges || 0;
        if (cancelledEl) cancelledEl.textContent = response.summary.totalCancelled || 0;

        // Update KPI labels to show date range
        if (kpiLabels.length > 0) {
          const dateRange = `${new Date(from).toLocaleDateString()} - ${new Date(to).toLocaleDateString()}`;
          kpiLabels.forEach(label => label.textContent = dateRange);
        }

        // Update patients table
        patientsData = response.patients || [];
        renderPatientsTable(patientsData);

        // Update charts
        await initCharts(from, to);
        
        // Store current filters
        currentFilters = {
          fromDate: from,
          toDate: to
        };
      }
    } catch (e) {
      console.error("Failed to fetch date range data:", e);
      showError('Failed to load data for selected dates');
      
      // Set default values on error
      if (visitsEl) visitsEl.textContent = '0';
      if (admissionsEl) admissionsEl.textContent = '0';
      if (dischargesEl) dischargesEl.textContent = '0';
      if (cancelledEl) cancelledEl.textContent = '0';
    }
  }

  // Debounced version of fetchDateRangeData
  const debouncedFetch = debounce(() => {
    if (fromDate.value && toDate.value) {
      fetchDateRangeData(fromDate.value, toDate.value);
    }
  }, 500);

  function renderPatientsTable(patients) {
    if (!patientsTable) return;

    patientsTable.innerHTML = '';
    
    if (!patients || patients.length === 0) {
      patientsTable.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">No patients found</td></tr>';
      return;
    }

    patients.forEach(p => {
      const tr = document.createElement('tr');
      
      const patientId = p.id || p.patientId || 'N/A';
      const patientName = p.name || p.patientName || 'Unknown';
      const diagnosis = p.diagnosis || p.chiefComplaint || 'Check-up';
      
      let isAdmitted = p.isAdmitted || p.admitted || 'No';
      let statusClass = 'status';
      let statusText = p.status || 'Seen';
      
      if (isAdmitted === 'Yes' || p.status === 'admitted') {
        statusClass += ' admitted';
        statusText = 'Admitted';
      } else if (p.status === 'discharged') {
        statusClass += ' discharged';
        statusText = 'Discharged';
      } else if (p.status === 'completed' || p.status === 'Seen') {
        statusClass += ' seen';
        statusText = 'Completed';
      } else if (p.status === 'waiting') {
        statusClass += ' waiting';
        statusText = 'Waiting';
      } else if (p.status === 'scheduled') {
        statusClass += ' scheduled';
        statusText = 'Scheduled';
      } else if (p.status === 'checked-in') {
        statusClass += ' checked-in';
        statusText = 'Checked-In';
      } else if (p.status === 'cancelled') { 
        statusClass += ' cancelled';
        statusText = 'Cancelled';
      }

      tr.innerHTML = `
        <td>${patientId}</td>
        <td>${patientName}</td>
        <td>${diagnosis}</td>
        <td>${isAdmitted}</td>
        <td><span class="${statusClass}">${statusText}</span></td>
      `;
      patientsTable.appendChild(tr);
    });
  }

  // Load generated reports
  function loadGeneratedReports() {
    if (!reportsBody) return;

    const savedReports = JSON.parse(sessionStorage.getItem('generatedReports') || '[]');
    
    if (savedReports.length === 0) {
      reportsBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">No saved reports</td></tr>';
    } else {
      renderReportsList(savedReports);
    }
  }

  function renderReportsList(reports) {
    if (!reportsBody) return;

    reportsBody.innerHTML = reports.map(report => {
        // Split date and time if report has full timestamp
        let date = report.date;
        let time = '--:-- --';
        
        if (report.fullDateTime) {
            const dateTime = new Date(report.fullDateTime);
            date = dateTime.toLocaleDateString();
            time = dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (report.timestamp) {
            const dateTime = new Date(report.timestamp);
            date = dateTime.toLocaleDateString();
            time = dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        return `
        <tr>
            <td>${date}</td>
            <td>${time}</td>
            <td>${report.type}</td>
            <td>${report.scope}</td>
            <td>
                <button class="action-btn view-report" data-id="${report.id}" data-report='${JSON.stringify(report)}'>
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="action-btn download-report" data-id="${report.id}" data-report='${JSON.stringify(report)}'>
                    <i class="fas fa-download"></i> CSV
                </button>
            </td>
        </tr>
    `}).join('');

    // Add event listeners
    document.querySelectorAll('.view-report').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const reportData = JSON.parse(e.currentTarget.dataset.report);
            viewReport(reportData);
        });
    });

    document.querySelectorAll('.download-report').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const reportData = JSON.parse(e.currentTarget.dataset.report);
            downloadReportCSV(reportData);
        });
    });
  }

  // Generate report and scroll to table
  function generateReport() {
    if (!fromDate.value || !toDate.value) {
        alert('Please select both dates');
        return;
    }

    const now = new Date();
    
    const newReport = {
        id: Date.now().toString(),
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fullDateTime: now.toISOString(),
        timestamp: now.getTime(),
        type: 'Custom Report',
        scope: `${fromDate.value} to ${toDate.value}`,
        params: {
            fromDate: fromDate.value,
            toDate: toDate.value
        },
        summary: {
            totalVisits: visitsEl.textContent,
            totalAdmissions: admissionsEl.textContent,
            totalDischarges: dischargesEl.textContent,
        }
    };

    const savedReports = JSON.parse(sessionStorage.getItem('generatedReports') || '[]');
    savedReports.unshift(newReport);
    if (savedReports.length > 10) savedReports.pop();
    sessionStorage.setItem('generatedReports', JSON.stringify(savedReports));
    
    renderReportsList(savedReports);
    showSuccess('Report generated successfully');
    
    // Scroll to the generated reports table
    setTimeout(() => {
        const reportsSection = document.querySelector('.reports');
        if (reportsSection) {
            reportsSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
            
            // Highlight the new report row
            const firstRow = document.querySelector('#reportsBody tr:first-child');
            if (firstRow) {
                firstRow.style.backgroundColor = '#fff3cd';
                firstRow.style.transition = 'background-color 1s';
                setTimeout(() => {
                    firstRow.style.backgroundColor = '';
                }, 2000);
            }
        }
    }, 100);
  }

  function viewReport(report) {
    const reportDetails = `
═════════════════════════════
     CLINIC REPORT
═════════════════════════════

Date: ${report.date} ${report.time ? `at ${report.time}` : ''}
Type: ${report.type}
Period: ${report.scope}

${report.summary ? `
📊 SUMMARY STATISTICS
─────────────────────────
Total Appointments:    ${report.summary.totalVisits}
Admissions:            ${report.summary.totalAdmissions}
Discharges:            ${report.summary.totalDischarges}
${report.params ? `From: ${report.params.fromDate}
To:   ${report.params.toDate}` : ''}
` : ''}

─────────────────────────
Generated on: ${new Date().toLocaleString()}
    `;
    
    alert(reportDetails);
  }

  function downloadReportCSV(report) {
    // Create CSV content
    const headers = ['Metric', 'Value'];
    const rows = [
        ['Report Date', report.date],
        ['Report Time', report.time || 'N/A'],
        ['Report Type', report.type],
        ['Period', report.scope],
        [''],
        ['SUMMARY STATISTICS', ''],
        ['Total Appointments', report.summary?.totalVisits || 'N/A'],
        ['Admissions', report.summary?.totalAdmissions || 'N/A'],
        ['Discharges', report.summary?.totalDischarges || 'N/A'],
    ];

    if (report.params) {
        rows.push(['Period From', report.params.fromDate]);
        rows.push(['Period To', report.params.toDate]);
    }

    rows.push(['']);
    rows.push(['Generated On', new Date().toLocaleString()]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Report_${report.date.replace(/\//g, '-')}_${report.time?.replace(/:/g, '-') || '0000'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Export current table to CSV
  function exportToCSV() {
    if (!patientsData || patientsData.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = ['Patient ID', 'Name', 'Diagnosis', 'Admitted', 'Status'];
    const csvRows = [];

    csvRows.push(headers.join(','));

    patientsData.forEach(p => {
      const row = [
        `"${p.id || p.patientId || 'N/A'}"`,
        `"${p.name || p.patientName || 'Unknown'}"`,
        `"${p.diagnosis || p.chiefComplaint || 'Check-up'}"`,
        `"${p.isAdmitted || p.admitted || 'No'}"`,
        `"${p.status || 'Seen'}"`
      ];
      csvRows.push(row.join(','));
    });

    // Add summary
    csvRows.push('');
    csvRows.push('"SUMMARY"');
    csvRows.push(`"Total Patients","${patientsData.length}"`);
    csvRows.push(`"Total Visits","${visitsEl?.textContent || '0'}"`);
    csvRows.push(`"Admissions","${admissionsEl?.textContent || '0'}"`);
    csvRows.push(`"Discharges","${dischargesEl?.textContent || '0'}"`);
    csvRows.push(`"Report Period","${kpiLabels[0]?.textContent || 'N/A'}"`);
    csvRows.push(`"Generated On","${new Date().toLocaleString()}"`);

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Patient_Data_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Print view
  function printView() {
    const printWindow = window.open('', '_blank');
    
    const summary = `
      <h2>Clinic Report</h2>
      <p>Period: ${kpiLabels[0]?.textContent || 'N/A'}</p>
      
      <h3>Summary Statistics</h3>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
        <tr>
          <th>Metric</th>
          <th>Value</th>
        </tr>
        <tr>
          <td>Total Appointments</td>
          <td>${visitsEl?.textContent || '0'}</td>
        </tr>
        <tr>
          <td>Admissions</td>
          <td>${admissionsEl?.textContent || '0'}</td>
        </tr>
        <tr>
          <td>Discharges</td>
          <td>${dischargesEl?.textContent || '0'}</td>
        </tr>
        
      </table>
      
      <h3>Recent Patients</h3>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr>
            <th>Patient ID</th>
            <th>Name</th>
            <th>Diagnosis</th>
            <th>Admitted</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${patientsData.map(p => `
            <tr>
              <td>${p.id || p.patientId || 'N/A'}</td>
              <td>${p.name || p.patientName || 'Unknown'}</td>
              <td>${p.diagnosis || p.chiefComplaint || 'Check-up'}</td>
              <td>${p.isAdmitted || p.admitted || 'No'}</td>
              <td>${p.status || 'Seen'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <p><small>Generated on: ${new Date().toLocaleString()}</small></p>
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>Clinic Report - Print View</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { color: #003399; }
            h3 { margin-top: 20px; color: #333; }
            table { margin: 10px 0; }
            th { background-color: #f5f5f5; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          ${summary}
          <button onclick="window.print()">Print</button>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  }

  // Search functionality
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const filtered = patientsData.filter(p => 
        (p.name && p.name.toLowerCase().includes(searchTerm)) ||
        (p.patientName && p.patientName.toLowerCase().includes(searchTerm)) ||
        (p.diagnosis && p.diagnosis.toLowerCase().includes(searchTerm)) ||
        (p.chiefComplaint && p.chiefComplaint.toLowerCase().includes(searchTerm)) ||
        (p.id && p.id.toString().toLowerCase().includes(searchTerm)) ||
        (p.patientId && p.patientId.toString().toLowerCase().includes(searchTerm))
      );
      renderPatientsTable(filtered);
    });
  }

  // Utility functions
  function showError(message) {
    console.error(message);
  }

  function showSuccess(message) {
    console.log(message);
  }

  // Event Listeners
  if (fromDate) {
    fromDate.addEventListener('change', () => {
      if (toDate && toDate.value) {
        debouncedFetch();
      }
    });
  }

  if (toDate) {
    toDate.addEventListener('change', () => {
      if (fromDate && fromDate.value) {
        debouncedFetch();
      }
    });
  }

  if (generateBtn) {
    generateBtn.addEventListener('click', generateReport);
  }

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', exportToCSV);
  }

  if (printViewBtn) {
    printViewBtn.addEventListener('click', printView);
  }

  // Initial Load - Load data for the default date range (last 7 days)
  try {
    await fetchDateRangeData(sevenDaysAgo.toISOString().split('T')[0], today.toISOString().split('T')[0]);
    await initCharts(sevenDaysAgo.toISOString().split('T')[0], today.toISOString().split('T')[0]);
    loadGeneratedReports();
  } catch (error) {
    console.error('Error loading initial data:', error);
    showError('Failed to load initial data');
  }
});