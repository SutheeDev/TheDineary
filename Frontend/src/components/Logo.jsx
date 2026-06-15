import styled from "styled-components";
import { useNavigate } from "react-router-dom";

const Logo = () => {
  const navigate = useNavigate();

  return <Wrapper onClick={() => navigate("/")}>The Dineary</Wrapper>;
};
export default Logo;

const Wrapper = styled.h1`
  font-size: var(--logo-size);
  color: var(--text-secondary-color);
  cursor: pointer;
`;
