import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProfileDropdown from "./ProfileDropdown";
import { NotificationItem, SearchResponse, UserProfile } from "../../../types/dashboard.types";
import { getNotifications, searchDashboard } from "../../../services/dashboardApi";
import { getAuthToken } from "../../../utils/authSession";
import { formatCurrency } from "../../../utils/currency";

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
  const [notificationError, setNotificationError] = useState("");

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    let active = true;
    getNotifications(token).then((response) => {
      if (active) setNotifications(response.notifications);
    }).catch((error) => {
      if (active) setNotificationError(error instanceof Error ? error.message : "Unable to load notifications.");
    });
    return () => { active = false; };
  }, []);

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
        <div className="notification-wrapper">
          <button type="button" className="notification-button" onClick={() => setShowNotifications(!showNotifications)} aria-label="Notifications">
            🔔
            {notifications.length > 0 && <span className="notification-count">{notifications.length}</span>}
          </button>

          {showNotifications && <div className="notification-dropdown">
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
