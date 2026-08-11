import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import styled from "styled-components";
import { FaUtensils, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import apiClient from "../utils/apiClient";
import { useGlobalContext } from "../App";

const VerifyEmail = () => {
  const { user, setUser, isAuthChecked } = useGlobalContext();
  const { token } = useParams();

  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState("");
  // The link is single-use, so StrictMode's double-mount in development would
  // spend the token on the first call and report the second as invalid.
  const hasRun = useRef(false);

  useEffect(() => {
    // Wait for the app's own /auth/me call to land first. Verifying before it
    // resolves would let that call overwrite the user this page just refreshed,
    // leaving the banner up for someone who has in fact verified.
    if (!isAuthChecked || hasRun.current) return;
    hasRun.current = true;

    const verify = async () => {
      try {
        const { data } = await apiClient.post("/auth/verify-email", { token });
        setStatus("success");
        // Clears the banner without a reload for anyone already signed in.
        if (user) setUser(data);
      } catch (err) {
        setStatus("error");
        setMessage(
          err.response?.data?.msg || "This link is invalid or has expired"
        );
      }
    };

    verify();
  }, [token, user, setUser, isAuthChecked]);

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

          {status === "checking" && (
            <>
              <h2 className="form-heading">Confirming your email...</h2>
              <p className="status-text">One moment.</p>
            </>
          )}

          {status === "success" && (
            <>
              <FaCheckCircle className="status-icon success" />
              <h2 className="form-heading">Email Confirmed</h2>
              <p className="status-text">
                Thanks. Your email address is now confirmed.
              </p>
              <p className="switch-link">
                <Link to={user ? "/" : "/login"}>
                  {user ? "Back to the app" : "Go to sign in"}
                </Link>
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <FaTimesCircle className="status-icon error" />
              <h2 className="form-heading">Link Not Valid</h2>
              <p className="status-text">{message}</p>
              <p className="status-text small">
                Sign in and use the &quot;Resend email&quot; button to get a new
                link.
              </p>
              <p className="switch-link">
                <Link to={user ? "/" : "/login"}>
                  {user ? "Back to the app" : "Go to sign in"}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </Wrapper>
  );
};

export default VerifyEmail;

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
    text-align: center;
  }

  .mobile-brand {
    display: none;
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

  .status-icon {
    font-size: 48px;
    margin-bottom: 20px;
  }

  .status-icon.success {
    color: var(--orange);
  }

  .status-icon.error {
    color: var(--text-third-color);
  }

  .form-heading {
    font-size: 28px;
    margin-bottom: 16px;
  }

  .status-text {
    color: var(--text-third-color);
    font-size: 15px;
    margin-bottom: 8px;
  }

  .status-text.small {
    font-size: 13px;
  }

  .switch-link {
    margin-top: 24px;
    font-size: 14px;

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
