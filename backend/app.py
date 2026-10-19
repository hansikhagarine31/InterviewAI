import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from flask import Flask, request, jsonify, g
from functools import wraps
import secrets
from markupsafe import escape
import re
from pypdf import PdfReader
from flask_cors import CORS
import os
app = Flask(__name__)
from google.oauth2 import id_token
from google.auth.transport import requests
from google import genai
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
import jwt
import datetime
import time
load_dotenv()

# Restrict CORS to known frontend origin(s) in production.
# Set ALLOWED_ORIGINS to a comma-separated list, e.g.
# "https://your-app.vercel.app,http://localhost:5173"
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
if allowed_origins == "*":
    CORS(app)
else:
    CORS(app, origins=[o.strip() for o in allowed_origins.split(",") if o.strip()])

# Render's disks are ephemeral outside of a persistent Disk mount, so this
# SQLite file will reset on redeploy unless DATABASE_URL points at a real
# database (e.g. Render's managed Postgres) or a mounted Disk.
database_url = os.getenv("DATABASE_URL", "sqlite:///users.db")
# Render/Heroku hand out "postgres://" URLs; SQLAlchemy 2.x needs "postgresql://".
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)
app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# SECRET_KEY must be overridden in production via env var — never rely on
# this fallback outside of local development.
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "interview-ai-secret")

db = SQLAlchemy(app)
otp_store = {}
bcrypt = Bcrypt(app)
class User(db.Model):

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(100),
        nullable=False
    )

    email = db.Column(
        db.String(120),
        unique=True,
        nullable=False
    )

    password = db.Column(
        db.String(255),
        nullable=False
    )
class Interview(db.Model):

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id")
    )

    score = db.Column(
        db.Integer
    )

    feedback = db.Column(
        db.Text
    )

    date = db.Column(
        db.String(100)
    )
client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)
def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)


def make_token(user):
    return jwt.encode(
        {"user_id": user.id, "exp": utcnow() + datetime.timedelta(days=7)},
        app.config["SECRET_KEY"],
        algorithm="HS256"
    )


