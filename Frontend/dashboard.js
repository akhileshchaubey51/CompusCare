/* =========================================================
   CAMPUSCARE - STUDENT DASHBOARD JAVASCRIPT
   ========================================================= */
const API_BASE_URL = "http://192.168.1.8:5000";

let currentStudent = null;

const DEFAULT_AVATAR = "https://ui-avatars.com/api/?name=Student&background=2563eb&color=fff&bold=true";

/* =========================================================
   PAGE LOAD
   ========================================================= */
document.addEventListener("DOMContentLoaded", function () {
    console.log("CampusCare Dashboard JS Loaded");
    loadStudentData();
    setupOutsideClick();
    setupHoverProfile();
});

/* =========================================================
   HOVER SUPPORT FOR PROFILE DROPDOWN
   ========================================================= */
function setupHoverProfile() {
    const profileContainer = document.getElementById("studentProfileContainer");
    const dropdown = document.getElementById("profileDropdown");

    if (profileContainer && dropdown) {
        profileContainer.addEventListener("mouseenter", function () {
            dropdown.classList.add("show");
        });

        profileContainer.addEventListener("mouseleave", function () {
            dropdown.classList.remove("show");
        });
    }
}

/* =========================================================
   PROFILE DROPDOWN TOGGLE & OUTSIDE CLICK
   ========================================================= */
function toggleProfileMenu(event) {
    if (event) {
        event.stopPropagation();
    }
    const dropdown = document.getElementById("profileDropdown");
    if (dropdown) {
        dropdown.classList.toggle("show");
    }
}

function closeProfileMenu() {
    const dropdown = document.getElementById("profileDropdown");
    if (dropdown) {
        dropdown.classList.remove("show");
    }
}

function setupOutsideClick() {
    document.addEventListener("click", function (event) {
        const profile = document.getElementById("studentProfileContainer");
        const dropdown = document.getElementById("profileDropdown");

        if (profile && !profile.contains(event.target)) {
            if (dropdown && dropdown.classList.contains("show")) {
                dropdown.classList.remove("show");
            }
        }
    });
}

/* =========================================================
   LOAD LOGGED-IN STUDENT DATA
   ========================================================= */
async function loadStudentData() {
    try {
        const studentData = localStorage.getItem("campuscare_student");
        const kietId = localStorage.getItem("kiet_id") || localStorage.getItem("kietId");

        if (studentData) {
            try {
                currentStudent = JSON.parse(studentData);
                if (currentStudent) {
                    displayStudentData(currentStudent);
                }
            } catch (err) {
                console.error("Local data parse error:", err);
            }
        }

        if (!kietId && !studentData) {
            window.location.href = "login.html";
            return;
        }

        const activeId = kietId || (currentStudent ? currentStudent.kiet_id : null);
        if (activeId) {
            await fetchStudentProfile(activeId);
        }
    } catch (error) {
        console.error("Dashboard init error:", error);
    }
}

/* =========================================================
   FETCH STUDENT PROFILE FROM BACKEND
   ========================================================= */
async function fetchStudentProfile(kietId) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/student/profile?kiet_id=${encodeURIComponent(kietId)}`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        if (!response.ok) return;

        const data = await response.json();
        if (data.success && data.student) {
            currentStudent = data.student;
            localStorage.setItem("campuscare_student", JSON.stringify(data.student));
            localStorage.setItem("kiet_id", data.student.kiet_id);
            displayStudentData(data.student);
        }
    } catch (error) {
        console.error("Profile sync error:", error);
    }
}

/* =========================================================
   DISPLAY STUDENT DATA
   ========================================================= */
function displayStudentData(student) {
    if (!student) return;

    const studentName = student.name && String(student.name).trim() ? student.name : "Student";
    const profileName = document.getElementById("profileName");
    const dropdownProfileName = document.getElementById("dropdownProfileName");

    if (profileName) profileName.textContent = studentName;
    if (dropdownProfileName) dropdownProfileName.textContent = studentName;

    const profileCourse = document.getElementById("profileCourse");
    if (profileCourse) {
        let courseInfo = student.course || student.department || "Student";
        if (student.semester) {
            courseInfo += ` • Sem ${student.semester}`;
        }
        profileCourse.textContent = courseInfo;
    }

    const dropdownKietId = document.getElementById("dropdownKietId");
    if (dropdownKietId) {
        dropdownKietId.textContent = student.kiet_id || "KIET ID";
    }

    updateProfilePhoto(student.profile_photo, studentName);
}

/* =========================================================
   PROFILE PHOTO RESOLUTION (NO 404 ERROR)
   ========================================================= */
function updateProfilePhoto(photo, name = "Student") {
    const fallbackPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563eb&color=fff&bold=true`;
    let photoURL = fallbackPhoto;

    if (photo && String(photo).trim() !== "") {
        const cleanPhoto = String(photo).trim();
        if (cleanPhoto.startsWith("http://") || cleanPhoto.startsWith("https://")) {
            photoURL = cleanPhoto;
        } else if (cleanPhoto.startsWith("uploads/")) {
            photoURL = `${API_BASE_URL}/${cleanPhoto}`;
        } else if (cleanPhoto.startsWith("images/")) {
            photoURL = cleanPhoto;
        } else {
            photoURL = `${API_BASE_URL}/uploads/profiles/${cleanPhoto}`;
        }
    }

    const profilePhoto = document.getElementById("profilePhoto");
    const dropdownProfilePhoto = document.getElementById("dropdownProfilePhoto");

    if (profilePhoto) {
        profilePhoto.src = photoURL;
        profilePhoto.onerror = function () {
            this.onerror = null;
            this.src = fallbackPhoto;
        };
    }
    if (dropdownProfilePhoto) {
        dropdownProfilePhoto.src = photoURL;
        dropdownProfilePhoto.onerror = function () {
            this.onerror = null;
            this.src = fallbackPhoto;
        };
    }
}

