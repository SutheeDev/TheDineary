import styled from "styled-components";
import { Link } from "react-router-dom";

const NavigationIcon = ({ icon, destination }) => {
  return (
    <Wrapper>
      <Link to={destination}>{icon}</Link>
    </Wrapper>
  );
};
export default NavigationIcon;

const Wrapper = styled.div`
  width: var(--nav-icon-size);
  height: var(--nav-icon-size);
  display: grid;
  place-items: center;
  font-size: 32px;
  cursor: pointer;

  transition: all 0.1s ease;

  &:hover {
    transform: scale(1.05);
  }

  svg {
    color: var(--text-color);
  }
`;
