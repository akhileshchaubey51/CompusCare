import os
import pyodbc
from flask import (
    Flask,
    request,
    jsonify,
    session,
    send_from_directory
)
from flask_cors import CORS
from werkzeug.utils import secure_filename

# =====================================================
# 1. FLASK APP & CORS
# =====================================================

app = Flask(__name__)
app.secret_key = "CampusCare_Secret_Key_2026"

CORS(
    app,
    supports_credentials=True,
    origins="*"
)

# =====================================================
# 2. SQL SERVER DATABASE CONFIGURATION
# =====================================================

server = r"localhost"
database = "CampusCare"

connection_string = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    f"SERVER={server};"
    f"DATABASE={database};"
    "Trusted_Connection=yes;"
)


def get_connection():
    return pyodbc.connect(connection_string)


# =====================================================
# 3. UPLOAD FOLDERS CONFIGURATION
# =====================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Profiles folder
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads", "profiles")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Complaints folder
COMPLAINTS_UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads", "complaints")
os.makedirs(COMPLAINTS_UPLOAD_FOLDER, exist_ok=True)
app.config["COMPLAINTS_UPLOAD_FOLDER"] = COMPLAINTS_UPLOAD_FOLDER

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# =====================================================
# 4. ROOT & STATIC FILE SERVING
# =====================================================

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "success": True,
        "message": "CampusCare Backend is Running!"
    }), 200


