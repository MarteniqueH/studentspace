import { useState } from "react";
import "../styles/login.css";

function Login() {
  const [isSignup, setIsSignup] = useState(false);

  return (
    <div className="login-container">
      <div className={`login-card ${isSignup ? "signup" : "login"}`}>

        <h1>StudentSpace</h1>

        <p className="tagline">
          Your academic workspace starts here.
        </p>

        {isSignup && (
          <input placeholder="Full Name" />
        )}

        <input placeholder="Email" />
        <input placeholder="Password" type="password" />

        {isSignup && (
          <input placeholder="Confirm Password" type="password" />
        )}

        <button>
          {isSignup ? "Create Account" : "Log In"}
        </button>

        <p className="signup-text">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <span onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? "Log In" : "Sign Up"}
          </span>
        </p>

      </div>
    </div>
  );
}

export default Login;