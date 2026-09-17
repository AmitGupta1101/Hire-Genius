from flask import Flask, render_template, request, redirect, send_file, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask import flash
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
import os
import PyPDF2
import re
from interview_bot import generate_question, evaluate_answer

app = Flask(__name__)

app.config['SECRET_KEY'] = 'secret123'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'

db = SQLAlchemy(app)

# -------------------------
# UPLOAD FOLDER
# -------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

ALLOWED_EXTENSIONS = {"pdf"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".",1)[1].lower() in ALLOWED_EXTENSIONS


# -------------------------
# INTERVIEW PAGE
# -------------------------

@app.route("/interview")
def interview():

    if "user" not in session:
        return redirect("/")

    return render_template(
        "interview.html",
        username=session["user"]
    )

# ==========================================
# INTERVIEW QUESTIONS API
# ==========================================

@app.route("/api/interview/questions")
def interview_questions():

    if "user" not in session:
        return jsonify({
            "success": False,
            "message": "Login required"
        }), 401

    resume_text = session.get("resume_text", "")

    if not resume_text:
        return jsonify({
            "success": False,
            "message": "Please upload your resume first."
        }), 400

    # Start a fresh interview
    session["interview_history"] = []

    try:

        question = generate_question(
            resume_text,
            []
        )

        return jsonify({
            "success": True,
            "question": question
        })

    except Exception as e:

        print("Question generation error:", e)

        return jsonify({
            "success": False,
            "message": "Unable to generate interview question."
        }), 500

# ==========================================
# INTERVIEW ANSWER API
# ==========================================

@app.route("/api/interview/answer", methods=["POST"])
def interview_answer():

    if "user" not in session:
        return jsonify({
            "success": False,
            "message": "Login required"
        }), 401

    data = request.get_json() or {}

    question = data.get("question", "").strip()
    answer = data.get("answer", "").strip()

    resume_text = session.get("resume_text", "")

    if not resume_text:
        return jsonify({
            "success": False,
            "message": "Resume not found. Please upload your resume first."
        }), 400

    if not question:
        return jsonify({
            "success": False,
            "message": "Question not found."
        }), 400

    if not answer:
        return jsonify({
            "success": False,
            "message": "No answer detected."
        }), 400

    try:

        # ---------------------------------
        # Evaluate candidate answer
        # ---------------------------------

        evaluation = evaluate_answer(
            resume_text,
            question,
            answer
        )

        # ---------------------------------
        # Get previous interview history
        # ---------------------------------

        history = session.get(
            "interview_history",
            []
        )

        # ---------------------------------
        # Save current question + answer
        # ---------------------------------

        history.append({
            "question": question,
            "answer": answer,
            "score": evaluation["score"]
        })

        session["interview_history"] = history
        session.modified = True

        # ---------------------------------
        # Maximum 6 questions
        # ---------------------------------

        if len(history) >= 6:

            return jsonify({
                "success": True,
                "score": evaluation["score"],
                "technical": evaluation["technical"],
                "communication": evaluation["communication"],
                "feedback": evaluation["feedback"],
                "strengths": evaluation["strengths"],
                "improvement": evaluation["improvement"],
                "done": True,
                "question_number": len(history),
                "total_questions": 6
            })

        # ---------------------------------
        # Generate next AI question
        # ---------------------------------

        next_question = generate_question(
            resume_text,
            history
        )

        return jsonify({
            "success": True,
            "score": evaluation["score"],
            "technical": evaluation["technical"],
            "communication": evaluation["communication"],
            "feedback": evaluation["feedback"],
            "strengths": evaluation["strengths"],
            "improvement": evaluation["improvement"],
            "next_question": next_question,
            "done": False,
            "question_number": len(history) + 1,
            "total_questions": 6
        })

    except Exception as e:

        print("Interview Answer Error:", e)

        return jsonify({
            "success": False,
            "message": "AI could not evaluate the answer.",
            "error": str(e)
        }), 500
# -------------------------
# DATABASE MODEL
# -------------------------

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)

# -------------------------
# SKILLS DATABASE
# -------------------------