def auth_required(f):
    """Require a valid Bearer token; sets g.user_id."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return jsonify({"error": "Authentication required."}), 401
        try:
            payload = jwt.decode(
                header[7:], app.config["SECRET_KEY"], algorithms=["HS256"]
            )
        except jwt.PyJWTError:
            return jsonify({"error": "Invalid or expired token."}), 401
        g.user_id = payload["user_id"]
        return f(*args, **kwargs)
    return wrapper


def admin_required(f):
    """Auth plus membership in ADMIN_EMAILS (comma-separated). Unset = nobody."""
    @wraps(f)
    @auth_required
    def wrapper(*args, **kwargs):
        admins = {
            e.strip().lower()
            for e in os.getenv("ADMIN_EMAILS", "").split(",")
            if e.strip()
        }
        user = db.session.get(User, g.user_id)
        if not user or user.email.lower() not in admins:
            return jsonify({"error": "Forbidden."}), 403
        return f(*args, **kwargs)
    return wrapper


def forbidden_unless_self(user_id):
    if user_id != g.user_id:
        return jsonify({"error": "Forbidden."}), 403
    return None


def password_error(password):
    if len(password) < 8:
        return "Password must contain at least 8 characters."
    if not (any(c.isupper() for c in password)
            and any(c.islower() for c in password)
            and any(c.isdigit() for c in password)):
        return "Password must contain uppercase, lowercase and a number."
    return None


def parse_questions(text, limit=None):
    questions = []
    for line in text.splitlines():
        line = re.sub(r"^\s*(?:[-*•]|\d+[.)])\s*", "", line).strip()
        if line:
            questions.append(line)
    return questions[:limit] if limit else questions


def generate_text(prompt):
    try:
        return client.models.generate_content(
            model="gemini-2.5-flash", contents=prompt
        ).text
    except Exception:
        return client.models.generate_content(
            model="gemini-2.5-flash-lite", contents=prompt
        ).text

company_data = {

    "Google": {
        "rounds": [
            "Online Assessment",
            "Technical Interviews",
            "Googliness Round"
        ],
        "focus": [
            "DSA",
            "System Design",
            "Problem Solving"
        ],
        "tip":
        "Practice LeetCode Medium/Hard and explain your approach clearly."
    },

    "Amazon": {
        "rounds": [
            "Online Assessment",
            "Technical Round",
            "Bar Raiser"
        ],
        "focus": [
            "DSA",
            "Leadership Principles"
        ],
        "tip":
        "Prepare stories for Amazon Leadership Principles."
    },

    "Microsoft": {
        "rounds": [
            "OA",
            "Technical Interviews",
            "Behavioral Round"
        ],
        "focus": [
            "DSA",
            "OOP",
            "System Design"
        ],
        "tip":
        "Focus on coding and communication."
    },

    "Meta": {
        "rounds": [
            "Coding Round",
            "System Design",
            "Behavioral"
        ],
        "focus": [
            "DSA",
            "Scalability"
        ],
        "tip":
        "Master Trees, Graphs and Design concepts."
    },

    "Apple": {
        "rounds": [
            "Technical",
            "Managerial",
            "Behavioral"
        ],
        "focus": [
            "Problem Solving",
            "Domain Knowledge"
        ],
        "tip":
        "Be strong in fundamentals."
    },

    "Netflix": {
        "rounds": [
            "Technical",
            "System Design",
            "Culture Fit"
        ],
        "focus": [
            "Distributed Systems",
            "Design"
        ],
        "tip":
        "Expect senior-level discussion."
    },

    "OpenAI": {
        "rounds": [
            "Technical",
            "Research/Project Discussion",
            "Behavioral"
        ],
        "focus": [
            "AI",
            "LLMs",
            "System Design"
        ],
        "tip":
        "Show strong projects and problem-solving."
    },

    "Nvidia": {
        "rounds": [
            "Technical",
            "Coding",
            "Architecture"
        ],
        "focus": [
            "C++",
            "Algorithms",
            "AI"
        ],
        "tip":
        "Know performance optimization concepts."
    },

    "Adobe": {
        "rounds": [
            "Coding",
            "Technical",
            "HR"
        ],
        "focus": [
            "DSA",
            "OOP"
        ],
        "tip":
        "Strong coding fundamentals help."
    },

    "Oracle": {
        "rounds": [
            "Coding",
            "Technical",
            "Managerial"
        ],
        "focus": [
            "Java",
            "Database",
            "DSA"
        ],
        "tip":
        "Prepare DBMS and Java thoroughly."
    },

    "TCS": {
        "rounds": [
            "Aptitude",
            "Technical",
            "HR"
        ],
        "focus": [
            "CS Fundamentals"
        ],
        "tip":
        "Revise DBMS, OS and OOP."
    },

    "Infosys": {
        "rounds": [
            "Aptitude",
            "Technical",
            "HR"
        ],
        "focus": [
            "Programming Basics"
        ],
        "tip":
        "Practice aptitude questions."
    },

    "Wipro": {
        "rounds": [
            "Aptitude",
            "Coding",
            "HR"
        ],
        "focus": [
            "Programming",
            "Reasoning"
        ],
        "tip":
        "Focus on coding speed."
    },

    "Accenture": {
        "rounds": [
            "Assessment",
            "Technical",
            "HR"
        ],
        "focus": [
            "Coding",
            "Communication"
        ],
        "tip":
        "Be confident during HR discussion."
    },

    "Capgemini": {
    "rounds": [
        "Aptitude",
        "Technical",
        "HR"
    ],
    "focus": [
        "Programming",
        "DBMS",
        "OOP"
    ],
    "tip":
    "Prepare core CS subjects and communication skills."
},

"Goldman Sachs": {
    "rounds": [
        "OA",
        "Technical",
        "Behavioral"
    ],
    "focus": [
        "DSA",
        "Problem Solving",
        "Finance Basics"
    ],
    "tip":
    "Practice coding and explain optimizations."
},

"JPMorgan Chase": {
    "rounds": [
        "OA",
        "Technical",
        "Behavioral"
    ],
    "focus": [
        "Java",
        "DSA",
        "OOP"
    ],
    "tip":
    "Strong Java fundamentals are important."
},

"Morgan Stanley": {
    "rounds": [
        "OA",
        "Technical",
        "HR"
    ],
    "focus": [
        "DSA",
        "OS",
        "DBMS"
    ],
    "tip":
    "Be thorough with CS fundamentals."
},

"Deloitte": {
    "rounds": [
        "Aptitude",
        "Technical",
        "HR"
    ],
    "focus": [
        "Problem Solving",
        "Communication"
    ],
    "tip":
    "Prepare behavioral questions."
},

"Cognizant": {
    "rounds": [
        "Assessment",
        "Technical",
        "HR"
    ],
    "focus": [
        "Programming",
        "Reasoning"
    ],
    "tip":
    "Practice aptitude and coding."
},

"HCL": {
    "rounds": [
        "Assessment",
        "Technical",
        "HR"
    ],
    "focus": [
        "OOP",
        "Programming"
    ],
    "tip":
    "Revise programming fundamentals."
},

"Tech Mahindra": {
    "rounds": [
        "Aptitude",
        "Technical",
        "HR"
    ],
    "focus": [
        "Programming",
        "Communication"
    ],
    "tip":
    "Focus on confidence and basics."
},

"Zoho": {
    "rounds": [
        "Programming",
        "Advanced Coding",
        "Technical"
    ],
    "focus": [
        "DSA",
        "Problem Solving"
    ],
    "tip":
    "Practice Zoho-level coding questions."
},

"Salesforce": {
    "rounds": [
        "Coding",
        "System Design",
        "Behavioral"
    ],
    "focus": [
        "Java",
        "DSA",
        "Design"
    ],
    "tip":
    "Prepare object-oriented design questions."
},

"Uber": {
    "rounds": [
        "Coding",
        "System Design",
        "Behavioral"
    ],
    "focus": [
        "Graphs",
        "Design",
        "Scalability"
    ],
    "tip":
    "Strong DSA and system design required."
},

"Airbnb": {
    "rounds": [
        "Coding",
        "Design",
        "Behavioral"
    ],
    "focus": [
        "DSA",
        "System Design"
    ],
    "tip":
    "Expect practical engineering questions."
},

"PayPal": {
    "rounds": [
        "OA",
        "Technical",
        "HR"
    ],
    "focus": [
        "Java",
        "DBMS",
        "DSA"
    ],
    "tip":
    "Prepare backend development concepts."
},

"Visa": {
    "rounds": [
        "Coding",
        "Technical",
        "HR"
    ],
    "focus": [
        "Java",
        "OOP",
        "DBMS"
    ],
    "tip":
    "Know transactions and backend concepts."
},

"Mastercard": {
    "rounds": [
        "Coding",
        "Technical",
        "Behavioral"
    ],
    "focus": [
        "DSA",
        "System Design"
    ],
    "tip":
    "Focus on scalable systems."
},

"Flipkart": {
    "rounds": [
        "Coding",
        "Design",
        "Hiring Manager"
    ],
    "focus": [
        "DSA",
        "System Design"
    ],
    "tip":
    "Practice medium-hard DSA problems."
},

"Swiggy": {
    "rounds": [
        "Coding",
        "System Design",
        "Behavioral"
    ],
    "focus": [
        "DSA",
        "Backend"
    ],
    "tip":
    "Understand real-world architecture."
},

"Zomato": {
    "rounds": [
        "Coding",
        "Technical",
        "HR"
    ],
    "focus": [
        "DSA",
        "Backend"
    ],
    "tip":
    "Focus on APIs and databases."
},

"PhonePe": {
    "rounds": [
        "Coding",
        "Design",
        "Behavioral"
    ],
    "focus": [
        "Java",
        "System Design"
    ],
    "tip":
    "Strong backend skills help."
},

"Razorpay": {
    "rounds": [
        "Coding",
        "Technical",
        "Managerial"
    ],
    "focus": [
        "DSA",
        "Payment Systems"
    ],
    "tip":
    "Know scalable payment architectures."
},
}
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not name or not email or "@" not in email:
        return jsonify({"error": "Name and a valid email are required."}), 400

    error = password_error(password)
    if error:
        return jsonify({"error": error}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 400

    user = User(
        name=name,
        email=email,
        password=bcrypt.generate_password_hash(password).decode("utf-8")
    )
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"})


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter_by(email=email).first()

    if not user or not bcrypt.check_password_hash(user.password, password):
        return jsonify({"error": "Invalid credentials"}), 401

    return jsonify({
        "token": make_token(user),
        "user": {"id": user.id, "name": user.name, "email": user.email}
    })


@app.route("/evaluate", methods=["POST"])
@auth_required
def evaluate():
    try:
        data = request.get_json(silent=True) or {}
        answers = data.get("answers", [])

        prompt_text = f"""
