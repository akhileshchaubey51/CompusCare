/* =========================================================
   CAMPUSCARE - ADMIN STUDENT MANAGEMENT JAVASCRIPT
   ========================================================= */

const API_BASE_URL = "http://192.168.1.8:5000";

// Page load check: Validate if Admin is logged in
document.addEventListener("DOMContentLoaded", function () {
    const adminSession = localStorage.getItem("campuscare_admin");
    
    // Agar admin login nahi hai toh index.html par redirect karein
    if (!adminSession) {
        window.location.href = "index.html";
    }
});

/* =========================================================
   ADD STUDENT FORM SUBMISSION
   ========================================================= */
async function addStudent(event) {
    event.preventDefault();

    const form = document.getElementById("studentForm");
    const addBtn = document.getElementById("addStudentBtn");
    const messageBox = document.getElementById("formMessage");

    const kietId = document.getElementById("kiet_id").value.trim();
    const name = document.getElementById("name").value.trim();
    const department = document.getElementById("department").value.trim();
    const course = document.getElementById("course").value;
    const semester = document.getElementById("semester").value;
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value.trim();
    const status = document.getElementById("status").value;
    const photoInput = document.getElementById("profilePhoto");

    // Basic Client Validations
    if (!kietId || !name || !department || !course || !semester || !password) {
        showMessage("Please fill all required fields.", "error");
        return;
    }

    if (phone && (phone.length !== 10 || !/^\d{10}$/.test(phone))) {
        showMessage("Phone number must contain exactly 10 digits.", "error");
        return;
    }

    if (password.length < 6) {
        showMessage("Password must be at least 6 characters long.", "error");
        return;
    }

    // Build FormData object for file & text fields
    const formData = new FormData();
    formData.append("kiet_id", kietId);
    formData.append("name", name);
    formData.append("department", department);
    formData.append("course", course);
    formData.append("semester", semester);
    formData.append("phone", phone);
    formData.append("password", password);
    formData.append("status", status);

    if (photoInput && photoInput.files.length > 0) {
        formData.append("profile_photo", photoInput.files[0]);
    }

    try {
        addBtn.disabled = true;
        addBtn.innerText = "Saving to Database...";
        clearMessage();

        const response = await fetch(`${API_BASE_URL}/api/admin/students`, {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showMessage(`✓ Success! Student "${name}" (${kietId}) added successfully.`, "success");
            
            // Reset the form
            form.reset();
            
            // Hide preview
            const previewContainer = document.getElementById("photoPreviewContainer");
            const preview = document.getElementById("photoPreview");
            if (previewContainer) previewContainer.style.display = "none";
            if (preview) preview.src = "";

        } else {
            showMessage(`❌ ${data.message || "Unable to add student."}`, "error");
        }

    } catch (error) {
        console.error("Student add fetch error:", error);
        showMessage("❌ Server connection failed. Make sure app.py is running on port 5000.", "error");
    } finally {
        addBtn.disabled = false;
        addBtn.innerText = "+ Add Student";
    }
}

/* =========================================================
   FORM MESSAGE HELPERS
   ========================================================= */
function showMessage(text, type) {
    const msgBox = document.getElementById("formMessage");
    if (!msgBox) return;

    msgBox.textContent = text;
    msgBox.className = `form-message ${type}`;
    msgBox.style.display = "block";
}

function clearMessage() {
    const msgBox = document.getElementById("formMessage");
    if (!msgBox) return;

    msgBox.textContent = "";
    msgBox.className = "form-message";
    msgBox.style.display = "none";
}

/* =========================================================
   ADMIN LOGOUT
   ========================================================= */
function adminLogout() {
    localStorage.removeItem("campuscare_admin");
    window.location.href = "index.html";
}

// Window Global Exports
window.addStudent = addStudent;
window.clearMessage = clearMessage;
window.adminLogout = adminLogout;