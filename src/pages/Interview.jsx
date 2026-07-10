import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import api from "../api/client";
import Webcam from "react-webcam";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
function Interview() {
  const location = useLocation();
  const navigate = useNavigate();

  const interviewType =
    location.state?.interviewType || "HR Interview";
  const difficulty =
  location.state?.difficulty ||
  "Beginner";
  const questionCount =
  location.state?.questionCount ||
  5;
  const [currentQuestion, setCurrentQuestion] =
    useState(0);
  const interviewQuestions =
    location.state?.generatedQuestions ||
    [];
    const progress =
  interviewQuestions.length > 0
    ? ((currentQuestion + 1) /
        interviewQuestions.length) *
      100
    : 0;

  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState([]);

  const [loading, setLoading] =
    useState(false);

  const [isListening, setIsListening] =
    useState(false);

  const [recognition, setRecognition] =
    useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [loadingStep, setLoadingStep] =
  useState(0);
    const [timeLeft, setTimeLeft] = useState(questionCount * 60);
    const webcamRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Speech Recognition is not supported in this browser.");
        
      return;
    }

    const recog = new SpeechRecognition();

    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = "en-US";

    recog.onstart = () => {
      setIsListening(true);
    };

    recog.onresult = (event) => {
      let finalTranscript = "";

      for (
        let i = 0;
        i < event.results.length;
        i++
      ) {
        finalTranscript +=
          event.results[i][0].transcript + " ";
      }

      console.log(
        "Transcript:",
        finalTranscript
      );

      setAnswer(finalTranscript);
    };

    recog.onerror = (event) => {
      console.log(
        "Speech Error:",
        event.error
      );

      toast.error("Speech Error: " + event.error);
      setIsListening(false);
    };

    recog.onend = () => {
      setIsListening(false);
    };

    setRecognition(recog);
  }, []);
  useEffect(() => {

  const timer = setInterval(() => {

    setTimeLeft((prev) => {

      if (prev <= 1) {

        clearInterval(timer);

        toast.error("Interview Time Completed!");

        nextQuestion(true);

        return 0;
      }

      return prev - 1;
    });

  }, 1000);

  return () => clearInterval(timer);

}, []);
  const toggleListening = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      setAnswer("");
      recognition.start();
    }
  };

  const nextQuestion = async (autoSkip=false) => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }

    if (!answer.trim() && !autoSkip) {
      toast.error("Please type or record an answer.");
      return;
    }

    const updatedAnswers = [
      ...answers,
      answer.trim()
        ?answer
        :"No answer provided"
    ];

    setAnswers(updatedAnswers);

    if (
      currentQuestion <
      interviewQuestions.length - 1
    ) {
      setCurrentQuestion(
        currentQuestion + 1
      );

      setAnswer("");
      
      return;
    }

    try {
      setEvaluating(true);
        const imageSrc =
      webcamRef.current?.getScreenshot();

      const response =
        await api.post(
          "/evaluate",
          {
            answers: updatedAnswers,
            image: imageSrc,
          }
        );
        const scoreMatch =
  response.data.feedback.match(
    /(\d+)\/100/i
  );

const score =
  scoreMatch
    ? scoreMatch[1]
    : 0;
        const reportData = {
  date: new Date().toLocaleString(),
  score,
  feedback: response.data.feedback,
  answers: updatedAnswers,
};

const history =
  JSON.parse(
    localStorage.getItem("interviewHistory")
  ) || [];

history.unshift(reportData);

localStorage.setItem(
  "interviewHistory",
  JSON.stringify(history)
);
      navigate("/report", {
        state: {
          answers: updatedAnswers,
          feedback:
            response.data.feedback,
        },
      });
    } catch (error) {
      console.log(error);

      toast.error(
        JSON.stringify(
          error.response?.data ||
            error.message
        )
      );
    } finally {
      setLoading(false);
    }
  };
const loadingMessages = [

  "Understanding your answers...",

  "Evaluating communication...",

  "Evaluating technical knowledge...",

  "Measuring confidence...",

  "Generating personalized feedback...",

  "Preparing your report..."

];
useEffect(() => {

  if (!evaluating) return;

  setLoadingStep(0);

  const interval = setInterval(() => {

    setLoadingStep(prev => {

      if (
        prev < loadingMessages.length - 1
      ) {

        return prev + 1;

      }

      return prev;

    });

  }, 900);

  return () => clearInterval(interval);

}, [evaluating]);

  if (!location.state) {
    return (
      <div className="container fade-in">
        <h1>No Interview Data Found</h1>
      </div>
    );
  }

  return (
    <div className="container fade-in">
      <h1>{interviewType}</h1>
      <h3>
  Difficulty: {difficulty}
</h3>
<h3>
  Questions: {questionCount}
</h3>
      <h3>
        Question {currentQuestion + 1} of{" "}
{Math.max(interviewQuestions.length, 1)}
      </h3>
      <div className="progress-container">

  <div
    className="progress-bar"
    style={{
      width: `${progress}%`
    }}
  ></div>

</div>

<p className="progress-text">
  {Math.round(progress)}% Completed
</p>
        <div className="timer-box">
  ⏳ Time Left:
  {" "}
  {Math.floor(timeLeft / 60)}
  :
  {(timeLeft % 60)
    .toString()
    .padStart(2, "0")}
</div>
        <Webcam
  ref={webcamRef}
  screenshotFormat="image/jpeg"
  width={250}
  height={180}
  mirrored={true}
/>
      <div className="question-box">
        <h2>
  {interviewQuestions?.[currentQuestion] ||
    "Loading..."}
</h2>
      </div>

      <textarea
        rows="8"
        value={answer}
        onChange={(e) =>
          setAnswer(e.target.value)
        }
        placeholder="Type your answer..."
      />

      <div
        style={{
          display: "flex",
          gap: "15px",
          marginTop: "15px",
        }}
      >
        <button
          className="submit-btn"
          onClick={toggleListening}
        >
          {isListening
            ? "🛑 Stop Recording"
            : "🎤 Start Recording"}
        </button>

        <button
          className="submit-btn"
          onClick={nextQuestion}
          disabled={loading}
        >
          {loading
            ? "Evaluating..."
            : currentQuestion ===
              interviewQuestions.length -
                1
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
        {isListening &&
          "🎙️ Recording... Speak now"}
      </div>
    {evaluating && (

<div className="loading-overlay">

    <motion.div
  className="loading-card"
  initial={{
    opacity: 0,
    scale: 0.8,
    y: 30
  }}
  animate={{
    opacity: 1,
    scale: 1,
    y: 0
  }}
  transition={{
    duration: 0.4
  }}
>

        <div className="big-spinner"></div>

        <h2>
            🤖 AI is analyzing your interview...
        </h2>

        <div
  style={{
    marginTop: "25px",
    textAlign: "left"
  }}
>

  {loadingMessages.map((message, index) => (

    <p
      key={index}
      style={{
        marginBottom: "12px",
        fontWeight: "500"
      }}
    >

      {
        index < loadingStep
          ? "✅"
          : index === loadingStep
          ? "🟢"
          : "⚪"
      }{" "}

      {message}

    </p>

  ))}

</div>

        <p
            style={{
                opacity: .8,
                marginTop: "20px"
            }}
        >
            This usually takes
            5–10 seconds.
        </p>

    </motion.div>

</div>

)}
    </div>
  );
}

export default Interview;