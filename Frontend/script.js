/* =========================
   CAMPUSCARE JAVASCRIPT
========================= */
const API_BASE_URL = "http://192.168.1.8:5000";


function goToLogin() {

    window.location.href = "login.html";

}



function loginRequired() {

    const popup = document.getElementById("loginPopup");

    popup.classList.add("active");

}



function closeLoginPopup() {

    const popup = document.getElementById("loginPopup");

    popup.classList.remove("active");

}


/* =========================
   CLOSE POPUP ON BACKGROUND
========================= */

document.addEventListener("click", function(event) {

    const popup = document.getElementById("loginPopup");

    if (event.target === popup) {

        closeLoginPopup();

    }

});


/* =========================
   ESC KEY CLOSE POPUP
========================= */

document.addEventListener("keydown", function(event) {

    if (event.key === "Escape") {

        closeLoginPopup();

    }

});


/* =========================
   NAVBAR SCROLL EFFECT
========================= */

window.addEventListener("scroll", function() {

    const navbar = document.querySelector(".navbar");

    if (window.scrollY > 50) {

        navbar.style.boxShadow =
            "0 4px 20px rgba(0,0,0,0.12)";

    } else {

        navbar.style.boxShadow =
            "0 2px 15px rgba(0,0,0,0.08)";

    }

});


/* =========================
   CURRENT YEAR
========================= */

console.log(
    "CampusCare Frontend Loaded Successfully"
);