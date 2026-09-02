
/* =====================================================
   CAMPUSCARE STUDENT DASHBOARD
===================================================== */
const API_BASE_URL = "http://192.168.1.8:5000";


/* =====================================================
   PROFILE DROPDOWN
===================================================== */

function toggleProfileMenu() {

    const menu = document.getElementById("profileDropdown");

    menu.classList.toggle("active");

}


/* Close profile menu when clicking outside */

document.addEventListener("click", function (event) {

    const profile = document.querySelector(".student-profile");
    const menu = document.getElementById("profileDropdown");

    if (
        profile &&
        menu &&
        !profile.contains(event.target)
    ) {
        menu.classList.remove("active");
    }

});


/* =====================================================
   OPEN ISSUE FORM
===================================================== */

function openIssueForm(issueName) {

    const modal = document.getElementById("issueModal");

    const title = document.getElementById("issueFormTitle");

    const category = document.getElementById("issueCategory");

    title.textContent = "Report " + issueName;

    category.value = issueName;

    modal.classList.add("active");

    document.body.style.overflow = "hidden";

}


/* =====================================================
   CLOSE ISSUE FORM
===================================================== */

function closeIssueForm() {

    const modal = document.getElementById("issueModal");

    modal.classList.remove("active");

    document.body.style.overflow = "";

}


/* =====================================================
   CURRENT LOCATION / GPS
===================================================== */

function getCurrentLocation() {

    const status = document.getElementById("locationStatus");

    const latitudeInput = document.getElementById("latitude");

    const longitudeInput = document.getElementById("longitude");


    /* Browser support check */

    if (!navigator.geolocation) {

        status.classList.add("error");

        status.innerHTML = `
            <span>❌</span>

            <div>
                <strong>Location Not Supported</strong>

                <p>
                    Your browser does not support GPS location.
                </p>
            </div>
        `;

        return;
    }


    /* Loading */

    status.classList.remove("success");
    status.classList.remove("error");

    status.innerHTML = `
        <span>📡</span>

        <div>
            <strong>Fetching Current Location...</strong>

            <p>
                Please allow location permission in your browser.
            </p>
        </div>
    `;


    navigator.geolocation.getCurrentPosition(

        function (position) {

            const latitude = position.coords.latitude;

            const longitude = position.coords.longitude;


            /* Save coordinates */

            latitudeInput.value = latitude;

            longitudeInput.value = longitude;


            /* Update UI */

            status.classList.add("success");

            status.innerHTML = `
                <span>📍</span>

                <div>
                    <strong>Current Location Detected</strong>

                    <p>
                        Latitude: ${latitude.toFixed(6)}
                        &nbsp; | &nbsp;
                        Longitude: ${longitude.toFixed(6)}
                    </p>
                </div>
            `;


            console.log("Latitude:", latitude);

            console.log("Longitude:", longitude);

        },


        function (error) {

            status.classList.remove("success");

            status.classList.add("error");


            let message =
                "Unable to fetch your current location.";


            if (error.code === 1) {

                message =
                    "Location permission was denied. Please allow location access.";

            }

            else if (error.code === 2) {

                message =
                    "Location information is currently unavailable.";

            }

            else if (error.code === 3) {

                message =
                    "Location request timed out. Please try again.";

            }


            status.innerHTML = `
                <span>❌</span>

                <div>
                    <strong>Location Error</strong>

                    <p>
                        ${message}
                    </p>
                </div>
            `;


            console.error("Location Error:", error);

        },

        {
            enableHighAccuracy: true,

            timeout: 10000,

            maximumAge: 0
        }

    );

}


/* =====================================================
   FILE UPLOAD
===================================================== */

function showSelectedImage(input) {

    const selectedFile =
        document.getElementById("selectedFile");


    if (input.files && input.files.length > 0) {

        const file = input.files[0];

        selectedFile.textContent =
            "✓ Selected: " + file.name;

    }

    else {

        selectedFile.textContent = "";

    }

}


/* =====================================================
   SUBMIT ISSUE
===================================================== */

function submitIssue(event) {

    event.preventDefault();


    const category =
        document.getElementById("issueCategory").value;

    const priority =
        document.getElementById("issuePriority").value;

    const description =
        document.getElementById("issueDescription").value;

    const manualLocation =
        document.getElementById("manualLocation").value;

    const latitude =
        document.getElementById("latitude").value;

    const longitude =
        document.getElementById("longitude").value;

    const image =
        document.getElementById("issueImage").files[0];


    /* Temporary frontend object */

    const complaintData = {

        issue_category: category,

        priority: priority,

        description: description,

        location: manualLocation,

        latitude: latitude,

        longitude: longitude,

        image_name:
            image ? image.name : null

    };


    console.log(
        "Complaint Data:",
        complaintData
    );


    /*
        IMPORTANT:

        अभी यह data database में नहीं जा रहा है।

        बाद में इसी object को Flask API के साथ connect करेंगे.

        Example:

        fetch("http://127.0.0.1:5000/api/complaints", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(complaintData)
        });
    */


    alert(
        "Complaint form submitted successfully!\n\n" +
        "Issue: " + category
    );


    closeIssueForm();

    document.getElementById("issueForm").reset();

    document.getElementById("latitude").value = "";

    document.getElementById("longitude").value = "";

    document.getElementById("selectedFile").textContent = "";


    document.getElementById("locationStatus").className =
        "location-status";

    document.getElementById("locationStatus").innerHTML = `
        <span>📍</span>

        <div>

            <strong>
                Current Location
            </strong>

            <p>
                Click "Use Current Location" to fetch GPS coordinates.
            </p>

        </div>
    `;

}


