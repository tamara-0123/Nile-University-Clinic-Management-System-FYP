document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const idNumber = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const data = await API_CONFIG.auth.login('doctor', idNumber, password);
    if (data.success) {
      window.location.href = "./homepage-doctor/homepage-d.html";
    }
  } catch (error) {
    console.error('Login error:', error);
    alert(error.message || "Invalid login credentials");
  }
});

