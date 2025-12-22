// Patient Referral Page JavaScript

// Sample doctors data
const doctors = [
  {
    id: "doc1",
    name: "Dr. Samuel Johnson",
    specialty: "General Physician",
    status: "available",
    patients: 3,
    maxPatients: 8,
  },
  {
    id: "doc2",
    name: "Dr. Fatima Bello",
    specialty: "General Physician",
    status: "busy",
    patients: 7,
    maxPatients: 8,
  },
  {
    id: "doc3",
    name: "Dr. Umar Abdullahi",
    specialty: "Pediatrics",
    status: "available",
    patients: 2,
    maxPatients: 6,
  },
  {
    id: "doc4",
    name: "Dr. Grace Okon",
    specialty: "Dermatology",
    status: "available",
    patients: 4,
    maxPatients: 6,
  },
];

// Sample active referrals
const activeReferrals = [
  {
    patient: "Samuel Okoye",
    condition: "Fever",
    urgency: "urgent",
    doctor: "Dr. Umar",
    time: "10:15 AM",
    status: "pending",
  },
  {
    patient: "Ade Bayo",
    condition: "Headache",
    urgency: "routine",
    doctor: "Dr. Fatima",
    time: "10:30 AM",
    status: "in-progress",
  },
  {
    patient: "Ahmed Musa",
    condition: "Stomach Pain",
    urgency: "routine",
    doctor: "Dr. Samuel",
    time: "09:45 AM",
    status: "completed",
  },
  {
    patient: "Chioma Okoro",
    condition: "Common Cold",
    urgency: "routine",
    doctor: "Dr. Umar",
    time: "09:30 AM",
    status: "completed",
  },
];

// Sample doctors availability
const doctorsAvailability = [
  {
    name: "Dr. Samuel Johnson",
    slots: [
      "09:00-10:00",
      "10:00-11:00",
      "11:00-12:00",
      "14:00-15:00",
      "15:00-16:00",
    ],
  },
  {
    name: "Dr. Fatima Bello",
    slots: ["09:00-10:00", "11:00-12:00", "14:00-15:00", "15:00-16:00"],
  },
  {
    name: "Dr. Umar Abdullahi",
    slots: ["10:00-11:00", "11:00-12:00", "14:00-15:00"],
  },
  {
    name: "Dr. Grace Okon",
    slots: ["09:00-10:00", "10:00-11:00", "15:00-16:00"],
  },
];

// Initialize patient referral page
function initPatientReferral() {
  // Load doctors list
  loadDoctorsList();

  // Load active referrals
  loadActiveReferrals();

  // Load doctors availability
  loadDoctorsAvailability();

  // Setup form events
  setupFormEvents();

  // Setup quick action buttons
  setupQuickActions();
}

// Load doctors list
function loadDoctorsList() {
  const doctorsList = document.getElementById("doctorsList");
  if (!doctorsList) return;

  doctorsList.innerHTML = doctors
    .map((doctor) => {
      const statusClass = `status-${doctor.status}`;
      const statusText =
        doctor.status === "available"
          ? "Available"
          : doctor.status === "busy"
          ? "Busy"
          : "Offline";

      return `
            <div class="doctor-card" onclick="selectDoctor('${doctor.id}')">
                <div class="doctor-header">
                    <div class="doctor-avatar">
                        <i class="fas fa-user-md"></i>
                    </div>
                    <div class="doctor-info">
                        <h4>${doctor.name}</h4>
                        <p>${doctor.specialty}</p>
                    </div>
                </div>
                <div class="doctor-status">
                    <span><span class="status-indicator ${statusClass}"></span> ${statusText}</span>
                    <span>${doctor.patients}/${doctor.maxPatients} patients</span>
                </div>
            </div>
        `;
    })
    .join("");
}

// Select doctor
function selectDoctor(doctorId) {
  // Remove selected class from all doctor cards
  document.querySelectorAll(".doctor-card").forEach((card) => {
    card.classList.remove("selected");
  });

  // Add selected class to clicked card
  event.currentTarget.classList.add("selected");
}

