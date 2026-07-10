import { useState, useEffect } from "react";
import api from "../api/client";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
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
    <div className="container fade-in">

      <div className="question-box">

        <h1>Login</h1>

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
    <div
  style={{
    marginTop: "20px",
    display: "flex",
    justifyContent: "center"
  }}
>

  <GoogleLogin

    onSuccess={async (credentialResponse) => {

  const googleUser =
    jwtDecode(
      credentialResponse.credential
    );

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
          <p
  style={{
    marginTop: "15px",
    textAlign: "center"
  }}
>
  <Link to="/forgot-password">
    Forgot Password?
  </Link>
</p>
        <p style={{marginTop:"20px"}}>

          New User?

          <Link to="/register">
            Register
          </Link>

        </p>

      </div>

    </div>
  );
}

export default Login;