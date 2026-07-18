import { useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { FaUtensils } from "react-icons/fa";
import { FormRow } from "../components";
import apiClient from "../utils/apiClient";
import { useGlobalContext } from "../App";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPassword = () => {
  const { showToast } = useGlobalContext();

  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setFieldError("(Required)");
      return;
    }
    if (!emailPattern.test(email)) {
      setFieldError("Enter a valid email");
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post("/auth/forgot-password", { email });
      setIsSent(true);
    } catch (err) {
      showToast(err.response?.data?.msg || "Something went wrong", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Wrapper>
      <div className="brand-panel">
        <FaUtensils className="brand-icon" />
        <h1 className="brand-name">The Dineary</h1>
        <p className="brand-tagline">Your pocket restaurant diary.</p>
      </div>

      <div className="form-panel">
        <div className="form-content">
          <div className="mobile-brand">
            <h1 className="brand-name">The Dineary</h1>
            <p className="brand-tagline">Your pocket restaurant diary.</p>
          </div>

          {isSent ? (
            <>
              <h2 className="form-heading">Check your email</h2>
              <p className="intro">
                If that email is registered, a reset link is on its way. The link
                expires in 1 hour.
              </p>
              <p className="switch-link">
                <Link to="/login">Back to sign in</Link>
              </p>
            </>
          ) : (
            <>
              <h2 className="form-heading">Forgot Password</h2>
              <p className="intro">
                Enter the email on your account and we will send you a link to
                choose a new password.
              </p>
              <form onSubmit={handleSubmit} noValidate>
                <FormRow
                  type="email"
                  name="email"
                  value={email}
                  handleChange={(e) => {
                    setEmail(e.target.value);
                    setFieldError("");
                  }}
                  placeholder="Email"
                  required
                  error={fieldError}
                />

                <button
                  className="btn orange-btn submit-btn"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>

              <p className="switch-link">
                Remembered it? <Link to="/login">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </Wrapper>
  );
};

export default ForgotPassword;

const Wrapper = styled.div`
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;

  .brand-panel {
    background-color: var(--orange);
    color: var(--white);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 40px;
  }

  .brand-icon {
    font-size: 56px;
    margin-bottom: 24px;
  }

  .brand-name {
    font-size: 40px;
    font-family: var(--primary-font-medium);
    margin-bottom: 12px;
  }

  .brand-tagline {
    font-size: 16px;
    opacity: 0.9;
  }

  .form-panel {
    background-color: var(--bg-color);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
  }

  .form-content {
    width: 100%;
    max-width: 400px;
  }

  .mobile-brand {
    display: none;
    text-align: center;
    margin-bottom: 32px;
  }

  .mobile-brand .brand-name {
    color: var(--orange);
    font-size: 28px;
  }

  .mobile-brand .brand-tagline {
    color: var(--text-third-color);
    font-size: 14px;
  }

  .form-heading {
    font-size: 28px;
    margin-bottom: 12px;
  }

  .intro {
    font-size: 14px;
    color: var(--text-third-color);
    margin-bottom: 24px;
    line-height: 1.5;
  }

  .submit-btn {
    width: 100%;
    margin-top: 8px;
    padding: 12px;
  }

  .switch-link {
    margin-top: 20px;
    font-size: 14px;
    text-align: center;

    a {
      color: var(--orange);
      text-decoration: none;
      font-family: var(--primary-font-medium);
    }
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;

    .brand-panel {
      display: none;
    }

    .mobile-brand {
      display: block;
    }
  }
`;
