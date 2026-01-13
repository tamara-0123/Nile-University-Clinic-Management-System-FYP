// Set copyright year
document.getElementById('year').textContent = new Date().getFullYear();

// Search functionality
document.getElementById('searchInput').addEventListener('keyup', function(e) {
  const searchTerm = e.target.value.toLowerCase();
  const rows = document.querySelectorAll('.reports-table tbody tr');
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? '' : 'none';
  });
});

// View patient details
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('action-link')) {
    e.preventDefault();
    const row = e.target.closest('tr');
    const cells = row.querySelectorAll('td');
    
    document.getElementById('detailID').textContent = cells[0].textContent;
    document.getElementById('detailName').textContent = cells[1].textContent;
    document.getElementById('detailDOB').textContent = '2000-' + cells[2].textContent + '-15';
    document.getElementById('detailSex').textContent = cells[3].textContent;
    document.getElementById('detailDiagnosis').textContent = cells[4].textContent;
    document.getElementById('detailAdmitted').textContent = cells[5].textContent;
    document.getElementById('detailMedStatus').textContent = cells[6].textContent;
    document.getElementById('detailEmail').textContent = cells[1].textContent.toLowerCase().replace(' ', '.') + '@example.com';
    document.getElementById('detailPhone').textContent = '0801-234-567';
    
    document.getElementById('patientDetail').style.display = 'block';
    window.scrollTo(0, document.getElementById('patientDetail').offsetTop);
  }
});

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

    condition: "Allergy",
  },
];

// Sample patient details
const patientDetails = {
  "2025-001": {
    name: "Samuel Okoye",
    info: "ID: 2025-001 | Age: 22 | Male | Computer Science",
    vitals: {
      bp: "120/80",
      temp: "36.8",
      pulse: "72",
      oxygen: "98",
      weight: "68.5",
      bmi: "22.4",
    },
    allergies: ["Penicillin", "Peanuts"],
    conditions: ["Asthma (mild)"],
    consultations: [
      {
        date: "2025-04-15",
        doctor: "Dr. Ahmed",
        diagnosis: "Common Cold",
        prescription: "Paracetamol 500mg",
        followup: "2025-04-20",
      },
      {
        date: "2025-03-20",
        doctor: "Dr. Umar",
        diagnosis: "Allergy",
        prescription: "Antihistamine",
        followup: "None",
      },
    ],
    timeline: [
      {
        date: "2025-04-15",
        event: "Visit for Common Cold",
        details: "Prescribed Paracetamol 500mg",
      },
      {
        date: "2025-03-20",
        event: "Allergy Consultation",
        details: "Prescribed Antihistamine",
      },
      {
        date: "2025-02-10",
        event: "Routine Checkup",
        details: "All vitals normal",
      },
      {
        date: "2025-01-05",
        event: "Initial Registration",
        details: "New patient registration completed",
      },
    ],
  },
  "2025-002": {
    name: "Ade Bayo",
    info: "ID: 2025-002 | Age: 20 | Male | Medicine",
    vitals: {
      bp: "118/78",
      temp: "37.0",
      pulse: "75",
      oxygen: "97",
      weight: "62.0",
      bmi: "21.5",
    },
    allergies: ["None"],
    conditions: ["Migraine"],
    consultations: [
      {
        date: "2025-04-14",
        doctor: "Dr. Umar",
        diagnosis: "Migraine",
        prescription: "Ibuprofen 400mg",
        followup: "2025-04-21",
      },
    ],
  },
};

// Initialize patient records page
function initPatientRecords() {
  // Load patient records list
  loadPatientRecordsList();

  // Setup search functionality
  setupRecordSearch();

  // Setup action buttons
  setupActionButtons();
}

// Load patient records list
function loadPatientRecordsList() {
  const recordsList = document.getElementById("recordsList");
  if (!recordsList) return;

  recordsList.innerHTML = "";

  patientRecords.forEach((record) => {
    const recordCard = document.createElement("div");
    recordCard.className = "record-card";
    recordCard.onclick = () => selectPatientRecord(record.id);

    recordCard.innerHTML = `
            <div class="record-header">
                <span class="record-id">${record.id}</span>
                <span class="record-date">Last visit: ${record.lastVisit}</span>
            </div>
            <div class="record-info">
                <p><strong>Name:</strong> ${record.name}</p>
                <p><strong>Age:</strong> ${record.age} years</p>
                <p><strong>Gender:</strong> ${record.gender}</p>
                <p><strong>Last Condition:</strong> ${record.condition}</p>
            </div>
        `;

    recordsList.appendChild(recordCard);
  });
}

// Select patient record
function selectPatientRecord(patientId) {
  // Remove selected class from all cards
  document.querySelectorAll(".record-card").forEach((card) => {
    card.classList.remove("selected");
  });

  // Add selected class to clicked card
  event.currentTarget.classList.add("selected");

  // Show patient details
  showPatientDetails(patientId);
}