/* =========================================================
   1. MY PROFILE MODAL
   ========================================================= */
function openMyProfile() {
    closeProfileMenu();
    const modal = document.getElementById("profileViewModal");
    if (!modal) return;

    if (currentStudent) {
        document.getElementById("viewStudentName").textContent = currentStudent.name || "-";
        document.getElementById("viewStudentId").textContent = currentStudent.kiet_id || "-";
        document.getElementById("viewStudentCourse").textContent = currentStudent.course || "-";
        document.getElementById("viewStudentDept").textContent = currentStudent.department || "-";
        document.getElementById("viewStudentSemester").textContent = currentStudent.semester ? `Semester ${currentStudent.semester}` : "-";
        document.getElementById("viewStudentPhone").textContent = currentStudent.phone || "Not Provided";
    }

    modal.classList.add("show");
    document.body.classList.add("modal-open");
}

function closeMyProfile() {
    const modal = document.getElementById("profileViewModal");
    if (modal) modal.classList.remove("show");
    document.body.classList.remove("modal-open");
}

/* =========================================================
   2. MY COMPLAINTS MODAL (FETCH & DISPLAY LIVE DATA)
   ========================================================= */
async function openMyComplaints() {
    closeProfileMenu();
    const modal = document.getElementById("complaintsModal");
    if (!modal) return;

    modal.classList.add("show");
    document.body.classList.add("modal-open");

    await loadStudentComplaints();
}

function closeMyComplaints() {
    const modal = document.getElementById("complaintsModal");
    if (modal) modal.classList.remove("show");
    document.body.classList.remove("modal-open");
}

