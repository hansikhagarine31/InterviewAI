import { useState } from "react";
import api from "../api/client";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
function Register() {

  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const registerUser = async () => {

    setLoading(true);
    try {

      await api.post(
        "/register",
        {
          name,
          email,
          password
        }
      );

      toast.success("Account created successfully");

      navigate("/login");

    } catch (err) {

      toast.error(
        err.response?.data?.error ||
        "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container fade-in auth-page">

      <div className="question-box auth-card">

        <div className="auth-brand">🤖 InterviewAI</div>

        <h1>Create account</h1>
        <p className="auth-sub">
          Min. 8 characters with upper, lower case and a number.
        </p>

        <input
          placeholder="Name"
          value={name}
          onChange={(e)=>
            setName(e.target.value)
          }
        />

        <input
          placeholder="Email"
          value={email}
          onChange={(e)=>
            setEmail(e.target.value)
          }
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e)=>
            setPassword(e.target.value)
          }
        />

        <button
          className="submit-btn"
          onClick={registerUser}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner" />
              Registering...
            </>
          ) : (
            "Register"
          )}
        </button>

        <div className="auth-links">
          <span>
            Already have an account?
            <Link to="/login">Log in</Link>
          </span>
        </div>

      </div>

    </div>
  );
}

export default Register;