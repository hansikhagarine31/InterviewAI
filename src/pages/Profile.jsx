import { useEffect, useState } from "react";
import api from "../api/client";
import toast from "react-hot-toast";
function Profile() {

    const user =
    JSON.parse(
      localStorage.getItem("user")
    );
  const [stats, setStats] =
    useState(null);
    const [showUsernameModal, setShowUsernameModal] = useState(false);
const [showPasswordModal, setShowPasswordModal] =
  useState(false);

const [currentPassword, setCurrentPassword] =
  useState("");

const [newPassword, setNewPassword] =
  useState("");

const [confirmPassword, setConfirmPassword] =
  useState("");
const [newUsername, setNewUsername] = useState(user.name);
const [passwordMessage, setPasswordMessage] =
  useState("");

const [passwordMessageColor, setPasswordMessageColor] =
  useState("red");

  useEffect(() => {

    const fetchProfile =
      async () => {

        try {

          const res =
            await api.get(
              `/profile/${user.id}`
            );

          setStats(res.data);


        } catch (err) {

          console.log(err);

        }
      };

    fetchProfile();

  }, []);

const saveUsername = async () => {

  if (
    newUsername.trim().length < 3
  ) {

    toast.error("Username must contain at least 3 characters.");

    return;
  }

  try {

    await api.put(
      "/change-username",
      {
        user_id: user.id,
        username: newUsername
      }
    );

    const updatedUser = {
      ...user,
      name: newUsername
    };

    localStorage.setItem(
      "user",
      JSON.stringify(updatedUser)
    );

    setShowUsernameModal(false);

    window.location.reload();

  } catch (err) {

    console.log(err);

    toast.error("Unable to update username.");
      

  }

};
const changePassword = async () => {

  if (
    newPassword !== confirmPassword
  ) {

    toast.error("Passwords do not match.");
      

    return;

  }

  try {

    await api.put(
      "/change-password",
      {

        user_id: user.id,

        current_password:
          currentPassword,

        new_password:
          newPassword

      }
    );

    setPasswordMessageColor("limegreen");

setPasswordMessage(
  "Password updated successfully!"
);

    setCurrentPassword("");

    setNewPassword("");

    setConfirmPassword("");

    setShowPasswordModal(false);

  } catch (err) {

  setPasswordMessageColor("red");

  setPasswordMessage(

    err.response?.data?.error ||

    "Unable to change password."

  );

}

};
  return (
    <div className="container fade-in">

      <h1>
        My Profile
      </h1>
        <div
  style={{
    textAlign: "center",
    marginBottom: "30px"
  }}
>

  <div
    style={{
      width: "120px",
      height: "120px",
      borderRadius: "50%",
      background:
        "linear-gradient(135deg,#3b82f6,#06b6d4)",
      margin: "auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "50px",
      fontWeight: "bold"
    }}
  >
    {newUsername[0]}
  </div>

  

</div>
      <div className="question-box">

        <h2>
          👤 {newUsername}
        </h2>

        <p>
          📧 {user.email}
        </p>
    <div
  style={{
    marginTop: "25px",
    display: "flex",
    justifyContent: "center",
    gap: "15px",
    flexWrap: "wrap"
  }}
>

  <button
  className="submit-btn"
  onClick={() => setShowUsernameModal(true)}
>
  ✏️ Change Username
</button>

  <button
  className="submit-btn"
  onClick={() => {

  setPasswordMessage("");

  setCurrentPassword("");

  setNewPassword("");

  setConfirmPassword("");

  setShowPasswordModal(true);

}}
>
  🔒 Change Password
</button>

</div>
    <p>

    Level:

    {
      stats?.total >= 20
        ? " Expert"
        : stats?.total >= 10
        ? " Advanced"
        : stats?.total >= 5
        ? " Intermediate"
        : " Beginner"
    }

  </p>

      </div>

      {
        stats && (

          <div className="dashboard-grid">

            <div className="dashboard-card">
              <h2>
                {stats.total}
              </h2>
              <p>
                Interviews
              </p>
            </div>

            <div className="dashboard-card">
              <h2>
                {stats.best}
              </h2>
              <p>
                Best Score
              </p>
            </div>

            <div className="dashboard-card">
              <h2>
                {stats.average}
              </h2>
              <p>
                Average Score
              </p>
            </div>

          </div>

        )
      }
      {stats && (

<div className="skills-section">

  <h2>
    🏆 Achievements
  </h2>

  {stats.total >= 1 && (
    <div className="question-box">
      🎯 First Interview Completed
    </div>
  )}

  {stats.total >= 5 && (
    <div className="question-box">
      🔥 5 Interviews Completed
    </div>
  )}

  {stats.best >= 80 && (
    <div className="question-box">
      ⭐ Score Above 80
    </div>
  )}

  {stats.best >= 90 && (
    <div className="question-box">
      🥇 Score Above 90
    </div>
  )}

</div>

)}
{showUsernameModal && (

<div className="modal-overlay">

  <div className="modal-box">

    <h2>
      Change Username
    </h2>

    <input
      type="text"
      value={newUsername}
      onChange={(e) =>
        setNewUsername(e.target.value)
      }
      placeholder="New Username"
    />

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginTop: "20px"
      }}
    >

      <button
        className="submit-btn"
        onClick={() =>
          setShowUsernameModal(false)
        }
      >
        Cancel
      </button>

      <button
        className="submit-btn"
        onClick={saveUsername}
      >
        Save
      </button>

    </div>

  </div>

</div>

)}
{showPasswordModal && (

<div className="modal-overlay">

  <div className="modal-box">

    <h2>
      🔒 Change Password
    </h2>

    <input
      type="password"
      placeholder="Current Password"
      value={currentPassword}
      onChange={(e)=>
        setCurrentPassword(e.target.value)
      }
    />

    <input
      type="password"
      placeholder="New Password"
      value={newPassword}
      onChange={(e)=>
        setNewPassword(e.target.value)
      }
    />

    <input
      type="password"
      placeholder="Confirm Password"
      value={confirmPassword}
      onChange={(e)=>
        setConfirmPassword(e.target.value)
      }
    />

      {passwordMessage && (

<p
  style={{
    color: passwordMessageColor,
    marginTop: "10px",
    fontWeight: "600"
  }}
>
  {passwordMessage}
</p>

)}
    <p
      style={{
        fontSize:"14px",
        opacity:.8,
        marginTop:"15px"
      }}
    >
      Password must contain:
      <br/>
      • Minimum 8 characters
      <br/>
      • One uppercase letter
      <br/>
      • One lowercase letter
      <br/>
      • One number
    </p>

    <div
      style={{
        display:"flex",
        justifyContent:"space-between",
        marginTop:"20px"
      }}
    >

      <button
        className="submit-btn"
        onClick={()=>
          setShowPasswordModal(false)
        }
      >
        Cancel
      </button>

      <button
        className="submit-btn"
        onClick={changePassword}
      >
        Change
      </button>

    </div>

  </div>

</div>

)}
    </div>
  );
}

export default Profile;