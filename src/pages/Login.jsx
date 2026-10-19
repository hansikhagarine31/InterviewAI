import { useState, useEffect } from "react";
import api from "../api/client";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";
function Login() {

  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");
  const [loading, setLoading] = useState(false);
    useEffect(() => {

  if (
    localStorage.getItem("token")
  ) {
    navigate("/");
  }

}, [navigate]);
  const loginUser = async () => {

    if (!email.trim() || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);

    try {

      const response =
        await api.post(
          "/login",
          {
            email,
            password
          }
        );

      localStorage.setItem(
        "token",
        response.data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(
          response.data.user
        )
      );

      navigate("/");

    } catch (err) {

      toast.error(
        err.response?.data?.error ||
        "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container fade-in auth-page">

      <div className="question-box auth-card">

        <div className="auth-brand">
          <span className="logo-mark">AI</span>
          InterviewAI
        </div>

        <h1>Welcome back</h1>
        <p className="auth-sub">Sign in to continue practicing.</p>

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
          onClick={loginUser}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner" />
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </button>
    <div className="auth-divider">or</div>
    <div
  style={{
    display: "flex",
    justifyContent: "center"
  }}
>

  <GoogleLogin

    onSuccess={async (credentialResponse) => {

  try {

    const res =
      await api.post(
        "/google-login",
        {
          credential:
        credentialResponse.credential
        }
      );

      localStorage.setItem(
        "token",
        res.data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(res.data.user)
      );

      window.location.href = "/";

  } catch (err) {

      console.log(err);

      toast.error("Google Login Failed");

  }

}}

  />

</div>
        <div className="auth-links">
          <Link to="/forgot-password">Forgot password?</Link>
          <span>
            New here?
            <Link to="/register">Create account</Link>
          </span>
        </div>

      </div>

    </div>
  );
}

export default Login;