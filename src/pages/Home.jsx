import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/client";

function Home() {

  const navigate = useNavigate();

  const user =
    JSON.parse(
      localStorage.getItem("user")
    );

  const [stats, setStats] =
    useState({
      total: 0,
      best: 0,
      average: 0
    });

  const tips = [

    "Use the STAR method for behavioural questions.",

    "Explain your approach before writing code.",

    "Maintain eye contact and speak confidently.",

    "Practice coding on a whiteboard occasionally.",

    "Think aloud while solving DSA problems.",

    "Keep your answers concise and structured."

  ];

  const [tip] = useState(

    tips[
      Math.floor(
        Math.random() * tips.length
      )
    ]

  );

  useEffect(() => {

    const fetchStats =
      async () => {

        try {

          const res =
            await api.get(
              `/profile/${user.id}`
            );

          setStats(res.data);

        } catch (err) {

          console.log(err);

        }

      };

    fetchStats();

  }, []);

  return (

    <div className="container fade-in">

      {/* Hero */}

      <div className="hero-banner">

        <h1>
          👋 Welcome back,
          {" "}
          {user.name}
        </h1>

        <p className="hero-subtitle">

          Ready to ace your next interview?

          Practice with AI-powered mock interviews
          and receive instant personalized feedback.

        </p>

        <button
          className="submit-btn"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          📊 View Dashboard
        </button>

      </div>

      {/* Stats */}

      <div className="stats-container">

        <div className="stat-card">

          <h2>
            {stats.total}
          </h2>

          <p>
            Interviews
          </p>

        </div>

        <div className="stat-card">

          <h2>
            {stats.best}
          </h2>

          <p>
            Best Score
          </p>

        </div>

        <div className="stat-card">

          <h2>
            {stats.average}
          </h2>

          <p>
            Average Score
          </p>

        </div>

      </div>

      {/* Daily Tip */}

      <div
        className="question-box"
        style={{
          marginBottom: "30px",
          textAlign: "center"
        }}
      >

        <h2>
          💡 Interview Tip of the Day
        </h2>

        <p
          style={{
            fontSize: "18px",
            marginTop: "15px"
          }}
        >
          {tip}
        </p>

      </div>

      {/* Interview Modes */}

      <div className="mode-container">

        <div className="mode-card">

          <h2>
            🤖 General Interview
          </h2>

          <p>

            Practice HR, Java,
            Python and DSA
            interviews with AI.

          </p>

          <button
            className="submit-btn"
            onClick={() =>
              navigate("/general")
            }
          >
            Start Practice →
          </button>

        </div>

        <div className="mode-card">

          <h2>
            🏢 Company Specific
          </h2>

          <p>

            Prepare for Google,
            Amazon, Microsoft,
            OpenAI and more.

          </p>

          <button
            className="submit-btn"
            onClick={() =>
              navigate("/company")
            }
          >
            Start Practice →
          </button>

        </div>

        <div
          className="mode-card"
          style={{
            border:
              "2px solid #3b82f6"
          }}
        >

          <h2>

            ⭐ Resume Based Interview

          </h2>

          <p>

            Upload your resume
            and receive AI-generated
            personalized interview questions.

          </p>

          <button
            className="submit-btn"
            onClick={() =>
              navigate("/resume")
            }
          >
            Start Practice →
          </button>

        </div>

      </div>

    </div>

  );

}

export default Home;