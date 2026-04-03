/******************************************************************
 * 1. HELPERS & AUTH
 ******************************************************************/
const qs = (sel) => document.querySelector(sel);
const qsa = (sel) => Array.from(document.querySelectorAll(sel));
const toastWrap = qs("#toastWrap");

// Fixed showToast function with better visibility
function showToast(message, type = 'success', timeout = 5000) {
  if (!toastWrap) {
    console.error("Toast wrap not found");
    return;
  }
  
  const t = document.createElement("div");
  t.className = "toast";
  
  // Set colors based on type
  const colors = {
    success: { bg: '#000000', icon: '' },
    error: { bg: '#000000', icon: ''},
    warning: { bg: '#000000',icon: '' },
    info: { bg: '#000000', icon: ''}
  };
  const color = colors[type] || colors.info;
  
  t.style.backgroundColor = color.bg;
  t.style.color = 'white';
  t.style.padding = '12px 20px';
  t.style.borderRadius = '8px';
  t.style.marginBottom = '10px';
  t.style.fontSize = '14px';
  t.style.fontWeight = '500';
  t.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  t.style.animation = 'slideIn 0.3s ease';
  t.style.position = 'relative';
  t.style.zIndex = '10000';
  t.style.fontFamily = "'Poppins', sans-serif";
  
  t.innerHTML = `<span style="margin-right: 8px; font-weight: bold;">${color.icon}</span>${message}`;
  
  toastWrap.appendChild(t);
  
  // Remove after timeout
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(8px)';
    t.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    setTimeout(() => {
      if (t.parentNode) t.remove();
    }, 400);
  }, timeout);
}

function checkAuthStatus() {
  const token = API_CONFIG.getToken();
  if (!token) {
    window.location.href = '../Shared pages/login.html';
  }
}

// Use API_CONFIG for all requests
async function makeRequest(url, options = {}) {
  try {
    // Use API_CONFIG.request which already handles base URL and auth
    const response = await API_CONFIG.request(url, options);
    return response;
  } catch (error) {
    console.error(`API Error (${url}):`, error);
    showToast(`Error: ${error.message}`, 'error', 4000);
    throw error;
  }
}

/******************************************************************
 * 2. STATE
 ******************************************************************/
let appointments = [];
let filteredAppointments = [];
let activeApptId = null;
let currentPatientData = null;
let currentConsultationId = null;
let currentVitals = { _id: null, bp: '', temp: '', pulse: '', weight: '' };
let currentPrescriptionList = [];
let currentFilter = 'all';
let currentSearchTerm = '';
let currentAdmissionId = null;
let isPatientAdmitted = false;
let currentDraftConsultationId = null;

// Common diagnosis list - Alphabetically arranged
const commonDiagnoses = [
  "Acute Asthma Exacerbation",
  "Acute Bronchitis",
  "Acute Gastroenteritis",
  "Acute Pharyngitis",
  "Acute Sinusitis",
  "Acute Tonsillitis",
  "Allergic Rhinitis",
  "Anemia",
  "Anxiety Disorder",
  "Arthritis",
  "Cellulitis",
  "Conjunctivitis",
  "COVID-19",
  "Dengue Fever",
  "Depression",
  "Dermatitis",
  "Diabetes Mellitus Type 2",
  "Eczema",
  "Fungal Infection",
  "Gout",
  "Hepatitis B",
  "HIV/AIDS",
  "Hypertension",
  "Influenza",
  "Insomnia",
  "Malaria",
  "Malnutrition",
  "Migraine",
  "Obesity",
  "Otitis Media",
  "Pneumonia",
  "Typhoid Fever",
  "Tuberculosis (TB)",
  "Upper Respiratory Tract Infection",
  "Urinary Tract Infection"
];

/******************************************************************
 * 3. API CALLS
 ******************************************************************/

async function loadAppointments() {
  try {
    const data = await makeRequest('/doctor/appointments');
    if (data.success) {
      appointments = data.appointments || [];
      filteredAppointments = [...appointments];
      applyFilters();
      
      const activeCount = appointments.filter(a => a.status !== 'completed').length;
      
      const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
      const metaDiv = document.querySelector('.meta');
      if (metaDiv) metaDiv.textContent = `Today • ${today} • ${activeCount} active patients`;
    } else {
      showToast("Failed to load appointments: " + (data.message || "Unknown error"), 'error');
    }
  } catch (error) {
    showToast("Error loading appointments: " + error.message, 'error');
  }
}

async function loadVitals(apptId, patientId) {
  try {
    const data = await makeRequest(`/doctor/vitals?appointmentId=${apptId}&patientId=${patientId}`);

    if (data.success) {
      let vitalsData = null;
      
      if (data.latest) {
        vitalsData = data.latest;
      } else if (data.vitals && Array.isArray(data.vitals) && data.vitals.length > 0) {
        vitalsData = data.vitals[0];
      } else if (data.vitals && !Array.isArray(data.vitals)) {
        vitalsData = data.vitals;
      }

      if (vitalsData) {
        currentVitals = {
          _id: vitalsData._id,
          bp: vitalsData.bp || '',
          temp: vitalsData.temperature || '',
          pulse: vitalsData.pulse || '',
          weight: vitalsData.weight || ''
        };

        const vitalsContent = qs("#vitalsContent");
        if (vitalsContent) {
          vitalsContent.innerHTML = `BP: ${currentVitals.bp} • Temp: ${currentVitals.temp}°C • Pulse: ${currentVitals.pulse || 'N/A'} • Weight: ${currentVitals.weight || 'N/A'}kg`;
        }
      } else {
        currentVitals = { _id: null, bp: '', temp: '', pulse: '', weight: '' };
        const vitalsContent = qs("#vitalsContent");
        if (vitalsContent) vitalsContent.textContent = "No vitals recorded for this session";
      }
    } else {
      currentVitals = { _id: null, bp: '', temp: '', pulse: '', weight: '' };
      const vitalsContent = qs("#vitalsContent");
      if (vitalsContent) vitalsContent.textContent = "No vitals recorded for this session";
    }
  } catch (err) {
    showToast("Error loading vitals: " + err.message, 'error');
    const vitalsContent = qs("#vitalsContent");
    if (vitalsContent) vitalsContent.textContent = "Error loading vitals";
  }
}

