import styled from "styled-components";
import { Link } from "react-router-dom";

const NavigationIcon = ({ icon, destination, label, variant }) => {
  return (
    <Wrapper $variant={variant}>
      <StyledLink to={destination}>
        <IconBox>{icon}</IconBox>
        <Label>{label}</Label>
      </StyledLink>
    </Wrapper>
  );
};
export default NavigationIcon;

const Wrapper = styled.div`
  position: relative;
  cursor: pointer;

  svg {
    color: ${(props) =>
      props.$variant === "action" ? "var(--orange)" : "var(--text-color)"};
  }
`;

const StyledLink = styled(Link)`
  display: flex;
  align-items: center;
  column-gap: 16px;
  text-decoration: none;
`;

const IconBox = styled.span`
  width: var(--nav-icon-size);
  height: var(--nav-icon-size);
  display: grid;
  place-items: center;
  font-size: 32px;
  flex-shrink: 0;
  transition: transform 0.1s ease;

  ${Wrapper}:hover & {
    transform: scale(1.05);
  }
`;

const Label = styled.span`
  font-family: var(--primary-font-light);
  font-size: 18px;
  color: var(--text-color);
  white-space: nowrap;

  /* Desktop: the label is hidden and shown as a hover tooltip beside the icon */
  @media (min-width: 1025px) {
    position: absolute;
    left: calc(var(--nav-icon-size) + 16px);
    top: 50%;
    transform: translateY(-50%);
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 14px;
    background-color: var(--text-color);
    color: var(--bg-color);
    box-shadow: var(--dropdown-shadow);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity 0.1s ease;
    z-index: 300;

    ${Wrapper}:hover & {
      opacity: 1;
      visibility: visible;
    }
  }
`;
