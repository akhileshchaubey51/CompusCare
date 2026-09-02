document.addEventListener("DOMContentLoaded", () => {
const API_BASE_URL = "http://192.168.1.8:5000";


    const form = document.getElementById("forgotPasswordForm");
    const kietIdInput = document.getElementById("kietId");
    const resetBtn = document.getElementById("resetBtn");
    const successPopup = document.getElementById("successPopup");

    let verifiedKietId = "";


    // ==========================================
    // VERIFY KIET ID
    // ==========================================

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const kietId = kietIdInput.value
            .trim()
            .toLowerCase();


        // Empty check
        if (!kietId) {

            alert("Please enter your KIET ID.");

            kietIdInput.focus();

            return;
        }


        // Example:
        // 2628mca0206@kiet.edu

        const kietPattern = /^[^@\s]+@kiet\.edu$/i;


        if (!kietPattern.test(kietId)) {

            alert(
                "Please enter your complete KIET ID.\n\n" +
                "Example: 2628mca0206@kiet.edu"
            );

            kietIdInput.focus();

            return;
        }


        resetBtn.disabled = true;
        resetBtn.classList.add("loading");


        const buttonText =
            resetBtn.querySelector("span:first-child");


        if (buttonText) {
            buttonText.textContent = "Checking...";
        }


        try {

            const response = await fetch(
                "http://127.0.0.1:5000/api/forgot-password",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        kiet_id: kietId
                    })
                }
            );


            const data = await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "KIET ID not found."
                );
            }


            // Save verified KIET ID
            verifiedKietId = kietId;


            console.log(
                "Student verified:",
                data.student
            );


            // Show verification popup
            successPopup.classList.add("show");


        } catch (error) {

            console.error(
                "Forgot Password Error:",
                error
            );


            alert(
                error.message ||
                "Unable to connect to server."
            );


        } finally {

            resetBtn.disabled = false;

            resetBtn.classList.remove("loading");


            if (buttonText) {
                buttonText.textContent = "Continue";
            }

        }

    });


    // ==========================================
    // RESET PASSWORD
    // ==========================================

    const resetPasswordForm =
        document.getElementById("resetPasswordForm");


    if (resetPasswordForm) {

        resetPasswordForm.addEventListener(
            "submit",
            async (e) => {

                e.preventDefault();


                const newPassword =
                    document
                        .getElementById("newPassword")
                        .value;

                const confirmPassword =
                    document
                        .getElementById("confirmPassword")
                        .value;


                // ==========================================
                // Password Validation
                // ==========================================

                if (!newPassword || !confirmPassword) {

                    alert(
                        "Please enter both passwords."
                    );

                    return;
                }


                if (newPassword.length < 6) {

                    alert(
                        "Password must be at least 6 characters."
                    );

                    return;
                }


                if (newPassword !== confirmPassword) {

                    alert(
                        "Passwords do not match."
                    );

                    return;
                }


                const updateBtn =
                    document.getElementById(
                        "updatePasswordBtn"
                    );


                updateBtn.disabled = true;


                const buttonText =
                    updateBtn.querySelector(
                        "span:first-child"
                    );


                if (buttonText) {
                    buttonText.textContent =
                        "Updating...";
                }


                try {

                    // ==========================================
                    // Send New Password To Backend
                    // ==========================================

                    const response = await fetch(
                        "http://127.0.0.1:5000/api/reset-password",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                kiet_id:
                                    verifiedKietId,

                                new_password:
                                    newPassword

                            })
                        }
                    );


                    const data =
                        await response.json();


                    if (!response.ok) {

                        throw new Error(
                            data.message ||
                            "Password update failed."
                        );
                    }


                    alert(
                        "Password updated successfully!"
                    );


                    // Go back to login
                    window.location.href =
                        "login.html";


                } catch (error) {

                    console.error(
                        "Reset Password Error:",
                        error
                    );


                    alert(
                        error.message ||
                        "Unable to update password."
                    );


                } finally {

                    updateBtn.disabled = false;


                    if (buttonText) {

                        buttonText.textContent =
                            "Update Password";

                    }

                }

            }
        );

    }

});


// ==========================================
// CONTINUE TO RESET PASSWORD
// ==========================================

function continueToReset() {

    const successPopup =
        document.getElementById(
            "successPopup"
        );

    const forgotForm =
        document.getElementById(
            "forgotPasswordForm"
        );

    const resetSection =
        document.getElementById(
            "resetSection"
        );


    // Hide verification popup
    if (successPopup) {

        successPopup.classList.remove(
            "show"
        );

    }


    // Hide KIET verification form
    if (forgotForm) {

        forgotForm.style.display =
            "none";

    }


    // Show reset password form
    if (resetSection) {

        resetSection.style.display =
            "block";

    }


    // Update step indicator
    const steps =
        document.querySelectorAll(
            ".step"
        );


    if (steps.length >= 3) {

        steps[0].classList.remove(
            "active"
        );

        steps[1].classList.add(
            "active"
        );

    }


    // Focus new password
    const newPassword =
        document.getElementById(
            "newPassword"
        );


    if (newPassword) {

        setTimeout(() => {

            newPassword.focus();

        }, 300);

    }

}


// ==========================================
// Close Popup
// ==========================================

function closeSuccess() {

    const successPopup =
        document.getElementById(
            "successPopup"
        );

    if (successPopup) {

        successPopup.classList.remove(
            "show"
        );

    }

}