async function checkAdmissionStatus(appointmentId, patientId) {
  try {
    const response = await makeRequest(`/doctor/admission/status?appointmentId=${appointmentId}&patientId=${patientId}`);
    if (response.success && response.admission) {
      currentAdmissionId = response.admission._id;
      isPatientAdmitted = response.admission.isActive;
      return response.admission;
    }
    return null;
  } catch (error) {
    console.error("Error checking admission status:", error);
    return null;
  }
}

async function admitPatient() {
  if (!activeApptId || !currentPatientData) {
    showToast("Select an appointment first", 'warning');
    return;
  }

  const notesField = qs("#consultationNotes");
  if (!notesField || !notesField.value.trim()) {
    showToast("Please enter reason for admission in consultation notes", 'warning');
    if (notesField) notesField.focus();
    return;
  }

  const admitBtn = qs("#btnAdmit");
  if (!admitBtn) return;
  
  const originalText = admitBtn.textContent;
  admitBtn.textContent = "Admitting...";
  admitBtn.disabled = true;

  try {
    const admissionData = {
      patientId: currentPatientData.patient._id,
      appointmentId: activeApptId,
      reason: notesField.value.split('.')[0] + '.' || notesField.value
    };

    const response = await makeRequest('/doctor/admit', {
      method: 'POST',
      body: JSON.stringify(admissionData)
    });

    if (response.success) {
      currentAdmissionId = response.admission._id;
      isPatientAdmitted = true;
      
      const appointment = appointments.find(a => a._id === activeApptId);
      if (appointment) {
        appointment.status = 'admitted';
      }
      
      applyFilters();
      updateAdmitDischargeButton();
      showToast("Patient admitted successfully", 'success');
    } else {
      showToast("Failed to admit patient: " + (response.message || "Unknown error"), 'error');
    }
  } catch (error) {
    showToast("Error admitting patient: " + error.message, 'error');
  } finally {
    admitBtn.textContent = originalText;
    admitBtn.disabled = false;
  }
}

async function dischargePatient() {
  if (!currentAdmissionId) {
    showToast("No active admission found", 'warning');
    return;
  }

  if (!confirm("Are you sure you want to discharge this patient?")) {
    return;
  }

  const dischargeBtn = qs("#btnAdmit");
  if (!dischargeBtn) return;
  
  const originalText = dischargeBtn.textContent;
  dischargeBtn.textContent = "Discharging...";
  dischargeBtn.disabled = true;

  try {
    const response = await makeRequest(`/doctor/discharge/${currentAdmissionId}`, {
      method: 'PUT'
    });

    if (response.success) {
      isPatientAdmitted = false;
      currentAdmissionId = null;
      
      const appointment = appointments.find(a => a._id === activeApptId);
      if (appointment) {
        appointment.status = 'waiting';
      }
      
      applyFilters();
      updateAdmitDischargeButton();
      showToast("Patient discharged successfully", 'success');
    } else {
      showToast("Failed to discharge patient: " + (response.message || "Unknown error"), 'error');
    }
  } catch (error) {
    showToast("Error discharging patient: " + error.message, 'error');
  } finally {
    dischargeBtn.textContent = originalText;
    dischargeBtn.disabled = false;
  }
}

async function selectAppointment(id) {
  activeApptId = id;
  const appt = appointments.find(a => a._id === id);
  if (!appt) return;

  qsa('.appt').forEach(el => el.classList.toggle('active', el.dataset.id === id));

  currentPatientData = null;
  currentConsultationId = null;
  currentDraftConsultationId = null;
  currentPrescriptionList = [];
  isPatientAdmitted = false;
  currentAdmissionId = null;
  
  const notesField = qs("#consultationNotes");
  if (notesField) notesField.value = "";
  
  const diagnosisSelect = qs("#diagnosisSelect");
  if (diagnosisSelect) diagnosisSelect.value = "";
  
  const otherDiagnosisInput = qs("#otherDiagnosis");
  if (otherDiagnosisInput) {
    otherDiagnosisInput.style.display = "none";
    otherDiagnosisInput.value = "";
  }
  
  const drugNameInput = qs("#drugNameInput");
  if (drugNameInput) drugNameInput.value = "";
  
  updatePrescriptionListDisplay();

  try {
    const patientId = appt.patient._id;
    const data = await makeRequest(`/doctor/patient/${patientId}`);
    if (data.success) {
      currentPatientData = data;
      
      const admission = await checkAdmissionStatus(appt._id, patientId);
      
      renderPatientWorkspace(data, appt);
      await loadVitals(appt._id, patientId);
      
      updateAdmitDischargeButton();
    } else {
      showToast("Failed to load patient record", 'error');
    }
  } catch (error) {
    showToast("Error loading patient record: " + error.message, 'error');
  }
}

function renderPatientWorkspace(data, appt) {
  const { patient, history } = data;
  const user = patient.user;

  const pName = qs("#pName");
  if (pName) pName.textContent = user.name;
  
  const department = user.department || patient.department || 'Not specified';
  const id = user.studentID || user.staffID || 'N/A';
  const pSub = qs("#pSub");
  if (pSub) pSub.textContent = `${id} • ${department}`;

  const tagWrap = qs("#pTags");
  if (tagWrap) {
    tagWrap.innerHTML = "";
    
    const medHistBtn = document.createElement("button");
    medHistBtn.className = "btn-small btn-outline";
    medHistBtn.innerHTML = '<i class="fa-solid fa-file-medical"></i> View Medical Profile';
    medHistBtn.onclick = () => openMedicalProfileModal(patient, user);
    tagWrap.appendChild(medHistBtn);
  }

  const patientActions = qs("#patientActions");
  if (patientActions) {
    let admitBtn = qs("#btnAdmit");
    if (!admitBtn) {
      admitBtn = document.createElement("button");
      admitBtn.id = "btnAdmit";
      const btnStart = qs("#btnStart");
      if (btnStart) {
        patientActions.insertBefore(admitBtn, btnStart);
      } else {
        patientActions.appendChild(admitBtn);
      }
    }
    
    updateAdmitDischargeButton();
  }

  const lastVisit = qs("#lastVisit");
  if (lastVisit) {
    if (history.consultations && history.consultations.length > 0) {
      const last = history.consultations[0];
      lastVisit.textContent = `${new Date(last.createdAt).toLocaleDateString()} — ${last.diagnosis || 'Consultation'}`;
    } else {
      lastVisit.textContent = "No previous visit recorded";
    }
  }

  renderHistoryTab(history);
  showToast("Workspace updated for " + user.name, 'info', 1000);
}