// Load active referrals
function loadActiveReferrals() {
  const table = document.getElementById("activeReferralsTable");
  if (!table) return;

  table.innerHTML = activeReferrals
    .map((ref) => {
      let statusClass = "";
      let statusText = "";
      switch (ref.status) {
        case "pending":
          statusClass = "status-waiting";
          statusText = "Pending";
          break;
        case "in-progress":
          statusClass = "status-checked-in";
          statusText = "In Progress";
          break;
        case "completed":
          statusClass = "status-completed";
          statusText = "Completed";
          break;
      }

      let urgencyClass =
        ref.urgency === "urgent" ? "status-waiting" : "status-checked-in";

      return `
            <tr>
                <td><strong>${ref.patient}</strong></td>
                <td>${ref.condition}</td>
                <td><span class="status ${urgencyClass}">${ref.urgency}</span></td>
                <td>${ref.doctor}</td>
                <td>${ref.time}</td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="action-btn-small" onclick="viewReferralDetails()">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="action-btn-small secondary" onclick="cancelReferral()">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </td>
            </tr>
        `;
    })
    .join("");
}

// Load doctors availability
function loadDoctorsAvailability() {
  const availabilityDiv = document.getElementById("doctorsAvailability");
  if (!availabilityDiv) return;

  availabilityDiv.innerHTML = doctorsAvailability
    .map(
      (doc) => `
        <div class="availability-card">
            <div class="availability-header">
                <h4>${doc.name}</h4>
                <span class="status status-checked-in">Available</span>
            </div>
            <div class="availability-slots">
                ${doc.slots
                  .map(
                    (slot) => `<span class="time-slot available">${slot}</span>`
                  )
                  .join("")}
                <span class="time-slot booked">12:00-14:00</span>
                <span class="time-slot">16:00-17:00</span>
            </div>
        </div>
    `
    )
    .join("");
}

// Setup form events
function setupFormEvents() {
  // Submit referral button
  const submitBtn = document.querySelector(".btn-save");
  if (submitBtn) {
    submitBtn.addEventListener("click", submitReferral);
  }

  // Reset form button
  const resetBtn = document.querySelector(".btn-cancel");
  if (resetBtn) {
    resetBtn.addEventListener("click", resetReferralForm);
  }
}

// Setup quick actions
function setupQuickActions() {
  // Quick referral buttons
  const quickActions = document.querySelectorAll(".action-btn");
  quickActions.forEach((btn) => {
    const action = btn.querySelector("span").textContent;
    if (action.includes("Urgent Referral")) {
      btn.addEventListener("click", () => quickReferral("urgent"));
    } else if (action.includes("Walk-in Patient")) {
      btn.addEventListener("click", () => quickReferral("walkin"));
    } else if (action.includes("View All Referrals")) {
      btn.addEventListener("click", viewAllReferrals);
    } else if (action.includes("Print Referral List")) {
      btn.addEventListener("click", printReferralList);
    }
  });
}

// Submit referral
function submitReferral() {
  const patientSelect = document.getElementById("referPatientSelect");
  const condition = document.getElementById("patientCondition").value;
  const urgency = document.getElementById("urgencyLevel").value;
  const reason = document.getElementById("referralReason").value;
  const notes = document.getElementById("clinicalNotes").value;

  if (!patientSelect.value || !condition) {
    alert("Please fill in all required fields");
    return;
  }

  const selectedDoctor = document.querySelector(".doctor-card.selected");
  if (!selectedDoctor) {
    alert("Please select a doctor");
    return;
  }

  // Show confirmation modal
  const modal = document.getElementById("referralConfirmModal");
  const message = document.getElementById("referralConfirmMessage");
  const details = document.getElementById("referralDetails");

  const patientName = patientSelect.options[patientSelect.selectedIndex].text;
  const doctorName = selectedDoctor.querySelector("h4").textContent;

  message.textContent = `Patient ${
    patientName.split(" - ")[0]
  } has been referred to ${doctorName}`;

  details.innerHTML = `
        <div class="alert alert-info">
            <i class="fas fa-info-circle"></i>
            <div>
                <p><strong>Patient:</strong> ${patientName.split(" - ")[0]}</p>
                <p><strong>Doctor:</strong> ${doctorName}</p>
                <p><strong>Condition:</strong> ${condition}</p>
                <p><strong>Urgency:</strong> ${urgency}</p>
                <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
            </div>
        </div>
    `;

  modal.classList.add("active");
}

