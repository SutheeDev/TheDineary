import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Navbar, Sidebar } from "../components";
import styled from "styled-components";

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  return (
    <main>
      <Navbar onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
      <Content>
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <Outlet />
      </Content>
    </main>
  );
};
export default DashboardLayout;

const Content = styled.div`
  display: flex;
  min-height: calc(100vh - 137px);

  @media (max-width: 1024px) {
    display: block;
  }
`;
