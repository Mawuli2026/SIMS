import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserProfile } from "../../../types/dashboard.types";
import { clearSession, getAuthToken } from "../../../utils/authSession";
import { getProfile } from "../../../services/dashboardApi";

interface ProfileDropdownProps {
  user: UserProfile;
}

const ProfileDropdown = ({ user }: ProfileDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profile, setProfile] = useState(user);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => { setProfile(user); }, [user]);

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  const handleMyProfile = async () => {
    setShowProfileModal(true);
    setIsOpen(false);
    setError("");
    const token = getAuthToken();
    if (!token) {
      setError("Your session is no longer available.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await getProfile(token);
      setProfile(response.user);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load your profile.");
    } finally {
      setIsLoading(false);
    }
  };

  const joinedDate = new Date(profile.dateJoined);
  const displayJoinedDate = Number.isNaN(joinedDate.getTime()) ? profile.dateJoined : joinedDate.toLocaleDateString();

  return (
    <div className="profile-wrapper">
      <button
        type="button"
        className="profile-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User profile"
      >
        {profile.initial}
      </button>

      {isOpen && (
        <div className="profile-dropdown">
          <div className="profile-header">
            <div className="profile-avatar">{profile.initial}</div>

            <div>
              <h4>{profile.fullName}</h4>
              <p>{profile.role}</p>
            </div>
          </div>

          <button
            type="button"
            className="profile-menu-item"
            onClick={() => void handleMyProfile()}
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
              {isLoading && <p role="status">Loading profile...</p>}
              {error && <p className="form-error" role="alert">{error}</p>}
              {!isLoading && <>
                <p><strong>Full Name:</strong> {profile.fullName}</p>
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>Role:</strong> {profile.role}</p>
                <p><strong>Date Joined:</strong> {displayJoinedDate}</p>
              </>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
