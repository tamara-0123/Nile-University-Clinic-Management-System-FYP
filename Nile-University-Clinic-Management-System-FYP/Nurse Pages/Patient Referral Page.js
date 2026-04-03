
document.addEventListener("DOMContentLoaded", () => {
    loadVitalsHistory();
    setupBMICalculation();
    setupButtons();
    setCurrentDateTime();
});

function loadVitalsHistory() {
  const historyBody = document.getElementById("vitalsHistory");
  if (!historyBody) return;

  historyBody.innerHTML = "";

  vitalsHistory.forEach((vital) => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td><strong>${vital.patient}</strong></td>
        <td>${vital.bp}</td>
        <td>${vital.temp}°C</td>
        <td>${vital.pulse}</td>
        <td>${vital.oxygen}%</td>
        <td>${vital.recordedBy}</td>
        <td>${vital.time}</td>
    `;
    historyBody.appendChild(row);
  });
}

// BMI Calculation Logic
function setupBMICalculation() {
  const weightInput = document.getElementById("weight");
  const heightInput = document.getElementById("height");

  if (weightInput && heightInput) {
    weightInput.addEventListener("input", calculateBMI);
    heightInput.addEventListener("input", calculateBMI);
  }
}

function calculateBMI() {
  const weight = parseFloat(document.getElementById("weight").value);
  const height = parseFloat(document.getElementById("height").value);
  const bmiField = document.getElementById("bmi");

  if (weight > 0 && height > 0) {
    const heightInMeters = height / 100; 
    const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
    bmiField.value = bmi;
  } else {
    bmiField.value = "";
  }
}

// Setup Buttons (Using Event Listeners, not onclick)
function setupButtons() {
    const saveBtn = document.getElementById('saveBtn');
    const referBtn = document.getElementById('referBtn');
    const resetBtn = document.getElementById('resetBtn');

    if(saveBtn) saveBtn.addEventListener('click', saveVitals);
    if(referBtn) referBtn.addEventListener('click', saveAndRefer);
    if(resetBtn) resetBtn.addEventListener('click', resetForm);
}

// Set Date Time to Now
function setCurrentDateTime() {
  const vitalsDate = document.getElementById("vitalsDate");
  if (vitalsDate) {
    const now = new Date();
    // Offset for local timezone
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    vitalsDate.value = localDateTime;
  }
}

// Save Logic
function saveVitals() {
  const patientSelect = document.getElementById("patientSelect");
  const sys = document.getElementById("systolic").value;
  const dia = document.getElementById("diastolic").value;
  const temp = document.getElementById("temperature").value; // Fixed ID spelling
  const pulse = document.getElementById("pulseRate").value;

  if (!patientSelect.value || !sys || !dia || !temp || !pulse) {
    alert("Please fill in Patient, BP, Temperature, and Pulse.");
    return false;
  }

  const patientName = patientSelect.options[patientSelect.selectedIndex].text.split('(')[0].trim();
  
  // Add to local history array (Mock DB update)
  vitalsHistory.unshift({
      patient: patientName,
      bp: `${sys}/${dia}`,
      temp: temp,
      pulse: pulse,
      oxygen: document.getElementById("oxygenSaturation").value || "--",
      recordedBy: "You",
      time: "Just now"
  });

  alert(`Vitals saved successfully for ${patientName}`);
  
  resetForm();
  loadVitalsHistory();
  return true;
}

// Save & Refer
function saveAndRefer() {
  if(saveVitals()) {
      setTimeout(() => {
        // Redirect to Referral Page
        window.location.href = "Patient Referral Page.html"; 
      }, 500);
  }
}

// Reset
function resetForm() {
  document.getElementById("patientSelect").value = "";
  setCurrentDateTime();
  
  // Clear all inputs except date
  const inputs = document.querySelectorAll('.vitals-grid input');
  inputs.forEach(i => i.value = "");
  
  document.getElementById("notes").value = "";
}