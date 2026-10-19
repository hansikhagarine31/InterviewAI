import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import api from "../api/client";
import toast from "react-hot-toast";
import { jsPDF } from "jspdf";
import {
  CircularProgressbar,
  buildStyles,
} from "react-circular-progressbar";

import "react-circular-progressbar/dist/styles.css";

const parseSection = (text, name) => {
  const match = text.match(
    new RegExp(name + ":\\s*([\\s\\S]*?)(?=\\n\\s*[A-Z_]{4,}:|$)", "i")
  );

  if (!match) return [];

  return match[1]
    .split("\n")
    .map((line) => line.replace(/^\s*[-*•]\s*/, "").trim())
    .filter(Boolean);
};

function Report() {

  const location = useLocation();
  const navigate = useNavigate();
  const feedback =
    location.state?.feedback || "";

  const answers =
    location.state?.answers || [];

  const questions =
    location.state?.questions || [];

  const strengths = parseSection(feedback, "STRENGTHS");
  const weaknesses = parseSection(feedback, "WEAKNESSES");
  const suggestions = parseSection(feedback, "SUGGESTIONS");

  const scoreMatch =
    feedback.match(/SCORE:\s*(\d+)/i) ||
    feedback.match(/(\d+)\s*\/\s*100/);

  const score =
    scoreMatch
      ? Math.min(Number(scoreMatch[1]), 100)
      : 0;

  const communication =
    feedback.match(
      /COMMUNICATION:\s*(\d+)/i
    )?.[1] || 0;

  const technical =
    feedback.match(
      /TECHNICAL:\s*(\d+)/i
    )?.[1] || 0;

  const problemSolving =
    feedback.match(
      /PROBLEM_SOLVING:\s*(\d+)/i
    )?.[1] || 0;

  const confidence =
    feedback.match(
      /CONFIDENCE:\s*(\d+)/i
    )?.[1] || 0;

    let improvementPlan = [];

if (communication < 70) {
  improvementPlan.push(
    "Practice HR and communication questions daily."
  );
}

if (technical < 70) {
  improvementPlan.push(
    "Focus more on technical concepts and coding problems."
  );
}

if (problemSolving < 70) {
  improvementPlan.push(
    "Solve more DSA and problem-solving questions."
  );
}

if (confidence < 70) {
  improvementPlan.push(
    "Practice mock interviews and speaking confidently."
  );
}

if (improvementPlan.length === 0) {
  improvementPlan.push(
    "Excellent performance! Continue practicing advanced questions."
  );
}

const recommendation =
  score < 60
    ? "Needs Significant Improvement"
    : score < 80
    ? "Good Candidate - More Practice Recommended"
    : score < 90
    ? "Interview Ready"
    : "Outstanding Candidate";

  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem("user"));
  } catch {
    currentUser = null;
  }

  const downloadPDF = () => {

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text(
      "AI Interview Report",
      20,
      20
    );

    doc.setFontSize(14);
    doc.text(
      `Score: ${score}/100`,
      20,
      40
    );

    let y = 60;

    doc.text(
      "Your Answers:",
      20,
      y
    );

    y += 10;

    answers.forEach(
      (answer, index) => {

        const lines =
          doc.splitTextToSize(
            `${index + 1}. ${questions[index] ? "Q: " + questions[index] + "\nA: " : ""}${answer}`,
            170
          );

        if (y + lines.length * 7 > 280) {
          doc.addPage();
          y = 20;
        }

        doc.text(
          lines,
          20,
          y
        );

        y +=
          lines.length * 7 + 5;
      }
    );

    y += 10;

    doc.text(
      "Feedback:",
      20,
      y
    );

    y += 10;

    const feedbackLines =
      doc.splitTextToSize(
        feedback,
        170
      );

    feedbackLines.forEach((line) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 20, y);
      y += 7;
    });

    doc.save(
      "Interview_Report.pdf"
    );

  };
