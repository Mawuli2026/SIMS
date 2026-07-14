import { NavLink } from "react-router-dom";
import {
  HiHome,
  HiCube,
  HiCollection,
  HiTruck,
  HiClipboardList,
  HiCash,
  HiChartBar,
  HiUser,
  HiLogout,
  HiArchive,
  HiUserGroup,
  HiDocumentReport,
} from "react-icons/hi";

type UserRole = "admin" | "cashier";

// TODO: Replace with authenticated user later
const role: UserRole = "admin";

const adminMenu = [
  {
    name: "Dashboard",
    icon: <HiHome className="h-5 w-5" />,
    path: "/dashboard",
  },
  {
    name: "Products",
    icon: <HiCube className="h-5 w-5" />,
    path: "/products",
  },
  {
    name: "Categories",
    icon: <HiCollection className="h-5 w-5" />,
    path: "/categories",
  },
  {
    name: "Suppliers",
    icon: <HiTruck className="h-5 w-5" />,
    path: "/suppliers",
  },
  {
    name: "Customers",
    icon: <HiUserGroup className="h-5 w-5" />,
    path: "/customers",
  },
  {
    name: "Customer Dashboard",
    icon: <HiUserGroup className="h-5 w-5" />,
    path: "/customers/dashboard",
  },
  {
    name: "Customer Reports",
    icon: <HiDocumentReport className="h-5 w-5" />,
    path: "/customers/reports",
  },
  {
    name: "Inventory",
    icon: <HiArchive className="h-5 w-5" />,
    path: "/inventory",
  },
  {
    name: "Purchase Orders",
    icon: <HiClipboardList className="h-5 w-5" />,
    path: "/purchase-orders",
  },
  {
    name: "Sales",
    icon: <HiCash className="h-5 w-5" />,
    path: "/sales",
  },
  {
    name: "Sales History",
    icon: <HiClipboardList className="h-5 w-5" />,
    path: "/sales/history",
  },
  {
    name: "Reports",
    icon: <HiChartBar className="h-5 w-5" />,
    path: "/reports",
  },
  {
    name: "Audit Logs",
    icon: <HiClipboardList className="h-5 w-5" />,
    path: "/admin/audit-logs",
  },
  {
    name: "Profile",
    icon: <HiUser className="h-5 w-5" />,
    path: "/profile",
  },
];

const cashierMenu = [
  {
    name: "Dashboard",
    icon: <HiHome className="h-5 w-5" />,
    path: "/dashboard",
  },
  {
    name: "Sales",
    icon: <HiCash className="h-5 w-5" />,
    path: "/sales",
  },
  {
    name: "Sales History",
    icon: <HiClipboardList className="h-5 w-5" />,
    path: "/sales/history",
  },
  {
    name: "Reports",
    icon: <HiChartBar className="h-5 w-5" />,
    path: "/reports",
  },
  {
    name: "Profile",
    icon: <HiUser className="h-5 w-5" />,
    path: "/profile",
  },
];

const Sidebar = () => {
  const menu = role === "admin" ? adminMenu : cashierMenu;

  return (
    <aside className="hidden md:flex w-72 bg-slate-800 text-white flex-col shadow-lg">
      {/* Logo */}
      <div className="border-b border-slate-700 px-6 py-6">
        <h1 className="text-xl font-bold">Sales & Inventory</h1>
        <p className="text-sm text-slate-400 mt-1">Management System</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menu.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-4 py-3 transition ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`
            }
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Information */}
      <div className="border-t border-slate-700 p-5">
        <div className="mb-4">
          <p className="font-semibold">Admin</p>
          <p className="text-sm text-slate-400 capitalize">{role}</p>
        </div>

        <button
          className="
          flex
          w-full
          items-center
          gap-3
          rounded-lg
          bg-red-600
          px-4
          py-3
          transition
          hover:bg-red-700
          "
        >
          <HiLogout className="h-6 w-6" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;