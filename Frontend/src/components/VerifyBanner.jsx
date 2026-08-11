import { useState } from "react";
import styled from "styled-components";
import { FaEnvelope } from "react-icons/fa";
import apiClient from "../utils/apiClient";
import { useGlobalContext } from "../App";

const VerifyBanner = () => {
  const { user, showToast } = useGlobalContext();
  const [isLoading, setIsLoading] = useState(false);

  if (!user || user.isVerified) return null;

  const handleResend = async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.post("/auth/resend-verification");
      showToast(data.msg, "success");
    } catch (err) {
      showToast(
        err.response?.data?.msg || "Could not send the email. Try again later.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Wrapper>
      <FaEnvelope className="banner-icon" />
      <p>
        Please confirm your email address. We sent a link to{" "}
        <strong>{user.email}</strong>.
      </p>
      <button type="button" onClick={handleResend} disabled={isLoading}>
        {isLoading ? "Sending..." : "Resend email"}
      </button>
    </Wrapper>
  );
};

export default VerifyBanner;

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 20px;
  background-color: var(--orange);
  color: var(--white);
  font-size: 14px;

  .banner-icon {
    font-size: 16px;
  }

  button {
    border: 1px solid var(--white);
    background: none;
    color: var(--white);
    padding: 5px 14px;
    border-radius: var(--form-radius);
    cursor: pointer;
    font-size: 13px;
  }

  button:disabled {
    opacity: 0.6;
    cursor: default;
  }

  @media (max-width: 600px) {
    text-align: center;
    font-size: 13px;
  }
`;
