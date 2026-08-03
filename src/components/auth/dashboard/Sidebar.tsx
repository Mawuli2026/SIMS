import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { UserRole, SidebarItem } from "../../../types/dashboard.types";
import { getSidebar } from "../../../services/dashboardApi";
import { getAuthToken } from "../../../utils/authSession";

interface SidebarProps { role: UserRole; isOpen: boolean; }

const adminItems: SidebarItem[] = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Products", path: "/dashboard/products" },
  { label: "Sales", path: "/dashboard/sales" },
  { label: "Sales History", path: "/dashboard/sales-history" },
  { label: "Reports", path: "/dashboard/reports" },
  { label: "Low Stock", path: "/dashboard/low-stock" },
];

const cashierItems: SidebarItem[] = [
  { label: "Record Sales", path: "/dashboard/sales" },
  { label: "Sales History", path: "/dashboard/sales-history" },
];

const Sidebar = ({ role, isOpen }: SidebarProps) => {
  const fallbackItems = role === "Admin" ? adminItems : cashierItems;
  const [menuItems, setMenuItems] = useState<SidebarItem[]>(fallbackItems);

  useEffect(() => {
    setMenuItems(fallbackItems);
    const token = getAuthToken();
    if (!token) return;

    let active = true;
    getSidebar(token).then((response) => {
      if (active && response.role === role && response.menuItems.length > 0) {
        setMenuItems(response.menuItems);
      }
    }).catch(() => {
      // Keep the role-safe local navigation when the API is temporarily unavailable.
    });

    return () => { active = false; };
  }, [role]);

  return (
    <aside className={`sidebar ${isOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <div className="sidebar-logo">
        <div className="logo-box">
          <img src="/sims-logo.png" alt="SIMS logo" />
        </div>
        {isOpen && <div><h2>SIMS</h2><p>Sales &amp; Inventory</p></div>}
      </div>
      <nav className="sidebar-nav" aria-label={`${role} navigation`}>
        {menuItems.map((item) => (
          <NavLink key={item.path} to={item.path} end={item.path === "/dashboard"}
            className={({ isActive }) => `sidebar-link${isActive ? " sidebar-link-active" : ""}`}
            title={!isOpen ? item.label : undefined}>
            <span className="sidebar-dot" aria-hidden="true" />
            {isOpen && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
