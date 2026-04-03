document.addEventListener('DOMContentLoaded', async () => {
    // Check if API_CONFIG is defined
    if (typeof API_CONFIG === 'undefined') {
        console.error('API_CONFIG is not defined. Make sure api-config.js is loaded first.');
        alert('Configuration error. Please refresh the page.');
        return;
    }

    // Check authentication
    const token = API_CONFIG.getToken();
    if (!token) {
        window.location.href = '../Shared Pages/login.html';
        return;
    }

    // DOM Elements - with null checks
    const calendarGrid = document.getElementById('calendarGrid');
    const appointmentsList = document.getElementById('appointmentsList');
    const viewToggle = document.getElementById('viewToggle');
    const datePicker = document.getElementById('datePicker');
    const prev = document.getElementById('prev');
    const next = document.getElementById('next');
    const addAppt = document.getElementById('addAppt');
    const modal = document.getElementById('modal');
    const apptForm = document.getElementById('apptForm');
    const cancelBtn = document.getElementById('cancelBtn');
    const roleFilter = document.getElementById('roleFilter');
    const rangeLabel = document.getElementById('rangeLabel');
    const doctorSelect = document.getElementById('doctor');

    // Check if critical elements exist
    if (!calendarGrid  || !viewToggle || !datePicker || !prev || !next  || !modal || !apptForm || !cancelBtn  || !rangeLabel) {
        console.error('Critical DOM elements not found. Check your HTML IDs.');
        alert('Page loading error. Please refresh.');
        return;
    }

    // State
    let currentDate = new Date();
    let editingId = null;
    let appointments = [];
    let doctors = [];

    // Set today's date in date picker
    datePicker.valueAsDate = new Date();

    // Fetch doctors for dropdown from the database
    async function fetchDoctors() {
        try {
            console.log('Fetching doctors...');
            const response = await API_CONFIG.request('/admin/doctors/available');
            
            if (response.success) {
                doctors = response.doctors || [];
                populateDoctorDropdown();
                console.log('Doctors loaded from DB:', doctors.length);
            } else {
                throw new Error(response.message || 'Failed to fetch doctors');
            }
        } catch (error) {
            console.error('Error fetching doctors:', error);
            doctors = [];
            // Show error in dropdown
            if (doctorSelect) {
                doctorSelect.innerHTML = '<option value="">Error loading doctors</option>';
            }
        }
    }

    function populateDoctorDropdown() {
        if (!doctorSelect) return;
        
        doctorSelect.innerHTML = '<option value="">Select Doctor (Optional)</option>';
        doctors.forEach(doctor => {
            const option = document.createElement('option');
            option.value = doctor._id;
            option.textContent = `${doctor.name} (${doctor.staffID || 'No ID'})`;
            doctorSelect.appendChild(option);
        });
    }

    // Fetch appointments from the database
    async function fetchAppointments() {
        try {
            const fromDate = new Date(currentDate);
            fromDate.setMonth(fromDate.getMonth() - 1);
            const toDate = new Date(currentDate);
            toDate.setMonth(toDate.getMonth() + 1);

            const params = new URLSearchParams({
                fromDate: fromDate.toISOString().split('T')[0],
                toDate: toDate.toISOString().split('T')[0]
            });

            console.log('Fetching appointments from:', `${API_CONFIG.baseURL}/admin/appointments?${params}`);
            
            const response = await API_CONFIG.request(`/admin/appointments?${params}`);
            console.log('Appointments from DB:', response);
            
            if (response.success && response.appointments) {
                appointments = response.appointments.map(apt => {
                    let patientName = 'Unknown Patient';
                    let patientId = apt.patient?._id || apt.patient;
                    
                    if (apt.patient && apt.patient.user) {
                        patientName = apt.patient.user.name || 'Unknown';
                        patientId = apt.patient.user.studentID || apt.patient._id;
                    } else if (apt.patient && apt.patient.name) {
                        patientName = apt.patient.name;
                    }
                    
                    const aptDate = new Date(apt.date);
                    const dateStr = aptDate.toISOString().split('T')[0];
                    const timeStr = aptDate.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: false 
                    });
                    
                    return {
                        id: apt._id,
                        patientId: patientId,
                        patientName: patientName,
                        doctorId: apt.doctor?._id || apt.doctor,
                        doctorName: apt.doctor?.name || 'Unassigned',
                        role: apt.doctor?.role || 'Doctor',
                        type: apt.reason || 'Consultation',
                        date: dateStr,
                        time: timeStr,
                        reason: apt.reason || 'Consultation',
                        status: apt.status || 'scheduled',
                        urgency: apt.urgency || 'routine'
                    };
                });
                
                console.log('Transformed appointments:', appointments.length);
            } else {
                appointments = [];
            }
        } catch (error) {
            console.error('Error fetching appointments from DB:', error);
            appointments = [];
            
            // Show error message to user
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = 'Failed to load appointments. Please try again.';
            errorDiv.style.cssText = 'background-color: #f8d7da; color: #721c24; padding: 10px; margin: 10px 0; border-radius: 4px; text-align: center;';
            calendarGrid.parentNode.insertBefore(errorDiv, calendarGrid);
            
            // Auto-remove error after 5 seconds
            setTimeout(() => errorDiv.remove(), 5000);
        }
        
        renderCalendar();
    }

    function startOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    function formatDay(d) {
        return d.toISOString().slice(0, 10);
    }

    function isPastAppointment(dateStr, timeStr) {
        const appointmentDateTime = new Date(`${dateStr}T${timeStr}`);
        return appointmentDateTime < new Date();
    }