skills_db = [
    "python",
    "java",
    "machine learning",
    "sql",
    "html",
    "css",
    "javascript",
    "react",
    "flask",
    "django",
    "aws"
]

# Different names for the same skill
skill_aliases = {

    "python": [
        "python"
    ],

    "java": [
        "java"
    ],

    "javascript": [
        "javascript",
        "js"
    ],

    "sql": [
        "sql",
        "mysql",
        "postgresql",
        "sqlite"
    ],

    "html": [
        "html",
        "html5"
    ],

    "css": [
        "css",
        "css3"
    ],

    "react": [
        "react",
        "react.js",
        "reactjs"
    ],

    "flask": [
        "flask"
    ],

    "django": [
        "django"
    ],

    "aws": [
        "aws",
        "amazon web services"
    ],

    "machine learning": [
        "machine learning",
        "machine-learning"
    ]
}

jobs = {
    "python": "Python Developer",

    "java": "Java Developer",

    "machine learning": "Machine Learning Engineer",

    "sql": "Database Developer",

    "html": "Frontend Developer",

    "css": "Frontend Developer",

    "javascript": "JavaScript Developer",

    "react": "React Developer",

    "flask": "Python Flask Developer",

    "django": "Django Developer",

    "aws": "Cloud / AWS Developer"
}

# -------------------------
# PDF TEXT EXTRACT
# -------------------------

def extract_text(path):

    text = ""

    try:
        with open(path, "rb") as file:
            reader = PyPDF2.PdfReader(file)

            for page in reader.pages:
                content = page.extract_text()
                if content:
                    text += content

    except Exception as e:
        print("PDF Error:", e)

    return text.lower()


# -------------------------
# RESUME ANALYSIS
# -------------------------
def analyze_resume(text):

    found_skills = []
    suggestions = []

    text = text.lower()

    # =========================
    # SKILL ALIASES
    # =========================

    skill_aliases = {

        "python": [
            "python",
            "python3"
        ],

        "java": [
            "java"
        ],

        "machine learning": [
            "machine learning",
            "machine-learning",
            "ml"
        ],

        "sql": [
            "sql",
            "mysql",
            "postgresql"
        ],

        "html": [
            "html",
            "html5"
        ],

        "css": [
            "css",
            "css3"
        ],

        "javascript": [
            "javascript",
            "js"
        ],

        "react": [
            "react",
            "reactjs",
            "react.js"
        ],

        "flask": [
            "flask"
        ],

        "django": [
            "django"
        ],

        "aws": [
            "aws",
            "amazon web services"
        ]
    }


    # =========================
    # DETECT SKILLS
    # =========================

    for skill, aliases in skill_aliases.items():

        for alias in aliases:

            pattern = r"\b" + re.escape(alias) + r"\b"

            if re.search(pattern, text):

                found_skills.append(skill)

                break


    # =========================
    # ATS SCORE
    # =========================

    score = len(found_skills) * 10

    score = min(score, 100)


    # =========================
    # SMART SUGGESTIONS
    # =========================

    suggestion_map = {

        "python": "Add Django or Flask experience to strengthen your Python profile.",

        "machine learning": "Add ML projects with scikit-learn, Pandas and NumPy.",

        "sql": "Add database projects and mention joins, queries and database optimization.",

        "html": "Add responsive web design projects using HTML5.",

        "css": "Mention responsive design, Flexbox and Grid skills.",

        "javascript": "Add JavaScript projects and mention DOM manipulation and APIs.",

        "react": "Add React projects using components, hooks and API integration.",

        "flask": "Mention REST APIs and Flask backend projects.",

        "java": "Add Java projects demonstrating OOP and problem-solving.",

        "aws": "Add AWS deployment or cloud experience if you have used it."
    }


    for skill in found_skills:

        if skill in suggestion_map:

            suggestions.append(
                suggestion_map[skill]
            )


    # If nothing useful was found
    if not found_skills:

        suggestions = [
            "Add clearly defined technical skills to your resume.",
            "Include at least 2-3 projects with technologies used.",
            "Mention measurable achievements wherever possible."
        ]


    # Maximum 5 suggestions
    suggestions = suggestions[:5]


    # =========================
    # JOB RECOMMENDATIONS
    # =========================

    jobs = {

        "python":
            "Python Developer",

        "machine learning":
            "Machine Learning Engineer",

        "sql":
            "Database Developer",

        "html":
            "Frontend Developer",

        "css":
            "Frontend Developer",

        "javascript":
            "JavaScript Developer",

        "react":
            "React Developer",

        "flask":
            "Python Flask Developer",

        "django":
            "Django Developer",

        "aws":
            "Cloud / AWS Developer"
    }


    job_list = []

    for skill in found_skills:

        if skill in jobs:

            job = jobs[skill]

            if job not in job_list:

                job_list.append(job)


    job_list = job_list[:5]


    return (
        score,
        found_skills,
        suggestions,
        job_list
    )