function renderHistoryTab(history) {
  const hist = qs("#historyList");
  if (!hist) return;
  
  hist.innerHTML = "";

  const visitHeader = document.createElement("h4");
  visitHeader.textContent = "Visit History";
  visitHeader.style.margin = "0 0 10px 0";
  visitHeader.style.color = "var(--primary)";
  hist.appendChild(visitHeader);

  if (!history.consultations || history.consultations.length === 0) {
    const noVisits = document.createElement("div");
    noVisits.style.color = "#777";
    noVisits.style.fontStyle = "italic";
    noVisits.style.marginBottom = "20px";
    noVisits.textContent = "No visit history found.";
    hist.appendChild(noVisits);
  } else {
    history.consultations.forEach(c => {
      const d = document.createElement("div");
      d.className = "history-item";
      d.style.padding = "10px";
      d.style.marginBottom = "10px";
      d.style.border = "1px solid #eee";
      d.style.borderRadius = "6px";
      d.style.background = "#fafafa";

      const visitDate = new Date(c.createdAt).toLocaleDateString();
      const doctorName = c.appointment?.doctor?.name || 'Not recorded';
      
      d.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
          <strong>${visitDate}</strong>
          <button class="btn-small view-details-btn" style="font-size:0.75rem; padding:4px 12px; background: var(--primary-blue); color: white; border: none; border-radius: 5px; cursor: pointer;">
            <i class="fa-solid fa-eye"></i> View Details
          </button>
        </div>
        <div style="color:var(--muted); font-size:0.9rem;">
          Diagnosis: <span style="font-weight:600; color:#333;">${escapeHtml(c.diagnosis || 'Pending')}</span>
        </div>
        <div style="color:var(--muted); font-size:0.85rem; margin-top:5px;">
          <i class="fa-solid fa-user-doctor"></i> Doctor: ${escapeHtml(doctorName)}
        </div>
      `;

      const consultationPrescriptions = history.prescriptions?.filter(rx => rx.consultation === c._id) || [];
      const btn = d.querySelector('.view-details-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          openConsultationDetailsModal(visitDate, c, consultationPrescriptions, doctorName);
        });
      }
      hist.appendChild(d);
    });
  }

  const rxHeader = document.createElement("h4");
  rxHeader.textContent = "Prescription History";
  rxHeader.style.margin = "20px 0 10px 0";
  rxHeader.style.borderTop = "1px solid #eee";
  rxHeader.style.paddingTop = "15px";
  rxHeader.style.color = "var(--primary)";
  hist.appendChild(rxHeader);

  if (!history.prescriptions || history.prescriptions.length === 0) {
    const noRx = document.createElement("div");
    noRx.style.color = "#777";
    noRx.style.fontStyle = "italic";
    noRx.textContent = "No past prescriptions.";
    hist.appendChild(noRx);
  } else {
    const rxTable = document.createElement("table");
    rxTable.style.width = "100%";
    rxTable.style.borderCollapse = "collapse";
    rxTable.style.fontSize = "0.85rem";
    
    let tableRows = '';
    history.prescriptions.forEach(rx => {
      const consultation = history.consultations?.find(c => c._id === rx.consultation);
      const issuedDate = consultation ? new Date(consultation.createdAt).toLocaleDateString() : 'N/A';
      const doctorName = consultation?.appointment?.doctor?.name || 'N/A';
      const medications = rx.medications || [];
      
      medications.forEach(med => {
        const status = med.isPendingPharmacist ? 'Pending Pharmacist' : 'Dispensed';
        const statusClass = med.isPendingPharmacist ? 'pill-warning' : 'pill-completed';
        
        tableRows += `
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:6px;">${issuedDate}<\/td>
            <td style="padding:6px; font-weight:600;">${escapeHtml(med.name || 'N/A')}<\/td>
            <td style="padding:6px;">${med.dosage ? `${escapeHtml(med.dosage)} (${escapeHtml(med.frequency || 'N/A')})` : 'Pending pharmacist'}<\/td>
            <td style="padding:6px;"><span class="status-pill ${statusClass}" style="font-size:0.7rem;">${status}<\/span><\/td>
            <td style="padding:6px; font-size:0.75rem; color:#666;">${escapeHtml(doctorName)}<\/td>
          <\/tr>
        `;
      });
    });

    if (tableRows) {
      rxTable.innerHTML = `
        <thead>
          <tr style="background:#f0f0f0; text-align:left;">
            <th style="padding:6px;">Date<\/th>
            <th style="padding:6px;">Drug<\/th>
            <th style="padding:6px;">Dosage/Frequency<\/th>
            <th style="padding:6px;">Status<\/th>
            <th style="padding:6px;">Doctor<\/th>
          <\/tr>
        <\/thead>
        <tbody>
          ${tableRows}
        <\/tbody>
      `;
      hist.appendChild(rxTable);
    }
  }
}

function openConsultationDetailsModal(date, consultation, prescriptions, doctorName) {
  let modal = document.getElementById('consultationDetailsModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'consultationDetailsModal';
    modal.className = 'modal-overlay';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="modal" style="max-width:700px; width:90%; max-height:85vh; overflow-y:auto; padding:1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding-bottom:10px; margin-bottom:20px; position:sticky; top:0; background:white; z-index:10;">
          <h3 style="margin:0; color:var(--primary);"><i class="fa-solid fa-file-medical"></i> Consultation Details</h3>
          <button onclick="this.closest('.modal-overlay').style.display='none'" style="background:none; border:none; font-size:1.5rem; cursor:pointer; color:#666;">&times;</button>
        </div>
        
        <div style="margin-bottom:20px;">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
            <div style="background:#f9f9f9; padding:12px; border-radius:8px;">
              <div style="color:#666; font-size:0.75rem; margin-bottom:4px;">Date</div>
              <div id="modalDate" style="font-size:1rem; font-weight:600;"></div>
            </div>
            <div style="background:#f9f9f9; padding:12px; border-radius:8px;">
              <div style="color:#666; font-size:0.75rem; margin-bottom:4px;">Doctor</div>
              <div id="modalDoctor" style="font-size:1rem; font-weight:600;"></div>
            </div>
          </div>
        </div>

        <div style="background:#f0f7ff; padding:15px; border-radius:8px; margin-bottom:20px;">
          <div style="font-weight:600; color:var(--primary); margin-bottom:8px;"><i class="fa-solid fa-stethoscope"></i> Diagnosis</div>
          <div id="modalDiagnosis" style="line-height:1.5;"></div>
        </div>

        <div style="background:#f9f9f9; padding:15px; border-radius:8px; margin-bottom:20px;">
          <div style="font-weight:600; color:var(--primary); margin-bottom:8px;"><i class="fa-solid fa-notes-medical"></i> Clinical Notes</div>
          <div id="modalNotes" style="line-height:1.5; white-space:pre-wrap;"></div>
        </div>

        <div style="margin-bottom:20px;">
          <div style="font-weight:600; margin-bottom:12px;"><i class="fa-solid fa-prescription"></i> Prescriptions Issued</div>
          <div id="modalPrescriptions" style="max-height:300px; overflow-y:auto;"></div>
        </div>

        <div class="modal-actions" style="margin-top:20px; text-align:right;">
          <button class="btn btn-primary" onclick="this.closest('.modal-overlay').style.display='none'" style="padding:8px 20px; background:var(--primary-blue); color:white; border:none; border-radius:5px; cursor:pointer;">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  document.getElementById('modalDate').textContent = date;
  document.getElementById('modalDoctor').textContent = doctorName && doctorName !== 'Not recorded' ? `${escapeHtml(doctorName)}` : 'Not recorded';
  document.getElementById('modalDiagnosis').textContent = consultation.diagnosis || 'No diagnosis recorded';
  document.getElementById('modalNotes').textContent = consultation.notes || 'No additional notes';

  const prescriptionsContainer = document.getElementById('modalPrescriptions');
  if (prescriptions && prescriptions.length > 0) {
    let prescriptionsHtml = `
      <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
        <thead>
          <tr style="background:#f0f0f0; text-align:left;">
            <th style="padding:8px;">Drug</th>
            <th style="padding:8px;">Dosage</th>
            <th style="padding:8px;">Frequency</th>
            <th style="padding:8px;">Duration</th>
            <th style="padding:8px;">Status</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    prescriptions.forEach(prescription => {
      const medications = prescription.medications || [];
      medications.forEach(med => {
        const status = med.isPendingPharmacist ? 'Pending Pharmacist' : 'Dispensed';
        const statusColor = med.isPendingPharmacist ? '#f59e0b' : '#10b981';
        
        prescriptionsHtml += `
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:8px;"><strong>${escapeHtml(med.name || 'N/A')}</strong></td>
            <td style="padding:8px;">${escapeHtml(med.dosage || 'Pending')}</td>
            <td style="padding:8px;">${escapeHtml(med.frequency || 'Pending')}</td>
            <td style="padding:8px;">${escapeHtml(med.duration || 'Pending')}</td>
            <td style="padding:8px;"><span style="background:${statusColor}; color:white; padding:2px 8px; border-radius:12px; font-size:0.7rem;">${status}</span></td>
          </tr>
        `;
      });
    });
    
    prescriptionsHtml += `
        </tbody>
      </table>
    `;
    prescriptionsContainer.innerHTML = prescriptionsHtml;
  } else {
    prescriptionsContainer.innerHTML = '<p style="color:#666; font-style:italic;">No prescriptions issued during this visit.</p>';
  }

  modal.style.display = 'flex';
}

// Handle diagnosis dropdown change
function handleDiagnosisChange() {
  const diagnosisSelect = document.getElementById('diagnosisSelect');
  const otherDiagnosisInput = document.getElementById('otherDiagnosis');
  
  if (diagnosisSelect && diagnosisSelect.value === "Other") {
    otherDiagnosisInput.style.display = "block";
    otherDiagnosisInput.required = true;
    otherDiagnosisInput.focus();
  } else if (otherDiagnosisInput) {
    otherDiagnosisInput.style.display = "none";
    otherDiagnosisInput.required = false;
    otherDiagnosisInput.value = "";
  }
}

// Get selected diagnosis value
function getSelectedDiagnosis() {
  const diagnosisSelect = document.getElementById('diagnosisSelect');
  const otherDiagnosisInput = document.getElementById('otherDiagnosis');
  
  if (!diagnosisSelect) return '';
  
  if (diagnosisSelect.value === "Other") {
    return otherDiagnosisInput ? otherDiagnosisInput.value.trim() : '';
  }
  return diagnosisSelect.value;
}

// Populate diagnosis dropdown
function populateDiagnosisDropdown() {
  const diagnosisSelect = document.getElementById('diagnosisSelect');
  if (!diagnosisSelect) return;
  
  while (diagnosisSelect.options.length > 1) {
    diagnosisSelect.remove(1);
  }
  
  commonDiagnoses.forEach(diagnosis => {
    const option = document.createElement('option');
    option.value = diagnosis;
    option.textContent = diagnosis;
    diagnosisSelect.appendChild(option);
  });
  
  const otherOption = document.createElement('option');
  otherOption.value = "Other";
  otherOption.textContent = "Other (Specify)";
  diagnosisSelect.appendChild(otherOption);
  
  diagnosisSelect.addEventListener('change', handleDiagnosisChange);
}

/******************************************************************
 * 4. FILTER AND SEARCH FUNCTIONS
 ******************************************************************/
function applyFilters() {
  let filtered = [...appointments];
  
  if (currentFilter !== 'all') {
    filtered = filtered.filter(appt => {
      const status = appt.status?.toLowerCase() || '';
      return status === currentFilter.toLowerCase();
    });
  }
  
  if (currentSearchTerm.trim()) {
    const searchTerm = currentSearchTerm.toLowerCase().trim();
    filtered = filtered.filter(appt => {
      const patientName = appt.patient?.user?.name?.toLowerCase() || '';
      const patientId = appt.patient?.user?.studentID?.toLowerCase() || 
                       appt.patient?.user?.staffID?.toLowerCase() || '';
      
      return patientName.includes(searchTerm) || patientId.includes(searchTerm);
    });
  }
  
  filteredAppointments = filtered;
  renderAppointments(filteredAppointments);
}

function setupFiltersAndSearch() {
  const searchInput = qs("#searchInput");
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchTerm = e.target.value;
      applyFilters();
    });
  }
  
  const chips = qsa('.chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.dataset.filter;
      applyFilters();
    });
  });
}

