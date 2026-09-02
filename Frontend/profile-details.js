/* =====================================================
   CAMPUSCARE
   STUDENT PROFILE DETAILS
===================================================== */


/* =====================================================
   API URL
===================================================== */
const API_BASE_URL = "http://192.168.1.8:5000";



/* =====================================================
   PAGE LOAD
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadStudentProfile();

    }
);


/* =====================================================
   GET KIET ID
===================================================== */

function getKietId() {

    /*
        First try URL:

        profile-details.html?kiet_id=2628MCA0206

        Then try localStorage.
    */

    const params =
        new URLSearchParams(
            window.location.search
        );

    const urlKietId =
        params.get("kiet_id");


    if (urlKietId) {

        return urlKietId;

    }


    const storedKietId =
        localStorage.getItem("kiet_id");


    return storedKietId;

}


/* =====================================================
   LOAD STUDENT PROFILE
===================================================== */

async function loadStudentProfile() {

    const kietId =
        getKietId();


    /* No KIET ID */

    if (!kietId) {

        showProfileError(
            "KIET ID not found. Please login again."
        );

        return;

    }


    showLoading();


    try {


        /*
            Flask API

            Example:

            GET
            /api/student/2628MCA0206
        */

        const response =
            await fetch(

                API_BASE_URL +
                "/api/student/" +
                encodeURIComponent(kietId)

            );


        const data =
            await response.json();


        console.log(
            "Student Profile Response:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Student profile could not be loaded."
            );

        }


        /*
            Backend response example:

            {
                "success": true,
                "student": {
                    "kiet_id": "2628MCA0206",
                    "name": "Akhilesh Chaubey",
                    "college": "KIET Group of Institutions",
                    "course": "MCA",
                    "branch": "Computer Applications",
                    "year": "2nd Year",
                    "semester": "4th Semester",
                    "phone": "XXXXXXXXXX",
                    "email": "example@email.com",
                    "gender": "Male",
                    "dob": "01-01-2000",
                    "address": "Ghaziabad"
                }
            }
        */


        const student =
            data.student || data;


        displayStudentProfile(student);


        hideLoading();


    }

    catch (error) {

        console.error(
            "Profile Error:",
            error
        );


        hideLoading();


        showProfileError(
            error.message ||
            "Unable to connect with server."
        );

    }

}


/* =====================================================
   DISPLAY STUDENT DATA
===================================================== */

function displayStudentProfile(student) {


    /* ================================================
       HEADER
    ================================================= */

    setText(
        "studentName",
        student.name
    );

    setText(
        "studentKietId",
        student.kiet_id
    );


    /* ================================================
       DETAILS
    ================================================= */

    setText(
        "detailName",
        student.name
    );

    setText(
        "detailKietId",
        student.kiet_id
    );

    setText(
        "detailCollege",
        student.college
    );

    setText(
        "detailCourse",
        student.course
    );

    setText(
        "detailBranch",
        student.branch
    );

    setText(
        "detailYear",
        student.year
    );

    setText(
        "detailSemester",
        student.semester
    );

    setText(
        "detailPhone",
        student.phone
    );

    setText(
        "detailEmail",
        student.email
    );

    setText(
        "detailGender",
        student.gender
    );

    setText(
        "detailDob",
        student.dob
    );

    setText(
        "detailAddress",
        student.address
    );


    /* ================================================
       PROFILE IMAGE
    ================================================= */

    if (student.profile_image) {

        document.getElementById(
            "profileImage"
        ).src =
            student.profile_image;

    }


}


/* =====================================================
   SET TEXT SAFELY
===================================================== */

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(elementId);


    if (!element) {
        return;
    }


    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        element.textContent =
            "Not Available";

        return;

    }


    element.textContent =
        value;

}


/* =====================================================
   SHOW LOADING
===================================================== */

function showLoading() {

    const loading =
        document.getElementById(
            "profileLoading"
        );

    const error =
        document.getElementById(
            "profileError"
        );


    if (loading) {

        loading.style.display =
            "flex";

    }


    if (error) {

        error.style.display =
            "none";

    }

}


/* =====================================================
   HIDE LOADING
===================================================== */

function hideLoading() {

    const loading =
        document.getElementById(
            "profileLoading"
        );


    if (loading) {

        loading.style.display =
            "none";

    }

}


/* =====================================================
   SHOW ERROR
===================================================== */

function showProfileError(message) {

    const error =
        document.getElementById(
            "profileError"
        );

    const errorMessage =
        document.getElementById(
            "profileErrorMessage"
        );


    if (errorMessage) {

        errorMessage.textContent =
            message;

    }


    if (error) {

        error.style.display =
            "flex";

    }

}


/* =====================================================
   BACK TO DASHBOARD
===================================================== */

function goBackToDashboard() {

    window.location.href =
        "dashboard.html";

}