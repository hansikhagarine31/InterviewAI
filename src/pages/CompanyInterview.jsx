import { useState } from "react";
import api from "../api/client";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
function CompanyInterview() {

  const navigate = useNavigate();

  const [company, setCompany] =
    useState("");

  const [insights, setInsights] =
    useState("");

  const [loadingInsights,
    setLoadingInsights] =
    useState(false);

  const [role, setRole] =
    useState("Software Engineer");

  const [interviewType,
    setInterviewType] =
    useState("DSA");

  const [difficulty,
    setDifficulty] =
    useState("Beginner");

  const [questionCount,
    setQuestionCount] =
    useState(5);

  const companies = [
    "Google",
    "Amazon",
    "Microsoft",
    "Meta",
    "Apple",
    "Netflix",
    "OpenAI",
    "Nvidia",
    "Adobe",
    "Oracle",
    "TCS",
    "Infosys",
    "Wipro",
    "Accenture",
    "Capgemini",
  "Goldman Sachs",
  "JPMorgan Chase",
  "Morgan Stanley",
  "Deloitte",
  "Cognizant",
  "HCL",
  "Tech Mahindra",
  "Zoho",
  "Salesforce",
  "Uber",
  "Airbnb",
  "PayPal",
  "Visa",
  "Mastercard",
  "Flipkart",
  "Swiggy",
  "Zomato",
  "PhonePe",
  "Razorpay"
  ];

  const getInsights = async () => {

    if (!company.trim()) {
      toast.error("Please select a company");
      return;
    }

    try {

      setLoadingInsights(true);

      const response =
        await api.post(
          "/company-insights",
          {
            company
          }
        );

      const data = response.data.insights;

setInsights(`
Interview Rounds:
${data.rounds.map(r => `• ${r}`).join("\n")}

Focus Areas:
${data.focus.map(f => `• ${f}`).join("\n")}

Tip:
• ${data.tip}
`);

    } catch (error) {

      console.log(error);

      toast.error("Failed to fetch company insights");

    } finally {

      setLoadingInsights(false);

    }
  };

  const startInterview = async () => {

    if (!company.trim()) {

      toast.error("Please select a company");

      return;
    }

    try {

      const response =
        await api.post(
          "/generate-questions",
          {
            interviewMode:
              "Company Specific",

            company,

            role,

            interviewType,

            difficulty,

            questionCount
          }
        );

      navigate("/interview", {
        state: {

          company,

          role,

          interviewType,

          difficulty,

          questionCount,

          generatedQuestions:
            response.data.questions
        }
      });

    } catch (error) {

      console.log(error);

      toast.error("Failed to generate questions");
    }
  };
  const filteredCompanies =
  companies.filter((c) =>
    c.toLowerCase().includes(
      company.toLowerCase()
    )
  );
  return (

    <div className="container fade-in">

      <h1>
        Company Specific Interview
      </h1>

      <div className="question-box">

        <h3>
          Search Company
        </h3>

        <input
          type="text"
          placeholder="Search Company..."
          value={company}
          onChange={(e) =>
            setCompany(
              e.target.value
            )
          }
        />

        <div
          className="companies-container"
        >

          {
  company.trim() !== "" && (

    <div className="companies-container">

      {filteredCompanies.map((c) => (

        <button
          key={c}
          className="company-chip"
          onClick={() => setCompany(c)}
        >
          {c}
        </button>

      ))}

    </div>

  )
}
  <h3
  style={{
    marginTop: "10px"
  }}
>
  Popular Companies
</h3>

<div className="companies-container">

  {
    companies.map((c) => (

      <button
        key={c}
        className="company-chip"
        onClick={() =>
          setCompany(c)
        }
      >
        {c}
      </button>

    ))
  }

</div>

        </div>

        <button
          className="submit-btn"
          onClick={getInsights}
        >
          Get Insights
        </button>

        {
          loadingInsights && (

            <div
              className="question-box"
            >
              Loading Insights...
            </div>

          )
        }

        {
          insights && (

            <div
              className="question-box"
            >

              <h3>
                🏢 Company Insights
              </h3>

              <div
                style={{
                  whiteSpace:
                    "pre-wrap",
                  lineHeight: "1.8",
                  marginTop: "10px"
                }}
              >
                {insights}
              </div>

            </div>

          )
        }

        <h3 style={{ marginTop: "15px" }}>
          Target Role
        </h3>

        <select
          value={role}
          onChange={(e) =>
            setRole(
              e.target.value
            )
          }
        >

          <option>
            Software Engineer
          </option>

          <option>
            Frontend Developer
          </option>

          <option>
            Backend Developer
          </option>

          <option>
            Full Stack Developer
          </option>

          <option>
            Data Scientist
          </option>

          <option>
            ML Engineer
          </option>

        </select>

        <h3 style={{ marginTop: "15px" }}>
          Interview Focus
        </h3>

        <select
          value={interviewType}
          onChange={(e) =>
            setInterviewType(
              e.target.value
            )
          }
        >

          <option>
            DSA
          </option>

          <option>
            Java
          </option>

          <option>
            Python
          </option>

          <option>
            HR
          </option>

          <option>
            System Design
          </option>

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
          Number of Questions
        </h3>

        <select
          value={questionCount}
          onChange={(e) =>
            setQuestionCount(
              Number(
                e.target.value
              )
            )
          }
        >

          <option value="5">
            5
          </option>

          <option value="10">
            10
          </option>

          <option value="15">
            15
          </option>

          <option value="20">
            20
          </option>

        </select>

        <button
          className="submit-btn"
          onClick={startInterview}
          style={{
            marginTop: "25px"
          }}
        >
          Start Interview
        </button>

      </div>

    </div>
  );
}

export default CompanyInterview;