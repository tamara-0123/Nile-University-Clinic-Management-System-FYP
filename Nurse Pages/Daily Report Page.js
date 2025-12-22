// Daily Report Page JavaScript

// Sample daily patients data
const dailyPatients = [
  {
    id: "2025-001",
    name: "Samuel Okoye",
    timeIn: "08:30",
    timeOut: "09:15",
    waitTime: "15 min",
    condition: "Fever",
    doctor: "Dr. Umar",
    status: "completed",
  },
  {
    id: "2025-002",
    name: "Ade Bayo",
    timeIn: "09:00",
    timeOut: "09:45",
    waitTime: "25 min",
    condition: "Headache",
    doctor: "Dr. Fatima",
    status: "completed",
  },
  {
    id: "2025-003",
    name: "Ahmed Musa",
    timeIn: "09:30",
    timeOut: "10:20",
    waitTime: "30 min",
    condition: "Stomach Pain",
    doctor: "Dr. Samuel",
    status: "completed",
  },
  {
    id: "2025-004",
    name: "Chioma Okoro",
    timeIn: "10:00",
    timeOut: "10:40",
    waitTime: "20 min",
    condition: "Common Cold",
    doctor: "Dr. Umar",
    status: "completed",
  },
  {
    id: "2025-005",
    name: "Ruqqaiya Rita",
    timeIn: "10:30",
    timeOut: "11:15",
    waitTime: "25 min",
    condition: "Injury",
    doctor: "Dr. Grace",
    status: "completed",
  },
  {
    id: "2025-006",
    name: "Fatima Ahmed",
    timeIn: "11:00",
    timeOut: "",
    waitTime: "45 min",
    condition: "Allergy",
    doctor: "Dr. Samuel",
    status: "in-progress",
  },
  {
    id: "2025-007",
    name: "Samuel Ade",
    timeIn: "11:30",
    timeOut: "",
    waitTime: "30 min",
    condition: "Fever",
    doctor: "",
    status: "waiting",
  },
  {
    id: "2025-008",
    name: "Grace Okafor",
    timeIn: "12:00",
    timeOut: "",
    waitTime: "15 min",
    condition: "Headache",
    doctor: "",
    status: "checked-in",
  },
];

// Initialize daily report page
function initDailyReport() {
  // Initialize charts
  initializeCharts();

  // Load daily patients
  loadDailyPatients();

  // Setup date selector
  setupDateSelector();

  // Setup report events
  setupReportEvents();

  // Setup modal events
  setupModalEvents();
}

