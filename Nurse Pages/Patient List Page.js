// Patient List page JS: search, filters, pagination, and actions

const allPatients = [
  { id: '2025-001', name: 'Samuel Okoye', gender: 'Male', age: 22, department: 'General Clinic', time: '10:00 AM', status: 'waiting' },
  { id: '2025-002', name: 'Ade Bayo', gender: 'Male', age: 20, department: 'Medicine', time: '10:15 AM', status: 'checked-in' },
  { id: '2025-003', name: 'Ahmed Musa', gender: 'Male', age: 21, department: 'Computer Engineering', time: '10:30 AM', status: 'waiting' },
  { id: '2025-004', name: 'Chioma Okoro', gender: 'Female', age: 19, department: 'Law', time: '10:45 AM', status: 'completed' },
  { id: '2025-005', name: 'Ruqqaiya Rita', gender: 'Female', age: 20, department: 'Business', time: '11:00 AM', status: 'waiting' },
  { id: '2025-006', name: 'Fatima Ahmed', gender: 'Female', age: 22, department: 'Pharmacy', time: '11:15 AM', status: 'referred' },
  { id: '2025-007', name: 'Samuel Ade', gender: 'Male', age: 19, department: 'Architecture', time: '11:30 AM', status: 'waiting' },
  { id: '2025-008', name: 'Grace Okafor', gender: 'Female', age: 21, department: 'Medicine', time: '11:45 AM', status: 'waiting' }
];

let currentFilter = 'all';
let currentSearch = '';
let currentPage = 1;
const pageSize = 5;

function getFilteredPatients() {
  return allPatients.filter(p => {
    if (currentFilter === 'waiting' && p.status !== 'waiting') return false;
    if (!currentSearch) return true;
    const s = currentSearch.toLowerCase();
    return p.name.toLowerCase().includes(s) || p.id.toLowerCase().includes(s);
  });
}

function renderTable() {
  const tableBody = document.getElementById('patientTable');
  const pageInfo = document.getElementById('pageInfo');
  if (!tableBody) return;

  const filtered = getFilteredPatients();
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  tableBody.innerHTML = '';
  pageItems.forEach(p => {
    const tr = document.createElement('tr');
    const statusText = formatStatus(p.status);
    tr.innerHTML = `
      <td>${p.id}</td>
      <td><strong>${p.name}</strong></td>
      <td>${p.gender}</td>
      <td>${p.age}</td>
      <td>${p.department}</td>
      <td>${p.time}</td>
      <td><span class="status ${statusClass(p.status)}">${statusText}</span></td>
      <td>
        <button class="action-btn-small" onclick="viewPatient('${p.id}')"><i class="fas fa-eye"></i></button>
        <button class="action-btn-small" onclick="checkInPatientById('${p.id}')"><i class="fas fa-check-square"></i></button>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
}

function statusClass(status) {
  switch (status) {
    case 'waiting': return 'status-waiting';
    case 'checked-in': return 'status-checked-in';
    case 'completed': return 'status-completed';
    case 'referred': return 'status-referred';
    default: return '';
  }
}

function formatStatus(status) {
  switch (status) {
    case 'waiting': return 'Waiting';
    case 'checked-in': return 'Checked In';
    case 'completed': return 'Completed';
    case 'referred': return 'Referred';
    default: return status;
  }
}

function setupEvents() {
  const search = document.getElementById('patientSearch');
  const btnAll = document.getElementById('btnAll');
  const btnWaiting = document.getElementById('btnWaiting');
  const btnAdd = document.getElementById('btnAdd');
  const prev = document.getElementById('prevPage');
  const next = document.getElementById('nextPage');

  if (search) {
    search.addEventListener('input', (e) => {
      currentSearch = e.target.value || '';
      currentPage = 1;
      renderTable();
    });
  }

  if (btnAll) btnAll.addEventListener('click', () => { currentFilter = 'all'; currentPage = 1; renderTable(); });
  if (btnWaiting) btnWaiting.addEventListener('click', () => { currentFilter = 'waiting'; currentPage = 1; renderTable(); });
  if (btnAdd) btnAdd.addEventListener('click', () => { alert('Open new patient form (not implemented)'); });

n  if (prev) prev.addEventListener('click', () => { if (currentPage>1) { currentPage--; renderTable(); } });
  if (next) next.addEventListener('click', () => { const totalPages = Math.max(1, Math.ceil(getFilteredPatients().length / pageSize)); if (currentPage<totalPages) { currentPage++; renderTable(); } });
}

function checkInPatientById(patientId) {
  if (confirm(`Check in patient ${patientId}?`)) {
    alert(`Patient ${patientId} checked in`);
  }
}

function viewPatient(patientId) {
  // navigate to patient records page (placeholder)
  window.location.href = `Patient Basic Records View Page.html?patient=${patientId}`;
}

document.addEventListener('DOMContentLoaded', () => {
  setupEvents();
  renderTable();
});
