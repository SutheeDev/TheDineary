import styled from "styled-components";
import { NavigationIcon } from "./";

import { FiHome } from "react-icons/fi";
import { FiPlusCircle } from "react-icons/fi";

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      <Backdrop isOpen={isOpen} onClick={onClose} />
      <StyledAside isOpen={isOpen}>
        <SidebarContainer>
          <NavigationIcon icon={<FiHome />} destination="/" />
          <NavigationIcon icon={<FiPlusCircle />} destination="/create" />
        </SidebarContainer>
      </StyledAside>
    </>
  );
};
export default Sidebar;

const Backdrop = styled.div`
  display: none;

  @media (max-width: 1024px) {
    display: ${(props) => (props.isOpen ? "block" : "none")};
    position: fixed;
    inset: 0;
    background: var(--overlay);
    z-index: 100;
  }
`;

const StyledAside = styled.aside`
  @media (max-width: 1024px) {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    background-color: var(--bg-color);
    z-index: 200;
    padding-top: var(--container-padding);
    transform: translateX(${(props) => (props.isOpen ? "0" : "-100%")});
    transition: transform 0.3s ease;
  }
`;

const SidebarContainer = styled.div`
  padding-left: var(--container-padding);
  padding-right: var(--container-padding);
  display: flex;
  flex-direction: column;
  row-gap: 48px;
`;
