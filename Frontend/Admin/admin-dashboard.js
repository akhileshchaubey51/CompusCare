/* =====================================================
   CAMPUSCARE - ADMIN DASHBOARD JS
===================================================== */

const API_BASE_URL = "http://192.168.1.8:5000";
let allComplaints = [];
let currentAdmin = null;

// Department to Issue Type mapping for role-based view
const DEPARTMENT_ISSUE_MAP = {
    "Civil & Road Maintenance": ["Road Issues"],
    "Plumbing & Water Supply": ["Water Issues"],
    "Electrical Maintenance & Power": ["Electricity"],
    "Sanitation & Housekeeping": ["Cleanliness"],
    "Campus Security & Parking": ["Parking"],
    "Estate & Campus Infrastructure": ["Infrastructure"],
    "IT & Network Support": ["Internet / Wi-Fi"],
    "General Administration": ["Other Issues"]
};

/* =====================================================
   PAGE LOAD & AUTHENTICATION CHECK
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
    const adminSession = localStorage.getItem("campuscare_admin");

    if (!adminSession) {
        window.location.href = "index.html";
        return;
    }

    try {
        currentAdmin = JSON.parse(adminSession);
        displayAdminHeader();
    } catch (e) {
        console.error("Admin session parse error:", e);
    }

    loadAdminComplaints();
    setupModalOutsideClick();
});

/* DISPLAY LOGGED-IN ADMIN ROLE/NAME */
function displayAdminHeader() {
    if (!currentAdmin) return;
    
    const titleElem = document.querySelector(".admin-topbar h1");
    const subElem = document.querySelector(".admin-topbar p");

    if (currentAdmin.role !== "Super Admin" && currentAdmin.department) {
        if (titleElem) titleElem.innerText = `${currentAdmin.department} Portal`;
        if (subElem) subElem.innerText = `Logged in as: ${currentAdmin.full_name || currentAdmin.kiet_id}`;
    }
}

