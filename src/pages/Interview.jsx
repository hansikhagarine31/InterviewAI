import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import api from "../api/client";
import Webcam from "react-webcam";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const loadingMessages = [
  "Understanding your answers...",
  "Evaluating communication...",
  "Evaluating technical knowledge...",
  "Measuring confidence...",
  "Generating personalized feedback...",
  "Preparing your report...",
];

const NO_ANSWER = "No answer provided";

function Interview() {
  const location = useLocation();
  const navigate = useNavigate();

  const interviewType =
    location.state?.interviewType || "HR Interview";
  const difficulty =
    location.state?.difficulty || "Beginner";
  const interviewQuestions =
    location.state?.generatedQuestions || [];
  const questionCount = interviewQuestions.length;

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(questionCount * 60);

  const webcamRef = useRef(null);
  const recognitionRef = useRef(null);
  // Always points at the latest state so the timer callback never reads stale values.
  const latest = useRef({});
  useEffect(() => {
    latest.current = { answer, answers, currentQuestion, evaluating };
  });

  const progress =
    questionCount > 0
      ? ((currentQuestion + 1) / questionCount) * 100
      : 0;

  useEffect(() => {
    if (!SpeechRecognition) {
      toast.error("Speech Recognition is not supported in this browser.");
      return;
    }

    const recog = new SpeechRecognition();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = "en-US";

    recog.onstart = () => setIsListening(true);

    recog.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript + " ";
      }
      setAnswer(transcript);
    };

    recog.onerror = (event) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        toast.error("Speech Error: " + event.error);
      }
      setIsListening(false);
    };

    recog.onend = () => setIsListening(false);

    recognitionRef.current = recog;

    return () => {
      recog.onend = null;
      recog.abort();
    };
  }, []);

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const toggleListening = () => {
    const recog = recognitionRef.current;
    if (!recog) {
      toast.error("Speech Recognition is not available.");
      return;
    }

    if (isListening) {
      recog.stop();
    } else {
      setAnswer("");
      recog.start();
    }
  };

  const evaluate = async (finalAnswers) => {
    setEvaluating(true);

    try {
      const image = webcamRef.current?.getScreenshot();

      const response = await api.post("/evaluate", {
        answers: finalAnswers,
        image,
      });

      navigate("/report", {
        replace: true,
        state: {
          answers: finalAnswers,
          questions: interviewQuestions,
          feedback: response.data.feedback,
        },
      });
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
          error.message ||
          "Evaluation failed. Please try again."
      );
      setEvaluating(false);
    }
  };

  // `autoSkip` is used when time runs out: whatever is left is submitted as-is.
  const nextQuestion = (autoSkip = false) => {
    const state = latest.current;
    if (state.evaluating) return;

    if (!autoSkip && !state.answer.trim()) {
      toast.error("Please type or record an answer.");
      return;
    }

    stopListening();

    const updatedAnswers = [
      ...state.answers,
      state.answer.trim() || NO_ANSWER,
    ];

    if (autoSkip) {
      while (updatedAnswers.length < questionCount) {
        updatedAnswers.push(NO_ANSWER);
      }
    }

    if (updatedAnswers.length < questionCount) {
      setAnswers(updatedAnswers);
      setCurrentQuestion(state.currentQuestion + 1);
      setAnswer("");
      return;
    }

    setAnswers(updatedAnswers);
    evaluate(updatedAnswers);
  };

  const timeUp = questionCount > 0 && timeLeft <= 0;

  useEffect(() => {
    if (questionCount === 0 || evaluating) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [questionCount, evaluating]);

  useEffect(() => {
    if (!timeUp) return;
    toast.error("Interview Time Completed!");
    nextQuestion(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeUp]);

  useEffect(() => {
    if (!evaluating) return;

    const interval = setInterval(() => {
      setLoadingStep((prev) => Math.min(prev + 1, loadingMessages.length - 1));
    }, 900);

    return () => {
      clearInterval(interval);
      setLoadingStep(0);
    };
  }, [evaluating]);

  if (!location.state || questionCount === 0) {
    return (
      <div className="container fade-in">
        <h1>No Interview Data Found</h1>
        <button className="submit-btn" onClick={() => navigate("/")}>
          Back to Home
        </button>
      </div>
    );
  }

  const isLast = currentQuestion === questionCount - 1;

  return (
    <div className="container fade-in">
      <h1>{interviewType}</h1>
      <h3>Difficulty: {difficulty}</h3>
      <h3>Questions: {questionCount}</h3>
      <h3>
        Question {currentQuestion + 1} of {questionCount}
      </h3>
      <div className="progress-container">
        <div
          className="progress-bar"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <p className="progress-text">{Math.round(progress)}% Completed</p>
      <div className="timer-box">
        ⏳ Time Left: {Math.floor(timeLeft / 60)}:
        {(timeLeft % 60).toString().padStart(2, "0")}
      </div>
      <Webcam
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={250}
        height={180}
        mirrored={true}
      />
      <div className="question-box">
        <h2>{interviewQuestions[currentQuestion]}</h2>
      </div>

      <textarea
        rows="8"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your answer..."
      />

      <div
        style={{
          display: "flex",
          gap: "15px",
          marginTop: "15px",
        }}
      >
        <button className="submit-btn" onClick={toggleListening}>
          {isListening ? "🛑 Stop Recording" : "🎤 Start Recording"}
        </button>

        <button
          className="submit-btn"
          onClick={() => nextQuestion()}
          disabled={evaluating}
        >
          {evaluating
            ? "Evaluating..."
            : isLast
            ? "Finish Interview"
            : "Next Question"}
        </button>
      </div>

      <div
        style={{
          marginTop: "20px",
          color: "#00ff88",
          fontWeight: "bold",
        }}
      >
        {isListening && "🎙️ Recording... Speak now"}
      </div>
      {evaluating && (
        <div className="loading-overlay">
          <motion.div
            className="loading-card"
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="big-spinner"></div>

            <h2>🤖 AI is analyzing your interview...</h2>

            <div style={{ marginTop: "25px", textAlign: "left" }}>
              {loadingMessages.map((message, index) => (
                <p
                  key={index}
                  style={{ marginBottom: "12px", fontWeight: "500" }}
                >
                  {index < loadingStep
                    ? "✅"
                    : index === loadingStep
                    ? "🟢"
                    : "⚪"}{" "}
                  {message}
                </p>
              ))}
            </div>

            <p style={{ opacity: 0.8, marginTop: "20px" }}>
              This usually takes 5–10 seconds.
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default Interview;
