/* =========================================================
   CAMPUSCARE LOGIN JAVASCRIPT
   ========================================================= */
const API_BASE_URL = "http://192.168.1.8:5000";

const loginForm = document.getElementById("loginForm");


/* =========================================================
   LOGIN FORM
   ========================================================= */

if (loginForm) {

    loginForm.addEventListener("submit", async function (e) {

        e.preventDefault();


        const collegeId =
            document.getElementById("collegeId").value.trim();

        const password =
            document.getElementById("password").value.trim();


        /* =================================================
           BASIC VALIDATION
        ================================================= */

        if (collegeId === "") {

            showError("Please enter your College ID.");
            return;

        }


        if (password === "") {

            showError("Please enter your password.");
            return;

        }


        /* =================================================
           KIET EMAIL VALIDATION
        ================================================= */

        if (!collegeId.toLowerCase().endsWith("@kiet.edu")) {

            showError(
                "Only @kiet.edu College ID is allowed."
            );

            return;

        }


        /* =================================================
           BACKEND LOGIN
        ================================================= */

        try {

            const response = await fetch(
                `${API_BASE_URL}/api/login`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    credentials: "include",

                    body: JSON.stringify({

                        kiet_id: collegeId,
                        password: password

                    })

                }
            );


            const data = await response.json();


            console.log(
                "Login API Response:",
                data
            );


            /* =================================================
               LOGIN FAILED
            ================================================= */

            if (!response.ok || !data.success) {

                showError(
                    data.message ||
                    "Invalid College ID or password."
                );

                return;

            }


            /* =================================================
               CHECK STUDENT DATA
            ================================================= */

            if (!data.student) {

                showError(
                    "Student information was not received from server."
                );

                return;

            }


            /* =================================================
               CLEAR OLD STUDENT DATA
               IMPORTANT
            ================================================= */

            localStorage.removeItem(
                "student"
            );

            localStorage.removeItem(
                "campuscare_student"
            );

            localStorage.removeItem(
                "kiet_id"
            );

            localStorage.removeItem(
                "kietId"
            );

            localStorage.removeItem(
                "student_kiet_id"
            );


            /* =================================================
               SAVE CURRENT LOGGED-IN STUDENT
            ================================================= */

            localStorage.setItem(
                "campuscare_student",
                JSON.stringify(data.student)
            );


            /* =================================================
               SAVE KIET ID SEPARATELY
            ================================================= */

            localStorage.setItem(
                "kiet_id",
                data.student.kiet_id
            );


            /* =================================================
               OPTIONAL OLD KEY
               Keep for compatibility
            ================================================= */

            localStorage.setItem(
                "student",
                JSON.stringify(data.student)
            );


            console.log(
                "Current Logged-in Student:",
                data.student
            );


            /* =================================================
               SUCCESS MESSAGE
            ================================================= */

            showSuccess(
                data.message ||
                "Login successful!"
            );


            /* =================================================
               REDIRECT DASHBOARD
            ================================================= */

            setTimeout(function () {

                window.location.href =
                    "dashboard.html";

            }, 1000);


        }

        catch (error) {

            console.error(
                "Login Error:",
                error
            );


            showError(
                "Unable to connect to server. Please make sure the backend is running."
            );

        }

    });

}


/* =========================================================
   ERROR POPUP
   ========================================================= */

function showError(message) {

    removeExistingPopup();


    const popup =
        document.createElement("div");


    popup.className =
        "login-popup error-popup";


    popup.innerHTML = `

        <div class="popup-content">

            <div class="popup-title">
                Login Failed
            </div>

            <div class="popup-message">
                ${message}
            </div>

        </div>

    `;


    document.body.appendChild(popup);


    setTimeout(function () {

        popup.classList.add("show");

    }, 10);


    setTimeout(function () {

        popup.classList.remove("show");


        setTimeout(function () {

            popup.remove();

        }, 300);

    }, 2500);

}


/* =========================================================
   SUCCESS POPUP
   ========================================================= */

function showSuccess(message) {

    removeExistingPopup();


    const popup =
        document.createElement("div");


    popup.className =
        "login-popup success-popup";


    popup.innerHTML = `

        <div class="popup-content">

            <div class="popup-title">
                Login Successful
            </div>

            <div class="popup-message">
                ${message}
            </div>

        </div>

    `;


    document.body.appendChild(popup);


    setTimeout(function () {

        popup.classList.add("show");

    }, 10);


    setTimeout(function () {

        popup.classList.remove("show");


        setTimeout(function () {

            popup.remove();

        }, 300);

    }, 2000);

}


/* =========================================================
   REMOVE OLD POPUP
   ========================================================= */

function removeExistingPopup() {

    const oldPopup =
        document.querySelector(
            ".login-popup"
        );


    if (oldPopup) {

        oldPopup.remove();

    }

}


/* =========================================================
   SHOW / HIDE PASSWORD
   ========================================================= */

function togglePassword() {

    const password =
        document.getElementById(
            "password"
        );


    const button =
        document.querySelector(
            ".show-password"
        );


    if (!password || !button) {

        return;

    }


    if (password.type === "password") {

        password.type = "text";

        button.textContent = "Hide";

    }

    else {

        password.type = "password";

        button.textContent = "Show";

    }

}


/* =========================================================
   MAKE FUNCTION AVAILABLE TO HTML
   ========================================================= */

window.togglePassword =
    togglePassword;