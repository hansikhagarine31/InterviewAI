import { useState } from "react";
import api from "../api/client";
import { useNavigate } from "react-router-dom";

function GeneralInterview() {

  const navigate = useNavigate();

  const [interviewType,
    setInterviewType] =
    useState("Java Interview");

  const [difficulty,
    setDifficulty] =
    useState("Beginner");

  const [questionCount,
    setQuestionCount] =
    useState(5);

  const startInterview = async () => {
    if (
  interviewType ===
  "Resume Based Interview"
) {
  navigate("/resume");
  return;
}
    const response =
      await api.post(
        "/generate-questions",
        {
          interviewType,
          difficulty,
          questionCount,
          interviewMode:
            "General"
        }
      );

    navigate("/interview", {
      state: {
        interviewType,
        difficulty,
        questionCount,
        generatedQuestions:
          response.data.questions
      }
    });
  };

  return (
    <div className="container fade-in">

      <h1>General Interview</h1>

      <div className="question-box">

        <h3>Interview Type</h3>

        <select
          value={interviewType}
          onChange={(e) =>
            setInterviewType(
              e.target.value
            )
          }
        >
          <option>
            Java Interview
          </option>

          <option>
            Python Interview
          </option>

          <option>
            DSA Interview
          </option>

          <option>
            HR Interview
          </option>
        <option>Resume Based Interview</option>
        </select>

        <h3 style={{ marginTop: "15px" }}>
          Difficulty
        </h3>

        <select
          value={difficulty}
          onChange={(e) =>
            setDifficulty(
              e.target.value
            )
          }
        >
          <option>
            Beginner
          </option>

          <option>
            Intermediate
          </option>

          <option>
            Advanced
          </option>

        </select>

        <h3 style={{ marginTop: "15px" }}>
          Questions
        </h3>

        <select
          value={questionCount}
          onChange={(e) =>
            setQuestionCount(
              Number(e.target.value)
            )
          }
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="15">15</option>
          <option value="20">20</option>
        </select>

        <button
          className="submit-btn"
          onClick={startInterview}
          style={{ marginTop: "15px" }}
        >
          Start Interview
        </button>

      </div>

    </div>
  );
}

export default GeneralInterview;