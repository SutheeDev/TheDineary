import { Navbar } from "../components";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

const Error = () => {
  const navigate = useNavigate();

  return (
    <main>
      <Navbar />
      <Content>
        <div className="error-content">
          <div className="error-msg">
            <h1>404</h1>
            <p>Page Not Found</p>
          </div>
          <div className="error-btn">
            <button
              onClick={() => navigate("/")}
              className="btn orange-btn home-btn"
            >
              Home
            </button>
          </div>
        </div>
      </Content>
    </main>
  );
};
export default Error;

const Content = styled.div`
  min-height: calc(100vh - 137px);
  background-color: var(--bg-third-color);
  padding: var(--container-padding);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  .error-content {
    margin-top: -100px;
    text-align: center;
  }

  .error-msg {
    text-align: center;
    margin-bottom: 40px;
  }

  .error-msg h1 {
    font-size: 180px;
    line-height: 0.9;
  }

  .error-msg p {
    font-size: 26px;
  }

  .home-btn {
    width: 120px;
  }
`;
