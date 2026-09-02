/* =====================================================
   CAMPUSCARE COMPLAINT FORM
   STRICT KIET 2KM GEOFENCE VALIDATION
===================================================== */

const API_BASE_URL = "http://192.168.1.8:5000";

// KIET Campus Center Coordinates
const KIET_LATITUDE = 28.75257;
const KIET_LONGITUDE = 77.49851;
const MAX_ALLOWED_DISTANCE = 2000; // Strictly 2 KM (2000 meters)

/* =====================================================
   AUTO-LOAD SELECTED ISSUE
===================================================== */
document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const issueFromUrl = urlParams.get("issue");
    const issueFromStorage = localStorage.getItem("selected_issue");
    const issueSelect = document.getElementById("issueType");

    if (issueSelect) {
        if (issueFromUrl) {
            issueSelect.value = issueFromUrl;
        } else if (issueFromStorage) {
            issueSelect.value = issueFromStorage;
        }
    }
});

/* =====================================================
   MAP INITIALIZATION
===================================================== */
let map;
let userMarker;
let campusCircle;
let isInsideCampus = false;

function initializeMap() {
    map = L.map("campusMap", {
        zoomControl: true,
        attributionControl: false,
        minZoom: 12,
        maxZoom: 20
    }).setView([KIET_LATITUDE, KIET_LONGITUDE], 15);

    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 20
    }).addTo(map);

    // KIET Center Marker
    L.marker([KIET_LATITUDE, KIET_LONGITUDE])
        .addTo(map)
        .bindPopup("<b>🏫 KIET Campus Center</b>");

    // 2 KM Allowed Boundary Circle
    campusCircle = L.circle([KIET_LATITUDE, KIET_LONGITUDE], {
        radius: MAX_ALLOWED_DISTANCE,
        color: "#2563eb",
        fillColor: "#60a5fa",
        fillOpacity: 0.18,
        weight: 2
    }).addTo(map);

    map.fitBounds(campusCircle.getBounds());
}

initializeMap();

