// Update current time
function updateTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('currentTime').textContent = timeString;
}

setInterval(updateTime, 1000);

// Set copyright year
document.getElementById('year').textContent = new Date().getFullYear();

// Chart initialization - Patients Seen (Line Chart)
const patientCtx = document.getElementById('patientChart');
if (patientCtx) {
  new Chart(patientCtx, {
    type: 'line',
    data: {
      labels: ['-6 days', '-5 days', '-4 days', '-3 days', '-2 days', '-1 day', 'Today'],
      datasets: [{
        label: 'Patients',
        data: [32, 42, 38, 50, 35, 50, 48],
        borderColor: '#0606ba',
        backgroundColor: 'rgba(6, 6, 186, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#0606ba'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      }
    }
  });
}

// Chart initialization - Department Distribution (Pie Chart)
const deptCtx = document.getElementById('departmentChart');
if (deptCtx) {
  new Chart(deptCtx, {
    type: 'doughnut',
    data: {
      labels: ['General', 'Pediatrics', 'Cardiology', 'Other'],
      datasets: [{
        data: [45, 25, 20, 10],
        backgroundColor: ['#ff6b6b', '#f9d966', '#4CAF50', '#87CEEB']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

// Button handlers
document.addEventListener('DOMContentLoaded', function() {
  const profileBtn = document.getElementById('profileBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  if (profileBtn) {
    profileBtn.addEventListener('click', function() {
      alert('Profile modal would open here');
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      if (confirm('Are you sure you want to logout?')) {
        window.location.href = '../doctor_pageV1/doctor-login.html';
      }
    });
  }
});

  // Set current time
  updateTime();
  setInterval(updateTime, 60000);

  // Load patient queue
  loadPatientQueue();

  // Setup dashboard-specific functionality
  setupDashboardEvents();
}

// Update current time
function updateTime() {
  const now = new Date();
  const timeElement = document.getElementById("currentTime");
  if (timeElement) {
    timeElement.textContent = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }
}

// Load patient queue
function loadPatientQueue() {
  const queueBody = document.getElementById("patientQueue");
  if (!queueBody) return;

  queueBody.innerHTML = "";

  patients.forEach((patient) => {
    const row = document.createElement("tr");

    // Get status class
    let statusClass = "";
    let statusText = "";
    switch (patient.status) {
      case "waiting":
        statusClass = "status-waiting";
        statusText = "Waiting";
        break;
      case "checked-in":
        statusClass = "status-checked-in";
        statusText = "Checked In";
        break;
      case "completed":
        statusClass = "status-completed";
        statusText = "Completed";
        break;
      case "referred":
        statusClass = "status-referred";
        statusText = "Referred";
        break;
    }

    row.innerHTML = `
            <td>${patient.id}</td>
            <td><strong>${patient.name}</strong></td>
            <td>${patient.time}</td>
            <td><span class="status ${statusClass}">${statusText}</span></td>
            <td>${patient.vitals}</td>
            <td>
                ${
                  patient.vitals === "Not Taken"
                    ? `<button class="action-btn-small" onclick="takeVitals('${patient.id}')">
                        <i class="fas fa-heartbeat"></i> Take Vitals
                    </button>`
                    : `<button class="action-btn-small secondary" onclick="viewVitals('${patient.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>`
                }
            </td>
        `;

    queueBody.appendChild(row);
  });
}

// Setup dashboard events
function setupDashboardEvents() {
  // Quick action buttons
  const quickActions = {
    "record-vitals": () =>
      (window.location.href = "Patient Vitals Entry Page.html"),
    "check-in": () => checkInPatient(),
    refer: () => (window.location.href = "Patient Referral Page.html"),
    "view-report": () => (window.location.href = "Daily Report Page.html"),
  };

  // Attach event listeners to action buttons
  document.querySelectorAll(".action-btn").forEach((btn) => {
    const action = btn.querySelector("span").textContent.toLowerCase();
    if (action.includes("vitals")) {
      btn.onclick = quickActions["record-vitals"];
    } else if (action.includes("check-in")) {
      btn.onclick = quickActions["check-in"];
    } else if (action.includes("refer")) {
      btn.onclick = quickActions["refer"];
    } else if (action.includes("report")) {
      btn.onclick = quickActions["view-report"];
    }
  });
}

// Check-in patient
function checkInPatient() {
  const patientId = prompt("Enter Patient ID to check in:");
  if (patientId) {
    alert(`Patient ${patientId} checked in successfully`);
    // Refresh the queue
    loadPatientQueue();
  }
}

// Navigation functions
function takeVitals(patientId) {
  alert(`Taking vitals for patient ${patientId}`);
  window.location.href = `record-vitals.html?patient=${patientId}`;
}

function viewVitals(patientId) {
  alert(`Viewing vitals for patient ${patientId}`);
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", initDashboard);
