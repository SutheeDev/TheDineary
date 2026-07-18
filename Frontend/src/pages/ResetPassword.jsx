import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import { FaUtensils, FaEye, FaEyeSlash } from "react-icons/fa";
import apiClient from "../utils/apiClient";
import { useGlobalContext } from "../App";

const ResetPassword = () => {
  const { showToast } = useGlobalContext();
  const navigate = useNavigate();
  const { token } = useParams();

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setFieldErrors({ ...fieldErrors, [name]: "" });
  };

  const validate = () => {
    const errors = {};
    if (!form.password) errors.password = "(Required)";
    else if (form.password.length < 6)
      errors.password = "At least 6 characters";
    if (!form.confirmPassword) errors.confirmPassword = "(Required)";
    else if (form.confirmPassword !== form.password)
      errors.confirmPassword = "Passwords do not match";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validate();
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post("/auth/reset-password", {
        token,
        password: form.password,
      });
      showToast("Password updated. Please sign in.", "success");
      navigate("/login");
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

          <h2 className="form-heading">Choose a New Password</h2>
          <form onSubmit={handleSubmit} noValidate>
            <div className="password-field">
              <div className="field-label-row">
                <label htmlFor="password">
                  New password
                  <span className="required-star"> *</span>
                </label>
                {fieldErrors.password && (
                  <span className="field-error">{fieldErrors.password}</span>
                )}
              </div>
              <div className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="New password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="password-field">
              <div className="field-label-row">
                <label htmlFor="confirmPassword">
                  Confirm password
                  <span className="required-star"> *</span>
                </label>
                {fieldErrors.confirmPassword && (
                  <span className="field-error">
                    {fieldErrors.confirmPassword}
                  </span>
                )}
              </div>
              <div className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  id="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                />
              </div>
            </div>

            <button
              className="btn orange-btn submit-btn"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Update Password"}
            </button>
          </form>

          <p className="switch-link">
            <Link to="/login">Back to sign in</Link>
          </p>
        </div>
      </div>
    </Wrapper>
  );
};

export default ResetPassword;

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
    margin-bottom: 28px;
  }

  .password-field {
    margin-bottom: 16px;
  }

  .field-label-row {
    display: flex;
    align-items: baseline;
    gap: 12px;
  }

  .required-star {
    color: var(--orange);
  }

  .password-input {
    position: relative;
  }

  .password-input input {
    width: 100%;
    outline: none;
    border: none;
    padding: 10.25px 40px 10.25px 10px;
    border-radius: var(--form-radius);
    background-color: var(--bg-secondary-color);
    margin-bottom: 0;
  }

  .toggle-password {
    position: absolute;
    top: 50%;
    right: 12px;
    transform: translateY(-50%);
    border: none;
    background: none;
    cursor: pointer;
    color: var(--text-third-color);
    display: flex;
    align-items: center;
  }

  .field-error {
    color: var(--orange);
    font-size: 13px;
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