/******************************************************************
 * 5. PRESCRIPTION ACTIONS
 ******************************************************************/

function addDrugToPrescription() {
  const drugNameInput = qs("#drugNameInput");
  if (!drugNameInput) {
    showToast("Error: Drug name input not found", 'error');
    return;
  }
  
  const drugName = drugNameInput.value.trim();
  
  if (!drugName) {
    showToast("Please enter a drug name", 'warning');
    drugNameInput.focus();
    return;
  }
  
  currentPrescriptionList.push({
    name: drugName,
    isPendingPharmacist: true,
    addedAt: new Date().toISOString()
  });
  
  drugNameInput.value = "";
  drugNameInput.focus();
  
  updatePrescriptionListDisplay();
  showToast(`${drugName} added to prescription list`, 'success');
}

function removeDrugFromList(index) {
  if (confirm(`Remove "${currentPrescriptionList[index].name}" from the list?`)) {
    currentPrescriptionList.splice(index, 1);
    updatePrescriptionListDisplay();
    showToast("Drug removed from list", 'success');
  }
}

function clearPrescriptionList() {
  if (currentPrescriptionList.length > 0 && confirm("Clear all prescriptions from this consultation?")) {
    currentPrescriptionList = [];
    updatePrescriptionListDisplay();
    showToast("Prescription list cleared", 'success');
  }
}