@app.route("/uploads/profiles/<path:filename>", methods=["GET"])
def uploaded_profile_photo(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


@app.route("/uploads/complaints/<path:filename>", methods=["GET"])
def uploaded_complaint_photo(filename):
    return send_from_directory(app.config["COMPLAINTS_UPLOAD_FOLDER"], filename)


# =====================================================
# 5. DATABASE TEST
# =====================================================

@app.route("/api/test-db", methods=["GET"])
def test_database():
    connection = None
    cursor = None
    try:
        connection = get_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT DB_NAME()")
        db_name = cursor.fetchone()[0]

        return jsonify({
            "success": True,
            "message": "Database connected successfully",
            "database": db_name
        }), 200
    except Exception as e:
        print("DATABASE TEST ERROR:", e)
        return jsonify({
            "success": False,
            "message": "Database connection failed",
            "error": str(e)
        }), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# =====================================================
# 6. STUDENT LOGIN API
# =====================================================

@app.route("/api/login", methods=["POST"])
def login():
    connection = None
    cursor = None
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({
                "success": False,
                "message": "Request data is missing"
            }), 400

        kiet_id = str(data.get("kiet_id", "")).strip()
        password = str(data.get("password", "")).strip()

        if not kiet_id or not password:
            return jsonify({
                "success": False,
                "message": "KIET ID and password are required"
            }), 400

        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                kiet_id,
                name,
                department,
                course,
                semester,
                phone,
                profile_photo,
                status
            FROM students
            WHERE LOWER(LTRIM(RTRIM(kiet_id))) = LOWER(?)
            AND password = ?
        """, (kiet_id, password))

        student = cursor.fetchone()

        if not student:
            return jsonify({
                "success": False,
                "message": "Invalid KIET ID or password"
            }), 401

        if student[7] is not None:
            status = str(student[7]).strip().lower()
            if status in ["inactive", "blocked", "disabled"]:
                return jsonify({
                    "success": False,
                    "message": "Your account is inactive. Please contact administration."
                }), 403

        session["kiet_id"] = student[0]

        photo_url = None
        if student[6]:
            photo_url = f"http://127.0.0.1:5000/{student[6]}"

        student_data = {
            "kiet_id": student[0],
            "name": student[1],
            "department": student[2],
            "course": student[3],
            "semester": student[4],
            "phone": student[5],
            "profile_photo": student[6],
            "profile_photo_url": photo_url,
            "status": student[7]
        }

        return jsonify({
            "success": True,
            "message": "Login successful",
            "student": student_data
        }), 200

    except Exception as e:
        print("LOGIN ERROR:", e)
        return jsonify({
            "success": False,
            "message": "Database error",
            "error": str(e)
        }), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# =====================================================
# 7. ADMIN LOGIN API (FROM SQL ADMINS TABLE)
# =====================================================

@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    connection = None
    cursor = None
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({
                "success": False,
                "message": "Request data is missing"
            }), 400

        login_id = str(data.get("login_id", "")).strip()
        password = str(data.get("password", "")).strip()

        if not login_id or not password:
            return jsonify({
                "success": False,
                "message": "Admin ID and password are required"
            }), 400

        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute("""
            SELECT 
                admin_id,
                kiet_id,
                full_name,
                department,
                role,
                status
            FROM admins
            WHERE LOWER(LTRIM(RTRIM(kiet_id))) = LOWER(?)
            AND password = ?
        """, (login_id, password))

        admin = cursor.fetchone()

        if not admin:
            return jsonify({
                "success": False,
                "message": "Invalid Administrator ID or password"
            }), 401

        if str(admin[5]).strip().lower() != "active":
            return jsonify({
                "success": False,
                "message": "This administrative account is currently inactive"
            }), 403

        session["admin_id"] = admin[0]
        session["admin_kiet_id"] = admin[1]

        admin_data = {
            "admin_id": admin[0],
            "kiet_id": admin[1],
            "full_name": admin[2],
            "department": admin[3],
            "role": admin[4]
        }

        return jsonify({
            "success": True,
            "message": "Admin authentication successful",
            "admin": admin_data
        }), 200

    except Exception as e:
        print("ADMIN LOGIN ERROR:", e)
        return jsonify({
            "success": False,
            "message": "Database error: " + str(e),
            "error": str(e)
        }), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# =====================================================
# 8. STUDENT PROFILE API (GET)
# =====================================================

@app.route("/api/student/profile", methods=["GET"])
def student_profile():
    connection = None
    cursor = None
    try:
        kiet_id = session.get("kiet_id") or request.args.get("kiet_id")

        if kiet_id:
            kiet_id = str(kiet_id).strip()

        if not kiet_id:
            return jsonify({
                "success": False,
                "message": "No logged-in student found"
            }), 401

        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                kiet_id,
                name,
                department,
                course,
                semester,
                phone,
                profile_photo,
                status,
                created_at,
                updated_at
            FROM students
            WHERE LOWER(LTRIM(RTRIM(kiet_id))) = LOWER(?)
        """, (kiet_id,))

        student = cursor.fetchone()

        if not student:
            return jsonify({
                "success": False,
                "message": "Student not found"
            }), 404

        photo_url = None
        if student[6]:
            photo_url = f"http://127.0.0.1:5000/{student[6]}"

        student_data = {
            "kiet_id": student[0],
            "name": student[1],
            "department": student[2],
            "course": student[3],
            "semester": student[4],
            "phone": student[5],
            "profile_photo": student[6],
            "profile_photo_url": photo_url,
            "status": student[7],
            "created_at": student[8].isoformat() if student[8] else None,
            "updated_at": student[9].isoformat() if student[9] else None
        }

        return jsonify({
            "success": True,
            "message": "Student profile fetched successfully",
            "student": student_data
        }), 200

    except Exception as e:
        print("PROFILE ERROR:", e)
        return jsonify({
            "success": False,
            "message": "Database error",
            "error": str(e)
        }), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# =====================================================
# 9. UPDATE STUDENT PROFILE API (POST)
# =====================================================

