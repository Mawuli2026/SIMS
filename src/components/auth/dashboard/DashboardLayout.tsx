import { ReactNode, useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";
import { UserProfile, UserRole } from "../../../types/dashboard.types";
import "../../../styles/dashboard.css";

interface DashboardLayoutProps {
  children: ReactNode;
  user: UserProfile;
  role: UserRole;
}

const DashboardLayout = ({ children, user, role }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => (
    typeof window === "undefined" || typeof window.matchMedia !== "function"
      ? true
      : window.matchMedia("(min-width: 769px)").matches
  ));

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const desktopQuery = window.matchMedia("(min-width: 769px)");
    const handleViewportChange = (event: MediaQueryListEvent) => setIsSidebarOpen(event.matches);
    desktopQuery.addEventListener("change", handleViewportChange);
    return () => desktopQuery.removeEventListener("change", handleViewportChange);
  }, []);

  const closeMobileSidebar = () => {
    if (typeof window.matchMedia === "function" && window.matchMedia("(max-width: 768px)").matches) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="dashboard-shell">
      <Sidebar role={role} isOpen={isSidebarOpen} onNavigate={closeMobileSidebar} />
      {isSidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="dashboard-main">
        <TopNavbar
          user={user}
          onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        />

        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