async function loadStudentComplaints() {
    const container = document.getElementById("complaintsListContainer");
    if (!container) return;

    const kietId = localStorage.getItem("kiet_id") || (currentStudent ? currentStudent.kiet_id : "student@kiet.edu");

    container.innerHTML = `
        <div class="complaints-loading-state">
            <div class="loading-spinner"></div>
            <p>Fetching your complaint history...</p>
        </div>
    `;

    try {
        const response = await fetch(`${API_BASE_URL}/api/student/complaints?kiet_id=${encodeURIComponent(kietId)}`);
        const data = await response.json();

        if (response.ok && data.success && data.complaints && data.complaints.length > 0) {
            let html = "";
            data.complaints.forEach(item => {
                let statusClass = "status-submitted";
                
                const status = (item.status || "Submitted").toLowerCase();
                if (status === "in progress") {
                    statusClass = "status-inprogress";
                } else if (status === "resolved") {
                    statusClass = "status-resolved";
                } else if (status === "rejected") {
                    statusClass = "status-rejected";
                }

                html += `
                    <div class="complaint-item-card">
                        <div class="complaint-card-header">
                            <div class="ticket-meta">
                                <span class="complaint-ticket-id">#${item.complaint_id}</span>
                                <h4 class="complaint-issue-title">${item.issue_type}</h4>
                            </div>
                            <span class="complaint-status-badge ${statusClass}">
                                <span class="status-dot"></span> ${item.status || "Submitted"}
                            </span>
                        </div>

                        <p class="complaint-card-desc">${item.description}</p>

                        ${item.photo_url ? `
                            <div class="complaint-img-wrapper">
                                <img src="${item.photo_url}" alt="Complaint Attachment" onclick="window.open('${item.photo_url}', '_blank')">
                                <span class="img-zoom-hint">🔍 Click to view</span>
                            </div>
                        ` : ''}

                        <div class="complaint-card-footer">
                            <div class="footer-chip">
                                <span class="chip-icon">📍</span>
                                <span>${item.location_name || "KIET Campus"}</span>
                            </div>
                            <div class="footer-chip">
                                <span class="chip-icon">🕒</span>
                                <span>${item.created_at || "Recent"}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        } else {
            container.innerHTML = `
                <div class="modern-empty-box">
                    <div class="empty-icon-glow">📂</div>
                    <h3>No Active Complaints</h3>
                    <p>All campus issues reported by you will show up here.</p>
                </div>
            `;
        }
    } catch (err) {
        console.error("Error loading complaints:", err);
        container.innerHTML = `
            <div class="modern-empty-box error-box">
                <div class="empty-icon-glow">⚠️</div>
                <h3>Failed to load tickets</h3>
                <p>Could not connect to the server. Please check your backend connection.</p>
            </div>
        `;
    }
}

/* =========================================================
   3. CHANGE PASSWORD MODAL & API
   ========================================================= */
function openChangePassword() {
    closeProfileMenu();
    const modal = document.getElementById("passwordModal");
    if (!modal) return;

    modal.classList.add("show");
    document.body.classList.add("modal-open");

    document.getElementById("currentPassword").value = "";
    document.getElementById("newPassword").value = "";
    document.getElementById("confirmPassword").value = "";
    const msg = document.getElementById("passwordMessage");
    if (msg) msg.textContent = "";
}

function closeChangePassword() {
    const modal = document.getElementById("passwordModal");
    if (modal) modal.classList.remove("show");
    document.body.classList.remove("modal-open");
}

async function changePassword(event) {
    event.preventDefault();

    const currentPassword = document.getElementById("currentPassword").value.trim();
    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();
    const kietId = localStorage.getItem("kiet_id") || (currentStudent ? currentStudent.kiet_id : null);

    if (!kietId) {
        showPasswordMessage("Session invalid. Please login again.", "error");
        return;
    }

    if (newPassword.length < 6) {
        showPasswordMessage("New password must be at least 6 characters.", "error");
        return;
    }

    if (newPassword !== confirmPassword) {
        showPasswordMessage("Passwords do not match.", "error");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/change-password`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                kiet_id: kietId,
                current_password: currentPassword,
                new_password: newPassword
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            showPasswordMessage(data.message || "Failed to change password.", "error");
            return;
        }

        showPasswordMessage("Password changed successfully!", "success");
        setTimeout(closeChangePassword, 1500);

    } catch (error) {
        showPasswordMessage("Unable to connect to server.", "error");
    }
}

function showPasswordMessage(text, type) {
    const msg = document.getElementById("passwordMessage");
    if (!msg) return;
    msg.textContent = text;
    msg.className = "password-message " + (type === "success" ? "success" : "error");
}

/* =========================================================
   NAVIGATION & UTILITIES
   ========================================================= */
function openComplaintPage(issueType) {
    localStorage.setItem("selected_issue", issueType);
    window.location.href = "complaint-form.html";
}

function scrollToIssues() {
    const issuesSection = document.getElementById("issues");
    if (issuesSection) {
        issuesSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

async function logoutUser() {
    try {
        await fetch(`${API_BASE_URL}/api/logout`, {
            method: "POST",
            credentials: "include"
        });
    } catch (e) {}

    localStorage.clear();
    window.location.href = "login.html";
}

/* =========================================================
   MODAL CLICK & ESCAPE KEY CLOSERS
   ========================================================= */
document.addEventListener("click", function (event) {
    ["complaintsModal", "passwordModal", "profileViewModal"].forEach(id => {
        const modal = document.getElementById(id);
        if (modal && event.target === modal) {
            modal.classList.remove("show");
            document.body.classList.remove("modal-open");
        }
    });
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeMyProfile();
        closeMyComplaints();
        closeChangePassword();
        closeProfileMenu();
    }
});

// Window Exports
window.toggleProfileMenu = toggleProfileMenu;
window.openMyProfile = openMyProfile;
window.closeMyProfile = closeMyProfile;
window.openMyComplaints = openMyComplaints;
window.closeMyComplaints = closeMyComplaints;
window.openChangePassword = openChangePassword;
window.closeChangePassword = closeChangePassword;
window.changePassword = changePassword;
window.openComplaintPage = openComplaintPage;
window.scrollToIssues = scrollToIssues;
window.logoutUser = logoutUser;