// Dashboard Page JavaScript

// Sample patient data for the queue
const patients = [
  {
    id: "2025-001",
    name: "Samuel Okoye",
    time: "10:00 AM",
    status: "waiting",
    vitals: "Not Taken",
  },
  {
    id: "2025-002",
    name: "Ade Bayo",
    time: "10:15 AM",
    status: "checked-in",
    vitals: "Taken",
  },
  {
    id: "2025-003",
    name: "Ahmed Musa",
    time: "10:30 AM",
    status: "waiting",
    vitals: "Not Taken",
  },
  {
    id: "2025-004",
    name: "Chioma Okoro",
    time: "10:45 AM",
    status: "completed",
    vitals: "Taken",
  },
  {
    id: "2025-005",
    name: "Ruqqaiya Rita",
    time: "11:00 AM",
    status: "waiting",
    vitals: "Not Taken",
  },
  {
    id: "2025-006",
    name: "Fatima Ahmed",
    time: "11:15 AM",
    status: "referred",
    vitals: "Taken",
  },
];

// Initialize the dashboard
function initDashboard() {
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
