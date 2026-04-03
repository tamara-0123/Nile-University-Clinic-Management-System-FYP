document.addEventListener('DOMContentLoaded', async () => {
    // Check if API_CONFIG is defined
    if (typeof API_CONFIG === 'undefined') {
        console.error('API_CONFIG is not defined. Make sure api-config.js is loaded first.');
        alert('Configuration error. Please refresh the page.');
        return;
    }

    // Check authentication
    const token = API_CONFIG.getToken();
    if (!token) {
        window.location.href = '../Shared pages/login.html';
        return;
    }

    // DOM Elements
    const patientsBody = document.getElementById('patientsBody');
    const search = document.getElementById('search');
    const fromDate = document.getElementById('fromDate');
    const toDate = document.getElementById('toDate');
    const exportCsv = document.getElementById('exportCsv');
    const printBtn = document.getElementById('printBtn');
    const totalRecordsSpan = document.getElementById('totalRecords');

    // State
    let records = [];
    let doctors = [];

    // Set default dates (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (fromDate) {
        fromDate.valueAsDate = thirtyDaysAgo;
        fromDate.max = today.toISOString().split('T')[0];
    }
    if (toDate) {
        toDate.valueAsDate = today;
        toDate.max = today.toISOString().split('T')[0];
    }
    
    // Chart instance
    let diagnosisChart = null;

    // Function to process diagnosis data for chart
    function processDiagnosisData(records) {
        const diagnosisCount = {};
        
        records.forEach(record => {
            // Skip if no diagnosis or if it's a placeholder
            const diagnosis = record.diagnosis;
            if (!diagnosis || diagnosis === '—' || diagnosis === 'Pending' || diagnosis === 'No diagnosis') {
                return;
            }
            
            // Clean up diagnosis text (remove trailing periods, trim)
            let cleanDiagnosis = diagnosis.replace(/\.$/, '').trim();
            
            // Handle multiple diagnoses (split by common delimiters)
            const delimiters = [',', ';', '/', ' and '];
            let diagnoses = [cleanDiagnosis];
            
            delimiters.forEach(delimiter => {
                if (cleanDiagnosis.includes(delimiter)) {
                    diagnoses = cleanDiagnosis.split(delimiter).map(d => d.trim());
                }
            });
            
            // Count each diagnosis
            diagnoses.forEach(d => {
                if (d && d.length > 0) {
                    diagnosisCount[d] = (diagnosisCount[d] || 0) + 1;
                }
            });
        });
        
        // Convert to array and sort by count
        return Object.entries(diagnosisCount)
            .map(([diagnosis, count]) => ({ diagnosis, count }))
            .sort((a, b) => b.count - a.count);
    }

    // Function to render/update the chart
    function renderDiagnosisChart() {
        const chartCanvas = document.getElementById('diagnosisChart');
        const noDataMessage = document.getElementById('noChartData');
        const chartWrapper = document.querySelector('.chart-wrapper');
        
        if (!chartCanvas) return;
        
        // Process diagnosis data
        const diagnosisData = processDiagnosisData(records);
        
        if (diagnosisData.length === 0) {
            // Show no data message, hide chart
            if (noDataMessage) noDataMessage.style.display = 'block';
            if (chartWrapper) chartWrapper.style.display = 'none';
            return;
        }
        
        // Show chart, hide no data message
        if (noDataMessage) noDataMessage.style.display = 'none';
        if (chartWrapper) chartWrapper.style.display = 'block';
        
        // Get limit from select
        const limit = parseInt(document.getElementById('diagnosisLimit')?.value || 10);
        const topDiagnoses = diagnosisData.slice(0, limit);
        
        const labels = topDiagnoses.map(d => {
            // Truncate long labels
            return d.diagnosis.length > 30 ? d.diagnosis.substring(0, 27) + '...' : d.diagnosis;
        });
        const counts = topDiagnoses.map(d => d.count);
        
        const backgroundColor = [
            'rgba(0, 51, 153, 0.8)',
            'rgba(25, 118, 210, 0.8)',
            'rgba(56, 142, 60, 0.8)',
            'rgba(245, 124, 0, 0.8)',
            'rgba(211, 47, 47, 0.8)',
            'rgba(123, 31, 162, 0.8)',
            'rgba(0, 151, 167, 0.8)',
            'rgba(109, 76, 65, 0.8)',
            'rgba(121, 85, 72, 0.8)',
            'rgba(69, 90, 100, 0.8)',
            'rgba(26, 35, 126, 0.8)',
            'rgba(49, 27, 146, 0.8)',
            'rgba(74, 20, 140, 0.8)',
            'rgba(106, 27, 154, 0.8)',
            'rgba(123, 31, 162, 0.8)'
        ];
        
        const borderColor = backgroundColor.map(color => color.replace('0.8', '1'));
        
        if (diagnosisChart) {
            diagnosisChart.destroy();
        }
        
        // Create new chart
        diagnosisChart = new Chart(chartCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Number of Cases',
                    data: counts,
                    backgroundColor: backgroundColor.slice(0, limit),
                    borderColor: borderColor.slice(0, limit),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Cases: ${context.raw}`;
                            },
                            afterLabel: function(context) {
                                const originalDiagnosis = topDiagnoses[context.dataIndex].diagnosis;
                                if (originalDiagnosis.length > 30) {
                                    return `Full: ${originalDiagnosis}`;
                                }
                                return null;
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
                        },
                        title: {
                            display: true,
                            text: 'Number of Cases'
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        },
                        title: {
                            display: true,
                            text: 'Diagnosis'
                        }
                    }
                },
                layout: {
                    padding: {
                        bottom: 20
                    }
                }
            }
        });
    }

    // Add event listeners for chart controls
    document.getElementById('diagnosisLimit')?.addEventListener('change', () => {
        renderDiagnosisChart();
    });

    document.getElementById('refreshChart')?.addEventListener('click', () => {
        renderDiagnosisChart();
    });

    // Load ALL appointment records within date range (only completed appointments)
    async function loadPatientRecords() {
        try {
            // Show loading state
            patientsBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem;"><div class="loading-spinner"></div> Loading records...</td></tr>';

            // Build query parameters
            const params = new URLSearchParams();

            if (fromDate.value) {
                params.append('fromDate', fromDate.value);
            }
            if (toDate.value) {
                params.append('toDate', toDate.value);
            }

            console.log('Fetching records for date range:', fromDate.value, 'to', toDate.value);

            // Make API call
            const response = await API_CONFIG.request(`/admin/patient-records?${params.toString()}`);

            if (response.success) {
                // Filter to only show completed appointments
                const allRecords = response.records || [];
                records = allRecords.filter(record => {
                    // Check if status is completed (case insensitive)
                    const status = record.status ? record.status.toLowerCase() : '';
                    return status === 'completed';
                });

                console.log(`Loaded ${allRecords.length} total records, showing ${records.length} completed appointments`);

                doctors = response.doctors || [];

                // Update total records display
                if (totalRecordsSpan) {
                    totalRecordsSpan.textContent = records.length;
                }

                render();
                renderDiagnosisChart();
            } else {
                throw new Error(response.message || 'Failed to load records');
            }
        } catch (error) {
            console.error("Failed to load records:", error);
            patientsBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem; color: #c62828;">Failed to load records. Please try again.</td></tr>';
        }
    }

    // Helper: Format date
    function formatDate(date) {
        if (!date) return '—';
        try {
            const d = new Date(date);
            if (isNaN(d.getTime())) return date;
            return d.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return date;
        }
    }

    // Helper: Get status badge class
    function getStatusClass(status) {
        const statusMap = {
            'scheduled': 'status-scheduled',
            'waiting': 'status-waiting',
            'checked-in': 'status-checked',
            'in-consultation': 'status-consultation',
            'admitted': 'status-admitted',
            'completed': 'status-completed',
            'cancelled': 'status-cancelled'
        };
        return statusMap[status] || 'status-other';
    }

    // Render function - ONE ROW PER APPOINTMENT with Department column
    function render() {
        renderDiagnosisChart();
        patientsBody.innerHTML = '';

        const q = search.value.trim().toLowerCase();

        if (records.length === 0) {
            patientsBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem;">No completed appointments found for the selected date range</td></tr>';
            return;
        }

        // Apply search filter
        const filteredRecords = records.filter(record => {
            const patientId = (record.id || '').toLowerCase();
            const patientName = (record.patientName || '').toLowerCase();
            const diagnosis = (record.diagnosis || '').toLowerCase();
            const doctorName = (record.doctorName || '').toLowerCase();
            const doctorId = (record.doctorId || '').toLowerCase();
            const department = (record.department || record.patientDepartment || '').toLowerCase();
            const appointmentDate = record.appointmentDate ? new Date(record.appointmentDate).toLocaleDateString().toLowerCase() : '';

            if (!q) return true;

            return patientId.includes(q) ||
                patientName.includes(q) ||
                diagnosis.includes(q) ||
                doctorName.includes(q) ||
                doctorId.includes(q) ||
                department.includes(q) ||
                appointmentDate.includes(q);
        });

        if (filteredRecords.length === 0) {
            patientsBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem;">No records match your search</td></tr>';
            return;
        }

        // Add summary row
        const summaryRow = document.createElement('tr');
        summaryRow.className = 'summary-row';
        summaryRow.innerHTML = `
        <td colspan="7" style="background: #f0f0f0; padding: 8px; text-align: center; font-weight: 600;">
            Showing ${filteredRecords.length} of ${records.length} total completed appointments | 
            Date Range: ${formatDate(fromDate.value)} to ${formatDate(toDate.value)}
        </td>
    `;
        patientsBody.appendChild(summaryRow);

        // Add each appointment as a row
        filteredRecords.forEach(record => {
            const tr = document.createElement('tr');

            // Format the appointment date nicely
            const formattedDate = record.appointmentDate ? formatDate(record.appointmentDate) : '—';
            
            // Get department - check multiple possible sources
            const department = record.department || 
                              record.patientDepartment || 
                              record.patient?.department || 
                              record.patient?.user?.department || 
                              'Not specified';

            tr.innerHTML = `
            <td>${record.id || record.patientId || 'N/A'}</td>
            <td>${record.patientName || 'Unknown'}</td>
            <td>${department}</td>
            <td>${record.diagnosis || '—'}</td>
            <td>${record.doctorName || 'Unknown'}</td>
            <td>${record.doctorId || 'N/A'}</td>
            <td>${formattedDate}</td>
        `;

            // Add data attributes
            tr.dataset.appointmentId = record.appointmentId;
            tr.dataset.patientId = record.patientId;
            tr.dataset.status = record.status;
            tr.dataset.appointmentDate = record.appointmentDate;
            tr.dataset.department = department;

            // Add title with appointment details
            tr.title = `Appointment: ${formattedDate} | Status: ${record.status} | Urgency: ${record.urgency} | Dept: ${department}`;

            patientsBody.appendChild(tr);
        });
    }

    // Export to CSV with department column
    exportCsv.addEventListener('click', () => {
        const headers = ['Patient ID', 'Patient Name', 'Department', 'Diagnosis', 'Doctor Name', 'Doctor ID', 'Appointment Date', 'Status', 'Urgency'];
        const rows = records.map(r => {
            const department = r.department || 
                              r.patientDepartment || 
                              r.patient?.department || 
                              r.patient?.user?.department || 
                              'Not specified';
            
            return [
                r.id || r.patientId,
                r.patientName,
                department,
                r.diagnosis,
                r.doctorName,
                r.doctorId,
                formatDate(r.appointmentDate),
                r.status,
                r.urgency
            ];
        });

        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `completed_appointments_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    });

    // Print with department column
    printBtn.addEventListener('click', () => {
        const printWindow = window.open('', '_blank');

        const tableHTML = `
        <html>
            <head>
                <title>Completed Appointments - Print</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #003399; }
                    .header-info { margin: 20px 0; padding: 10px; background: #f5f5f5; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background: #003399; color: white; padding: 10px; text-align: left; }
                    td { padding: 8px; border-bottom: 1px solid #ddd; }
                    .status-scheduled { color: #1976d2; }
                    .status-waiting { color: #f57c00; }
                    .status-checked { color: #7b1fa2; }
                    .status-consultation { color: #388e3c; }
                    .status-admitted { color: #d32f2f; }
                    .status-completed { color: #2e7d32; }
                    .status-cancelled { color: #9e9e9e; text-decoration: line-through; }
                    .summary { margin-top: 20px; padding: 10px; background: #f0f0f0; }
                </style>
            </head>
            <body>
                <h1>Completed Appointments</h1>
                <div class="header-info">
                    <p><strong>Date Range:</strong> ${formatDate(fromDate.value)} to ${formatDate(toDate.value)}</p>
                    <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>Total Completed Appointments:</strong> ${records.length}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Patient ID</th>
                            <th>Patient Name</th>
                            <th>Department</th>
                            <th>Diagnosis</th>
                            <th>Doctor Name</th>
                            <th>Doctor ID</th>
                            <th>Appointment Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${records.map(r => {
                            const department = r.department || 
                                              r.patientDepartment || 
                                              r.patient?.department || 
                                              r.patient?.user?.department || 
                                              'Not specified';
                            
                            return `
                                <tr>
                                    <td>${r.id || r.patientId}</td>
                                    <td>${r.patientName}</td>
                                    <td>${department}</td>
                                    <td>${r.diagnosis || '—'}</td>
                                    <td>${r.doctorName}</td>
                                    <td>${r.doctorId}</td>
                                    <td>${formatDate(r.appointmentDate)}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
                <div class="summary">
                    <p><strong>Summary:</strong> ${records.length} total completed appointments</p>
                    <p><strong>Date Range:</strong> ${formatDate(fromDate.value)} to ${formatDate(toDate.value)}</p>
                </div>
            </body>
        </html>
    `;

        printWindow.document.write(tableHTML);
        printWindow.document.close();
        printWindow.print();
    });

    // Debounced search
    let searchTimeout;
    function debouncedRender() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => render(), 300);
    }

    // Event listeners
    search.addEventListener('input', debouncedRender);

    // Reload when date range changes
    fromDate.addEventListener('change', loadPatientRecords);
    toDate.addEventListener('change', loadPatientRecords);

    // Utility function to check data
    window.checkData = function () {
        console.log('Data Check:');
        console.log(`Total records: ${records.length}`);
        console.log('Sample record:', records[0]);
        console.log('Date range:', fromDate.value, 'to', toDate.value);
        return records;
    };

    // Initial load
    await loadPatientRecords();

    // Refresh data every 5 minutes
    setInterval(loadPatientRecords, 300000);
});