const generateCertificate = () => {

  const candidateName = currentUser?.name || "Interview Candidate";

  const doc = new jsPDF(
    "landscape"
  );

  const date =
    new Date().toLocaleDateString();

  let achievement =
    "Successfully Completed";

  if (score >= 90) {

    achievement =
      "Outstanding Performance";

  } else if (
    score >= 75
  ) {

    achievement =
      "Excellent Performance";
  }

  doc.setFontSize(28);

  doc.text(
    "CERTIFICATE OF COMPLETION",
    65,
    40
  );

  doc.setFontSize(16);

  doc.text(
    "This certifies that",
    120,
    65
  );

  doc.setFontSize(24);

  doc.text(
    candidateName,
    148,
    90,
    { align: "center" }
  );

  doc.setFontSize(16);

  doc.text(
    "has successfully completed",
    105,
    115
  );

  doc.setFontSize(20);

  doc.text(
    "AI Mock Interview",
    105,
    140
  );

  doc.setFontSize(16);

  doc.text(
    `Score: ${score}/100`,
    120,
    165
  );

  doc.text(
    achievement,
    105,
    185
  );

  doc.text(
    `Date: ${date}`,
    115,
    205
  );

  doc.save(
    "Interview_Certificate.pdf"
  );
};
const savedRef = useRef(false);
useEffect(() => {

  if (savedRef.current || !feedback) return;

  savedRef.current = true;

  const saveInterview =
    async () => {

      try {

        const user =
          JSON.parse(
            localStorage.getItem("user")
          );

        if (!user) return;

        await api.post(
          "/save-interview",
          {
            user_id: user.id,
            date:
              new Date().toLocaleString(),
            score: score,
            feedback: feedback
          }
        );

      } catch {

        toast.error("Could not save this interview to your history.");

      }
    };

  saveInterview();

}, [feedback, score]);
  return (
    <div className="container fade-in">
      <h1>
        Interview Report
      </h1>

      <div className="report-score">
        <CircularProgressbar
          value={score}
          text={`${score}/100`}
          styles={buildStyles({
            textSize: "12px",
            pathColor:
              "#34d399",
            textColor:
              "var(--text-primary)",
            trailColor:
              "rgba(138,149,141,0.25)",
          })}
        />
      </div>
          <div
  style={{
    textAlign: "center",
    marginBottom: "30px"
  }}
>

<h2>

{

score >= 90 ?

"🏆 Outstanding Performance"

:

score >= 80 ?

"⭐ Interview Ready"

:

score >= 70 ?

"👍 Good Performance"

:

score >= 60 ?

"🙂 Needs More Practice"

:

"📚 Keep Practicing"

}

</h2>

</div>
      <div
  style={{
    display: "flex",
    justifyContent: "center",
    gap: "15px",
    marginTop: "20px"
  }}
>
  <button
    className="submit-btn"
    onClick={downloadPDF}
  >
    Download PDF
  </button>

  <button
    className="submit-btn"
    onClick={() =>
      navigate("/dashboard")
    }
  >
    Dashboard 📊
  </button>

  <button
  className="submit-btn"
  onClick={
    generateCertificate
  }
>
  Certificate 🏆
</button>
</div>
      <div className="skills-section">

        <h2>
          Skill Analysis
        </h2>

        <div className="skill">
          <span>
            Communication
            ({communication}%)
          </span>

          <progress
            value={communication}
            max="100"
          />
        </div>

        <div className="skill">
          <span>
            Technical Skills
            ({technical}%)
          </span>

          <progress
            value={technical}
            max="100"
          />
        </div>

        <div className="skill">
          <span>
            Problem Solving
            ({problemSolving}%)
          </span>

          <progress
            value={problemSolving}
            max="100"
          />
        </div>

        <div className="skill">
          <span>
            Confidence
            ({confidence}%)
          </span>

          <progress
            value={confidence}
            max="100"
          />
        </div>

      </div>
      <div className="skills-section">

  <h2>
    🎯 Personalized Improvement Plan
  </h2>

  {improvementPlan.map(
    (item, index) => (
      <div
        key={index}
        className="question-box"
      >
        <p>{item}</p>
      </div>
    )
  )}

</div>

<div className="question-box">

  <h2>
    Final Recommendation
  </h2>

  <h3>
    {recommendation}
  </h3>

</div>
      {strengths.length + weaknesses.length + suggestions.length > 0 ? (
        <div className="feedback-grid">
          {[
            ["Strengths", "good", "✅", strengths],
            ["Weaknesses", "bad", "⚠️", weaknesses],
            ["Suggestions", "tip", "💡", suggestions],
          ].map(([title, tone, icon, items]) => (
            <div key={title} className={`question-box feedback-card ${tone}`}>
              <h3>
                {icon} {title}
              </h3>
              <ul>
                {items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="question-box">
          <pre>{feedback}</pre>
        </div>
      )}

      <h2
        style={{
          marginTop: "30px",
        }}
      >
        Your Answers
      </h2>

      {
        answers.map(
          (
            answer,
            index
          ) => (
            <div
              key={index}
              className="question-box"
            >
              <p>
                {answer}
              </p>
            </div>
          )
        )
      }

    </div>

  );
}

export default Report;