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
    <div className="container fade-in">

      <div className="question-box">

        <h1>Create Account</h1>

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

        <p style={{marginTop:"20px"}}>

          Already have account?

          <Link to="/login">
            Login
          </Link>

        </p>

      </div>

    </div>
  );
}

export default Register;