/* =====================================================
   FETCH ALL COMPLAINTS
===================================================== */
async function loadAdminComplaints() {
    const tbody = document.getElementById("complaintsTableBody");
    tbody.innerHTML = `<tr><td colspan="8" class="table-empty">⏳ Loading records from SQL database...</td></tr>`;

    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/complaints`);
        const data = await res.json();

        if (res.ok && data.success && data.complaints) {
            let fetchedList = data.complaints;

            // Role-Based Filtering: If Department Admin, filter assigned issues
            if (currentAdmin && currentAdmin.role !== "Super Admin" && currentAdmin.department) {
                const allowedIssues = DEPARTMENT_ISSUE_MAP[currentAdmin.department] || [];
                if (allowedIssues.length > 0) {
                    fetchedList = fetchedList.filter(c => allowedIssues.includes(c.issue_type));
                }
            }

            allComplaints = fetchedList;
            updateStats(allComplaints);
            renderComplaints(allComplaints);
        } else {
            tbody.innerHTML = `<tr><td colspan="8" class="table-empty">No complaints registered in database.</td></tr>`;
        }
    } catch (err) {
        console.error("Admin Load Error:", err);
        tbody.innerHTML = `<tr><td colspan="8" class="table-empty">❌ Server error. Ensure app.py is running on port 5000.</td></tr>`;
    }
}

/* =====================================================
   STATS COUNTER
===================================================== */
function updateStats(complaints) {
    document.getElementById("countTotal").innerText = complaints.length;
    document.getElementById("countPending").innerText = complaints.filter(c => (c.status || "").toLowerCase() === "submitted").length;
    document.getElementById("countInProgress").innerText = complaints.filter(c => (c.status || "").toLowerCase() === "in progress").length;
    document.getElementById("countResolved").innerText = complaints.filter(c => (c.status || "").toLowerCase() === "resolved").length;
}

/* =====================================================
   RENDER TABLE
===================================================== */
function renderComplaints(list) {
    const tbody = document.getElementById("complaintsTableBody");
    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="table-empty">No matching complaints found.</td></tr>`;
        return;
    }

    let html = "";
    list.forEach(c => {
        const status = (c.status || "Submitted").toLowerCase();
        let badgeClass = "badge-submitted";
        if (status === "in progress") badgeClass = "badge-inprogress";
        else if (status === "resolved") badgeClass = "badge-resolved";
        else if (status === "rejected") badgeClass = "badge-rejected";

        html += `
            <tr>
                <td><span class="ticket-badge">#${c.complaint_id}</span></td>
                <td>
                    <strong class="student-name">${c.student_name}</strong>
                    <span class="student-id">${c.kiet_id}</span>
                </td>
                <td><span class="issue-pill">${c.issue_type}</span></td>
                <td class="desc-cell">
                    <p class="desc-text">${c.description}</p>
                    <small class="location-text">📍 ${c.location_name}</small>
                    ${c.admin_remark ? `<div class="remark-note"><strong>Remark:</strong> ${c.admin_remark}</div>` : ''}
                </td>
                <td>
                    ${c.photo_url 
                        ? `<img src="${c.photo_url}" class="thumb-img" title="Click to view full image" onclick="window.open('${c.photo_url}', '_blank')">`
                        : '<span class="no-photo">—</span>'}
                </td>
                <td><span class="date-text">${c.created_at || 'Recent'}</span></td>
                <td><span class="status-badge ${badgeClass}">${c.status || 'Submitted'}</span></td>
                <td>
                    <button class="action-btn" onclick="openStatusModal(${c.complaint_id}, '${c.status || 'Submitted'}', '${escape(c.admin_remark || '')}')">
                        Update Status
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

/* =====================================================
   FILTERING & SEARCH
===================================================== */
function filterComplaints() {
    const searchVal = document.getElementById("searchInput").value.toLowerCase().trim();
    const statusVal = document.getElementById("statusFilter").value;
    const issueVal = document.getElementById("issueFilter").value;

    const filtered = allComplaints.filter(c => {
        const matchesSearch = 
            c.kiet_id.toLowerCase().includes(searchVal) ||
            c.student_name.toLowerCase().includes(searchVal) ||
            c.description.toLowerCase().includes(searchVal) ||
            String(c.complaint_id).includes(searchVal);

        const matchesStatus = (statusVal === "all") || (c.status && c.status.toLowerCase() === statusVal.toLowerCase());
        const matchesIssue = (issueVal === "all") || (c.issue_type && c.issue_type.toLowerCase() === issueVal.toLowerCase());

        return matchesSearch && matchesStatus && matchesIssue;
    });

    renderComplaints(filtered);
}

/* =====================================================
   MODAL LOGIC
===================================================== */
function openStatusModal(id, currentStatus, remark) {
    document.getElementById("modalComplaintId").value = id;
    document.getElementById("modalTicketSubtitle").innerText = `Updating Complaint Ticket #${id}`;
    document.getElementById("modalStatusSelect").value = currentStatus;
    document.getElementById("modalRemarkInput").value = unescape(remark);

    document.getElementById("statusModal").classList.add("show");
}

function closeStatusModal() {
    document.getElementById("statusModal").classList.remove("show");
}

function setupModalOutsideClick() {
    const modal = document.getElementById("statusModal");
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                closeStatusModal();
            }
        });
    }
}

async function saveStatusUpdate(e) {
    e.preventDefault();
    const saveBtn = document.getElementById("saveStatusBtn");
    const complaintId = document.getElementById("modalComplaintId").value;
    const status = document.getElementById("modalStatusSelect").value;
    const adminRemark = document.getElementById("modalRemarkInput").value.trim();

    try {
        saveBtn.disabled = true;
        saveBtn.innerText = "Saving to Database...";

        const res = await fetch(`${API_BASE_URL}/api/admin/complaints/update-status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                complaint_id: complaintId,
                status: status,
                admin_remark: adminRemark
            })
        });

        const data = await res.json();
        if (res.ok && data.success) {
            closeStatusModal();
            loadAdminComplaints(); // Reload fresh state
        } else {
            alert(data.message || "Failed to update complaint status");
        }
    } catch (err) {
        console.error("Status update error:", err);
        alert("Server error during update. Check if backend is active.");
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerText = "Save Changes";
    }
}

/* =====================================================
   ADMIN LOGOUT
===================================================== */
function logoutAdmin() {
    localStorage.removeItem("campuscare_admin");
    window.location.href = "index.html";
}

// Window Global Exports
window.filterComplaints = filterComplaints;
window.loadAdminComplaints = loadAdminComplaints;
window.openStatusModal = openStatusModal;
window.closeStatusModal = closeStatusModal;
window.saveStatusUpdate = saveStatusUpdate;
window.logoutAdmin = logoutAdmin;