You are a professional interviewer.

Evaluate these answers:

{answers}

Return EXACTLY in this format:

SCORE: <number>/100

COMMUNICATION: <number>

TECHNICAL: <number>

PROBLEM_SOLVING: <number>

CONFIDENCE: <number>

STRENGTHS:
- point 1
- point 2

WEAKNESSES:
- point 1
- point 2

SUGGESTIONS:
- point 1
- point 2

Be strict.
"""
        return jsonify({"feedback": generate_text(prompt_text)})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------- RESUME UPLOAD ----------------

@app.route("/upload-resume", methods=["POST"])
@auth_required
def upload_resume():
    try:
        file = request.files.get("resume")

        if file is None:
            return jsonify({"error": "Resume file not received."}), 400

        reader = PdfReader(file)

        resume_text = ""
        for page in reader.pages:
            text = page.extract_text()
            if text:
                resume_text += text + "\n"

        if not resume_text.strip():
            return jsonify({
                "error": "Could not read any text from this PDF."
            }), 400

        prompt_text = f"""
Analyze this resume:

{resume_text}

Generate exactly 5 interview questions based on:
- Skills
- Projects
- Technologies

Return ONLY the questions, one per line, no numbering.
"""
        questions = parse_questions(generate_text(prompt_text), 5)

        return jsonify({"questions": questions})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/generate-questions", methods=["POST"])
@auth_required
def generate_questions():
    try:
        data = request.get_json(silent=True) or {}

        interview_mode = data.get("interviewMode", "General")
        company = data.get("company", "")
        role = data.get("role", "")
        interview_type = data.get("interviewType")
        difficulty = data.get("difficulty")
        topics = data.get("topics", [])

        try:
            question_count = max(1, min(int(data.get("questionCount") or 5), 30))
        except (TypeError, ValueError):
            question_count = 5

        prompt_text = f"""
