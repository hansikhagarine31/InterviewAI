import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from flask import Flask, request, jsonify
from pypdf import PdfReader
from flask_cors import CORS
import os
app = Flask(__name__)
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from google.oauth2 import id_token
from google.auth.transport import requests
from google import genai
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
import jwt
import datetime
import random
import time
import traceback
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
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
    "DATABASE_URL", "sqlite:///users.db"
)
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

    try:

        data = request.json

        name = data.get("name")
        email = data.get("email")
        password = data.get("password")

        existing_user = User.query.filter_by(
            email=email
        ).first()

        if existing_user:
            return jsonify({
                "error": "Email already exists"
            }), 400

        hashed_password = bcrypt.generate_password_hash(
            password
        ).decode("utf-8")

        user = User(
            name=name,
            email=email,
            password=hashed_password
        )

        db.session.add(user)
        db.session.commit()

        return jsonify({
            "message": "User registered successfully"
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500
@app.route("/login", methods=["POST"])
def login():

    try:

        data = request.json

        email = data["email"]
        password = data["password"]

        user = User.query.filter_by(
            email=email
        ).first()

        if not user:

            return jsonify({
                "error":
                "Invalid credentials"
            }), 401

        if not bcrypt.check_password_hash(
            user.password,
            password
        ):

            return jsonify({
                "error":
                "Invalid credentials"
            }), 401

        token = jwt.encode(
            {
                "user_id": user.id,
                "exp":
                datetime.datetime.utcnow()
                + datetime.timedelta(days=7)
            },
            app.config["SECRET_KEY"],
            algorithm="HS256"
        )

        return jsonify({
            "token": token,
            "user": {
        "id": user.id,
        "name": user.name,
        "email": user.email
    }
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500
@app.route("/evaluate", methods=["POST"])
def evaluate():

    try:

        data = request.json
        answers = data.get("answers", [])
        image = data.get("image")
        
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

        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt_text
            )
        except Exception:
            response = client.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=prompt_text
            )

        return jsonify({
            "feedback": response.text
        })

    except Exception as e:


        return jsonify({
            "error":
    str(e)
        }), 500


# ---------------- RESUME UPLOAD ----------------

@app.route("/upload-resume", methods=["POST"])
def upload_resume():

    try:

        print("Content-Type:", request.content_type)
        print("Files:", request.files)
        print("Form:", request.form)

        file = request.files.get("resume")

        if file is None:
            return jsonify({
                "error": "Resume file not received."
            }), 400

        reader = PdfReader(file)

        resume_text = ""

        for page in reader.pages:
            text = page.extract_text()

            if text:
                resume_text += text + "\n"

        prompt_text = f"""
        Analyze this resume:

        {resume_text}

        Generate exactly 5 interview questions based on:
        - Skills
        - Projects
        - Technologies

        Return ONLY the questions.
        """

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt_text
        )

        questions = [
            q.strip()
            for q in response.text.split("\n")
            if q.strip()
        ]

        

        return jsonify({
            "questions": questions
        })

    except Exception as e:

        

        return jsonify({
            "error": str(e)
        }), 500

@app.route("/generate-questions", methods=["POST"])
def generate_questions():

    try:

        data = request.json

        interview_mode = data.get(
            "interviewMode",
            "General"
        )

        company = data.get(
            "company",
            ""
        )

        role = data.get(
            "role",
            ""
        )

        interview_type = data.get(
            "interviewType"
        )

        difficulty = data.get(
            "difficulty"
        )

        question_count = data.get(
            "questionCount"
        )
        topics = data.get(
    "topics",
    []
)
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

Focus Area:
{interview_type}

Difficulty:
{difficulty}

Mix company-specific behavioral,
technical and role-related questions.

Return only questions.

No numbering.

One question per line.

No explanations.
"""

        try:
           response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt_text
        )
        except Exception:
            response = client.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=prompt_text
        )

        questions = [
            q.strip()
            for q in response.text.split("\n")
            if q.strip()
        ]

        return jsonify({
            "questions": questions
        })

    except Exception as e:


        return jsonify({
            "error": str(e)
        }), 500
@app.route("/company-insights", methods=["POST"])
def company_insights():

    data = request.json

    company = data.get("company")

    info = company_data.get(company)

    if not info:

        return jsonify({
            "insights":
            "No company data available."
        })

    return jsonify({
        "insights": info
    })
@app.route(
    "/save-interview",
    methods=["POST"]
)
def save_interview():

    data = request.json
    
    interview = Interview(
        user_id=data["user_id"],
        date=data["date"],
        score=data["score"],
        feedback=data["feedback"]
    )

    db.session.add(interview)
    db.session.commit()

    return jsonify({
        "message": "saved"
    })
@app.route(
    "/history/<int:user_id>"
)
def get_history(user_id):

    interviews = Interview.query.filter_by(
        user_id=user_id
    ).all()

    result = []

    for i in interviews:

        result.append({
            "id": i.id,
            "date": i.date,
            "score": i.score,
            "feedback": i.feedback
        })

    return jsonify(result)
@app.route("/user-history/<int:user_id>")
def user_history(user_id):

    interviews = Interview.query.filter_by(
        user_id=user_id
    ).all()

   

    result = []

    for interview in interviews:

        

        result.append({
            "id": interview.id,
            "date": interview.date,
            "score": interview.score,
            "feedback": interview.feedback
        })

    

    return jsonify(result)
@app.route(
    "/delete-interview/<int:id>",
    methods=["DELETE"]
)
def delete_interview(id):

    interview =Interview.query.get(id)

    if interview:

        db.session.delete(interview)
        db.session.commit()

    return jsonify({
        "message": "deleted"
    })
@app.route("/delete-all-history")
def delete_all_history():

    Interview.query.delete()

    db.session.commit()

    return "deleted"

@app.route(
    "/clear-history/<int:user_id>",
    methods=["DELETE"]
)
def clear_history(user_id):

    

    Interview.query.filter_by(
        user_id=user_id
    ).delete()

    db.session.commit()

    return jsonify({
        "message": "History cleared"
    })
@app.route("/profile/<int:user_id>")
def profile(user_id):

    interviews = Interview.query.filter_by(
        user_id=user_id
    ).all()

    total = len(interviews)

    best = 0
    average = 0

    if total > 0:

        scores = [
            i.score
            for i in interviews
        ]

        best = max(scores)

        average = round(
            sum(scores) / total,
            1
        )

    return jsonify({
        "total": total,
        "best": best,
        "average": average
    })
@app.route(
    "/update-profile",
    methods=["PUT"]
)
def update_profile():

    data = request.json
    
    user = User.query.get(
        data["user_id"]
    )

    if not user:

        return jsonify({
            "error": "User not found"
        }), 404

    user.name = data["name"]

    if (
        "password" in data and
        data["password"] != ""
    ):

        

        user.password = bcrypt.generate_password_hash(
            data["password"]
        ).decode("utf-8")

        

    db.session.commit()

    return jsonify({
        "message": "Profile updated"
    })
@app.route(
    "/change-username",
    methods=["PUT"]
)
def change_username():

    data = request.json

    user = User.query.get(
        data["user_id"]
    )

    if not user:

        return jsonify({
            "error": "User not found"
        }), 404

    user.name = data["username"]

    db.session.commit()

    return jsonify({
        "message": "Username updated"
    })
@app.route(
    "/change-password",
    methods=["PUT"]
)
def change_password():

    data = request.json

    user = User.query.get(
        data["user_id"]
    )

    if not user:

        return jsonify({
            "error": "User not found"
        }), 404

    if not bcrypt.check_password_hash(
        user.password,
        data["current_password"]
    ):

        return jsonify({
            "error": "Current password is incorrect."
        }), 400

    new_password = data["new_password"]

    if len(new_password) < 8:

        return jsonify({
            "error":
            "Password must contain at least 8 characters."
        }), 400

    if new_password == data["current_password"]:

        return jsonify({
            "error":
            "New password must be different from the current password."
        }), 400

    has_upper = any(c.isupper() for c in new_password)
    has_lower = any(c.islower() for c in new_password)
    has_digit = any(c.isdigit() for c in new_password)

    if not (
        has_upper and
        has_lower and
        has_digit
    ):

        return jsonify({
            "error":
            "Password must contain uppercase, lowercase and a number."
        }), 400

    user.password = bcrypt.generate_password_hash(
        new_password
    ).decode("utf-8")

    db.session.commit()

    return jsonify({
        "message":
        "Password changed successfully."
    })
@app.route("/send-otp", methods=["POST"])
def send_otp():

    data = request.json

    user = User.query.filter_by(
        email=data["email"]
    ).first()

    if not user:
        return jsonify({
            "error": "Email not found."
        }), 404

    otp = str(random.randint(100000, 999999))

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
                "email": "hansikhagarine31@gmail.com",
                "name": "InterviewAI"
            },
            subject="InterviewAI Password Reset OTP",
            html_content=f"""
            <h2>Hello {user.name},</h2>

            <p>Your OTP for resetting your password is:</p>

            <h1>{otp}</h1>

            <p>This OTP is valid for <b>5 minutes</b>.</p>

            <p>If you didn't request this, please ignore this email.</p>

            <br>

            <b>InterviewAI Team</b>
            """
        )

        api_instance.send_transac_email(send_smtp_email)

        return jsonify({
            "message": "OTP sent successfully"
        })

    except ApiException as e:
        return jsonify({
            "error": str(e)
        }), 500

@app.route(
    "/reset-password",
    methods=["POST"]
)
def reset_password():

    data = request.json

    email = data["email"]
    otp = data["otp"]
    new_password = data["new_password"]
    if email not in otp_store:

        return jsonify({
            "error": "OTP not generated."
        }), 400
    stored = otp_store[email]
    if time.time() > stored["expires"]:

        del otp_store[email]

        return jsonify({
            "error": "OTP expired."
        }), 400
    if stored["otp"] != otp:

        return jsonify({
            "error": "Invalid OTP."
        }), 400

    if len(new_password) < 8:

        return jsonify({
            "error":
            "Password must contain at least 8 characters."
        }), 400

    has_upper = any(c.isupper() for c in new_password)
    has_lower = any(c.islower() for c in new_password)
    has_digit = any(c.isdigit() for c in new_password)

    if not (
        has_upper and
        has_lower and
        has_digit
    ):

        return jsonify({
            "error":
            "Password must contain an uppercase letter, lowercase letter and a number."
        }), 400

    user = User.query.filter_by(
        email=email
    ).first()

    if not user:

        return jsonify({
            "error": "User not found."
        }), 404

    user.password = bcrypt.generate_password_hash(
        new_password
    ).decode("utf-8")

    db.session.commit()

    del otp_store[email]

    return jsonify({
        "message":
        "Password reset successful."
    })
@app.route(
    "/google-login",
    methods=["POST"]
)
def google_login():

    data = request.json

    credential = data["credential"]

    try:

        google_user = id_token.verify_oauth2_token(

            credential,

            requests.Request(),

            os.getenv("GOOGLE_CLIENT_ID")

        )

    except Exception:

        return jsonify({
            "error": "Invalid Google token."
        }), 401

    email = google_user["email"]
    name = google_user["name"]

    user = User.query.filter_by(
        email=email
    ).first()

    if not user:

        random_password = bcrypt.generate_password_hash(
            "google_login"
        ).decode("utf-8")

        user = User(
            name=name,
            email=email,
            password=random_password
        )

        db.session.add(user)
        db.session.commit()

    token = jwt.encode(
        {
            "user_id": user.id,
            "exp":
            datetime.datetime.utcnow()
            + datetime.timedelta(days=7)
        },
        app.config["SECRET_KEY"],
        algorithm="HS256"
    )

    return jsonify({

        "token": token,

        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }

    })
with app.app_context():
    db.create_all()

if __name__ == "__main__":
    # Local development entry point. In production, gunicorn imports the
    # `app` object directly (see Procfile) and this block never runs.
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)