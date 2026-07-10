# 🤖 InterviewAI

An AI-powered Interview Preparation Platform that helps users practice technical and HR interviews with personalized AI feedback, resume-based question generation, interview history tracking, and performance analytics.

---

## 🚀 Live Demo

🌐 Frontend: https://interview-ai-frontend-livid.vercel.app

⚙️ Backend: https://interview-ai-backend-dfic.onrender.com

---

## ✨ Features

- 🔐 User Authentication
  - Register
  - Login
  - Google OAuth Login
  - Forgot Password with Email OTP
  - Secure Password Reset

- 🤖 AI Interview Practice
  - HR Interview
  - Technical Interview
  - Resume-based Interview
  - Company-specific Interview

- 📄 Resume Upload
  - PDF Resume Parsing
  - AI-generated Resume Questions

- 📊 AI Evaluation
  - Overall Score
  - Strengths
  - Weaknesses
  - Suggestions for Improvement

- 📈 Dashboard
  - Interview History
  - Previous Scores
  - User Profile

- 📑 Report Generation
  - Download Interview Report as PDF

- 📱 Responsive UI

---

## 🛠 Tech Stack

### Frontend

- React.js
- React Router
- Axios
- Chart.js
- CSS

### Backend

- Flask
- SQLAlchemy
- Flask-Bcrypt
- JWT Authentication
- Google OAuth
- Google Gemini AI
- Flask-Mail
- PyPDF

### Database

- SQLite

### Deployment

- Frontend → Vercel
- Backend → Render

---

## Project Structure

```
InterviewAI/
│
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── Profile
│   └── instance/
│
├── src/
├── public/
├── package.json
└── README.md
```

---

## Installation

### Clone the repository

```bash
git clone https://github.com/hansikhagarine31/InterviewAI.git
```

### Backend

```bash
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

python app.py
```

### Frontend

```bash
npm install

npm run dev
```

---

## Environment Variables

Create a `.env` file inside the backend folder.

```
GEMINI_API_KEY=

SECRET_KEY=

MAIL_USERNAME=

MAIL_PASSWORD=

DATABASE_URL=

ALLOWED_ORIGINS=
```

---

## Future Improvements

- Email Verification
- More Company Interview Sets
- AI Voice Interviews
- Interview Analytics
- Leaderboard
- Certificate Generation

---

## Author

**Hansikha Garine**

GitHub:
https://github.com/hansikhagarine31

LinkedIn:
https://www.linkedin.com/in/hansikhagarine31/

---