You are a senior interviewer.

Generate exactly {question_count}
interview questions.

Interview Mode:
{interview_mode}

Company:
{company}

Role:
{role}

Interview Type:
{interview_type}

Difficulty:
{difficulty}

Topics:
{", ".join(topics)}

Instructions:

If Interview Mode is General:
Generate high-quality interview questions.

If Interview Mode is Company Specific:
Generate realistic interview questions
for {company} hiring a {role}.

Mix company-specific behavioral,
technical and role-related questions.

Return only questions.

No numbering.

One question per line.

No explanations.
"""
        questions = parse_questions(generate_text(prompt_text), question_count)

        return jsonify({"questions": questions})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/company-insights", methods=["POST"])
@auth_required
def company_insights():
    data = request.get_json(silent=True) or {}
    info = company_data.get(data.get("company"))

    if not info:
        return jsonify({"error": "No company data available."}), 404

    return jsonify({"insights": info})


@app.route("/save-interview", methods=["POST"])
@auth_required
def save_interview():
    data = request.get_json(silent=True) or {}

    try:
        score = int(data.get("score", 0))
    except (TypeError, ValueError):
        score = 0

    interview = Interview(
        user_id=g.user_id,
        date=data.get("date") or utcnow().isoformat(),
        score=score,
        feedback=data.get("feedback", "")
    )

    db.session.add(interview)
    db.session.commit()

    return jsonify({"message": "saved", "id": interview.id})


def serialize_history(user_id):
    interviews = Interview.query.filter_by(
        user_id=user_id
    ).order_by(Interview.id.desc()).all()

    return [
        {
            "id": i.id,
            "date": i.date,
            "score": i.score,
            "feedback": i.feedback
        }
        for i in interviews
    ]


@app.route("/history/<int:user_id>")
@auth_required
def get_history(user_id):
    denied = forbidden_unless_self(user_id)
    if denied:
        return denied
    return jsonify(serialize_history(user_id))


@app.route("/user-history/<int:user_id>")
@auth_required
def user_history(user_id):
    denied = forbidden_unless_self(user_id)
    if denied:
        return denied
    return jsonify(serialize_history(user_id))


@app.route("/delete-interview/<int:id>", methods=["DELETE"])
@auth_required
def delete_interview(id):
    interview = db.session.get(Interview, id)

    if not interview or interview.user_id != g.user_id:
        return jsonify({"error": "Interview not found."}), 404

    db.session.delete(interview)
    db.session.commit()

    return jsonify({"message": "deleted"})


@app.route("/clear-history/<int:user_id>", methods=["DELETE"])
@auth_required
def clear_history(user_id):
    denied = forbidden_unless_self(user_id)
    if denied:
        return denied

    Interview.query.filter_by(user_id=user_id).delete()
    db.session.commit()

    return jsonify({"message": "History cleared"})


@app.route("/profile/<int:user_id>")
@auth_required
def profile(user_id):
    denied = forbidden_unless_self(user_id)
    if denied:
        return denied

    scores = [
        i.score or 0
        for i in Interview.query.filter_by(user_id=user_id).all()
    ]
    total = len(scores)

    return jsonify({
        "total": total,
        "best": max(scores) if scores else 0,
        "average": round(sum(scores) / total, 1) if total else 0
    })


@app.route("/update-profile", methods=["PUT"])
@auth_required
def update_profile():
    data = request.get_json(silent=True) or {}

    user = db.session.get(User, g.user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Name is required."}), 400
    user.name = name

    if data.get("password"):
        error = password_error(data["password"])
        if error:
            return jsonify({"error": error}), 400
        user.password = bcrypt.generate_password_hash(
            data["password"]
        ).decode("utf-8")

    db.session.commit()

    return jsonify({"message": "Profile updated"})


@app.route("/change-username", methods=["PUT"])
@auth_required
def change_username():
    data = request.get_json(silent=True) or {}

    user = db.session.get(User, g.user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    username = (data.get("username") or "").strip()
    if len(username) < 3:
        return jsonify({
            "error": "Username must contain at least 3 characters."
        }), 400

    user.name = username
    db.session.commit()

    return jsonify({"message": "Username updated"})


@app.route("/change-password", methods=["PUT"])
@auth_required
def change_password():
    data = request.get_json(silent=True) or {}

    user = db.session.get(User, g.user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    current_password = data.get("current_password") or ""
    new_password = data.get("new_password") or ""

    if not bcrypt.check_password_hash(user.password, current_password):
        return jsonify({"error": "Current password is incorrect."}), 400

    if new_password == current_password:
        return jsonify({
            "error": "New password must be different from the current password."
        }), 400

    error = password_error(new_password)
    if error:
        return jsonify({"error": error}), 400

    user.password = bcrypt.generate_password_hash(new_password).decode("utf-8")
    db.session.commit()

    return jsonify({"message": "Password changed successfully."})


@app.route("/send-otp", methods=["POST"])
def send_otp():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"error": "Email not found."}), 404

    otp = f"{secrets.randbelow(900000) + 100000}"

    otp_store[user.email] = {
        "otp": otp,
        "expires": time.time() + 300
    }

    try:
        configuration = sib_api_v3_sdk.Configuration()
        configuration.api_key["api-key"] = os.getenv("BREVO_API_KEY")

        api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
            sib_api_v3_sdk.ApiClient(configuration)
        )

        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=[{"email": user.email, "name": user.name}],
            sender={
                "email": os.getenv(
                    "MAIL_SENDER", "hansikhagarine31@gmail.com"
                ),
                "name": "InterviewAI"
            },
            subject="InterviewAI Password Reset OTP",
            html_content=f"""
            <h2>Hello {escape(user.name)},</h2>

            <p>Your OTP for resetting your password is:</p>

            <h1>{otp}</h1>

            <p>This OTP is valid for <b>5 minutes</b>.</p>

            <p>If you didn't request this, please ignore this email.</p>

            <br>

            <b>InterviewAI Team</b>
            """
        )

        api_instance.send_transac_email(send_smtp_email)

        return jsonify({"message": "OTP sent successfully"})

    except Exception as e:
        otp_store.pop(user.email, None)
        app.logger.error("OTP email failed: %s", e)
        return jsonify({
            "error": "Could not send the OTP email. Please try again later."
        }), 500


@app.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json(silent=True) or {}

    email = (data.get("email") or "").strip().lower()
    otp = str(data.get("otp") or "")
    new_password = data.get("new_password") or ""

    stored = otp_store.get(email)

    if not stored:
        return jsonify({"error": "OTP not generated."}), 400

    if time.time() > stored["expires"]:
        del otp_store[email]
        return jsonify({"error": "OTP expired."}), 400

    if not secrets.compare_digest(stored["otp"], otp):
        return jsonify({"error": "Invalid OTP."}), 400

    error = password_error(new_password)
    if error:
        return jsonify({"error": error}), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"error": "User not found."}), 404

    user.password = bcrypt.generate_password_hash(new_password).decode("utf-8")
    db.session.commit()

    del otp_store[email]

    return jsonify({"message": "Password reset successful."})


@app.route("/google-login", methods=["POST"])
def google_login():
    data = request.get_json(silent=True) or {}
    credential = data.get("credential")

    if not credential:
        return jsonify({"error": "Missing Google credential."}), 400

    try:
        google_user = id_token.verify_oauth2_token(
            credential,
            requests.Request(),
            os.getenv("GOOGLE_CLIENT_ID")
        )
    except Exception:
        return jsonify({"error": "Invalid Google token."}), 401

    if not google_user.get("email_verified", False):
        return jsonify({"error": "Google email is not verified."}), 401

    email = google_user["email"].lower()
    name = google_user.get("name") or email.split("@")[0]

    user = User.query.filter_by(email=email).first()

    if not user:
        # Random, unguessable password: Google users sign in via Google
        # (or reset it through the OTP flow).
        user = User(
            name=name,
            email=email,
            password=bcrypt.generate_password_hash(
                secrets.token_urlsafe(32)
            ).decode("utf-8")
        )
        db.session.add(user)
        db.session.commit()

    return jsonify({
        "token": make_token(user),
        "user": {"id": user.id, "name": user.name, "email": user.email}
    })



@app.route("/admin/users")
@admin_required
def admin_list_users():
    users = User.query.order_by(User.id).all()
    return jsonify([
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "interviews": Interview.query.filter_by(user_id=u.id).count()
        }
        for u in users
    ])


@app.route("/admin/users/<int:user_id>", methods=["DELETE"])
@admin_required
def admin_delete_user(user_id):
    if user_id == g.user_id:
        return jsonify({"error": "You cannot delete your own account."}), 400

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404

    removed = Interview.query.filter_by(user_id=user_id).delete()
    db.session.delete(user)
    db.session.commit()
    otp_store.pop(user.email, None)

    return jsonify({
        "message": "User deleted",
        "email": user.email,
        "interviews_deleted": removed
    })


with app.app_context():
    db.create_all()

if __name__ == "__main__":
    # Local development entry point. In production, gunicorn imports the
    # `app` object directly (see Procfile) and this block never runs.
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)