// Initialize charts
function initializeCharts() {
  // Patient Flow Chart
  const patientFlowCtx = document.getElementById("patientFlowChart");
  if (patientFlowCtx) {
    new Chart(patientFlowCtx.getContext("2d"), {
      type: "line",
      data: {
        labels: [
          "8 AM",
          "9 AM",
          "10 AM",
          "11 AM",
          "12 PM",
          "1 PM",
          "2 PM",
          "3 PM",
        ],
        datasets: [
          {
            label: "Patients",
            data: [2, 5, 8, 12, 10, 6, 4, 2],
            borderColor: "#0056b3",
            backgroundColor: "rgba(0, 86, 179, 0.1)",
            borderWidth: 2,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Number of Patients",
            },
          },
          x: {
            title: {
              display: true,
              text: "Time of Day",
            },
          },
        },
      },
    });
  }

  // Conditions Chart
  const conditionsCtx = document.getElementById("conditionsChart");
  if (conditionsCtx) {
    new Chart(conditionsCtx.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: ["Fever/Cold", "Headache", "Stomach", "Injury", "Other"],
        datasets: [
          {
            data: [8, 5, 4, 3, 8],
            backgroundColor: [
              "#0056b3",
              "#28a745",
              "#ffc107",
              "#dc3545",
              "#6c757d",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    });
  }

  // Wait Time Chart
  const waitTimeCtx = document.getElementById("waitTimeChart");
  if (waitTimeCtx) {
    new Chart(waitTimeCtx.getContext("2d"), {
      type: "bar",
      data: {
        labels: ["<15 min", "15-30 min", "30-45 min", "45-60 min", ">60 min"],
        datasets: [
          {
            label: "Number of Patients",
            data: [10, 8, 5, 3, 2],
            backgroundColor: "#0056b3",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Number of Patients",
            },
          },
          x: {
            title: {
              display: true,
              text: "Wait Time",
            },
          },
        },
      },
    });
  }

  // Referral Chart
  const referralCtx = document.getElementById("referralChart");
  if (referralCtx) {
    new Chart(referralCtx.getContext("2d"), {
      type: "pie",
      data: {
        labels: ["Completed", "In Progress", "Pending", "Cancelled"],
        datasets: [
          {
            data: [12, 5, 3, 1],
            backgroundColor: ["#28a745", "#ffc107", "#0056b3", "#dc3545"],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    });
  }
}

// Load daily patients
function loadDailyPatients() {
  const table = document.getElementById("dailyPatientsTable");
  if (!table) return;

  table.innerHTML = dailyPatients
    .map((patient) => {
      let statusClass = "";
      let statusText = "";
      switch (patient.status) {
        case "completed":
          statusClass = "status-completed";
          statusText = "Completed";
          break;
        case "in-progress":
          statusClass = "status-checked-in";
          statusText = "In Progress";
          break;
        case "waiting":
          statusClass = "status-waiting";
          statusText = "Waiting";
          break;
        case "checked-in":
          statusClass = "status-checked-in";
          statusText = "Checked In";
          break;
      }

      return `
            <tr>
                <td>${patient.id}</td>
                <td><strong>${patient.name}</strong></td>
                <td>${patient.timeIn}</td>
                <td>${patient.timeOut || "--"}</td>
                <td>${patient.waitTime}</td>
                <td>${patient.condition}</td>
                <td>${patient.doctor || "--"}</td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
            </tr>
        `;
    })
    .join("");
}

// Setup date selector
function setupDateSelector() {
  const reportDate = document.getElementById("reportDate");
  if (reportDate) {
    // Set today's date as default
    const today = new Date().toISOString().split("T")[0];
    reportDate.value = today;

    reportDate.addEventListener("change", function () {
      generateReport();
    });
  }

  // Date range selector in export modal
  const exportRange = document.getElementById("exportRange");
  if (exportRange) {
    exportRange.addEventListener("change", function () {
      const customRangeGroup = document.getElementById("customRangeGroup");
      if (this.value === "custom") {
        customRangeGroup.style.display = "block";
      } else {
        customRangeGroup.style.display = "none";
      }
    });
  }
}

// Setup report events
function setupReportEvents() {
  // Generate report button
  const generateBtn = document.querySelector('[onclick*="generateReport"]');
  if (generateBtn) {
    generateBtn.addEventListener("click", generateReport);
  }

  // Print report button
  const printBtn = document.querySelector('[onclick*="printReport"]');
  if (printBtn) {
    printBtn.addEventListener("click", printReport);
  }

  // Previous date button
  const prevBtn = document.querySelector('[onclick*="changeReportDate(-1)"]');
  if (prevBtn) {
    prevBtn.addEventListener("click", () => changeReportDate(-1));
  }

  // Next date button
  const nextBtn = document.querySelector('[onclick*="changeReportDate(1)"]');
  if (nextBtn) {
    nextBtn.addEventListener("click", () => changeReportDate(1));
  }

  // Save report button
  const saveBtn = document.querySelector('[onclick*="saveReport"]');
  if (saveBtn) {
    saveBtn.addEventListener("click", saveReport);
  }

  // Clear notes button
  const clearBtn = document.querySelector('[onclick*="clearNotes"]');
  if (clearBtn) {
    clearBtn.addEventListener("click", clearNotes);
  }
}

// Setup modal events
function setupModalEvents() {
  // Export modal buttons
  const exportBtns = document.querySelectorAll('[onclick*="exportReport"]');
  exportBtns.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      const format = this.getAttribute("onclick").match(/\('(.*?)'\)/)[1];
      showExportModal(format);
    });
  });

  // Compare reports button
  const compareBtn = document.querySelector('[onclick*="compareReports"]');
  if (compareBtn) {
    compareBtn.addEventListener("click", showCompareModal);
  }

  // Email report button
  const emailBtn = document.querySelector('[onclick*="emailReport"]');
  if (emailBtn) {
    emailBtn.addEventListener("click", showEmailModal);
  }
}

// Change report date
function changeReportDate(direction) {
  const reportDate = document.getElementById("reportDate");
  if (!reportDate) return;

  const currentDate = new Date(reportDate.value);
  currentDate.setDate(currentDate.getDate() + direction);

  reportDate.value = currentDate.toISOString().split("T")[0];
  generateReport();
}

