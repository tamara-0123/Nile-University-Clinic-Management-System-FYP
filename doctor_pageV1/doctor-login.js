<<<<<<< HEAD
document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  // Mock credentials and PROTOTYPE ONLY
  if (email === "doctor@nile.edu.ng" && password === "password123") {
    window.location.href = "doctor.html";
  } else {
    alert("Invalid login credentials");
  }
});

if (email === "doctor@nile.edu.ng" && password === "password123") {
  sessionStorage.setItem("doctorLoggedIn", "true");
  sessionStorage.setItem("lastActivity", Date.now());
  window.location.href = "doctor.html";
}

=======
document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  // Mock credentials and PROTOTYPE ONLY
  if (email === "doctor@nile.edu.ng" && password === "password123") {
    window.location.href = "doctor.html";
  } else {
    alert("Invalid login credentials");
  }
});

if (email === "doctor@nile.edu.ng" && password === "password123") {
  sessionStorage.setItem("doctorLoggedIn", "true");
  sessionStorage.setItem("lastActivity", Date.now());
  window.location.href = "doctor.html";
}

>>>>>>> 1f6c2de (Added Figma UI/UX designs)
