// Patient List Page JavaScript

// Sample patient data for the list
const allPatients = [
  {
    id: "2025-001",
    name: "Samuel Okoye",
    gender: "Male",
    age: 22,
    department: "Computer Science",
    time: "10:00 AM",
    status: "waiting",
  },
  {
    id: "2025-002",
    name: "Ade Bayo",
    gender: "Male",
    age: 20,
    department: "Medicine",
    time: "10:15 AM",
    status: "checked-in",
  },
  {
    id: "2025-003",
    name: "Ahmed Musa",
    gender: "Male",
    age: 21,
    department: "Computer Engineering",
    time: "10:30 AM",
    status: "waiting",
  },
  {
    id: "2025-004",
    name: "Chioma Okoro",
    gender: "Female",
    age: 19,
    department: "Law",
    time: "10:45 AM",
    status: "completed",
  },
  {
    id: "2025-005",
    name: "Ruqqaiya Rita",
    gender: "Female",
    age: 20,
    department: "Business",
    time: "11:00 AM",
    status: "waiting",
  },
  {
    id: "2025-006",
    name: "Fatima Ahmed",
    gender: "Female",
    age: 22,
    department: "Pharmacy",
    time: "11:15 AM",
    status: "referred",
  },
  {
    id: "2025-007",
    name: "Samuel Ade",
    gender: "Male",
    age: 19,
    department: "Architecture",
    time: "11:30 AM",
    status: "waiting",
  },
  {
    id: "2025-008",
    name: "Grace Okafor",
    gender: "Female",
    age: 21,
    department: "Medicine",
    time: "11:45 AM",
    status: "waiting",
  },
];

// Initialize patient list page
function initPatientList() {
  // Load patient table
  loadPatientTable();

  // Setup search functionality
  setupSearch();

  // Setup filter buttons
  setupFilters();
}

// Load patient table
function loadPatientTable(filter = "all") {
  const tableBody = document.getElementById("patientTable");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  let filteredPatients = allPatients;
  if (filter === "waiting") {
    filteredPatients = allPatients.filter((p) => p.status === "waiting");
  }

  filteredPatients.forEach((patient) => {
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
            <td>${patient.gender}</td>
            <td>${patient.age}</td>
            <td>${patient.department}</td>
            <td>${patient.time}</td>
            <td><span class="status ${statusClass}">${statusText}</span></td>
            <td>
                <button class="action-btn-small" onclick="viewPatient('${patient.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="action-btn-small" onclick="checkInPatientById('${patient.id}')">
                    <i class="fas fa-check-square"></i> Check-in
                </button>
            </td>
        `;

    tableBody.appendChild(row);
  });
}

// Setup search functionality
function setupSearch() {
  const searchInput = document.getElementById("patientSearch");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase();
      const rows = document.querySelectorAll("#patientTable tr");

      rows.forEach((row) => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? "" : "none";
      });
    });
  }
}

// Setup filter buttons
function setupFilters() {
  const filterButtons = document.querySelectorAll(".header-actions .btn");
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      const filter = this.textContent.toLowerCase().includes("waiting")
        ? "waiting"
        : "all";
      loadPatientTable(filter);

      // Update active state
      filterButtons.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
    });
  });
}

// Check-in patient by ID
function checkInPatientById(patientId) {
  if (confirm(`Check in patient ${patientId}?`)) {
    alert(`Patient ${patientId} checked in successfully`);
    // Refresh the list
    loadPatientTable();
  }
}

// View patient details
function viewPatient(patientId) {
  alert(`Viewing patient ${patientId} details`);
  window.location.href = `patient-records.html?patient=${patientId}`;
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", initPatientList);