/* =====================================================
   HAVERSINE DISTANCE CALCULATION (IN METERS)
===================================================== */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radius of the Earth in meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/* =====================================================
   GET CURRENT LOCATION & 2KM RADIUS CHECK
===================================================== */
function getCurrentLocation() {
    const locationStatus = document.getElementById("locationStatus");
    const locationInput = document.getElementById("location");
    const latitudeInput = document.getElementById("latitude");
    const longitudeInput = document.getElementById("longitude");

    isInsideCampus = false;
    latitudeInput.value = "";
    longitudeInput.value = "";
    locationInput.value = "";

    if (!navigator.geolocation) {
        locationStatus.innerText = "❌ Geolocation is not supported by your browser.";
        locationStatus.className = "location-status error";
        return;
    }

    locationStatus.innerText = "📍 Detecting live GPS location & checking KIET boundary...";
    locationStatus.className = "location-status loading";

    navigator.geolocation.getCurrentPosition(
        async function (position) {
            const userLatitude = position.coords.latitude;
            const userLongitude = position.coords.longitude;

            // Real Distance from KIET Center in Meters
            const distance = calculateDistance(KIET_LATITUDE, KIET_LONGITUDE, userLatitude, userLongitude);
            const distanceInKm = (distance / 1000).toFixed(2);

            // ==========================================
            // CASE 1: OUTSIDE 2 KM BOUNDARY (NOT ALLOWED)
            // ==========================================
            if (distance > MAX_ALLOWED_DISTANCE) {
                isInsideCampus = false;
                latitudeInput.value = "";
                longitudeInput.value = "";
                locationInput.value = "";

                locationStatus.innerText = `❌ Outside Boundary: You are ${distanceInKm} KM away from KIET. Reporting is only allowed within 2 KM.`;
                locationStatus.className = "location-status error";

                showUserLocation(userLatitude, userLongitude, false, distanceInKm);
                showNotificationPopup(`Access Denied: You are ${distanceInKm} KM away from KIET campus (Max allowed: 2 KM).`, "error");
                return;
            }

            // ==========================================
            // CASE 2: INSIDE 2 KM BOUNDARY (ALLOWED)
            // ==========================================
            isInsideCampus = true;
            latitudeInput.value = userLatitude;
            longitudeInput.value = userLongitude;

            locationStatus.innerText = `✓ Verified: Inside KIET Boundary (${distance.toFixed(0)}m from center).`;
            locationStatus.className = "location-status success";

            showUserLocation(userLatitude, userLongitude, true, distanceInKm);

            // Reverse Geocoding for Place Name
            try {
                const geoResponse = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLatitude}&lon=${userLongitude}`
                );
                const geoData = await geoResponse.json();
                if (geoData && geoData.display_name) {
                    locationInput.value = geoData.display_name.split(",").slice(0, 3).join(",") + " (Inside KIET Zone)";
                } else {
                    locationInput.value = `KIET Campus Zone (${userLatitude.toFixed(4)}, ${userLongitude.toFixed(4)})`;
                }
            } catch (e) {
                locationInput.value = `KIET Campus Area`;
            }
        },
        function (error) {
            isInsideCampus = false;
            locationStatus.className = "location-status error";
            if (error.code === error.PERMISSION_DENIED) {
                locationStatus.innerText = "❌ GPS Permission Denied. Please allow location access in your browser.";
            } else {
                locationStatus.innerText = "❌ GPS Error: " + error.message;
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 12000,
            maximumAge: 0
        }
    );
}

/* =====================================================
   SHOW USER LOCATION ON SATELLITE MAP
===================================================== */
function showUserLocation(latitude, longitude, allowed, distanceKm) {
    if (userMarker) {
        map.removeLayer(userMarker);
    }

    userMarker = L.marker([latitude, longitude]).addTo(map);

    if (allowed) {
        userMarker.bindPopup(`<b>📍 Verified Location</b><br>✓ Inside KIET Allowed Zone<br>(${distanceKm} KM from center)`).openPopup();
    } else {
        userMarker.bindPopup(`<b>❌ Out of Boundary</b><br>Distance: ${distanceKm} KM (Allowed: 2 KM max)`).openPopup();
    }

    map.setView([latitude, longitude], 16);
}

/* =====================================================
   DIRECT SUBMISSION WITH STRICT VALIDATION
===================================================== */
async function submitComplaintDirect() {
    const submitBtn = document.getElementById("submitBtn");
    const issue = document.getElementById("issueType").value;
    const priority = document.getElementById("Priority").value;
    const description = document.getElementById("description").value;
    let locationName = document.getElementById("location").value;
    let latitude = document.getElementById("latitude").value;
    let longitude = document.getElementById("longitude").value;
    const imageInput = document.getElementById("image");

    let studentData = localStorage.getItem("campuscare_student");
    let studentObj = null;
    if (studentData) {
        try { studentObj = JSON.parse(studentData); } catch (e) {}
    }

    const kietId = localStorage.getItem("kiet_id") || 
                   (studentObj ? studentObj.kiet_id : null) || 
                   "student@kiet.edu";

    if (!issue) {
        showNotificationPopup("Please select an Issue Type.", "error");
        return;
    }
    if (!priority) {
        showNotificationPopup("Please select the Priority.", "error");
        return;
    }
    if (!description.trim()) {
        showNotificationPopup("Please describe the issue in detail.", "error");
        return;
    }

    // STRICT 2KM CHECK BEFORE DATABASE INSERT
    if (!isInsideCampus || !latitude || !longitude) {
        showNotificationPopup("Location check failed! You must be inside KIET campus (within 2 KM) to submit.", "error");
        return;
    }

    const formData = new FormData();
    formData.append("kiet_id", kietId);
    formData.append("issue_type", issue);
    formData.append("title", `${issue} (${priority})`);
    formData.append("description", description.trim());
    formData.append("location_name", locationName || "KIET Campus Area");
    formData.append("latitude", latitude);
    formData.append("longitude", longitude);

    if (imageInput && imageInput.files.length > 0) {
        formData.append("photo", imageInput.files[0]);
    }

    try {
        submitBtn.disabled = true;
        submitBtn.innerText = "Submitting Complaint...";

        const response = await fetch(`${API_BASE_URL}/api/complaints/submit`, {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showNotificationPopup("Complaint Submitted Successfully! Redirecting in 3 seconds...", "success");

            let count = 3;
            submitBtn.innerText = `Redirecting in ${count}s...`;

            const timer = setInterval(() => {
                count--;
                if (count > 0) {
                    submitBtn.innerText = `Redirecting in ${count}s...`;
                } else {
                    clearInterval(timer);
                    localStorage.removeItem("selected_issue");
                    window.location.href = "dashboard.html";
                }
            }, 1000);

        } else {
            showNotificationPopup(data.message || "Failed to submit complaint.", "error");
            submitBtn.disabled = false;
            submitBtn.innerText = "Submit Complaint";
        }
    } catch (err) {
        console.error("Submission fetch error:", err);
        showNotificationPopup("Server connection failed. Make sure app.py is running.", "error");
        submitBtn.disabled = false;
        submitBtn.innerText = "Submit Complaint";
    }
}

/* =====================================================
   POPUP NOTIFICATION (SUCCESS & ERROR)
===================================================== */
function showNotificationPopup(message, type) {
    const existing = document.querySelector(".form-popup-card");
    if (existing) {
        existing.remove();
    }

    const popup = document.createElement("div");
    popup.className = `form-popup-card ${type}`;

    const icon = type === "success" ? "✓" : "✕";
    const title = type === "success" ? "Success" : "Submission Error";

    popup.innerHTML = `
        <div class="popup-icon-circle">${icon}</div>
        <div class="popup-text-content">
            <strong>${title}</strong>
            <p>${message}</p>
        </div>
    `;

    document.body.appendChild(popup);

    setTimeout(() => popup.classList.add("show"), 10);

    if (type === "error") {
        setTimeout(() => {
            popup.classList.remove("show");
            setTimeout(() => popup.remove(), 300);
        }, 4000);
    }
}

// Window Global Exports
window.submitComplaintDirect = submitComplaintDirect;
window.getCurrentLocation = getCurrentLocation;