/* =====================================================
   MY COMPLAINTS
===================================================== */

function openMyComplaints() {

    document
        .getElementById("profileDropdown")
        .classList.remove("active");

    document
        .getElementById("complaintsModal")
        .classList.add("active");

    document.body.style.overflow = "hidden";

}


function closeMyComplaints() {

    document
        .getElementById("complaintsModal")
        .classList.remove("active");

    document.body.style.overflow = "";

}


/* =====================================================
   CHANGE PASSWORD
===================================================== */

function openChangePassword() {

    document
        .getElementById("profileDropdown")
        .classList.remove("active");

    document
        .getElementById("passwordModal")
        .classList.add("active");

    document.body.style.overflow = "hidden";

}


function closeChangePassword() {

    document
        .getElementById("passwordModal")
        .classList.remove("active");

    document.body.style.overflow = "";

}


/* =====================================================
   CHANGE PASSWORD VALIDATION
===================================================== */

function changePassword(event) {

    event.preventDefault();


    const currentPassword =
        document.getElementById("currentPassword").value;

    const newPassword =
        document.getElementById("newPassword").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;

    const message =
        document.getElementById("passwordMessage");


    message.style.color = "#dc2626";


    /* Check current password */

    if (!currentPassword) {

        message.textContent =
            "Please enter your current password.";

        return;

    }


    /* Minimum password length */

    if (newPassword.length < 6) {

        message.textContent =
            "New password must contain at least 6 characters.";

        return;

    }


    /* Confirm password */

    if (newPassword !== confirmPassword) {

        message.textContent =
            "New password and confirm password do not match.";

        return;

    }


    /*
        FRONTEND ONLY

        Actual old-password verification
        will be done by Flask backend later.
    */


    console.log({
        current_password: currentPassword,

        new_password: newPassword
    });


    message.style.color = "#16a34a";

    message.textContent =
        "Password details validated successfully.";


    setTimeout(function () {

        alert(
            "Password change request is ready.\n\n" +
            "Backend connection will update the database."
        );

        document
            .querySelector("#passwordModal form")
            .reset();

        closeChangePassword();

        message.textContent = "";

    }, 700);

}


/* =====================================================
   LOGOUT
===================================================== */

function logoutUser() {

    const confirmLogout =
        confirm(
            "Are you sure you want to logout?"
        );


    if (!confirmLogout) {
        return;
    }


    /*
        Later:

        localStorage.removeItem("student");

        or

        sessionStorage.clear();

        and backend logout API.
    */


    window.location.href = "login.html";

}


/* =====================================================
   SCROLL TO ISSUES
===================================================== */

function scrollToIssues() {

    document
        .getElementById("issues")
        .scrollIntoView({
            behavior: "smooth"
        });

}


/* =====================================================
   CLOSE MODALS BY CLICKING OUTSIDE
===================================================== */

document.addEventListener("click", function (event) {

    const issueModal =
        document.getElementById("issueModal");

    const complaintsModal =
        document.getElementById("complaintsModal");

    const passwordModal =
        document.getElementById("passwordModal");


    if (event.target === issueModal) {
        closeIssueForm();
    }


    if (event.target === complaintsModal) {
        closeMyComplaints();
    }


    if (event.target === passwordModal) {
        closeChangePassword();
    }

});


/* =====================================================
   ESC KEY
===================================================== */

document.addEventListener("keydown", function (event) {

    if (event.key !== "Escape") {
        return;
    }


    closeIssueForm();

    closeMyComplaints();

    closeChangePassword();


});


/* =====================================================
   NAVBAR SHADOW
===================================================== */

window.addEventListener("scroll", function () {

    const navbar =
        document.querySelector(".navbar");


    if (window.scrollY > 50) {

        navbar.style.boxShadow =
            "0 5px 25px rgba(0,0,0,0.25)";

    }

    else {

        navbar.style.boxShadow = "none";

    }

});


/* =====================================================
   PAGE LOADED
===================================================== */

console.log(
    "CampusCare Student Dashboard Loaded Successfully"
);