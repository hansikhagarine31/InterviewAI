import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import api from "../api/client";
import { jsPDF } from "jspdf";
import {
  CircularProgressbar,
  buildStyles,
} from "react-circular-progressbar";

import "react-circular-progressbar/dist/styles.css";

function Report() {

  const location = useLocation();
  const navigate = useNavigate();
  const feedback =
    location.state?.feedback || "";

  const answers =
    location.state?.answers || [];

  const scoreMatch =
    feedback.match(/(\d+)\/100/i);

  const score =
    scoreMatch
      ? Number(scoreMatch[1])
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

let recommendation = "Ready for Interviews 🚀";

if (score < 60)
  recommendation =
    "Needs Significant Improvement";

else if (score < 80)
  recommendation =
    "Good Candidate - More Practice Recommended";

else if (score < 90)
  recommendation =
    "Interview Ready";

else
  recommendation =
    "Outstanding Candidate";

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
            `${index + 1}. ${answer}`,
            170
          );

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

    doc.text(
      feedbackLines,
      20,
      y
    );

    doc.save(
      "Interview_Report.pdf"
    );

  };
const generateCertificate = () => {

  const doc = new jsPDF(
    "landscape"
  );

  const date =
    new Date().toLocaleDateString();

  let achievement =
    "Successfully Completed";

  if (score >= 90) {

    achievement =
      "Outstanding Performance 🏅";

  } else if (
    score >= 75
  ) {

    achievement =
      "Excellent Performance ⭐";
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
    "Interview Candidate",
    105,
    90
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

  if (savedRef.current) return;

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

        console.log(
          "Interview Saved"
        );

      } catch (err) {

        console.log(err);

      }
    };

  saveInterview();

}, []);
  return (
    <div className="container fade-in">
      <h1>
        Interview Report
      </h1>

      <div
        style={{
          width: "220px",
          margin: "30px auto",
        }}
      >
        <CircularProgressbar
          value={score}
          text={`${score}/100`}
          styles={buildStyles({
            textSize: "12px",
            pathColor:
              "#00d4ff",
            textColor:
              "#ffffff",
            trailColor:
              "#16213e",
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
      <div className="question-box">

        <pre
          style={{
            whiteSpace:
              "pre-wrap",
          }}
        >
          {feedback}
        </pre>

      </div>

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