// Show patient details
function showPatientDetails(patientId) {
  const patient = patientDetails[patientId];
  if (!patient) return;

  // Update patient header
  document.getElementById("patientName").textContent = patient.name;
  document.getElementById("patientInfo").textContent = patient.info;

  // Enable action buttons
  const vitalsBtn = document.getElementById("vitalsBtn");
  const referBtn = document.getElementById("referBtn");
  if (vitalsBtn) vitalsBtn.disabled = false;
  if (referBtn) referBtn.disabled = false;

  // Show all sections
  document.getElementById("medicalHistorySection").style.display = "block";
  document.getElementById("currentVitalsSection").style.display = "block";
  document.getElementById("consultationsSection").style.display = "block";
  document.getElementById("conditionsSection").style.display = "block";

  // Update vitals display
  updateVitalsDisplay(patient.vitals);

  // Update allergies
  updateAllergies(patient.allergies);

  // Update conditions
  updateConditions(patient.conditions);

  // Update consultations
  updateConsultations(patient.consultations);

  // Load timeline if exists
  if (patient.timeline) {
    loadMedicalTimeline(patient.timeline);
  }
}

// Update vitals display
function updateVitalsDisplay(vitals) {
  document.getElementById("displayBP").textContent = vitals.bp;
  document.getElementById("displayTemp").textContent = vitals.temp + "°C";
  document.getElementById("displayPulse").textContent = vitals.pulse + " bpm";
  document.getElementById("displayOxygen").textContent = vitals.oxygen + "%";
  document.getElementById("displayWeight").textContent = vitals.weight + " kg";
  document.getElementById("displayBMI").textContent = vitals.bmi;
}

// Update allergies
function updateAllergies(allergies) {
  const allergiesList = document.getElementById("allergiesList");
  if (!allergiesList) return;

  allergiesList.innerHTML = allergies
    .map((allergy) => `<span class="tag allergy">${allergy}</span>`)
    .join("");
}

// Update conditions
function updateConditions(conditions) {
  const conditionsList = document.getElementById("conditionsList");
  if (!conditionsList) return;

  conditionsList.innerHTML = conditions
    .map((condition) => `<span class="tag condition">${condition}</span>`)
    .join("");
}

// Update consultations
function updateConsultations(consultations) {
  const consultationsTable = document.getElementById("consultationsTable");
  if (!consultationsTable) return;

  consultationsTable.innerHTML = consultations
    .map(
      (consult) => `
        <tr>
            <td>${consult.date}</td>
            <td>${consult.doctor}</td>
            <td>${consult.diagnosis}</td>
            <td>${consult.prescription}</td>
            <td>${consult.followup}</td>
        </tr>
    `
    )
    .join("");
}

// Load medical timeline
function loadMedicalTimeline(timelineData) {
  const timeline = document.getElementById("medicalTimeline");
  if (!timeline) return;

  timeline.innerHTML = timelineData
    .map(
      (item) => `
        <div class="timeline-item">
            <div class="timeline-date">${item.date}</div>
            <div class="timeline-content">
                <h4>${item.event}</h4>
                <p>${item.details}</p>
            </div>
        </div>
    `
    )
    .join("");
}

// Setup search functionality
function setupRecordSearch() {
  const searchInput = document.getElementById("recordSearch");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase();
      const recordCards = document.querySelectorAll(".record-card");

      recordCards.forEach((card) => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(searchTerm) ? "block" : "none";
      });
    });
  }
}

// Setup action buttons
function setupActionButtons() {
  // Vitals history button
  const vitalsBtn = document.getElementById("vitalsBtn");
  if (vitalsBtn) {
    vitalsBtn.addEventListener("click", viewVitalsHistory);
  }

  // Refer button
  const referBtn = document.getElementById("referBtn");
  if (referBtn) {
    referBtn.addEventListener("click", referThisPatient);
  }
}

// View vitals history
function viewVitalsHistory() {
  const vitalsHistoryModal = document.getElementById("vitalsHistoryModal");
  if (!vitalsHistoryModal) return;

  // Load vitals history
  const vitalsHistoryBody = document.getElementById("vitalsHistoryBody");
  if (vitalsHistoryBody) {
    const history = [
      {
        date: "2025-04-15",
        bp: "120/80",
        temp: "36.8",
        pulse: "72",
        oxygen: "98",
        recordedBy: "Nurse Sarah",
      },
      {
        date: "2025-03-20",
        bp: "118/78",
        temp: "37.0",
        pulse: "75",
        oxygen: "97",
        recordedBy: "Nurse Mike",
      },
      {
        date: "2025-02-10",
        bp: "122/82",
        temp: "36.7",
        pulse: "70",
        oxygen: "99",
        recordedBy: "Nurse Sarah",
      },
    ];

    vitalsHistoryBody.innerHTML = history
      .map(
        (vital) => `
            <tr>
                <td>${vital.date}</td>
                <td>${vital.bp}</td>
                <td>${vital.temp}</td>
                <td>${vital.pulse}</td>
                <td>${vital.oxygen}%</td>
                <td>${vital.recordedBy}</td>
            </tr>
        `
      )
      .join("");
  }

  vitalsHistoryModal.classList.add("active");
}

// Refer this patient
function referThisPatient() {
  window.location.href = "Patient Referral Page.html";
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", initPatientRecords);
