import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { FormRow } from "../components";
import apiClient from "../utils/apiClient";
import { useGlobalContext } from "../App";

const Login = () => {
  const { setUser, setRestaurants } = useGlobalContext();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data: userData } = await apiClient.post("/auth/login", form);
      setUser(userData);
      const { data: restaurantsData } = await apiClient.get("/restaurants");
      setRestaurants(restaurantsData);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.msg || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Wrapper>
      <div className="form-card">
        <h1>Sign In</h1>
        <form onSubmit={handleSubmit}>
          <FormRow
            type="email"
            name="email"
            value={form.email}
            handleChange={handleChange}
            placeholder="Email"
          />
          <FormRow
            type="password"
            name="password"
            value={form.password}
            handleChange={handleChange}
            placeholder="Password"
          />
          {error && <p className="error-msg">{error}</p>}
          <button className="btn orange-btn submit-btn" type="submit" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="switch-link">
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </Wrapper>
  );
};

export default Login;

const Wrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-color);

  .form-card {
    width: 100%;
    max-width: 400px;
    padding: 40px;
    border-radius: var(--card-radius);
    background-color: var(--bg-secondary-color);

    h1 {
      font-size: 28px;
      margin-bottom: 28px;
    }
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
`;