# -------------------------
# ROUTES
# -------------------------

@app.route("/")
def home():
    return render_template("login.html")


@app.route("/signup", methods=["GET", "POST"])
def signup():

    if request.method == "POST":

        full_name = request.form.get("full_name", "").strip()
        username = request.form.get("username", "").strip()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        confirm_password = request.form.get("confirm_password", "")

        # Full name validation
        if not full_name:
            flash("Please enter your full name.", "error")
            return render_template("signup.html")

        # Username validation
        if not username:
            flash("Please choose a username.", "error")
            return render_template("signup.html")

        # Email validation
        if not email:
            flash("Please enter your email address.", "error")
            return render_template("signup.html")

        if "@" not in email or "." not in email:
            flash("Please enter a valid email address.", "error")
            return render_template("signup.html")

        # Password validation
        if not password:
            flash("Please create a password.", "error")
            return render_template("signup.html")

        if len(password) < 6:
            flash("Password must be at least 6 characters.", "error")
            return render_template("signup.html")

        # Confirm password
        if password != confirm_password:
            flash("Passwords do not match.", "error")
            return render_template("signup.html")

        # Check username
        existing_username = User.query.filter_by(
            username=username
        ).first()

        if existing_username:
            flash("Username already exists. Please choose another.", "error")
            return render_template("signup.html")

        # Check email
        existing_email = User.query.filter_by(
            email=email
        ).first()

        if existing_email:
            flash("Email already registered. Please login.", "error")
            return render_template("signup.html")

        # Hash password
        hashed_password = generate_password_hash(password)

        # Create user
        user = User(
            full_name=full_name,
            username=username,
            email=email,
            password=hashed_password
        )

        db.session.add(user)
        db.session.commit()

        flash("Account created successfully! Please login.", "success")

        return redirect("/")

    return render_template("signup.html")

@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "POST":

        username = request.form["username"]
        password = request.form["password"]

        user = User.query.filter_by(username=username).first()

        if user and check_password_hash(user.password, password):

            session["user"] = user.username

            return redirect("/home")

        else:
            flash("Invalid username or password", "error")

    return render_template("login.html")

@app.route("/logout")
def logout():

    session.pop("user", None)

    return redirect("/")


@app.route("/dashboard")
def dashboard():

    if "user" not in session:
        return redirect("/")
        last_analysis = datetime.now().strftime("%d %b %Y %I:%M %p")
    return render_template(
    "dashboard.html",
    username=session["user"],
    score=0,
    found_skills=[],
    suggestions=[],
    job_list=[],
    last_analysis=None
)
# -------------------------
# RESUME UPLOAD
# -------------------------

@app.route("/upload", methods=["POST"])
def upload():

    if "user" not in session:
        return redirect("/")

    if "resume" not in request.files:
        return "No file uploaded"

    file = request.files["resume"]

    if file.filename == "":
        return "No file selected"

    if not allowed_file(file.filename):
        return "Only PDF files allowed"

    filename = secure_filename(file.filename)

    path = os.path.join(
        UPLOAD_FOLDER,
        filename
    )

    file.save(path)

    text = extract_text(path)
    session["resume_text"] = text
    session["interview_history"] = []
    score, skills, suggestions, jobs = analyze_resume(text)

    last_analysis = datetime.now().strftime(
        "%d %b %Y %I:%M %p"
    )

    return render_template(
        "dashboard.html",
        username=session["user"],
        score=score,
        found_skills=skills,
        suggestions=suggestions,
        job_list=jobs,
        last_analysis=last_analysis
    )


