import styled from "styled-components";
import { NavigationIcon } from "./";

import { FiHome } from "react-icons/fi";
import { FiPlusCircle } from "react-icons/fi";
import { FiMap } from "react-icons/fi";
import { FiAward } from "react-icons/fi";
import { FiCalendar } from "react-icons/fi";
import { FiBarChart2 } from "react-icons/fi";

const Sidebar = ({ isOpen, isResizing, onClose }) => {
  return (
    <>
      <Backdrop $isOpen={isOpen} onClick={onClose} />
      <StyledAside $isOpen={isOpen} $isResizing={isResizing}>
        <SidebarContainer>
          <NavigationIcon icon={<FiHome />} destination="/" label="Home" />
          <NavigationIcon icon={<FiMap />} destination="/map" label="Map" />
          <NavigationIcon
            icon={<FiCalendar />}
            destination="/calendar"
            label="Calendar"
          />
          <NavigationIcon
            icon={<FiAward />}
            destination="/ranking"
            label="Ranking"
          />
          <NavigationIcon
            icon={<FiBarChart2 />}
            destination="/dashboard"
            label="Dashboard"
          />
          <Separator />
          <NavigationIcon
            icon={<FiPlusCircle />}
            destination="/create"
            label="Create Entry"
            variant="action"
          />
        </SidebarContainer>
      </StyledAside>
    </>
  );
};
export default Sidebar;

const Backdrop = styled.div`
  display: none;

  @media (max-width: 1024px) {
    display: ${(props) => (props.$isOpen ? "block" : "none")};
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
    width: 280px;
    height: 100vh;
    background-color: var(--bg-color);
    z-index: 200;
    padding-top: var(--container-padding);
    transform: translateX(${(props) => (props.$isOpen ? "0" : "-100%")});
    transition: ${(props) =>
      props.$isResizing ? "none" : "transform 0.3s ease"};
  }
`;

const SidebarContainer = styled.div`
  padding-left: var(--container-padding);
  padding-right: var(--container-padding);
  display: flex;
  flex-direction: column;
  row-gap: 48px;
`;

const Separator = styled.div`
  width: var(--nav-icon-size);
  height: 1px;
  background-color: var(--gray-400);
`;
