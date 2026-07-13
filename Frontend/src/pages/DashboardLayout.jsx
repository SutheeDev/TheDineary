import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Navbar, Sidebar } from "../components";
import styled from "styled-components";

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    let timeout;
    const handleResize = () => {
      // On desktop the drawer is a static rail, so drop any open state left over
      // from the small screen before we might return to it.
      if (window.innerWidth > 1024) setIsSidebarOpen(false);
      // Suppress the slide animation while the breakpoint switches so the drawer
      // does not flash into view and slide away.
      setIsResizing(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsResizing(false), 100);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <main>
      <Navbar onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
      <Content>
        <Sidebar
          isOpen={isSidebarOpen}
          isResizing={isResizing}
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
