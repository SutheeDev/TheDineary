import { Logo, UserIcon } from "../components/index";
import styled from "styled-components";
import { FiMenu } from "react-icons/fi";

const Navbar = ({ onToggleSidebar }) => {
  return (
    <nav>
      <NavContainer>
        {onToggleSidebar && (
          <HamburgerBtn onClick={onToggleSidebar} aria-label="Toggle menu">
            <FiMenu />
          </HamburgerBtn>
        )}
        <Logo />
        <UserIcon />
      </NavContainer>
    </nav>
  );
};
export default Navbar;

const NavContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--container-padding);

  @media (min-width: 1025px) {
    padding-right: max(var(--container-padding), calc(50vw - 628px));
  }
`;

const HamburgerBtn = styled.button`
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 24px;
  color: var(--text-color);
  padding: 4px;
  line-height: 0;

  @media (max-width: 1024px) {
    display: flex;
    align-items: center;
  }
`;
