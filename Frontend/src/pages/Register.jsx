import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { FaUtensils, FaEye, FaEyeSlash } from "react-icons/fa";
import { FormRow } from "../components";
import apiClient from "../utils/apiClient";
import { useGlobalContext } from "../App";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Register = () => {
  const { setUser, setRestaurants } = useGlobalContext();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setFieldErrors({ ...fieldErrors, [name]: "" });
  };

  const validate = () => {
    const errors = {};
    if (!form.name) errors.name = "Name is required";
    if (!form.email) errors.email = "Email is required";
    else if (!emailPattern.test(form.email))
      errors.email = "Enter a valid email";
    if (!form.password) errors.password = "Password is required";
    else if (form.password.length < 6)
      errors.password = "Password must be at least 6 characters";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const errors = validate();
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      const { data: userData } = await apiClient.post("/auth/register", form);
      setUser(userData);
      setRestaurants([]);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.msg || "Something went wrong");
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

          <h2 className="form-heading">Create Account</h2>
          <form onSubmit={handleSubmit} noValidate>
            <FormRow
              type="text"
              name="name"
              value={form.name}
              handleChange={handleChange}
              placeholder="Name"
            />
            {fieldErrors.name && (
              <p className="field-error">{fieldErrors.name}</p>
            )}

            <FormRow
              type="email"
              name="email"
              value={form.email}
              handleChange={handleChange}
              placeholder="Email"
            />
            {fieldErrors.email && (
              <p className="field-error">{fieldErrors.email}</p>
            )}

            <div className="password-field">
              <label htmlFor="password">Password</label>
              <div className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Password"
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
              {fieldErrors.password && (
                <p className="field-error">{fieldErrors.password}</p>
              )}
            </div>

            {error && <p className="error-msg">{error}</p>}
            <button
              className="btn orange-btn submit-btn"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>
          <p className="switch-link">
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </Wrapper>
  );
};

export default Register;

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
    margin-top: 6px;
    margin-bottom: 4px;
  }

  .submit-btn {
    width: 100%;
    margin-top: 8px;
    padding: 12px;
  }

  .error-msg {
    color: var(--orange);
    margin-bottom: 12px;
    font-size: 14px;
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
