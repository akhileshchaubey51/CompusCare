/* =====================================================
   CAMPUSCARE ADMIN AUTHENTICATION
===================================================== */
const API_BASE_URL = "http://192.168.1.8:5000";
function handleAdminLogin(event) {
    event.preventDefault();

    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value.trim();
    const errorMsg = document.getElementById("loginErrorMsg");
    const loginBtn = document.getElementById("loginBtn");

    errorMsg.innerText = "";

    // Default Authority Credentials (Can be configured or connected to backend)
    if (
        (email === "admin@kiet.edu" && password === "admin123") ||
        (email === "admin" && password === "admin123") ||
        (email === "authority@kiet.edu" && password === "kiet2026")
    ) {
        loginBtn.disabled = true;
        loginBtn.innerText = "Authenticating Session...";

        localStorage.setItem("campuscare_admin", JSON.stringify({
            username: email,
            role: "Chief Administrator",
            logged_at: new Date().toISOString()
        }));

        setTimeout(() => {
            window.location.replace("admin-dashboard.html");
        }, 800);

    } else {
        errorMsg.innerText = "❌ Invalid Administrator credentials.";
        document.getElementById("adminPassword").value = "";
    }
}