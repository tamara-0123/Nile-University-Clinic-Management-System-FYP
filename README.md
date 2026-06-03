# Nile University Clinic Management System (CMS)

A secure, multi-tier digital health platform engineered to migrate clinical operations from a manual, paper-based framework to an automated, role-based digital workflow. 
This system centralizes patient records, optimizes the triage-to-consultation handoff, and guarantees data integrity for high-concurrency university clinic environments.

---

## 🚀 Architectural & Engineering Highlights

* **Asynchronous High-Concurrency Performance:** Developed utilizing Node.js and Express.js. The non-blocking, event-driven architecture ensures the system remains highly responsive under simultaneous loads from up to 100+ concurrent clinic staff, nurses, and students without thread-blocking.
* **Decoupled Relational Document Modeling:** Implemented a highly normalized MongoDB schema using Mongoose ODM. Transactions and workflows (such as prescriptions and appointments) maintain rigid integrity boundaries by referencing highly specific collections (`Users`, `Patients`, `Appointments`, `Consultations`, `Prescriptions`) via MongoDB ObjectIds rather than unstructured document embedding.
* **Application-Layer Guardrails:** Because MongoDB lacks native relational foreign key constraints, data integrity is strictly enforced at the application layer using Mongoose schemas, data-type validations, and status state-machine enums (e.g., controlling appointment transitions from `scheduled` to `waiting` or `admitted`).
* **Defensive Security Engineering:** Secured via JSON Web Tokens (JWT) for stateless session management, `bcrypt` (cost factor 12) for cryptographic password hashing, and custom middleware executing rigid Role-Based Access Control (RBAC). Implemented centralized error-handling to catch runtime exceptions and sanitize output, preventing internal schema or database vulnerabilities from leaking to the frontend client.
* **Rigid Lifecycle Engineering:** Developed under a structured Waterfall Methodology. Requirements and Entity-Relationship Diagrams (ERD) were frozen prior to backend construction to completely eliminate scope creep and mitigate structural data risks inherent to iterative development in clinical software.

---

## 🛠️ Technology Stack

* **Runtime Environment:** Node.js (v16+)
* **Backend Architecture:** Express.js Framework
* **Database & Object Modeling:** MongoDB & Mongoose ODM
* **Security & Middleware:** JWT, Bcrypt, Helmet HTTP Security Headers
* **Frontend Interface:** Responsive HTML5, CSS3, and Native Asynchronous JavaScript (ES6+)

---

## 🏗️ System Topology & Role Portals

The platform implements a strict separation of concerns through five decoupled access layers:
1. **Student/Patient Portal:** Authenticated read-only access to personal medical histories, appointment bookings, and issued digital prescriptions.
2. **Nurse Triage Portal:** Dynamic queue management and electronic record capture of pre-consultation vital metrics (BP, temperature, weight) with direct handoff routing.
3. **Doctor Portal:** Concurrent schedule management and real-time synthesis of patient medical histories, clinical vitals, diagnostic inputs, and prescription generation.
4. **Pharmacist Portal:** Direct consumption of electronic prescription pipelines to manage dosage configuration, frequency instructions, and status fulfillment.
5. **Administrative Dashboard:** Analytical reporting, clinic schedule configuration, and RBAC staff account provisioning.

---

## ⚙️ Execution & Environmental Setup

### Prerequisites
* Node.js (Version 16.x or higher)
* MongoDB local instance or an active MongoDB Atlas cluster

### Local Deployment Setup
Clone the codebase, install all necessary dependencies, configure environment variables, and boot up the development server using the unified command sequence below:

```bash
# Clone the repository and navigate to the project root
git clone [https://github.com/ahmadmustapha764/your-repo-name.git](https://github.com/ahmadmustapha764/your-repo-name.git)
cd your-repo-name

# Install all runtime and development environment dependencies
npm install

# Create and configure the environment variables file
cat <<EOT>> .env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
EOT

# Spin up the local Express development server
npm start