@app.route("/api/student/update-profile", methods=["POST"])
def update_student_profile():
    connection = None
    cursor = None
    try:
        kiet_id = str(request.form.get("kiet_id", "")).strip()
        name = str(request.form.get("name", "")).strip()
        phone = str(request.form.get("phone", "")).strip()
        profile_file = request.files.get("profile_photo")

        if not kiet_id or not name:
            return jsonify({
                "success": False,
                "message": "KIET ID and Name are required"
            }), 400

        if phone and (not phone.isdigit() or len(phone) != 10):
            return jsonify({
                "success": False,
                "message": "Phone number must contain exactly 10 digits"
            }), 400

        profile_photo_db = None
        if profile_file and profile_file.filename:
            if not allowed_file(profile_file.filename):
                return jsonify({
                    "success": False,
                    "message": "Invalid image format. Use PNG, JPG, JPEG, WEBP or GIF."
                }), 400

            original_name = secure_filename(profile_file.filename)
            extension = original_name.rsplit(".", 1)[1].lower()
            file_name = f"{kiet_id.lower()}.{extension}"
            file_path = os.path.join(app.config["UPLOAD_FOLDER"], file_name)
            profile_file.save(file_path)
            profile_photo_db = f"uploads/profiles/{file_name}"

        connection = get_connection()
        cursor = connection.cursor()

        if profile_photo_db:
            cursor.execute("""
                UPDATE students
                SET name = ?, phone = ?, profile_photo = ?, updated_at = GETDATE()
                WHERE LOWER(LTRIM(RTRIM(kiet_id))) = LOWER(?)
            """, (name, phone if phone else None, profile_photo_db, kiet_id))
        else:
            cursor.execute("""
                UPDATE students
                SET name = ?, phone = ?, updated_at = GETDATE()
                WHERE LOWER(LTRIM(RTRIM(kiet_id))) = LOWER(?)
            """, (name, phone if phone else None, kiet_id))

        connection.commit()

        cursor.execute("""
            SELECT kiet_id, name, department, course, semester, phone, profile_photo, status
            FROM students
            WHERE LOWER(LTRIM(RTRIM(kiet_id))) = LOWER(?)
        """, (kiet_id,))
        student = cursor.fetchone()

        photo_url = f"http://127.0.0.1:5000/{student[6]}" if student[6] else None

        student_data = {
            "kiet_id": student[0],
            "name": student[1],
            "department": student[2],
            "course": student[3],
            "semester": student[4],
            "phone": student[5],
            "profile_photo": student[6],
            "profile_photo_url": photo_url,
            "status": student[7]
        }

        return jsonify({
            "success": True,
            "message": "Profile updated successfully",
            "student": student_data
        }), 200

    except Exception as e:
        if connection:
            connection.rollback()
        print("UPDATE PROFILE ERROR:", e)
        return jsonify({
            "success": False,
            "message": "Unable to update profile",
            "error": str(e)
        }), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# =====================================================
# 10. COMPLAINT SUBMISSION API (POST)
# =====================================================

@app.route("/api/complaints/submit", methods=["POST"])
def submit_complaint():
    connection = None
    cursor = None
    try:
        kiet_id = str(request.form.get("kiet_id", "")).strip()
        issue_type = str(request.form.get("issue_type", "")).strip()
        title = str(request.form.get("title", "")).strip()
        description = str(request.form.get("description", "")).strip()
        location_name = str(request.form.get("location_name", "KIET Campus")).strip()
        latitude = request.form.get("latitude")
        longitude = request.form.get("longitude")
        photo_file = request.files.get("photo")

        if not kiet_id:
            kiet_id = "student@kiet.edu"

        if not issue_type or not description:
            return jsonify({
                "success": False,
                "message": "Issue Type and Description are required"
            }), 400

        photo_path_db = None
        if photo_file and photo_file.filename:
            if allowed_file(photo_file.filename):
                ext = secure_filename(photo_file.filename).rsplit(".", 1)[1].lower()
                clean_id = kiet_id.split("@")[0].replace(".", "_")
                file_name = f"complaint_{clean_id}_{os.urandom(4).hex()}.{ext}"

                file_path = os.path.join(app.config["COMPLAINTS_UPLOAD_FOLDER"], file_name)
                photo_file.save(file_path)
                photo_path_db = f"uploads/complaints/{file_name}"

        connection = get_connection()
        cursor = connection.cursor()

        insert_query = """
            INSERT INTO complaints
            (kiet_id, issue_type, title, description, photo, location_name, latitude, longitude, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', GETDATE(), GETDATE())
        """

        cursor.execute(insert_query, (
            kiet_id,
            issue_type,
            title if title else issue_type,
            description,
            photo_path_db,
            location_name,
            float(latitude) if latitude else 28.75257,
            float(longitude) if longitude else 77.49851
        ))

        connection.commit()

        cursor.execute("SELECT TOP 1 complaint_id FROM complaints WHERE kiet_id = ? ORDER BY created_at DESC", (kiet_id,))
        row = cursor.fetchone()
        complaint_id = row[0] if row else 1001

        return jsonify({
            "success": True,
            "message": "Complaint registered successfully in database!",
            "complaint_id": complaint_id
        }), 200

    except Exception as e:
        if connection:
            connection.rollback()
        print("COMPLAINT SUBMIT ERROR:", e)
        return jsonify({
            "success": False,
            "message": "Database storage error: " + str(e),
            "error": str(e)
        }), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# =====================================================
