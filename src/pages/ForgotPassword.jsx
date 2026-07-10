import { useState } from "react";
import api from "../api/client";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
function ForgotPassword() {
    const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [step, setStep] = useState(1);

  const sendOtp = async () => {

  try {

    await api.post(
      "/send-otp",
      {
        email
      }
    );

    toast.success("OTP generated. Check backend terminal.");
      

    setStep(2);

  } catch (err) {

    toast.error(
      err.response?.data?.error ||
      "Unable to send OTP."
    );

  }

};

const resetPassword = async () => {

  if (
    newPassword !== confirmPassword
  ) {

    toast.error("Passwords do not match.");

    return;

  }

  try {

    await api.post(
      "/reset-password",
      {

        email,

        otp,

        new_password: newPassword

      }
    );

setEmail("");
setOtp("");
setNewPassword("");
setConfirmPassword("");

setStep(1);
toast.success("Password changed successfully!");
navigate("/login");
  } catch (err) {

    toast.error(

      err.response?.data?.error ||

      "Unable to reset password."

    );

  }

};
  return (

    <div className="container fade-in">

      <h1>Forgot Password</h1>

      {step === 1 && (

        <>
          <input
            type="email"
            placeholder="Registered Email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
          />

          <button
  className="submit-btn"
  onClick={sendOtp}
>
  Send OTP
</button>
        </>

      )}

      {step === 2 && (

        <>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e)=>setOtp(e.target.value)}
          />

          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e)=>setNewPassword(e.target.value)}
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e)=>setConfirmPassword(e.target.value)}
          />

          <button
  className="submit-btn"
  onClick={resetPassword}
>
  Reset Password
</button>

        </>

      )}

    </div>

  );

}

export default ForgotPassword;