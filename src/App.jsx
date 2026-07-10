import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Navbar from "./components/Navbar";
import Profile
from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import GeneralInterview from "./pages/GeneralInterview";
import CompanyInterview from "./pages/CompanyInterview";
import Interview from "./pages/Interview";
import Report from "./pages/Report";
import ResumeUpload from "./pages/ResumeUpload";
import History from "./pages/History";
import ForgotPassword
from "./pages/ForgotPassword";

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <Toaster
    position="top-right"
    reverseOrder={false}
    toastOptions={{
      duration: 3000,
      style: {
        background: "#141a2e",
        color: "#f1f5f9",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: "14px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)"
      }
    }}
  />
      <BrowserRouter>
        <Navbar />

      <Routes>
        <Route
  path="/login"
  element={<Login />}
/>

<Route
  path="/register"
  element={<Register />}
/>
<Route
  path="/forgot-password"
  element={<ForgotPassword />}
/>
        <Route
  path="/"
  element={
    <ProtectedRoute>
      <Home />
    </ProtectedRoute>
  }
/>
<Route
  path="/profile"
  element={
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  }
/>
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/history"
  element={
    <ProtectedRoute>
      <History />
    </ProtectedRoute>
  }
/>

<Route
  path="/interview"
  element={
    <ProtectedRoute>
      <Interview />
    </ProtectedRoute>
  }
/>

<Route
  path="/company"
  element={
    <ProtectedRoute>
      <CompanyInterview />
    </ProtectedRoute>
  }
/>

<Route
  path="/general"
  element={
    <ProtectedRoute>
      <GeneralInterview />
    </ProtectedRoute>
  }
/>

<Route
  path="/resume"
  element={
    <ProtectedRoute>
      <ResumeUpload />
    </ProtectedRoute>
  }
/>

<Route
  path="/report"
  element={
    <ProtectedRoute>
      <Report />
    </ProtectedRoute>
  }
/>
      </Routes>
    </BrowserRouter>
  </GoogleOAuthProvider>
  );
}

export default App;