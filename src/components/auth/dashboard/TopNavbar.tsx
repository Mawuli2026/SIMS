import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ProfileDropdown from "./ProfileDropdown";
import { NotificationItem, SearchResponse, UserProfile } from "../../../types/dashboard.types";
import { getNotifications, searchDashboard } from "../../../services/dashboardApi";
import { getAuthToken } from "../../../utils/authSession";
import { formatCurrency } from "../../../utils/currency";
import {
  getReadNotificationIds,
  NOTIFICATIONS_CHANGED_EVENT,
  saveReadNotificationIds,
} from "../../../utils/notificationReadState";

interface TopNavbarProps {
  user: UserProfile;
  onToggleSidebar: () => void;
}

type SearchResults = SearchResponse["results"];

const TopNavbar = ({ user, onToggleSidebar }: TopNavbarProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [searchMessage, setSearchMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [notificationError, setNotificationError] = useState("");
  const notificationWrapperRef = useRef<HTMLDivElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);

  const loadNotifications = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await getNotifications(token);
      const currentIds = new Set(response.notifications.map((notification) => notification.id));
      // Remove IDs that are no longer returned so a future occurrence can be
      // treated as new instead of leaving the browser's read list unbounded.
      const retainedReadIds = getReadNotificationIds(user.id).filter((id) => currentIds.has(id));
      setNotifications(response.notifications);
      setReadNotificationIds(saveReadNotificationIds(user.id, retainedReadIds));
      setNotificationError("");
    } catch (error) {
      setNotificationError(error instanceof Error ? error.message : "Unable to load notifications.");
    }
  }, [user.id]);

  useEffect(() => {
    void loadNotifications();
    const refreshNotifications = () => void loadNotifications();
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, refreshNotifications);
    window.addEventListener("focus", refreshNotifications);
    return () => {
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, refreshNotifications);
      window.removeEventListener("focus", refreshNotifications);
    };
  }, [loadNotifications]);

  useEffect(() => {
    if (!showNotifications) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (notificationWrapperRef.current && !notificationWrapperRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setShowNotifications(false);
      notificationButtonRef.current?.focus();
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showNotifications]);

  const unreadNotificationCount = notifications.filter(
    (notification) => !readNotificationIds.includes(notification.id),
  ).length;

  useEffect(() => {
    if (!showNotifications || notifications.length === 0) return;

    // Anything visible in the open panel has been presented to the user, even
    // when the API response arrived just after the bell was selected.
    const readIds = saveReadNotificationIds(user.id, notifications.map((notification) => notification.id));
    setReadNotificationIds(readIds);
  }, [notifications, showNotifications, user.id]);

  const toggleNotifications = () => setShowNotifications((isOpen) => !isOpen);

  const closeSearch = () => {
    setSearchResults(null);
    setSearchMessage("");
  };

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = searchTerm.trim();
    if (!term) {
      closeSearch();
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setSearchMessage("Your session is no longer available.");
      return;
    }

    setIsSearching(true);
    setSearchMessage("");
    try {
      const response = await searchDashboard(token, term);
      setSearchResults(response.results);
      const count = response.results.products.length + response.results.sales.length + response.results.receipts.length;
      setSearchMessage(count ? `${count} match${count === 1 ? "" : "es"} for “${response.query}”` : `No matches for “${response.query}”`);
    } catch (error) {
      setSearchResults(null);
      setSearchMessage(error instanceof Error ? error.message : "Unable to search SIMS.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <button type="button" className="menu-button" onClick={onToggleSidebar} aria-label="Toggle sidebar">☰</button>

        <form className="search-form" onSubmit={(event) => void handleSearch(event)}>
          <input type="text" placeholder="Search products, sales records, receipts..." value={searchTerm}
            onChange={(event) => { setSearchTerm(event.target.value); closeSearch(); }}
            aria-label="Search products, sales records, and receipts" />

          {(isSearching || searchMessage) && <div className="search-feedback" role="status">
            <strong>{isSearching ? "Searching..." : searchMessage}</strong>
            {!isSearching && searchResults && <div className="search-result-groups">
              {searchResults.products.map((product) => <Link key={`product-${product.id}`} to="/dashboard/products" onClick={closeSearch}>
                <span>{product.name}</span><small>{formatCurrency(product.sellingPrice)} · {product.quantityInStock} in stock</small>
              </Link>)}
              {searchResults.sales.map((sale) => <Link key={`sale-${sale.saleId}`} to="/dashboard/sales-history" onClick={closeSearch}>
                <span>Sale #{sale.saleId} · {sale.cashierName}</span><small>{formatCurrency(sale.totalAmount)}</small>
              </Link>)}
              {searchResults.receipts.map((receipt) => <Link key={`receipt-${receipt.saleId}`} to={`/dashboard/receipts/${receipt.saleId}`} onClick={closeSearch}>
                <span>Receipt for sale #{receipt.saleId}</span><small>{formatCurrency(receipt.totalAmount)}</small>
              </Link>)}
            </div>}
          </div>}
        </form>
      </div>

      <div className="navbar-right">
        <div className="notification-wrapper" ref={notificationWrapperRef}>
          <button
            ref={notificationButtonRef}
            type="button"
            className="notification-button"
            onClick={toggleNotifications}
            aria-label={unreadNotificationCount ? `Notifications, ${unreadNotificationCount} unread` : "Notifications"}
            aria-haspopup="true"
            aria-expanded={showNotifications}
            aria-controls="notification-panel"
          >
            🔔
            {unreadNotificationCount > 0 && <span className="notification-count" aria-hidden="true">{unreadNotificationCount}</span>}
          </button>

          {showNotifications && <div className="notification-dropdown" id="notification-panel" aria-label="Notification list">
            <h4>Notifications</h4>
            {notificationError && <p className="form-error" role="alert">{notificationError}</p>}
            {!notificationError && notifications.length === 0 && <p className="empty-message">No notifications available.</p>}
            {notifications.map((item) => <div key={item.id} className="notification-item">
              <p>{item.message}</p><small>{new Date(item.createdAt).toLocaleString()}</small>
            </div>)}
          </div>}
        </div>

        <ProfileDropdown user={user} />
      </div>
    </header>
  );
};

export default TopNavbar;
