import { useState } from "react";
import api from "../api/client";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
function ResumeUpload() {

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleUpload = async () => {

    if (!file) {
      toast.error("Please select a resume");
      return;
    }

    const formData = new FormData();

    formData.append("resume", file);

    setLoading(true);

    try {
      const response = await api.post(
        "/upload-resume",
        formData
      );

      navigate("/interview", {
        state: {
          interviewType: "Resume Interview",
          generatedQuestions:
            response.data.questions
        }
      });
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
        "Failed to process resume"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container fade-in">

      <h1>Upload Resume</h1>

      <input
        type="file"
        accept=".pdf"
        onChange={(e) =>
          setFile(e.target.files[0] || null)
        }
      />

      <br /><br />

      <button
        className="submit-btn"
        onClick={handleUpload}
        disabled={loading}
      >
        {loading ? "Analyzing resume..." : "Generate Interview"}
      </button>

    </div>
  );
}

export default ResumeUpload;