function getAppointmentStatusClass(appointment) {
    const isPast = isPastAppointment(appointment.date, appointment.time);
    
    let statusClass = 'appointment';
    

    if (appointment.status === 'cancelled') {
        statusClass += ' cancelled';
    } else if (appointment.status === 'completed' || isPast && appointment.status === 'completed') {
        statusClass += ' completed';
    } else if (appointment.status === 'admitted' || appointment.status === 'in-consultation') {
        statusClass += ' admitted';
    } else if (appointment.status === 'checked-in') {
        statusClass += ' checked-in';
    } else if (appointment.status === 'scheduled' || appointment.status === 'waiting') {
        statusClass += ' scheduled';
    }
    
    console.log(`Appointment ${appointment.id} status: ${appointment.status}, class: ${statusClass}`);
    return statusClass;
}

    function renderCalendar() {
        if (!calendarGrid) return;
        
        calendarGrid.innerHTML = '';
        const view = viewToggle ? viewToggle.value : 'week';
        
        if (view === 'week') {
            const start = startOfWeek(currentDate);
            const days = [];
            for (let i = 0; i < 7; i++) {
                const dt = new Date(start);
                dt.setDate(start.getDate() + i);
                days.push(dt);
            }
            if (rangeLabel) rangeLabel.textContent = `${formatDay(days[0])} — ${formatDay(days[6])}`;
            
            days.forEach(d => {
                const cell = document.createElement('div');
                cell.className = 'cell';
                
                const dateStr = formatDay(d);
                const isToday = dateStr === formatDay(new Date());
                
                cell.innerHTML = `<h4 class="${isToday ? 'today' : ''}">${d.toDateString().slice(0, 10)}</h4>`;
                
                const dayAppts = appointments.filter(a => a.date === dateStr);
                dayAppts.sort((a, b) => a.time.localeCompare(b.time));
                
                if (dayAppts.length === 0) {
                    const emptyMsg = document.createElement('p');
                    emptyMsg.className = 'muted';
                    emptyMsg.textContent = 'No appointments';
                    emptyMsg.style.fontSize = '0.8rem';
                    cell.appendChild(emptyMsg);
                } else {
                    dayAppts.forEach(a => {
                        const aEl = document.createElement('a');
                        aEl.href = '#';
                        aEl.className = getAppointmentStatusClass(a);
                        aEl.innerHTML = `
                            <span class="appointment-time">${a.time}</span>
                            <span class="appointment-title">${a.patientName}</span>
                            <span class="appointment-type">${a.type}</span>
                        `;
                        aEl.dataset.id = a.id;
                        aEl.addEventListener('click', (e) => {
                            e.preventDefault();
                            openModal('edit', a);
                        });
                        cell.appendChild(aEl);
                    });
                }
                
                calendarGrid.appendChild(cell);
            });
        } else {
            // Day view
            const dateStr = formatDay(currentDate);
            if (rangeLabel) rangeLabel.textContent = dateStr;
            
            const column = document.createElement('div');
            column.className = 'cell';
            
            const isToday = dateStr === formatDay(new Date());
            column.innerHTML = `<h4 class="${isToday ? 'today' : ''}">${currentDate.toDateString()}</h4>`;
            
            const dayAppts = appointments.filter(a => a.date === dateStr);
            dayAppts.sort((a, b) => a.time.localeCompare(b.time));
            
            if (dayAppts.length === 0) {
                const emptyMsg = document.createElement('p');
                emptyMsg.className = 'muted';
                emptyMsg.textContent = 'No appointments for this day';
                column.appendChild(emptyMsg);
            } else {
                dayAppts.forEach(a => {
                    const aEl = document.createElement('a');
                    aEl.href = '#';
                    aEl.className = getAppointmentStatusClass(a);
                    aEl.innerHTML = `
                        <span class="appointment-time">${a.time}</span>
                        <span class="appointment-title">${a.patientName}</span>
                        <span class="appointment-type">${a.type}</span>
                    `;
                    aEl.dataset.id = a.id;
                    aEl.addEventListener('click', (e) => {
                        e.preventDefault();
                        openModal('edit', a);
                        console.log('Clicked appointment:', a,);
                    });
                    column.appendChild(aEl);
                });
            }
            
            calendarGrid.appendChild(column);
        }
        
        renderList();
    }

    // function renderList() {
    //     if (!appointmentsList) return;
        
    //     appointmentsList.innerHTML = '';
    //     const dateStr = formatDay(currentDate);
        
    //     const filtered = appointments
    //         .filter(a => a.date === dateStr)
    //         .sort((a, b) => a.time.localeCompare(b.time));
        
    //     if (filtered.length === 0) {
    //         const li = document.createElement('li');
    //         li.className = 'app-item empty';
    //         li.innerHTML = '<div class="muted">No appointments for this day</div>';
    //         appointmentsList.appendChild(li);
    //         return;
    //     }
        
    //     filtered.forEach(a => {
    //         const li = document.createElement('li');
    //         li.className = 'app-item';
            
    //         const statusClass = a.status === 'completed' || isPastAppointment(a.date, a.time) ? 'completed' : 'scheduled';
    //         const statusText = a.status || (isPastAppointment(a.date, a.time) ? 'completed' : 'scheduled');
            
    //         li.innerHTML = `
    //             <div class="appointment-info">
    //                 <div class="appointment-time">${a.time}</div>
    //                 <div>
    //                     <strong>${a.patientName}</strong>
    //                     <div class="muted">${a.doctorName || 'Unassigned'} • ${a.type}</div>
    //                     <div class="muted" style="font-size:0.8rem;">ID: ${a.patientId}</div>
    //                 </div>
    //             </div>
    //             <div class="appointment-status ${statusClass}">${statusText}</div>
    //             <div class="appointment-actions">
    //                 <button class="btn-icon edit" data-id="${a.id}" title="Edit"><i class="fas fa-edit"></i></button>
    //                 <button class="btn-icon del" data-id="${a.id}" title="Cancel"><i class="fas fa-times"></i></button>
    //             </div>
    //         `;
            
    //         appointmentsList.appendChild(li);
    //     });
    // }

    async function saveAppointmentToBackend(appointmentData) {
        try {
            const appointmentDateTime = new Date(`${appointmentData.date}T${appointmentData.time}`);
            
            const payload = {
                patientId: appointmentData.patientId,
                doctorId: appointmentData.doctorId || null,
                date: appointmentDateTime.toISOString(),
                reason: appointmentData.reason,
                status: appointmentData.status || 'scheduled',
                urgency: 'routine'
            };

            console.log('Saving appointment to DB:', payload);

            let response;
            if (appointmentData.id && !appointmentData.id.toString().startsWith('temp')) {
                response = await API_CONFIG.request(`/admin/appointments/${appointmentData.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
            } else {
                response = await API_CONFIG.request('/admin/appointments', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
            }

            console.log('Save response:', response);
            return true;
        } catch (error) {
            console.error('Error saving appointment to DB:', error);
            alert('Failed to save appointment to database. Please check your connection.');
            return false;
        }
    }

    async function deleteAppointmentFromBackend(appointmentId) {
        try {
            if (appointmentId.toString().startsWith('temp')) {
                return true;
            }
            
            console.log('Deleting appointment:', appointmentId);
            await API_CONFIG.request(`/admin/appointments/${appointmentId}`, {
                method: 'DELETE'
            });
            
            return true;
        } catch (error) {
            console.error('Error deleting appointment:', error);
            alert('Failed to delete appointment from database. Please try again.');
            return false;
        }
    }

    function openModal(mode = 'add', rec = null) {
        if (!modal || !apptForm) return;
        
        modal.setAttribute('aria-hidden', 'false');
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) {
            modalTitle.textContent = mode === 'add' ? 'Add New Appointment' : 'Edit Appointment';
        }
        
        if (rec) {
            if (apptForm.patientId) apptForm.patientId.value = rec.patientId;
            if (apptForm.patientName) apptForm.patientName.value = rec.patientName;
            if (doctorSelect) doctorSelect.value = rec.doctorId || '';
            if (apptForm.date) apptForm.date.value = rec.date;
            if (apptForm.time) apptForm.time.value = rec.time;
            if (apptForm.reason) apptForm.reason.value = rec.reason || '';
            if (apptForm.status) apptForm.status.value = rec.status || 'scheduled';
            editingId = rec.id;
        } else {
            apptForm.reset();
            if (apptForm.date) apptForm.date.value = formatDay(currentDate);
            // Set default time to next hour
            const nextHour = new Date();
            nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
            if (apptForm.time) apptForm.time.value = nextHour.toTimeString().slice(0, 5);
            if (apptForm.status) apptForm.status.value = 'scheduled';
            editingId = null;
        }
    }

    function closeModal() {
        if (!modal) return;
        modal.setAttribute('aria-hidden', 'true');
        editingId = null;
    }

    // Event Handlers - with null checks
    if (apptForm) {
        apptForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const fd = new FormData(apptForm);
            const rec = {
                id: editingId,
                patientId: fd.get('patientId')?.trim() || '',
                patientName: fd.get('patientName')?.trim() || '',
                doctorId: fd.get('doctor'),
                date: fd.get('date'),
                time: fd.get('time'),
                reason: fd.get('reason')?.trim() || '',
                type: 'Consultation',
                status: fd.get('status') || 'scheduled'
            };

            if (!rec.patientId || !rec.patientName || !rec.date || !rec.time || !rec.reason) {
                return alert('Please fill in all required fields');
            }

            const saved = await saveAppointmentToBackend(rec);
            
            if (saved) {
                closeModal();
                await fetchAppointments();
            } else {
                alert('Failed to save appointment. Please try again.');
            }
        });
    }

    if (appointmentsList) {
        appointmentsList.addEventListener('click', async (e) => {
            const editBtn = e.target.closest('.edit');
            const delBtn = e.target.closest('.del');
            
            if (editBtn) {
                const rec = appointments.find(a => a.id === editBtn.dataset.id);
                if (rec) openModal('edit', rec);
            }
            
            if (delBtn) {
                const id = delBtn.dataset.id;
                if (!confirm('Cancel this appointment?')) return;
                
                const deleted = await deleteAppointmentFromBackend(id);
                if (deleted) {
                    await fetchAppointments();
                }
            }
        });
    }

    // Navigation
    if (prev) {
        prev.addEventListener('click', () => {
            if (viewToggle && viewToggle.value === 'week') {
                currentDate.setDate(currentDate.getDate() - 7);
            } else {
                currentDate.setDate(currentDate.getDate() - 1);
            }
            if (datePicker) datePicker.valueAsDate = currentDate;
            fetchAppointments();
        });
    }

    if (next) {
        next.addEventListener('click', () => {
            if (viewToggle && viewToggle.value === 'week') {
                currentDate.setDate(currentDate.getDate() + 7);
            } else {
                currentDate.setDate(currentDate.getDate() + 1);
            }
            if (datePicker) datePicker.valueAsDate = currentDate;
            fetchAppointments();
        });
    }

    // View toggle
    if (viewToggle) {
        viewToggle.addEventListener('change', renderCalendar);
    }
    
    // Date picker
    if (datePicker) {
        datePicker.addEventListener('change', () => {
            if (datePicker.value) {
                currentDate = new Date(datePicker.value);
                fetchAppointments();
            }
        });
    }

    // Filter
    if (roleFilter) {
        roleFilter.addEventListener('change', renderCalendar);
    }

    // Add appointment
    if (addAppt) {
        addAppt.addEventListener('click', () => openModal('add'));
    }
    
    // Cancel modal
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Initialize - fetch real data from DB
    console.log('Initializing schedule page - fetching from DB');
    await fetchDoctors();
    await fetchAppointments();

    // Auto-refresh every 5 minutes
    setInterval(fetchAppointments, 300000);
});