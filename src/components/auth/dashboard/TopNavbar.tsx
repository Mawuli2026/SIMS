import { FormEvent, useState } from "react";
import ProfileDropdown from "./ProfileDropdown";
import { NotificationItem, UserProfile } from "../../../types/dashboard.types";

interface TopNavbarProps {
  user: UserProfile;
  onToggleSidebar: () => void;
}

const TopNavbar = ({ user, onToggleSidebar }: TopNavbarProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");

  const notifications: NotificationItem[] = [
    {
      id: 1,
      type: "low_stock",
      message: "Sugar is low in stock.",
      createdAt: "Today",
    },
    {
      id: 2,
      type: "sale_completed",
      message: "A new sale was completed successfully.",
      createdAt: "Today",
    },
    {
      id: 3,
      type: "system",
      message: "System backup completed.",
      createdAt: "Today",
    },
  ];

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!searchTerm.trim()) {
      setSearchMessage("");
      return;
    }
    setSearchMessage(`Showing matches for “${searchTerm.trim()}”`);
  };

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <button
          type="button"
          className="menu-button"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          ☰
        </button>

        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search products, sales records, receipts..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            aria-label="Search products, sales records, and receipts"
          />
          {searchMessage && <div className="search-feedback" role="status">{searchMessage}</div>}
        </form>
      </div>

      <div className="navbar-right">
        <div className="notification-wrapper">
          <button
            type="button"
            className="notification-button"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            🔔
            {notifications.length > 0 && (
              <span className="notification-count">
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <h4>Notifications</h4>

              {notifications.length === 0 ? (
                <p className="empty-message">No notifications available.</p>
              ) : (
                notifications.map((item) => (
                  <div key={item.id} className="notification-item">
                    <p>{item.message}</p>
                    <small>{item.createdAt}</small>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <ProfileDropdown user={user} />
      </div>
    </header>
  );
};

export default TopNavbar;