function updatePrescriptionListDisplay() {
  const container = qs("#prescriptionListDisplay");
  if (!container) return;
  
  if (currentPrescriptionList.length === 0) {
    container.innerHTML = '<div style="padding: 15px; text-align: center; color: #999; font-style: italic;">No prescriptions added yet. Add drug names above.</div>';
    return;
  }
  
  container.innerHTML = currentPrescriptionList.map((med, index) => `
    <div class="prescription-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; margin-bottom: 8px; background: #f9f9f9; border-radius: 6px;">
      <div>
        <strong style="font-size: 0.95rem;">${escapeHtml(med.name)}</strong>
        <span style="font-size: 0.7rem; color: #f59e0b; margin-left: 8px;">
          <i class="fa-solid fa-clock"></i> Pending pharmacist review
        </span>
      </div>
      <button onclick="removeDrugFromList(${index})" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1.1rem; padding: 5px;" title="Remove">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

function validateConsultation() {
  const diagnosis = getSelectedDiagnosis();
  if (!diagnosis) {
    showToast("Please select or enter a diagnosis", 'warning');
    return false;
  }
  return true;
}

function startConsultation() {
  if (!activeApptId) {
    showToast("Select an appointment first", 'warning');
    return;
  }
  if (!validateConsultation()) return;

  const diagnosis = getSelectedDiagnosis();
  const notesField = qs("#consultationNotes");
  const notes = notesField ? notesField.value.trim() : "";

  currentConsultationId = null;
  showToast("Consultation started - Ready to finalize", 'info');
}

// Save draft consultation
async function saveDraftConsultation() {
  console.log("saveDraftConsultation called");
  
  if (!activeApptId) {
    showToast("Select an appointment first", 'warning');
    return;
  }

  const diagnosis = getSelectedDiagnosis();
  const notesField = qs("#consultationNotes");
  const notes = notesField ? notesField.value.trim() : "";

  if (!diagnosis && !notes) {
    showToast("Nothing to save", 'warning');
    return;
  }

  const saveBtn = qs("#btnSaveDraft");
  const originalText = saveBtn?.textContent;
  if (saveBtn) {
    saveBtn.textContent = "Saving...";
    saveBtn.disabled = true;
  }

  try {
    const consultationData = { 
      diagnosis: diagnosis || "Draft",
      notes: notes
    };
    
    const response = await makeRequest(`/doctor/consultation/${activeApptId}`, {
      method: 'POST',
      body: JSON.stringify(consultationData)
    });

    if (response.success) {
      currentConsultationId = response.consultation?._id;
      showToast("Draft saved successfully!", 'success');
    } else {
      throw new Error(response.message || "Failed to save draft");
    }
  } catch (error) {
    console.error("Error saving draft:", error);
    showToast("Error: " + error.message, 'error');
  } finally {
    if (saveBtn) {
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    }
  }
}

function updateAdmitDischargeButton() {
  const btnAdmit = qs("#btnAdmit");
  if (!btnAdmit) return;

  const parent = btnAdmit.parentNode;
  if (!parent) return;
  
  const newBtn = document.createElement("button");
  newBtn.id = "btnAdmit";
  
  if (isPatientAdmitted) {
    newBtn.textContent = "Discharge Patient";
    newBtn.className = "btn btn-warning";
    newBtn.onclick = function(e) {
      e.preventDefault();
      dischargePatient();
    };
  } else {
    newBtn.textContent = "Admit Patient";
    newBtn.className = "btn btn-outline";
    newBtn.onclick = function(e) {
      e.preventDefault();
      admitPatient();
    };
  }
  
  parent.replaceChild(newBtn, btnAdmit);
}

async function finalizeAppointment() {
  console.log("finalizeAppointment called");
  
  if (!activeApptId) {
    showToast("Select an appointment first", 'warning');
    return;
  }

  if (isPatientAdmitted) {
    showToast("Patient is admitted. Please discharge first before finalizing.", 'warning');
    return;
  }

  if (!validateConsultation()) return;

  const diagnosis = getSelectedDiagnosis();
  const notesField = qs("#consultationNotes");
  const consultationNotesValue = notesField ? notesField.value.trim() : "";

  if (!diagnosis && !consultationNotesValue) {
    showToast("Please enter a diagnosis or notes", 'warning');
    return;
  }

  // Show confirmation alert
  const prescriptionCount = currentPrescriptionList.length;
  const confirmMessage = prescriptionCount > 0 
    ? `Are you sure you want to finalize this consultation?\n\nDiagnosis: ${diagnosis}\nPrescriptions: ${prescriptionCount} drug(s) will be sent to pharmacist.`
    : `Are you sure you want to finalize this consultation without any prescriptions?\n\nDiagnosis: ${diagnosis}`;
  
  if (!confirm(confirmMessage)) {
    return;
  }

  // Get both buttons
  const finalizeButtons = document.querySelectorAll('#btnFinalize');
  
  // Disable all finalize buttons
  finalizeButtons.forEach(btn => {
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Saving...";
      btn.style.opacity = "0.6";
      btn.style.cursor = "not-allowed";
    }
  });

  try {
    // Step 1: Save consultation
    const consultationData = { 
      diagnosis: diagnosis,
      notes: consultationNotesValue
    };
    
    console.log("Saving consultation to:", `/doctor/consultation/${activeApptId}`);
    
    const consultationResponse = await makeRequest(`/doctor/consultation/${activeApptId}`, {
      method: 'POST',
      body: JSON.stringify(consultationData)
    });

    if (!consultationResponse.success) {
      throw new Error(consultationResponse.message || "Failed to save consultation");
    }

    const consultationId = consultationResponse.consultation?._id;
    if (!consultationId) {
      throw new Error("Consultation ID not received from server");
    }

    let savedPrescriptionsCount = 0;
    if (currentPrescriptionList.length > 0) {
      console.log("Saving simplified prescriptions to pharmacist...");
      
      for (const med of currentPrescriptionList) {
        const prescriptionResponse = await makeRequest(`/doctor/prescription/simplified/${consultationId}`, {
          method: 'POST',
          body: JSON.stringify({ drugName: med.name })
        });
        
        if (prescriptionResponse.success) {
          savedPrescriptionsCount++;
          console.log("Saved prescription for:", med.name);
        } else {
          console.warn("Failed to save prescription for:", med.name);
        }
      }
      
      showToast(`${savedPrescriptionsCount} of ${currentPrescriptionList.length} prescription(s) sent to pharmacist`, 'success', 5000);
    }

    if (!isPatientAdmitted) {
      console.log("Completing appointment at:", `/doctor/complete/${activeApptId}`);
      
      const completeResponse = await makeRequest(`/doctor/complete/${activeApptId}`, {
        method: 'PUT'
      });

      if (!completeResponse.success) {
        throw new Error("Failed to complete appointment");
      }
      
      showToast(`✓ Appointment completed! ${savedPrescriptionsCount} prescription(s) sent.`, 'success', 6000);
    } else {
      showToast("✓ Consultation saved. Patient remains admitted.", 'success', 4000);
    }
    
    // Clear state
    activeApptId = null;
    currentPrescriptionList = [];
    currentConsultationId = null;
    
    // Refresh appointments
    await loadAppointments();
    
    // Reset workspace
    const pName = qs("#pName");
    if (pName) pName.textContent = "Select an appointment";
    
    const pSub = qs("#pSub");
    if (pSub) pSub.textContent = "Patient • ID";
    
    const pTags = qs("#pTags");
    if (pTags) pTags.innerHTML = "";
    
    const vitalsContent = qs("#vitalsContent");
    if (vitalsContent) vitalsContent.textContent = "No vitals recorded";
    
    const lastVisit = qs("#lastVisit");
    if (lastVisit) lastVisit.textContent = "No previous visit";
    
    const notesFieldReset = qs("#consultationNotes");
    if (notesFieldReset) notesFieldReset.value = "";
    
    const diagnosisSelect = qs("#diagnosisSelect");
    if (diagnosisSelect) diagnosisSelect.value = "";
    
    const otherDiagnosisInput = qs("#otherDiagnosis");
    if (otherDiagnosisInput) {
      otherDiagnosisInput.style.display = "none";
      otherDiagnosisInput.value = "";
    }
    
    const drugNameInput = qs("#drugNameInput");
    if (drugNameInput) drugNameInput.value = "";
    
    updatePrescriptionListDisplay();
    
    const historyList = qs("#historyList");
    if (historyList) historyList.innerHTML = '<div style="color:#777; font-style:italic;">Select an appointment to view history</div>';
    
    const admitBtn = qs("#btnAdmit");
    if (admitBtn) admitBtn.remove();
    
    currentVitals = { _id: null, bp: '', temp: '', pulse: '', weight: '' };
    
  } catch (err) {
    console.error("Error finalizing appointment:", err);
    showToast("Error: " + err.message, 'error', 5000);
  } finally {
    // Re-enable all finalize buttons
    finalizeButtons.forEach(btn => {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Finalize & Complete";
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
      }
    });
  }
}

/******************************************************************
 * 6. UI HELPERS
 ******************************************************************/

function renderAppointments(list) {
  const appointmentListEl = qs('#appointmentList');
  if (!appointmentListEl) return;
  appointmentListEl.innerHTML = '';

  const activeCount = list.filter(a => a.status !== 'completed').length;
  const countLabel = qs('#countLabel');
  if (countLabel) countLabel.textContent = activeCount;

  if (list.length === 0) {
    const noResults = document.createElement('div');
    noResults.style.padding = '20px';
    noResults.style.textAlign = 'center';
    noResults.style.color = '#777';
    noResults.style.fontStyle = 'italic';
    noResults.textContent = 'No appointments match your filters';
    appointmentListEl.appendChild(noResults);
    return;
  }

  list.forEach(appt => {
    const wrap = document.createElement('div');
    wrap.className = 'appt';
    if (appt._id === activeApptId) wrap.classList.add('active');

    wrap.setAttribute('data-id', appt._id);
    const date = new Date(appt.date);
    const urgency = appt.urgency || 'routine';
    const urgencyBadge = getUrgencyBadge(urgency);
    
    wrap.innerHTML = `
      <div class="leftcol">
        <div class="time">${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}</div>
        <div class="pname">${escapeHtml(appt.patient?.user?.name || 'Unknown')}</div>
        <div class="meta2">${escapeHtml(appt.patient?.user?.studentID || appt.patient?.user?.staffID || 'N/A')}</div>
        <div class="urgency-badge-container" style="margin-top: 5px;">${urgencyBadge}</div>
      </div>
      <div style="text-align:right">
        ${statusToPill(appt.status)}
        <div style="margin-top:0.6rem;font-size:0.9rem;color:var(--muted)">${escapeHtml(appt.reason || 'No reason')}</div>
      </div>
    `;
    wrap.addEventListener('click', () => selectAppointment(appt._id));
    appointmentListEl.appendChild(wrap);
  });
}

function getUrgencyBadge(urgency) {
  const urgencyColors = {
    'routine': { bg: '#e8f5e8', color: '#2e7d32', icon: 'fa-regular fa-clock' },
    'urgent': { bg: '#fff3e0', color: '#ef6c00', icon: 'fa-solid fa-exclamation' },
    'emergency': { bg: '#ffebee', color: '#c62828', icon: 'fa-solid fa-exclamation-triangle' }
  };
  const config = urgencyColors[urgency] || urgencyColors['routine'];
  return `
    <span class="urgency-badge" style="display: inline-flex; align-items: center; gap: 4px; background: ${config.bg}; color: ${config.color}; padding: 4px 8px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
      <i class="${config.icon}" style="font-size: 0.65rem;"></i> ${urgency}
    </span>
  `;
}

function statusToPill(status) {
  const s = status?.toLowerCase() || '';
  const map = {
    'scheduled': 'pill-scheduled',
    'waiting': 'pill-checked',
    'checked-in': 'pill-checked',
    'in-consultation': 'pill-in',
    'admitted': 'pill-admitted',
    'completed': 'pill-completed'
  };
  return `<span class="status-pill ${map[s] || ''}">${(status || 'UNKNOWN').toUpperCase()}</span>`;
}

/******************************************************************
 * 7. INITIALIZATION
 ******************************************************************/

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Content Loaded - Initializing doctor dashboard");
  checkAuthStatus();

  populateDiagnosisDropdown();

  const consultNotes = qs("#consultationNotes");
  if (consultNotes) {
    consultNotes.placeholder = "Enter your clinical notes here...";
  }

  const user = API_CONFIG.getUser();
  const docNameDisplay = qs("#doc-name-display");
  if (user && docNameDisplay) {
    let name = user.name;
    if (name.toLowerCase().startsWith('dr.')) name = name.substring(3).trim();
    else if (name.toLowerCase().startsWith('dr ')) name = name.substring(3).trim();
    docNameDisplay.textContent = name.split(' ')[0] || name;
  }

  loadAppointments();
  setupFiltersAndSearch();

  // Setup prescription buttons
  const addDrugBtn = qs("#addDrugBtn");
  if (addDrugBtn) {
    addDrugBtn.onclick = function(e) {
      e.preventDefault();
      addDrugToPrescription();
    };
  }
  
  const drugNameInput = qs("#drugNameInput");
  if (drugNameInput) {
    drugNameInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addDrugToPrescription();
      }
    });
  }
  
  const clearAllBtn = qs("#clearAllBtn");
  if (clearAllBtn) {
    clearAllBtn.onclick = clearPrescriptionList;
  }
  
  updatePrescriptionListDisplay();
  
  // Start button
  const btnStart = qs("#btnStart");
  if (btnStart) {
    btnStart.onclick = startConsultation;
  }
  
  // FINALIZE BUTTONS - Get ALL buttons with id "btnFinalize"
  const finalizeButtons = document.querySelectorAll('#btnFinalize');
  console.log(`Found ${finalizeButtons.length} Finalize button(s)`);
  finalizeButtons.forEach((btn, index) => {
    console.log(`Attaching finalize handler to button ${index + 1}`);
    btn.onclick = function(e) {
      e.preventDefault();
      console.log(`Finalize button ${index + 1} clicked`);
      finalizeAppointment();
    };
  });
  
  // Save Draft button
  const saveDraftBtn = qs("#btnSaveDraft");
  if (saveDraftBtn) {
    console.log("Save Draft button found");
    saveDraftBtn.onclick = function(e) {
      e.preventDefault();
      saveDraftConsultation();
    };
  } else {
    console.error("Save Draft button not found - looking for #btnSaveDraft");
  }

  // Tab functionality
  const tabs = qsa('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      const panels = qsa('.tab-panel');
      panels.forEach(p => p.style.display = 'none');
      const targetPanel = qs(`#${target}Panel`);
      if (targetPanel) targetPanel.style.display = 'block';
    });
  });

  // Vitals modal
  const vitalsModal = qs("#vitalsModal");
  const addVitalsBtn = qs("#addVitalsBtn");
  const cancelVitals = qs("#cancelVitals");
  const saveVitals = qs("#saveVitals");

  if (addVitalsBtn) {
    addVitalsBtn.addEventListener("click", () => {
      const bpInput = qs("#bp");
      const tempInput = qs("#temp");
      const pulseInput = qs("#pulse");
      const weightInput = qs("#weight");
      
      if (bpInput) bpInput.value = currentVitals.bp;
      if (tempInput) tempInput.value = currentVitals.temp;
      if (pulseInput) pulseInput.value = currentVitals.pulse;
      if (weightInput) weightInput.value = currentVitals.weight;
      
      if (vitalsModal) vitalsModal.style.display = "flex";
    });
  }

  if (cancelVitals) {
    cancelVitals.addEventListener("click", () => {
      if (vitalsModal) vitalsModal.style.display = "none";
    });
  }

  if (saveVitals) {
    saveVitals.addEventListener("click", async () => {
      const bpInput = qs("#bp");
      const bp = bpInput ? bpInput.value.trim() : "";
      if (!bp) return alert("Please fill at least BP");

      const vitalsData = {
        bp,
        temperature: qs("#temp") ? qs("#temp").value.trim() : "",
        pulse: qs("#pulse") ? qs("#pulse").value.trim() : "",
        weight: qs("#weight") ? qs("#weight").value.trim() : ""
      };

      const vitalsContent = qs("#vitalsContent");
      if (vitalsContent) {
        vitalsContent.innerHTML = `BP: ${vitalsData.bp} • Temp: ${vitalsData.temperature || ''}°C • Pulse: ${vitalsData.pulse || 'N/A'} • Weight: ${vitalsData.weight || 'N/A'}kg`;
      }

      currentVitals = { ...currentVitals, ...vitalsData };
      if (vitalsModal) vitalsModal.style.display = "none";

      try {
        let response;
        
        if (currentVitals._id) {
          response = await makeRequest(`/doctor/vitals/${currentVitals._id}`, {
            method: 'POST',
            body: JSON.stringify(vitalsData)
          });
        } else {
          response = await makeRequest(`/doctor/vitals`, {
            method: 'POST',
            body: JSON.stringify({
              ...vitalsData,
              patientId: currentPatientData?.patient?._id,
              appointmentId: activeApptId
            })
          });
        }

        if (response.success) {
          showToast("Vitals saved successfully", 'success');
          if (response.vitals) {
            currentVitals._id = response.vitals._id;
          }
        } else {
          showToast("Failed to save vitals", 'error');
        }
      } catch (err) {
        showToast("Error saving vitals: " + err.message, 'error');
      }
    });
  }

  const fadeElements = qsa('.fade-in');
  fadeElements.forEach((el, i) => {
    setTimeout(() => el.classList.add('visible'), 80 + i * 80);
  });
});