// Generate report
function generateReport() {
  const reportDate = document.getElementById("reportDate");
  if (!reportDate) return;

  const date = new Date(reportDate.value);
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" });

  // Show loading state
  const sections = document.querySelectorAll(".section");
  sections.forEach((section) => {
    section.classList.add("loading");
  });

  // Simulate API call delay
  setTimeout(() => {
    // Update page title
    document.title = `Daily Report - ${reportDate.value} - Nile University CMS`;

    // Update stats based on date
    const stats = {
      "2025-04-15": {
        total: 28,
        waitTime: "25 min",
        consultations: 22,
        prescriptions: 18,
      },
      "2025-04-14": {
        total: 25,
        waitTime: "20 min",
        consultations: 20,
        prescriptions: 15,
      },
      "2025-04-13": {
        total: 22,
        waitTime: "22 min",
        consultations: 18,
        prescriptions: 14,
      },
    };

    const dayStats = stats[reportDate.value] || {
      total: 20,
      waitTime: "24 min",
      consultations: 16,
      prescriptions: 12,
    };

    // Update stats cards
    const countElements = document.querySelectorAll(".stat-card .count");
    if (countElements.length >= 4) {
      countElements[0].textContent = dayStats.total;
      countElements[1].textContent = dayStats.waitTime;
      countElements[2].textContent = dayStats.consultations;
      countElements[3].textContent = dayStats.prescriptions;
    }

    // Remove loading state
    sections.forEach((section) => {
      section.classList.remove("loading");
    });

    // Show success message
    showAlert(
      "success",
      `Report generated for ${dayName}, ${reportDate.value}`
    );
  }, 1000);
}

// Print report
function printReport() {
  window.print();
}

// Show export modal
function showExportModal(format) {
  const modal = document.getElementById("exportModal");
  if (modal) {
    document.getElementById("exportFormat").value = format;
    modal.classList.add("active");
  }
}

// Show compare modal
function showCompareModal() {
  const modal = document.getElementById("compareModal");
  if (modal) {
    modal.classList.add("active");
  }
}

// Show email modal
function showEmailModal() {
  const modal = document.getElementById("emailModal");
  if (modal) {
    // Set default subject with today's date
    const today =
      document.getElementById("reportDate").value ||
      new Date().toISOString().split("T")[0];
    document.getElementById(
      "emailSubject"
    ).value = `Daily Clinic Report - ${today}`;
    modal.classList.add("active");
  }
}

// Close export modal
function closeExportModal() {
  document.getElementById("exportModal").classList.remove("active");
}

// Close compare modal
function closeCompareModal() {
  document.getElementById("compareModal").classList.remove("active");
}

// Close email modal
function closeEmailModal() {
  document.getElementById("emailModal").classList.remove("active");
}

// Confirm export
function confirmExport() {
  const format = document.getElementById("exportFormat").value;
  const range = document.getElementById("exportRange").value;

  alert(`Exporting report as ${format} for ${range}...`);
  closeExportModal();

  // Simulate export process
  setTimeout(() => {
    alert(`Report exported successfully as ${format.toUpperCase()} file`);
  }, 1500);
}

// Generate comparison
function generateComparison() {
  const date1 = document.getElementById("compareDate1").value;
  const date2 = document.getElementById("compareDate2").value;

  alert(`Generating comparison between ${date1} and ${date2}...`);
  closeCompareModal();

  // In the system, this would show a comparison chart
  setTimeout(() => {
    showAlert("success", `Comparison generated for ${date1} vs ${date2}`);
  }, 1000);
}

// Send email report
function sendEmailReport() {
  const email = document.getElementById("emailTo").value;
  const subject = document.getElementById("emailSubject").value;

  if (!email) {
    alert("Please enter recipient email address");
    return;
  }

  alert(`Sending report to ${email}...`);
  closeEmailModal();

  setTimeout(() => {
    showAlert("success", `Report sent successfully to ${email}`);
  }, 1500);
}

// Clear notes
function clearNotes() {
  if (confirm("Clear all notes?")) {
    document.getElementById("reportNotes").value = "";
  }
}

// Save report
function saveReport() {
  const notes = document.getElementById("reportNotes").value;
  const date = document.getElementById("reportDate").value;

  // In the system, this would save to database
  localStorage.setItem(`clinic-report-${date}`, notes);

  showAlert("success", "Report saved successfully");
}

// Show alert
function showAlert(type, message) {
  // Create alert element
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type}`;
  alertDiv.innerHTML = `
        <i class="fas fa-${
          type === "success" ? "check-circle" : "info-circle"
        }"></i>
        <span>${message}</span>
        <button class="alert-close" onclick="this.parentElement.remove()">&times;</button>
    `;

  // Add close button styles
  const style = document.createElement("style");
  style.textContent = `
        .alert-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: inherit;
            margin-left: auto;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    `;
  document.head.appendChild(style);

  // Add to page
  const container = document.querySelector(".container");
  if (container) {
    container.prepend(alertDiv);
  }

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (alertDiv.parentElement) {
      alertDiv.remove();
    }
  }, 5000);
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", initDailyReport);
