// Record Vitals Page JavaScript

// Sample vitals history
const vitalsHistory = [
  {
    patient: "Samuel Okoye",
    bp: "120/80",
    temp: "36.8",
    pulse: "72",
    oxygen: "98",
    recordedBy: "Nurse Sarah",
    time: "Today, 9:45 AM",
  },
  {
    patient: "Ade Bayo",
    bp: "118/78",
    temp: "37.0",
    pulse: "75",
    oxygen: "97",
    recordedBy: "Nurse Sarah",
    time: "Today, 9:30 AM",
  },
  {
    patient: "Ahmed Musa",
    bp: "125/82",
    temp: "36.9",
    pulse: "70",
    oxygen: "99",
    recordedBy: "Nurse Mike",
    time: "Yesterday, 2:15 PM",
  },
  {
    patient: "Chioma Okoro",
    bp: "115/75",
    temp: "36.7",
    pulse: "68",
    oxygen: "98",
    recordedBy: "Nurse Sarah",
    time: "Yesterday, 10:30 AM",
  },
];

// Initialize record vitals page
function initRecordVitals() {
  // Load vitals history
  loadVitalsHistory();

  // Setup BMI calculation
  setupBMICalculation();

  // Setup form events
  setupFormEvents();

  // Set current date/time
  setCurrentDateTime();
}

// Load vitals history
function loadVitalsHistory() {
  const historyBody = document.getElementById("vitalsHistory");
  if (!historyBody) return;

  historyBody.innerHTML = "";

  vitalsHistory.forEach((vital) => {
    const row = document.createElement("tr");

    row.innerHTML = `
            <td><strong>${vital.patient}</strong></td>
            <td>${vital.bp}</td>
            <td>${vital.temp}</td>
            <td>${vital.pulse}</td>
            <td>${vital.oxygen}%</td>
            <td>${vital.recordedBy}</td>
            <td>${vital.time}</td>
        `;

    historyBody.appendChild(row);
  });
}

// Setup BMI calculation
function setupBMICalculation() {
  const weightInput = document.getElementById("weight");
  const heightInput = document.getElementById("height");
  const bmiInput = document.getElementById("bmi");

  if (weightInput && heightInput && bmiInput) {
    weightInput.addEventListener("input", calculateBMI);
    heightInput.addEventListener("input", calculateBMI);
  }
}

// Calculate BMI
function calculateBMI() {
  const weight = parseFloat(document.getElementById("weight").value);
  const height = parseFloat(document.getElementById("height").value);

  if (weight && height && height > 0) {
    const heightInMeters = height / 100; // Convert cm to meters
    const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
    document.getElementById("bmi").value = bmi;
  }
}

// Setup form events
function setupFormEvents() {
  // Save vitals button
  const saveBtn = document.querySelector(".btn-save");
  if (saveBtn) {
    saveBtn.addEventListener("click", saveVitals);
  }

  // Save and refer button
  const saveReferBtn = document.querySelector('[onclick*="saveAndRefer"]');
  if (saveReferBtn) {
    saveReferBtn.addEventListener("click", saveAndRefer);
  }

  // Reset button
  const resetBtn = document.querySelector(".btn-cancel");
  if (resetBtn) {
    resetBtn.addEventListener("click", resetForm);
  }
}

// Set current date/time
function setCurrentDateTime() {
  const vitalsDate = document.getElementById("vitalsDate");
  if (vitalsDate) {
    const now = new Date();
    const localDateTime = new Date(
      now.getTime() - now.getTimezoneOffset() * 60000
    )
      .toISOString()
      .slice(0, 16);
    vitalsDate.value = localDateTime;
  }
}

// Save vitals
function saveVitals() {
  const patientSelect = document.getElementById("patientSelect");
  const systolic = document.getElementById("systolic").value;
  const diastolic = document.getElementById("diastolic").value;
  const temperature = document.getElementById("temperature").value;
  const pulseRate = document.getElementById("pulseRate").value;

  if (
    !patientSelect.value ||
    !systolic ||
    !diastolic ||
    !temperature ||
    !pulseRate
  ) {
    alert("Please fill in all required vitals fields");
    return;
  }

  const patientName = patientSelect.options[patientSelect.selectedIndex].text;
  const bp = `${systolic}/${diastolic}`;

  alert(
    `Vitals saved for ${patientName}\nBlood Pressure: ${bp}\nTemperature: ${temperature}°C\nPulse: ${pulseRate} bpm`
  );

  // Reset form
  resetForm();

  // Refresh history
  loadVitalsHistory();
}

// Save and refer
function saveAndRefer() {
  saveVitals();
  setTimeout(() => {
    window.location.href = "Patient Referral Page.html";
  }, 1000);
}

// Reset form
function resetForm() {
  document.getElementById("patientSelect").value = "";
  setCurrentDateTime();
  document.getElementById("systolic").value = "";
  document.getElementById("diastolic").value = "";
  document.getElementById("temperature").value = "";
  document.getElementById("pulseRate").value = "";
  document.getElementById("respiratoryRate").value = "";
  document.getElementById("oxygenSaturation").value = "";
  document.getElementById("weight").value = "";
  document.getElementById("height").value = "";
  document.getElementById("bmi").value = "";
  document.getElementById("notes").value = "";
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", initRecordVitals);