// Reset referral form
function resetReferralForm() {
  document.getElementById("referPatientSelect").value = "";
  document.getElementById("patientCondition").value = "";
  document.getElementById("urgencyLevel").value = "routine";
  document.getElementById("referralReason").value = "consultation";
  document.getElementById("clinicalNotes").value = "";

  document.querySelectorAll(".doctor-card").forEach((card) => {
    card.classList.remove("selected");
  });
}

// Quick referral
function quickReferral(type) {
  if (type === "urgent") {
    document.getElementById("urgencyLevel").value = "emergency";
    document.getElementById("referralReason").value = "emergency";
    alert("Urgent referral mode activated. Please select patient and doctor.");
  } else if (type === "walkin") {
    document.getElementById("referPatientSelect").value = "004"; // Walk-in patient
    document.getElementById("referralReason").value = "followup";
    alert("Walk-in patient selected. Please fill in condition details.");
  }
}

// View all referrals
function viewAllReferrals() {
  alert(
    "This would show all referrals. In the system, this would load a comprehensive list."
  );
}

// Print referral list
function printReferralList() {
  window.print();
}

// View referral details
function viewReferralDetails() {
  alert(
    "Viewing referral details. In the system, this would show detailed information."
  );
}

// Cancel referral
function cancelReferral() {
  if (confirm("Are you sure you want to cancel this referral?")) {
    alert("Referral cancelled.");
    // Refresh the list
    loadActiveReferrals();
  }
}

// Close referral modal
function closeReferralModal() {
  document.getElementById("referralConfirmModal").classList.remove("active");
  resetReferralForm();
  // Refresh the list
  loadActiveReferrals();
}

// Print referral
function printReferral() {
  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
        <html>
        <head>
            <title>Referral Slip - Nile University Clinic</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .clinic-name { color: #0056b3; font-size: 24px; font-weight: bold; }
                .title { font-size: 18px; margin: 10px 0; }
                .referral-details { margin: 20px 0; padding: 20px; border: 1px solid #ccc; }
                .detail-row { margin: 10px 0; display: flex; }
                .detail-label { font-weight: bold; width: 150px; }
                .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
                .signature { margin-top: 50px; border-top: 1px solid #000; width: 300px; text-align: center; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="clinic-name">Nile University Clinic</div>
                <div class="title">PATIENT REFERRAL SLIP</div>
                <div>Date: ${new Date().toLocaleDateString()}</div>
            </div>
            <div class="referral-details">
                <div class="detail-row">
                    <div class="detail-label">Patient Name:</div>
                    <div>${
                      document
                        .getElementById("referPatientSelect")
                        .options[
                          document.getElementById("referPatientSelect")
                            .selectedIndex
                        ].text.split(" - ")[0]
                    }</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Referred To:</div>
                    <div>${
                      document.querySelector(".doctor-card.selected")
                        ? document.querySelector(".doctor-card.selected h4")
                            .textContent
                        : "Doctor"
                    }</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Condition:</div>
                    <div>${
                      document.getElementById("patientCondition").value
                    }</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Urgency:</div>
                    <div>${
                      document.getElementById("urgencyLevel").options[
                        document.getElementById("urgencyLevel").selectedIndex
                      ].text
                    }</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Clinical Notes:</div>
                    <div>${document.getElementById("clinicalNotes").value}</div>
                </div>
            </div>
            <div class="footer">
                <p>This referral was generated by the Nile University Clinic Management System</p>
                <p>Referral ID: REF-${Date.now().toString().slice(-6)}</p>
                <div class="signature">
                    <p>Signature of Referring Nurse</p>
                </div>
            </div>
        </body>
        </html>
    `);
  printWindow.document.close();
  printWindow.print();
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", initPatientReferral);