function openMedicalProfileModal(patient, user) {
  let modal = document.getElementById('medProfileModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'medProfileModal';
    modal.className = 'modal-overlay';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="modal" style="max-width:600px; width:90%; max-height:80vh; overflow-y:auto; padding:1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding-bottom:10px; margin-bottom:20px; position:sticky; top:0; background:white; z-index:10;">
          <h3 style="margin:0; color:var(--primary);"><i class="fa-solid fa-file-medical" style="margin-right:8px;"></i>Patient Medical Profile</h3>
          <button onclick="this.closest('.modal-overlay').style.display='none'" style="background:none; border:none; font-size:1.5rem; cursor:pointer; color:#666;">&times;</button>
        </div>
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:20px;">
          <div style="background:#f9f9f9; padding:12px; border-radius:8px;"><div style="color:#666; font-size:0.75rem; margin-bottom:4px;">Age</div><div id="mpAge" style="font-size:1.3rem; font-weight:600;"></div></div>
          <div style="background:#f9f9f9; padding:12px; border-radius:8px;"><div style="color:#666; font-size:0.75rem; margin-bottom:4px;">Gender</div><div id="mpGender" style="font-size:1.3rem; font-weight:600;"></div></div>
        </div>

        <div style="background:#f0f7ff; padding:12px; border-radius:8px; margin-bottom:20px;">
          <div style="font-weight:600; color:var(--primary); margin-bottom:8px;"><i class="fa-solid fa-phone" style="margin-right:5px;"></i>Emergency Contact</div>
          <div id="mpEmergency" style="font-weight:600; margin-bottom:3px;"></div>
          <div id="mpEmergencyPhone" style="color:#666; font-size:0.9rem;"></div>
        </div>
        
        <div style="margin-bottom:15px;"><div style="font-weight:600; margin-bottom:5px; font-size:0.9rem;">Blood Group</div><div id="mpBlood" style="padding:10px; background:#f9f9f9; font-weight:600; border-radius:6px;"></div></div>
        <div style="margin-bottom:15px;"><div style="font-weight:600; margin-bottom:5px; font-size:0.9rem;">Allergies</div><div id="mpAllergies" style="padding:10px; background:#fff0f0; color:#d32f2f; border-radius:6px; line-height:1.4;"></div></div>
        <div style="margin-bottom:15px;"><div style="font-weight:600; margin-bottom:5px; font-size:0.9rem;">Chronic Conditions</div><div id="mpChronic" style="padding:10px; background:#f0f8ff; color:#0277bd; border-radius:6px; line-height:1.4;"></div></div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const mpBlood = document.getElementById('mpBlood');
  if (mpBlood) mpBlood.textContent = patient.bloodGroup || "Not specified";
  
  let ageDisplay = 'Not specified';
  if (user.age) ageDisplay = `${user.age} years`;
  else if (patient.dateOfBirth) {
    const age = Math.floor((new Date() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
    ageDisplay = `${age} years`;
  } else if (patient.age) ageDisplay = `${patient.age} years`;
  
  const mpAge = document.getElementById('mpAge');
  if (mpAge) mpAge.textContent = ageDisplay;
  
  const genderMap = { 'male': '♂ Male', 'female': '♀ Female', 'other': 'Other' };
  const gender = user.gender || patient.gender || 'Not specified';
  const mpGender = document.getElementById('mpGender');
  if (mpGender) mpGender.textContent = genderMap[gender] || gender;
  
  const allergiesText = (patient.allergies && patient.allergies.length > 0) ? patient.allergies.join(', ') : (patient.allergiesList || 'None reported');
  const mpAllergies = document.getElementById('mpAllergies');
  if (mpAllergies) mpAllergies.textContent = allergiesText;
  
  const conditionsText = (patient.chronicConditions && patient.chronicConditions.length > 0) ? patient.chronicConditions.join(', ') : (patient.conditions || 'None reported');
  const mpChronic = document.getElementById('mpChronic');
  if (mpChronic) mpChronic.textContent = conditionsText;
  
  const emergencyName = patient.emergencyContact?.name || 'Not provided';
  const emergencyPhone = patient.emergencyContact?.phone || patient.emergencyPhone || 'No phone number';
  const mpEmergency = document.getElementById('mpEmergency');
  const mpEmergencyPhone = document.getElementById('mpEmergencyPhone');
  if (mpEmergency) mpEmergency.textContent = emergencyName;
  if (mpEmergencyPhone) mpEmergencyPhone.innerHTML = `<i class="fa-solid fa-phone" style="margin-right:5px;"></i> ${emergencyPhone}`;

  modal.style.display = 'flex';
}

function openNotesModal(date, notes) {
  let modal = document.getElementById('notesModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'notesModal';
    modal.className = 'modal-overlay';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="modal" style="max-width:600px; width:90%;">
        <h3 id="notesModalTitle" style="border-bottom:1px solid #eee; padding-bottom:10px;">Consultation Notes</h3>
        <div id="notesModalContent" style="padding:15px; background:#f9f9f9; border-radius:6px; min-height:100px; white-space:pre-wrap; line-height:1.5;"></div>
        <div class="modal-actions" style="margin-top:20px;"><button class="btn btn-primary" onclick="document.getElementById('notesModal').style.display='none'">Close</button></div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const notesModalTitle = document.getElementById('notesModalTitle');
  const notesModalContent = document.getElementById('notesModalContent');
  if (notesModalTitle) notesModalTitle.textContent = `Consultation Notes - ${date}`;
  if (notesModalContent) notesModalContent.textContent = notes || "No detailed notes available.";
  modal.style.display = 'flex';
}

// Make functions globally accessible
window.removeDrugFromList = removeDrugFromList;
window.addDrugToPrescription = addDrugToPrescription;
window.handleDiagnosisChange = handleDiagnosisChange;