# 11. GET STUDENT COMPLAINTS API (GET)
# =====================================================

@app.route("/api/student/complaints", methods=["GET"])
def get_student_complaints():
    connection = None
    cursor = None
    try:
        kiet_id = session.get("kiet_id") or request.args.get("kiet_id")

        if kiet_id:
            kiet_id = str(kiet_id).strip()

        if not kiet_id:
            return jsonify({
                "success": False,
                "message": "KIET ID is required"
            }), 400

        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                complaint_id,
                kiet_id,
                issue_type,
                title,
                description,
                photo,
                location_name,
                status,
                admin_remark,
                created_at,
                updated_at
            FROM complaints
            WHERE LOWER(LTRIM(RTRIM(kiet_id))) = LOWER(?)
            ORDER BY created_at DESC
        """, (kiet_id,))

        rows = cursor.fetchall()
        complaints = []

        for row in rows:
            photo_url = f"http://127.0.0.1:5000/{row[5]}" if row[5] else None
            complaints.append({
                "complaint_id": row[0],
                "kiet_id": row[1],
                "issue_type": row[2],
                "title": row[3],
                "description": row[4],
                "photo_url": photo_url,
                "location_name": row[6],
                "status": row[7],
                "admin_remark": row[8],
                "created_at": row[9].strftime("%d %b %Y, %I:%M %p") if row[9] else None,
                "updated_at": row[10].strftime("%d %b %Y, %I:%M %p") if row[10] else None
            })

        return jsonify({
            "success": True,
            "count": len(complaints),
            "complaints": complaints
        }), 200

    except Exception as e:
        print("GET COMPLAINTS ERROR:", e)
        return jsonify({
            "success": False,
            "message": "Unable to fetch complaints",
            "error": str(e)
        }), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# =====================================================
# 12. LOGOUT API
# =====================================================

@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({
        "success": True,
        "message": "Logout successful"
    }), 200


# =====================================================
# 13. FORGOT PASSWORD API
# =====================================================

@app.route("/api/forgot-password", methods=["POST"])
def forgot_password():
    connection = None
    cursor = None
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({
                "success": False,
                "message": "Request data is missing"
            }), 400

        kiet_id = str(data.get("kiet_id", "")).strip()
        if not kiet_id:
            return jsonify({
                "success": False,
                "message": "KIET ID is required"
            }), 400

        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute("""
            SELECT kiet_id, name, department, course, semester
            FROM students
            WHERE LOWER(LTRIM(RTRIM(kiet_id))) = LOWER(?)
        """, (kiet_id,))

        student = cursor.fetchone()

        if not student:
            return jsonify({
                "success": False,
                "message": "KIET ID not found in CampusCare database"
            }), 404

        return jsonify({
            "success": True,
            "message": "KIET ID verified successfully",
            "student": {
                "kiet_id": student[0],
                "name": student[1],
                "department": student[2],
                "course": student[3],
                "semester": student[4]
            }
        }), 200

    except Exception as e:
        print("FORGOT PASSWORD ERROR:", e)
        return jsonify({
            "success": False,
            "message": "Database error",
            "error": str(e)
        }), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# =====================================================
# 14. RESET PASSWORD API
# =====================================================

@app.route("/api/reset-password", methods=["POST"])
def reset_password():
    connection = None
    cursor = None
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({
                "success": False,
                "message": "Request data is missing"
            }), 400

        kiet_id = str(data.get("kiet_id", "")).strip()
        new_password = str(data.get("new_password", "")).strip()

        if not kiet_id or not new_password:
            return jsonify({
                "success": False,
                "message": "KIET ID and new password are required"
            }), 400

        if len(new_password) < 6:
            return jsonify({
                "success": False,
                "message": "Password must be at least 6 characters"
            }), 400

        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute("""
            SELECT kiet_id FROM students
            WHERE LOWER(LTRIM(RTRIM(kiet_id))) = LOWER(?)
        """, (kiet_id,))

        if not cursor.fetchone():
            return jsonify({
                "success": False,
                "message": "KIET ID not found"
            }), 404

        cursor.execute("""
            UPDATE students
            SET password = ?, updated_at = GETDATE()
            WHERE LOWER(LTRIM(RTRIM(kiet_id))) = LOWER(?)
        """, (new_password, kiet_id))

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Password reset successfully"
        }), 200

    except Exception as e:
        if connection:
            connection.rollback()
        print("RESET PASSWORD ERROR:", e)
        return jsonify({
            "success": False,
            "message": "Database error",
            "error": str(e)
        }), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# =====================================================
# 15. CHANGE PASSWORD API
# =====================================================

@app.route("/api/change-password", methods=["POST"])
def change_password():
    connection = None
    cursor = None
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({
                "success": False,
                "message": "Request data is missing"
            }), 400

        kiet_id = session.get("kiet_id") or data.get("kiet_id")
        current_password = str(data.get("current_password", "")).strip()
        new_password = str(data.get("new_password", "")).strip()

        if kiet_id:
            kiet_id = str(kiet_id).strip()

        if not kiet_id or not current_password or not new_password:
            return jsonify({
                "success": False,
                "message": "All password fields are required"
            }), 400

        if len(new_password) < 6:
            return jsonify({
                "success": False,
                "message": "New password must be at least 6 characters"
            }), 400

        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute("""
            SELECT kiet_id FROM students
            WHERE LOWER(LTRIM(RTRIM(kiet_id))) = LOWER(?)
            AND password = ?
        """, (kiet_id, current_password))

        student = cursor.fetchone()

        if not student:
            return jsonify({
                "success": False,
                "message": "Current password is incorrect"
            }), 401

        cursor.execute("""
            UPDATE students
            SET password = ?, updated_at = GETDATE()
            WHERE LOWER(LTRIM(RTRIM(kiet_id))) = LOWER(?)
        """, (new_password, kiet_id))

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Password changed successfully"
        }), 200

    except Exception as e:
        if connection:
            connection.rollback()
        print("CHANGE PASSWORD ERROR:", e)
        return jsonify({
            "success": False,
            "message": "Database error",
            "error": str(e)
        }), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# =====================================================
# 16. ADMIN - ADD STUDENT API
# =====================================================

@app.route("/api/admin/students", methods=["POST"])
@app.route("/api/admin/add-student", methods=["POST"])
def add_student():
    connection = None
    cursor = None
    try:
        kiet_id = str(request.form.get("kiet_id", "")).strip()
        name = str(request.form.get("name", "")).strip()
        department = str(request.form.get("department", "")).strip()
        course = str(request.form.get("course", "")).strip()
        semester_value = str(request.form.get("semester", "")).strip()
        phone = str(request.form.get("phone", "")).strip()
        password = str(request.form.get("password", "")).strip()
        status = str(request.form.get("status", "Active")).strip()
        profile_file = request.files.get("profile_photo")

        if not kiet_id or not name or not department or not course or not semester_value or not password:
            return jsonify({
                "success": False,
                "message": "All required fields must be filled"
            }), 400

        try:
            semester = int(semester_value)
            if semester < 1 or semester > 8:
                raise ValueError
        except ValueError:
            return jsonify({
                "success": False,
                "message": "Semester must be a number between 1 and 8"
            }), 400

        if phone and (not phone.isdigit() or len(phone) != 10):
            return jsonify({
                "success": False,
                "message": "Phone number must contain exactly 10 digits"
            }), 400

        if len(password) < 6:
            return jsonify({
                "success": False,
                "message": "Password must be at least 6 characters"
            }), 400

        profile_photo_db = None

        if profile_file and profile_file.filename:
            if not allowed_file(profile_file.filename):
                return jsonify({
                    "success": False,
                    "message": "Invalid image format. Use PNG, JPG, JPEG, WEBP or GIF."
                }), 400

            original_name = secure_filename(profile_file.filename)
            extension = original_name.rsplit(".", 1)[1].lower()
            file_name = f"{kiet_id.lower()}.{extension}"
            file_path = os.path.join(app.config["UPLOAD_FOLDER"], file_name)

            profile_file.save(file_path)
            profile_photo_db = f"uploads/profiles/{file_name}"

        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute("""
            SELECT kiet_id FROM students
            WHERE LOWER(LTRIM(RTRIM(kiet_id))) = LOWER(?)
        """, (kiet_id,))

        if cursor.fetchone():
            if profile_photo_db:
                uploaded_file_path = os.path.join(BASE_DIR, profile_photo_db)
                if os.path.exists(uploaded_file_path):
                    os.remove(uploaded_file_path)

            return jsonify({
                "success": False,
                "message": f"KIET ID '{kiet_id}' already exists"
            }), 409

        cursor.execute("""
            INSERT INTO students
            (kiet_id, name, password, department, course, semester, phone, profile_photo, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE(), GETDATE())
        """, (
            kiet_id,
            name,
            password,
            department,
            course,
            semester,
            phone if phone else None,
            profile_photo_db,
            status if status else "Active"
        ))

        connection.commit()

        photo_url = f"http://127.0.0.1:5000/{profile_photo_db}" if profile_photo_db else None

        return jsonify({
            "success": True,
            "message": "Student added successfully to SQL database",
            "student": {
                "kiet_id": kiet_id,
                "name": name,
                "department": department,
                "course": course,
                "semester": semester,
                "phone": phone if phone else None,
                "profile_photo": profile_photo_db,
                "profile_photo_url": photo_url,
                "status": status
            }
        }), 201

    except Exception as e:
        if connection:
            connection.rollback()
        print("ADD STUDENT ERROR:", e)
        return jsonify({
            "success": False,
            "message": "Unable to add student",
            "error": str(e)
        }), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# =====================================================
# 17. ADMIN - GET ALL STUDENTS API
# =====================================================

@app.route("/api/admin/students", methods=["GET"])
def get_all_students():
    connection = None
    cursor = None
    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute("""
            SELECT kiet_id, name, department, course, semester, phone, profile_photo, status, created_at, updated_at
            FROM students
            ORDER BY created_at DESC
        """)

        rows = cursor.fetchall()
        students = []

        for row in rows:
            photo_url = f"http://127.0.0.1:5000/{row[6]}" if row[6] else None
            students.append({
                "kiet_id": row[0],
                "name": row[1],
                "department": row[2],
                "course": row[3],
                "semester": row[4],
                "phone": row[5],
                "profile_photo": row[6],
                "profile_photo_url": photo_url,
                "status": row[7],
                "created_at": row[8].isoformat() if row[8] else None,
                "updated_at": row[9].isoformat() if row[9] else None
            })

        return jsonify({
            "success": True,
            "count": len(students),
            "students": students
        }), 200

    except Exception as e:
        print("GET STUDENTS ERROR:", e)
        return jsonify({
            "success": False,
            "message": "Unable to fetch students",
            "error": str(e)
        }), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# =====================================================
# 18. ADMIN - DELETE STUDENT API
# =====================================================

@app.route("/api/admin/students/<string:kiet_id>", methods=["DELETE"])
def delete_student(kiet_id):
    connection = None
    cursor = None
    try:
        kiet_id = str(kiet_id).strip()
        if not kiet_id:
            return jsonify({
                "success": False,
                "message": "KIET ID is required"
            }), 400

        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute("""
            SELECT profile_photo FROM students
            WHERE LOWER(LTRIM(RTRIM(kiet_id))) = LOWER(?)
        """, (kiet_id,))

        student = cursor.fetchone()
        if not student:
            return jsonify({
                "success": False,
                "message": "Student not found"
            }), 404

        profile_photo = student[0]

        cursor.execute("""
            DELETE FROM students
            WHERE LOWER(LTRIM(RTRIM(kiet_id))) = LOWER(?)
        """, (kiet_id,))

        connection.commit()

        if profile_photo:
            photo_path = os.path.join(BASE_DIR, str(profile_photo))
            if os.path.exists(photo_path):
                try:
                    os.remove(photo_path)
                except Exception as photo_err:
                    print("PHOTO DELETE ERROR:", photo_err)

        return jsonify({
            "success": True,
            "message": "Student deleted successfully"
        }), 200

    except Exception as e:
        if connection:
            connection.rollback()
        print("DELETE STUDENT ERROR:", e)
        return jsonify({
            "success": False,
            "message": "Unable to delete student",
            "error": str(e)
        }), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# =====================================================
# 19. ADMIN - GET ALL COMPLAINTS (WITH FILTERS & STUDENT JOIN)
# =====================================================

@app.route("/api/admin/complaints", methods=["GET"])
def get_all_complaints_admin():
    connection = None
    cursor = None
    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute("""
            SELECT 
                c.complaint_id,
                c.kiet_id,
                s.name AS student_name,
                c.issue_type,
                c.title,
                c.description,
                c.photo,
                c.location_name,
                c.latitude,
                c.longitude,
                c.status,
                c.admin_remark,
                c.created_at
            FROM complaints c
            LEFT JOIN students s ON LOWER(LTRIM(RTRIM(c.kiet_id))) = LOWER(LTRIM(RTRIM(s.kiet_id)))
            ORDER BY c.created_at DESC
        """)

        rows = cursor.fetchall()
        complaints = []

        for row in rows:
            photo_url = f"http://127.0.0.1:5000/{row[6]}" if row[6] else None
            complaints.append({
                "complaint_id": row[0],
                "kiet_id": row[1],
                "student_name": row[2] or "KIET Student",
                "issue_type": row[3],
                "title": row[4],
                "description": row[5],
                "photo_url": photo_url,
                "location_name": row[7] or "KIET Campus",
                "latitude": float(row[8]) if row[8] else None,
                "longitude": float(row[9]) if row[9] else None,
                "status": row[10] or "Submitted",
                "admin_remark": row[11] or "",
                "created_at": row[12].strftime("%d %b %Y, %I:%M %p") if row[12] else None
            })

        return jsonify({
            "success": True,
            "count": len(complaints),
            "complaints": complaints
        }), 200

    except Exception as e:
        print("ADMIN GET COMPLAINTS ERROR:", e)
        return jsonify({
            "success": False,
            "message": "Failed to fetch complaints",
            "error": str(e)
        }), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# =====================================================
# 20. ADMIN - UPDATE COMPLAINT STATUS & REMARK
# =====================================================

@app.route("/api/admin/complaints/update-status", methods=["POST"])
def update_complaint_status_admin():
    connection = None
    cursor = None
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({
                "success": False,
                "message": "Request body missing"
            }), 400

        complaint_id = data.get("complaint_id")
        status = str(data.get("status", "")).strip()
        admin_remark = str(data.get("admin_remark", "")).strip()

        if not complaint_id or not status:
            return jsonify({
                "success": False,
                "message": "Complaint ID and Status are required"
            }), 400

        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute("""
            UPDATE complaints
            SET status = ?, admin_remark = ?, updated_at = GETDATE()
            WHERE complaint_id = ?
        """, (status, admin_remark if admin_remark else None, int(complaint_id)))

        connection.commit()

        return jsonify({
            "success": True,
            "message": f"Complaint #{complaint_id} updated to '{status}' successfully!"
        }), 200

    except Exception as e:
        if connection:
            connection.rollback()
        print("ADMIN STATUS UPDATE ERROR:", e)
        return jsonify({
            "success": False,
            "message": "Failed to update complaint status",
            "error": str(e)
        }), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# =====================================================
# 21. SERVER RUNNER
# =====================================================

if __name__ == "__main__":
    print("\n==============================================")
    print("        CAMPUSCARE BACKEND RUNNING")
    print("==============================================")
    print("Local IP: http://192.168.1.8:5000")
    print("Database: SQL Server (CampusCare)")
    print("==============================================\n")

    app.run(host="0.0.0.0", port=5000, debug=True)