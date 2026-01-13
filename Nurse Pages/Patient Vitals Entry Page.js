// Set copyright year
document.getElementById('year').textContent = new Date().getFullYear();

// Set default datetime
document.getElementById('vitalsDate').valueAsDate = new Date();

// Calculate BMI when weight or height changes
document.getElementById('weight').addEventListener('change', calculateBMI);
document.getElementById('height').addEventListener('change', calculateBMI);

function calculateBMI() {
  const weight = parseFloat(document.getElementById('weight').value);
  const height = parseFloat(document.getElementById('height').value);
  
  if (weight && height) {
    const heightInMeters = height / 100;
    const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
    document.getElementById('bmi').value = bmi;
  }
}

function resetForm() {
  document.getElementById('patientSelect').value = '';
  document.getElementById('systolic').value = '';
  document.getElementById('diastolic').value = '';
  document.getElementById('temperature').value = '';
  document.getElementById('pulseRate').value = '';
  document.getElementById('respiratoryRate').value = '';
  document.getElementById('oxygenSat').value = '';
  document.getElementById('weight').value = '';
  document.getElementById('height').value = '';
  document.getElementById('bmi').value = '';
  document.getElementById('notes').value = '';
}

function saveVitals() {
  const patientId = document.getElementById('patientSelect').value;
  
  if (!patientId) {
    alert('Please select a patient');
    return;
  }
  
  const vitalsData = {
    patient: patientId,
    systolic: document.getElementById('systolic').value,
    diastolic: document.getElementById('diastolic').value,
    temperature: document.getElementById('temperature').value,
    pulseRate: document.getElementById('pulseRate').value,
    respiratoryRate: document.getElementById('respiratoryRate').value,
    oxygenSat: document.getElementById('oxygenSat').value,
    weight: document.getElementById('weight').value,
    height: document.getElementById('height').value,
    bmi: document.getElementById('bmi').value,
    notes: document.getElementById('notes').value,
    dateTime: document.getElementById('vitalsDate').value
  };
  
  alert('Vitals saved successfully!');
  resetForm();
}

function saveAndRefer() {
  saveVitals();
  window.location.href = 'Patient Referral Page.html';
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