# -------------------------
# INTERVIEW REPORT PDF
# -------------------------

@app.route("/download_report")
def download_report():

    if "user" not in session:
        return redirect("/")

    report = session.get("interview_report")

    if not report:

        return "Please complete an interview before downloading the report."

    file_path = os.path.join(
        app.root_path,
        "interview_report.pdf"
    )

    styles = getSampleStyleSheet()

    content = []

    # -------------------------
    # TITLE
    # -------------------------

    content.append(
        Paragraph(
            "Hire Genius - AI Interview Report",
            styles["Title"]
        )
    )

    content.append(
        Spacer(1, 20)
    )


    # -------------------------
    # CANDIDATE
    # -------------------------

    content.append(
        Paragraph(
            f"Candidate Name : {report['username']}",
            styles["Normal"]
        )
    )

    content.append(
        Spacer(1, 8)
    )


    # -------------------------
    # QUESTIONS
    # -------------------------

    content.append(
        Paragraph(
            f"Questions Answered : {report['total_questions']}",
            styles["Normal"]
        )
    )

    content.append(
        Spacer(1, 8)
    )


    # -------------------------
    # SCORE
    # -------------------------

    content.append(
        Paragraph(
            f"Average Score : {report['average_score']} / 10",
            styles["Normal"]
        )
    )

    content.append(
        Spacer(1, 8)
    )


    # -------------------------
    # PERFORMANCE
    # -------------------------

    content.append(
        Paragraph(
            f"Performance : {report['performance']}",
            styles["Normal"]
        )
    )

    content.append(
        Spacer(1, 20)
    )


    # -------------------------
    # SUGGESTION
    # -------------------------

    if report["performance"] == "Excellent":

        suggestion = (
            "Excellent performance. Continue practicing "
            "to maintain your confidence and communication skills."
        )

    elif report["performance"] == "Good":

        suggestion = (
            "Good performance. Improve your technical explanations "
            "and include practical examples in your answers."
        )

    elif report["performance"] == "Average":

        suggestion = (
            "Keep practicing. Try to provide more detailed answers "
            "and explain your approach clearly."
        )

    else:

        suggestion = (
            "More practice is recommended. Work on confidence, "
            "communication and technical explanation."
        )


    content.append(
        Paragraph(
            f"AI Suggestion : {suggestion}",
            styles["Normal"]
        )
    )


    content.append(
        Spacer(1, 20)
    )

    # -------------------------
    # FOOTER
    # -------------------------

    content.append(
        Paragraph(
            "Generated by Hire Genius AI Career Assistant",
            styles["Normal"]
        )
    )

    # -------------------------
    # CREATE PDF
    # -------------------------

    pdf = SimpleDocTemplate(
        file_path
    )

    pdf.build(content)


    return send_file(
        file_path,
        as_attachment=True,
        download_name="HireGenius_Interview_Report.pdf"
    )
# -------------------------
# HOME PAGE
# -------------------------

@app.route("/home")
def home_page():

    if "user" not in session:
        return redirect("/")

    return render_template(
        "home.html",
        username=session["user"]
    )


# -------------------------
# FEEDBACK PAGE
# -------------------------

@app.route("/feedback", methods=["GET", "POST"])
def feedback():

    if "user" not in session:
        return redirect("/")

    if request.method == "POST":

        name = request.form.get("name")
        email = request.form.get("email")
        message = request.form.get("message")

        print("Feedback Received:")
        print("Name:", name)
        print("Email:", email)
        print("Message:", message)

        return render_template(
            "feedback.html",
            username=session["user"],
            success="Thank you! Your feedback has been submitted."
        )

    return render_template(
        "feedback.html",
        username=session["user"]
    )


# -------------------------
# CONTACT PAGE
# -------------------------

@app.route("/contact")
def contact():

    if "user" not in session:
        return redirect("/")

    return render_template(
        "contact.html",
        username=session["user"]
    )

if __name__=="__main__":

    with app.app_context():
        db.create_all()

    app.run(debug=True)