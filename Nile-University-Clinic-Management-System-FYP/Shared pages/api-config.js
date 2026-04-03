// api-config.js - Centralized API configuration for Nile University CMS frontend

const API_CONFIG = {
    BASE_URL: 'http://127.0.0.1:5001/api',

    // Auth helper
    getToken: () => localStorage.getItem('authToken'),
    getUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    // Core request helper
    async request(endpoint, options = {}) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(`${this.BASE_URL}${endpoint}`, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Auth Module
    auth: {
        login: (credentials) => API_CONFIG.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        }),
        logout: () => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            window.location.href = '../Shared pages/login.html';
        }
    },

    // Patient Module
    patient: {
        getAll: () => API_CONFIG.request('/patient'),
        getById: (id) => API_CONFIG.request(`/patient/${id}`),
        create: (data) => API_CONFIG.request('/patient', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        getAppointmentHistory: () => API_CONFIG.request('/patient/appointments/history'),
        getMedicalHistory: () => API_CONFIG.request('/patient/medical-history'),
        getPrescriptions: () => API_CONFIG.request('/patient/prescriptions'),
        getNotifications: () => API_CONFIG.request('/patient/notifications'),
        submitFeedback: (data) => API_CONFIG.request('/patient/feedback', {
            method: 'POST',
            body: JSON.stringify(data)
        })
        
    },
    
    // Doctor Module
    doctor: {
        getDailySchedule: () => API_CONFIG.request('/doctor/appointments'),
        getRecentReferrals: () => API_CONFIG.request('/doctor/referrals'),
        getAppointments: () => API_CONFIG.request('/doctor/appointments'),
        getPatientRecord: (patientId) => API_CONFIG.request(`/doctor/patient/${patientId}`),
        createConsultation: (appointmentId, data) => API_CONFIG.request(`/doctor/consultation/${appointmentId}`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        createSimplifiedPrescription: (consultationId, data) => API_CONFIG.request(`/doctor/prescription/simplified/${consultationId}`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        completeAppointment: (appointmentId) => API_CONFIG.request(`/doctor/complete/${appointmentId}`, {
            method: 'PUT'
        }),
        getVitals: (params) => {
            const queryParams = new URLSearchParams(params).toString();
            return API_CONFIG.request(`/doctor/vitals?${queryParams}`);
        },
        saveVitals: (data) => API_CONFIG.request('/doctor/vitals', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        updateVitals: (vitalsId, data) => API_CONFIG.request(`/doctor/vitals/${vitalsId}`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        admitPatient: (data) => API_CONFIG.request('/doctor/admit', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        dischargePatient: (admissionId) => API_CONFIG.request(`/doctor/discharge/${admissionId}`, {
            method: 'PUT'
        }),
        getAdmissionStatus: (params) => {
            const queryParams = new URLSearchParams(params).toString();
            return API_CONFIG.request(`/doctor/admission/status?${queryParams}`);
        }
    },
    
    // Pharmacist Module - NEW
    pharmacist: {
        getPendingPrescriptions: () => API_CONFIG.request('/pharmacist/prescriptions/pending'),
        getPrescriptionById: (prescriptionId) => API_CONFIG.request(`/pharmacist/prescription/${prescriptionId}`),
        getPrescriptionVitals: (prescriptionId) => API_CONFIG.request(`/pharmacist/prescription/${prescriptionId}/vitals`),
        completePrescription: (prescriptionId, data) => API_CONFIG.request(`/pharmacist/prescription/${prescriptionId}/complete`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        getStats: () => API_CONFIG.request('/pharmacist/stats'),
        getNotifications: () => API_CONFIG.request('/pharmacist/notifications'),
        markNotificationRead: (notificationId) => API_CONFIG.request(`/pharmacist/notifications/${notificationId}/read`, {
            method: 'PUT'
        }),
        getPrescriptionHistory: (params = {}) => {
            const queryParams = new URLSearchParams(params).toString();
            return API_CONFIG.request(`/pharmacist/prescriptions/history?${queryParams}`);
        },
        getInventoryAlerts: () => API_CONFIG.request('/pharmacist/inventory/alerts'),
        updateInventory: (data) => API_CONFIG.request('/pharmacist/inventory', {
            method: 'PUT',
            body: JSON.stringify(data)
        })
    },
    
    // Nurse Module
    nurse: {
        getVitalsQueue: () => API_CONFIG.request('/nurse/queue'),
        getAllAppointments: () => API_CONFIG.request('/nurse/queue'),
        getDailyReport: () => API_CONFIG.request('/nurse/report/daily'),
        recordVitals: (data) => API_CONFIG.request('/nurse/vitals', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        getAppointmentById: (appointmentId) => API_CONFIG.request(`/nurse/appointment/${appointmentId}`),
        updateAppointmentStatus: (appointmentId, status) => API_CONFIG.request(`/nurse/appointment/${appointmentId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        })
    },
    
    // Admin Module
    admin: {
        getAllUsers: () => API_CONFIG.request('/admin/users'),
        getSystemStats: () => API_CONFIG.request('/admin/stats'),
        createUser: (data) => API_CONFIG.request('/admin/users', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        updateUser: (userId, data) => API_CONFIG.request(`/admin/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        deleteUser: (userId) => API_CONFIG.request(`/admin/users/${userId}`, {
            method: 'DELETE'
        }),
        getSystemLogs: () => API_CONFIG.request('/admin/logs'),
        getReports: () => API_CONFIG.request('/admin/reports')
    },

    // Reports Module
    reports: {
        getDaily: () => API_CONFIG.request('/reports/daily'),
        getWeekly: (fromDate, toDate) => {
            const params = new URLSearchParams();
            if (fromDate) params.append('fromDate', fromDate);
            if (toDate) params.append('toDate', toDate);
            return API_CONFIG.request(`/reports/weekly?${params}`);
        },
        getMonthlyDiagnoses: (fromDate, toDate) => {
            const params = new URLSearchParams();
            if (fromDate) params.append('fromDate', fromDate);
            if (toDate) params.append('toDate', toDate);
            return API_CONFIG.request(`/reports/diagnoses/monthly?${params}`);
        },
        getDateRangeReport: (params) => {
            const queryParams = new URLSearchParams(params).toString();
            return API_CONFIG.request(`/reports/date-range?${queryParams}`);
        },
        getRecentPatients: (limit = 10) => 
            API_CONFIG.request(`/reports/recent-patients?limit=${limit}`),
        getPharmacistReport: (fromDate, toDate) => {
            const params = new URLSearchParams();
            if (fromDate) params.append('fromDate', fromDate);
            if (toDate) params.append('toDate', toDate);
            return API_CONFIG.request(`/reports/pharmacist?${params}`);
        }
    }
};

// Global authentication check
function checkAuth() {
    const token = API_CONFIG.getToken();
    const currentPage = window.location.pathname;

    if (!token && !currentPage.includes('login.html')) {
        window.location.href = '../Shared pages/login.html';
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
}