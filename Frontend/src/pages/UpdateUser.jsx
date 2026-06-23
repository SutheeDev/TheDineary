import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useGlobalContext } from "../App";
import { FormRow, Loading } from "../components";
import styled from "styled-components";
import apiClient from "../utils/apiClient";
import { useNavigate } from "react-router-dom";

const UpdateUser = () => {
  const { user, setUser, isLoading, setIsLoading } = useGlobalContext();

  const navigate = useNavigate();

  const initialUser = {
    name: user.name,
    lastname: user.lastname,
    email: user.email,
  };

  const [userState, setUserState] = useState(initialUser);
  const [setupUrl, setSetupUrl] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const [twoFAError, setTwoFAError] = useState("");

  const handleStartSetup = async () => {
    setTwoFAError("");
    try {
      const { data } = await apiClient.post("/auth/totp/setup");
      setSetupUrl(data.otpauthUrl);
    } catch (err) {
      setTwoFAError(err.response?.data?.msg || "Could not start setup");
    }
  };

  const handleConfirmSetup = async (e) => {
    e.preventDefault();
    setTwoFAError("");
    try {
      const { data } = await apiClient.post("/auth/totp/verify-setup", {
        token: setupCode,
      });
      setUser(data);
      setSetupUrl("");
      setSetupCode("");
    } catch (err) {
      setTwoFAError(err.response?.data?.msg || "Could not enable 2FA");
    }
  };

  const handleDisable = async () => {
    setTwoFAError("");
    try {
      const { data } = await apiClient.post("/auth/totp/disable");
      setUser(data);
    } catch (err) {
      setTwoFAError(err.response?.data?.msg || "Could not disable 2FA");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      const response = await apiClient.patch("/user", userState);
      setUser(response.data);
      navigate("/");
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CardsContainer>
      <div className="page-wrapper">
        <h1 className="heading">Profile Update</h1>
        {isLoading ? (
          <Loading />
        ) : (
          <>
          <form onSubmit={handleSubmit}>
            <div className="form-inputs">
              <FormRow
                type="text"
                name="name"
                value={userState.name}
                handleChange={(e) =>
                  setUserState({ ...userState, name: e.target.value })
                }
                placeholder="Name"
              />

              <FormRow
                type="text"
                name="lastname"
                value={userState.lastname}
                handleChange={(e) =>
                  setUserState({ ...userState, lastname: e.target.value })
                }
                labelText="last name"
                placeholder="Last Name"
              />

              <FormRow
                type="email"
                name="email"
                value={userState.email}
                handleChange={(e) =>
                  setUserState({ ...userState, email: e.target.value })
                }
                placeholder="Email"
              />

              <div className="btn-container">
                <button className="btn orange-btn" type="submit">
                  Save Profile
                </button>
                <button
                  to="/"
                  className="btn cancel-btn"
                  onClick={() => navigate("/")}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>

          <div className="twofa-section">
            <h2 className="twofa-heading">Two-Factor Authentication</h2>
            {twoFAError && <p className="twofa-error">{twoFAError}</p>}

            {user.totpEnabled ? (
              <>
                <div className="twofa-row">
                  <p className="twofa-status">2FA is currently enabled.</p>
                  <button
                    type="button"
                    className="btn cancel-btn"
                    onClick={handleDisable}
                  >
                    Disable 2FA
                  </button>
                </div>
              </>
            ) : setupUrl ? (
              <>
                <p className="twofa-status">
                  Scan this QR code with your authenticator app, then enter the
                  6-digit code to finish.
                </p>
                <div className="qr-wrapper">
                  <QRCodeSVG value={setupUrl} size={160} />
                </div>
                <form onSubmit={handleConfirmSetup}>
                  <FormRow
                    type="text"
                    name="setupCode"
                    value={setupCode}
                    handleChange={(e) => setSetupCode(e.target.value)}
                    placeholder="6-digit code"
                  />
                  <div className="btn-container">
                    <button className="btn orange-btn" type="submit">
                      Enable 2FA
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="twofa-row">
                  <p className="twofa-status">2FA is currently disabled.</p>
                  <button
                    type="button"
                    className="btn orange-btn"
                    onClick={handleStartSetup}
                  >
                    Set Up 2FA
                  </button>
                </div>
              </>
            )}
          </div>
          </>
        )}
      </div>
    </CardsContainer>
  );
};
export default UpdateUser;

const CardsContainer = styled.div`
  padding-right: var(--container-padding);
  padding-bottom: var(--container-padding);
  width: 100%;

  .btn-container {
    margin-top: 32px;
    text-align: right;
  }

  .cancel-btn {
    margin-left: 20px;
  }

  .twofa-section {
    margin-top: 40px;
    padding-top: 24px;
    border-top: 1px solid var(--bg-secondary-color);
  }

  .twofa-heading {
    font-size: 20px;
    margin-bottom: 12px;
  }

  .twofa-status {
    margin-bottom: 16px;
    font-size: 14px;
  }

  .twofa-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .twofa-row .twofa-status {
    margin-bottom: 0;
  }

  .twofa-error {
    color: var(--orange);
    margin-bottom: 12px;
    font-size: 14px;
  }

  .qr-wrapper {
    display: inline-block;
    padding: 16px;
    background-color: #fff;
    border-radius: var(--card-radius);
    margin-bottom: 16px;
  }

  @media (max-width: 1024px) {
    padding-left: var(--container-padding);
    padding-top: var(--container-padding);
  }
`;
