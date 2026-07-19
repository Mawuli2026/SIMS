import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserProfile } from "../../../types/dashboard.types";

interface ProfileDropdownProps {
  user: UserProfile;
}

const ProfileDropdown = ({ user }: ProfileDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("sims-auth-user");
    navigate("/login", { replace: true });
  };

  return (
    <div className="profile-wrapper">
      <button
        type="button"
        className="profile-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User profile"
      >
        {user.initial}
      </button>

      {isOpen && (
        <div className="profile-dropdown">
          <div className="profile-header">
            <div className="profile-avatar">{user.initial}</div>

            <div>
              <h4>{user.fullName}</h4>
              <p>{user.role}</p>
            </div>
          </div>

          <button
            type="button"
            className="profile-menu-item"
            onClick={() => {
              setShowProfileModal(true);
              setIsOpen(false);
            }}
          >
            My Profile
          </button>

          <button
            type="button"
            className="profile-menu-item logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      )}

      {showProfileModal && (
        <div className="modal-backdrop">
          <div className="profile-modal">
            <div className="modal-header">
              <h3>My Profile</h3>

              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                aria-label="Close profile modal"
              >
                ×
              </button>
            </div>

            <div className="profile-details">
              <p>
                <strong>Full Name:</strong> {user.fullName}
              </p>

              <p>
                <strong>Email:</strong> {user.email}
              </p>

              <p>
                <strong>Role:</strong> {user.role}
              </p>

              <p>
                <strong>Date Joined:</strong> {user.dateJoined}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
