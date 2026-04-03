// Shared JavaScript for all pages

// DOM Elements for modals
const profileBtn = document.getElementById("profileBtn");
const notificationBtn = document.getElementById("notificationBtn");
const logoutBtn = document.getElementById("logoutBtn");
const profileModal = document.getElementById("profileModal");
const notificationModal = document.getElementById("notificationModal");
const logoutModal = document.getElementById("logoutModal");
const closeBtns = document.querySelectorAll(".close-btn");
const cancelLogoutBtn = document.querySelector(".btn-cancel");
const confirmLogoutBtn = document.querySelector(".btn-logout");

// Initialize shared functionality
function initShared() {
  setupModals();
  setupCommonEvents();
}

// Setup modal functionality
function setupModals() {
  // Profile Modal
  if (profileBtn) {
    profileBtn.addEventListener("click", () => {
      profileModal.classList.add("active");
    });
  }

  // Notification Modal
  if (notificationBtn) {
    notificationBtn.addEventListener("click", () => {
      notificationModal.classList.add("active");
    });
  }

  // Logout Modal
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      logoutModal.classList.add("active");
    });
  }

  // Close modals when clicking close buttons
  closeBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const modal = this.closest(".modal");
      if (modal) {
        modal.classList.remove("active");
      }
    });
  });

  // Close modals when clicking outside
  const modals = document.querySelectorAll(".modal");
  modals.forEach((modal) => {
    modal.addEventListener("click", function (e) {
      if (e.target === this) {
        this.classList.remove("active");
      }
    });
  });

  // Logout modal buttons
  if (cancelLogoutBtn) {
    cancelLogoutBtn.addEventListener("click", function () {
      logoutModal.classList.remove("active");
    });
  }

  if (confirmLogoutBtn) {
    confirmLogoutBtn.addEventListener("click", function () {
      alert("Logging out... Redirecting to login page.");
      // In the system: window.location.href = 'login.html';
    });
  }

  // Mark all notifications as read
  const markAllReadBtn = document.querySelector(".btn-full");
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener("click", function () {
      const unreadNotifications = document.querySelectorAll(
        ".notification-item.unread"
      );
      unreadNotifications.forEach((notification) => {
        notification.classList.remove("unread");
      });

      // Update badge count
      const badge = document.querySelector(".badge");
      if (badge) {
        badge.textContent = "0";
        badge.style.display = "none";
      }

      alert("All notifications marked as read");
    });
  }
}

// Setup common events
function setupCommonEvents() {
  // Profile edit functionality
  const editProfileBtn = document.querySelector(
    ".profile-actions .btn:nth-child(1)"
  );
  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", function () {
      alert("Edit profile functionality would open here");
    });
  }

  // Change password functionality
  const changePasswordBtn = document.querySelector(
    ".profile-actions .btn:nth-child(2)"
  );
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener("click", function () {
      const newPassword = prompt("Enter new password:");
      if (newPassword) {
        alert("Password changed successfully");
      }
    });
  }

  // Keyboard shortcuts
  document.addEventListener("keydown", function (e) {
    // Escape key closes modals
    if (e.key === "Escape") {
      document.querySelectorAll(".modal.active").forEach((modal) => {
        modal.classList.remove("active");
      });
    }
  });
}

// Initialize shared functionality when page loads
document.addEventListener("DOMContentLoaded", initShared);
