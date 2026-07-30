import { ReactNode, useState } from "react";
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="dashboard-shell">
      <Sidebar role={role} isOpen={isSidebarOpen} />

      <div className="dashboard-main">
        <TopNavbar
          user={user}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
